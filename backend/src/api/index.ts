// API routes and controllers
// Will contain REST API endpoints for querying stream data

import { Router, Request, Response } from "express";
import { AuditLogService } from "../services/audit-log.service";
import { logger } from "../logger";
import streamsRouter from "./streams.routes";
import yieldRouter from "./yield.routes.js";
import snapshotRouter from "./snapshot.routes";
import governanceRouter from "./governance.routes.js";
import gasTankRouter from "./gas-tank.routes.js";
import analyticsRouter from "./analytics.routes.js";
import walletAuthRouter from "./wallet-auth.routes.js";
import notificationRouter from "./notification-subscription.routes.js";
import invoiceLinkRouter from "./invoice-link.routes.js";
import webhooksRouter from "./webhooks.routes.js";
import cachedStatsRouter from "./cached-stats.routes.js";

const router = Router();

// Sub-routers (mounted relative to /api/v1 in index.ts)
router.use("/", streamsRouter);
router.use("/yield", yieldRouter);
router.use("/snapshots", snapshotRouter);
router.use("/", governanceRouter);
router.use("/", gasTankRouter);
router.use("/analytics", analyticsRouter);
router.use("/auth", walletAuthRouter);
router.use("/notifications", notificationRouter);
router.use("/invoice-links", invoiceLinkRouter);
router.use("/webhooks", webhooksRouter);
router.use("/stats", cachedStatsRouter);

const auditLogService = new AuditLogService();

/**
 * GET /api/v1/audit-log
 * Returns the last 50 protocol events in chronological order
 * Query params:
 *   - limit: number of events to return (default: 50, max: 100)
 */
router.get("/audit-log", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit as string) || 50,
      100
    );

    const events = await auditLogService.getRecentEvents(limit);

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    logger.error("Failed to retrieve audit log", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve audit log",
    });
  }
});

/**
 * GET /api/audit-log/:streamId
 * Returns all events for a specific stream
 */
router.get("/audit-log/:streamId", async (req: Request, res: Response) => {
  try {
    const { streamId } = req.params;

    if (!streamId) {
      res.status(400).json({
        success: false,
        error: "Stream ID is required",
      });
      return;
    }

    const events = await auditLogService.getStreamEvents(streamId);

    res.json({
      success: true,
      streamId,
      count: events.length,
      events,
    });
  } catch (error) {
    logger.error("Failed to retrieve stream events", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve stream events",
    });
  }
});

export default router;
