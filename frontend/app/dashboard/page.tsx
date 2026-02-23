"use client";

import { useState, useEffect } from "react";
import TransactionHistory from "@/components/dashboard/TransactionHistory";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stream {
  id: string;
  name: string;
  token: string;
  status: "active" | "paused" | "ended";
  startTime: Date;
  endTime: Date;
  totalAmount: number;
  streamed: number;
  yieldEarned: number;
  sender: string;
  recipient: string;
  ratePerSecond: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const STREAM: Stream = {
  id: "0x4a3b…f91c",
  name: "DAO Treasury → Dev Fund",
  token: "USDC",
  status: "active",
  startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
  endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 48),
  totalAmount: 120_000,
  streamed: 37_500,
  yieldEarned: 842.17,
  sender: "0xDAO1…3a2f",
  recipient: "0xDev9…7bc1",
  ratePerSecond: 0.03858,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

// ─── Live Counter ─────────────────────────────────────────────────────────────
function LiveCounter({ base, rate }: { base: number; rate: number }) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setVal((v) => v + rate * 0.1), 100);
    return () => clearInterval(id);
  }, [rate]);
  return <>{fmt(val)}</>;
}

// ─── Radial Progress Arc ──────────────────────────────────────────────────────
function RadialProgress({ pct }: { pct: number }) {
  const r = 38, cx = 46, cy = 46, sw = 6;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={92} height={92} aria-label={`${pct.toFixed(1)}% complete`}>
      <defs>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="url(#arcGrad)" strokeWidth={sw}
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 8px rgba(52,211,153,0.6))" }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize={14} fontWeight={700}>
        {Math.round(pct)}%
      </text>
      <text x={cx} y={cy + 11} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={8} letterSpacing="0.1em">
        DONE
      </text>
    </svg>
  );
}

// ─── SVG Stream Chart ─────────────────────────────────────────────────────────
function StreamChart({ stream }: { stream: Stream }) {
  const W = 800, H = 220;
  const PAD = { t: 16, r: 16, b: 44, l: 60 };
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  const t0 = stream.startTime.getTime();
  const t1 = Date.now();
  const STEPS = 100;

  const points = Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = t0 + ((t1 - t0) * i) / STEPS;
    const elapsed = (t - t0) / 1000;
    const amount = elapsed * stream.ratePerSecond;
    const yld = amount * 0.00225 + Math.sin(i * 0.4) * 1.8 + Math.cos(i * 0.15) * 0.8;
    return { t, amount, yld };
  });

  const maxAmt = (stream.ratePerSecond * ((t1 - t0) / 1000)) * 1.12;
  const xS = (t: number) => ((t - t0) / (t1 - t0)) * iW;
  const yS = (v: number) => iH - (v / maxAmt) * iH;

  const streamD = points.map((p, i) => `${i ? "L" : "M"}${xS(p.t).toFixed(1)},${yS(p.amount).toFixed(1)}`).join(" ");
  const yldD    = points.map((p, i) => `${i ? "L" : "M"}${xS(p.t).toFixed(1)},${yS(p.yld * 300).toFixed(1)}`).join(" ");
  const areaD   = streamD + ` L${iW},${iH} L0,${iH}Z`;

  const yGrids = [0, 0.25, 0.5, 0.75, 1];
  const xLabels = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    x: iW * f,
    label: fmtDate(new Date(t0 + (t1 - t0) * f)),
  }));

  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="streamLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
          <stop offset="70%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g transform={`translate(${PAD.l},${PAD.t})`}>
        {yGrids.map((f) => (
          <g key={f}>
            <line x1={0} y1={iH * (1 - f)} x2={iW} y2={iH * (1 - f)}
              stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
            <text x={-8} y={iH * (1 - f) + 4} fill="rgba(255,255,255,0.25)"
              fontSize={9} textAnchor="end" fontFamily="monospace">
              {fmt(maxAmt * f, 0)}
            </text>
          </g>
        ))}
        {xLabels.map((xl) => (
          <text key={xl.x} x={xl.x} y={iH + 28} fill="rgba(255,255,255,0.25)"
            fontSize={9} textAnchor="middle" fontFamily="monospace">{xl.label}</text>
        ))}

        <path d={areaD} fill="url(#areaFill)" />
        <path d={yldD} fill="none" stroke="#a78bfa" strokeWidth={1.5}
          strokeDasharray="5 4" opacity={0.6} />
        <path d={streamD} fill="none" stroke="url(#streamLine)" strokeWidth={2.5}
          filter="url(#glow)" />

        <circle cx={xS(last.t)} cy={yS(last.amount)} r={5} fill="#34d399" filter="url(#glow)">
          <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}

