"use client";

import { useState, useRef, ReactNode } from "react";

interface CopyRippleProps {
  address: string;
  label?: string;
  onCopy?: () => void;
  className?: string;
  children?: ReactNode;
}

export default function CopyRipple({
  address,
  label = "G-Address",
  onCopy,
  className = "",
  children,
}: CopyRippleProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Get click position relative to card
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Add ripple
      const id = rippleIdRef.current++;
      setRipples((prev) => [...prev, { x, y, id }]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
      }, 800);
    }

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      onCopy?.();

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <>
      <style>{`
        .copy-ripple-card {
          position: relative;
          background: rgba(10, 10, 20, 0.90);
          border: 1px solid rgba(100, 100, 120, 0.3);
          border-radius: 16px;
          padding: 20px 24px;
          overflow: hidden;
          font-family: 'Syne', sans-serif;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .copy-ripple-card {
            background: rgba(10, 10, 20, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
        }

        .copy-ripple-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .copy-ripple-info {
          flex: 1;
          min-width: 0;
        }

        .copy-ripple-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(232, 234, 246, 0.5);
          margin-bottom: 6px;
        }

        .copy-ripple-address {
          font-size: 16px;
          font-weight: 600;
          font-family: 'Courier New', monospace;
          color: #e8eaf6;
          word-break: break-all;
        }

        .copy-ripple-button {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 12px;
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          position: relative;
        }

        .copy-ripple-button:hover {
          background: rgba(0, 229, 255, 0.2);
          border-color: rgba(0, 229, 255, 0.5);
          transform: scale(1.05);
        }

        .copy-ripple-button:active {
          transform: scale(0.95);
        }

        .copy-ripple-button.copied {
          background: rgba(0, 255, 136, 0.2);
          border-color: rgba(0, 255, 136, 0.5);
        }

        .copy-ripple-icon {
          width: 20px;
          height: 20px;
          color: #00e5ff;
          transition: color 0.2s ease;
        }

        .copy-ripple-button.copied .copy-ripple-icon {
          color: #00ff88;
        }

        .copy-ripple-button:focus-visible {
          outline: 2px solid #00e5ff;
          outline-offset: 2px;
        }

        /* Ripple effect */
        .ripple {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(0, 229, 255, 0.6) 0%,
            rgba(0, 229, 255, 0.3) 30%,
            rgba(0, 229, 255, 0.1) 60%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 1;
          animation: ripple-expand 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes ripple-expand {
          0% {
            width: 0;
            height: 0;
            opacity: 1;
          }
          100% {
            width: 600px;
            height: 600px;
            opacity: 0;
          }
        }

        /* Tooltip */
        .copy-ripple-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          right: 0;
          background: rgba(0, 229, 255, 0.95);
          color: #0a0a14;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: none;
          animation: tooltip-fade-in 0.2s ease;
        }

        .copy-ripple-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          right: 12px;
          border: 4px solid transparent;
          border-top-color: rgba(0, 229, 255, 0.95);
        }

        @keyframes tooltip-fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .copy-ripple-card {
            padding: 16px 20px;
          }

          .copy-ripple-address {
            font-size: 14px;
          }

          .copy-ripple-button {
            width: 40px;
            height: 40px;
          }

          .copy-ripple-icon {
            width: 18px;
            height: 18px;
          }
        }
      `}</style>

      <div ref={cardRef} className={`copy-ripple-card ${className}`}>
        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Content */}
        <div className="copy-ripple-content">
          <div className="copy-ripple-info">
            <div className="copy-ripple-label">{label}</div>
            <div className="copy-ripple-address">
              {children || formatAddress(address)}
            </div>
          </div>

          <button
            className={`copy-ripple-button ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            aria-label={copied ? 'Copied!' : 'Copy address'}
          >
            {copied ? (
              <svg
                className="copy-ripple-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="copy-ripple-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
            {copied && <div className="copy-ripple-tooltip">Copied!</div>}
          </button>
        </div>
      </div>
    </>
  );
}
