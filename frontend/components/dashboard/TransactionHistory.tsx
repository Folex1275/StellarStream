"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TxType   = "Stream Update" | "Withdrawal" | "Deposit";
type TxStatus = "Success" | "Pending" | "Failed";
type SortKey  = "date" | "amount" | "type" | "status";
type SortDir  = "asc" | "desc";

interface Transaction {
  id: string;
  date: string;        // ISO string
  type: TxType;
  asset: string;
  amount: number;
  status: TxStatus;
  from: string;
  to: string;
  hash: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TRANSACTIONS: Transaction[] = [
  { id: "1",  date: "2026-02-23T14:32:00Z", type: "Deposit",        asset: "XLM",  amount: 50_000,   status: "Success", from: "0x3f...a91c", to: "0x7b...22fd", hash: "0xabc...1234" },
  { id: "2",  date: "2026-02-23T13:10:00Z", type: "Stream Update",  asset: "STRM", amount: 12_450,   status: "Success", from: "0x7b...22fd", to: "0xc2...88b3", hash: "0xdef...5678" },
  { id: "3",  date: "2026-02-23T12:05:00Z", type: "Withdrawal",     asset: "USDC", amount: 8_200,    status: "Pending", from: "0xc2...88b3", to: "0x9a...f03d", hash: "0xghi...9012" },
  { id: "4",  date: "2026-02-22T22:48:00Z", type: "Deposit",        asset: "XLM",  amount: 100_000,  status: "Success", from: "0x9a...f03d", to: "0x3f...a91c", hash: "0xjkl...3456" },
  { id: "5",  date: "2026-02-22T19:33:00Z", type: "Stream Update",  asset: "STRM", amount: 3_750,    status: "Failed",  from: "0x3f...a91c", to: "0xc2...88b3", hash: "0xmno...7890" },
  { id: "6",  date: "2026-02-22T17:15:00Z", type: "Withdrawal",     asset: "AQUA", amount: 22_100,   status: "Success", from: "0x7b...22fd", to: "0x9a...f03d", hash: "0xpqr...1234" },
  { id: "7",  date: "2026-02-22T14:02:00Z", type: "Deposit",        asset: "USDC", amount: 5_000,    status: "Pending", from: "0xc2...88b3", to: "0x7b...22fd", hash: "0xstu...5678" },
  { id: "8",  date: "2026-02-21T09:41:00Z", type: "Stream Update",  asset: "XLM",  amount: 75_320,   status: "Success", from: "0x9a...f03d", to: "0x3f...a91c", hash: "0xvwx...9012" },
  { id: "9",  date: "2026-02-21T07:29:00Z", type: "Withdrawal",     asset: "STRM", amount: 1_800,    status: "Failed",  from: "0x3f...a91c", to: "0x7b...22fd", hash: "0xyz1...3456" },
  { id: "10", date: "2026-02-20T21:55:00Z", type: "Deposit",        asset: "AQUA", amount: 43_670,   status: "Success", from: "0x7b...22fd", to: "0xc2...88b3", hash: "0xyz2...7890" },
  { id: "11", date: "2026-02-20T18:12:00Z", type: "Stream Update",  asset: "USDC", amount: 9_900,    status: "Success", from: "0xc2...88b3", to: "0x9a...f03d", hash: "0xyz3...1234" },
  { id: "12", date: "2026-02-20T11:08:00Z", type: "Withdrawal",     asset: "XLM",  amount: 30_000,   status: "Pending", from: "0x9a...f03d", to: "0x3f...a91c", hash: "0xyz4...5678" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmount(n: number, asset: string) {
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${asset}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const TYPE_ICONS: Record<TxType, string> = {
  "Deposit":       "↓",
  "Withdrawal":    "↑",
  "Stream Update": "⟳",
};

const TYPE_COLORS: Record<TxType, string> = {
  "Deposit":       "#00f5ff",
  "Withdrawal":    "#9d4edd",
  "Stream Update": "#f59e0b",
};

// ─── Status Pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: TxStatus }) {
  const styles: Record<TxStatus, { bg: string; border: string; color: string; pulse: boolean }> = {
    Success: { bg: "rgba(0,245,255,0.08)",  border: "rgba(0,245,255,0.25)",  color: "#00f5ff", pulse: false },
    Pending: { bg: "rgba(160,160,180,0.08)", border: "rgba(160,160,180,0.2)", color: "#a0a0b4", pulse: true  },
    Failed:  { bg: "rgba(157,78,221,0.1)",  border: "rgba(157,78,221,0.3)",  color: "#9d4edd", pulse: false },
  };
  const s = styles[status];

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99,
      border: `1px solid ${s.border}`,
      background: s.bg,
      color: s.color,
      fontFamily: "'DM Mono', monospace",
      fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" as const,
      whiteSpace: "nowrap" as const,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: s.color,
        boxShadow: `0 0 6px ${s.color}`,
        animation: s.pulse ? "pill-pulse 1.4s ease-in-out infinite" : "none",
        flexShrink: 0,
      }} />
      {status}
    </span>
  );
}

