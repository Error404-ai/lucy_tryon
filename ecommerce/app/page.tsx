"use client";

import { useState } from "react";
import { PRODUCTS, Product } from "@/lib/products";
import { TryOnModal } from "@/components/TryOnModal";

function GarmentCard({ product, index, onClick }: {
  product: Product;
  index: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      className={`anim-fade-up anim-d${Math.min(index % 4 + 1, 4)}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--surface-2)" : "var(--surface)",
        border: "none",
        overflow: "hidden",
        cursor: "pointer",
        textAlign: "left",
        padding: 0,
        transition: "background 0.25s",
        position: "relative",
        display: "block",
      }}
    >
      {/* Image */}
      <div style={{
        aspectRatio: "3/4",
        overflow: "hidden",
        position: "relative",
        background: "var(--surface-2)",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", display: "block",
            transform: hovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.6s cubic-bezier(0.16,1,0.3,1)",
            filter: hovered ? "brightness(0.55)" : "brightness(0.88)",
          }}
        />

        {/* Hover CTA */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.25s",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px",
            background: "var(--accent)",
            borderRadius: 2,
            transform: hovered ? "translateY(0)" : "translateY(8px)",
            transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0a0a09" strokeWidth="2.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span style={{
              fontSize: 9, fontWeight: 600,
              letterSpacing: "0.22em", textTransform: "uppercase",
              color: "#0a0a09",
            }}>Try On</span>
          </div>
        </div>

        {/* Item number */}
        <div style={{
          position: "absolute", top: 10, left: 12,
          fontSize: 9, letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.2)",
        }}>
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>

      {/* Info row */}
      <div style={{
        padding: "12px 14px 14px",
        borderTop: `1px solid ${hovered ? "var(--accent)" : "var(--border-soft)"}`,
        transition: "border-color 0.25s",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{
            fontSize: 12, color: "var(--text)",
            margin: 0, fontWeight: 400, letterSpacing: "0.02em",
          }}>
            {product.name.replace("Decart ", "")}
          </p>
          <p style={{
            fontSize: 10, color: "var(--text-muted)",
            margin: "3px 0 0", letterSpacing: "0.08em",
          }}>
            ${product.price}
          </p>
        </div>
        <div style={{
          width: 24, height: 24,
          borderRadius: "50%",
          border: `1px solid ${hovered ? "var(--accent)" : "var(--border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.25s", flexShrink: 0,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke={hovered ? "var(--accent)" : "var(--text-muted)"} strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </button>
  );
}

export default function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [started, setStarted] = useState(false);

  if (selectedProduct) {
    return (
      <TryOnModal
        product={selectedProduct}
        onClose={() => { setSelectedProduct(null); setStarted(false); }}
      />
    );
  }

  // ── Landing screen ──
  if (!started) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: "30%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700, height: 500,
          background: "radial-gradient(ellipse, rgba(201,169,110,0.06) 0%, transparent 68%)",
          pointerEvents: "none",
        }} />

        {/* Logo block */}
        <div className="anim-fade-up" style={{ textAlign: "center", marginBottom: 44 }}>
          <p style={{
            fontSize: 10, letterSpacing: "0.35em",
            textTransform: "uppercase", color: "var(--accent)",
            marginBottom: 14,
          }}>AI-Powered</p>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(60px, 10vw, 108px)",
            fontWeight: 300,
            letterSpacing: "0.1em",
            color: "var(--text)",
            margin: 0, lineHeight: 1,
          }}>LUCY</h1>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            marginTop: 14,
          }}>
            <div style={{ height: 1, width: 32, background: "var(--border)" }} />
            <p style={{
              fontSize: 10, letterSpacing: "0.3em",
              textTransform: "uppercase", color: "var(--text-muted)",
              margin: 0,
            }}>Virtual Try-On</p>
            <div style={{ height: 1, width: 32, background: "var(--border)" }} />
          </div>
        </div>

        <p className="anim-fade-up anim-d1" style={{
          color: "var(--text-muted)", fontSize: 14, fontWeight: 300,
          maxWidth: 300, lineHeight: 1.85, textAlign: "center", marginBottom: 48,
        }}>
          See how clothes look on you in real-time — powered by AI.
        </p>

        {/* CTA */}
        <button
          className="anim-fade-up anim-d2"
          onClick={() => setStarted(true)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "15px 38px",
            background: "var(--accent)", border: "none",
            borderRadius: 2, color: "#0a0a09",
            fontSize: 11, fontWeight: 500,
            letterSpacing: "0.22em", textTransform: "uppercase",
            transition: "all 0.25s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "#d9b97e";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(201,169,110,0.25)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "var(--accent)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Start Try-On
        </button>

        <p className="anim-fade-up anim-d3" style={{
          marginTop: 18, fontSize: 10,
          color: "var(--text-dim)", letterSpacing: "0.12em",
        }}>Camera access required</p>

        {/* Feature tags */}
        <div className="anim-fade-up anim-d4" style={{
          position: "absolute", bottom: 36,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {["Real-time AI", "10 garments", "No app needed"].map((tag, i) => (
            <div key={tag}>
              <span style={{
                fontSize: 10, letterSpacing: "0.14em",
                color: "var(--text-dim)", textTransform: "uppercase",
              }}>{tag}</span>
              {i < 2 && (
                <span style={{ marginLeft: 6, color: "var(--text-dim)", fontSize: 10 }}>·</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Garment selector screen ──
  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: -100, left: "50%",
        transform: "translateX(-50%)",
        width: 800, height: 280,
        background: "radial-gradient(ellipse, rgba(201,169,110,0.045) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Header */}
      <div style={{
        position: "relative", zIndex: 1,
        padding: "28px 40px 24px",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        borderBottom: "1px solid var(--border-soft)",
      }}>
        <div>
          <button
            onClick={() => setStarted(false)}
            style={{
              background: "none", border: "none", padding: 0,
              display: "flex", alignItems: "center", gap: 6,
              color: "var(--text-muted)", fontSize: 10,
              letterSpacing: "0.14em", textTransform: "uppercase",
              marginBottom: 16, cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>

          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px, 3.5vw, 40px)",
            fontWeight: 300, color: "var(--text)",
            margin: 0, letterSpacing: "0.02em", lineHeight: 1,
          }}>
            Select a{" "}
            <em style={{ fontStyle: "italic", color: "var(--accent)" }}>garment</em>
          </h2>
          <p style={{
            fontSize: 11, color: "var(--text-muted)",
            marginTop: 8, letterSpacing: "0.06em",
          }}>
            {PRODUCTS.length} items · tap any to begin
          </p>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "7px 14px",
          border: "1px solid var(--border)",
          borderRadius: 20,
          background: "var(--surface)",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--accent)",
            boxShadow: "0 0 6px rgba(201,169,110,0.5)",
          }} />
          <span style={{
            fontSize: 9, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "var(--text-muted)",
          }}>AI Ready</span>
        </div>
      </div>

      {/* Grid — 1px gap creates a tile wall effect */}
      <div style={{
        flex: 1,
        position: "relative", zIndex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))",
        gap: "1px",
        background: "var(--border-soft)",
        overflowY: "auto",
      }}>
        {PRODUCTS.map((product, i) => (
          <GarmentCard
            key={product.name}
            product={product}
            index={i}
            onClick={() => setSelectedProduct(product)}
          />
        ))}
      </div>
    </div>
  );
}