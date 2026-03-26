import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";
import fetch from "node-fetch";

interface DexPrice {
  asset: string;
  priceUsd: number;
  source: "dex" | "coingecko";
}

interface CoinGeckoResponse {
  [key: string]: { usd: number };
}

export class PriceService {
  private readonly HORIZON_URL = "https://horizon.stellar.org";
  private readonly COINGECKO_URL = "https://api.coingecko.com/api/v3";
  private readonly USDC_ADDRESS = "GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIRUUCF2HJ4CDTUJ76ZAV2HA5ON:GBBD47UZQ5CYVVNQSC6XVLC5BJRNLKW4Q5QTIOM2GB2GMVZVVIKARI5D";

  /**
   * Fetch price from Stellar DEX (Horizon)
   */
  async fetchDexPrice(assetAddress: string): Promise<DexPrice | null> {
    try {
      if (assetAddress === "native") {
        // XLM price from CoinGecko
        return await this.fetchCoinGeckoPrice("stellar");
      }

      const [issuer, code] = assetAddress.split(":");
      if (!issuer || !code) return null;

      // Query Horizon for USDC/Asset pair
      const response = await fetch(
        `${this.HORIZON_URL}/order_book?selling_asset_type=credit_alphanum12&selling_asset_code=${code}&selling_asset_issuer=${issuer}&buying_asset_type=credit_alphanum12&buying_asset_code=USDC&buying_asset_issuer=${this.USDC_ADDRESS.split(":")[1]}`
      );

      if (!response.ok) return null;

      const data = (await response.json()) as any;
      const bids = data.bids || [];

      if (bids.length === 0) return null;

      // Use best bid as price
      const bestBid = bids[0];
      const priceUsd = parseFloat(bestBid.price);

      return { asset: assetAddress, priceUsd, source: "dex" };
    } catch (error) {
      logger.warn("Failed to fetch DEX price", { assetAddress, error });
      return null;
    }
  }

  /**
   * Fetch price from CoinGecko API
   */
  async fetchCoinGeckoPrice(coinId: string): Promise<DexPrice | null> {
    try {
      const response = await fetch(
        `${this.COINGECKO_URL}/simple/price?ids=${coinId}&vs_currencies=usd`
      );

      if (!response.ok) return null;

      const data = (await response.json()) as CoinGeckoResponse;
      const priceUsd = data[coinId]?.usd;

      if (!priceUsd) return null;

      return { asset: coinId, priceUsd, source: "coingecko" };
    } catch (error) {
      logger.warn("Failed to fetch CoinGecko price", { coinId, error });
      return null;
    }
  }

  /**
   * Get price with fallback: DEX → CoinGecko
   */
  async getPrice(assetAddress: string, coinGeckoId?: string): Promise<number> {
    try {
      // Try DEX first
      const dexPrice = await this.fetchDexPrice(assetAddress);
      if (dexPrice) {
        return dexPrice.priceUsd;
      }

      // Fallback to CoinGecko
      if (coinGeckoId) {
        const cgPrice = await this.fetchCoinGeckoPrice(coinGeckoId);
        if (cgPrice) {
          return cgPrice.priceUsd;
        }
      }

      logger.warn("No price found for asset", { assetAddress, coinGeckoId });
      return 0;
    } catch (error) {
      logger.error("Failed to get price", { assetAddress, error });
      return 0;
    }
  }

  /**
   * Update prices for all whitelisted assets
   */
  async updateAllPrices(): Promise<void> {
    try {
      // Get unique assets from active streams
      const assets = await prisma.stream.findMany({
        where: { status: "ACTIVE" },
        select: { tokenAddress: true },
        distinct: ["tokenAddress"],
      });

      const assetAddresses = assets
        .map((a) => a.tokenAddress)
        .filter((a) => a !== null) as string[];

      // Add native XLM
      assetAddresses.push("native");

      for (const assetAddress of assetAddresses) {
        const priceUsd = await this.getPrice(assetAddress, this.mapToCoinGeckoId(assetAddress));

        if (priceUsd > 0) {
          const [issuer, code] = assetAddress === "native" ? ["native", "XLM"] : assetAddress.split(":");

          await prisma.tokenPrice.upsert({
            where: { tokenAddress: assetAddress },
            update: { priceUsd, updatedAt: new Date() },
            create: {
              tokenAddress: assetAddress,
              symbol: code || "UNKNOWN",
              decimals: 7,
              priceUsd,
            },
          });

          logger.info("Price updated", { assetAddress, priceUsd });
        }
      }
    } catch (error) {
      logger.error("Failed to update all prices", error);
      throw error;
    }
  }

  /**
   * Map Stellar asset to CoinGecko ID
   */
  private mapToCoinGeckoId(assetAddress: string): string | undefined {
    const mapping: Record<string, string> = {
      native: "stellar",
      "GBUQWP3BOUZX34ULNQG23RQ6F4BVWCIRUUCF2HJ4CDTUJ76ZAV2HA5ON:GBBD47UZQ5CYVVNQSC6XVLC5BJRNLKW4Q5QTIOM2GB2GMVZVVIKARI5D": "usd-coin",
    };

    return mapping[assetAddress];
  }

  /**
   * Get current price from DB cache
   */
  async getCachedPrice(assetAddress: string): Promise<number> {
    try {
      const tokenPrice = await prisma.tokenPrice.findUnique({
        where: { tokenAddress: assetAddress },
      });

      return tokenPrice?.priceUsd || 0;
    } catch (error) {
      logger.error("Failed to get cached price", { assetAddress, error });
      return 0;
    }
  }
}
