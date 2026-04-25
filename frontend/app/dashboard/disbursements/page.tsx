"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, X, ChevronDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { useDisbursementData, type MonthlyDisbursement } from "@/lib/use-disbursement-data";

const fmt = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`;
const fmtFull = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: MonthlyDisbursement = payload[0].payload;
  return (
    <div className="glass-card px-4 py-3 text-sm">
      <p className="font-body font-semibold text-white">{d.label}</p>
      <p className="font-ticker text-[#00f5ff] mt-1">{fmtFull(d.totalUsd)}</p>
      <p className="font-body text-white/40 text-xs mt-0.5">{d.events.length} events</p>
    </div>
  );
}

export default function DisbursementsPage() {
  const { data, isLoading } = useDisbursementData();
  const [selected, setSelected] = useState<MonthlyDisbursement | null>(null);

  const avgMonthly = data ? data.totalUsd / data.months.length : 0;

  return (
    <div className="space-y-6 p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#00f5ff]/20 bg-[#00f5ff]/10">
          <TrendingDown className="h-6 w-6 text-[#00f5ff]" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Disbursement Timeline</h1>
          <p className="font-body mt-1 text-sm text-white/50">Monthly outflow history — click a bar to drill down into individual split events.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Outflow", value: data ? fmtFull(data.totalUsd) : "—" },
          { label: "Peak Month", value: data?.peakMonth ?? "—" },
          { label: "Avg Monthly", value: data ? fmtFull(avgMonthly) : "—" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <p className="font-body text-[10px] uppercase tracking-widest text-white/30">{s.label}</p>
            <p className="font-ticker mt-1 text-lg font-semibold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card p-5">
        <p className="font-body mb-4 text-xs font-medium uppercase tracking-widest text-white/30">Monthly Outflow (USD)</p>
        {isLoading ? (
          <div className="flex items-end gap-3 h-48 px-4">
            {[60,80,45,90,70,100].map((h,i) => (
              <div key={i} className="flex-1 rounded-t-lg bg-white/10 animate-pulse" style={{ height: `${h}%` }} />
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.months} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              onClick={(e) => { if (e?.activePayload?.[0]) setSelected(e.activePayload[0].payload); }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#8a00ff" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "Poppins" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmt} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "Poppins" }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="totalUsd" fill="url(#barGrad)" radius={[6,6,0,0]} cursor="pointer">
                {data?.months.map((m) => (
                  <Cell key={m.month}
                    fill={selected?.month === m.month ? "#00f5ff" : "url(#barGrad)"}
                    opacity={selected && selected.month !== m.month ? 0.45 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Drill-down panel */}
      <AnimatePresence>
        {selected && (
          <motion.div key={selected.month} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-xs uppercase tracking-widest text-white/30">Drill-down</p>
                <p className="font-heading text-lg text-white mt-0.5">{selected.label} — {fmtFull(selected.totalUsd)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {selected.events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-body text-xs text-white/30">{ev.date}</span>
                    <span className="font-ticker text-xs text-white/60">{ev.recipient}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-ticker text-[10px] text-white/40">{ev.token}</span>
                  </div>
                  <span className="font-ticker text-sm font-semibold text-[#00f5ff]">{fmtFull(ev.amountUsd)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
