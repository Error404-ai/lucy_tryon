"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Product } from "@/lib/products";
import { useCamera } from "@/hooks/useCamera";
import {
  useDecartRealtime,
  ConnectionStatus,
} from "@/hooks/useDecartRealtime";
import { urlToImageBlob, resizeImageBlob } from "@/lib/image-utils";

interface TryOnModalProps {
  product: Product;
  onClose: () => void;
}

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  idle: "Initializing...",
  connecting: "Connecting...",
  connected: "Applying garment...",
  generating: "Live",
  reconnecting: "Reconnecting...",
  disconnected: "Disconnected",
  error: "Connection error",
};

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  idle: "#7a7468",
  connecting: "#c9a96e",
  connected: "#c9a96e",
  generating: "#22c55e",
  reconnecting: "#f59e0b",
  disconnected: "#6b7280",
  error: "#ef4444",
};

export function TryOnModal({ product, onClose }: TryOnModalProps) {
  const { error: camError, startCamera, stopCamera } = useCamera();
  const { status, error: rtError, connect, disconnect, clientRef } =
    useDecartRealtime();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prompt, setPrompt] = useState(product.prompt);
  const [showPrompt, setShowPrompt] = useState(false);
  const garmentBlobRef = useRef<Blob | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const handleRemoteStream = useCallback((remoteStream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = remoteStream;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const mediaStream = await startCamera();
      if (!mediaStream || cancelled) return;

      const res = await fetch("/api/tokens", { method: "POST" });
      const { apiKey } = await res.json();
      if (cancelled) return;

      const rtClient = await connect({
        apiKey,
        stream: mediaStream,
        onRemoteStream: handleRemoteStream,
      });

      if (!rtClient || cancelled) return;

      const blob = await urlToImageBlob(product.image);
      const resized = await resizeImageBlob(blob);
      garmentBlobRef.current = resized;
      rtClient.setImage(resized, {
        prompt: product.prompt,
        enhance: false,
      });
    }

    init();

    return () => {
      cancelled = true;
      disconnect();
      stopCamera();
    };
  }, [product, startCamera, stopCamera, connect, disconnect, handleRemoteStream]);

  const handleClose = () => {
    disconnect();
    stopCamera();
    onClose();
  };

  const handlePromptSubmit = () => {
    if (!clientRef.current || !garmentBlobRef.current) return;
    clientRef.current.setImage(garmentBlobRef.current, {
      prompt,
      enhance: false,
    });
  };

  const error = camError || rtError;
  const isLive = status === "generating";
  const dotColor = STATUS_COLORS[status];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.92)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.25s ease",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
      `}</style>

      <div style={{
        position: "relative",
        width: "100%", height: "100%",
        maxWidth: 1100, maxHeight: "92vh",
        display: "flex", flexDirection: "column",
        animation: "slideUp 0.35s cubic-bezier(0.16,1,0.3,1)",
        margin: "0 auto",
      }}>

        {/* ── Top bar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          zIndex: 10,
          position: "absolute", top: 0, left: 0, right: 0,
        }}>
          {/* Left: product name + status */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "rgba(8,8,7,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 4,
            padding: "8px 14px",
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: dotColor,
              animation: isLive ? "pulseDot 1.5s ease-in-out infinite" : "none",
              flexShrink: 0,
            }} />
            <div>
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: 15,
                fontWeight: 400,
                color: "var(--text)",
                margin: 0,
                letterSpacing: "0.04em",
              }}>{product.name}</p>
              <p style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: isLive ? "#22c55e" : "var(--text-muted)",
                margin: 0,
              }}>{STATUS_LABELS[status]}</p>
            </div>
          </div>

          {/* Right: close */}
          <button
            onClick={handleClose}
            style={{
              width: 40, height: 40,
              borderRadius: "50%",
              background: "rgba(8,8,7,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "var(--text)";
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── Video ── */}
        <div style={{
          flex: 1,
          background: "#050504",
          overflow: "hidden",
          borderRadius: 8,
          position: "relative",
          border: "1px solid var(--border)",
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%", height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
              display: "block",
            }}
          />

          {/* Corner accents */}
          {[
            { top: 12, left: 12, borderTop: "1px solid var(--accent)", borderLeft: "1px solid var(--accent)" },
            { top: 12, right: 12, borderTop: "1px solid var(--accent)", borderRight: "1px solid var(--accent)" },
            { bottom: 12, left: 12, borderBottom: "1px solid var(--accent)", borderLeft: "1px solid var(--accent)" },
            { bottom: 12, right: 12, borderBottom: "1px solid var(--accent)", borderRight: "1px solid var(--accent)" },
          ].map((style, i) => (
            <div key={i} style={{
              position: "absolute",
              width: 20, height: 20,
              ...style,
              opacity: 0.5,
            }} />
          ))}

          {/* Initializing overlay */}
          {status !== "generating" && status !== "error" && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "rgba(8,8,7,0.5)",
              backdropFilter: "blur(2px)",
              gap: 16,
            }}>
              <div style={{
                width: 36, height: 36,
                border: "1.5px solid var(--accent)",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.9s linear infinite",
              }} />
              <p style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--accent)",
              }}>{STATUS_LABELS[status]}</p>
            </div>
          )}
        </div>

        {/* ── Bottom panel ── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          zIndex: 10,
        }}>
          {/* Prompt panel (expandable) */}
          {showPrompt && (
            <div style={{
              margin: "0 0 8px",
              background: "rgba(8,8,7,0.85)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "14px 16px",
              animation: "slideUp 0.25s ease",
            }}>
              <p style={{
                fontSize: 10, letterSpacing: "0.15em",
                textTransform: "uppercase", color: "var(--text-muted)",
                margin: "0 0 10px",
              }}>Prompt</p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePromptSubmit()}
                  style={{
                    flex: 1,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "9px 12px",
                    color: "var(--text)",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "var(--font-sans)",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
                />
                <button
                  onClick={handlePromptSubmit}
                  style={{
                    padding: "9px 18px",
                    background: "var(--accent)",
                    border: "none",
                    borderRadius: 4,
                    color: "#0a0a09",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#d9b97e")}
                  onMouseLeave={e => (e.currentTarget.style.background = "var(--accent)")}
                >Apply</button>
              </div>
            </div>
          )}

          {/* Control strip */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px",
            background: "rgba(8,8,7,0.8)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            marginBottom: 8,
          }}>
            {/* Garment tag */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 28, height: 28,
                borderRadius: 3,
                overflow: "hidden",
                border: "1px solid var(--border)",
                flexShrink: 0,
                background: "var(--surface-2)",
                position: "relative",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div>
                <p style={{ fontSize: 12, color: "var(--text)", margin: 0, fontWeight: 400 }}>
                  {product.name}
                </p>
                <p style={{ fontSize: 10, color: "var(--text-muted)", margin: 0, letterSpacing: "0.05em" }}>
                  USD ${product.price}
                </p>
              </div>
            </div>

            {/* Prompt toggle */}
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: showPrompt ? "var(--accent-dim)" : "transparent",
                border: "1px solid",
                borderColor: showPrompt ? "var(--accent)" : "var(--border)",
                borderRadius: 4,
                padding: "7px 12px",
                color: showPrompt ? "var(--accent)" : "var(--text-muted)",
                fontSize: 10,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                transition: "all 0.2s",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Prompt
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            position: "absolute", bottom: 80, left: 0, right: 0,
            margin: "0 0 8px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 4,
            padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <span style={{ fontSize: 12, color: "#fca5a5" }}>{error}</span>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}