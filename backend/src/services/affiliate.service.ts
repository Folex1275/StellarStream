import { PrismaClient } from "../generated/client/index.js";
import { logger } from "../logger.js";

const prisma = new PrismaClient();
const AFFILIATE_COMMISSION_RATE = 0.005; // 0.5%

export class AffiliateService {
  /**
   * Track affiliate earnings when a stream is created
   */
  async trackStreamCreation(
    streamId: string,
    amount: string,
    affiliateId?: string
  ): Promise<void> {
    if (!affiliateId) return;

    try {
      const commission = BigInt(amount) * BigInt(5) / BigInt(1000); // 0.5%

      // Upsert affiliate record
      await (prisma as any).affiliate.upsert({
        where: { stellarAddress: affiliateId },
        create: {
          stellarAddress: affiliateId,
          pendingClaim: commission.toString(),
          totalEarned: commission.toString(),
        },
        update: {
          pendingClaim: {
            increment: commission.toString(),
          },
          totalEarned: {
            increment: commission.toString(),
          },
        },
      });

      // Link stream to affiliate
      await (prisma as any).stream.update({
        where: { id: streamId },
        data: { affiliateId },
      });

      logger.info(
        `Affiliate earnings tracked: ${affiliateId} earned ${commission.toString()} stroops`
      );
    } catch (error) {
      logger.error("Error tracking affiliate earnings", error);
    }
  }

  /**
   * Get affiliate earnings
   */
  async getEarnings(stellarAddress: string) {
    const affiliate = await (prisma as any).affiliate.findUnique({
      where: { stellarAddress },
    });

    if (!affiliate) {
      return {
        stellarAddress,
        pendingClaim: "0",
        totalEarned: "0",
        claimedAt: null,
      };
    }

    return {
      stellarAddress,
      pendingClaim: affiliate.pendingClaim,
      totalEarned: affiliate.totalEarned,
      claimedAt: affiliate.claimedAt,
    };
  }

  /**
   * Claim affiliate earnings
   */
  async claimEarnings(stellarAddress: string): Promise<string> {
    const affiliate = await (prisma as any).affiliate.findUnique({
      where: { stellarAddress },
    });

    if (!affiliate || affiliate.pendingClaim === "0") {
      throw new Error("No pending earnings to claim");
    }

    const claimed = affiliate.pendingClaim;

    await (prisma as any).affiliate.update({
      where: { stellarAddress },
      data: {
        pendingClaim: "0",
        claimedAt: new Date(),
      },
    });

    logger.info(`Affiliate claimed: ${stellarAddress} claimed ${claimed} stroops`);
    return claimed;
  }

  /**
   * Get top affiliates by earnings
   */
  async getTopAffiliates(limit: number = 10) {
    return (prisma as any).affiliate.findMany({
      orderBy: { totalEarned: "desc" },
      take: limit,
    });
  }
}
