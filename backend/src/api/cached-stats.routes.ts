import { Router, Request, Response } from "express";
import { CacheService } from "../services/cache.service.js";
import { DustFilterService } from "../services/dust-filter.service.js";
import { PrismaClient } from "../generated/client/index.js";
import { logger } from "../logger.js";

const router = Router();
const cacheService = new CacheService();
const dustFilterService = new DustFilterService();
const prisma = new PrismaClient();

/**
 * GET /api/v1/stats/protocol
 * Get protocol statistics with caching (5 minute TTL)
 */
router.get("/protocol", async (req: Request, res: Response) => {
  try {
    const excludeDust = req.query.excludeDust !== "false";

    const stats = await cacheService.getOrCompute(
      `protocol:stats:${excludeDust}`,
      300, // 5 minutes
      async () => {
        const [totalStreams, activeStreams, totalVolume, tvl] = await Promise.all([
          (prisma as any).stream.count({
            where: excludeDust ? { isDust: false } : {},
          }),
          (prisma as any).stream.count({
            where: excludeDust
              ? { isDust: false, status: "ACTIVE" }
              : { status: "ACTIVE" },
          }),
          (prisma as any).stream.aggregate({
            where: excludeDust ? { isDust: false } : {},
            _sum: { amount: true },
          }),
          dustFilterService.getTVL(excludeDust),
        ]);

        return {
          totalStreams,
          activeStreams,
          totalVolume: totalVolume._sum.amount || "0",
          tvl,
          excludeDust,
          timestamp: new Date().toISOString(),
        };
      }
    );

    res.json({ success: true, stats });
  } catch (error) {
    logger.error("Error fetching protocol stats", error);
    res.status(500).json({ error: "Failed to fetch protocol stats" });
  }
});

/**
 * GET /api/v1/prices
 * Get token prices with caching (60 second TTL)
 */
router.get("/prices", async (req: Request, res: Response) => {
  try {
    const prices = await cacheService.getOrCompute(
      "prices",
      60, // 1 minute
      async () => {
        return (prisma as any).tokenPrice.findMany({
          select: {
            tokenAddress: true,
            symbol: true,
            priceUsd: true,
            decimals: true,
          },
        });
      }
    );

    res.json({ success: true, prices });
  } catch (error) {
    logger.error("Error fetching prices", error);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

export default router;
