"use client";

// components/dashboard/QuorumBulkDispatchPanel.tsx
// Issue #679 — Quorum-Check Pre-Submission Logic
// Integrates quorum check with BulkDispatchPanel for multi-sig support

import { useState, useCallback, useMemo } from "react";
import type { BatchState } from "@/lib/bulk-splitter/use-bulk-splitter";
import type { Recipient } from "@/lib/bulk-splitter/types";
import { useQuorumCheck, type QuorumCheckResult } from "@/lib/hooks/use-quorum-check";
import { useWallet } from "@/lib/wallet-context";

// Import the original BulkDispatchPanel
import { BulkDispatchPanel } from "./BulkDispatchPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuorumBulkDispatchPanelProps {
  batchStates: BatchState[];
  onDispatch: (submitBatch: (recipients: Recipient[]) => Promise<string>) => Promise<void>;
  onRetryFailed: (submitBatch: (recipients: Recipient[]) => Promise<string>) => Promise<void>;
  submitBatch: (recipients: Recipient[]) => Promise<string>;
  /** Custom description for the proposal (if quorum insufficient) */
  transactionDescription?: string;
  /** Action type for the proposal */
  action?: string;
  /** Callback when a proposal is successfully created */
  onProposalCreated?: (proposalId: string) => void;
}

// ─── Helper Components ───────────────────────────────────────────────────────

/**
 * QuorumStatusBadge - Shows current quorum status
 */
function QuorumStatusBadge({ quorum }: { quorum: QuorumCheckResult }) {
  const canExecute = quorum.canExecute;
  
  if (quorum.isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/40">
        <span className="h-2 w-2 animate-pulse rounded-full bg-white/40" />
        Checking...
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        canExecute
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
          : "border-amber-400/30 bg-amber-400/10 text-amber-400"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          canExecute ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />
      {canExecute ? "Can Execute" : "Needs Proposal"}
      <span className="text-white/30">•</span>
      <span className="font-mono">{quorum.userWeight}/{quorum.threshold}</span>
    </span>
  );
}

/**
 * QuorumDispatchControls - Replaces the original dispatch buttons with quorum-aware versions
 */
