"use client";

import { useState, useEffect } from "react";
import { fetchGasEvents, type GasEvent } from "@/lib/api";

const EXPLORER_BASE = "https://stellar.expert/explorer/public/tx";

const TYPE_META = {
  Refill: { color: "#34d399", icon: "↓" },
  Debit:  { color: "#fb923c", icon: "↑" },
} as const;

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function shortHash(hash: string) {
  return hash.length > 16 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;
}

interface GasLedgerProps {
  walletAddress?: string;
}

export default function GasLedger({ walletAddress = "" }: GasLedgerProps) {
  const [events, setEvents]   = useState<GasEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetchGasEvents(walletAddress)
      .then(setEvents)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [walletAddress]);

  return (
    <div
      className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden"
      data-testid="gas-ledger"
    >
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-5">
        <p className="font-body text-[10px] tracking-[0.12em] text-white/50 uppercase">Gas Tank</p>
        <h3 className="font-heading mt-1 text-2xl">Transaction History</h3>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16" data-testid="gas-ledger-loading">
          <svg className="animate-spin h-6 w-6 text-cyan-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          className="flex items-center gap-3 px-6 py-10 text-center"
          data-testid="gas-ledger-error"
        >
          <span className="text-red-400 text-lg">⚠</span>
          <p className="font-body text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && events.length === 0 && (
        <div className="py-16 text-center" data-testid="gas-ledger-empty">
          <p className="font-body text-sm text-white/30">No gas transactions yet.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && events.length > 0 && (
        <>
          {/* Column headers */}
          <div className="hidden grid-cols-[1fr_1fr_2fr_1fr] gap-4 border-b border-white/[0.04] px-6 py-3 md:grid">
            {["Type", "Amount (XLM)", "Transaction Hash", "Timestamp"].map((h) => (
              <p key={h} className="font-body text-[10px] tracking-widest text-white/25 uppercase">{h}</p>
            ))}
          </div>

          <div className="divide-y divide-white/[0.04] max-h-[360px] overflow-y-auto" data-testid="gas-ledger-rows">
            {events.map((ev) => {
              const meta = TYPE_META[ev.type];
              return (
                <div
                  key={ev.id}
                  className="grid grid-cols-1 gap-2 px-6 py-4 transition hover:bg-white/[0.02] md:grid-cols-[1fr_1fr_2fr_1fr] md:items-center"
                  data-testid="gas-ledger-row"
                >
                  {/* Type */}
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                      style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30`, color: meta.color }}
                    >
                      {meta.icon}
                    </span>
                    <span className="font-body text-sm font-bold" style={{ color: meta.color }}>
                      {ev.type}
                    </span>
                  </div>

                  {/* Amount */}
                  <p className="font-body text-sm font-bold tabular-nums text-white/80">
                    {ev.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} XLM
                  </p>

                  {/* Tx Hash */}
                  <a
                    href={`${EXPLORER_BASE}/${ev.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-xs text-cyan-400 hover:text-cyan-300 transition tabular-nums truncate"
                    title={ev.txHash}
                  >
                    {shortHash(ev.txHash)} ↗
                  </a>

                  {/* Timestamp */}
                  <p className="font-body text-xs text-white/40">{fmtDate(ev.timestamp)}</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
