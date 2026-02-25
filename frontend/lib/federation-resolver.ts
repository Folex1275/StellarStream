/**
 * Stellar Federation Address Resolver Service
 * Resolves federation addresses (user*domain.com) to Stellar account IDs
 * with 24-hour caching to minimize external network requests
 */

import {
  FederationRecord,
  CachedFederationRecord,
  FederationError,
  isValidFederationAddress,
} from './federation-types';

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

class FederationResolverService {
  private cache: Map<string, CachedFederationRecord>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Resolve a federation address to a Stellar account ID
   * @param federationAddress - Address in format user*domain.com
   * @returns Federation record or error
   */
  async resolve(federationAddress: string): Promise<FederationRecord | FederationError> {
    // Validate format
    if (!isValidFederationAddress(federationAddress)) {
      return {
        error: 'Invalid federation address format. Expected: user*domain.com',
        address: federationAddress,
      };
    }

    // Check cache first
    const cached = this.getFromCache(federationAddress);
    if (cached) {
      return cached;
    }

    // Resolve via API
    try {
      const result = await this.fetchFederationRecord(federationAddress);
      
      if ('error' in result) {
        return result;
      }

      // Cache successful result
      this.addToCache(federationAddress, result);
      return result;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to resolve federation address',
        address: federationAddress,
      };
    }
  }

  /**
   * Batch resolve multiple federation addresses
   * @param addresses - Array of federation addresses
   * @returns Map of addresses to their resolution results
   */
  async resolveBatch(addresses: string[]): Promise<Map<string, FederationRecord | FederationError>> {
    const results = new Map<string, FederationRecord | FederationError>();
    
    // Resolve all addresses in parallel
    const promises = addresses.map(async (address) => {
      const result = await this.resolve(address);
      results.set(address, result);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Get cached record if valid
   */
  private getFromCache(address: string): FederationRecord | null {
    const cached = this.cache.get(address);
    
    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(address);
      return null;
    }

    return {
      account_id: cached.account_id,
      stellar_address: cached.stellar_address,
      memo_type: cached.memo_type,
      memo: cached.memo,
    };
  }

  /**
   * Add record to cache
   */
  private addToCache(address: string, record: FederationRecord): void {
    const now = Date.now();
    const cachedRecord: CachedFederationRecord = {
      ...record,
      cachedAt: now,
      expiresAt: now + CACHE_DURATION_MS,
    };
    
    this.cache.set(address, cachedRecord);
  }

  /**
   * Fetch federation record from API
   */
  private async fetchFederationRecord(
    federationAddress: string
  ): Promise<FederationRecord | FederationError> {
    try {
      const response = await fetch(`/api/federation/resolve?address=${encodeURIComponent(federationAddress)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          address: federationAddress,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
        address: federationAddress,
      };
    }
  }

  /**
   * Clear all cached records
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [address, record] of this.cache.entries()) {
      if (now > record.expiresAt) {
        this.cache.delete(address);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const federationResolver = new FederationResolverService();
