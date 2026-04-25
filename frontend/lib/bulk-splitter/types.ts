// lib/bulk-splitter/types.ts

// Issue #689 - Added tokenAddress for USD value calculation
export interface Voter {
  address: string;
  governance_score: bigint;
  /** Optional internal Tax ID / note — stored backend-only, never on-chain. */
  taxId?: string;
}

/** Memo types supported by the Stellar network */
export type MemoType = "none" | "text" | "id";

export interface Recipient {
  address: string;
  amount: bigint;
  /** Token address for price lookup (e.g., 'native' for XLM, 'CA7AR... for USDC) */
  tokenAddress?: string;
  /** Optional internal Tax ID / note — stored backend-only, never on-chain. */
  taxId?: string;
  // Issue #779 — Memo-Batcher
  /** Memo type for exchange recipients (e.g. Binance requires a numeric ID memo) */
  memoType?: MemoType;
  /** Memo value — text (≤28 bytes) or numeric string for ID type */
  memo?: string;
}
