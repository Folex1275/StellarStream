"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatConfig {
  label: string;
  sublabel: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  format: "currency" | "number";
  delta: string;
  deltaPositive: boolean;
  icon: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS: StatConfig[] = [
  {
    label:         "Total Value Locked",
    sublabel:      "Across all active streams",
    value:         84_210_437.52,
    prefix:        "$",
    format:        "currency",
    decimals:      2,
    delta:         "+12.4% this week",
    deltaPositive: true,
    icon:          "◈",
  },
  {
    label:         "Active Streams",
    sublabel:      "Currently streaming on-chain",
    value:         3_847,
    format:        "number",
    decimals:      0,
    delta:         "+284 today",
    deltaPositive: true,
    icon:          "⟶",
  },
  {
    label:         "Protocol Volume",
    sublabel:      "Total all-time throughput",
    value:         1_203_840_000,
    prefix:        "$",
    format:        "currency",
    decimals:      0,
    delta:         "+$2.1M today",
    deltaPositive: true,
    icon:          "∿",
  },
  {
    label:         "Avg Stream Duration",
    sublabel:      "Mean active stream length",
    value:         28.4,
    suffix:        "d",
    format:        "number",
    decimals:      1,
    delta:         "−1.2d vs last month",
    deltaPositive: false,
    icon:          "◷",
  },
];

