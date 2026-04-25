// lib/hooks/index.ts
// Export all custom hooks

export { useQuorumCheck, useQuorumStatus } from "./use-quorum-check";
export type { QuorumCheckResult, Signer, AccountThreshold } from "./use-quorum-check";
export type { QuorumStatus } from "./use-quorum-check";

// Issue #42 - Freighter Connection Hook
export { useFreighter } from "./use-freighter";
export type { FreighterState, UseFreighterReturn } from "./use-freighter";

// Issue #689 - Multi-Asset Value Aggregator
export {
  usePriceFetcher,
  calculateUsdValue,
  calculateTotalUsdValue,
  formatUsdValue,
} from "./use-price-fetcher";
export type { TokenPrice, PriceData } from "./use-price-fetcher";
