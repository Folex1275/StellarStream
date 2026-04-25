"use client";

import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import type { SimulationWaterfallSummary } from "@/lib/simulation-waterfall";

interface SimulationWaterfallProps {
  asset: string;
  summary: SimulationWaterfallSummary;
  title?: string;
  description?: string;
}

function fmtAmount(value: number, asset: string): string {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  })} ${asset}`;
}

export function SimulationWaterfall({
  asset,
  summary,
  title = "Simulation",
  description = "Preview how value moves through the transaction before signature.",
}: SimulationWaterfallProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-body text-[10px] tracking-[0.14em] text-cyan-400/70 uppercase">{title}</p>
          <h3 className="font-heading mt-1 text-xl text-white">Execution Waterfall</h3>
          <p className="font-body mt-2 max-w-xl text-sm text-white/50">{description}</p>
        </div>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] px-4 py-3 text-right">
          <p className="font-body text-[10px] tracking-[0.12em] text-white/35 uppercase">Recipients Receive</p>
          <p className="font-body mt-1 text-lg font-bold text-cyan-400">
            {fmtAmount(summary.totalRecipientAmount, asset)}
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={summary.hops}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.08)" />
            <XAxis
              type="number"
              stroke="rgba(255,255,255,0.35)"
              tickFormatter={(value) => value.toLocaleString("en-US")}
            />
            <YAxis
              dataKey="to"
              type="category"
              width={140}
              stroke="rgba(255,255,255,0.35)"
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: "rgba(7, 10, 18, 0.96)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                color: "white",
              }}
              formatter={(value: number) => fmtAmount(value, asset)}
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as { from: string; to: string; label: string } | undefined;
                return row ? `${row.label}: ${row.from} → ${row.to}` : "";
              }}
            />
            <Bar dataKey="amount" radius={[0, 12, 12, 0]}>
              {summary.hops.map((hop) => (
                <Cell key={hop.id} fill={hop.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
          <p className="font-body text-[10px] tracking-[0.12em] text-white/35 uppercase">Network Fee</p>
          <p className="font-body mt-1 text-sm font-bold text-rose-300">{fmtAmount(summary.networkFee, asset)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
          <p className="font-body text-[10px] tracking-[0.12em] text-white/35 uppercase">Protocol Fee</p>
          <p className="font-body mt-1 text-sm font-bold text-amber-300">{fmtAmount(summary.protocolFee, asset)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
          <p className="font-body text-[10px] tracking-[0.12em] text-white/35 uppercase">Recipient Total</p>
          <p className="font-body mt-1 text-sm font-bold text-emerald-300">
            {fmtAmount(summary.totalRecipientAmount, asset)}
          </p>
        </div>
      </div>
    </section>
  );
}
