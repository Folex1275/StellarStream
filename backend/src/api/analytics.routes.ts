import { Router, Request, Response } from "express";
import { AnalyticsService } from "../services/analytics.service.js";
import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";

const router = Router();
const analyticsService = new AnalyticsService();

/**
 * GET /api/v1/analytics/leaderboard
 *
 * Returns the top 10 streamers, top 10 receivers, and top 10 assets,
 * ranked by total streamed volume (in USD).
 *
 * Query Parameters:
 *  - timeframe: 'daily' | 'weekly' | 'all' (default: 'all')
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     topStreamers: [{ address, totalVolumeUsd, streamCount }, ...],
 *     topReceivers:  [{ address, totalVolumeUsd, streamCount }, ...],
 *     topAssets:     [{ tokenAddress, totalVolumeUsd, streamCount }, ...]
 *   }
 * }
 */
router.get("/leaderboard", async (req: Request, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as "daily" | "weekly" | "all") || "all";
    const data = await analyticsService.getLeaderboard(timeframe);
    res.json({ success: true, data });
  } catch (error) {
    logger.error("Failed to retrieve leaderboard", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve leaderboard data.",
    });
  }
});

/**
 * GET /api/v1/analytics/disbursement-heatmap
 *
 * Returns daily disbursement counts for the past year, aggregated by
 * sender role (DRAFTER / APPROVER / EXECUTOR / unknown), plus the most
 * active sender address over the period.
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     days: [{ date: "YYYY-MM-DD", count: number, role: string }],
 *     mostActiveAdmin: { address: string; count: number } | null
 *   }
 * }
 */
router.get("/disbursement-heatmap", async (_req: Request, res: Response) => {
  try {
    const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    // Daily counts with sender address
    const rows = await prisma.$queryRaw<
      { day: string; sender: string; cnt: bigint }[]
    >`
      SELECT
        TO_CHAR(d."createdAt", 'YYYY-MM-DD') AS day,
        d.sender,
        COUNT(*) AS cnt
      FROM "Disbursement" d
      WHERE d."createdAt" >= ${since}
      GROUP BY day, d.sender
      ORDER BY day
    `;

    // Resolve roles from OrganizationMember for each unique sender
    const senders = [...new Set(rows.map((r) => r.sender))];
    const members = senders.length
      ? await prisma.organizationMember.findMany({
          where: { memberAddress: { in: senders }, isActive: true },
          select: { memberAddress: true, role: true },
        })
      : [];

    const roleMap = new Map(members.map((m) => [m.memberAddress, m.role]));

    // Aggregate per day (sum across senders, pick dominant role)
    const dayMap = new Map<string, { count: number; role: string }>();
    for (const row of rows) {
      const role = roleMap.get(row.sender) ?? "UNKNOWN";
      const existing = dayMap.get(row.day);
      if (!existing) {
        dayMap.set(row.day, { count: Number(row.cnt), role });
      } else {
        existing.count += Number(row.cnt);
      }
    }

    const days = Array.from(dayMap.entries()).map(([date, v]) => ({
      date,
      count: v.count,
      role: v.role,
    }));

    // Most active admin: sender with highest total count
    const senderTotals = new Map<string, number>();
    for (const row of rows) {
      senderTotals.set(row.sender, (senderTotals.get(row.sender) ?? 0) + Number(row.cnt));
    }
    let mostActiveAdmin: { address: string; count: number } | null = null;
    for (const [address, count] of senderTotals) {
      if (!mostActiveAdmin || count > mostActiveAdmin.count) {
        mostActiveAdmin = { address, count };
      }
    }

    res.json({ success: true, data: { days, mostActiveAdmin } });
  } catch (error) {
    logger.error("Failed to compute disbursement heatmap", error);
    res.status(500).json({ success: false, error: "Failed to compute disbursement heatmap." });
  }
});

export default router;
