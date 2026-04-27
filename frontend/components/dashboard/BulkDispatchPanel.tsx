"use client";

// components/dashboard/BulkDispatchPanel.tsx
// Issue #695 — Bulk-Retry for Failed Batch Transactions
// Issue #778 — Batch-Transfer Progress Overlay integration

import { useEffect, useMemo, useState } from "react";
import type { BatchState } from "@/lib/bulk-splitter/use-bulk-splitter";
import type { Recipient } from "@/lib/bulk-splitter/types";
import {
  BatchProgressOverlay,
  saveBatchProgress,
  clearBatchProgress,
} from "@/components/batch-progress-overlay";
import {
  usePriceFetcher,
  calculateTotalUsdValue,
  formatUsdValue,
} from "@/lib/hooks";
import { getExplorerLink } from "@/lib/explorer";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<
  BatchState["status"],
  { label: string; color: string; icon: string }
> = {
  idle:    { label: "Queued",  color: "rgba(255,255,255,0.25)", icon: "○" },
  pending: { label: "Sending", color: "#f59e0b",                icon: "◌" },
  success: { label: "Success", color: "#34d399",                icon: "✓" },
  error:   { label: "Failed",  color: "#f87171",                icon: "✗" },
};

function shortenAddr(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

// ─── BatchRow ─────────────────────────────────────────────────────────────────
function BatchRow({ index, state }: { index: number; state: BatchState }) {
  const meta = STATUS_META[state.status];
  const [expanded, setExpanded] = useState(false);
  const canExpand = state.status === "success" && state.recipients.length > 0 && !!state.txHash;

  return (
    <div
      className="rounded-xl border transition-all duration-300 overflow-hidden"
      style={{
        borderColor:
          state.status === "error"
            ? "rgba(248,113,113,0.3)"
            : state.status === "success"
            ? "rgba(52,211,153,0.2)"
            : "rgba(255,255,255,0.07)",
        background:
          state.status === "error"
            ? "rgba(248,113,113,0.04)"
            : state.status === "success"
            ? "rgba(52,211,153,0.03)"
            : "rgba(255,255,255,0.02)",
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Status icon */}
        <span
          className="text-base w-5 text-center flex-shrink-0 tabular-nums"
          style={{ color: meta.color }}
        >
          {state.status === "pending" ? (
            <svg className="inline animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            meta.icon
          )}
        </span>

        {/* Batch info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-body text-xs font-bold text-white/70">
              Batch {index + 1}
            </span>
            <span className="font-body text-[10px] text-white/30">
              {state.recipients.length} recipient{state.recipients.length !== 1 ? "s" : ""}
            </span>
          </div>
          {state.status === "error" && state.error && (
            <p className="font-body text-[10px] text-red-400/80 mt-0.5 truncate">{state.error}</p>
          )}
          {state.status === "success" && state.txHash && (
            <a
              href={getExplorerLink(state.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-[10px] text-emerald-400/60 mt-0.5 font-mono truncate hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
              title="View transaction on Stellar.Expert"
            >
              {shortenAddr(state.txHash)}
              <svg className="h-2.5 w-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>

        {/* Status badge + expand toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="font-body text-[10px] font-bold tracking-wider uppercase"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          {canExpand && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-white/30 hover:text-white/60 transition-colors"
              title={expanded ? "Hide recipients" : "Show recipients"}
            >
              <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Per-recipient deep-links (expanded) */}
      {expanded && canExpand && state.txHash && (
        <div className="border-t border-white/[0.06] px-4 py-2 space-y-1 max-h-48 overflow-y-auto">
          {state.recipients.map((r) => (
            <a
              key={r.address}
              href={getExplorerLink(state.txHash!, r.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.04] transition-colors group"
              title={`View ${r.address} on Stellar.Expert`}
            >
              <span className="font-mono text-[10px] text-white/50 group-hover:text-white/80 transition-colors truncate">
                {shortenAddr(r.address)}
              </span>
              <svg className="h-3 w-3 text-white/20 group-hover:text-emerald-400/70 flex-shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── BulkDispatchPanel ────────────────────────────────────────────────────────
interface BulkDispatchPanelProps {
  batchStates: BatchState[];
  /** Called to submit a single batch; must return a tx hash. */
  onDispatch: (submitBatch: (recipients: Recipient[]) => Promise<string>) => Promise<void>;
  /** Called to retry only failed/idle batches. */
  onRetryFailed: (submitBatch: (recipients: Recipient[]) => Promise<string>) => Promise<void>;
  /** Provide the real Soroban submit function here. */
  submitBatch: (recipients: Recipient[]) => Promise<string>;
  /** Optional default token address for all recipients (for Issue #689) */
  defaultTokenAddress?: string;
}

export function BulkDispatchPanel({
  batchStates,
  onDispatch,
  onRetryFailed,
  submitBatch,
  defaultTokenAddress,
}: BulkDispatchPanelProps) {
  // Issue #689 - Fetch prices and calculate total USD value
  const { prices, isLoading: pricesLoading } = usePriceFetcher();

  // Calculate total USD value across all batches
  const totalUsdValue = useMemo(() => {
    if (!prices.length || !batchStates.length) return 0;

    // Collect all recipients from all batches
    const allRecipients = batchStates.flatMap((batch) => batch.recipients);

    // Map to format expected by calculateTotalUsdValue
    const recipientsWithTokens = allRecipients.map((r) => ({
      tokenAddress: r.tokenAddress || defaultTokenAddress || "native",
      amount: r.amount.toString(),
    }));

    return calculateTotalUsdValue(recipientsWithTokens, prices);
  }, [batchStates, prices, defaultTokenAddress]);

  const total = batchStates.length;
  const succeeded = batchStates.filter((b) => b.status === "success").length;
  const failed = batchStates.filter((b) => b.status === "error").length;
  const pending = batchStates.filter((b) => b.status === "pending").length;
  const hasRetryable = batchStates.some((b) => b.status === "error" || b.status === "idle");
  const allDone = total > 0 && batchStates.every((b) => b.status === "success" || b.status === "error");
  const isRunning = pending > 0;

  // Issue #778 — persist batch progress to sessionStorage so overlay survives refresh
  useEffect(() => {
    if (total === 0) return;
    const overlayStatus = allDone ? "done" : failed > 0 && !isRunning ? "error" : "running";
    saveBatchProgress({
      sessionId: "bulk-dispatch",
      current: succeeded,
      total,
      status: overlayStatus,
    });
    if (overlayStatus === "done") clearBatchProgress();
  }, [total, succeeded, failed, isRunning, allDone]);

  if (total === 0) return null;

  const overlayProgress = isRunning || (failed > 0 && !allDone)
    ? { sessionId: "bulk-dispatch", current: succeeded, total, status: isRunning ? "running" as const : "error" as const }
    : null;

  return (
    <>
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div>
          {/* Issue #689 - Total Disbursement Value Header */}
          {totalUsdValue > 0 && (
            <div className="flex items-center gap-3 mb-1">
              <p className="font-body text-[10px] tracking-[0.12em] text-white/40 uppercase">
                Total Disbursement Value
              </p>
              {pricesLoading && (
                <span className="text-[10px] text-amber-400/60 animate-pulse">Loading prices...</span>
              )}
            </div>
          )}
          <p className="font-body text-lg font-bold text-emerald-400">
            {formatUsdValue(totalUsdValue)}
          </p>
          <p className="font-body text-xs text-white/50 mt-0.5">
            {succeeded}/{total} batches complete
            {failed > 0 && (
              <span className="text-red-400/80 ml-2">· {failed} failed</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Dispatch all */}
          {!allDone && !isRunning && succeeded === 0 && (
            <button
              onClick={() => onDispatch(submitBatch)}
              className="rounded-xl bg-cyan-400 px-4 py-2 font-body text-xs font-bold text-black hover:bg-cyan-300 transition-colors"
              style={{ boxShadow: "0 0 16px rgba(34,211,238,0.25)" }}
            >
              Dispatch All
            </button>
          )}

          {/* Retry remaining — only shown when some failed and not currently running */}
          {allDone && failed > 0 && !isRunning && (
            <button
              onClick={() => onRetryFailed(submitBatch)}
              className="flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-400/[0.08] px-4 py-2 font-body text-xs font-bold text-red-300 hover:bg-red-400/[0.14] transition-colors"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
              Retry Remaining ({failed})
            </button>
          )}

          {/* Running indicator */}
          {isRunning && (
            <span className="flex items-center gap-1.5 font-body text-xs text-amber-400/80">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Sending…
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1 w-full bg-white/[0.04]">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${(succeeded / total) * 100}%`,
              background: failed > 0
                ? "linear-gradient(90deg, #34d399, #f87171)"
                : "linear-gradient(90deg, #22d3ee, #34d399)",
              boxShadow: "0 0 8px rgba(34,211,238,0.3)",
            }}
          />
        </div>
      )}

      {/* Batch list */}
      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
        {batchStates.map((state, i) => (
          <BatchRow key={i} index={i} state={state} />
        ))}
      </div>

      {/* Success summary */}
      {allDone && failed === 0 && (
        <div className="px-5 py-3 border-t border-white/[0.06] flex items-center gap-2">
          <span className="text-emerald-400">✓</span>
          <p className="font-body text-xs text-emerald-400/80">
            All {total} batches dispatched successfully.
          </p>
        </div>
      )}
    </div>

    {/* Issue #778 — persistent progress overlay */}
    <BatchProgressOverlay progress={overlayProgress} />
    </>
  );
}