// ─── Reusable Card ────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StreamDetailPage() {
  const [streamed, setStreamed] = useState(STREAM.streamed);

  useEffect(() => {
    const id = setInterval(() => setStreamed((v) => v + STREAM.ratePerSecond * 0.5), 500);
    return () => clearInterval(id);
  }, []);

  const pct       = (streamed / STREAM.totalAmount) * 100;
  const remaining = STREAM.totalAmount - streamed;
  const daysLeft  = Math.ceil((STREAM.endTime.getTime() - Date.now()) / 86_400_000);

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-4">

      {/* ── Header ── */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">Stream Detail</p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Live
              </span>
            </div>
            <h1 className="font-heading mt-2 text-3xl md:text-5xl">{STREAM.name}</h1>
            <p className="font-body mt-1 text-xs text-white/40 tracking-wider">{STREAM.id} · {STREAM.token}</p>
            <p className="font-body mt-4 text-white/72 max-w-lg">
              View full history, participants, and live streaming balance for this active payment stream.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 pt-1">
            <button className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60 backdrop-blur-xl transition hover:bg-white/[0.08] hover:text-white/90 font-body">
              ⏸ Pause
            </button>
            <button className="rounded-xl bg-emerald-400 px-5 py-2 text-sm font-bold text-black transition hover:bg-emerald-300 font-body">
              → Withdraw
            </button>
          </div>
        </div>
      </section>

      {/* ── Bento: Chart + Metadata ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">

        {/* LEFT: Large Chart */}
        <Card className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase mb-1">Total Streamed</p>
              <div className="font-heading text-4xl md:text-5xl text-emerald-400 leading-none tabular-nums">
                <LiveCounter base={STREAM.streamed} rate={STREAM.ratePerSecond} />
                <span className="font-body text-lg font-normal text-white/40 ml-2">USDC</span>
              </div>
            </div>
            <div className="flex gap-4 items-center mt-1">
              <div className="flex items-center gap-2 font-body text-xs text-white/40">
                <span className="block w-6" style={{ borderTop: "2px dashed #a78bfa" }} />
                Yield
              </div>
              <div className="flex items-center gap-2 font-body text-xs text-white/40">
                <span className="block h-0.5 w-6" style={{ background: "linear-gradient(90deg,#34d399,#a78bfa)" }} />
                Stream
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { label: "Rate / sec", value: `${STREAM.ratePerSecond.toFixed(5)} USDC` },
              { label: "Rate / day", value: `${fmt(STREAM.ratePerSecond * 86400)} USDC` },
              { label: "Days left",  value: `${daysLeft}d` },
              { label: "Yield APY",  value: "8.2%" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5">
                <p className="font-body text-[10px] tracking-widest text-white/40 uppercase">{s.label}</p>
                <p className="font-body text-sm font-bold text-white/80 mt-0.5 tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="h-[220px] w-full">
            <StreamChart stream={STREAM} />
          </div>

          <div className="mt-6">
            <div className="flex justify-between font-body text-xs text-white/40 mb-2">
              <span>Stream Progress</span>
              <span className="tabular-nums">{fmt(streamed)} / {fmt(STREAM.totalAmount)} USDC</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: "linear-gradient(90deg, #34d399, #a78bfa)",
                  boxShadow: "0 0 12px rgba(52,211,153,0.5)",
                }}
              />
            </div>
          </div>
        </Card>

        {/* RIGHT: Metadata stack */}
        <div className="flex flex-col gap-4">

          <Card className="p-6 flex items-center gap-5">
            <RadialProgress pct={pct} />
            <div>
              <p className="font-body text-xs tracking-widest text-white/40 uppercase">Completion</p>
              <p className="font-heading text-3xl mt-0.5">{pct.toFixed(1)}%</p>
              <p className="font-body text-xs text-white/40 mt-1">{daysLeft} days remaining</p>
            </div>
          </Card>

          <Card className="p-6">
            <p className="font-body text-xs tracking-widest text-white/40 uppercase mb-4">Timeline</p>
            <div className="space-y-4">
              {([
                { label: "Start", date: STREAM.startTime, color: "#34d399" },
                { label: "End",   date: STREAM.endTime,   color: "#a78bfa" },
              ] as const).map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                  <div>
                    <p className="font-body text-[10px] tracking-widest text-white/35 uppercase">{item.label}</p>
                    <p className="font-body text-sm font-bold text-white/85">{fmtDate(item.date)}</p>
                    <p className="font-body text-xs text-white/35">{fmtTime(item.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <p className="font-body text-xs tracking-widest text-white/40 uppercase mb-4">Financials</p>
            <div className="space-y-3">
              {[
                { label: "Total Amount",   value: fmt(STREAM.totalAmount), color: "text-white/80" },
                { label: "Streamed",       value: fmt(streamed),           color: "text-emerald-400" },
                { label: "Remaining",      value: fmt(remaining),          color: "text-orange-400" },
                { label: "Yield Earned ◈", value: fmt(STREAM.yieldEarned), color: "text-violet-400" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="font-body text-xs text-white/40">{row.label}</span>
                  <span className={`font-body text-sm font-bold tabular-nums ${row.color}`}>
                    {row.value} <span className="text-white/25 font-normal text-xs">USDC</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <p className="font-body text-xs tracking-widest text-white/40 uppercase mb-4">Participants</p>
            <div className="space-y-3">
              {[
                { role: "Sender",    addr: STREAM.sender,    icon: "↑" },
                { role: "Recipient", addr: STREAM.recipient, icon: "↓" },
              ].map((p) => (
                <div key={p.role} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/40">
                    {p.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-[10px] tracking-widest text-white/35 uppercase">{p.role}</p>
                    <p className="font-body text-sm font-bold text-white/75 truncate">{p.addr}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── BOTTOM: Transaction History Component (#156) ── */}
      <TransactionHistory />

    </div>
  );
}