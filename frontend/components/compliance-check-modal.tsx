"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldX, X, Trash2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = "green" | "yellow" | "red";

export interface ComplianceResult {
  address: string;
  label?: string;
  riskLevel: RiskLevel;
  reason?: string;
}

export interface ComplianceCheckModalProps {
  isOpen: boolean;
  results: ComplianceResult[];
  onRemoveFlagged: (addresses: string[]) => void;
  onProceed: (remaining: ComplianceResult[]) => void;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; icon: React.ReactNode; badge: string; row: string }
> = {
  green: {
    label: "Clear",
    icon: <ShieldCheck className="w-4 h-4" />,
    badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    row: "border-white/5",
  },
  yellow: {
    label: "Caution",
    icon: <ShieldAlert className="w-4 h-4" />,
    badge: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    row: "border-yellow-500/20 bg-yellow-500/5",
  },
  red: {
    label: "High Risk",
    icon: <ShieldX className="w-4 h-4" />,
    badge: "bg-red-500/20 text-red-400 border border-red-500/30",
    row: "border-red-500/20 bg-red-500/5",
  },
};

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ComplianceCheckModal({
  isOpen,
  results,
  onRemoveFlagged,
  onProceed,
  onClose,
}: ComplianceCheckModalProps) {
  const flagged = results.filter((r) => r.riskLevel === "red" || r.riskLevel === "yellow");
  const flaggedAddresses = flagged.map((r) => r.address);
  const remaining = results.filter((r) => r.riskLevel === "green");
  const canProceed = results.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">X-Ray Compliance Scan</h2>
                <p className="mt-0.5 text-xs text-white/50">
                  {results.length} recipient{results.length !== 1 ? "s" : ""} scanned
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results list */}
            <div className="max-h-72 overflow-y-auto px-6 py-3 space-y-2">
              {results.map((r) => {
                const cfg = RISK_CONFIG[r.riskLevel];
                return (
                  <div
                    key={r.address}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${cfg.row}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-mono text-white/80">
                        {r.label ? (
                          <>
                            <span className="text-white">{r.label}</span>
                            <span className="ml-1.5 text-white/40">{truncate(r.address)}</span>
                          </>
                        ) : (
                          truncate(r.address)
                        )}
                      </p>
                      {r.reason && (
                        <p className="mt-0.5 text-xs text-white/40 truncate">{r.reason}</p>
                      )}
                    </div>
                    <span
                      className={`ml-3 flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 gap-3">
              {flagged.length > 0 ? (
                <button
                  onClick={() => onRemoveFlagged(flaggedAddresses)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Flagged ({flagged.length})
                </button>
              ) : (
                <span className="text-xs text-emerald-400">All recipients cleared ✓</span>
              )}

              <button
                onClick={() => onProceed(remaining.length > 0 || flagged.length === 0 ? results : remaining)}
                disabled={!canProceed}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Proceed Anyway
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
