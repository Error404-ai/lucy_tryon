"use client";

import { useState } from "react";
import { PRODUCTS, Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { TryOnModal } from "@/components/TryOnModal";

export default function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)" }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 40,
        borderBottom: "1px solid var(--border)",
        background: "rgba(8,8,7,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          padding: "0 32px",
          height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: "0.18em",
              color: "var(--text)",
            }}>URBAN</span>
            <span style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              color: "var(--accent)",
              textTransform: "uppercase",
              fontWeight: 400,
            }}>Studio</span>
          </div>

          {/* Nav links */}
          <div style={{
            display: "flex", alignItems: "center", gap: 32,
          }}>
            {["Collection", "Lookbook", "About"].map((item) => (
              <span key={item} style={{
                fontSize: 11,
                letterSpacing: "0.15em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
              >{item}</span>
            ))}
          </div>

          {/* Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button style={{
              background: "none", border: "none", padding: 4,
              color: "var(--text-muted)", transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </button>
            <button style={{
              background: "none", border: "none", padding: 4,
              color: "var(--text-muted)", transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: "72px 32px 56px",
        borderBottom: "1px solid var(--border-soft)",
      }}>
        <p className="anim-fade-up" style={{
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--accent)",
          fontWeight: 400,
          marginBottom: 16,
        }}>AW 2025 — Virtual Try-On</p>

        <h1 className="anim-fade-up anim-d1" style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(42px, 6vw, 80px)",
          fontWeight: 300,
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          color: "var(--text)",
          margin: 0,
        }}>
          Winter<br />
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Essentials</em>
        </h1>

        <p className="anim-fade-up anim-d2" style={{
          color: "var(--text-muted)",
          fontSize: 14,
          fontWeight: 300,
          maxWidth: 380,
          lineHeight: 1.7,
          marginTop: 20,
        }}>
          Try before you buy. Click any item to see how it looks on you — powered by real-time AI.
        </p>

        {/* Divider line */}
        <div className="anim-fade-up anim-d3" style={{
          marginTop: 40,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{ width: 32, height: 1, background: "var(--accent)" }} />
          <span style={{
            fontSize: 10, letterSpacing: "0.2em", color: "var(--text-dim)",
            textTransform: "uppercase",
          }}>Scroll to explore</span>
        </div>
      </div>

      {/* Grid header */}
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        padding: "40px 32px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <p style={{
          fontSize: 11,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--text-dim)",
        }}>{PRODUCTS.length} pieces</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "pulseDot 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase" }}>
            Try-on enabled
          </span>
        </div>
      </div>

      {/* Product grid */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px 80px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "2px",
        }}>
          {PRODUCTS.map((product, i) => (
            <div
              key={product.name}
              className={`anim-fade-up anim-d${Math.min(i % 4 + 1, 4)}`}
            >
              <ProductCard
                product={product}
                onTryOn={() => setSelectedProduct(product)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: 16,
          letterSpacing: "0.15em",
          color: "var(--text-dim)",
        }}>URBAN</span>
        <span style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.1em" }}>
          © 2025
        </span>
      </footer>

      {selectedProduct && (
        <TryOnModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  );
}