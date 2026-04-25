"use client";

/**
 * ErrorRecoveryCards
 * Figma Task: Actionable recovery cards replacing plain red error text.
 *
 * Exports:
 *  - InsufficientXLMCard  — "Insufficient XLM" with Top-up / Swap shortcuts
 *  - NetworkCongestedCard — "Network Congested" with fee-bump suggestion
 *  - ErrorRecoveryCard    — generic wrapper (picks the right card by errorType)
 */

import { useState } from "react";
import { ExternalLink, ArrowLeftRight, Zap, RefreshCw, ChevronUp, Fuel } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecoveryErrorType = "insufficient-xlm" | "network-congested";

interface InsufficientXLMCardProps {
  currentBalance?: number;
  requiredBalance?: number;
  onSwap?: () => void;
  onDismiss?: () => void;
}

interface NetworkCongestedCardProps {
  baseFee?: number;           // stroops
  suggestedFee?: number;      // stroops
  onAcceptFee?: (fee: number) => void;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export interface ErrorRecoveryCardProps {
  errorType: RecoveryErrorType;
  // InsufficientXLM props
  currentBalance?: number;
  requiredBalance?: number;
  onSwap?: () => void;
  // NetworkCongested props
  baseFee?: number;
  suggestedFee?: number;
  onAcceptFee?: (fee: number) => void;
  onRetry?: () => void;
  // shared
  onDismiss?: () => void;
}

// ─── Top-up links ─────────────────────────────────────────────────────────────

const TOPUP_OPTIONS = [
  {
    label: "Buy with Card",
    description: "Via MoonPay · instant",
    icon: "💳",
    href: "https://buy.moonpay.com/?currencyCode=xlm",
    accent: "#22d3ee",
  },
  {
    label: "StellarSwap",
    description: "Swap any asset → XLM",
    icon: "🔄",
    href: "https://stellarswap.io",
    accent: "#8a00ff",
  },
  {
    label: "LOBSTR",
    description: "Buy or swap on LOBSTR",
    icon: "🦞",
    href: "https://lobstr.co/swap",
    accent: "#6366f1",
  },
];

// ─── Insufficient XLM Card ────────────────────────────────────────────────────

export function InsufficientXLMCard({
  currentBalance = 0,
  requiredBalance = 5,
  onSwap,
  onDismiss,
}: InsufficientXLMCardProps) {
  const [expanded, setExpanded] = useState(false);
  const shortfall = Math.max(0, requiredBalance - currentBalance).toFixed(2);

  return (
    <div
      className="rounded-2xl border border-orange-400/25 bg-orange-400/[0.05] overflow-hidden"
      style={{ animation: "recoverySlideIn 0.3s cubic-bezier(0.16,1,0.3,1)" }}
    >
      <style>{`
        @keyframes recoverySlideIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>

      {/* Header row */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div className="w-9 h-9 rounded-xl bg-orange-400/15 border border-orange-400/25 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Fuel size={16} className="text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-bold text-orange-300">Insufficient XLM</p>
          <p className="font-body text-xs text-white/50 mt-0.5 leading-relaxed">
            You need <span className="text-orange-300 font-bold">{shortfall} more XLM</span> to cover
            Soroban storage rent &amp; fees.
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-white/20 hover:text-white/50 transition-colors text-lg leading-none flex-shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>

      {/* Balance bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-body text-[10px] text-white/30 uppercase tracking-wider">Balance</span>
          <span className="font-body text-[10px] text-white/40 tabular-nums">
            {currentBalance.toFixed(2)} / {requiredBalance} XLM
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min((currentBalance / requiredBalance) * 100, 100)}%`,
              background: "linear-gradient(90deg, #fb923c, #f97316)",
              boxShadow: "0 0 8px rgba(251,146,60,0.4)",
            }}
          />
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="flex gap-2 px-4 pb-3">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-orange-400/30 bg-orange-400/10 hover:bg-orange-400/20 px-3 py-2.5 transition-all duration-200 group"
        >
          <span className="text-sm">💳</span>
          <span className="font-body text-xs font-bold text-orange-300 group-hover:text-orange-200 transition-colors">
            Top-up with Card
          </span>
        </button>
        {onSwap ? (
          <button
            type="button"
            onClick={onSwap}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2.5 transition-all duration-200 group"
          >
            <ArrowLeftRight size={13} className="text-cyan-400/70 group-hover:text-cyan-400 transition-colors" />
            <span className="font-body text-xs font-bold text-white/50 group-hover:text-white/80 transition-colors">
              Swap to XLM
            </span>
          </button>
        ) : (
          <a
            href="https://stellarswap.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2.5 transition-all duration-200 group"
          >
            <ArrowLeftRight size={13} className="text-cyan-400/70 group-hover:text-cyan-400 transition-colors" />
            <span className="font-body text-xs font-bold text-white/50 group-hover:text-white/80 transition-colors">
              Swap to XLM
            </span>
          </a>
        )}
      </div>

      {/* Expanded top-up options */}
      {expanded && (
        <div
          className="border-t border-orange-400/10 px-4 py-3 space-y-2"
          style={{ animation: "recoverySlideIn 0.2s ease" }}
        >
          <p className="font-body text-[10px] text-white/30 uppercase tracking-wider mb-2">
            Choose a top-up method
          </p>
          {TOPUP_OPTIONS.map((opt) => (
            <a
              key={opt.label}
              href={opt.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] px-3 py-2.5 transition-all duration-150 group"
            >
              <span className="text-base w-6 text-center flex-shrink-0">{opt.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-body text-xs font-bold text-white/70 group-hover:text-white transition-colors">
                  {opt.label}
                </p>
                <p className="font-body text-[10px] text-white/30">{opt.description}</p>
              </div>
              <ExternalLink size={12} className="text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Network Congested Card ───────────────────────────────────────────────────

const FEE_TIERS = [
  { label: "Fast",    multiplier: 2,  eta: "~5s",  accent: "#22d3ee" },
  { label: "Turbo",  multiplier: 5,  eta: "~2s",  accent: "#8a00ff" },
  { label: "Rocket", multiplier: 10, eta: "<1s",  accent: "#f59e0b" },
];

export function NetworkCongestedCard({
  baseFee = 100,
  suggestedFee = 500,
  onAcceptFee,
  onRetry,
  onDismiss,
}: NetworkCongestedCardProps) {
  const [selectedTier, setSelectedTier] = useState(1); // default: Turbo
  const [accepted, setAccepted] = useState(false);

  const tier = FEE_TIERS[selectedTier];
  const fee = baseFee * tier.multiplier;

  const handleAccept = () => {
    setAccepted(true);
    onAcceptFee?.(fee);
    setTimeout(() => setAccepted(false), 2000);
  };

  return (
    <div
      className="rounded-2xl border border-violet-400/25 bg-violet-400/[0.04] overflow-hidden"
      style={{ animation: "recoverySlideIn 0.3s cubic-bezier(0.16,1,0.3,1)" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div className="w-9 h-9 rounded-xl bg-violet-400/15 border border-violet-400/25 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Zap size={16} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-body text-sm font-bold text-violet-300">Network Congested</p>
            <span className="flex items-center gap-1 rounded-full bg-violet-400/15 border border-violet-400/20 px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="font-body text-[9px] text-violet-300 font-bold tracking-wider uppercase">Live</span>
            </span>
          </div>
          <p className="font-body text-xs text-white/50 mt-0.5 leading-relaxed">
            High traffic detected. Bump your fee to get confirmed faster.
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-white/20 hover:text-white/50 transition-colors text-lg leading-none flex-shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>

      {/* Fee tier selector */}
      <div className="px-4 pb-3 space-y-2">
        <p className="font-body text-[10px] text-white/30 uppercase tracking-wider">Select fee tier</p>
        <div className="grid grid-cols-3 gap-2">
          {FEE_TIERS.map((t, i) => {
            const active = selectedTier === i;
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => setSelectedTier(i)}
                className="flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition-all duration-200"
                style={{
                  borderColor: active ? `${t.accent}50` : "rgba(255,255,255,0.08)",
                  background: active ? `${t.accent}12` : "rgba(255,255,255,0.02)",
                  boxShadow: active ? `0 0 14px ${t.accent}20` : "none",
                }}
              >
                <span className="font-body text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: active ? t.accent : "rgba(255,255,255,0.35)" }}>
                  {t.label}
                </span>
                <span className="font-body text-[11px] tabular-nums font-bold text-white/70">
                  {(baseFee * t.multiplier).toLocaleString()}
                </span>
                <span className="font-body text-[9px] text-white/30">stroops</span>
                <span
                  className="font-body text-[10px] font-bold mt-0.5"
                  style={{ color: active ? t.accent : "rgba(255,255,255,0.25)" }}
                >
                  {t.eta}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fee summary row */}
      <div className="mx-4 mb-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <span className="font-body text-xs text-white/40">New fee</span>
        <div className="flex items-center gap-2">
          <span className="font-body text-xs text-white/30 line-through tabular-nums">{baseFee} stroops</span>
          <ChevronUp size={12} className="text-violet-400" />
          <span className="font-body text-sm font-bold tabular-nums" style={{ color: tier.accent }}>
            {fee.toLocaleString()} stroops
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          type="button"
          onClick={handleAccept}
          disabled={accepted}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 font-body text-xs font-bold text-black transition-all duration-200 disabled:opacity-60"
          style={{
            background: accepted
              ? "#4ade80"
              : `linear-gradient(135deg, ${tier.accent}, #8a00ff)`,
            boxShadow: accepted ? "none" : `0 0 20px ${tier.accent}30`,
          }}
        >
          {accepted ? (
            <>✓ Fee accepted</>
          ) : (
            <>
              <Zap size={13} />
              Speed up · {fee.toLocaleString()} stroops
            </>
          )}
        </button>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2.5 transition-all duration-200"
            aria-label="Retry with base fee"
          >
            <RefreshCw size={13} className="text-white/40" />
            <span className="font-body text-xs text-white/40">Retry</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Generic wrapper ──────────────────────────────────────────────────────────

export default function ErrorRecoveryCard({
  errorType,
  currentBalance,
  requiredBalance,
  onSwap,
  baseFee,
  suggestedFee,
  onAcceptFee,
  onRetry,
  onDismiss,
}: ErrorRecoveryCardProps) {
  if (errorType === "insufficient-xlm") {
    return (
      <InsufficientXLMCard
        currentBalance={currentBalance}
        requiredBalance={requiredBalance}
        onSwap={onSwap}
        onDismiss={onDismiss}
      />
    );
  }
  return (
    <NetworkCongestedCard
      baseFee={baseFee}
      suggestedFee={suggestedFee}
      onAcceptFee={onAcceptFee}
      onRetry={onRetry}
      onDismiss={onDismiss}
    />
  );
}
