"use client";

// components/hardware-multicall-prompt.tsx
// Issue #780 — Hardware-Wallet Multi-Call Handler UI
//
// Renders the inter-signature "Ready for next signature?" prompt and the
// "Restart Current Batch" recovery action on 0x6985 rejection.

import { motion, AnimatePresence } from "framer-motion";
import type { MultiCallState } from "@/lib/hooks/use-hardware-multicall";

interface HardwareMulticallPromptProps {
  state: MultiCallState;
  onRestart: () => void;
  onCancel: () => void;
}

export function HardwareMulticallPrompt({
  state,
  onRestart,
  onCancel,
}: HardwareMulticallPromptProps) {
  const visible =
    state.status === "awaiting_device" || state.status === "rejected";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="hw-prompt"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0d14] p-6 shadow-2xl">
            {state.status === "awaiting_device" ? (
              <>
                {/* Ledger device icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10">
                  <svg
                    className="h-6 w-6 text-cyan-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M8 12h8M12 9v6" />
                  </svg>
                </div>

                <p className="text-sm font-semibold text-white">
                  Ready for next signature?
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Signature {state.currentIndex} of {state.total} — confirm on
                  your Ledger device to continue.
                </p>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={onCancel}
                    className="flex-1 rounded-xl border border-white/10 py-2 text-xs text-white/50 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Rejection icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10">
                  <svg
                    className="h-6 w-6 text-red-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                </div>

                <p className="text-sm font-semibold text-white">
                  Signature rejected
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Transaction {(state.rejectedIndex ?? 0) + 1} of {state.total}{" "}
                  was rejected on the device (0x6985). You can restart from this
                  point without re-signing completed transactions.
                </p>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={onCancel}
                    className="flex-1 rounded-xl border border-white/10 py-2 text-xs text-white/50 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onRestart}
                    className="flex-1 rounded-xl bg-cyan-400 py-2 text-xs font-bold text-black hover:bg-cyan-300 transition-colors"
                    style={{ boxShadow: "0 0 14px rgba(34,211,238,0.3)" }}
                  >
                    Restart Current Batch
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
