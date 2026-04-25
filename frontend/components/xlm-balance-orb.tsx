"use client";

import { useState, useEffect } from "react";

import { AssetPrice } from "./AssetPrice";

interface XLMBalanceOrbProps {
  balance: number;
  threshold?: number;
  onBridgeClick?: () => void;
  position?: "bottom-left" | "bottom-right";
}

export default function XLMBalanceOrb({
  balance,
  threshold = 5,
  onBridgeClick,
  position = "bottom-right",
}: XLMBalanceOrbProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const isLowBalance = balance < threshold;

  useEffect(() => {
    setIsVisible(isLowBalance);
  }, [isLowBalance]);

  if (!isVisible) return null;

  const positionStyles = {
    "bottom-left": { bottom: "24px", left: "24px" },
    "bottom-right": { bottom: "24px", right: "24px" },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700&display=swap');

        @keyframes orb-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 
              0 0 20px rgba(255, 165, 0, 0.4),
              0 0 40px rgba(255, 165, 0, 0.2),
              0 4px 20px rgba(0, 0, 0, 0.3);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 
              0 0 30px rgba(255, 165, 0, 0.6),
              0 0 60px rgba(255, 165, 0, 0.3),
              0 4px 20px rgba(0, 0, 0, 0.3);
          }
        }

        @keyframes orb-glow {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes bubble-expand {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes float-gentle {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .xlm-orb-container {
          position: fixed;
          z-index: 9999;
          font-family: 'Syne', sans-serif;
        }

        .xlm-orb {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 165, 0, 0.9), rgba(255, 140, 0, 0.9));
          border: 2px solid rgba(255, 200, 100, 0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          animation: orb-pulse 2s ease-in-out infinite, float-gentle 3s ease-in-out infinite;
          transition: all 0.3s ease;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .xlm-orb:hover {
          transform: scale(1.1);
          box-shadow: 
            0 0 40px rgba(255, 165, 0, 0.7),
            0 0 80px rgba(255, 165, 0, 0.4),
            0 4px 30px rgba(0, 0, 0, 0.4);
        }

        .xlm-orb::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255, 200, 100, 0.3), transparent 60%);
          animation: orb-glow 2s ease-in-out infinite;
          pointer-events: none;
        }

        .orb-icon {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .xlm-bubble {
          position: absolute;
          bottom: 70px;
          width: 320px;
          background: rgba(10, 10, 20, 0.95);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 165, 0, 0.3);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 
            0 0 0 1px rgba(255, 165, 0, 0.1),
            0 8px 40px rgba(0, 0, 0, 0.6),
            0 0 60px rgba(255, 165, 0, 0.1) inset;
          animation: bubble-expand 0.3s ease-out;
          color: #e8eaf6;
        }

        .xlm-bubble.position-left {
          left: 0;
        }

        .xlm-bubble.position-right {
          right: 0;
        }

        .xlm-bubble::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 20% 20%, rgba(255, 165, 0, 0.08) 0%, transparent 50%);
          border-radius: 20px;
          pointer-events: none;
        }

        .bubble-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .warning-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 165, 0, 0.2), rgba(255, 140, 0, 0.2));
          border: 1px solid rgba(255, 165, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .bubble-title {
          font-size: 16px;
          font-weight: 700;
          color: #ffa500;
          letter-spacing: 0.02em;
        }

        .bubble-balance {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin: 12px 0;
          padding: 12px;
          background: rgba(255, 165, 0, 0.08);
          border: 1px solid rgba(255, 165, 0, 0.2);
          border-radius: 12px;
        }

        .balance-label {
          font-size: 11px;
          color: rgba(232, 234, 246, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .balance-value {
          font-family: 'Space Mono', monospace;
          font-size: 20px;
          font-weight: 700;
          color: #ffa500;
        }

        .balance-unit {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          color: rgba(255, 165, 0, 0.7);
        }

        .bubble-message {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(232, 234, 246, 0.75);
          margin-bottom: 14px;
        }

        .bubble-actions {
          display: flex;
          gap: 8px;
        }

        .bubble-button {
          flex: 1;
          padding: 10px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.25s ease;
          border: none;
          font-family: 'Syne', sans-serif;
        }

        .button-primary {
          background: linear-gradient(135deg, rgba(255, 165, 0, 0.9), rgba(255, 140, 0, 0.9));
          color: #0a0a14;
          border: 1px solid rgba(255, 200, 100, 0.4);
        }

        .button-primary:hover {
          background: linear-gradient(135deg, rgba(255, 180, 0, 1), rgba(255, 160, 0, 1));
          box-shadow: 0 0 20px rgba(255, 165, 0, 0.4);
          transform: translateY(-2px);
        }

        .button-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(232, 234, 246, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .button-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .close-button {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(232, 234, 246, 0.5);
          font-size: 14px;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(232, 234, 246, 0.9);
        }

        @media (max-width: 768px) {
          .xlm-bubble {
            width: 280px;
          }

          .xlm-orb {
            width: 48px;
            height: 48px;
          }

          .orb-icon {
            font-size: 20px;
          }
        }
      `}</style>

      <div
        className="xlm-orb-container"
        style={positionStyles[position]}
        role="alert"
        aria-live="polite"
      >
        {/* Orb */}
        <div
          className="xlm-orb"
          onClick={() => setIsExpanded(!isExpanded)}
          role="button"
          aria-label={`Low XLM balance warning. Current balance: ${balance.toFixed(2)} XLM. Click to learn more.`}
          tabIndex={0}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }
          }}
        >
          <span className="orb-icon" aria-hidden="true">⚠️</span>
        </div>

        {/* Expanded Bubble */}
        {isExpanded && (
          <div
            className={`xlm-bubble position-${position === "bottom-left" ? "left" : "right"}`}
            role="dialog"
            aria-labelledby="xlm-warning-title"
          >
            <button
              className="close-button"
              onClick={() => setIsExpanded(false)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="bubble-header">
              <div className="warning-icon" aria-hidden="true">⚠️</div>
              <div className="bubble-title" id="xlm-warning-title">
                Low XLM Balance
              </div>
            </div>

            <div className="bubble-balance">
              <AssetPrice amount={balance} assetCode="XLM" />
            </div>

            <div className="bubble-message">
              Your XLM balance is running low. You need XLM to cover Soroban storage rent and transaction fees. Bridge more XLM to continue using the platform.
            </div>

            <div className="bubble-actions">
              <button
                className="bubble-button button-primary"
                onClick={() => {
                  onBridgeClick?.();
                  setIsExpanded(false);
                }}
              >
                Bridge XLM
              </button>
              <button
                className="bubble-button button-secondary"
                onClick={() => setIsExpanded(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
