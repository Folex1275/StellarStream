"use client";

import React from "react";
import { AlertCircle, PlayCircle, XCircle } from "lucide-react";

interface ResumeWizardBannerProps {
  lastSuccessfulIndex: number;
  remainingCount: number;
  onContinue: () => void;
  onDismiss: () => void;
}

export function ResumeWizardBanner({
  lastSuccessfulIndex,
  remainingCount,
  onContinue,
  onDismiss,
}: ResumeWizardBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-4 md:p-6 backdrop-blur-xl transition-all hover:border-cyan-400/50">
      {/* Glow effect */}
      <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-cyan-400/10 blur-[80px]" />
      
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="mt-1 rounded-full bg-cyan-400/20 p-2 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-white">
              Resume Pending Split
            </h3>
            <p className="font-body mt-1 text-sm text-white/60 max-w-md">
              Your last session stopped after batch <span className="text-cyan-400 font-bold">#{lastSuccessfulIndex + 1}</span>. 
              There are <span className="text-cyan-400 font-bold">{remainingCount}</span> recipients remaining.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onDismiss}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-body text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white/80"
          >
            <XCircle className="h-4 w-4" />
            Discard
          </button>
          <button
            onClick={onContinue}
            className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-2.5 font-body text-sm font-bold text-black shadow-[0_0_20px_rgba(34,211,238,0.4)] transition hover:bg-cyan-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlayCircle className="h-5 w-5" />
            Resume Wizard
          </button>
        </div>
      </div>
    </div>
  );
}
