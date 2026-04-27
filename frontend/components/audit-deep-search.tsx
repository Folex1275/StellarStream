"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import {
  useAuditDeepSearch,
  getHighlightSegments,
  type SplitLog,
} from "@/lib/hooks/use-audit-deep-search";

// ─── Highlight renderer ───────────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  const segments = getHighlightSegments(text, query);
  return (
    <>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark
            key={i}
            className="rounded-sm bg-yellow-400/30 text-yellow-200 not-italic"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

// ─── Log row ──────────────────────────────────────────────────────────────────

function LogRow({ log, query }: { log: SplitLog; query: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]">
      <div className="min-w-0 space-y-0.5">
        <p className="font-mono text-xs text-white/70 truncate">
          <Highlight text={log.address} query={query} />
        </p>
        {log.memo && (
          <p className="font-body text-[10px] text-white/35 truncate">
            <Highlight text={log.memo} query={query} />
          </p>
        )}
        <p className="font-body text-[10px] text-white/20">
          {new Date(log.timestamp).toLocaleString()}
        </p>
      </div>

      <span className="font-body text-[10px] text-white/30 uppercase tracking-widest">
        {log.token}
      </span>

      <span className="font-ticker text-sm font-bold text-white/80 tabular-nums">
        <Highlight text={log.amount} query={query} />
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface AuditDeepSearchProps {
  logs: SplitLog[];
  className?: string;
}

export function AuditDeepSearch({ logs, className = "" }: AuditDeepSearchProps) {
  const [query, setQuery] = useState("");
  const { logs: results, total } = useAuditDeepSearch(logs, query);

  const hasQuery = query.trim().length > 0;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Search bar */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-white/25" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by address, memo, or amount…"
          aria-label="Search audit logs"
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-2 pl-9 pr-9 font-body text-xs text-white/80 placeholder-white/20 focus:border-cyan-400/40 focus:outline-none"
        />
        {hasQuery && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 text-white/25 hover:text-white/60 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Count bar */}
      <p className="font-body text-[10px] text-white/30">
        {hasQuery
          ? `Showing ${results.length} of ${total.toLocaleString()} log${total !== 1 ? "s" : ""}`
          : `${total.toLocaleString()} log${total !== 1 ? "s" : ""}`}
      </p>

      {/* Results */}
      {hasQuery && results.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center">
          <p className="font-body text-xs text-white/30">
            No results found for{" "}
            <span className="text-white/50">"{query.trim()}"</span>
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((log) => (
            <LogRow key={log.id} log={log} query={query.trim()} />
          ))}
        </div>
      )}
    </div>
  );
}
