/**
 * Dust Recovery Audit Routes (Issue #179)
 *
 * GET  /api/v1/dust-audit/report         — Retrieve stored inefficiency report
 * GET  /api/v1/dust-audit/summary        — Aggregated dust-loss totals
 * POST /api/v1/dust-audit/scan           — Trigger a full historical scan
 */

import { Router, Request, Response } from "express";
import { DustRecoveryAuditService } from "../services/dust-recovery-audit.service.js";
import { logger } from "../logger.js";

const router = Router();
const dustAuditService = new DustRecoveryAuditService();

/**
 * GET /dust-audit/report
 * Query params:
 *   - asset:            filter by token address
 *   - protocolVersion:  filter by protocol version (1, 2, 3)
 */
router.get("/report", async (req: Request, res: Response) => {
  try {
    const asset = req.query.asset as string | undefined;
    const protocolVersion = req.query.protocolVersion
      ? parseInt(req.query.protocolVersion as string, 10)
      : undefined;

    if (protocolVersion !== undefined && isNaN(protocolVersion)) {
      res.status(400).json({
        success: false,
        error: "protocolVersion must be an integer",
      });
      return;
    }

    const rows = await dustAuditService.getReport({ asset, protocolVersion });

    res.json({
      success: true,
      count: rows.length,
      report: rows,
    });
  } catch (error) {
    logger.error("Failed to retrieve dust audit report", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve dust audit report",
    });
  }
});

/**
 * GET /dust-audit/summary
 * Returns aggregate totals across all assets and versions.
 */
router.get("/summary", async (_req: Request, res: Response) => {
  try {
    const summary = await dustAuditService.getSummary();

    res.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    logger.error("Failed to retrieve dust audit summary", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve dust audit summary",
    });
  }
});

/**
 * POST /dust-audit/scan
 * Triggers a full historical scan → aggregation → persist pipeline.
 * Body (optional):
 *   - startLedger: ledger sequence to begin scanning from
 */
router.post("/scan", async (req: Request, res: Response) => {
  try {
    const startLedger = req.body?.startLedger
      ? parseInt(req.body.startLedger as string, 10)
      : undefined;

    if (startLedger !== undefined && (isNaN(startLedger) || startLedger < 0)) {
      res.status(400).json({
        success: false,
        error: "startLedger must be a non-negative integer",
      });
      return;
    }

    const report = await dustAuditService.runFullAudit(startLedger);

    res.json({
      success: true,
      message: "Dust audit scan complete",
      count: report.length,
      report,
    });
  } catch (error) {
    logger.error("Failed to run dust audit scan", error);
    res.status(500).json({
      success: false,
      error: "Failed to run dust audit scan",
    });
  }
});

export default router;
