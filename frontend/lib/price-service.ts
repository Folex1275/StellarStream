/**
 * Price Service for StellarStream
 * Handles fetching real-time prices from CoinGecko
 */

const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";
const PRICE_CACHE_TTL = 60 * 1000; // 1 minute cache

interface PriceCache {
  [assetId: string]: {
    price: number;
    timestamp: number;
  };
}

const priceCache: PriceCache = {};

/**
 * Maps Stellar asset codes to CoinGecko IDs
 */
const ASSET_ID_MAP: Record<string, string> = {
  XLM: "stellar",
  USDC: "usd-coin",
  EURC: "euro-coin",
  // Add more mappings as needed
};

/**
 * Fetches the current USD price for a given asset code.
 *
 * @param assetCode - The Stellar asset code (e.g., "XLM", "USDC")
 * @returns The current USD price or null if not found
 */
export async function getAssetPrice(assetCode: string): Promise<number | null> {
  const cgId = ASSET_ID_MAP[assetCode.toUpperCase()];
  if (!cgId) {
    if (assetCode.toUpperCase() === "USDC" || assetCode.toUpperCase() === "USD") return 1.0;
    return null;
  }

  const now = Date.now();
  const cached = priceCache[cgId];

  if (cached && now - cached.timestamp < PRICE_CACHE_TTL) {
    return cached.price;
  }

  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${cgId}&vs_currencies=usd`
    );
    const data = await response.json();
    const price = data[cgId]?.usd;

    if (typeof price === "number") {
      priceCache[cgId] = { price, timestamp: now };
      return price;
    }
  } catch (error) {
    console.error(`Error fetching price for ${assetCode}:`, error);
  }

  return cached?.price ?? null;
}
