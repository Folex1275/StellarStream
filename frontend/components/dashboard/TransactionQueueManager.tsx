"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, ChevronUp, ChevronDown, Loader2, CheckCircle2, XCircle, ListTodo } from "lucide-react";
import { useTransactionQueue } from "@/lib/providers/TransactionQueueProvider";
import type { TransactionEntry } from "@/lib/providers/TransactionQueueProvider";

const TYPE_LABELS: Record<string, string> = {
  migration: "Migration",
  withdrawal: "Withdrawal",
  cancellation: "Cancellation",
  stream_created: "Stream Created",
  stream_paused: "Paused",
  stream_resumed: "Resumed",
  approval: "Approval",
  transfer: "Transfer",
};

function truncateHash(hash: string): string {
  if (!hash) return "";
  if (hash.length <= 10) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

const STUCK_TRANSACTION_MS = 15_000;
const STUCK_FEE_STEP = 100;

function formatStroops(value: number): string {
  return `${value.toLocaleString()} stroops`;
}

function TransactionEntryRow({ entry }: { entry: TransactionEntry }) {
  const { dismiss } = useTransactionQueue();
  const isTerminal = entry.status === "confirmed" || entry.status === "failed";

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
      {/* Status icon */}
      <div className="mt-0.5 shrink-0">
        {entry.status === "pending" && (
          <Loader2 size={14} className="animate-spin text-cyan-400" />
        )}
        {entry.status === "confirmed" && (
          <CheckCircle2 size={14} className="text-green-400" />
        )}
        {entry.status === "failed" && (
          <XCircle size={14} className="text-red-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-white truncate">
            {TYPE_LABELS[entry.type] ?? entry.type}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${entry.status === "confirmed" ? "bg-green-400/20 text-green-400" :
            entry.status === "failed" ? "bg-red-400/20 text-red-400" :
              "bg-cyan-400/20 text-cyan-400"
            }`}>
            {entry.status}
          </span>
        </div>

        {entry.amount && entry.token && (
          <p className="text-[11px] text-white/60 mt-0.5 font-mono">
            {parseFloat(entry.amount).toLocaleString()} {entry.token}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1">
          {entry.hash ? (
            <a
              href={`https://stellar.expert/explorer/public/tx/${entry.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
            >
              {truncateHash(entry.hash)}
              <ExternalLink size={10} />
            </a>
          ) : (
            <span className="text-[10px] text-white/30 font-mono">awaiting hash…</span>
          )}

          {entry.pollFailureCount >= 3 && entry.status === "pending" && (
            <span className="text-[10px] text-yellow-400">poll failed</span>
          )}
        </div>

        {entry.bumpedFeeStroops != null && (
          <p className="text-[10px] text-cyan-200 mt-2 font-mono">
            Bumped fee: {entry.bumpedFeeStroops.toLocaleString()} stroops
          </p>
        )}
      </div>

      {/* Dismiss button for terminal entries */}
      {isTerminal && (
        <button
          onClick={() => dismiss(entry.id)}
          aria-label="Dismiss transaction"
          className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X size={12} className="text-white/40 hover:text-white/80" />
        </button>
      )}
    </div>
  );
}

interface TransactionQueueManagerProps {
  collapsed?: boolean;
}

