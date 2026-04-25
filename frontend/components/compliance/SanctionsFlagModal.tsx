"use client";

import { ExternalLink, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRole } from "@/lib/use-role";
import type { SanctionsFlag } from "./SanctionsFlagBanner";

interface SanctionsFlagModalProps {
  flag: SanctionsFlag;
  remainingCount: number;
  onBypass: (flag: SanctionsFlag) => void;
  onDismiss: (flag: SanctionsFlag) => void;
  onClose: () => void;
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function SanctionsFlagModal({
  flag,
  remainingCount,
  onBypass,
  onDismiss,
  onClose,
}: SanctionsFlagModalProps) {
  const roleResult = useRole();
  const isAdmin = roleResult.status === "ready" && roleResult.role === "ADMIN";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          className="relative z-10 w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#0d1117] shadow-2xl"
          style={{ boxShadow: "0 0 48px rgba(245,158,11,0.15)" }}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30">
                <ShieldAlert className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Sanctions Flag — Review Required</h2>
                <p className="text-xs text-white/40 mt-0.5">
                  {remainingCount} flag{remainingCount > 1 ? "s" : ""} pending review
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Recipient */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] tracking-widest text-white/40 uppercase mb-1">Flagged Recipient</p>
              <p className="font-mono text-sm text-white/80">{truncate(flag.recipientAddress)}</p>
              <p className="font-mono text-[11px] text-white/30 mt-0.5 break-all">{flag.recipientAddress}</p>
            </div>

            {/* Risk reason */}
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
              <p className="text-[10px] tracking-widest text-amber-400/70 uppercase mb-1">Risk Reason</p>
              <p className="text-sm text-amber-200">{flag.riskReason}</p>
            </div>

            {/* External report link */}
            <a
              href={flag.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-indigo-400 transition hover:bg-white/[0.06] hover:text-indigo-300"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              View Full Compliance Report
            </a>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 gap-3">
            {/* Dismiss — removes recipient */}
            <button
              onClick={() => onDismiss(flag)}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/20"
            >
              Remove Recipient
            </button>

            {/* Bypass — Admin only */}
            {isAdmin ? (
              <button
                onClick={() => onBypass(flag)}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
              >
                <ShieldCheck className="h-4 w-4" />
                Bypass with Caution
              </button>
            ) : (
              <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/30 cursor-not-allowed select-none">
                <ShieldCheck className="h-4 w-4" />
                Bypass (Admin only)
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
