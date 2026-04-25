"use client";

// components/gas-fuel-gauge.tsx
// Issue: Gas Fuel Gauge [Frontend][UI-Logic][Easy]
// Sidebar component that visualises the organisation's XLM gas buffer.
// Pulses red and shows a "Top-Up Required" warning when balance is low.

import { motion, AnimatePresence } from "framer-motion";
import { Fuel, AlertTriangle, RefreshCw } from "lucide-react";
import { useGasBuffer } from "@/lib/use-gas-buffer";

const LOW_THRESHOLD_XLM = 5;   // below this → warning
const MAX_DISPLAY_XLM   = 20;  // full-tank reference

export function GasFuelGauge() {
  const { status, loading, error, refresh } = useGasBuffer();

  const balance   = status?.balanceXlm ?? 0;
  const fillPct   = Math.min(100, (balance / MAX_DISPLAY_XLM) * 100);
  const isLow     = balance < LOW_THRESHOLD_XLM;
  const isDepleted = status?.isDepleted ?? false;

  // Colour ramp: green → amber → red
  const barColor = isDepleted
    ? "#f87171"          // red-400
    : isLow
    ? "#fb923c"          // orange-400
    : "#22d3ee";         // cyan-400

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fuel className="h-4 w-4 text-white/40" />
          <span className="text-[11px] font-semibold tracking-widest text-white/40 uppercase">
            Gas Buffer
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-white/20 hover:text-white/60 transition-colors disabled:opacity-30"
          aria-label="Refresh gas balance"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Gauge bar */}
      <div className="space-y-1.5">
        <div className="flex items-end justify-between">
          {loading ? (
            <span className="h-5 w-16 animate-pulse rounded bg-white/[0.06]" />
          ) : (
            <motion.span
              key={balance}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-bold tabular-nums"
              style={{ color: barColor }}
            >
              {balance.toFixed(2)}
              <span className="ml-1 text-[10px] font-normal text-white/30">XLM</span>
            </motion.span>
          )}
          {status?.daysRemaining != null && (
            <span className="text-[10px] text-white/30">
              ~{status.daysRemaining.toFixed(1)}d left
            </span>
          )}
        </div>

        {/* Track */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: barColor }}
            initial={{ width: 0 }}
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        <div className="flex justify-between text-[9px] text-white/20">
          <span>0</span>
          <span>{MAX_DISPLAY_XLM} XLM</span>
        </div>
      </div>

      {/* Pulse warning */}
      <AnimatePresence>
        {(isLow || isDepleted) && !loading && (
          <motion.div
            key="warning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-xl border border-orange-400/20 bg-orange-400/[0.06] px-3 py-2.5"
          >
            {/* Pulse ring */}
            <motion.span
              className="absolute inset-0 rounded-xl border border-orange-400/30"
              animate={{ opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
              <div>
                <p className="text-[11px] font-semibold text-orange-400">
                  {isDepleted ? "Gas Depleted" : "Top-Up Required"}
                </p>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {isDepleted
                    ? "No XLM available for transaction fees."
                    : `Balance below ${LOW_THRESHOLD_XLM} XLM — fees may fail.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <p className="text-[10px] text-red-400/70">⚠ {error}</p>
      )}

      {/* Burn rate */}
      {status && !loading && (
        <p className="text-[10px] text-white/20">
          Burn rate: {status.burnRatePerDayXlm.toFixed(2)} XLM/day
        </p>
      )}
    </div>
  );
}
