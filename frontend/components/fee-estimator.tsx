"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, Zap } from "lucide-react";
import {
  useFeeEstimator,
  type UseFeeEstimatorOptions,
} from "@/lib/hooks/use-fee-estimator";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FeeEstimatorProps extends UseFeeEstimatorOptions {
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtXlm(value: number): string {
  return `${value.toFixed(value < 0.001 ? 7 : 5)} XLM`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="font-body text-xs text-white/40">{label}</span>
      <span className="font-ticker text-xs text-white/70">{value}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FeeEstimator({
  transactionXdr,
  recipientCount,
  debounceMs,
  className = "",
}: FeeEstimatorProps) {
  const { status, breakdown, errorMessage } = useFeeEstimator({
    transactionXdr,
    recipientCount,
    debounceMs,
  });

  if (status === "idle") return null;

  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 ${className}`}
      aria-live="polite"
      aria-label="Fee Summary"
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-[#00f5ff]/60" />
        <p className="font-body text-xs font-medium uppercase tracking-widest text-white/30">
          Fee Summary
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 py-2"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white/30" />
            <span className="font-body text-xs text-white/30">
              Simulating transaction…
            </span>
          </motion.div>
        )}

        {/* Error */}
        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2.5"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
            <span className="font-body text-xs text-red-300">
              {errorMessage ?? "Fee estimation failed. Please try again."}
            </span>
          </motion.div>
        )}

        {/* Success */}
        {status === "success" && breakdown && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="divide-y divide-white/[0.06]">
              <FeeRow label="Network Fee" value={fmtXlm(breakdown.networkFee)} />
              <FeeRow label="Resource Fee" value={fmtXlm(breakdown.resourceFee)} />
              <FeeRow label="Nebula Protocol Fee" value={fmtXlm(breakdown.nebulaFee)} />
            </div>

            {/* Total */}
            <div className="mt-3 flex items-center justify-between rounded-lg border border-[#00f5ff]/15 bg-[#00f5ff]/5 px-3 py-2">
              <span className="font-body text-xs font-semibold text-white/60">
                Total Estimated Cost
              </span>
              <span className="font-ticker text-sm font-bold text-[#00f5ff]">
                {fmtXlm(breakdown.totalFee)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