export function TransactionQueueManager({ collapsed = false }: TransactionQueueManagerProps) {
  const { entries, dismissAllCompleted, updateStatus } = useTransactionQueue();
  const [expanded, setExpanded] = useState(false);
  const [speedUpSubmitted, setSpeedUpSubmitted] = useState(false);
  const [selectedFee, setSelectedFee] = useState(100);
  const announcerRef = useRef<HTMLDivElement>(null);
  const prevEntriesRef = useRef<TransactionEntry[]>([]);

  const now = Date.now();
  const pendingCount = entries.filter((e) => e.status === "pending").length;
  const stuckEntries = entries.filter((e) => e.status === "pending" && now - e.timestamp > STUCK_TRANSACTION_MS);
  const stuckEntry = stuckEntries[0];
  const hasCompleted = entries.some((e) => e.status === "confirmed" || e.status === "failed");

  const minFee = stuckEntry?.feeStroops ?? 100;
  const maxFee = stuckEntry?.maxFeeStroops ?? Math.max(minFee * 10, 500_000);

  useEffect(() => {
    if (!stuckEntry) return;
    setSelectedFee(stuckEntry.bumpedFeeStroops ?? stuckEntry.feeStroops ?? minFee);
  }, [stuckEntry?.id, stuckEntry?.bumpedFeeStroops, stuckEntry?.feeStroops, minFee]);

  const queuedEntries = useMemo(() => [...entries].sort((a, b) => b.timestamp - a.timestamp), [entries]);

  // ARIA live region announcements on status change
  useEffect(() => {
    const prev = prevEntriesRef.current;
    for (const entry of entries) {
      const prevEntry = prev.find((e) => e.id === entry.id);
      if (prevEntry && prevEntry.status !== entry.status && (entry.status === "confirmed" || entry.status === "failed")) {
        if (announcerRef.current) {
          announcerRef.current.textContent = `${TYPE_LABELS[entry.type] ?? entry.type} ${entry.status}`;
        }
      }
    }
    prevEntriesRef.current = entries;
  }, [entries]);

  const handleSpeedUp = () => {
    if (!stuckEntry) return;
    updateStatus(stuckEntry.id, "pending", {
      bumpedFeeStroops: selectedFee,
      maxFeeStroops: maxFee,
      retryCount: (stuckEntry.retryCount ?? 0) + 1,
      lastBumpedAt: Date.now(),
      pollFailureCount: 0,
    });
    setSpeedUpSubmitted(true);
    window.setTimeout(() => setSpeedUpSubmitted(false), 2000);
  };

  // Render nothing when queue is empty
  if (entries.length === 0) return null;

  // Icon-only mode when sidebar is collapsed
  if (collapsed) {
    return (
      <div className="relative flex items-center justify-center mt-3">
        <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10">
          <ListTodo size={16} className="text-cyan-400" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 text-[8px] font-bold text-black px-1">
              {pendingCount}
            </span>
          )}
          {stuckEntries.length > 0 && (
            <span className="absolute -left-1 -bottom-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-black px-1">
              !
            </span>
          )}
        </div>
        {/* ARIA announcer */}
        <div ref={announcerRef} aria-live="polite" aria-atomic="true" className="sr-only" />
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* ARIA announcer */}
      <div ref={announcerRef} aria-live="polite" aria-atomic="true" className="sr-only" />

      {/* Header / toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
        aria-expanded={expanded}
        aria-label="Transaction queue"
      >
        <div className="flex items-center gap-2">
          <ListTodo size={14} className="text-cyan-400 shrink-0" />
          <span className="text-xs font-medium text-white/80">In-Flight</span>
          {pendingCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 text-[9px] font-bold text-black px-1 shadow-[0_0_6px_rgba(0,245,255,0.5)]">
              {pendingCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasCompleted && !expanded && (
            <button
              onClick={(e) => { e.stopPropagation(); dismissAllCompleted(); }}
              className="text-[10px] text-white/40 hover:text-white/70 transition-colors"
              aria-label="Dismiss all completed"
            >
              clear
            </button>
          )}
          {expanded ? (
            <ChevronDown size={14} className="text-white/40" />
          ) : (
            <ChevronUp size={14} className="text-white/40" />
          )}
        </div>
      </button>

      {/* Expanded list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 space-y-2 max-h-64 overflow-y-auto">
              {stuckEntry && (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/80">
                        Stuck transaction
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {TYPE_LABELS[stuckEntry.type] ?? stuckEntry.type} has been pending for more than 15 seconds.
                      </p>
                    </div>
                    <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/70">
                      {truncateHash(stuckEntry.hash)}
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-white/40">
                      <span>Selected max fee</span>
                      <span className="font-mono text-white">{formatStroops(selectedFee)}</span>
                    </div>
                    <input
                      type="range"
                      min={minFee}
                      max={maxFee}
                      step={STUCK_FEE_STEP}
                      value={selectedFee}
                      onChange={(event) => setSelectedFee(Number(event.target.value))}
                      className="w-full accent-amber-300"
                    />
                    <div className="flex items-center justify-between text-[10px] text-white/30">
                      <span>{formatStroops(minFee)} min</span>
                      <span>{formatStroops(maxFee)} max</span>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={handleSpeedUp}
                        disabled={speedUpSubmitted}
                        className="w-full rounded-2xl bg-amber-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                      >
                        {speedUpSubmitted ? "Fee bumped" : "Bump fee & resubmit"}
                      </button>
                      <p className="text-[10px] text-white/40">
                        This will increase the max fee used when resubmitting the pending transaction.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {queuedEntries.map((entry) => (
                <TransactionEntryRow key={entry.id} entry={entry} />
              ))}
              {hasCompleted && (
                <button
                  onClick={dismissAllCompleted}
                  className="w-full text-[10px] text-white/40 hover:text-white/70 py-1 transition-colors"
                >
                  Dismiss all completed
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TransactionQueueManager;
