"use client";

import { useMemo } from "react";
import { useGasAdvisor } from "./use-gas-advisor";

export interface SplitsRemainingResult {
  /** Approximate number of splits that can be performed */
  approximateSplits: number;
  /** Average cost per split in XLM */
  averageCostXlm: number;
  /** Current XLM balance */
  balanceXlm: number;
  /** Whether the calculation is still loading */
  isLoading: boolean;
  /** Error message if calculation failed */
  error: string | null;
}

/**
 * Hook to calculate how many splits can be performed based on current XLM balance.
 * 
 * Formula: ApproximateSplits = Balance / Average_Split_Cost
 * 
 * @param currentBalanceXlm - Current XLM balance in the gas tank
 * @returns An object containing the approximate number of remaining splits
 * 
 * @example
 * ```tsx
 * const { approximateSplits, averageCostXlm } = useSplitsRemaining(3.42);
 * // approximateSplits: 14 (if averageCostXlm is ~0.245)
 * ```
 */
export function useSplitsRemaining(currentBalanceXlm: number = 0): SplitsRemainingResult {
  const { suggestion, loading, error } = useGasAdvisor(currentBalanceXlm);

  return useMemo((): SplitsRemainingResult => {
    // If still loading or no suggestion available, return defaults
    if (loading || !suggestion) {
      return {
        approximateSplits: 0,
        averageCostXlm: 0,
        balanceXlm: currentBalanceXlm,
        isLoading: loading,
        error: error,
      };
    }

    // Calculate approximate splits: Balance / Average Cost
    const approximateSplits = Math.floor(currentBalanceXlm / suggestion.averageCostXlm);

    return {
      approximateSplits: Math.max(approximateSplits, 0), // Never negative
      averageCostXlm: suggestion.averageCostXlm,
      balanceXlm: currentBalanceXlm,
      isLoading: loading,
      error: error,
    };
  }, [currentBalanceXlm, suggestion, loading, error]);
}
