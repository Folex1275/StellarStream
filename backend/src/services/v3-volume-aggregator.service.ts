import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";

export class V3VolumeAggregatorService {
  /**
   * Calculate total USD volume from all V3 disbursements.
   */
  async calculateTotalVolume(): Promise<string> {
    const result = await prisma.$queryRaw<{ volume_usd: string }[]>`
      SELECT
        COALESCE(
          SUM(
            (d."totalAmount"::NUMERIC / POWER(10, COALESCE(tp.decimals, 7))) * 
            COALESCE(tp."priceUsd", 0)
          ), 
          0
        )::TEXT AS volume_usd
      FROM "Disbursement" d
      LEFT JOIN "TokenPrice" tp ON d.asset = tp."tokenAddress"
    `;
    return result[0]?.volume_usd || "0";
  }

  /**
   * Calculate 24h USD volume from V3 disbursements.
   */
  async calculateDailyVolume(): Promise<string> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await prisma.$queryRaw<{ volume_usd: string }[]>`
      SELECT
        COALESCE(
          SUM(
            (d."totalAmount"::NUMERIC / POWER(10, COALESCE(tp.decimals, 7))) * 
            COALESCE(tp."priceUsd", 0)
          ), 
          0
        )::TEXT AS volume_usd
      FROM "Disbursement" d
      LEFT JOIN "TokenPrice" tp ON d.asset = tp."tokenAddress"
      WHERE d."createdAt" >= ${oneDayAgo}
    `;
    return result[0]?.volume_usd || "0";
  }

  /**
   * Aggregate V3 stats and update GlobalStats_V3 table.
   */
  async aggregateStats(): Promise<void> {
    const [totalVolumeUsd, dailyVolumeUsd, totalSplits, totalRecipients] = await Promise.all([
      this.calculateTotalVolume(),
      this.calculateDailyVolume(),
      prisma.disbursement.count(),
      prisma.splitRecipient.count(),
    ]);

    await prisma.globalStats_V3.upsert({
      where: { id: "v3_global" },
      update: { totalVolumeUsd, dailyVolumeUsd, totalSplits, totalRecipients },
      create: { id: "v3_global", totalVolumeUsd, dailyVolumeUsd, totalSplits, totalRecipients },
    });

    logger.info("[V3VolumeAggregator] Stats updated", {
      totalVolumeUsd,
      dailyVolumeUsd,
      totalSplits,
      totalRecipients,
    });
  }
}
