"use client";

import { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { usePriceFetcher } from "@/lib/hooks/use-price-fetcher";

interface YieldImpactDashboardProps {
  /** Total amount held before disbursement, in token units */
  principalAmount: number;
  /** Token symbol, e.g. "USDC" */
  token: string;
  /** Planned release date */
  releaseDate: Date;
}

const POOL_LABELS: Record<string, string> = {
  YBX:       "YBX Protocol",
  Allbridge: "Allbridge Core",
};

function buildProjection(
  principal: number,
  apyDecimal: number,
  releaseDate: Date,
  maxDays: number,
): { day: number; label: string; netGain: number; total: number }[] {
  const today = Date.now();
  const releaseDays = Math.max(
    1,
    Math.ceil((releaseDate.getTime() - today) / 86_400_000),
  );
  const points = Math.min(maxDays, releaseDays);
  const step = Math.max(1, Math.floor(points / 40));

  const rows = [];
  for (let d = step; d <= points; d += step) {
    const netGain = principal * apyDecimal * (d / 365);
    rows.push({
      day: d,
      label: `Day ${d}`,
      netGain: parseFloat(netGain.toFixed(4)),
      total: parseFloat((principal + netGain).toFixed(4)),
    });
  }
  return rows;
}

const MOCK_APYS: Record<string, number> = { YBX: 0.082, Allbridge: 0.065 };

export function YieldImpactDashboard({
  principalAmount,
  token,
  releaseDate,
}: YieldImpactDashboardProps) {
  const { getPrice, isLoading: priceLoading } = usePriceFetcher();
  const [apys, setApys] = useState<Record<string, number>>(MOCK_APYS);
  const [selectedPool, setSelectedPool] = useState<string>("YBX");

  // Fetch live APYs from backend price oracle
  useEffect(() => {
    fetch("/api/v3/yield/apy-rates")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setApys(data); })
      .catch(() => {}); // fall back to mock
  }, []);

  const priceUsd = getPrice(token);
  const apy = apys[selectedPool] ?? 0;

  const daysUntilRelease = Math.max(
    1,
    Math.ceil((releaseDate.getTime() - Date.now()) / 86_400_000),
  );

  const data = useMemo(
    () => buildProjection(principalAmount, apy, releaseDate, daysUntilRelease),
    [principalAmount, apy, releaseDate, daysUntilRelease],
  );

  const finalGain = data[data.length - 1]?.netGain ?? 0;
  const finalGainUsd = priceUsd > 0 ? finalGain * priceUsd : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 space-y-5 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 border border-violet-400/20">
          <TrendingUp className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Yield-Impact Projection</h2>
          <p className="text-xs text-white/40 mt-0.5">
            Potential interest if funds are held until release date.
          </p>
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      {/* Pool selector */}
      <div className="flex gap-2 flex-wrap">
        {Object.keys(POOL_LABELS).map((pool) => (
          <button
            key={pool}
            onClick={() => setSelectedPool(pool)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              selectedPool === pool
                ? "border-violet-400/40 bg-violet-400/15 text-violet-300"
                : "border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70"
            }`}
          >
            {POOL_LABELS[pool]}
            <span className="ml-1.5 text-[10px] opacity-60">
              {((apys[pool] ?? 0) * 100).toFixed(1)}% APY
            </span>
          </button>
        ))}
      </div>

      {/* Net gain summary */}
      <div className="flex gap-4 flex-wrap">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 flex-1 min-w-[120px]">
          <p className="text-[10px] tracking-widest text-white/40 uppercase">Net Gain ({token})</p>
          <p className="font-mono text-lg font-bold text-violet-300 mt-0.5">
            +{finalGain.toFixed(4)}
          </p>
        </div>
        {finalGainUsd !== null && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 flex-1 min-w-[120px]">
            <p className="text-[10px] tracking-widest text-white/40 uppercase">Net Gain (USD)</p>
            <p className="font-mono text-lg font-bold text-emerald-400 mt-0.5">
              +${finalGainUsd.toFixed(2)}
            </p>
          </div>
        )}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 flex-1 min-w-[120px]">
          <p className="text-[10px] tracking-widest text-white/40 uppercase">Days to Release</p>
          <p className="font-mono text-lg font-bold text-white/80 mt-0.5">{daysUntilRelease}d</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `+${v.toFixed(2)}`}
              width={52}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(13,17,23,0.95)",
                border: "1px solid rgba(167,139,250,0.3)",
                borderRadius: 10,
                fontSize: 12,
                color: "#fff",
              }}
              formatter={(v: number) => [`+${v.toFixed(4)} ${token}`, "Net Gain"]}
              labelFormatter={(l) => l}
            />
            <Line
              type="monotone"
              dataKey="netGain"
              stroke="#a78bfa"
              strokeWidth={2.5}
              dot={false}
              name="Net Gain"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-white/25">
        Rates sourced from backend price oracle. Projections are estimates and not financial advice.
      </p>
    </div>
  );
}
