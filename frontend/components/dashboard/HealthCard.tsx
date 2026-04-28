"use client";

import { useOrganizationHealth } from "@/lib/hooks/use-organization-health";
import { formatUsdValue } from "@/lib/hooks/use-price-fetcher";
import { RotateCcw } from "lucide-react";

/**
 * Formats a success rate number to one decimal place with a % suffix.
 * e.g. 98.5 → "98.5%", 100 → "100.0%", 0 → "0.0%"
 * Requirements: 3.6
 */
export function formatSuccessRate(rate: number): string {
  return `${rate.toFixed(1)}%`;
}

/**
 * Skeleton loader component for metric tiles
 * Renders an animated shimmer effect
 */
function SkeletonTile() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 animate-pulse">
      <div className="h-3 bg-white/10 rounded mb-3 w-20"></div>
      <div className="h-8 bg-white/10 rounded mb-2 w-32"></div>
      <div className="h-3 bg-white/10 rounded w-48"></div>
    </div>
  );
}

/**
 * Error state component for a metric tile
 */
function ErrorTile({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-900/10 p-4">
      <p className="font-body text-xs tracking-widest text-red-400 uppercase mb-2">
        Error Loading Data
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-medium transition-colors"
      >
        <RotateCcw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

export function HealthCard() {
  const { data, loading, error, retry } = useOrganizationHealth();

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="font-heading text-xs text-white/60 uppercase tracking-wider">
          Organization Health
        </h3>
        <div className="grid gap-3">
          <SkeletonTile />
          <SkeletonTile />
          <SkeletonTile />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="font-heading text-xs text-white/60 uppercase tracking-wider">
          Organization Health
        </h3>
        <div className="grid gap-3">
          <ErrorTile onRetry={retry} />
          <ErrorTile onRetry={retry} />
          <ErrorTile onRetry={retry} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h3 className="font-heading text-xs text-white/60 uppercase tracking-wider">
          Organization Health
        </h3>
        <div className="text-center py-4 text-white/50">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-xs text-white/60 uppercase tracking-wider">
        Organization Health
      </h3>
      <div className="grid gap-3">
        {/* Success Rate */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="font-body text-xs tracking-widest text-white/40 uppercase mb-1">
            Success Rate
          </p>
          <p className="font-heading text-2xl font-bold text-white">
            {formatSuccessRate(data.successRate)}
          </p>
          <p className="font-body text-xs text-white/50">
            of transactions successful in last 30d
          </p>
        </div>

        {/* Total Volume (30d) */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="font-body text-xs tracking-widest text-white/40 uppercase mb-1">
            Total Volume (30d)
          </p>
          <p className="font-heading text-2xl font-bold text-white">
            {formatUsdValue(data.totalVolume30d)}
          </p>
          <p className="font-body text-xs text-white/50">
            in USDC equivalent
          </p>
        </div>

        {/* Active Proposals */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="font-body text-xs tracking-widest text-white/40 uppercase mb-1">
            Active Proposals
          </p>
          <p className="font-heading text-2xl font-bold text-white">
            {Math.floor(data.activeProposals).toString()}
          </p>
          <p className="font-body text-xs text-white/50">
            governance proposals underway
          </p>
        </div>
      </div>
    </div>
  );
}