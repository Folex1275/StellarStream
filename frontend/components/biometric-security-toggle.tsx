"use client";

import { useState } from "react";

interface BiometricSecurityToggleProps {
  label?: string;
  defaultEnabled?: boolean;
  onChange?: (enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
  variant?: "thumbprint" | "retina";
}

export default function BiometricSecurityToggle({
  label = "Private Mode",
  defaultEnabled = false,
  onChange,
  disabled = false,
  className = "",
  variant = "thumbprint",
}: BiometricSecurityToggleProps) {
  const [isEnabled, setIsEnabled] = useState(defaultEnabled);

  const handleToggle = () => {
    if (disabled) return;
    const newState = !isEnabled;
    setIsEnabled(newState);
    onChange?.(newState);
  };

  return (
    <>
      <style>{`
        @keyframes scan-lines {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(0, 255, 136, 0.6);
          }
        }

        @keyframes thumbprint-rotate {
          0% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.05);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }

        .biometric-toggle {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
          border: 2px solid;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .biometric-toggle {
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
        }

        .biometric-toggle.disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .biometric-toggle.inactive {
          background: rgba(30, 30, 40, 0.6);
          border-color: rgba(100, 100, 120, 0.3);
        }

        .biometric-toggle.active {
          background: rgba(0, 255, 136, 0.1);
          border-color: rgba(0, 255, 136, 0.5);
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .biometric-toggle:not(.disabled):hover {
          transform: scale(1.05);
        }

        .scan-lines-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .biometric-toggle.active .scan-lines-container {
          opacity: 1;
        }

        .scan-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(0, 255, 136, 0.8) 50%, 
            transparent 100%
          );
          animation: scan-lines 2s linear infinite;
        }

        .scan-line:nth-child(2) {
          animation-delay: 0.5s;
          opacity: 0.6;
        }

        .scan-line:nth-child(3) {
          animation-delay: 1s;
          opacity: 0.4;
        }

        .biometric-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          transition: all 0.3s ease;
        }

        .biometric-toggle.active .biometric-icon {
          animation: thumbprint-rotate 3s ease-in-out infinite;
        }

        .thumbprint-icon {
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: stroke 0.3s ease;
        }

        .biometric-toggle.inactive .thumbprint-icon {
          stroke: rgba(150, 150, 170, 0.6);
        }

        .biometric-toggle.active .thumbprint-icon {
          stroke: #00ff88;
        }

        .retina-icon {
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: all 0.3s ease;
        }

        .biometric-toggle.inactive .retina-icon {
          stroke: rgba(150, 150, 170, 0.6);
        }

        .biometric-toggle.active .retina-icon {
          stroke: #00ff88;
        }

        .status-indicator {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: color 0.3s ease;
        }

        .biometric-toggle.inactive .status-indicator {
          color: rgba(150, 150, 170, 0.8);
        }

        .biometric-toggle.active .status-indicator {
          color: #00ff88;
        }

        .toggle-label {
          margin-top: 12px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: rgba(232, 234, 246, 0.9);
        }
      `}</style>

      <div className={className}>
        <div
          className={`biometric-toggle ${isEnabled ? 'active' : 'inactive'} ${disabled ? 'disabled' : ''}`}
          onClick={handleToggle}
          role="switch"
          aria-checked={isEnabled}
          aria-label={label}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          }}
        >
          {/* Scan Lines */}
          <div className="scan-lines-container">
            <div className="scan-line" />
            <div className="scan-line" />
            <div className="scan-line" />
          </div>

          {/* Biometric Icon */}
          <div className="biometric-icon">
            {variant === "thumbprint" ? (
              <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                <path
                  className="thumbprint-icon"
                  d="M30 10 C20 10 15 15 15 25 C15 35 20 45 30 50 C40 45 45 35 45 25 C45 15 40 10 30 10 Z"
                />
                <path
                  className="thumbprint-icon"
                  d="M30 15 C23 15 20 18 20 25 C20 32 23 40 30 45"
                />
                <path
                  className="thumbprint-icon"
                  d="M30 20 C26 20 25 22 25 25 C25 30 27 35 30 40"
                />
                <path
                  className="thumbprint-icon"
                  d="M35 25 C35 22 33 20 30 20"
                />
                <path
                  className="thumbprint-icon"
                  d="M40 25 C40 20 37 15 30 15"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                <ellipse
                  className="retina-icon"
                  cx="30"
                  cy="30"
                  rx="20"
                  ry="15"
                />
                <ellipse
                  className="retina-icon"
                  cx="30"
                  cy="30"
                  rx="12"
                  ry="9"
                />
                <circle
                  className="retina-icon"
                  cx="30"
                  cy="30"
                  r="5"
                />
                <line
                  className="retina-icon"
                  x1="10"
                  y1="30"
                  x2="20"
                  y2="30"
                />
                <line
                  className="retina-icon"
                  x1="40"
                  y1="30"
                  x2="50"
                  y2="30"
                />
              </svg>
            )}
          </div>

          {/* Status Indicator */}
          <div className="status-indicator">
            {isEnabled ? 'ACTIVE' : 'INACTIVE'}
          </div>
        </div>

        {label && <div className="toggle-label">{label}</div>}
      </div>
    </>
  );
}
