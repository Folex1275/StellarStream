"use client";

import { useMemo } from "react";
import type { GasBufferStatus } from "./use-gas-buffer";

export interface QuickRefillState {
  /** True when the current balance is below the required buffer */
  hasShortfall: boolean;
  /** XLM needed to reach the required buffer (0 when no shortfall) */
  shortfallXlm: number;
  /** The required buffer amount passed in by the caller */
  requiredXlm: number;
}

/**
 * Calculates the gas shortfall for a drafted split.
 *
 * @param status      - Live gas-buffer status from `useGasBuffer`
 * @param requiredXlm - XLM the drafted split needs to execute (e.g. totalFee * recipients)
 */
export function useQuickRefill(
  status: GasBufferStatus | null,
  requiredXlm: number
): QuickRefillState {
  return useMemo(() => {
    if (!status || requiredXlm <= 0) {
      return { hasShortfall: false, shortfallXlm: 0, requiredXlm };
    }

    const shortfall = requiredXlm - status.balanceXlm;
    const shortfallXlm = shortfall > 0 ? Math.ceil(shortfall * 100) / 100 : 0;

    return {
      hasShortfall: shortfallXlm > 0,
      shortfallXlm,
      requiredXlm,
    };
  }, [status, requiredXlm]);
}
