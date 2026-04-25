"use client";

// components/batch-progress-overlay.tsx
// Issue #993 — Atomic "Batch-Submit" Progress Overlay

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const SESSION_KEY = "stellarstream_batch_progress";

export interface BatchProgressState {
  sessionId: string;
  current: number;
  total: number;
  /** 'running' | 'done' | 'error' */
  status: "running" | "done" | "error";
  /** Per-batch results, indexed 0…total-1 */
  batchResults?: Array<{ status: "pending" | "success" | "error"; txHash?: string; error?: string }>;
}

// ── Persistence helpers ──────────────────────────────────────────────────────

export function saveBatchProgress(state: BatchProgressState) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
}

export function clearBatchProgress() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function loadBatchProgress(): BatchProgressState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as BatchProgressState) : null;
  } catch {
    return null;
  }
}

// ── Overlay component ────────────────────────────────────────────────────────

interface Props {
  /** Pass null to hide the overlay */
  progress: BatchProgressState | null;
  onDismiss?: () => void;
}

export function BatchProgressOverlay({ progress, onDismiss }: Props) {
  const [hydrated, setHydrated] = useState<BatchProgressState | null>(null);

  // On mount, restore from sessionStorage if no prop provided
  useEffect(() => {
    setHydrated(progress ?? loadBatchProgress());
  }, [progress]);

  // Sync prop changes into local state
  useEffect(() => {
    if (progress) setHydrated(progress);
  }, [progress]);

  // Prevent tab close while batches are running
  useEffect(() => {
    if (!hydrated || hydrated.status !== "running") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hydrated?.status]);

  if (!hydrated || hydrated.status === "done") return null;

  const pct = hydrated.total > 0 ? Math.round((hydrated.current / hydrated.total) * 100) : 0;
  const results = hydrated.batchResults ?? [];

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-white/[0.1] bg-[#0a0a1a]/95 p-5 shadow-2xl backdrop-blur-md"
      style={{ boxShadow: "0 0 40px rgba(0,245,255,0.08)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-xs font-bold text-white/80">Batch Transfer In Progress</span>
        </div>
        {hydrated.status === "error" && onDismiss && (
          <button onClick={onDismiss} className="text-white/30 hover:text-white/60 text-xs">✕</button>
        )}
      </div>

      {/* Batch counter */}
      <p className="text-sm font-bold text-cyan-300 mb-2">
        Batch {hydrated.current} of {hydrated.total} Processing…
      </p>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: hydrated.status === "error"
              ? "linear-gradient(90deg,#f87171,#fca5a5)"
              : "linear-gradient(90deg,#22d3ee,#34d399)",
            boxShadow: "0 0 8px rgba(34,211,238,0.4)",
          }}
        />
      </div>

      {/* Per-batch status rows */}
      {results.length > 0 && (
        <div className="mb-3 max-h-36 overflow-y-auto space-y-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="text-white/40">Batch {i + 1}</span>
              {r.status === "success" ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 size={11} /> Confirmed
                </span>
              ) : r.status === "error" ? (
                <span className="flex items-center gap-1 text-red-400" title={r.error}>
                  <XCircle size={11} /> Failed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-white/30">
                  <Loader2 size={11} className="animate-spin" /> Pending
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Warning */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2">
        <span className="text-amber-400 text-sm">⚠</span>
        <p className="text-[11px] text-amber-300/80 font-medium">
          Don&apos;t close this tab — your transfer is still processing.
        </p>
      </div>

      {hydrated.status === "error" && (
        <p className="mt-2 text-[11px] text-red-400/80">
          An error occurred. You can safely retry failed batches.
        </p>
      )}
    </div>
  );
}
