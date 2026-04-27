"use client";

import { useState, useEffect } from "react";

// ─── Token registry: symbol → color + icon character ───────────────────────
const TOKEN_META: Record<string, { bg: string; accent: string; symbol: string; icon: string }> = {
  XLM:  { bg: "#0a1628", accent: "#00e5ff", symbol: "XLM",  icon: "✦" },
  USDC: { bg: "#0a1420", accent: "#2775ca", symbol: "USDC", icon: "$"  },
  USDT: { bg: "#0a1a14", accent: "#26a17b", symbol: "USDT", icon: "₮"  },
  BTC:  { bg: "#1a1000", accent: "#f7931a", symbol: "BTC",  icon: "₿"  },
  ETH:  { bg: "#0d0e28", accent: "#627eea", symbol: "ETH",  icon: "Ξ"  },
  AQUA: { bg: "#0a1a1a", accent: "#00d4ff", symbol: "AQA",  icon: "◈"  },
  yXLM: { bg: "#0a1828", accent: "#7dd3fc", symbol: "yXLM", icon: "◎"  },
  EURC: { bg: "#0a1020", accent: "#4f8ef7", symbol: "EURC", icon: "€"  },
};

const FALLBACK = { bg: "#111122", accent: "#8b5cf6", symbol: "??", icon: "◇" };

function getToken(sym: string) {
  return TOKEN_META[sym.toUpperCase()] ?? TOKEN_META[sym] ?? { ...FALLBACK, symbol: sym.slice(0, 4).toUpperCase() };
}

