"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Yield Mode Toggle Switch Component
 * Issue #422 - "Yield-Mode" Toggle Switch
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A custom "Glass-style" toggle switch for enabling yield on streams.
 * Features:
 * - Glass morphism design with blur effects
 * - "Estimated APY" tooltip fetched from backend
 * - "Yield Recipient" dropdown (Sender/Receiver/Split)
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Info, ChevronDown, Percent, ArrowDownUp } from "lucide-react";

// Yield recipient options
export type YieldRecipient = "sender" | "receiver" | "split";

interface YieldModeToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  recipient: YieldRecipient;
  onRecipientChange: (recipient: YieldRecipient) => void;
  estimatedApy?: number;
  isLoadingApy?: boolean;
  disabled?: boolean;
}

export default function YieldModeToggle({
  enabled,
  onEnabledChange,
  recipient,
  onRecipientChange,
  estimatedApy,
  isLoadingApy = false,
  disabled = false,
}: YieldModeToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const recipientLabels: Record<YieldRecipient, string> = {
    sender: "Sender",
    receiver: "Receiver",
    split: "50/50 Split",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

        .yield-mode-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          font-family: 'Outfit', sans-serif;
        }

        /* Toggle Row */
        .yield-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: rgba(10, 10, 20, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .yield-toggle-row {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
        }

        .yield-toggle-row.active {
          background: linear-gradient(135deg, rgba(138, 0, 255, 0.08) 0%, rgba(0, 245, 255, 0.08) 100%);
          border-color: rgba(138, 0, 255, 0.2);
        }

        .yield-toggle-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .yield-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(138, 0, 255, 0.15), rgba(0, 245, 255, 0.15));
          border: 1px solid rgba(138, 0, 255, 0.2);
        }

        .yield-label-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .yield-title {
          font-size: 14px;
          font-weight: 600;
          color: white;
          letter-spacing: 0.02em;
        }

        .yield-subtitle {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Glass Toggle Switch */
        .glass-toggle {
          position: relative;
          width: 56px;
          height: 30px;
          cursor: pointer;
        }

        .glass-toggle.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle-track {
          position: absolute;
          inset: 0;
          border-radius: 15px;
          background: rgba(30, 30, 46, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          transition: all 0.3s ease;
          overflow: hidden;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .toggle-track {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
        }

        .toggle-track::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%);
          opacity: 0.5;
        }

        .toggle-track.active {
          background: linear-gradient(135deg, rgba(138, 0, 255, 0.6) 0%, rgba(0, 245, 255, 0.6) 100%);
          border-color: rgba(138, 0, 255, 0.4);
          box-shadow: 0 0 20px rgba(138, 0, 255, 0.3);
        }

        .toggle-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.2),
            inset 0 1px 2px rgba(255, 255, 255, 0.8);
          transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .toggle-knob.active {
          transform: translateX(26px);
        }

        /* Glass shine effect */
        .toggle-knob::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.8);
        }

        /* APY Display */
        .apy-display {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
        }

        .apy-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.15), rgba(0, 255, 136, 0.05));
          border: 1px solid rgba(0, 255, 136, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00ff88;
          position: relative;
        }

        .apy-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .apy-label {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.35);
        }

        .apy-value {
          font-size: 16px;
          font-weight: 700;
          color: #00ff88;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .apy-loading {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Info Icon with Tooltip */
        .info-button {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.4);
          cursor: help;
          font-size: 11px;
          font-weight: 600;
          transition: all 0.2s;
          position: relative;
        }

        .info-button:hover {
          background: rgba(0, 255, 136, 0.1);
          border-color: rgba(0, 255, 136, 0.3);
          color: #00ff88;
        }

        .apy-tooltip {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 220px;
          padding: 14px;
          background: rgba(10, 10, 20, 0.97);
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          opacity: 0;
          transform: translateY(-8px);
          pointer-events: none;
          transition: all 0.2s ease;
          z-index: 100;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .apy-tooltip {
            background: rgba(10, 10, 20, 0.95);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }
        }

        .apy-tooltip.visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .tooltip-title {
          font-size: 11px;
          font-weight: 600;
          color: #00ff88;
          margin-bottom: 8px;
        }

        .tooltip-text {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.5;
        }

        /* Yield Recipient Dropdown */
        .recipient-dropdown {
          position: relative;
        }

        .recipient-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Outfit', sans-serif;
        }

        .recipient-button:hover {
          border-color: rgba(138, 0, 255, 0.3);
        }

        .recipient-button.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .recipient-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .recipient-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(138, 0, 255, 0.1);
          border: 1px solid rgba(138, 0, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8a00ff;
        }

        .recipient-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .recipient-value {
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .recipient-chevron {
          color: rgba(255, 255, 255, 0.3);
          transition: transform 0.2s;
        }

        .recipient-chevron.open {
          transform: rotate(180deg);
        }

        /* Dropdown Menu */
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: rgba(10, 10, 20, 0.97);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          opacity: 0;
          transform: translateY(-8px);
          pointer-events: none;
          transition: all 0.2s ease;
          z-index: 100;
        }

        @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
          .dropdown-menu {
            background: rgba(10, 10, 20, 0.95);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .yield-toggle-row,
          .toggle-track,
          .toggle-knob,
          .recipient-button,
          .recipient-chevron,
          .bubble-button,
          .info-button {
            transition: none;
          }
          .apy-tooltip,
          .dropdown-menu {
            transition: none;
            transform: none;
          }
        }

        .dropdown-menu.open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .dropdown-item.selected {
          background: rgba(138, 0, 255, 0.1);
        }

        .dropdown-item-text {
          font-size: 14px;
          color: white;
        }

        .dropdown-check {
          color: #00ff88;
          margin-left: auto;
        }
      `}</style>

      <div className="yield-mode-container">
        {/* Toggle Row */}
        <div className={`yield-toggle-row ${enabled ? "active" : ""}`}>
          <div className="yield-toggle-left">
            <div className="yield-icon">
              <TrendingUp className="w-5 h-5 text-[#8a00ff]" />
            </div>
            <div className="yield-label-group">
              <span className="yield-title">Enable Yield</span>
              <span className="yield-subtitle">Move funds into yield-generating vault</span>
            </div>
          </div>

          <button
            className={`glass-toggle ${disabled ? "disabled" : ""}`}
            onClick={() => !disabled && onEnabledChange(!enabled)}
            disabled={disabled}
            aria-pressed={enabled}
          >
            <div className={`toggle-track ${enabled ? "active" : ""}`}>
              <motion.div
                className={`toggle-knob ${enabled ? "active" : ""}`}
                layout
                transition={{
                  type: "spring",
                  stiffness: 700,
                  damping: 30,
                }}
              />
            </div>
          </button>
        </div>

        {/* APY Display (when enabled) */}
        <AnimatePresence>
          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="apy-display">
                <div className="apy-icon">
                  <Percent className="w-4 h-4" />
                </div>
                <div className="apy-info">
                  <span className="apy-label">Estimated APY</span>
                  {isLoadingApy ? (
                    <span className="apy-loading">Loading...</span>
                  ) : (
                    <span className="apy-value">
                      {estimatedApy?.toFixed(2) || "4.5"}%
                      <button
                        className="info-button"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        aria-label="APY info"
                      >
                        ?
                        <div className={`apy-tooltip ${showTooltip ? "visible" : ""}`}>
                          <div className="tooltip-title">How APY is calculated</div>
                          <div className="tooltip-text">
                            APY is estimated based on current vault performance and market conditions. 
                            Actual yield may vary.
                          </div>
                        </div>
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Yield Recipient Dropdown (when enabled) */}
        <AnimatePresence>
          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="recipient-dropdown">
                <button
                  className={`recipient-button ${disabled ? "disabled" : ""}`}
                  onClick={() => !disabled && setShowDropdown(!showDropdown)}
                  disabled={disabled}
                  aria-expanded={showDropdown}
                >
                  <div className="recipient-left">
                    <div className="recipient-icon">
                      <ArrowDownUp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="recipient-label">Yield Recipient</div>
                      <div className="recipient-value">{recipientLabels[recipient]}</div>
                    </div>
                  </div>
                  <ChevronDown className={`recipient-chevron ${showDropdown ? "open" : ""}`} />
                </button>

                <div className={`dropdown-menu ${showDropdown ? "open" : ""}`}>
                  {(["sender", "receiver", "split"] as YieldRecipient[]).map((option) => (
                    <div
                      key={option}
                      className={`dropdown-item ${recipient === option ? "selected" : ""}`}
                      onClick={() => {
                        onRecipientChange(option);
                        setShowDropdown(false);
                      }}
                    >
                      <span className="dropdown-item-text">{recipientLabels[option]}</span>
                      {recipient === option && (
                        <span className="dropdown-check">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}