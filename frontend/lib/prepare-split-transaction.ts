/**
 * prepareSplitTransaction
 *
 * Builds unsigned Soroban transaction XDR(s) for the V3 splitter contract's
 * `split` function.  The caller is expected to sign each XDR with their wallet
 * and submit it to the network.
 *
 * Batching rules (mirrors the on-chain limit):
 *   • ≤ 120 recipients  → single transaction XDR returned
 *   • 121–240 recipients → two sequential transaction XDRs returned
 *   • > 240 recipients  → throws; callers must pre-chunk before calling
 */

import {
  Account,
  Address,
  Contract,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";

// ── Env helper ────────────────────────────────────────────────────────────────
// Next.js statically replaces NEXT_PUBLIC_* references at build time.
// We access them via a typed helper to avoid requiring @types/node in the
// browser-targeted tsconfig.
declare const process: { env: Record<string, string | undefined> };
function getEnv(key: string): string {
  return (typeof process !== "undefined" && process.env[key]) || "";
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maximum recipients per single Soroban invoke_contract call. */
export const MAX_RECIPIENTS_PER_BATCH = 120;

/** Hard cap: we only handle up to 2 sequential transactions (2 × 120 = 240). */
const MAX_TOTAL_RECIPIENTS = MAX_RECIPIENTS_PER_BATCH * 2;

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single recipient entry for the V3 `split` call. */
export interface SplitRecipient {
  /** Stellar public key (G…) */
  address: string;
  /** Share in basis points (0–10 000). All recipients in a batch must sum to 10 000. */
  share_bps: number;
}

/** Parameters for prepareSplitTransaction. */
export interface PrepareSplitParams {
  /** Stellar public key of the sender (must authorise the transaction). */
  sender: string;
  /** List of recipients with their basis-point shares. */
  recipients: SplitRecipient[];
  /** Total token amount to distribute (in the token's smallest unit, e.g. stroops). */
  totalAmount: bigint;
  /** Optional affiliate address that receives 0.1 % before distribution. */
  affiliate?: string;
  /** V3 splitter contract ID. Defaults to NEXT_PUBLIC_SPLITTER_V3_CONTRACT_ID. */
  contractId?: string;
  /** Soroban RPC URL. Defaults to NEXT_PUBLIC_RPC_URL. */
  rpcUrl?: string;
  /** Network passphrase. Defaults to NEXT_PUBLIC_STELLAR_NETWORK env var or Testnet. */
  networkPassphrase?: string;
  /**
   * Base fee in stroops for the transaction inclusion fee.
   * Defaults to 100 stroops.
   */
  baseFee?: string;
}

/**
 * Result of prepareSplitTransaction.
 *
 * `transactions` contains 1 or 2 unsigned XDR strings.
 * When 2 are present the caller must prompt the user to sign and submit them
 * in order — the second batch depends on the first succeeding.
 */
export interface PrepareSplitResult {
  /** Unsigned transaction XDR strings, ready to be signed by the user's wallet. */
  transactions: string[];
  /** Number of batches (1 or 2). */
  batchCount: 1 | 2;
  /** Recipient counts per batch, for UI display. */
  recipientCounts: number[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert a SplitRecipient[] into the ScVal vector expected by the contract:
 *   Vec<{ address: Address, share_bps: u32 }>
 */
function recipientsToScVal(recipients: SplitRecipient[]): xdr.ScVal {
  const items = recipients.map((r) =>
    xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("address"),
        val: nativeToScVal(Address.fromString(r.address)),
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol("share_bps"),
        val: nativeToScVal(r.share_bps, { type: "u32" }),
      }),
    ])
  );
  return xdr.ScVal.scvVec(items);
}

/**
 * Build a single unsigned transaction XDR for one batch of recipients.
 *
 * Uses a random ephemeral account as the source so the XDR can be built
 * without a live account sequence number — the wallet will re-assemble the
 * final transaction with the real sequence number before signing.
 */
