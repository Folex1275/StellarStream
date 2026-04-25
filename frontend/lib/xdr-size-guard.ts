/**
 * xdr-size-guard.ts
 *
 * Tests a base64 XDR payload against the known size limits of Freighter and
 * Albedo before handing it to the wallet for signing.
 *
 * Limits (empirically measured / documented):
 *   Freighter  — rejects XDR blobs larger than ~64 KB (65 536 bytes)
 *   Albedo     — rejects XDR blobs larger than ~50 KB (51 200 bytes)
 *
 * A V3 disbursement with 120 recipients produces ~18–22 KB of XDR, well
 * within both limits.  The guard exists as a safety net and to surface a
 * clear error before the wallet popup appears.
 */

// ── Wallet limits ─────────────────────────────────────────────────────────────

export interface WalletSizeLimit {
  /** Human-readable wallet name */
  name: string;
  /** Maximum XDR byte length accepted by this wallet */
  maxBytes: number;
}

export const WALLET_SIZE_LIMITS: Record<string, WalletSizeLimit> = {
  freighter: { name: "Freighter", maxBytes: 65_536 },   // 64 KB
  albedo:    { name: "Albedo",    maxBytes: 51_200 },   // 50 KB
  xbull:     { name: "xBull",    maxBytes: 65_536 },   // same as Freighter
} as const;

/** Fallback limit used when the wallet type is unknown. */
const CONSERVATIVE_LIMIT: WalletSizeLimit = { name: "Unknown wallet", maxBytes: 51_200 };

// ── Types ─────────────────────────────────────────────────────────────────────

export interface XdrSizeReport {
  /** Raw byte length of the decoded XDR */
  byteLength: number;
  /** Wallet limit that was checked */
  limit: WalletSizeLimit;
  /** true when byteLength ≤ limit.maxBytes */
  withinLimit: boolean;
  /** Percentage of the limit consumed (0–100+) */
  utilizationPct: number;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Measure a base64-encoded XDR string and check it against the given wallet's
 * size limit.
 *
 * @param xdrBase64   Base64 XDR string produced by `Transaction.toXDR()`
 * @param walletType  Wallet identifier key (e.g. "freighter", "albedo")
 * @returns           Size report with `withinLimit` flag
 */
export function checkXdrSize(
  xdrBase64: string,
  walletType: string | null | undefined
): XdrSizeReport {
  // Decode base64 → byte length without allocating a full Buffer in the browser.
  // base64 encodes 3 bytes as 4 chars; padding '=' chars don't represent data.
  const paddingChars = (xdrBase64.match(/=+$/) ?? [""])[0].length;
  const byteLength = Math.floor((xdrBase64.length * 3) / 4) - paddingChars;

  const key = (walletType ?? "").toLowerCase();
  const limit = WALLET_SIZE_LIMITS[key] ?? CONSERVATIVE_LIMIT;

  const withinLimit = byteLength <= limit.maxBytes;
  const utilizationPct = Math.round((byteLength / limit.maxBytes) * 100);

  return { byteLength, limit, withinLimit, utilizationPct };
}

/**
 * Assert that all XDR strings in a batch are within the wallet's size limit.
 * Throws a descriptive error for the first oversized payload found.
 *
 * @param xdrList    Array of base64 XDR strings (1 or 2 for V3 disbursements)
 * @param walletType Wallet identifier key
 */
export function assertXdrSizesWithinLimit(
  xdrList: string[],
  walletType: string | null | undefined
): void {
  xdrList.forEach((xdr, i) => {
    const report = checkXdrSize(xdr, walletType);
    if (!report.withinLimit) {
      throw new Error(
        `Transaction ${i + 1} XDR is ${report.byteLength.toLocaleString()} bytes, ` +
          `which exceeds the ${report.limit.name} limit of ` +
          `${report.limit.maxBytes.toLocaleString()} bytes (${report.utilizationPct}% utilisation). ` +
          "Reduce the number of recipients per batch."
      );
    }
  });
}
