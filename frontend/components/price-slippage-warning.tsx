"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface PriceSlippageWarningProps {
  assetCode: string;
  delta: number; // fraction, e.g. 0.025
  priceAtStart: number;
  priceNow: number;
  onRefresh: () => void;
}

/**
 * Shown when the asset price moves >2% between setup start and confirmation.
 * Blocks progression until the user explicitly refreshes the price baseline.
 */
export function PriceSlippageWarning({
  assetCode,
  delta,
  priceAtStart,
  priceNow,
  onRefresh,
}: PriceSlippageWarningProps) {
  const pct = (delta * 100).toFixed(2);
  const direction = priceNow > priceAtStart ? "▲" : "▼";
  const directionColor = priceNow > priceAtStart ? "text-emerald-400" : "text-red-400";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        role="alert"
        aria-live="assertive"
        className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />

        <div className="flex-1 space-y-1">
          <p className="text-sm font-bold text-amber-300">
            {assetCode} price moved{" "}
            <span className={directionColor}>
              {direction} {pct}%
            </span>{" "}
            since setup started
          </p>
          <p className="text-xs text-amber-300/70">
            Started at{" "}
            <span className="font-mono">${priceAtStart.toFixed(4)}</span>
            {" · "}
            Now{" "}
            <span className="font-mono">${priceNow.toFixed(4)}</span>
            {" · "}
            Split amounts may no longer reflect your intent.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-500/30"
          aria-label="Refresh price baseline"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Refresh Price
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
