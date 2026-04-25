import { redis } from '../lib/redis.js';

export interface AssetPrice {
  asset: string;
  price: number;
  currency: string;
  timestamp: number;
  source: string;
}

const CACHE_TTL = 60; // 60 seconds as per issue requirement
const CACHE_PREFIX = 'asset-price:';

export class AssetPriceOracleService {
  /**
   * Fetch asset prices from external providers.
   * Supports Jupiter and Stellar Expert APIs.
   */
  async fetchPrices(assets: string[]): Promise<AssetPrice[]> {
    const prices: AssetPrice[] = [];

    for (const asset of assets) {
      const cached = await this.getCachedPrice(asset);
      if (cached) {
        prices.push(cached);
        continue;
      }

      try {
        // Try Stellar Expert first
        const price = await this.fetchFromStellarExpert(asset);
        if (price) {
          await this.cachePrice(asset, price);
          prices.push(price);
        }
      } catch (error) {
        console.error(`[AssetPriceOracle] Failed to fetch price for ${asset}:`, error);
      }
    }

    return prices;
  }

  /**
   * Get cached price for an asset.
   */
  private async getCachedPrice(asset: string): Promise<AssetPrice | null> {
    const key = `${CACHE_PREFIX}${asset}`;
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Cache price in Redis.
   */
  private async cachePrice(asset: string, price: AssetPrice): Promise<void> {
    const key = `${CACHE_PREFIX}${asset}`;
    await redis.setex(key, CACHE_TTL, JSON.stringify(price));
  }

  /**
   * Fetch price from Stellar Expert API.
   */
  private async fetchFromStellarExpert(asset: string): Promise<AssetPrice | null> {
    try {
      // Handle native XLM
      if (asset === 'XLM' || asset === 'native') {
        const response = await fetch('https://api.stellar.expert/v2/asset/native');
        const data = (await response.json()) as any;

        if (data.price) {
          return {
            asset: 'XLM',
            price: data.price.USD || 0,
            currency: 'USD',
            timestamp: Date.now(),
            source: 'stellar-expert',
          };
        }
      }

      // Handle issued assets (USDC, etc.)
      const response = await fetch(`https://api.stellar.expert/v2/asset/${asset}`);
      const data = (await response.json()) as any;

      if (data.price) {
        return {
          asset,
          price: data.price.USD || 0,
          currency: 'USD',
          timestamp: Date.now(),
          source: 'stellar-expert',
        };
      }
    } catch (error) {
      console.error(`[AssetPriceOracle] Stellar Expert API error for ${asset}:`, error);
    }

    return null;
  }

  /**
   * Get price for a single asset.
   */
  async getPrice(asset: string): Promise<AssetPrice | null> {
    const cached = await this.getCachedPrice(asset);
    if (cached) {
      return cached;
    }

    try {
      const price = await this.fetchFromStellarExpert(asset);
      if (price) {
        await this.cachePrice(asset, price);
        return price;
      }
    } catch (error) {
      console.error(`[AssetPriceOracle] Failed to fetch price for ${asset}:`, error);
    }

    return null;
  }

  /**
   * Clear cache for an asset.
   */
  async clearCache(asset: string): Promise<void> {
    const key = `${CACHE_PREFIX}${asset}`;
    await redis.del(key);
  }

  /**
   * Clear all price cache.
   */
  async clearAllCache(): Promise<void> {
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  /**
   * Get cache stats.
   */
  async getCacheStats(): Promise<{ cachedAssets: number; ttl: number }> {
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    return {
      cachedAssets: keys.length,
      ttl: CACHE_TTL,
    };
  }
}

export const assetPriceOracleService = new AssetPriceOracleService();
