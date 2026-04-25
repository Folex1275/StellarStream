"use client";

import React from "react";
import { AlertCircle, RotateCcw, Trash2 } from "lucide-react";

interface SessionRestorePromptProps {
  onRestore: () => void;
  onClear: () => void;
}

export function SessionRestorePrompt({ onRestore, onClear }: SessionRestorePromptProps) {
  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 md:p-5 backdrop-blur-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-amber-400/10 p-1.5 text-amber-400">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-amber-400">
              Unfinished Session Detected
            </h3>
            <p className="font-body mt-0.5 text-xs text-amber-400/70">
              We found a draft from your previous Splitter session. Would you like to restore it or start fresh?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-body text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white/80"
          >
            <Trash2 className="h-3 w-3" />
            Clear Draft
          </button>
          <button
            onClick={onRestore}
            className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-1.5 font-body text-xs font-bold text-black transition hover:bg-amber-300 hover:shadow-[0_0_12px_rgba(251,191,36,0.4)]"
          >
            <RotateCcw className="h-3 w-3" />
            Restore Session
          </button>
        </div>
      </div>
    </div>
  );
}
