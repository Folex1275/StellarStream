/**
 * Protocol statistics service
 * Calculates TVL and other protocol-wide metrics with caching
 */

import { PrismaClient } from '../generated/client/index.js';
import { cacheService } from './cache.service.js';
import { calculateUsdValue } from './index.js';
import { logger } from '../logger.js';

const prisma = new PrismaClient();

const TVL_CACHE_KEY = 'protocol:tvl';
const TVL_CACHE_TTL = 60; // 60 seconds

export interface ProtocolStats {
  totalValueLocked: {
    total: string;
    byToken: Record<string, string>;
  };
  activeStreamsCount: number;
  timestamp: string;
}

/**
 * Calculate Total Value Locked (TVL) across all active streams
 * Uses 60-second cache to avoid database load
 */
export async function getProtocolStats(): Promise<ProtocolStats> {
  // Try to get from cache first
  const cached = cacheService.get<ProtocolStats>(TVL_CACHE_KEY);
  if (cached) {
    logger.debug('Protocol stats served from cache');
    return cached;
  }

  logger.info('Calculating protocol stats from database');

  try {
    // Get all active streams with aggregation by token
    const activeStreams = await prisma.stream.findMany({
      where: { status: 'ACTIVE' },
      select: {
        tokenAddress: true,
        totalAmount: true,
      },
    });

    // Aggregate by token address
    const tokenTotals = new Map<string, bigint>();
    
    for (const stream of activeStreams) {
      const current = tokenTotals.get(stream.tokenAddress) || BigInt(0);
      tokenTotals.set(stream.tokenAddress, current + stream.totalAmount);
    }

    // Calculate USD values for each token
    const byToken: Record<string, string> = {};
    let totalUsd = 0;

    for (const [tokenAddress, amount] of tokenTotals.entries()) {
      const usdValue = await calculateUsdValue(tokenAddress, amount);
      
      if (usdValue !== null) {
        byToken[tokenAddress] = usdValue.toFixed(2);
        totalUsd += usdValue;
      } else {
        byToken[tokenAddress] = '0.00';
      }
    }

    const stats: ProtocolStats = {
      totalValueLocked: {
        total: totalUsd.toFixed(2),
        byToken,
      },
      activeStreamsCount: activeStreams.length,
      timestamp: new Date().toISOString(),
    };

    // Cache for 60 seconds
    cacheService.set(TVL_CACHE_KEY, stats, TVL_CACHE_TTL);

    logger.info('Protocol stats calculated', { 
      tvl: stats.totalValueLocked.total,
      activeStreams: stats.activeStreamsCount 
    });

    return stats;
  } catch (error) {
    logger.error('Failed to calculate protocol stats', { error });
    throw error;
  }
}

/**
 * Invalidate the TVL cache
 * Call this when stream status changes
 */
export function invalidateTvlCache(): void {
  cacheService.delete(TVL_CACHE_KEY);
  logger.debug('TVL cache invalidated');
}
