"use client";

// components/balance-forecast-banner.tsx
// Issue #781 — Balance-Forecasting Ledger Tool UI
//
// Displays the projected reserve impact of a split and blocks submission
// when the account would fall below Stellar's minimum balance.

import { useMemo } from "react";
import { forecastSplitReserve } from "@/lib/hooks/use-balance-forecast";

interface BalanceForecastBannerProps {
  currentBalanceXlm: number;
  currentSubentries: number;
  recipientCount: number;
}

export function BalanceForecastBanner({
  currentBalanceXlm,
  currentSubentries,
  recipientCount,
}: BalanceForecastBannerProps) {
  const forecast = useMemo(
    () =>
      forecastSplitReserve(currentBalanceXlm, currentSubentries, recipientCount),
    [currentBalanceXlm, currentSubentries, recipientCount],
  );

  if (recipientCount === 0) return null;

  const fmt = (n: number) => n.toFixed(2);

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-xs ${
        forecast.wouldViolateMinimum
          ? "border-red-400/30 bg-red-400/[0.06] text-red-300"
          : "border-emerald-400/20 bg-emerald-400/[0.04] text-emerald-300"
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Icon */}
        <svg
          className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
            forecast.wouldViolateMinimum ? "text-red-400" : "text-emerald-400"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {forecast.wouldViolateMinimum ? (
            <>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </>
          ) : (
            <>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </>
          )}
        </svg>

        <div className="flex-1 space-y-1">
          <p className="font-semibold">
            {forecast.wouldViolateMinimum
              ? "Insufficient reserve — split blocked"
              : "Reserve check passed"}
          </p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] opacity-80">
            <span>New base reserve</span>
            <span className="font-mono">{fmt(forecast.projectedMinimumXlm)} XLM</span>
            <span>Available after split</span>
            <span className="font-mono">
              {forecast.wouldViolateMinimum
                ? `−${fmt(forecast.shortfallXlm)} XLM`
                : `${fmt(forecast.projectedAvailableXlm)} XLM`}
            </span>
          </div>

          {forecast.wouldViolateMinimum && (
            <p className="mt-1 text-[11px] opacity-70">
              Add at least{" "}
              <span className="font-mono font-bold">
                {fmt(forecast.shortfallXlm)} XLM
              </span>{" "}
              to your account before proceeding.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
