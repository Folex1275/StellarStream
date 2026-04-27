"use client";

import { useState, useRef, useEffect } from "react";

interface GasIndicatorProps {
  balance?: number;
  maxDisplay?: number;
  warningThreshold?: number;
}

const WARNING_THRESHOLD = 5;
const MAX_DISPLAY = 20;

export default function GasIndicator({
  balance = 3.42,
  maxDisplay = MAX_DISPLAY,
  warningThreshold = WARNING_THRESHOLD,
}: GasIndicatorProps) {
  const isWarning = balance < warningThreshold;
  const fillPercent = Math.min((balance / maxDisplay) * 100, 100);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [animatedFill, setAnimatedFill] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimatedFill(fillPercent), 100);
    return () => clearTimeout(t);
  }, [fillPercent]);

  const cyan = "#00e5ff";
  const orange = "#ff6b2b";
  const color = isWarning ? orange : cyan;
  const colorDim = isWarning ? "rgba(255,107,43,0.18)" : "rgba(0,229,255,0.12)";
  const colorMid = isWarning ? "rgba(255,107,43,0.45)" : "rgba(0,229,255,0.45)";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@300;400;600;700&display=swap');

        .gas-indicator-root {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          position: relative;
          user-select: none;
        }

        /* ── Tube shell ── */
        .gas-tube-wrap {
          position: relative;
          width: 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .gas-tube {
          position: relative;
          width: 36px;
          height: 140px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px 18px 14px 14px;
          overflow: hidden;
          box-shadow:
            inset 0 2px 8px rgba(0,0,0,0.5),
            0 0 0 1px rgba(255,255,255,0.04);
        }

        /* Glass sheen overlay */
        .gas-tube::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            rgba(255,255,255,0.07) 0%,
            transparent 40%,
            transparent 60%,
            rgba(255,255,255,0.03) 100%
          );
          pointer-events: none;
          z-index: 3;
          border-radius: inherit;
        }

        .gas-liquid {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          transition: height 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 1;
          border-radius: 0 0 13px 13px;
        }

        .gas-liquid-inner {
          position: absolute;
          inset: 0;
          border-radius: inherit;
        }

        /* Bubbles */
        .bubble {
          position: absolute;
          border-radius: 50%;
          animation: rise linear infinite;
          opacity: 0;
        }

        @keyframes rise {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 0.6; }
          80%  { opacity: 0.3; }
          100% { transform: translateY(-120px) scale(0.4); opacity: 0; }
        }

        /* Wave surface */
        .gas-wave {
          position: absolute;
          top: -6px;
          left: 0;
          right: 0;
          height: 12px;
          z-index: 2;
          overflow: hidden;
        }

        .gas-wave svg {
          animation: waveMove 2.4s ease-in-out infinite;
        }

        @keyframes waveMove {
          0%, 100% { transform: translateX(0); }
          50%       { transform: translateX(-40px); }
        }

        /* Tick marks */
        .gas-ticks {
          position: absolute;
          right: -16px;
          top: 0;
          bottom: 0;
          display: flex;
          flex-direction: column-reverse;
          justify-content: space-between;
          padding: 6px 0;
        }

        .gas-tick {
          display: flex;
          align-items: center;
          gap: 3px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 8px;
          color: rgba(255,255,255,0.25);
          white-space: nowrap;
        }

        .gas-tick-line {
          width: 6px;
          height: 1px;
          background: rgba(255,255,255,0.15);
        }

        /* Nozzle cap */
        .gas-nozzle {
          width: 20px;
          height: 6px;
          border-radius: 3px 3px 0 0;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          border-bottom: none;
          margin-bottom: -1px;
          position: relative;
          z-index: 2;
        }

        /* Tube glow */
        .gas-glow {
          position: absolute;
          inset: -4px;
          border-radius: 22px;
          pointer-events: none;
          transition: box-shadow 0.6s ease;
        }

        /* ── Info panel ── */
        .gas-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .gas-label {
          font-family: 'Outfit', sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
        }

        .gas-balance {
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          font-weight: 700;
          transition: color 0.5s ease;
          line-height: 1;
        }

        .gas-unit {
          font-family: 'Outfit', sans-serif;
          font-size: 10px;
          font-weight: 400;
          color: rgba(255,255,255,0.35);
          margin-top: 1px;
        }

        /* ── Warning pill ── */
        .gas-warning {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 107, 43, 0.12);
          border: 1px solid rgba(255, 107, 43, 0.35);
          border-radius: 999px;
          padding: 3px 9px;
          font-family: 'Outfit', sans-serif;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #ff6b2b;
          text-transform: uppercase;
          animation: warningPulse 2s ease-in-out infinite;
        }

        @keyframes warningPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.65; }
        }

        .gas-warning-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ff6b2b;
          box-shadow: 0 0 5px #ff6b2b;
          flex-shrink: 0;
        }

        /* ── Info / Tooltip button ── */
        .gas-info-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.4);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          line-height: 1;
          position: relative;
        }

        .gas-info-btn:hover {
          border-color: rgba(0,229,255,0.5);
          color: #00e5ff;
          background: rgba(0,229,255,0.08);
          box-shadow: 0 0 10px rgba(0,229,255,0.2);
        }

        /* ── Tooltip ── */
        .gas-tooltip {
          position: absolute;
          left: calc(100% + 14px);
          top: 50%;
          transform: translateY(-50%);
          width: 220px;
          background: rgba(8, 8, 18, 0.97);
          border: 1px solid rgba(0,229,255,0.2);
          border-radius: 12px;
          padding: 12px 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
          pointer-events: none;
          z-index: 100;
          opacity: 0;
          transform: translateY(-50%) translateX(-6px);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .gas-tooltip {
            background: rgba(8, 8, 18, 0.95);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .gas-tooltip {
            transition: none;
            transform: translateY(-50%) translateX(0);
          }
        }

        .gas-tooltip.visible {
          opacity: 1;
          transform: translateY(-50%) translateX(0);
        }

        .gas-tooltip::before {
          content: '';
          position: absolute;
          left: -5px;
          top: 50%;
          transform: translateY(-50%) rotate(45deg);
          width: 8px;
          height: 8px;
          background: rgba(8, 8, 18, 0.95);
          border-left: 1px solid rgba(0,229,255,0.2);
          border-bottom: 1px solid rgba(0,229,255,0.2);
        }

        .tooltip-title {
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #00e5ff;
          letter-spacing: 0.06em;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .tooltip-body {
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          font-weight: 400;
          color: rgba(232, 234, 246, 0.65);
          line-height: 1.55;
        }

        .tooltip-body strong {
          color: rgba(232, 234, 246, 0.9);
          font-weight: 600;
        }

        .tooltip-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 8px 0;
        }

        .tooltip-threshold {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: rgba(255, 107, 43, 0.8);
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .tooltip-threshold::before {
          content: '⚠';
          font-size: 9px;
        }
      `}</style>

      <div className="gas-indicator-root">
        {/* Tube */}
        <div className="gas-tube-wrap">
          {/* Glow halo */}
          <div
            className="gas-glow"
            style={{
              boxShadow: animatedFill > 0
                ? `0 0 ${isWarning ? 20 : 28}px ${isWarning ? "rgba(255,107,43,0.25)" : "rgba(0,229,255,0.2)"}`
                : "none",
            }}
          />

          {/* Nozzle cap */}
          <div className="gas-nozzle" />

          {/* Main tube */}
          <div className="gas-tube">
            {/* Liquid fill */}
            <div
              className="gas-liquid"
              style={{ height: `${animatedFill}%` }}
            >
              {/* Body gradient */}
              <div
                className="gas-liquid-inner"
                style={{
                  background: isWarning
                    ? `linear-gradient(to top, rgba(200,60,10,0.9), rgba(255,107,43,0.7))`
                    : `linear-gradient(to top, rgba(0,160,200,0.9), rgba(0,229,255,0.7))`,
                  transition: "background 0.6s ease",
                }}
              />

              {/* Bubbles */}
              {[
                { left: "30%", size: 4, delay: "0s", duration: "3.2s" },
                { left: "55%", size: 3, delay: "1.1s", duration: "2.5s" },
                { left: "20%", size: 2.5, delay: "0.5s", duration: "4s" },
                { left: "70%", size: 3.5, delay: "1.8s", duration: "3s" },
              ].map((b, i) => (
                <div
                  key={i}
                  className="bubble"
                  style={{
                    left: b.left,
                    bottom: "8%",
                    width: b.size,
                    height: b.size,
                    background: isWarning
                      ? "rgba(255,200,150,0.6)"
                      : "rgba(200,255,255,0.6)",
                    animationDelay: b.delay,
                    animationDuration: b.duration,
                  }}
                />
              ))}

              {/* Wave surface */}
              <div className="gas-wave">
                <svg
                  width="80"
                  height="12"
                  viewBox="0 0 80 12"
                  preserveAspectRatio="none"
                  style={{ width: "200%", display: "block" }}
                >
                  <path
                    d="M0 6 Q10 0 20 6 Q30 12 40 6 Q50 0 60 6 Q70 12 80 6 L80 12 L0 12 Z"
                    fill={isWarning ? "rgba(255,107,43,0.7)" : "rgba(0,229,255,0.6)"}
                  />
                </svg>
              </div>
            </div>

            {/* Tick marks (inside tube overlay) */}
            <div className="gas-ticks">
              {[0, 5, 10, 15, 20].map((v) => (
                <div className="gas-tick" key={v}>
                  <div className="gas-tick-line" />
                  {v}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Balance info */}
        <div className="gas-info">
          <span className="gas-label">Gas</span>
          <span
            className="gas-balance"
            style={{ color }}
          >
            {balance.toFixed(2)}
          </span>
          <span className="gas-unit">XLM</span>
        </div>

        {/* Warning pill */}
        {isWarning && (
          <div className="gas-warning">
            <div className="gas-warning-dot" />
            Low Balance
          </div>
        )}

        {/* Info / tooltip trigger */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <button
            className="gas-info-btn"
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            onFocus={() => setTooltipVisible(true)}
            onBlur={() => setTooltipVisible(false)}
            aria-label="XLM gas info"
            aria-describedby="gas-tooltip"
          >
            ?
          </button>

          <div
            id="gas-tooltip"
            ref={tooltipRef}
            className={`gas-tooltip${tooltipVisible ? " visible" : ""}`}
            role="tooltip"
          >
            <div className="tooltip-title">
              ⬡ XLM Required for Gas
            </div>
            <div className="tooltip-body">
              <strong>XLM</strong> is Stellar's native asset, used to pay
              transaction fees and cover <strong>Soroban storage rent</strong> —
              the cost of persisting smart contract state on-chain.
            </div>
            <div className="tooltip-divider" />
            <div className="tooltip-body">
              Each account must maintain a <strong>minimum reserve</strong> and
              enough XLM to fund ongoing contract operations.
            </div>
            <div className="tooltip-divider" />
            <div className="tooltip-threshold">
              Below {warningThreshold} XLM — top up soon
            </div>
          </div>
        </div>
      </div>
    </>
  );
}