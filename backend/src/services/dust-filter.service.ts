import { PrismaClient } from "../generated/client/index.js";
import { logger } from "../logger.js";

const prisma = new PrismaClient();

const MIN_VALUE_USD = parseFloat(process.env.MIN_VALUE_USD || "0.10");

export class DustFilterService {
  /**
   * Check if a stream amount is below dust threshold
   */
  async isDustStream(
    amount: string,
    tokenAddress: string
  ): Promise<boolean> {
    try {
      const tokenPrice = await (prisma as any).tokenPrice.findUnique({
        where: { tokenAddress },
      });

      if (!tokenPrice) {
        logger.warn(`No price found for token: ${tokenAddress}`);
        return false;
      }

      const amountNum = parseFloat(amount);
      const decimals = tokenPrice.decimals || 7;
      const normalizedAmount = amountNum / Math.pow(10, decimals);
      const valueUsd = normalizedAmount * tokenPrice.priceUsd;

      return valueUsd < MIN_VALUE_USD;
    } catch (error) {
      logger.error("Error checking dust threshold", error);
      return false;
    }
  }

  /**
   * Mark a stream as dust in the database
   */
  async markAsDust(streamId: string): Promise<void> {
    await (prisma as any).stream.update({
      where: { id: streamId },
      data: { isDust: true },
    });
  }

  /**
   * Get analytics excluding dust streams
   */
  async getProtocolStats(excludeDust: boolean = true) {
    const where = excludeDust ? { isDust: false } : {};

    const [totalStreams, activeStreams, totalVolume] = await Promise.all([
      (prisma as any).stream.count({ where }),
      (prisma as any).stream.count({
        where: { ...where, status: "ACTIVE" },
      }),
      (prisma as any).stream.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return {
      totalStreams,
      activeStreams,
      totalVolume: totalVolume._sum.amount || "0",
      dustStreamsExcluded: excludeDust,
    };
  }

  /**
   * Get TVL excluding dust
   */
  async getTVL(excludeDust: boolean = true): Promise<string> {
    const where = excludeDust
      ? { isDust: false, status: "ACTIVE" }
      : { status: "ACTIVE" };

    const result = await (prisma as any).stream.aggregate({
      where,
      _sum: { amount: true },
    });

    return result._sum.amount || "0";
  }
}
