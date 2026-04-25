// lib/explorer.ts
// Utility for generating deep-links to Stellar.Expert for transactions and accounts.

export type StellarNetwork = "public" | "testnet";

const BASE: Record<StellarNetwork, string> = {
  public:  "https://stellar.expert/explorer/public",
  testnet: "https://testnet.stellar.expert/explorer",
};

/**
 * Returns a deep-link to Stellar.Expert for a specific transaction.
 * If an `address` is provided the link targets the account page instead,
 * which lets users see that recipient's full on-chain history.
 *
 * @param txHash  - The transaction hash (required).
 * @param address - Optional recipient address. When supplied the link points
 *                  to the account explorer page for that address.
 * @param network - "public" (default) or "testnet".
 */
export function getExplorerLink(
  txHash: string,
  address?: string,
  network: StellarNetwork = "public",
): string {
  const base = BASE[network];
  if (address) {
    return `${base}/account/${address}`;
  }
  return `${base}/tx/${txHash}`;
}
