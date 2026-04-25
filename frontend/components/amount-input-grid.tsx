"use client";

// components/amount-input-grid.tsx
// Issue: Fixed/Percentage Input Mode Toggle [Frontend][Logic][Medium]
//
// Grid header toggle to switch between:
//   Fixed   — user enters absolute amounts; BPS column is auto-calculated (read-only)
//   Percent — user enters percentages; absolute amount is auto-calculated (read-only)

import { useCallback, useState } from "react";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InputMode = "fixed" | "percent";

export interface AmountRow {
  id: string;
  label: string;
  /** Raw user input — interpretation depends on mode */
  value: string;
}

interface Props {
  rows: AmountRow[];
  onChange: (rows: AmountRow[]) => void;
  /** Total split amount in the asset's base unit (e.g. USDC) */
  totalAmount: number;
  assetCode?: string;
}

// ─── BPS helpers ─────────────────────────────────────────────────────────────

/** Convert a fixed amount to basis points relative to the total */
function toBps(amount: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((amount / total) * 10_000);
}

/** Convert a percentage (0-100) to an absolute amount */
function pctToAmount(pct: number, total: number): number {
  return (pct / 100) * total;
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function ModeToggle({
  mode,
  onChange,
}: {
  mode: InputMode;
  onChange: (m: InputMode) => void;
}) {
  return (
    <div className="relative flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5 text-[11px] font-semibold">
      {(["fixed", "percent"] as InputMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`relative z-10 rounded-md px-3 py-1 transition-colors ${
            mode === m ? "text-black" : "text-white/40 hover:text-white/70"
          }`}
        >
          {m === "fixed" ? "Fixed $" : "Percent %"}
          {mode === m && (
            <motion.span
              layoutId="mode-pill"
              className="absolute inset-0 rounded-md bg-cyan-400"
              style={{ zIndex: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AmountInputGrid({
  rows,
  onChange,
  totalAmount,
  assetCode = "USDC",
}: Props) {
  const [mode, setMode] = useState<InputMode>("fixed");

  const update = useCallback(
    (id: string, value: string) => {
      onChange(rows.map((r) => (r.id === id ? { ...r, value } : r)));
    },
    [rows, onChange],
  );

  // Derived columns
  const derived = rows.map((r) => {
    const num = parseFloat(r.value) || 0;
    if (mode === "fixed") {
      return {
        ...r,
        displayAmount: r.value,
        bps: toBps(num, totalAmount),
        pct: totalAmount > 0 ? ((num / totalAmount) * 100).toFixed(2) : "—",
      };
    } else {
      // percent mode
      const abs = pctToAmount(num, totalAmount);
      return {
        ...r,
        displayAmount: abs.toFixed(2),
        bps: toBps(abs, totalAmount),
        pct: r.value,
      };
    }
  });

  // Validation: total must not exceed 100% / totalAmount
  const totalPct = derived.reduce((acc, r) => {
    const num = parseFloat(r.pct as string) || 0;
    return acc + num;
  }, 0);
  const overAllocated = mode === "percent" && totalPct > 100.01;

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-widest text-white/30 uppercase">
          Allocation
        </p>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      {/* Column headers */}
      <div
        className={`grid gap-2 px-1 text-[10px] font-bold tracking-widest text-white/30 uppercase ${
          mode === "fixed"
            ? "grid-cols-[1fr_120px_80px]"
            : "grid-cols-[1fr_80px_120px]"
        }`}
      >
        <span>Recipient</span>
        {mode === "fixed" ? (
          <>
            <span>Amount ({assetCode})</span>
            <span>BPS (auto)</span>
          </>
        ) : (
          <>
            <span>Percent (%)</span>
            <span>Amount (auto)</span>
          </>
        )}
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {derived.map((r) => (
          <div
            key={r.id}
            className={`grid items-center gap-2 ${
              mode === "fixed"
                ? "grid-cols-[1fr_120px_80px]"
                : "grid-cols-[1fr_80px_120px]"
            }`}
          >
            {/* Label */}
            <span className="truncate rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-white/50 font-mono">
              {r.label}
            </span>

            {/* Editable input */}
            <input
              type="number"
              min="0"
              value={r.value}
              onChange={(e) => update(r.id, e.target.value)}
              placeholder={mode === "fixed" ? "0.00" : "0"}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 placeholder-white/20 focus:border-cyan-400/50 focus:outline-none"
            />

            {/* Read-only derived column */}
            {mode === "fixed" ? (
              <input
                readOnly
                value={r.bps}
                tabIndex={-1}
                className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-1.5 text-xs text-white/30 cursor-default focus:outline-none"
                aria-label="BPS (auto-calculated)"
              />
            ) : (
              <input
                readOnly
                value={`${r.displayAmount} ${assetCode}`}
                tabIndex={-1}
                className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-1.5 text-xs text-white/30 cursor-default focus:outline-none"
                aria-label="Absolute amount (auto-calculated)"
              />
            )}
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2">
        <span className="text-[10px] text-white/30">Total</span>
        <div className="flex items-center gap-3">
          {mode === "percent" && (
            <span
              className={`text-[11px] font-semibold tabular-nums ${
                overAllocated ? "text-red-400" : "text-white/50"
              }`}
            >
              {totalPct.toFixed(2)}%
              {overAllocated && " ⚠ over 100%"}
            </span>
          )}
          <span className="text-[11px] font-semibold text-white/50 tabular-nums">
            {derived
              .reduce((acc, r) => acc + (parseFloat(r.displayAmount) || 0), 0)
              .toFixed(2)}{" "}
            {assetCode}
          </span>
        </div>
      </div>

      {overAllocated && (
        <p className="text-[10px] text-red-400/80">
          ⚠ Total allocation exceeds 100%. Reduce one or more percentages.
        </p>
      )}
    </div>
  );
}
