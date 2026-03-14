"use client";

/**
 * useCustomRealtime
 * Drop-in replacement for @decartai/sdk's useDecartRealtime.
 *
 * Architecture:
 *   Browser  ──[WebRTC video track]──►  GPU server  (camera frames in)
 *   Browser  ◄─[WebRTC video track]──  GPU server  (processed frames out)
 *   Browser  ──[HTTP POST /api/garment]──► GPU server  (garment image + prompt)
 *
 * The hook interface is intentionally identical to useDecartRealtime so
 * TryOnModal.tsx needs only a one-line import change.
 */

import { useState, useCallback, useRef } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "generating"
  | "reconnecting"
  | "disconnected"
  | "error";

interface ConnectOptions {
  apiKey: string;        // kept for interface compatibility — not used here
  stream: MediaStream;
  prompt?: string;
  onRemoteStream: (stream: MediaStream) => void;
}

export interface RealtimeClient {
  setImage: (blob: Blob, options: { prompt: string; enhance: boolean }) => void;
  disconnect: () => void;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useCustomRealtime() {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // clientRef mirrors the Decart SDK shape so TryOnModal.tsx compiles unchanged
  const clientRef = useRef<RealtimeClient | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // ── connect ──────────────────────────────────────────────────────────────
  const connect = useCallback(
    async (options: ConnectOptions): Promise<RealtimeClient | null> => {
      const { stream, onRemoteStream } = options;
      setStatus("connecting");
      setError(null);

      try {
        // 1. Create peer connection (STUN for NAT traversal on LAN still helps)
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        pcRef.current = pc;

        // 2. Push outbound camera tracks to GPU server
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // 3. Receive inbound processed-video track from GPU server
        const remoteStream = new MediaStream();
        pc.ontrack = (event) => {
          event.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
          onRemoteStream(remoteStream);
          // "generating" = we have video coming back → show live feed
          setStatus("generating");
        };

        // 4. Mirror connection-state changes into our status enum
        pc.onconnectionstatechange = () => {
          switch (pc.connectionState) {
            case "connected":
              setStatus("connected");
              break;
            case "disconnected":
              setStatus("reconnecting");
              break;
            case "failed":
              setStatus("error");
              setError("WebRTC connection failed — check GPU server is running");
              break;
            case "closed":
              setStatus("disconnected");
              break;
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === "failed") {
            setError("ICE negotiation failed — are you on the same network?");
            setStatus("error");
          }
        };

        // 5. Create SDP offer, wait for ICE candidates to be gathered
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await waitForIceGathering(pc);

        // 6. Send offer to Next.js signaling proxy → GPU server /offer
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sdp: pc.localDescription }),
        });

        if (!res.ok) {
          throw new Error(
            `Signaling failed (${res.status}): is the GPU server running at GPU_SERVER_URL?`
          );
        }

        // 7. GPU server returns SDP answer + a session ID for subsequent garment updates
        const { sdp: answerSdp, session_id } = await res.json();
        sessionIdRef.current = session_id;
        await pc.setRemoteDescription(new RTCSessionDescription(answerSdp));

        // 8. Build the client object — same shape as Decart's RealtimeClient
        const client: RealtimeClient = {
          setImage: (blob, opts) => {
            if (!sessionIdRef.current) {
              console.warn("[RealTime] No session ID yet — skipping setImage");
              return;
            }
            sendGarment(sessionIdRef.current, blob, opts.prompt);
          },
          disconnect: () => {
            pc.close();
            setStatus("disconnected");
          },
        };

        clientRef.current = client;
        return client;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unknown connection error";
        console.error("[useCustomRealtime] connect error:", err);
        setError(msg);
        setStatus("error");
        return null;
      }
    },
    []
  );

  // ── disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    clientRef.current = null;
    sessionIdRef.current = null;
    setStatus("disconnected");
  }, []);

  return { status, error, connect, disconnect, clientRef };
}

// ── Internal helpers ───────────────────────────────────────────────────────

/**
 * Wait until ICE gathering is complete before sending the SDP offer.
 * This bundles all ICE candidates into the offer (Vanilla ICE / trickle-off),
 * which is simpler than implementing trickle-ICE and works fine on LAN.
 *
 * Hard-caps at 3 s so a network issue doesn't stall the UI forever.
 */
function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") {
      resolve();
      return;
    }

    const onchange = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", onchange);
        resolve();
      }
    };

    pc.addEventListener("icegatheringstatechange", onchange);
    // Fallback: don't wait more than 3 s even if gathering isn't "complete"
    setTimeout(resolve, 3_000);
  });
}

/**
 * Send a garment image + prompt to the GPU server via HTTP.
 * Using HTTP (not a DataChannel) keeps the implementation simple and lets
 * the GPU server handle the image synchronously before the next frame.
 *
 * Route: Browser → /api/garment (Next.js) → GPU_SERVER_URL/garment (Python)
 */
async function sendGarment(
  sessionId: string,
  blob: Blob,
  prompt: string
): Promise<void> {
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("image", blob, "garment.jpg");
  form.append("prompt", prompt);

  try {
    const res = await fetch("/api/garment", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      console.error(
        `[sendGarment] GPU server rejected garment update: ${res.status} ${res.statusText}`
      );
    }
  } catch (err) {
    console.error("[sendGarment] Network error:", err);
  }
}