// ─── Sizes ───────────────────────────────────────────────────────────────────
const SIZE_MAP = {
  sm: { diameter: 28, fontSize: 9,  labelSize: 10, gap: 10, overlapOffset: 14 },
  md: { diameter: 40, fontSize: 12, labelSize: 12, gap: 12, overlapOffset: 20 },
  lg: { diameter: 56, fontSize: 16, labelSize: 14, gap: 16, overlapOffset: 28 },
  xl: { diameter: 72, fontSize: 20, labelSize: 16, gap: 20, overlapOffset: 36 },
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface FlowPairProps {
  from: string;
  to: string;
  size?: keyof typeof SIZE_MAP;
  showLabels?: boolean;
  showArrow?: boolean;
  animated?: boolean;
}

// ─── Single token icon ────────────────────────────────────────────────────────
function TokenIcon({
  symbol,
  diameter,
  fontSize,
  glowing,
  zIndex,
  offsetX,
  animated,
}: {
  symbol: string;
  diameter: number;
  fontSize: number;
  glowing: boolean;
  zIndex: number;
  offsetX: number;
  animated: boolean;
}) {
  const meta = getToken(symbol);
  const borderWidth = 2;

  return (
    <div
      style={{
        position: "absolute",
        left: offsetX,
        top: 0,
        width: diameter,
        height: diameter,
        borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${meta.accent}22, ${meta.bg} 70%)`,
        border: `${borderWidth}px solid #04060f`, // Midnight Void
        boxShadow: glowing
          ? [
              `0 0 0 1px ${meta.accent}33`,
              `0 0 10px ${meta.accent}55`,
              `0 0 22px ${meta.accent}30`,
              `0 0 40px ${meta.accent}18`,
              `inset 0 1px 0 rgba(255,255,255,0.12)`,
            ].join(", ")
          : `inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 8px rgba(0,0,0,0.5)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex,
        transition: "box-shadow 0.4s ease",
        overflow: "hidden",
        cursor: "default",
      }}
    >
      {/* Inner ring accent */}
      <div
        style={{
          position: "absolute",
          inset: 3,
          borderRadius: "50%",
          border: `1px solid ${meta.accent}20`,
          pointerEvents: "none",
        }}
      />

      {/* Icon character */}
      <span
        style={{
          fontFamily: "'Share Tech Mono', 'Courier New', monospace",
          fontSize,
          fontWeight: 700,
          color: meta.accent,
          textShadow: glowing ? `0 0 8px ${meta.accent}cc` : `0 0 4px ${meta.accent}66`,
          lineHeight: 1,
          position: "relative",
          zIndex: 1,
          animation: animated && glowing ? "iconPulse 2.8s ease-in-out infinite" : "none",
          userSelect: "none",
        }}
      >
        {meta.icon}
      </span>

      {/* Shimmer sweep */}
      {animated && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
            animation: "shimmerSweep 3.5s ease-in-out infinite",
            animationDelay: glowing ? "0s" : "0.8s",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

// ─── Flow arrow between icons ─────────────────────────────────────────────────
function FlowArrow({ color, size, animated }: { color: string; size: number; animated: boolean }) {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 24 14"
      fill="none"
      style={{
        flexShrink: 0,
        opacity: 0.7,
        filter: `drop-shadow(0 0 4px ${color}80)`,
      }}
    >
      {/* Dashed line */}
      <line
        x1="1"
        y1="7"
        x2="18"
        y2="7"
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="3 3"
        strokeLinecap="round"
        style={
          animated
            ? {
                animation: "dashFlow 1.2s linear infinite",
                strokeDashoffset: 0,
              }
            : {}
        }
      />
      {/* Arrowhead */}
      <path
        d="M15 3.5L21.5 7L15 10.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FlowPair({
  from = "XLM",
  to = "USDC",
  size = "md",
  showLabels = true,
  showArrow = true,
  animated = true,
}: Partial<FlowPairProps>) {
  const s = SIZE_MAP[size];
  const fromMeta = getToken(from);
  const toMeta = getToken(to);

  // Paired icons total width = diameter + overlapOffset
  const pairWidth = s.diameter + s.overlapOffset;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;600;700&display=swap');

        @keyframes iconPulse {
          0%, 100% { text-shadow: 0 0 8px currentColor; opacity: 1; }
          50%       { text-shadow: 0 0 18px currentColor; opacity: 0.8; }
        }

        @keyframes shimmerSweep {
          0%         { transform: translateX(-100%) rotate(0deg); opacity: 0; }
          30%, 70%   { opacity: 1; }
          100%       { transform: translateX(200%) rotate(0deg); opacity: 0; }
        }

        @keyframes dashFlow {
          to { stroke-dashoffset: -12; }
        }

        @keyframes particleDrift {
          0%   { transform: translateX(0) translateY(0) scale(1); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateX(60px) translateY(-6px) scale(0.3); opacity: 0; }
        }

        .fp-root {
          display: inline-flex;
          align-items: center;
          gap: 0;
          font-family: 'Orbitron', monospace;
          position: relative;
        }

        .fp-pair {
          position: relative;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .fp-label-group {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0;
        }

        .fp-label-row {
          display: flex;
          align-items: center;
          gap: 4px;
          line-height: 1;
        }

        .fp-label-sym {
          font-family: 'Orbitron', monospace;
          font-weight: 600;
          letter-spacing: 0.05em;
          line-height: 1.2;
        }

        .fp-label-div {
          font-family: 'Share Tech Mono', monospace;
          color: rgba(255,255,255,0.2);
          font-weight: 400;
        }

        .fp-arrow-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          position: relative;
        }

        /* Particle dots drifting from "from" to "to" */
        .fp-particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          animation: particleDrift linear infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="fp-root">
        {/* ── Overlapping icon pair ── */}
        <div
          className="fp-pair"
          style={{ width: pairWidth, height: s.diameter }}
        >
          {/* "to" token — behind, on the right */}
          <TokenIcon
            symbol={to}
            diameter={s.diameter}
            fontSize={s.fontSize}
            glowing={false}
            zIndex={1}
            offsetX={s.overlapOffset}
            animated={animated}
          />
          {/* "from" token — leading, on the left, glowing */}
          <TokenIcon
            symbol={from}
            diameter={s.diameter}
            fontSize={s.fontSize}
            glowing={true}
            zIndex={2}
            offsetX={0}
            animated={animated}
          />
        </div>

        {/* ── Flow arrow with optional particles ── */}
        {showArrow && (
          <div className="fp-arrow-wrap" style={{ width: s.gap * 2.5, height: s.diameter }}>
            <FlowArrow
              color={fromMeta.accent}
              size={s.gap * 2}
              animated={animated}
            />
            {/* Particles */}
            {animated &&
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="fp-particle"
                  style={{
                    background: fromMeta.accent,
                    boxShadow: `0 0 4px ${fromMeta.accent}`,
                    animationDuration: `${1.4 + i * 0.5}s`,
                    animationDelay: `${i * 0.45}s`,
                    opacity: 0,
                  }}
                />
              ))}
          </div>
        )}

        {/* ── Labels ── */}
        {showLabels && (
          <div className="fp-label-group" style={{ marginLeft: showArrow ? 2 : s.gap }}>
            {/* Stacked: FROM → TO */}
            <div className="fp-label-row">
              <span
                className="fp-label-sym"
                style={{ color: fromMeta.accent, fontSize: s.labelSize, textShadow: `0 0 8px ${fromMeta.accent}66` }}
              >
                {fromMeta.symbol}
              </span>
              <span className="fp-label-div" style={{ fontSize: s.labelSize }}>→</span>
              <span
                className="fp-label-sym"
                style={{ color: toMeta.accent, fontSize: s.labelSize, textShadow: `0 0 6px ${toMeta.accent}44` }}
              >
                {toMeta.symbol}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Demo showcase ────────────────────────────────────────────────────────────
export function FlowPairShowcase() {
  const pairs: Array<[string, string, keyof typeof SIZE_MAP]> = [
    ["XLM",  "USDC", "xl"],
    ["ETH",  "USDT", "lg"],
    ["BTC",  "USDC", "md"],
    ["yXLM", "AQUA", "sm"],
  ];

  return (
    <>
      <style>{`
        body { background: #04060f; margin: 0; }

        .showcase-root {
          min-height: 100vh;
          background:
            radial-gradient(ellipse at 15% 25%, rgba(0,229,255,0.05) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 75%, rgba(138,43,226,0.07) 0%, transparent 55%),
            #04060f;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 48px 24px;
        }

        .showcase-title {
          font-family: 'Orbitron', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          margin-bottom: 40px;
        }

        .showcase-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 460px;
          padding: 20px 28px;
          background: rgba(10, 10, 20, 0.80);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          margin-bottom: 10px;
          transition: border-color 0.2s, background 0.2s;
          cursor: default;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .showcase-card {
            background: rgba(255,255,255,0.025);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
        }

        .showcase-card:hover {
          border-color: rgba(0,229,255,0.18);
          background: rgba(0,229,255,0.02);
        }

        .showcase-size-tag {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.18);
          text-transform: uppercase;
          border: 1px solid rgba(255,255,255,0.08);
          padding: 2px 8px;
          border-radius: 4px;
        }
      `}</style>

      <div className="showcase-root">
        <div className="showcase-title">Flow Pair · Token Component</div>

        {pairs.map(([from, to, sz]) => (
          <div className="showcase-card" key={`${from}-${to}`}>
            <FlowPair from={from} to={to} size={sz} showLabels showArrow animated />
            <span className="showcase-size-tag">{sz.toUpperCase()}</span>
          </div>
        ))}

        {/* Variants row */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 20,
            alignItems: "center",
            padding: "16px 28px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
          }}
        >
          <FlowPair from="XLM" to="USDC" size="md" showLabels={false} showArrow={false} animated />
          <FlowPair from="ETH" to="BTC" size="md" showLabels={false} showArrow animated />
          <FlowPair from="USDC" to="yXLM" size="md" showLabels showArrow={false} animated />
        </div>
      </div>
    </>
  );
}