const SPARK_COLORS = ["#22d3ee", "#34d399", "#a78bfa", "#fb923c"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatValue(value: number, config: StatConfig): string {
  const { prefix = "", suffix = "", format, decimals = 0 } = config;

  if (format === "currency") {
    if (value >= 1_000_000_000) return `${prefix}${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000)     return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)         return `${prefix}${(value / 1_000).toFixed(decimals)}K`;
    return `${prefix}${value.toFixed(decimals)}`;
  }
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M${suffix}`;
  if (value >= 1_000)     return `${prefix}${(value / 1_000).toFixed(1)}K${suffix}`;
  return `${prefix}${value.toFixed(decimals)}${suffix}`;
}

// ─── Count-up hook (issue requirement) ───────────────────────────────────────
function useCountUp(target: number, duration = 1600, delay = 0) {
  const [current, setCurrent] = useState(0);
  const raf = useRef<number | null>(null);
  const t0  = useRef<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const tick = (ts: number) => {
        if (t0.current === null) t0.current = ts;
        const p = Math.min((ts - t0.current) / duration, 1);
        const e = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setCurrent(e * target);
        if (p < 1) raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, delay]);

  return current;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function AnimatedStat({ config, delay }: { config: StatConfig; delay: number }) {
  const val = useCountUp(config.value, 1600, delay);
  return <>{formatValue(val, config)}</>;
}

function Sparkline({ color }: { color: string }) {
  const pts  = [40, 35, 52, 45, 60, 55, 70, 62, 78, 72, 85, 80, 92, 88, 95];
  const W = 80, H = 28;
  const min  = Math.min(...pts);
  const max  = Math.max(...pts);
  const ny   = (v: number) => H - ((v - min) / (max - min)) * H;
  const d    = pts.map((p, i) => `${i ? "L" : "M"}${((i / (pts.length - 1)) * W).toFixed(1)},${ny(p).toFixed(1)}`).join(" ");
  const area = `${d} L${W},${H} L0,${H}Z`;
  const id   = `sg-${color.replace("#", "")}`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Pulsing green Live badge (issue requirement) ──────────────────────────────
function LiveBadge() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5">
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        <span
          className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"
          style={{ boxShadow: "0 0 8px rgba(52,211,153,0.9)" }}
        />
      </span>
      <span className="font-body text-[10px] font-bold tracking-[0.15em] text-emerald-400 uppercase">
        Live
      </span>
    </div>
  );
}

function StatCard({ config, index, color }: { config: StatConfig; index: number; color: string }) {
  return (
    <div
      className="relative flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 overflow-hidden transition-all duration-300 hover:border-white/[0.13] hover:bg-white/[0.05] group"
      style={{ animation: `pulseReveal 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 80}ms both` }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.07) 0%, transparent 70%)" }}
      />

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-body text-[10px] tracking-[0.12em] text-white/40 uppercase">{config.label}</p>
          <p className="font-body text-[9px] text-white/25 mt-0.5">{config.sublabel}</p>
        </div>
        <span className="text-lg text-white/20 group-hover:text-white/35 transition-colors duration-300">
          {config.icon}
        </span>
      </div>

      {/* Count-up animated number */}
      <p className="font-heading text-3xl md:text-4xl text-white tabular-nums leading-none mb-1">
        <AnimatedStat config={config} delay={index * 120 + 200} />
      </p>

      <div className="flex items-center justify-between mt-3">
        <span
          className="font-body text-[10px] font-bold"
          style={{ color: config.deltaPositive ? "#34d399" : "#fb923c" }}
        >
          {config.delta}
        </span>
        <Sparkline color={color} />
      </div>
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
export function ProtocolPulseCard() {
  // ✅ FIX: null on server → real Date on client, prevents hydration mismatch
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setLastUpdated(new Date());
    const id = setInterval(() => setLastUpdated(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <style>{`
        @keyframes meshDrift1 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(28px,-18px) scale(1.1); }
          70%      { transform: translate(-12px,22px) scale(0.94); }
        }
        @keyframes meshDrift2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-30px,18px) scale(1.12); }
        }
        @keyframes scanSweep {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(200%); opacity: 0; }
        }
        @keyframes pulseReveal {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes headerReveal {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="relative rounded-3xl border border-white/10 overflow-hidden">

        {/* ── Shifting mesh gradient background (issue requirement) ── */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0" style={{ background: "rgba(6,10,20,0.96)" }} />
          <div
            className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-[72px] opacity-[0.08]"
            style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)", animation: "meshDrift1 14s ease-in-out infinite" }}
          />
          <div
            className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full blur-[64px] opacity-[0.07]"
            style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)", animation: "meshDrift2 18s ease-in-out infinite" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 w-[500px] rounded-full blur-[90px] opacity-[0.04]"
            style={{ background: "radial-gradient(ellipse, #34d399 0%, transparent 70%)" }}
          />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: "linear-gradient(rgba(34,211,238,1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        {/* ── Scanline overlay (issue requirement) ── */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden" aria-hidden>
          <div
            className="absolute inset-0 opacity-[0.022]"
            style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,1) 3px, rgba(255,255,255,1) 4px)" }}
          />
          <div
            className="absolute left-0 right-0 h-1/3 opacity-[0.05]"
            style={{ background: "linear-gradient(180deg, transparent 0%, rgba(34,211,238,0.4) 50%, transparent 100%)", animation: "scanSweep 10s linear infinite" }}
          />
        </div>

        {/* ── Content ── */}
        <div className="relative z-10 p-6 md:p-8">

          <div
            className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6"
            style={{ animation: "headerReveal 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
          >
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">
                  Protocol Health
                </p>
                <LiveBadge />
              </div>
              <h2 className="font-heading mt-2 text-3xl md:text-4xl">Protocol Pulse</h2>
              <p className="font-body mt-1 text-sm text-white/50">
                Real-time TVL, stream activity, and throughput.
              </p>
            </div>

            {/* Timestamp — shows "--:--:--" on server, real time after mount */}
            <div className="flex-shrink-0 sm:text-right">
              <p className="font-body text-[10px] text-white/25 uppercase tracking-wider">Updated</p>
              <p className="font-body text-xs text-white/40 tabular-nums mt-0.5">
                {lastUpdated
                  ? lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                  : "--:--:--"}
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map((stat, i) => (
              <StatCard key={stat.label} config={stat} index={i} color={SPARK_COLORS[i]} />
            ))}
          </div>

          {/* Footer */}
          <div
            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-3"
            style={{ animation: "pulseReveal 0.5s cubic-bezier(0.16,1,0.3,1) 440ms both" }}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <p className="font-body text-[11px] text-white/35">
                Syncing every <span className="text-cyan-400/70">30s</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              {[
                { label: "Network", value: "Starknet"   },
                { label: "Block",   value: "#1,482,940" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className="font-body text-[10px] text-white/25 uppercase tracking-wider">{item.label}</span>
                  <span className="font-body text-[11px] font-bold text-white/50">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}