function QuorumDispatchControls({
  batchStates,
  onDispatch,
  onRetryFailed,
  submitBatch,
  quorum,
  transactionDescription = "Bulk token distribution",
  action = "BULK_DISPATCH",
  onProposalCreated,
}: {
  batchStates: BatchState[];
  onDispatch: (submitBatch: (recipients: Recipient[]) => Promise<string>) => Promise<void>;
  onRetryFailed: (submitBatch: (recipients: Recipient[]) => Promise<string>) => Promise<void>;
  submitBatch: (recipients: Recipient[]) => Promise<string>;
  quorum: QuorumCheckResult;
  transactionDescription?: string;
  action?: string;
  onProposalCreated?: (proposalId: string) => void;
}) {
  const { address, isConnected } = useWallet();
  const [isProposing, setIsProposing] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = batchStates.length;
  const succeeded = batchStates.filter((b) => b.status === "success").length;
  const failed = batchStates.filter((b) => b.status === "error").length;
  const pending = batchStates.filter((b) => b.status === "pending").length;
  const allDone = total > 0 && batchStates.every((b) => b.status === "success" || b.status === "error");
  const isRunning = pending > 0;

  // Handle direct execution (when quorum sufficient)
  const handleDispatch = useCallback(async () => {
    if (!quorum.canExecute || isRunning) return;
    await onDispatch(submitBatch);
  }, [quorum.canExecute, isRunning, onDispatch, submitBatch]);

  // Handle proposal creation (when quorum insufficient)
  const handlePropose = useCallback(async () => {
    if (!address || !isConnected || quorum.canExecute || isProposing) return;

    setIsProposing(true);
    setError(null);

    try {
      const BACKEND_API_BASE =
        process.env.NEXT_PUBLIC_NEBULA_WARP_INDEXER_URL ??
        process.env.NEXT_PUBLIC_BACKEND_API_URL ??
        process.env.NEXT_PUBLIC_API_URL ??
        "http://localhost:3000/api/v1";

      // Create a placeholder XDR for the bulk dispatch
      const txData = Buffer.from(JSON.stringify({
        action,
        batchCount: total,
        recipients: batchStates.flatMap(b => b.recipients.map(r => r.address)),
        timestamp: new Date().toISOString(),
      })).toString("base64");

      const response = await fetch(`${BACKEND_API_BASE}/governance/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: address,
          description: transactionDescription,
          action,
          txData,
          signers: [address],
          requiredSignatures: 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create proposal");
      }

      const result = await response.json();
      if (result.success && result.proposal) {
        setProposalId(result.proposal.id);
        onProposalCreated?.(result.proposal.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to propose transaction");
    } finally {
      setIsProposing(false);
    }
  }, [address, isConnected, quorum.canExecute, isProposing, action, total, batchStates, transactionDescription, onProposalCreated]);

  // Not connected
  if (!isConnected) {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-body text-xs font-bold text-white/30 cursor-not-allowed"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // Loading quorum
  if (quorum.isLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/40">Loading...</span>
      </div>
    );
  }

  // Quorum sufficient - show direct dispatch buttons
  if (quorum.canExecute) {
    return (
      <div className="flex items-center gap-2">
        {/* Dispatch all */}
        {!allDone && !isRunning && succeeded === 0 && (
          <button
            onClick={handleDispatch}
            className="rounded-xl bg-cyan-400 px-4 py-2 font-body text-xs font-bold text-black hover:bg-cyan-300 transition-colors"
            style={{ boxShadow: "0 0 16px rgba(34,211,238,0.25)" }}
          >
            Dispatch All
          </button>
        )}

        {/* Retry remaining */}
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
    );
  }

  // Quorum insufficient - show propose button
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {proposalId ? (
          <span className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 font-body text-xs font-medium text-emerald-300">
            Proposal Submitted
          </span>
        ) : isProposing ? (
          <span className="flex items-center gap-1.5 font-body text-xs text-amber-400/80">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Creating Proposal...
          </span>
        ) : (
          <button
            onClick={handlePropose}
            className="rounded-xl border border-[#8a00ff]/30 bg-[#8a00ff]/10 px-4 py-2 font-body text-xs font-bold text-[#c084fc] hover:bg-[#8a00ff]/20 transition-colors"
            style={{ boxShadow: "0 0 16px rgba(138,0,255,0.25)" }}
          >
            Propose Multi-Sig
          </button>
        )}
      </div>

      {/* Info text when insufficient */}
      {!proposalId && !isProposing && (
        <p className="text-[10px] text-white/40 max-w-[200px] text-right">
          Your weight ({quorum.userWeight}) is below threshold ({quorum.threshold}). 
          This will be submitted as a governance proposal.
        </p>
      )}

      {error && (
        <p className="text-[10px] text-red-400/80">{error}</p>
      )}

      {proposalId && (
        <p className="text-[10px] text-white/30 font-mono">
          ID: {proposalId}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function QuorumBulkDispatchPanel({
  batchStates,
  onDispatch,
  onRetryFailed,
  submitBatch,
  transactionDescription,
  action,
  onProposalCreated,
}: QuorumBulkDispatchPanelProps) {
  const quorum = useQuorumCheck();

  // Get stats from batch states
  const total = batchStates.length;
  const succeeded = batchStates.filter((b) => b.status === "success").length;
  const failed = batchStates.filter((b) => b.status === "error").length;
  const pending = batchStates.filter((b) => b.status === "pending").length;
  const allDone = total > 0 && batchStates.every((b) => b.status === "success" || b.status === "error");
  const isRunning = pending > 0;

  if (total === 0) return null;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <div>
            <p className="font-body text-[10px] tracking-[0.12em] text-white/40 uppercase">
              Batch Dispatch
            </p>
            <p className="font-body text-xs text-white/50 mt-0.5">
              {succeeded}/{total} batches complete
              {failed > 0 && (
                <span className="text-red-400/80 ml-2">· {failed} failed</span>
              )}
            </p>
          </div>
          
          {/* Quorum status badge */}
          <QuorumStatusBadge quorum={quorum} />
        </div>

        <QuorumDispatchControls
          batchStates={batchStates}
          onDispatch={onDispatch}
          onRetryFailed={onRetryFailed}
          submitBatch={submitBatch}
          quorum={quorum}
          transactionDescription={transactionDescription}
          action={action}
          onProposalCreated={onProposalCreated}
        />
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

      {/* Batch list - inline (simplified for this component) */}
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
  );
}

// ─── Re-export original BatchRow for internal use ──────────────────────────

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

function BatchRow({ index, state }: { index: number; state: BatchState }) {
  const meta = STATUS_META[state.status];
  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300"
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
      <span
        className="text-base w-5 text-center flex-shrink-0 tabular-nums"
        style={{
          color: meta.color,
          animation: state.status === "pending" ? "spin 1s linear infinite" : "none",
        }}
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
          <p className="font-body text-[10px] text-emerald-400/60 mt-0.5 font-mono truncate">
            {shortenAddr(state.txHash)}
          </p>
        )}
      </div>

      <span
        className="font-body text-[10px] font-bold tracking-wider uppercase flex-shrink-0"
        style={{ color: meta.color }}
      >
        {meta.label}
      </span>
    </div>
  );
}
