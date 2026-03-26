import { Router, Request, Response } from "express";
import { TvlAggregatorService } from "../../services/tvl-aggregator.service.js";
import { HistoricalFlowService } from "../../services/historical-flow.service.js";
import { logger } from "../../logger.js";

const router = Router();
const tvlService = new TvlAggregatorService();
const flowService = new HistoricalFlowService();

/**
 * GET /api/v2/analytics/global-stats
 * Returns TVL, 24h volume, and stream counts for landing page
 */
router.get("/global-stats", async (req: Request, res: Response) => {
  try {
    const stats = await tvlService.getStats(true);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error("Failed to get global stats", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve global statistics",
    });
  }
});

/**
 * GET /api/v2/analytics/tvl-history
 * Returns daily TVL snapshots for growth charts
 * Query params:
 *   - days: number of days to return (default: 30, max: 365)
 */
router.get("/tvl-history", async (req: Request, res: Response) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 30, 365);
    const history = await tvlService.getTvlHistory(days);

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    logger.error("Failed to get TVL history", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve TVL history",
    });
  }
});

/**
 * GET /api/v2/analytics/flow/:address
 * Returns time-series flow data for an address
 * Query params:
 *   - days: number of days to return (default: 30, max: 365)
 */
router.get("/flow/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const days = Math.min(parseInt(req.query.days as string) || 30, 365);

    if (!address) {
      res.status(400).json({
        success: false,
        error: "Address is required",
      });
      return;
    }

    const flowData = await flowService.getFlowHistory(address, days);

    res.json({
      success: true,
      address,
      data: flowData,
      count: flowData.length,
    });
  } catch (error) {
    logger.error("Failed to get flow history", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve flow history",
    });
  }
});

/**
 * GET /api/v2/analytics/net-worth/:address
 * Returns cumulative net worth progression
 * Query params:
 *   - days: number of days to return (default: 30, max: 365)
 */
router.get("/net-worth/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const days = Math.min(parseInt(req.query.days as string) || 30, 365);

    if (!address) {
      res.status(400).json({
        success: false,
        error: "Address is required",
      });
      return;
    }

    const netWorthData = await flowService.getNetWorthHistory(address, days);

    res.json({
      success: true,
      address,
      data: netWorthData,
      count: netWorthData.length,
    });
  } catch (error) {
    logger.error("Failed to get net worth history", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve net worth history",
    });
  }
});

/**
 * GET /api/v2/analytics/flow-comparison/:address
 * Returns total inbound, outbound, and net flow
 * Query params:
 *   - days: number of days to analyze (default: 30, max: 365)
 */
router.get("/flow-comparison/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const days = Math.min(parseInt(req.query.days as string) || 30, 365);

    if (!address) {
      res.status(400).json({
        success: false,
        error: "Address is required",
      });
      return;
    }

    const comparison = await flowService.getFlowComparison(address, days);

    res.json({
      success: true,
      address,
      data: comparison,
    });
  } catch (error) {
    logger.error("Failed to get flow comparison", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve flow comparison",
    });
  }
});

export default router;
