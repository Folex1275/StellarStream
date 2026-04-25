/**
 * Registry of known Stellar Vault contract interfaces.
 *
 * Each entry describes a vault contract and the deposit function selector
 * to use when routing a disbursement into it.
 *
 * Extend this registry as new vault protocols are integrated.
 */
export interface VaultDefinition {
  /** Soroban contract ID (C-address) */
  contractId: string;
  /** Human-readable vault name */
  name: string;
  /** The function to invoke for deposits */
  depositFunction: string;
  /** Optional: minimum deposit amount in stroops */
  minDepositStroops?: string;
}

export const VAULT_REGISTRY: VaultDefinition[] = [
  // Example: a yield-bearing USDC vault on Stellar testnet
  {
    contractId: process.env.VAULT_USDC_CONTRACT_ID ?? "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
    name: "StellarStream USDC Vault",
    depositFunction: "deposit",
    minDepositStroops: "10000000", // 1 USDC
  },
];

/** Lookup a vault definition by contract ID. Returns undefined if not a known vault. */
export function findVault(contractId: string): VaultDefinition | undefined {
  return VAULT_REGISTRY.find((v) => v.contractId === contractId);
}
