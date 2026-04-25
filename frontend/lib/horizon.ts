// lib/horizon.ts
// Issue #54 — Horizon: Account Balance Fetcher
//
// Fetches XLM and custom token balances for a Stellar account via the
// Horizon REST API.  Pure functions with no React dependency so they
// can be called from hooks, server actions, or tests.

export const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";
export const HORIZON_MAINNET_URL = "https://horizon.stellar.org";

export interface NativeBalance {
  asset_type: "native";
  balance: string;
}

export interface TokenBalance {
  asset_type: "credit_alphanum4" | "credit_alphanum12";
  asset_code: string;
  asset_issuer: string;
  balance: string;
}

export type StellarBalance = NativeBalance | TokenBalance;

export interface AccountBalances {
  /** XLM balance as a string (stroops-precision, e.g. "100.0000000") */
  xlm: string;
  /** Non-native token balances keyed by "CODE:ISSUER" */
  tokens: Record<string, string>;
}

/**
 * Fetch all balances for a Stellar account from Horizon.
 *
 * @param address   Stellar public key (G…)
 * @param horizonUrl  Horizon base URL (defaults to testnet)
 * @returns Parsed native + token balances
 * @throws  If the account does not exist or Horizon is unreachable
 */
export async function fetchAccountBalances(
  address: string,
  horizonUrl: string = HORIZON_TESTNET_URL,
): Promise<AccountBalances> {
  const url = `${horizonUrl}/accounts/${address}`;
  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Account not found: ${address}`);
    }
    throw new Error(`Horizon request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return parseBalances(data.balances);
}

/**
 * Parse the raw `balances` array from a Horizon account response into
 * a structured {@link AccountBalances} object.
 */
export function parseBalances(
  rawBalances: StellarBalance[],
): AccountBalances {
  let xlm = "0";
  const tokens: Record<string, string> = {};

  for (const b of rawBalances) {
    if (b.asset_type === "native") {
      xlm = b.balance;
    } else {
      const key = `${b.asset_code}:${b.asset_issuer}`;
      tokens[key] = b.balance;
    }
  }

  return { xlm, tokens };
}
