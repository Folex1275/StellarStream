import { Router, type Request, type Response } from "express";
import { z } from "zod";
import asyncHandler from "../../utils/asyncHandler.js";
import { FeeBumpRelayerService } from "../../services/fee-bump-relayer.service.js";
import { logger } from "../../logger.js";

const router = Router();
const relayerService = new FeeBumpRelayerService();

const monitorSchema = z.object({
  txHash: z.string().min(1),
  txXdr: z.string().min(1),
  sourceAddress: z.string().startsWith("G").min(56),
  feeStroops: z.string().regex(/^\d+$/),
  maxBumps: z.number().int().min(1).max(5).optional(),
});

router.post(
  "/transactions/monitor",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = monitorSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid payload",
        details: parsed.error.flatten(),
      });
      return;
    }

    const { txHash, txXdr, sourceAddress, feeStroops, maxBumps } = parsed.data;

    void relayerService
      .monitorTransaction({ txHash, txXdr, sourceAddress, feeStroops, maxBumps })
      .catch((error) => {
        logger.error("[FeeBumpRelayer] Background monitor failed", error, {
          txHash,
        });
      });

    res.status(202).json({
      success: true,
      data: { txHash, status: "MONITORING" },
      message: "Transaction registered for fee-bump monitoring.",
    });
  })
);

router.get(
  "/transactions/:txHash/status",
  asyncHandler(async (req: Request, res: Response) => {
    const { txHash } = req.params;
    const record = await relayerService.getTransactionStatus(txHash);

    if (!record) {
      res.status(404).json({ success: false, error: "Transaction not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        txHash: record.txHash,
        status: record.status,
        originalFee: record.originalFeeSt,
        currentFee: record.currentFeeSt,
        bumpCount: record.bumpCount,
        maxBumps: record.maxBumps,
        submittedAt: record.submittedAt,
        confirmedAt: record.confirmedAt,
        lastBumpAt: record.lastBumpAt,
        errorMessage: record.errorMessage,
      },
    });
  })
);

router.get(
  "/transactions/monitored",
  asyncHandler(async (req: Request, res: Response) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const rawLimit =
      typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : NaN;
    const limit = Number.isNaN(rawLimit) ? 20 : Math.min(rawLimit, 100);
    const records = await relayerService.listMonitored(status, limit);

    res.json({
      success: true,
      data: records,
      count: records.length,
    });
  })
);

export default router;
