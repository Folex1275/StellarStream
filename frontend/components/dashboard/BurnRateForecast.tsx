"use client";

// components/dashboard/BurnRateForecast.tsx
// Visual forecasting tool — cumulative burn rate area chart with
// a liquidity warning reference line.

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useBurnRateForecast, type ForecastWindow } from "@/lib/hooks/use-burn-rate-forecast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function BurnTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number | string }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const cumulative = payload.find((p) => p.dataKey === "cumulative")?.value ?? 0;
  const daily = payload.find((p) => p.dataKey === "daily")?.value ?? 0;
  return (
    <div
      style={{
        background: "rgba(6,6,15,0.92)",
        border: "1px solid rgba(0,245,255,0.2)",
        borderRadius: 12,
        padding: "10px 14px",
        backdropFilter: "blur(12px)",
        minWidth: 160,
      }}
    >
      <p style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Cumulative</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#00f5ff", fontVariantNumeric: "tabular-nums" }}>
            {fmtUSD(Number(cumulative))}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>This period</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", fontVariantNumeric: "tabular-nums" }}>
            {fmtUSD(Number(daily))}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Window Pill ──────────────────────────────────────────────────────────────

function WindowPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 14px",
        borderRadius: 99,
        border: `1px solid ${active ? "rgba(0,245,255,0.4)" : "rgba(255,255,255,0.08)"}`,
        background: active ? "rgba(0,245,255,0.08)" : "rgba(255,255,255,0.02)",
        color: active ? "#00f5ff" : "rgba(255,255,255,0.35)",
        fontSize: 11,
        fontWeight: active ? 700 : 400,
        cursor: "pointer",
        transition: "all 0.15s",
        letterSpacing: 0.5,
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface BurnRateForecastProps {
  /** Wallet balance in USD-equivalent for the liquidity warning line */
  walletBalance?: number;
}

export function BurnRateForecast({ walletBalance = 45_000 }: BurnRateForecastProps) {
  const [window, setWindow] = useState<ForecastWindow>(30);
  const { series, loading, error, liquidityWarningDay } = useBurnRateForecast(
    walletBalance,
    90,
  );

  // Slice series to the selected window
  const maxDay = window;
  const visible = series.filter((p) => p.day <= maxDay);
  const finalCumulative = visible[visible.length - 1]?.cumulative ?? 0;
  const exceedsBalance = finalCumulative > walletBalance;
  const warningInWindow = liquidityWarningDay !== -1 &&
    series[liquidityWarningDay]?.day <= maxDay;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 20,
        overflow: "hidden",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 24px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <p style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 4 }}>
            Forecasting
          </p>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: -0.5,
              lineHeight: 1,
            }}
          >
            Burn Rate Forecast
          </h2>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
            Cumulative asset requirements from scheduled splits
          </p>
        </div>

        {/* Window selector */}
        <div style={{ display: "flex", gap: 6 }}>
          {([30, 60, 90] as ForecastWindow[]).map((w) => (
            <WindowPill
              key={w}
              label={`${w}d`}
              active={window === w}
              onClick={() => setWindow(w)}
            />
          ))}
        </div>
      </div>

      {/* Summary chips */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "12px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          flexWrap: "wrap",
        }}
      >
        {[
          {
            label: `${window}d Burn`,
            value: fmtUSD(finalCumulative),
            color: exceedsBalance ? "#f87171" : "#00f5ff",
          },
          {
            label: "Wallet Balance",
            value: fmtUSD(walletBalance),
            color: "#34d399",
          },
          {
            label: "Remaining",
            value: fmtUSD(Math.max(0, walletBalance - finalCumulative)),
            color: exceedsBalance ? "#f87171" : "#a78bfa",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              padding: "6px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <span style={{ fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              {label}{" "}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
          </div>
        ))}

        {/* Liquidity warning badge */}
        {warningInWindow && (
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 10,
              border: "1px solid rgba(248,113,113,0.35)",
              background: "rgba(248,113,113,0.07)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12 }}>⚠</span>
            <span style={{ fontSize: 11, color: "#f87171", fontWeight: 600 }}>
              Liquidity warning at day {series[liquidityWarningDay]?.day}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ padding: "20px 8px 16px" }}>
        {loading ? (
          <div
            style={{
              height: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.2)",
              fontSize: 12,
              gap: 10,
            }}
          >
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading forecast…
          </div>
        ) : error ? (
          <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: 12, color: "#f87171" }}>{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={visible} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="burnGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00f5ff" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />

              <YAxis
                tickFormatter={fmtUSD}
                tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />

              <Tooltip content={<BurnTooltip />} />

              {/* Liquidity warning reference line */}
              <ReferenceLine
                y={walletBalance}
                stroke="#f87171"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: "Liquidity Limit",
                  position: "insideTopRight",
                  fill: "#f87171",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />

              {/* Daily spend area (background) */}
              <Area
                type="monotone"
                dataKey="daily"
                stroke="#a78bfa"
                strokeWidth={1}
                fill="url(#dailyGradient)"
                dot={false}
                activeDot={false}
              />

              {/* Cumulative burn area (foreground) */}
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#00f5ff"
                strokeWidth={2}
                fill="url(#burnGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#00f5ff", stroke: "rgba(0,245,255,0.3)", strokeWidth: 6 }}
                style={{ filter: "drop-shadow(0 0 6px rgba(0,245,255,0.3))" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          padding: "0 24px 16px",
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {[
          { color: "#00f5ff", label: "Cumulative burn" },
          { color: "#a78bfa", label: "Period spend" },
          { color: "#f87171", label: "Liquidity limit", dashed: true },
        ].map(({ color, label, dashed }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width={20} height={10}>
              <line
                x1="0" y1="5" x2="20" y2="5"
                stroke={color}
                strokeWidth={dashed ? 1.5 : 2}
                strokeDasharray={dashed ? "4 2" : undefined}
              />
            </svg>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 0.5 }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