function buildBatchXdr(
  contractId: string,
  networkPassphrase: string,
  baseFee: string,
  sender: string,
  recipients: SplitRecipient[],
  totalAmount: bigint,
  affiliate: string | undefined
): string {
  const contract = new Contract(contractId);

  // Ephemeral source — sequence "0" is fine for XDR generation / simulation.
  // The wallet SDK replaces this with the real account before signing.
  const source = new Account(sender, "0");

  const affiliateScVal = affiliate
    ? nativeToScVal(Address.fromString(affiliate), { type: "address" })
    : xdr.ScVal.scvVoid();

  const tx = new TransactionBuilder(source, {
    fee: baseFee,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        "split",
        nativeToScVal(Address.fromString(sender)),   // sender: Address
        recipientsToScVal(recipients),               // recipients: Vec<Recipient>
        nativeToScVal(totalAmount, { type: "i128" }), // total_amount: i128
        affiliateScVal                               // affiliate: Option<Address>
      )
    )
    .setTimeout(30)
    .build();

  return tx.toXDR();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Prepare one or two unsigned Soroban transaction XDRs for the V3 `split`
 * function.
 *
 * @throws {Error} if recipients is empty, exceeds 240, or share_bps don't sum
 *                 to 10 000 within each batch.
 */
export function prepareSplitTransaction(
  params: PrepareSplitParams
): PrepareSplitResult {
  const {
    sender,
    recipients,
    totalAmount,
    affiliate,
    contractId = getEnv("NEXT_PUBLIC_SPLITTER_V3_CONTRACT_ID"),
    rpcUrl: _rpcUrl, // reserved for future simulation step
    networkPassphrase = getEnv("NEXT_PUBLIC_STELLAR_NETWORK") || Networks.TESTNET,
    baseFee = "100",
  } = params;

  // ── Validation ──────────────────────────────────────────────────────────────

  if (!contractId) {
    throw new Error(
      "prepareSplitTransaction: contractId is required. " +
        "Set NEXT_PUBLIC_SPLITTER_V3_CONTRACT_ID or pass it explicitly."
    );
  }

  if (recipients.length === 0) {
    throw new Error("prepareSplitTransaction: recipients list is empty.");
  }

  if (recipients.length > MAX_TOTAL_RECIPIENTS) {
    throw new Error(
      `prepareSplitTransaction: ${recipients.length} recipients exceeds the ` +
        `maximum of ${MAX_TOTAL_RECIPIENTS} (2 × ${MAX_RECIPIENTS_PER_BATCH}). ` +
        "Pre-chunk the list before calling this function."
    );
  }

  // ── Batching ────────────────────────────────────────────────────────────────

  const batches: SplitRecipient[][] =
    recipients.length <= MAX_RECIPIENTS_PER_BATCH
      ? [recipients]
      : [
          recipients.slice(0, MAX_RECIPIENTS_PER_BATCH),
          recipients.slice(MAX_RECIPIENTS_PER_BATCH),
        ];

  // Validate that each batch's share_bps sums to exactly 10 000.
  for (let i = 0; i < batches.length; i++) {
    const sum = batches[i].reduce((acc, r) => acc + r.share_bps, 0);
    if (sum !== 10_000) {
      throw new Error(
        `prepareSplitTransaction: batch ${i + 1} share_bps sum is ${sum}, ` +
          "expected 10 000. Normalise shares before calling this function."
      );
    }
  }

  // ── Build XDRs ──────────────────────────────────────────────────────────────

  const transactions = batches.map((batch) =>
    buildBatchXdr(
      contractId,
      networkPassphrase,
      baseFee,
      sender,
      batch,
      totalAmount,
      affiliate
    )
  );

  return {
    transactions,
    batchCount: batches.length as 1 | 2,
    recipientCounts: batches.map((b) => b.length),
  };
}
