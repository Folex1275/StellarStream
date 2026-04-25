"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HardDrive, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfirmOnDeviceModalProps {
  isOpen: boolean;
  walletType?: "hardware" | "software" | null;
  deviceName?: string;
  timeoutSeconds?: number;
  isLargeTransaction?: boolean;
  onTimeout?: () => void;
  onConfirmed?: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ConfirmOnDeviceModal({
  isOpen,
  walletType = "hardware",
  deviceName = "Hardware Wallet",
  timeoutSeconds = 120,
  isLargeTransaction = false,
  onTimeout,
  onConfirmed,
}: ConfirmOnDeviceModalProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeoutSeconds);
  const [isExpired, setIsExpired] = useState(false);

  // ── Timer countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || isExpired) {
      return;
    }

    setTimeRemaining(timeoutSeconds);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeoutSeconds, onTimeout]);

  // ── Reset on close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setIsExpired(false);
      setTimeRemaining(timeoutSeconds);
    }
  }, [isOpen, timeoutSeconds]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const warningThreshold = Math.ceil(timeoutSeconds * 0.25); // warn at 25%

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-6 flex items-start gap-3">
              <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/20 border border-cyan-400/30">
                <HardDrive className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Confirm on Device
                </h2>
                <p className="text-sm text-white/60">{deviceName}</p>
              </div>
            </div>

            {/* Main content */}
            {!isExpired ? (
              <>
                {/* Instructions */}
                <div className="mb-6 space-y-4">
                  {/* Large transaction notice */}
                  {isLargeTransaction && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-yellow-400/30 bg-yellow-400/[0.08] p-3.5 flex gap-2.5"
                    >
                      <AlertCircle className="h-4 w-4 shrink-0 text-yellow-400 mt-0.5" />
                      <p className="text-xs text-yellow-300/90 leading-relaxed">
                        This is a large transaction. You may need to scroll
                        through multiple screens to review all details before
                        confirming.
                      </p>
                    </motion.div>
                  )}

                  {/* Step-by-step instructions */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-white mb-3">
                      Follow these steps:
                    </p>

                    {[
                      {
                        step: 1,
                        title: "Check Device",
                        desc: `Look at your ${deviceName} screen`,
                      },
                      {
                        step: 2,
                        title: "Review Details",
                        desc: "Verify all transaction details on the display",
                      },
                      {
                        step: 3,
                        title: isLargeTransaction ? "Scroll & Confirm" : "Confirm",
                        desc: isLargeTransaction
                          ? "Scroll through all screens (if needed) then press the confirm button"
                          : "Press the confirm button on your device",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 transition-colors hover:bg-white/[0.04]"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 border border-cyan-400/30 text-xs font-bold text-cyan-400">
                          {item.step}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {item.title}
                          </p>
                          <p className="text-xs text-white/50 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Scrolling icon animation for large transactions */}
                  {isLargeTransaction && (
                    <motion.div
                      animate={{ y: [0, 6, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="flex justify-center pt-2"
                    >
                      <ChevronDown className="h-5 w-5 text-cyan-400/40" />
                    </motion.div>
                  )}
                </div>

                {/* Timer */}
                <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-white/60" />
                      <span className="text-xs font-medium text-white/60">
                        Time Remaining
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums transition-colors ${
                        timeRemaining <= warningThreshold
                          ? "text-red-400"
                          : "text-cyan-400"
                      }`}
                    >
                      {minutes}:{seconds.toString().padStart(2, "0")}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: `${(timeRemaining / timeoutSeconds) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                      className={`h-full transition-colors ${
                        timeRemaining <= warningThreshold
                          ? "bg-red-500/60"
                          : "bg-cyan-400/60"
                      }`}
                    />
                  </div>
                </div>

                {/* Info text */}
                <p className="text-xs text-white/40 text-center leading-relaxed">
                  This window will automatically close when you confirm on your
                  device or if time expires.
                </p>
              </>
            ) : (
              /* Expired state */
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex justify-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-400/30 bg-red-400/10">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                  </div>
                </motion.div>

                <div className="text-center">
                  <h3 className="text-base font-bold text-white mb-1">
                    Request Expired
                  </h3>
                  <p className="text-sm text-white/60">
                    The confirmation request timed out. Please try again.
                  </p>
                </div>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 py-2.5 text-sm font-semibold text-white transition-colors"
                >
                  Retry
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
