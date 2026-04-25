"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useGasBuffer } from "@/lib/use-gas-buffer";
import { useQuickRefill } from "@/lib/use-quick-refill";
import { toast } from "@/lib/toast";

interface QuickRefillButtonProps {
  /** XLM required to cover the currently drafted split */
  requiredXlm: number;
  /** Optional extra class names for the wrapper */
  className?: string;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * QuickRefillButton — Issue #792
 *
 * Renders a one-click "Quick Refill" button whenever the user's gas buffer
 * falls short of the XLM required to execute the drafted split.
 *
 * Logic:
 *   shortfall = requiredXlm - currentBalance
 *   If shortfall > 0 → show button pre-filled with the exact shortfall amount.
 *   On click → call deposit(shortfall) via useGasBuffer.
 */
export function QuickRefillButton({ requiredXlm, className = "" }: QuickRefillButtonProps) {
  const { status, pendingOp, deposit } = useGasBuffer();
  const { hasShortfall, shortfallXlm } = useQuickRefill(status, requiredXlm);
  const [done, setDone] = useState(false);

  const handleRefill = async () => {
    if (!hasShortfall || shortfallXlm <= 0) return;
    try {
      const txHash = await deposit(shortfallXlm);
      setDone(true);
      toast.success({
        title: "Gas Tank Refilled",
        description: `${fmt(shortfallXlm)} XLM deposited — your split is ready to execute.`,
        txHash,
        duration: 6000,
      });
    } catch (e) {
      toast.error({
        title: "Refill Failed",
        description: e instanceof Error ? e.message : "Unknown error",
        duration: 6000,
      });
    }
  };

  return (
    <AnimatePresence>
      {hasShortfall && !done && (
        <motion.div
          key="quick-refill"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-3 rounded-xl border border-orange-500/30 bg-orange-500/[0.06] px-4 py-3 ${className}`}
          role="alert"
          aria-live="polite"
        >
          {/* Icon */}
          <AlertTriangle className="h-4 w-4 shrink-0 text-orange-400" aria-hidden="true" />

          {/* Label */}
          <div className="flex-1 min-w-0">
            <p className="font-body text-xs font-semibold text-orange-300">
              Insufficient Gas Buffer
            </p>
            <p className="font-body text-[11px] text-orange-300/70 mt-0.5">
              This split needs{" "}
              <span className="font-mono font-bold text-orange-200">{fmt(requiredXlm)} XLM</span>
              {status && (
                <>
                  {" "}— you have{" "}
                  <span className="font-mono font-bold text-orange-200">
                    {fmt(status.balanceXlm)} XLM
                  </span>
                </>
              )}
              . Shortfall:{" "}
              <span className="font-mono font-bold text-white">{fmt(shortfallXlm)} XLM</span>.
            </p>
          </div>

          {/* One-click refill button */}
          <button
            onClick={handleRefill}
            disabled={pendingOp !== null}
            aria-label={`Quick refill ${fmt(shortfallXlm)} XLM`}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-400 hover:shadow-[0_0_14px_rgba(249,115,22,0.45)] disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 transition-all"
          >
            {pendingOp === "deposit" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Refilling…
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                Quick Refill {fmt(shortfallXlm)} XLM
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Success confirmation — auto-hides via AnimatePresence when done resets */}
      {done && (
        <motion.div
          key="refill-done"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3 ${className}`}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <p className="font-body text-xs font-semibold text-emerald-300">
            Gas buffer topped up — ready to execute.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
