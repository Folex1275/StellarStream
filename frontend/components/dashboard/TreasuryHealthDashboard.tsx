"use client";

import { useState, useEffect } from "react";
import type { TreasuryStats } from "@/app/api/v3/stats/route";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

// ─── Pie Chart (SVG, no extra deps) ──────────────────────────────────────────
function PieChart({ data }: { data: { token: string; usdVolume: number; color: string }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.usdVolume, 0);

  // Build SVG arc paths
  const R = 70, r = 42, cx = 90, cy = 90;
  let cursor = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const angle = (d.usdVolume / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(cursor);
    const y1 = cy + R * Math.sin(cursor);
    cursor += angle;
    const x2 = cx + R * Math.cos(cursor);
    const y2 = cy + R * Math.sin(cursor);
    const ix1 = cx + r * Math.cos(cursor - angle);
    const iy1 = cy + r * Math.sin(cursor - angle);
    const ix2 = cx + r * Math.cos(cursor);
    const iy2 = cy + r * Math.sin(cursor);
    const large = angle > Math.PI ? 1 : 0;
    const path = [
      `M ${x1} ${y1}`,
      `A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1}`,
      "Z",
    ].join(" ");
    return { ...d, path, pct: (d.usdVolume / total) * 100, index: i };
  });

  const active = hovered !== null ? slices[hovered] : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={180} height={180} viewBox="0 0 180 180">
          {slices.map((s) => (
            <path
              key={s.token}
              d={s.path}
              fill={s.color}
              opacity={hovered === null || hovered === s.index ? 1 : 0.35}
              style={{
                filter: hovered === s.index ? `drop-shadow(0 0 8px ${s.color}99)` : "none",
                transition: "opacity 0.2s, filter 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHovered(s.index)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-body text-[9px] tracking-widest text-white/30 uppercase">
            {active ? active.token : "Total"}
          </p>
          <p
            className="font-heading text-xl tabular-nums"
            style={{ color: active ? active.color : "#22d3ee", textShadow: `0 0 12px ${active?.color ?? "#22d3ee"}66` }}
          >
            {active ? `${active.pct.toFixed(1)}%` : fmtUSD(total)}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3">
        {slices.map((s) => (
          <div
            key={s.token}
            className="flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all duration-200 cursor-default"
            style={{
              borderColor: hovered === s.index ? `${s.color}66` : "rgba(255,255,255,0.08)",
              background: hovered === s.index ? `${s.color}14` : "rgba(255,255,255,0.02)",
            }}
            onMouseEnter={() => setHovered(s.index)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="font-body text-xs font-bold text-white/70">{s.token}</span>
            <span className="font-body text-xs text-white/35 tabular-nums">{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stats Grid ───────────────────────────────────────────────────────────────
function StatsGrid({ stats }: { stats: TreasuryStats }) {
  const tiles = [
    { label: "Total Volume",    value: fmtUSD(stats.totalVolume),  icon: "∿", color: "#22d3ee" },
    { label: "Active Streams",  value: String(stats.activeStreams), icon: "⟶", color: "#34d399" },
    { label: "Top Asset",       value: stats.assetVolumes[0]?.token ?? "—", icon: "◈", color: "#a78bfa" },
    { label: "Recipients",      value: String(stats.topRecipients.length), icon: "◎", color: "#fb923c" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 hover:border-white/[0.13] hover:bg-white/[0.05] transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-body text-[10px] tracking-[0.12em] text-white/40 uppercase">{t.label}</p>
            <span className="text-base" style={{ color: t.color }}>{t.icon}</span>
          </div>
          <p className="font-heading text-2xl tabular-nums" style={{ color: t.color, textShadow: `0 0 16px ${t.color}44` }}>
            {t.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Top Recipients Table ─────────────────────────────────────────────────────
function TopRecipientsTable({ recipients, totalVolume }: { recipients: TreasuryStats["topRecipients"]; totalVolume: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.06]">
        <p className="font-body text-[10px] tracking-[0.12em] text-white/40 uppercase">Top 5 Recipients</p>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {recipients.map((r, i) => {
          const pct = (r.totalReceived / totalVolume) * 100;
          return (
            <div key={r.address} className="flex items-center gap-4 px-5 py-3">
              <span className="font-body text-xs text-white/20 w-4 tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-bold text-white/80 truncate">{r.label ?? r.address}</p>
                <p className="font-body text-[10px] text-white/30 font-mono truncate">{r.address}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-body text-sm font-bold text-cyan-400 tabular-nums">{fmtUSD(r.totalReceived)}</p>
                <p className="font-body text-[10px] text-white/30 tabular-nums">{pct.toFixed(1)}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TreasuryHealthDashboard() {
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v3/stats")
      .then((r) => r.json())
      .then((data: TreasuryStats) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 flex items-center justify-center min-h-[320px]">
        <div className="flex items-center gap-3 text-white/30">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="font-body text-sm">Loading treasury data…</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-400/[0.04] p-8 text-center">
        <p className="font-body text-sm text-red-400/70">Failed to load treasury stats.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
          <p className="font-body text-[10px] tracking-[0.12em] text-white/40 uppercase mb-4">Volume by Asset</p>
          <PieChart data={stats.assetVolumes} />
        </div>

        {/* Top recipients */}
        <TopRecipientsTable recipients={stats.topRecipients} totalVolume={stats.totalVolume} />
      </div>
    </div>
  );
}
