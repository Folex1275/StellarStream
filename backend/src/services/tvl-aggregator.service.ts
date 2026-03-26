import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const CACHE_KEY = "protocol:global-stats";
const CACHE_TTL = 300; // 5 minutes

export interface GlobalStats {
  tvlUsd: string;
  volume24hUsd: string;
  activeStreams: number;
  totalStreams: number;
  updatedAt: string;
}

export class TvlAggregatorService {
  /**
   * Calculate TVL: sum of (total_amount - withdrawn_amount) for all ACTIVE streams
   * converted to USD using TokenPrice
   */
  async calculateTvl(): Promise<string> {
    try {
      const result = await prisma.$queryRaw<{ tvl_usd: string }[]>`
        SELECT
          COALESCE(
            SUM(
              ((s.amount::NUMERIC - COALESCE(s.withdrawn::NUMERIC, 0)) / 
               POWER(10, COALESCE(tp.decimals, 7))) * 
              COALESCE(tp."priceUsd", 0)
            ), 
            0
          )::TEXT AS tvl_usd
        FROM "Stream" s
        LEFT JOIN "TokenPrice" tp ON s."tokenAddress" = tp."tokenAddress"
        WHERE s.status = 'ACTIVE'
      `;

      return result[0]?.tvl_usd || "0";
    } catch (error) {
      logger.error("Failed to calculate TVL", error);
      throw error;
    }
  }

  /**
   * Calculate 24h volume: sum of withdrawn amounts in last 24h
   */
  async calculate24hVolume(): Promise<string> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await prisma.$queryRaw<{ volume_usd: string }[]>`
        SELECT
          COALESCE(
            SUM(
              (el.amount::NUMERIC / POWER(10, COALESCE(tp.decimals, 7))) * 
              COALESCE(tp."priceUsd", 0)
            ), 
            0
          )::TEXT AS volume_usd
        FROM "EventLog" el
        LEFT JOIN "TokenPrice" tp ON el."streamId" IN (
          SELECT id FROM "Stream" WHERE "tokenAddress" = tp."tokenAddress"
        )
        WHERE el."eventType" = 'withdraw'
          AND el."createdAt" >= ${oneDayAgo}
      `;

      return result[0]?.volume_usd || "0";
    } catch (error) {
      logger.error("Failed to calculate 24h volume", error);
      throw error;
    }
  }

  /**
   * Get active and total stream counts
   */
  async getStreamCounts(): Promise<{ active: number; total: number }> {
    try {
      const [active, total] = await Promise.all([
        prisma.stream.count({ where: { status: "ACTIVE" } }),
        prisma.stream.count(),
      ]);

      return { active, total };
    } catch (error) {
      logger.error("Failed to get stream counts", error);
      throw error;
    }
  }

  /**
   * Aggregate all stats and update GlobalStats table
   */
  async aggregateStats(): Promise<GlobalStats> {
    try {
      const [tvlUsd, volume24hUsd, counts] = await Promise.all([
        this.calculateTvl(),
        this.calculate24hVolume(),
        this.getStreamCounts(),
      ]);

      const stats = await prisma.globalStats.upsert({
        where: { id: "global" },
        update: {
          tvlUsd,
          volume24hUsd,
          activeStreams: counts.active,
          totalStreams: counts.total,
        },
        create: {
          id: "global",
          tvlUsd,
          volume24hUsd,
          activeStreams: counts.active,
          totalStreams: counts.total,
        },
      });

      // Cache the result
      await redis.setex(
        CACHE_KEY,
        CACHE_TTL,
        JSON.stringify({
          tvlUsd: stats.tvlUsd,
          volume24hUsd: stats.volume24hUsd,
          activeStreams: stats.activeStreams,
          totalStreams: stats.totalStreams,
          updatedAt: stats.updatedAt.toISOString(),
        })
      );

      logger.info("Global stats aggregated", {
        tvlUsd,
        volume24hUsd,
        activeStreams: counts.active,
      });

      return {
        tvlUsd: stats.tvlUsd,
        volume24hUsd: stats.volume24hUsd,
        activeStreams: stats.activeStreams,
        totalStreams: stats.totalStreams,
        updatedAt: stats.updatedAt.toISOString(),
      };
    } catch (error) {
      logger.error("Failed to aggregate stats", error);
      throw error;
    }
  }

  /**
   * Get cached stats or compute fresh
   */
  async getStats(useCache = true): Promise<GlobalStats> {
    try {
      if (useCache) {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      return await this.aggregateStats();
    } catch (error) {
      logger.error("Failed to get stats", error);
      // Fallback to DB
      const stats = await prisma.globalStats.findUnique({
        where: { id: "global" },
      });

      if (stats) {
        return {
          tvlUsd: stats.tvlUsd,
          volume24hUsd: stats.volume24hUsd,
          activeStreams: stats.activeStreams,
          totalStreams: stats.totalStreams,
          updatedAt: stats.updatedAt.toISOString(),
        };
      }

      throw error;
    }
  }

  /**
   * Save daily TVL snapshot
   */
  async saveDailySnapshot(): Promise<void> {
    try {
      const tvlUsd = await this.calculateTvl();
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      await prisma.tvlSnapshot.upsert({
        where: { date: today },
        update: { tvlUsd },
        create: { tvlUsd, date: today },
      });

      logger.info("Daily TVL snapshot saved", { tvlUsd, date: today });
    } catch (error) {
      logger.error("Failed to save daily snapshot", error);
      throw error;
    }
  }

  /**
   * Get TVL history for charts (last 30 days)
   */
  async getTvlHistory(days = 30): Promise<Array<{ date: string; tvlUsd: string }>> {
    try {
      const startDate = new Date();
      startDate.setUTCDate(startDate.getUTCDate() - days);
      startDate.setUTCHours(0, 0, 0, 0);

      const snapshots = await prisma.tvlSnapshot.findMany({
        where: { date: { gte: startDate } },
        orderBy: { date: "asc" },
      });

      return snapshots.map((s) => ({
        date: s.date.toISOString().split("T")[0],
        tvlUsd: s.tvlUsd,
      }));
    } catch (error) {
      logger.error("Failed to get TVL history", error);
      throw error;
    }
  }
}
