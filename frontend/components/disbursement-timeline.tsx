"use client";

import { useMemo } from "react";
import { Clock, Coins } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DisbursementEntry {
  id: string;
  label: string;
  /** Unix timestamp (seconds) when funds are released */
  release_ledger: number;
  amount: number;
  token: string;
  color?: string;
}

export interface DisbursementTimelineProps {
  entries: DisbursementEntry[];
  /** Unix timestamp (seconds) — defaults to now */
  now?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DisbursementTimeline({
  entries,
  now = Math.floor(Date.now() / 1000),
}: DisbursementTimelineProps) {
  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.release_ledger - b.release_ledger),
    [entries],
  );

  const { minTs, span } = useMemo(() => {
    if (!sorted.length) return { minTs: now, span: 1 };
    const minTs = Math.min(sorted[0].release_ledger, now);
    const maxTs = sorted[sorted.length - 1].release_ledger;
    return { minTs, span: Math.max(maxTs - minTs, 1) };
  }, [sorted, now]);

  const pct = (ts: number) =>
    Math.min(100, Math.max(0, ((ts - minTs) / span) * 100));

  if (!sorted.length) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm text-white/40">
        No scheduled disbursements
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117] p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Clock className="h-4 w-4 text-indigo-400" />
        Disbursement Timeline
      </div>

      {/* Grid rows */}
      <div className="relative space-y-2.5">
        {/* "Now" rule */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-indigo-400/60 z-10"
          style={{ left: `${pct(now)}%` }}
        >
          <span className="absolute -top-5 -translate-x-1/2 rounded bg-indigo-500 px-1.5 py-0.5 text-[10px] font-medium text-white whitespace-nowrap">
            now
          </span>
        </div>

        {sorted.map((entry, i) => {
          const color = entry.color ?? COLORS[i % COLORS.length];
          const isPast = entry.release_ledger <= now;
          const pos = pct(entry.release_ledger);

          return (
            <div key={entry.id} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-24 shrink-0 truncate text-right text-xs text-white/50">
                {entry.label}
              </div>

              {/* Track */}
              <div className="relative flex-1 h-6 rounded bg-white/5">
                {/* Filled bar up to marker */}
                <div
                  className="absolute inset-y-0 left-0 rounded opacity-20"
                  style={{ width: `${pos}%`, background: color }}
                />
                {/* Marker dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full border-2 border-[#0d1117] z-10"
                  style={{ left: `${pos}%`, background: color, opacity: isPast ? 0.4 : 1 }}
                />
              </div>

              {/* Amount chip */}
              <div
                className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  background: `${color}22`,
                  color,
                  border: `1px solid ${color}44`,
                  opacity: isPast ? 0.5 : 1,
                }}
              >
                <Coins className="h-3 w-3" />
                {entry.amount.toLocaleString()} {entry.token}
              </div>
            </div>
          );
        })}
      </div>

      {/* Date axis */}
      <div className="flex justify-between border-t border-white/5 pt-2 text-[10px] text-white/30">
        <span>{fmtDate(minTs)}</span>
        <span>{fmtDate(sorted[sorted.length - 1].release_ledger)}</span>
      </div>
    </div>
  );
}
