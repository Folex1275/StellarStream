// API routes and controllers
// Will contain REST API endpoints for querying stream data

import { Router, Request, Response } from "express";
import { AuditLogService } from "../services/audit-log.service";
import { logger } from "../logger";

const router = Router();
const auditLogService = new AuditLogService();

/**
 * GET /api/audit-log
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
      return res.status(400).json({
        success: false,
        error: "Stream ID is required",
      });
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