// ─── Sort Header Cell ─────────────────────────────────────────────────────────

function SortTh({ label, sortKey, current, dir, onClick }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir; onClick: () => void;
}) {
  const active = current === sortKey;
  return (
    <th
      onClick={onClick}
      style={{
        padding: "12px 16px",
        fontFamily: "'DM Mono', monospace",
        fontSize: 9, letterSpacing: 2.5,
        textTransform: "uppercase" as const,
        color: active ? "#00f5ff" : "rgba(255,255,255,0.25)",
        cursor: "pointer",
        userSelect: "none" as const,
        textAlign: "left" as const,
        whiteSpace: "nowrap" as const,
        transition: "color .15s",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {label}{" "}
      <span style={{ opacity: active ? 1 : 0.3, fontSize: 8 }}>
        {active ? (dir === "asc" ? "▲" : "▼") : "⇅"}
      </span>
    </th>
  );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 14px", borderRadius: 99,
      border: `1px solid ${active ? "rgba(0,245,255,0.4)" : "rgba(255,255,255,0.08)"}`,
      background: active ? "rgba(0,245,255,0.08)" : "rgba(255,255,255,0.02)",
      color: active ? "#00f5ff" : "rgba(255,255,255,0.3)",
      fontFamily: "'DM Mono', monospace",
      fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" as const,
      cursor: "pointer",
      transition: "all .15s",
    }}>
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TransactionHistory() {
  const [sortKey, setSortKey]       = useState<SortKey>("date");
  const [sortDir, setSortDir]       = useState<SortDir>("desc");
  const [typeFilter, setTypeFilter] = useState<TxType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<TxStatus | "All">("All");
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const PER_PAGE = 8;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let rows = [...TRANSACTIONS];
    if (typeFilter !== "All")   rows = rows.filter(r => r.type === typeFilter);
    if (statusFilter !== "All") rows = rows.filter(r => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.hash.toLowerCase().includes(q) ||
        r.from.toLowerCase().includes(q) ||
        r.to.toLowerCase().includes(q)   ||
        r.asset.toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      let av: number | string, bv: number | string;
      if (sortKey === "date")   { av = a.date;   bv = b.date; }
      else if (sortKey === "amount") { av = a.amount; bv = b.amount; }
      else if (sortKey === "type")   { av = a.type;   bv = b.type; }
      else                           { av = a.status; bv = b.status; }
      if (av < bv) return sortDir === "asc" ? -1 :  1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
    return rows;
  }, [sortKey, sortDir, typeFilter, statusFilter, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const KEYFRAMES = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@300;400;500&display=swap');
    @keyframes pill-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
    @keyframes row-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
    @keyframes fade-in { from{opacity:0} to{opacity:1} }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { height: 4px; width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,245,255,0.2); border-radius: 99px; }
    .tx-row { transition: background .15s; }
    .tx-row:hover { background: rgba(255,255,255,0.04) !important; }
    .tx-row:hover .tx-hash { color: #00f5ff !important; }
    .search-input::placeholder { color: rgba(255,255,255,0.2); }
    .search-input:focus { outline: none; border-color: rgba(0,245,255,0.3) !important; }
    .page-btn { transition: all .15s; }
    .page-btn:hover:not(:disabled) { border-color: rgba(0,245,255,0.4) !important; color: #00f5ff !important; }
    .page-btn:disabled { opacity: .3; cursor: default; }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

      <div style={{
        minHeight: "100vh",
        background: "#06060f",
        padding: "32px 24px",
        fontFamily: "'DM Mono', monospace",
        animation: "fade-in .4s ease both",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>
              StellarStream
            </p>
            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800,
              color: "#fff", letterSpacing: -1, lineHeight: 1,
            }}>
              Transaction History
            </h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8, lineHeight: 1.6 }}>
              Every stream update, withdrawal, and deposit — sortable and searchable.
            </p>
          </div>

          {/* ── Summary chips ── */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { label: "Total Txs",   value: TRANSACTIONS.length.toString() },
              { label: "Success",     value: TRANSACTIONS.filter(t => t.status === "Success").length.toString(), color: "#00f5ff" },
              { label: "Pending",     value: TRANSACTIONS.filter(t => t.status === "Pending").length.toString(), color: "#a0a0b4" },
              { label: "Failed",      value: TRANSACTIONS.filter(t => t.status === "Failed").length.toString(),  color: "#9d4edd" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                padding: "8px 16px", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.025)",
              }}>
                <span style={{ fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                  {label}{" "}
                </span>
                <span style={{ fontSize: 14, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: color ?? "#fff" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* ── Glass card ── */}
          <div style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            overflow: "hidden",
            backdropFilter: "blur(20px)",
            position: "relative",
          }}>
            {/* Top edge shimmer */}
            <div style={{
              position: "absolute", top: 0, left: "5%", right: "5%", height: 1,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
            }} />

            {/* ── Toolbar ── */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
            }}>
              {/* Search */}
              <input
                className="search-input"
                placeholder="Search hash, address, asset…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{
                  flex: "1 1 200px", minWidth: 180,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, padding: "7px 12px",
                  color: "#fff", fontSize: 11, letterSpacing: 0.5,
                  fontFamily: "'DM Mono', monospace",
                }}
              />

              {/* Type filters */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["All", "Deposit", "Withdrawal", "Stream Update"] as const).map(f => (
                  <FilterPill key={f} label={f} active={typeFilter === f} onClick={() => { setTypeFilter(f); setPage(1); }} />
                ))}
              </div>

              {/* Status filters */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["All", "Success", "Pending", "Failed"] as const).map(f => (
                  <FilterPill key={f} label={f} active={statusFilter === f} onClick={() => { setStatusFilter(f); setPage(1); }} />
                ))}
              </div>
            </div>

            {/* ── Table ── */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                    <SortTh label="Date"   sortKey="date"   current={sortKey} dir={sortDir} onClick={() => handleSort("date")} />
                    <SortTh label="Type"   sortKey="type"   current={sortKey} dir={sortDir} onClick={() => handleSort("type")} />
                    <SortTh label="Amount" sortKey="amount" current={sortKey} dir={sortDir} onClick={() => handleSort("amount")} />
                    <SortTh label="Status" sortKey="status" current={sortKey} dir={sortDir} onClick={() => handleSort("status")} />
                    <th style={{ padding: "12px 16px", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(255,255,255,0.25)", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>From → To</th>
                    <th style={{ padding: "12px 16px", fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(255,255,255,0.25)", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
                        No transactions match your filters.
                      </td>
                    </tr>
                  ) : paged.map((tx, i) => (
                    <tr
                      key={tx.id}
                      className="tx-row"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        animation: `row-in .25s ${i * 30}ms ease both`,
                      }}
                    >
                      {/* Date */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                          {fmtDate(tx.date)}
                        </span>
                      </td>

                      {/* Type */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                          <span style={{
                            width: 26, height: 26, borderRadius: 8,
                            background: `${TYPE_COLORS[tx.type]}15`,
                            border: `1px solid ${TYPE_COLORS[tx.type]}30`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: TYPE_COLORS[tx.type], fontSize: 12, flexShrink: 0,
                          }}>
                            {TYPE_ICONS[tx.type]}
                          </span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 0.5 }}>
                            {tx.type}
                          </span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "#fff" }}>
                          {fmtAmount(tx.amount, tx.asset)}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <StatusPill status={tx.status} />
                      </td>

                      {/* From → To */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 0.5 }}>
                          {tx.from}
                          <span style={{ color: "rgba(255,255,255,0.15)", margin: "0 6px" }}>→</span>
                          {tx.to}
                        </span>
                      </td>

                      {/* Hash */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          className="tx-hash"
                          style={{
                            fontSize: 11, color: "rgba(255,255,255,0.25)",
                            letterSpacing: 0.5, cursor: "pointer",
                            transition: "color .15s",
                          }}
                          title={tx.hash}
                        >
                          {tx.hash}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <div style={{
              padding: "14px 20px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 10,
            }}>
              <span style={{ fontSize: 10, letterSpacing: 1.5, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
                {filtered.length === 0 ? "0 results" : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length}`}
              </span>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{
                    padding: "5px 14px", borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 11, cursor: "pointer",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className="page-btn"
                    onClick={() => setPage(p)}
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      border: `1px solid ${p === page ? "rgba(0,245,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                      background: p === page ? "rgba(0,245,255,0.08)" : "rgba(255,255,255,0.02)",
                      color: p === page ? "#00f5ff" : "rgba(255,255,255,0.3)",
                      fontSize: 11, cursor: "pointer",
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="page-btn"
                  disabled={page === totalPages || totalPages === 0}
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    padding: "5px 14px", borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 11, cursor: "pointer",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}