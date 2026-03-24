"use client";

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
  apiKey: string;
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

  const clientRef = useRef<RealtimeClient | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // buffer ICE candidates until session_id is ready
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);

  // ── connect ──────────────────────────────────────────────────────────────
  const connect = useCallback(
    async (options: ConnectOptions): Promise<RealtimeClient | null> => {
      const { stream, onRemoteStream } = options;

      setStatus("connecting");
      setError(null);

      try {
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            {
              urls: [
                "turn:3.110.30.120:3478?transport=udp",
                "turn:3.110.30.120:3478?transport=tcp",
              ],
              username:
                process.env.NEXT_PUBLIC_TURN_USERNAME ?? "lucy",
              credential:
                process.env.NEXT_PUBLIC_TURN_CREDENTIAL ?? "tryon123",
            },
          ],
          iceCandidatePoolSize: 10,
        });

        pcRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Handle remote stream
        const remoteStream = new MediaStream();
        pc.ontrack = (event) => {
          event.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
          onRemoteStream(remoteStream);
          setStatus("generating");
        };

        // Connection state
        pc.onconnectionstatechange = () => {
          switch (pc.connectionState) {
            case "connected":
              setStatus((prev) =>
                prev === "generating" ? "generating" : "connected"
              );
              break;
            case "disconnected":
              setStatus("reconnecting");
              break;
            case "failed":
              setStatus("error");
              setError("WebRTC connection failed");
              break;
            case "closed":
              setStatus("disconnected");
              break;
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === "failed") {
            setStatus("error");
            setError("ICE negotiation failed");
          }
        };

        // Handle ICE candidates (Trickle ICE)
        pc.onicecandidate = (event) => {
          if (!event.candidate) return;

          if (!sessionIdRef.current) {
            pendingCandidatesRef.current.push(event.candidate);
          } else {
            sendCandidate(event.candidate);
          }
        };

        const sendCandidate = (candidate: RTCIceCandidate) => {
          fetch("/api/session/candidate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionIdRef.current,
              candidate,
            }),
          }).catch(console.error);
        };

        // ✅ Create & set offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // ✅ Send offer immediately (no ICE wait)
        const res = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sdp: pc.localDescription }),
        });

        if (!res.ok) {
          throw new Error(`Signaling failed (${res.status})`);
        }

        const { sdp: answerSdp, session_id } = await res.json();
        sessionIdRef.current = session_id;

        // flush buffered candidates
        pendingCandidatesRef.current.forEach((c) => sendCandidate(c));
        pendingCandidatesRef.current = [];

        // ✅ Set remote SDP
        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription(answerSdp)
          );
        } catch (err) {
          console.error("Failed to set remote description", err);
          throw err;
        }

        // Optional: fetch remote ICE candidates (if your backend supports it)
        pollRemoteCandidates(pc);

        // Client object
        const client: RealtimeClient = {
          setImage: (blob, opts) => {
            if (!sessionIdRef.current) return;
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
        console.error(err);
        setError(msg);
        setStatus("error");
        return null;
      }
    },
    []
  );

  // ── disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    clientRef.current = null;
    sessionIdRef.current = null;
    setStatus("disconnected");
  }, []);

  return { status, error, connect, disconnect, clientRef };
}

// ── Remote ICE polling (basic implementation) ──────────────────────────────

function pollRemoteCandidates(pc: RTCPeerConnection) {
  const interval = setInterval(async () => {
    try {
      const res = await fetch("/api/session/candidates");
      if (!res.ok) return;

      const candidates = await res.json();

      candidates.forEach((c: RTCIceCandidateInit) => {
        pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
      });
    } catch (err) {
      console.error("Polling ICE failed", err);
    }
  }, 1000);

  // stop after 15 sec
  setTimeout(() => clearInterval(interval), 15000);
}

// ── Garment sender ─────────────────────────────────────────────────────────

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
      console.error("Garment upload failed:", res.status);
    }
  } catch (err) {
    console.error("Garment error:", err);
  }
}