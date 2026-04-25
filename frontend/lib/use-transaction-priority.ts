"use client";

import { useState, useCallback } from "react";

// ─── Fee tiers ────────────────────────────────────────────────────────────────
// Base inclusion fee is 100 stroops (0.00001 XLM).
// Priority surcharges are added on top of the simulated resource fee.

export type PriorityTier = "eco" | "fast" | "instant";

export interface FeeTier {
  id: PriorityTier;
  label: string;
  tagline: string;
  /** Extra XLM added on top of the base fee */
  surchargeXlm: number;
  /** Extra stroops (surchargeXlm * 10_000_000) */
  surchargeStroops: number;
  /** Estimated confirmation time */
  eta: string;
}

export const FEE_TIERS: FeeTier[] = [
  {
    id: "eco",
    label: "Eco",
    tagline: "Standard",
    surchargeXlm: 0,
    surchargeStroops: 0,
    eta: "~30s",
  },
  {
    id: "fast",
    label: "Fast",
    tagline: "+0.5 XLM",
    surchargeXlm: 0.5,
    surchargeStroops: 5_000_000,
    eta: "~10s",
  },
  {
    id: "instant",
    label: "Instant",
    tagline: "+1.0 XLM",
    surchargeXlm: 1.0,
    surchargeStroops: 10_000_000,
    eta: "~5s",
  },
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseTransactionPriorityResult {
  tier: FeeTier;
  setTierId: (id: PriorityTier) => void;
  /**
   * Given a base resource fee in stroops (from simulation), returns the total
   * fee in stroops to pass to TransactionBuilder as the `fee` parameter.
   *
   * Soroban total fee = inclusion fee (100 stroops) + resource fee + surcharge
   */
  totalFeeStroops: (baseResourceFeeStroops: number) => number;
  /** Human-readable total fee string for display, e.g. "0.00501 XLM" */
  totalFeeXlm: (baseResourceFeeStroops: number) => string;
}

const BASE_INCLUSION_STROOPS = 100;
const STROOPS_PER_XLM = 10_000_000;

export function useTransactionPriority(): UseTransactionPriorityResult {
  const [tierId, setTierId] = useState<PriorityTier>("eco");

  const tier = FEE_TIERS.find((t) => t.id === tierId) ?? FEE_TIERS[0];

  const totalFeeStroops = useCallback(
    (baseResourceFeeStroops: number) =>
      BASE_INCLUSION_STROOPS + baseResourceFeeStroops + tier.surchargeStroops,
    [tier.surchargeStroops]
  );

  const totalFeeXlm = useCallback(
    (baseResourceFeeStroops: number) => {
      const stroops = totalFeeStroops(baseResourceFeeStroops);
      const xlm = stroops / STROOPS_PER_XLM;
      // Show enough decimals to be meaningful for small fees
      return `${xlm.toFixed(xlm < 0.001 ? 7 : 5)} XLM`;
    },
    [totalFeeStroops]
  );

  return { tier, setTierId, totalFeeStroops, totalFeeXlm };
}
