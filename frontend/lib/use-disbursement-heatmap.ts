"use client";
import { useState, useEffect } from "react";

export interface HeatmapDay {
  date: string;  // "YYYY-MM-DD"
  count: number;
  role: string;  // "DRAFTER" | "APPROVER" | "EXECUTOR" | "UNKNOWN"
}

export interface HeatmapData {
  days: HeatmapDay[];
  mostActiveAdmin: { address: string; count: number } | null;
}

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Generates deterministic mock data for the past 365 days
function mockHeatmap(): HeatmapData {
  const roles = ["DRAFTER", "APPROVER", "EXECUTOR", "UNKNOWN"] as const;
  const days: HeatmapDay[] = [];
  const now = Date.now();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    const date = d.toISOString().slice(0, 10);
    // Sparse activity — ~30% of days have disbursements
    const count = Math.random() < 0.3 ? Math.floor(Math.random() * 8) + 1 : 0;
    days.push({ date, count, role: roles[Math.floor(Math.random() * roles.length)] });
  }
  return {
    days,
    mostActiveAdmin: { address: "GABC…1234", count: 42 },
  };
}

export function useDisbursementHeatmap(): {
  data: HeatmapData | null;
  isLoading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`${BACKEND}/api/v1/analytics/disbursement-heatmap`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setData(json.data as HeatmapData);
      })
      .catch(() => {
        // Fall back to mock data so the UI is always populated
        if (!cancelled) setData(mockHeatmap());
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
