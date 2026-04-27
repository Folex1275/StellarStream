// lib/hooks/use-balance-forecast.ts
// Issue #781 — Balance-Forecasting Ledger Tool
//
// Calculates the new base-reserve requirement after a 500-recipient split
// and blocks the operation if the account would fall below Stellar's minimum.
//
// Stellar base reserve formula (as of Protocol 19):
//   minimum = (2 + numSubentries) × BASE_RESERVE
// After a split of N recipients, each new trustline / offer adds a subentry.
// We conservatively treat each recipient stream as +1 subentry.

export const BASE_RESERVE_XLM = 0.5; // 0.5 XLM per subentry (Protocol 19)
export const BASE_ACCOUNT_ENTRIES = 2; // base account always costs 2 reserves

export interface BalanceForecastResult {
  /** Current minimum balance in XLM */
  currentMinimumXlm: number;
  /** Projected minimum balance after the split */
  projectedMinimumXlm: number;
  /** Projected available balance after the split */
  projectedAvailableXlm: number;
  /** True when the split would leave the account below minimum */
  wouldViolateMinimum: boolean;
  /** XLM shortfall (0 when safe) */
  shortfallXlm: number;
}

/**
 * Forecast whether a split of `recipientCount` recipients is safe given the
 * sender's current XLM balance and existing subentry count.
 *
 * @param currentBalanceXlm   Total XLM balance of the sender's account
 * @param currentSubentries   Number of existing subentries on the account
 * @param recipientCount      Number of new recipients in the split
 */
export function forecastSplitReserve(
  currentBalanceXlm: number,
  currentSubentries: number,
  recipientCount: number,
): BalanceForecastResult {
  const currentMinimumXlm =
    (BASE_ACCOUNT_ENTRIES + currentSubentries) * BASE_RESERVE_XLM;

  const projectedSubentries = currentSubentries + recipientCount;
  const projectedMinimumXlm =
    (BASE_ACCOUNT_ENTRIES + projectedSubentries) * BASE_RESERVE_XLM;

  const projectedAvailableXlm = currentBalanceXlm - projectedMinimumXlm;
  const wouldViolateMinimum = projectedAvailableXlm < 0;
  const shortfallXlm = wouldViolateMinimum
    ? Math.abs(projectedAvailableXlm)
    : 0;

  return {
    currentMinimumXlm,
    projectedMinimumXlm,
    projectedAvailableXlm,
    wouldViolateMinimum,
    shortfallXlm,
  };
}
