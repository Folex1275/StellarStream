"use client";

import { useState } from "react";
import { ShieldAlert, X } from "lucide-react";
import { SanctionsFlagModal } from "./SanctionsFlagModal";

export interface SanctionsFlag {
  recipientAddress: string;
  riskReason: string;
  reportUrl: string;
}

interface SanctionsFlagBannerProps {
  flags: SanctionsFlag[];
  /** Called after a compliance officer bypasses a flag */
  onBypass: (flag: SanctionsFlag) => void;
  /** Called after a flag is dismissed (recipient removed) */
  onDismiss: (flag: SanctionsFlag) => void;
}

export function SanctionsFlagBanner({ flags, onBypass, onDismiss }: SanctionsFlagBannerProps) {
  const [activeFlag, setActiveFlag] = useState<SanctionsFlag | null>(null);

  if (flags.length === 0) return null;

  return (
    <>
      {/* ── Banner ── */}
      <div
        role="alert"
        aria-live="assertive"
        className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 backdrop-blur-sm"
        style={{ boxShadow: "0 0 24px rgba(245,158,11,0.12)" }}
      >
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" aria-hidden />

        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-amber-300">
            Compliance Alert —{" "}
          </span>
          <span className="text-sm text-amber-200/70">
            {flags.length} recipient{flags.length > 1 ? "s" : ""} flagged for sanctions review.
          </span>
        </div>

        <button
          onClick={() => setActiveFlag(flags[0])}
          className="shrink-0 rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/30"
        >
          Review
        </button>
      </div>

      {/* ── Modal ── */}
      {activeFlag && (
        <SanctionsFlagModal
          flag={activeFlag}
          remainingCount={flags.length}
          onBypass={(f) => { onBypass(f); setActiveFlag(null); }}
          onDismiss={(f) => { onDismiss(f); setActiveFlag(null); }}
          onClose={() => setActiveFlag(null)}
        />
      )}
    </>
  );
}
