import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";

export interface TrustProfile {
  orgId: string;
  trustScore: number;
  totalVolume: string;
  successRate: number;
  accountAge: number;
  totalDisbursements: number;
  successfulDisbursements: number;
  failedDisbursements: number;
  firstDisbursementAt: Date | null;
  lastDisbursementAt: Date | null;
}

export class TrustScoreService {
  async calculateTrustScore(orgId: string): Promise<TrustProfile | null> {
    try {
      const disbursements = await prisma.disbursement.findMany({
        where: {
          sender: orgId,
        },
        select: {
          amount: true,
          status: true,
          createdAt: true,
          completedAt: true,
          tokenAddress: true,
        },
      });

      const archivedDisbursements = await prisma.archivedDisbursement.findMany({
        where: {
          sender: orgId,
        },
        select: {
          amount: true,
          status: true,
          completedAt: true,
          tokenAddress: true,
        },
      });

      const allDisbursements = [
        ...disbursements.map((d) => ({
          ...d,
          completedAt: d.completedAt ?? d.createdAt,
        })),
        ...archivedDisbursements.map((d) => ({
          amount: d.amount,
          status: d.status,
          createdAt: d.completedAt,
          completedAt: d.completedAt,
          tokenAddress: d.tokenAddress,
        })),
      ];

      if (allDisbursements.length === 0) {
        return {
          orgId,
          trustScore: 0,
          totalVolume: "0",
          successRate: 0,
          accountAge: 0,
          totalDisbursements: 0,
          successfulDisbursements: 0,
          failedDisbursements: 0,
          firstDisbursementAt: null,
          lastDisbursementAt: null,
        };
      }

      const successful = allDisbursements.filter((d) => d.status === "COMPLETED");
      const failed = allDisbursements.filter((d) => d.status === "FAILED" || d.status === "CANCELLED");

      const successRate = successful.length / allDisbursements.length;

      const firstDisbursement = allDisbursements.reduce((min, d) =>
        d.createdAt < min.createdAt ? d : min
      );
      const lastDisbursement = allDisbursements.reduce((max, d) =>
        d.completedAt > max.completedAt ? d : max
      );

      const accountAgeMs = Date.now() - firstDisbursement.createdAt.getTime();
      const accountAgeDays = Math.max(accountAgeMs / (1000 * 60 * 60 * 24), 1);

      let totalVolume = 0n;
      for (const d of successful) {
        totalVolume += d.amount;
      }

      const totalVolumeNum = Number(totalVolume) / 1e7;
      const trustScore = (totalVolumeNum * successRate) / accountAgeDays * 1000;

      return {
        orgId,
        trustScore: Math.round(trustScore * 100) / 100,
        totalVolume: totalVolume.toString(),
        successRate: Math.round(successRate * 10000) / 100,
        accountAge: Math.round(accountAgeDays),
        totalDisbursements: allDisbursements.length,
        successfulDisbursements: successful.length,
        failedDisbursements: failed.length,
        firstDisbursementAt: firstDisbursement.createdAt,
        lastDisbursementAt: lastDisbursement.completedAt,
      };
    } catch (error) {
      logger.error("Failed to calculate trust score", { orgId, error });
      return null;
    }
  }
}
