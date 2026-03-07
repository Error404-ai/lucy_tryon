"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Product, PRODUCTS } from "@/lib/products";
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
  error: "Error",
};

export function TryOnModal({ product: initialProduct, onClose }: TryOnModalProps) {
  const { error: camError, startCamera, stopCamera } = useCamera();
  const { status, error: rtError, connect, disconnect, clientRef } =
    useDecartRealtime();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prompt, setPrompt] = useState(initialProduct.prompt);
  const [showPrompt, setShowPrompt] = useState(false);
  const garmentBlobRef = useRef<Blob | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product>(initialProduct);
  const [showPoseGuide, setShowPoseGuide] = useState(true);
  const [stripExpanded, setStripExpanded] = useState(false);

  const handleRemoteStream = useCallback((remoteStream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = remoteStream;
    }
  }, []);

  // Hide pose guide after 4 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowPoseGuide(false), 4000);
    return () => clearTimeout(t);
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

      const blob = await urlToImageBlob(initialProduct.image);
      const resized = await resizeImageBlob(blob);
      garmentBlobRef.current = resized;
      rtClient.setImage(resized, {
        prompt: initialProduct.prompt,
        enhance: false,
      });
    }

    init();

    return () => {
      cancelled = true;
      disconnect();
      stopCamera();
    };
  }, [initialProduct, startCamera, stopCamera, connect, disconnect, handleRemoteStream]);

  const handleClose = () => {
    disconnect();
    stopCamera();
    onClose();
  };

  // Switch garment without restarting camera/connection
  const handleSwitchGarment = async (product: Product) => {
    if (!clientRef.current) return;
    setActiveProduct(product);
    setPrompt(product.prompt);

    const blob = await urlToImageBlob(product.image);
    const resized = await resizeImageBlob(blob);
    garmentBlobRef.current = resized;
    clientRef.current.setImage(resized, {
      prompt: product.prompt,
      enhance: false,
    });
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
  const isLoading = status === "idle" || status === "connecting" || status === "connected";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "#000",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes fadeOut { from{opacity:1} to{opacity:0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes pulseDot{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.75)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes breathe { 0%,100%{opacity:0.35} 50%{opacity:0.65} }
      `}</style>

      {/* ── Full-screen video ── */}
      <div style={{ position: "absolute", inset: 0 }}>
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
      </div>

      {/* ── Pose guide overlay ── */}
      {showPoseGuide && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 10,
          animation: "fadeOut 1s ease 3s both",
          pointerEvents: "none",
        }}>
          {/* Human body silhouette SVG */}
          <svg
            width="160" height="320"
            viewBox="0 0 160 320"
            fill="none"
            style={{ animation: "breathe 2s ease-in-out infinite" }}
          >
            {/* Head */}
            <ellipse cx="80" cy="36" rx="26" ry="30" stroke="rgba(201,169,110,0.6)" strokeWidth="1.5" strokeDasharray="4 3"/>
            {/* Neck */}
            <line x1="80" y1="66" x2="80" y2="82" stroke="rgba(201,169,110,0.4)" strokeWidth="1.5"/>
            {/* Shoulders */}
            <path d="M80 82 L30 100 L20 160 L40 165 L48 120 L80 110 L112 120 L120 165 L140 160 L130 100 Z"
              stroke="rgba(201,169,110,0.6)" strokeWidth="1.5" strokeDasharray="4 3" fill="none"/>
            {/* Torso */}
            <path d="M48 120 L44 220 L116 220 L112 120 Z"
              stroke="rgba(201,169,110,0.5)" strokeWidth="1.5" strokeDasharray="4 3" fill="none"/>
            {/* Left arm */}
            <path d="M30 100 L10 180 L20 184 L42 112"
              stroke="rgba(201,169,110,0.4)" strokeWidth="1.5" strokeDasharray="4 3" fill="none"/>
            {/* Right arm */}
            <path d="M130 100 L150 180 L140 184 L118 112"
              stroke="rgba(201,169,110,0.4)" strokeWidth="1.5" strokeDasharray="4 3" fill="none"/>
            {/* Legs */}
            <path d="M44 220 L36 310 L56 310 L80 240 L104 310 L124 310 L116 220 Z"
              stroke="rgba(201,169,110,0.4)" strokeWidth="1.5" strokeDasharray="4 3" fill="none"/>
          </svg>
          <p style={{
            marginTop: 20,
            fontSize: 12, letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(201,169,110,0.8)",
          }}>Stand here</p>
        </div>
      )}

      {/* ── Loading overlay ── */}
      {isLoading && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          zIndex: 20,
          gap: 16,
        }}>
          <div style={{
            width: 40, height: 40,
            border: "1.5px solid rgba(201,169,110,0.3)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite",
          }} />
          <p style={{
            fontSize: 11, letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--accent)",
          }}>{STATUS_LABELS[status]}</p>
        </div>
      )}

      {/* ── Top HUD ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        zIndex: 30,
        padding: "16px 16px 0",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
      }}>
        {/* Status pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "6px 12px",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: isLive ? "#22c55e" : status === "error" || status === "disconnected" ? "#ef4444" : "var(--accent)",
            animation: isLive ? "pulseDot 1.5s ease-in-out infinite" : "none",
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 10, letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: isLive ? "#86efac" : "var(--text-muted)",
          }}>{STATUS_LABELS[status]}</span>
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", gap: 8 }}>
          {/* Prompt toggle */}
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            title="Edit prompt"
            style={{
              width: 38, height: 38,
              borderRadius: "50%",
              background: showPrompt ? "var(--accent-dim)" : "rgba(0,0,0,0.5)",
              backdropFilter: "blur(10px)",
              border: "1px solid",
              borderColor: showPrompt ? "var(--accent)" : "rgba(255,255,255,0.08)",
              color: showPrompt ? "var(--accent)" : "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            style={{
              width: 38, height: 38,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Prompt input (slides down from top) ── */}
      {showPrompt && (
        <div style={{
          position: "absolute", top: 68, left: 16, right: 16,
          zIndex: 30,
          background: "rgba(8,8,7,0.88)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "14px",
          animation: "slideUp 0.25s ease",
        }}>
          <p style={{
            fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase",
            color: "var(--text-muted)", margin: "0 0 10px",
          }}>Customize prompt</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handlePromptSubmit()}
              style={{
                flex: 1,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "9px 12px",
                color: "var(--text)",
                fontSize: 12,
                outline: "none",
                fontFamily: "var(--font-sans)",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <button
              onClick={handlePromptSubmit}
              style={{
                padding: "9px 16px",
                background: "var(--accent)", border: "none",
                borderRadius: 4, color: "#0a0a09",
                fontSize: 10, fontWeight: 500,
                letterSpacing: "0.15em", textTransform: "uppercase",
              }}
            >Apply</button>
          </div>
        </div>
      )}

      {/* ── Bottom: active garment + strip ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        zIndex: 30,
        background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)",
        padding: "32px 0 0",
      }}>
        {/* Active garment label */}
        <div style={{
          padding: "0 16px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 40,
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid var(--accent)",
              flexShrink: 0,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeProduct.image} alt={activeProduct.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <p style={{ fontSize: 13, color: "var(--text)", margin: 0, fontWeight: 400 }}>
                {activeProduct.name}
              </p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0", letterSpacing: "0.05em" }}>
                USD ${activeProduct.price}
              </p>
            </div>
          </div>

          {/* Expand/collapse strip */}
          <button
            onClick={() => setStripExpanded(!stripExpanded)}
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: "6px 14px",
              color: "var(--text-muted)",
              fontSize: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ transform: stripExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}>
              <path d="M18 15l-6-6-6 6"/>
            </svg>
            {stripExpanded ? "Close" : "Switch"}
          </button>
        </div>

        {/* Horizontal scrollable garment strip */}
        {stripExpanded && (
          <div style={{
            overflowX: "auto",
            overflowY: "hidden",
            display: "flex",
            gap: 10,
            padding: "0 16px 20px",
            animation: "slideUp 0.25s ease",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}>
            {PRODUCTS.map(product => {
              const isActive = product.name === activeProduct.name;
              return (
                <button
                  key={product.name}
                  onClick={() => handleSwitchGarment(product)}
                  style={{
                    flexShrink: 0,
                    width: 72,
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(10px)",
                    border: "1.5px solid",
                    borderColor: isActive ? "var(--accent)" : "rgba(255,255,255,0.1)",
                    borderRadius: 6,
                    overflow: "hidden",
                    padding: 0,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    transform: isActive ? "translateY(-3px)" : "translateY(0)",
                  }}
                >
                  <div style={{ aspectRatio: "3/4", overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: "100%", height: "100%",
                        objectFit: "cover", display: "block",
                        filter: isActive ? "brightness(1)" : "brightness(0.7)",
                        transition: "filter 0.2s",
                      }}
                    />
                  </div>
                  <div style={{
                    padding: "5px 4px",
                    background: isActive ? "var(--accent)" : "transparent",
                  }}>
                    <p style={{
                      fontSize: 8,
                      color: isActive ? "#0a0a09" : "var(--text-muted)",
                      margin: 0,
                      letterSpacing: "0.05em",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {product.name.replace("Decart ", "")}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          position: "absolute", bottom: 100, left: 16, right: 16,
          zIndex: 40,
          background: "rgba(239,68,68,0.15)",
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 6,
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
  );
}