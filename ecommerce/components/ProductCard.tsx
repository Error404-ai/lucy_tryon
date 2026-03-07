import { Product } from "@/lib/products";
import Image from "next/image";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  onTryOn: () => void;
}

export function ProductCard({ product, onTryOn }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        background: "var(--surface)",
        cursor: "pointer",
        transition: "background 0.3s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <div style={{
        position: "relative",
        aspectRatio: "3/4",
        overflow: "hidden",
        background: "var(--surface-2)",
      }}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          style={{
            objectFit: "cover",
            transform: hovered ? "scale(1.04)" : "scale(1)",
            transition: "transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
            filter: hovered ? "brightness(0.75)" : "brightness(0.9)",
          }}
        />

        {/* Top tag */}
        <div style={{
          position: "absolute", top: 14, left: 14,
          padding: "4px 10px",
          background: "rgba(8,8,7,0.7)",
          backdropFilter: "blur(8px)",
          border: "1px solid var(--border)",
          borderRadius: 2,
        }}>
          <span style={{
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}>AW 2025</span>
        </div>

        {/* Hover overlay */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "flex-end",
          padding: 20,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}>
          <button
            onClick={onTryOn}
            style={{
              width: "100%",
              padding: "13px 0",
              background: "var(--accent)",
              border: "none",
              borderRadius: 2,
              color: "#0a0a09",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              transform: hovered ? "translateY(0)" : "translateY(8px)",
              transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1), background 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#d9b97e")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--accent)")}
          >
            Try On
          </button>
        </div>
      </div>

      {/* Info row */}
      <div style={{
        padding: "14px 16px 16px",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        borderBottom: "1px solid var(--border-soft)",
      }}>
        <div>
          <h3 style={{
            fontSize: 13,
            fontWeight: 400,
            letterSpacing: "0.04em",
            color: "var(--text)",
            margin: 0,
            marginBottom: 4,
          }}>{product.name}</h3>
          <p style={{
            fontSize: 11,
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            margin: 0,
          }}>USD ${product.price}</p>
        </div>

        {/* Try-on icon button */}
        <button
          onClick={onTryOn}
          title="Try on"
          style={{
            width: 34, height: 34,
            borderRadius: "50%",
            background: hovered ? "var(--accent-dim)" : "transparent",
            border: "1px solid",
            borderColor: hovered ? "var(--accent)" : "var(--border)",
            color: hovered ? "var(--accent)" : "var(--text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.25s",
            flexShrink: 0,
          }}
        >
          {/* Camera/eye icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </div>
  );
}