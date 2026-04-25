"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Gas Tank Component
 * Issue #428 - "Gas Tank" (XLM Balance) Indicator
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A persistent sidebar element that monitors the user's native XLM balance.
 * Shows a "Fuel Gauge" and warns when balance < 5 XLM with a refill link.
 * 
 * Features:
 * - Real-time XLM balance display
 * - Visual fuel gauge with animated liquid
 * - "Cosmic Red" warning state when balance < 5 XLM
 * - Refill links to LOBSTR/Binance swap pages
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Wallet, AlertTriangle, X, Sparkles } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import { GasTankAdvisor } from "./dashboard/GasTankAdvisor";

// Refill links for different exchanges
const REFILL_LINKS = {
  lobstr: "https://lobstr.co/swap",
  binance: "https://www.binance.com/en/trade/XLM_USDT",
  stellarX: "https://stellarswap.io",
};

interface GasTankProps {
  maxDisplay?: number;
  warningThreshold?: number;
  position?: "sidebar" | "floating";
}

export default function GasTank({
  maxDisplay = 20,
  warningThreshold = 5,
  position = "sidebar",
}: GasTankProps) {
  const { address, isConnected } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showAdvisor, setShowAdvisor] = useState(false);

  // Fetch XLM balance
  const fetchBalance = useCallback(async () => {
    if (!address) {
      setBalance(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In production, this would use stellar-sdk to fetch the balance
      // For now, we'll simulate a balance check
      // const server = new Stellar.Server("https://horizon-testnet.stellar.org");
      // const account = await server.loadAccount(address);
      // const xlmBalance = account.balances.find(b => b.asset_type === "native");
      
      // Mock balance for demo
      const mockBalance = 3.42; // Simulated low balance
      setBalance(mockBalance);
    } catch (err) {
      console.error("Failed to fetch XLM balance:", err);
      setError("Failed to fetch balance");
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Fetch balance on mount and when address changes
  useEffect(() => {
    fetchBalance();
    
    // Poll balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  const isLowBalance = balance < warningThreshold;
  const fillPercent = Math.min((balance / maxDisplay) * 100, 100);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

        .gas-tank-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          font-family: 'Outfit', sans-serif;
        }

        .gas-tank-header {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .gas-tank-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .gas-tank-icon.normal {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 229, 255, 0.1));
          border: 1px solid rgba(0, 229, 255, 0.3);
        }

        .gas-tank-icon.low {
          background: linear-gradient(135deg, rgba(255, 107, 43, 0.2), rgba(255, 107, 43, 0.1));
          border: 1px solid rgba(255, 107, 43, 0.3);
          animation: pulse-warning 2s ease-in-out infinite;
        }

        @keyframes pulse-warning {
          0%, 100% { box-shadow: 0 0 10px rgba(255, 107, 43, 0.2); }
          50% { box-shadow: 0 0 20px rgba(255, 107, 43, 0.4); }
        }

        .gas-tank-title {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Gauge */
        .gauge-container {
          position: relative;
          width: 32px;
          height: 120px;
        }

        .gauge-tube {
          position: relative;
          width: 32px;
          height: 120px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px 16px 12px 12px;
          overflow: hidden;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        .gauge-liquid {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          transition: height 1s cubic-bezier(0.34, 1.56, 0.64, 1);
          border-radius: 0 0 11px 11px;
        }

        .gauge-liquid.normal {
          background: linear-gradient(to top, rgba(0, 160, 200, 0.9), rgba(0, 229, 255, 0.7));
        }

        .gauge-liquid.low {
          background: linear-gradient(to top, rgba(200, 60, 10, 0.9), rgba(255, 107, 43, 0.7));
        }

        .gauge-liquid::after {
          content: '';
          position: absolute;
          top: -6px;
          left: 0;
          right: 0;
          height: 12px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.3), transparent);
          border-radius: 50%;
        }

        .gauge-glow {
          position: absolute;
          inset: -4px;
          border-radius: 20px;
          pointer-events: none;
          transition: box-shadow 0.6s ease;
        }

        .gauge-glow.normal {
          box-shadow: 0 0 15px rgba(0, 229, 255, 0.2);
        }

        .gauge-glow.low {
          box-shadow: 0 0 20px rgba(255, 107, 43, 0.3);
        }

        /* Balance Display */
        .balance-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .balance-value {
          font-family: 'Space Mono', monospace;
          font-size: 20px;
          font-weight: 700;
          transition: color 0.3s ease;
        }

        .balance-value.normal {
          color: #00e5ff;
        }

        .balance-value.low {
          color: #ff6b2b;
        }

        .balance-unit {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.05em;
        }

        /* Warning Badge */
        .warning-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .warning-badge {
          background: rgba(255, 107, 43, 0.1);
          border: 1px solid rgba(255, 107, 43, 0.3);
          color: #ff6b2b;
        }

        .warning-badge:hover {
          background: rgba(255, 107, 43, 0.2);
          transform: scale(1.02);
        }

        /* Refill Modal */
        .refill-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .refill-modal {
          background: rgba(10, 10, 20, 0.95);
          border: 1px solid rgba(255, 107, 43, 0.3);
          border-radius: 20px;
          padding: 24px;
          max-width: 360px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #ff6b2b;
        }

        .modal-close {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.5);
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .refill-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          color: inherit;
        }

        .refill-option:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 107, 43, 0.3);
          transform: translateY(-2px);
        }

        .refill-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(255, 107, 43, 0.2), rgba(255, 107, 43, 0.1));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .refill-info {
          flex: 1;
        }

        .refill-name {
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .refill-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .refill-arrow {
          color: rgba(255, 255, 255, 0.3);
        }

        .modal-warning {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          background: rgba(255, 107, 43, 0.05);
          border: 1px solid rgba(255, 107, 43, 0.15);
          border-radius: 10px;
          margin-top: 8px;
        }

        .modal-warning-icon {
          color: #ff6b2b;
          flex-shrink: 0;
        }

        .modal-warning-text {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.5;
        }
      `}</style>

      <div className="gas-tank-container">
        {/* Header */}
        <div className="gas-tank-header">
          <div className={`gas-tank-icon ${isLowBalance ? "low" : "normal"}`}>
            <Wallet className={`w-5 h-5 ${isLowBalance ? "text-[#ff6b2b]" : "text-[#00e5ff]"}`} />
          </div>
          <span className="gas-tank-title">Gas Tank</span>
          <button 
            onClick={() => setShowAdvisor(true)}
            className="ml-auto p-1.5 rounded-lg bg-white/5 border border-white/10 text-cyan-400/60 hover:text-cyan-400 hover:bg-white/10 transition-all"
            title="Gas Tank Advisor"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Gauge */}
        <div className="gauge-container">
          <div className={`gauge-glow ${isLowBalance ? "low" : "normal"}`} />
          <div className="gauge-tube">
            <motion.div
              className={`gauge-liquid ${isLowBalance ? "low" : "normal"}`}
              initial={{ height: 0 }}
              animate={{ height: `${fillPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Balance Display */}
        <div className="balance-display">
          <span className={`balance-value ${isLowBalance ? "low" : "normal"}`}>
            {isLoading ? "..." : balance.toFixed(2)}
          </span>
          <span className="balance-unit">XLM</span>
        </div>

        {/* Warning Badge - Cosmic Red */}
        <AnimatePresence>
          {isLowBalance && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="warning-badge"
              onClick={() => setShowRefillModal(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setShowRefillModal(true);
                }
              }}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Low Balance</span>
              <ExternalLink className="w-3 h-3" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Refill Modal */}
      <AnimatePresence>
        {showRefillModal && (
          <motion.div
            className="refill-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRefillModal(false)}
          >
            <motion.div
              className="refill-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">Refill XLM</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowRefillModal(false)}
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="modal-body">
                <a
                  href={REFILL_LINKS.lobstr}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="refill-option"
                >
                  <div className="refill-icon">
                    <Wallet className="w-5 h-5 text-[#ff6b2b]" />
                  </div>
                  <div className="refill-info">
                    <div className="refill-name">LOBSTR Wallet</div>
                    <div className="refill-desc">Buy XLM directly</div>
                  </div>
                  <ExternalLink className="refill-arrow w-4 h-4" />
                </a>

                <a
                  href={REFILL_LINKS.binance}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="refill-option"
                >
                  <div className="refill-icon">
                    <Wallet className="w-5 h-5 text-[#ff6b2b]" />
                  </div>
                  <div className="refill-info">
                    <div className="refill-name">Binance</div>
                    <div className="refill-desc">Trade XLM/USDT</div>
                  </div>
                  <ExternalLink className="refill-arrow w-4 h-4" />
                </a>

                <a
                  href={REFILL_LINKS.stellarX}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="refill-option"
                >
                  <div className="refill-icon">
                    <Wallet className="w-5 h-5 text-[#ff6b2b]" />
                  </div>
                  <div className="refill-info">
                    <div className="refill-name">StellarSwap</div>
                    <div className="refill-desc">Decentralized swap</div>
                  </div>
                  <ExternalLink className="refill-arrow w-4 h-4" />
                </a>

                <div className="modal-warning">
                  <AlertTriangle className="modal-warning-icon w-4 h-4" />
                  <p className="modal-warning-text">
                    You need at least 5 XLM for Soroban storage rent and transaction fees.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GasTankAdvisor 
        isOpen={showAdvisor}
        onClose={() => setShowAdvisor(false)}
        currentBalanceXlm={balance}
        onApplySuggestion={(amount) => {
          // In a real app, this would open the refill modal with the amount pre-filled
          // or trigger a deposit transaction. For now, we'll just show the refill modal.
          setShowRefillModal(true);
        }}
      />
    </>
  );
}