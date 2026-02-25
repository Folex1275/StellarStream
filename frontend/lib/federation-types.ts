/**
 * Types for Stellar Federation Address Resolution
 */

export interface FederationRecord {
  account_id: string;
  stellar_address?: string;
  memo_type?: string;
  memo?: string;
}

export interface CachedFederationRecord extends FederationRecord {
  cachedAt: number;
  expiresAt: number;
}

export interface FederationError {
  error: string;
  address?: string;
}

export type FederationResult = FederationRecord | FederationError;

export function isFederationError(result: FederationResult): result is FederationError {
  return 'error' in result;
}

export function isValidFederationAddress(address: string): boolean {
  // Federation addresses follow the format: user*domain.com
  const federationRegex = /^[a-zA-Z0-9._-]+\*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return federationRegex.test(address);
}
