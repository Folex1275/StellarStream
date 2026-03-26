import { Router, Request, Response } from "express";
import { AffiliateService } from "../services/affiliate.service.js";
import { logger } from "../logger.js";

const router = Router();
const affiliateService = new AffiliateService();

/**
 * GET /api/v2/affiliate/earnings
 * Get affiliate earnings for a Stellar address
 */
router.get("/earnings", async (req: Request, res: Response) => {
  try {
    const { address } = req.query;

    if (!address || typeof address !== "string") {
      res.status(400).json({ error: "Stellar address is required" });
      return;
    }

    const earnings = await affiliateService.getEarnings(address);

    res.json({
      success: true,
      earnings,
    });
  } catch (error) {
    logger.error("Error fetching affiliate earnings", error);
    res.status(500).json({ error: "Failed to fetch earnings" });
  }
});

/**
 * POST /api/v2/affiliate/claim
 * Claim pending affiliate earnings
 */
router.post("/claim", async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      res.status(400).json({ error: "Stellar address is required" });
      return;
    }

    const claimed = await affiliateService.claimEarnings(address);

    res.json({
      success: true,
      claimed,
      message: "Earnings claimed successfully",
    });
  } catch (error) {
    logger.error("Error claiming affiliate earnings", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to claim earnings",
    });
  }
});

/**
 * GET /api/v2/affiliate/leaderboard
 * Get top affiliates by earnings
 */
router.get("/leaderboard", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    const topAffiliates = await affiliateService.getTopAffiliates(limit);

    res.json({
      success: true,
      leaderboard: topAffiliates,
    });
  } catch (error) {
    logger.error("Error fetching affiliate leaderboard", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
