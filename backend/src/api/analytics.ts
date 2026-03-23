import { Router, type Request, type Response } from "express";
import { StreamLifecycleService } from "../services/index.js";

const router = Router();
const lifecycleService = new StreamLifecycleService();

/**
 * GET /api/v1/analytics/leaderboard
 *
 * Returns the top 10 streamers (by total volume sent) and
 * top 10 receivers (by total volume received) across all indexed streams.
 *
 * Query params:
 *   limit  - number of entries per category (default: 10, max: 100)
 */
router.get("/leaderboard", (_req: Request, res: Response): void => {
  void (async (): Promise<void> => {
    try {
      const rawLimitParam = _req.query["limit"];
      const rawLimit =
        typeof rawLimitParam === "string"
          ? parseInt(rawLimitParam, 10)
          : 10;
      const limit =
        Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 10;

      const leaderboard = await lifecycleService.getLeaderboard(limit);

      res.json({
        topStreamers: leaderboard.topStreamers,
        topReceivers: leaderboard.topReceivers,
      });
    } catch {
      res.status(500).json({ error: "Failed to compute leaderboard" });
    }
  })();
});

export default router;
