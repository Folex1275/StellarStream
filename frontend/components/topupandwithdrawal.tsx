"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ShieldAlert } from "lucide-react";
import { useProtocolStatus } from "@/lib/use-protocol-status";
import { useDevMode } from "@/lib/use-dev-mode";

// ─── Types ────────────────────────────────────────────────────────────────────
type ModalAction = "withdraw" | "topup";

interface StreamModalProps {
  action: ModalAction;
  streamName: string;
  token: string;
  availableBalance: number; // for withdraw: withdrawable amount
  walletBalance: number;    // for topup: wallet balance
  onConfirm: (amount: number, action: ModalAction) => Promise<void>;
  onClose: () => void;
}

// ─── Config per action ────────────────────────────────────────────────────────
const ACTION_CONFIG = {
  withdraw: {
    label: "Withdraw",
    verb: "Withdrawing",
    icon: "↑",
    glow: "#22d3ee",   // cyan
    glowRgb: "34,211,238",
    accent: "text-cyan-400",
    border: "border-cyan-400/40",
    bg: "bg-cyan-400/10",
    btnBg: "bg-cyan-400 hover:bg-cyan-300",
    btnText: "text-black",
    description: "Withdraw streamed funds to your wallet.",
    balanceLabel: "Withdrawable",
  },
  topup: {
    label: "Top-Up",
    verb: "Topping up",
    icon: "↓",
    glow: "#a78bfa",   // violet
    glowRgb: "167,139,250",
    accent: "text-violet-400",
    border: "border-violet-400/40",
    bg: "bg-violet-400/10",
    btnBg: "bg-violet-400 hover:bg-violet-300",
    btnText: "text-black",
    description: "Add more funds to extend this stream.",
    balanceLabel: "Wallet Balance",
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── Nebula Glow Background ───────────────────────────────────────────────────
function NebulaGlow({ color, rgb }: { color: string; rgb: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden"
      aria-hidden
    >
      {/* Radial nebula bloom */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full opacity-20 blur-[80px] transition-all duration-700"
        style={{ background: color }}
      />
      {/* Subtle inner rim */}
      <div
        className="absolute inset-0 rounded-3xl opacity-[0.07]"
        style={{
          background: `radial-gradient(ellipse at 50% -10%, rgba(${rgb},0.6) 0%, transparent 60%)`,
        }}
      />
      {/* Animated shimmer ring */}
      <div
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[200px] w-[200px] rounded-full opacity-10 blur-3xl"
        style={{
          background: color,
          animation: "nebulaFloat 4s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes nebulaFloat {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.10; }
          50%       { transform: translate(-50%, -52%) scale(1.15); opacity: 0.18; }
        }
      `}</style>
    </div>
  );
}

// ─── Numeric Input ────────────────────────────────────────────────────────────
function AmountInput({
  value,
  onChange,
  max,
  token,
  glow,
  rgb,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  max: number;
  token: string;
  glow: string;
  rgb: string;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus with slight delay for animation
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9.]/g, "");
    // Prevent multiple decimals
    if ((v.match(/\./g) ?? []).length > 1) return;
    onChange(v);
  };

  const handleMax = () => onChange(max.toFixed(2));

  const numVal = parseFloat(value) || 0;
  const pct = Math.min(numVal / max, 1);

  return (
    <div className="space-y-3">
      {/* Main input container */}
      <div
        className="relative rounded-2xl border bg-white/[0.03] transition-all duration-300 overflow-hidden"
        style={{
          borderColor: error
            ? "rgba(248,113,113,0.5)"
            : value
              ? `rgba(${rgb},0.4)`
              : "rgba(255,255,255,0.10)",
          boxShadow: value && !error
            ? `0 0 24px rgba(${rgb},0.12), inset 0 0 24px rgba(${rgb},0.04)`
            : "none",
        }}
      >
        {/* Input row */}
        <div className="flex items-center px-5 py-4 gap-3">
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            placeholder="0.00"
            className="flex-1 bg-transparent font-heading text-4xl md:text-5xl text-white outline-none placeholder:text-white/15 tabular-nums min-w-0"
            style={{
              caretColor: glow,
              textShadow: value && !error ? `0 0 20px rgba(${rgb},0.4)` : "none",
            }}
          />

          {/* Token + Max */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="font-body text-sm font-bold text-white/40 tracking-widest uppercase">
              {token}
            </span>
            <button
              onClick={handleMax}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 font-body text-xs font-bold text-white/50 transition hover:border-white/20 hover:text-white/80 hover:bg-white/[0.07]"
              style={{
                borderColor: value === max.toFixed(2) ? `rgba(${rgb},0.4)` : undefined,
                color: value === max.toFixed(2) ? glow : undefined,
              }}
            >
              Max
            </button>
          </div>
        </div>

        {/* Amount fraction bar */}
        {pct > 0 && (
          <div className="h-0.5 w-full bg-white/[0.04]">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${pct * 100}%`,
                background: `linear-gradient(90deg, rgba(${rgb},0.5), ${glow})`,
                boxShadow: `0 0 8px rgba(${rgb},0.6)`,
              }}
            />
          </div>
        )}
      </div>

      {/* Available balance row */}
      <div className="flex items-center justify-between px-1">
        <span className="font-body text-xs text-white/35">Available</span>
        <button
          onClick={handleMax}
          className="font-body text-xs font-bold transition hover:opacity-80"
          style={{ color: glow }}
        >
          {fmt(max)} {token}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="font-body text-xs text-red-400 px-1" style={{ animation: "fadeUp 0.15s ease" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
function StreamActionModal({
  action,
  streamName,
  token,
  availableBalance,
  walletBalance,
  onConfirm,
  onClose,
}: StreamModalProps) {
  const { isEmergency } = useProtocolStatus();
  const [devMode] = useDevMode();
  const cfg = ACTION_CONFIG[action];
  const maxAmt = action === "withdraw" ? availableBalance : walletBalance;
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [showXDR, setShowXDR] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleOverlay = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const validate = (): boolean => {
    const n = parseFloat(amount);
    if (!amount || isNaN(n) || n <= 0) { setError("Please enter an amount."); return false; }
    if (n > maxAmt) { setError(`Amount exceeds available balance of ${fmt(maxAmt)} ${token}.`); return false; }
    setError(null);
    return true;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    setStatus("loading");
    try {
      await onConfirm(parseFloat(amount), action);
      setStatus("success");
      setTimeout(onClose, 1400);
    } catch {
      setStatus("idle");
      setError("Transaction failed. Please try again.");
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.7)" }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl overflow-hidden"
        style={{
          boxShadow: `0 0 0 1px rgba(${cfg.glowRgb},0.12), 0 40px 80px rgba(0,0,0,0.8), 0 0 120px rgba(${cfg.glowRgb},0.08)`,
          animation: "modalIn 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <style>{`
          @keyframes modalIn  { from { opacity:0; transform:scale(0.93) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }
          @keyframes fadeUp   { from { opacity:0; transform:translateY(4px) }  to { opacity:1; transform:translateY(0) } }
          @keyframes successIn{ from { opacity:0; transform:scale(0.8) }  to { opacity:1; transform:scale(1) } }
        `}</style>

        {/* Nebula glow */}
        <NebulaGlow color={cfg.glow} rgb={cfg.glowRgb} />

        {/* ── Success state ── */}
        {status === "success" && (
          <div className="relative z-10 flex flex-col items-center justify-center py-16 px-8 text-center" style={{ animation: "successIn 0.3s ease" }}>
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-2xl mb-4"
              style={{ background: `rgba(${cfg.glowRgb},0.15)`, border: `1px solid rgba(${cfg.glowRgb},0.4)`, boxShadow: `0 0 32px rgba(${cfg.glowRgb},0.3)` }}
            >
              {cfg.icon}
            </div>
            <p className="font-heading text-2xl mb-1">Transaction Sent</p>
            <p className="font-body text-sm text-white/50">
              {cfg.verb} <span style={{ color: cfg.glow }}>{amount} {token}</span>
            </p>
          </div>
        )}

        {/* ── Normal state ── */}
        {status !== "success" && (
          <div className="relative z-10 p-6 md:p-8 space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  {/* Action badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 font-body text-xs font-bold tracking-wider uppercase ${cfg.border} ${cfg.bg} ${cfg.accent}`}
                    style={{ boxShadow: `0 0 12px rgba(${cfg.glowRgb},0.2)` }}
                  >
                    <span>{cfg.icon}</span> {cfg.label}
                  </span>
                </div>
                <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">
                  {streamName}
                </p>
                <h2 className="font-heading mt-1 text-2xl md:text-3xl">{cfg.label} Funds</h2>
                <p className="font-body mt-1.5 text-sm text-white/50">{cfg.description}</p>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] font-body text-sm text-white/40 transition hover:bg-white/[0.08] hover:text-white/70"
              >
                ✕
              </button>
            </div>

            {/* Amount input */}
            <AmountInput
              value={amount}
              onChange={(v) => { setAmount(v); setError(null); }}
              max={maxAmt}
              token={token}
              glow={cfg.glow}
              rgb={cfg.glowRgb}
              error={error}
            />

            {/* Info row */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: cfg.balanceLabel, value: `${fmt(maxAmt)} ${token}`, style: { color: cfg.glow } },
                { label: "After Transaction", value: `${fmt(Math.max(0, maxAmt - (parseFloat(amount) || 0)))} ${token}`, style: {} },
              ].map((row) => (
                <div key={row.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <p className="font-body text-[10px] tracking-widest text-white/30 uppercase">{row.label}</p>
                  <p className="font-body text-sm font-bold text-white/80 mt-0.5 tabular-nums" style={row.style}>{row.value}</p>
                </div>
              ))}
            </div>

            {/* View XDR button (Dev Mode) */}
            {devMode && (
              <button
                onClick={() => setShowXDR(!showXDR)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 font-body text-sm font-bold text-white/60 transition hover:bg-white/[0.08] hover:text-white/80"
              >
                {showXDR ? "Hide XDR" : "View XDR"}
              </button>
            )}

            {/* XDR Display */}
            {showXDR && devMode && (
              <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
                <p className="font-body text-xs text-white/60 mb-2">Transaction XDR:</p>
                <pre className="font-mono text-xs text-white/80 overflow-x-auto whitespace-pre-wrap break-all">
{`AAAAAgAAAADWJbkKz2rQWG5L6Z0qjML5kgK3HaHS9EaEjVxVjBqAAAAZAB8pVQAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAIhqhAAAAAAA`}
                </pre>
              </div>
            )}

            {/* CTA */}
            {isEmergency && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 mb-2">
                <ShieldAlert size={14} className="text-red-400 flex-shrink-0" />
                <p className="font-body text-xs text-red-300/70">
                  Disabled during Emergency Mode.
                </p>
              </div>
            )}
            <button
              onClick={handleConfirm}
              disabled={status === "loading" || isEmergency}
              className={`w-full rounded-2xl py-4 font-body text-base font-bold transition-all duration-200 ${cfg.btnBg} ${cfg.btnText} disabled:opacity-60 disabled:cursor-not-allowed`}
              style={{
                boxShadow: status === "idle" && amount
                  ? `0 0 24px rgba(${cfg.glowRgb},0.35)`
                  : "none",
                transition: "box-shadow 0.3s ease",
              }}
            >
              {status === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Confirming…
                </span>
              ) : (
                `${cfg.label} ${amount ? `${amount} ${token}` : "Funds"} ${cfg.icon}`
              )}
            </button>

            {/* Disclaimer */}
            <p className="text-center font-body text-[11px] text-white/25">
              Transaction will be submitted on-chain · gas fees apply
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Demo / Export ────────────────────────────────────────────────────────────
export default function StreamModalsDemo() {
  const [open, setOpen] = useState<ModalAction | null>(null);

  const handleConfirm = async (amount: number, action: ModalAction) => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1800));
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 p-8"
      style={{ background: "#080d18" }}
    >
      {/* Trigger buttons (demo only — in real use, these live on the stream card) */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl w-full max-w-sm space-y-4">
        <div>
          <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">DAO Treasury → Dev Fund</p>
          <h2 className="font-heading mt-1 text-2xl">Stream Actions</h2>
          <p className="font-body mt-2 text-sm text-white/50">37,500.00 USDC available to withdraw.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setOpen("withdraw")}
            className="flex-1 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 py-3 font-body text-sm font-bold text-cyan-400 transition hover:bg-cyan-400/20"
            style={{ boxShadow: "0 0 16px rgba(34,211,238,0.12)" }}
          >
            ↑ Withdraw
          </button>
          <button
            onClick={() => setOpen("topup")}
            className="flex-1 rounded-2xl border border-violet-400/30 bg-violet-400/10 py-3 font-body text-sm font-bold text-violet-400 transition hover:bg-violet-400/20"
            style={{ boxShadow: "0 0 16px rgba(167,139,250,0.12)" }}
          >
            ↓ Top-Up
          </button>
        </div>
      </div>

      {open && (
        <StreamActionModal
          action={open}
          streamName="DAO Treasury → Dev Fund"
          token="USDC"
          availableBalance={37_500}
          walletBalance={12_450.5}
          onConfirm={handleConfirm}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

export { StreamActionModal, type StreamModalProps, type ModalAction };