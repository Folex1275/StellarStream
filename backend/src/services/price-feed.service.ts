/**
 * Price Feed Service
 * Fetches and caches token prices from CoinGecko API
 */

import { PrismaClient } from '../generated/client/index.js';

const prisma = new PrismaClient();

// CoinGecko API endpoint (free tier, no API key required)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Map Stellar token addresses to CoinGecko IDs
const TOKEN_ID_MAP: Record<string, string> = {
  // Native XLM
  'native': 'stellar',
  // USDC on Stellar
  'USDC': 'usd-coin',
  // Add more token mappings as needed
};

interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
  };
}

/**
 * Fetch current prices from CoinGecko
 */
export async function fetchTokenPrices(): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  
  try {
    // Get all unique CoinGecko IDs
    const coinIds = Array.from(new Set(Object.values(TOKEN_ID_MAP)));
    
    if (coinIds.length === 0) {
      console.warn('No token mappings configured');
      return prices;
    }

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data: CoinGeckoPriceResponse = await response.json();

    // Map prices back to token addresses
    for (const [tokenAddress, coinId] of Object.entries(TOKEN_ID_MAP)) {
      if (data[coinId]?.usd) {
        prices.set(tokenAddress, data[coinId].usd);
      }
    }

    console.log(`Fetched ${prices.size} token prices from CoinGecko`);
    return prices;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return prices;
  }
}

/**
 * Update token prices in database
 */
export async function updateTokenPrices(): Promise<void> {
  try {
    const prices = await fetchTokenPrices();

    for (const [tokenAddress, priceUsd] of prices.entries()) {
      await prisma.tokenPrice.upsert({
        where: { tokenAddress },
        update: {
          priceUsd,
          lastUpdated: new Date(),
        },
        create: {
          tokenAddress,
          priceUsd,
          lastUpdated: new Date(),
        },
      });
    }

    console.log(`Updated ${prices.size} token prices in database`);
  } catch (error) {
    console.error('Error updating token prices:', error);
    throw error;
  }
}

/**
 * Get cached token price from database
 */
export async function getTokenPrice(tokenAddress: string): Promise<number | null> {
  try {
    const tokenPrice = await prisma.tokenPrice.findUnique({
      where: { tokenAddress },
    });

    return tokenPrice?.priceUsd ?? null;
  } catch (error) {
    console.error(`Error fetching price for token ${tokenAddress}:`, error);
    return null;
  }
}

/**
 * Calculate USD value for a token amount
 * @param tokenAddress - Token contract address or 'native' for XLM
 * @param amount - Amount in stroops (1 XLM = 10^7 stroops)
 */
export async function calculateUsdValue(
  tokenAddress: string,
  amount: bigint
): Promise<number | null> {
  const price = await getTokenPrice(tokenAddress);
  
  if (price === null) {
    return null;
  }

  // Convert stroops to tokens (divide by 10^7)
  const tokenAmount = Number(amount) / 10_000_000;
  
  return tokenAmount * price;
}

/**
 * Start background job to update prices every 5 minutes
 */
export function startPriceUpdateJob(): NodeJS.Timeout {
  console.log('Starting price update job (every 5 minutes)');
  
  // Update immediately on start
  updateTokenPrices().catch(console.error);
  
  // Then update every 5 minutes
  return setInterval(() => {
    updateTokenPrices().catch(console.error);
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Stop the price update job
 */
export function stopPriceUpdateJob(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log('Stopped price update job');
}
