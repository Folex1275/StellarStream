"use client";

// lib/hooks/use-burn-rate-forecast.ts
// Fetches upcoming scheduled splits and builds a cumulative burn-rate
// time series for 30, 60, and 90-day windows.

import { useEffect, useState } from "react";
import type { ScheduledSplit } from "@/app/api/v3/schedules/route";

export interface BurnDataPoint {
  /** Days from today (0 = today) */
  day: number;
  /** Human-readable label e.g. "Mar 27" */
  label: string;
  /** Cumulative spend in USD-equivalent by this day */
  cumulative: number;
  /** Single-day spend on this day */
  daily: number;
}

export type ForecastWindow = 30 | 60 | 90;

export interface UseBurnRateForecastReturn {
  /** Full 90-day series — slice to 30/60 as needed */
  series: BurnDataPoint[];
  loading: boolean;
  error: string | null;
  /** Wallet balance in USD-equivalent for the liquidity warning line */
  walletBalance: number;
  /** Day index where cumulative spend first exceeds walletBalance (-1 = never) */
  liquidityWarningDay: number;
}

// Approximate USD rates for mock purposes — swap for real price feed
const USD_RATES: Record<string, number> = {
  USDC: 1,
  USDT: 1,
  XLM:  0.11,
  AQUA: 0.003,
  STRM: 0.05,
};

function toUSD(amount: number, token: string): number {
  return amount * (USD_RATES[token] ?? 1);
}

/** Expand a schedule into individual payment dates within [0, maxDays] */
function expandSchedule(s: ScheduledSplit, today: Date, maxDays: number): number[] {
  const hits: number[] = [];
  const first = Math.round(
    (new Date(s.nextRunAt).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (first < 0 || first > maxDays) return hits;
  hits.push(first);

  if (s.intervalDays) {
    const maxOccurrences = s.occurrences ?? 12;
    for (let i = 1; i < maxOccurrences; i++) {
      const day = first + s.intervalDays * i;
      if (day > maxDays) break;
      hits.push(day);
    }
  }
  return hits;
}

export function useBurnRateForecast(
  walletBalance = 45_000,
  maxDays: ForecastWindow = 90,
): UseBurnRateForecastReturn {
  const [series, setSeries] = useState<BurnDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/v3/schedules")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch schedules");
        return r.json() as Promise<ScheduledSplit[]>;
      })
      .then((schedules) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Build a daily spend map
        const dailySpend = new Array<number>(maxDays + 1).fill(0);
        for (const s of schedules) {
          const usdAmount = toUSD(s.amount, s.token);
          for (const day of expandSchedule(s, today, maxDays)) {
            dailySpend[day] += usdAmount;
          }
        }

        // Build cumulative series — one point every 3 days for readability
        const points: BurnDataPoint[] = [];
        let cumulative = 0;
        const STEP = 3;
        for (let d = 0; d <= maxDays; d += STEP) {
          // Sum daily spend in this step window
          let windowSpend = 0;
          for (let i = d; i < Math.min(d + STEP, maxDays + 1); i++) {
            windowSpend += dailySpend[i];
          }
          cumulative += windowSpend;
          const date = new Date(today);
          date.setDate(today.getDate() + d);
          points.push({
            day: d,
            label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            cumulative: Math.round(cumulative),
            daily: Math.round(windowSpend),
          });
        }

        setSeries(points);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Unknown error");
        setLoading(false);
      });
  }, [maxDays, walletBalance]);

  // Find first day cumulative exceeds wallet balance
  const liquidityWarningDay =
    series.findIndex((p: BurnDataPoint) => p.cumulative > walletBalance);

  return { series, loading, error, walletBalance, liquidityWarningDay };
}
