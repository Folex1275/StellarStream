import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireWalletAuth } from '../../middleware/requireWalletAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { historicalDataBackfillService } from '../../services/historical-data-backfill.service.js';

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────────────

const startBackfillSchema = z.object({
  contractId: z.string().min(56),
  startLedger: z.number().int().positive(),
  endLedger: z.number().int().positive(),
});

const processBatchSchema = z.object({
  contractId: z.string().min(56),
  startLedger: z.number().int().positive(),
  endLedger: z.number().int().positive(),
});

// ── POST /api/v3/backfill/start
// Start a historical data backfill job. Requires EXECUTOR role.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/backfill/start',
  requireWalletAuth,
  requireRole('EXECUTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = startBackfillSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
        return;
      }

      const { contractId, startLedger, endLedger } = parsed.data;

      if (startLedger >= endLedger) {
        res.status(400).json({ error: 'startLedger must be less than endLedger' });
        return;
      }

      const progress = await historicalDataBackfillService.startBackfill(
        contractId,
        startLedger,
        endLedger,
      );

      res.status(202).json({
        message: 'Backfill job started',
        progress,
      });
    } catch (error: any) {
      if (error.message.includes('already in progress')) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to start backfill' });
      }
    }
  },
);

// ── POST /api/v3/backfill/process-batch
// Process a batch of ledgers. Requires EXECUTOR role.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/backfill/process-batch',
  requireWalletAuth,
  requireRole('EXECUTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = processBatchSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
        return;
      }

      const { contractId, startLedger, endLedger } = parsed.data;

      const result = await historicalDataBackfillService.processBatch(
        contractId,
        startLedger,
        endLedger,
      );

      res.json({
        message: 'Batch processed',
        processed: result.processed,
        failed: result.failed,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process batch' });
    }
  },
);

// ── POST /api/v3/backfill/complete
// Mark a backfill job as completed. Requires EXECUTOR role.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/backfill/complete',
  requireWalletAuth,
  requireRole('EXECUTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { contractId } = req.body;

      if (!contractId) {
        res.status(400).json({ error: 'Missing contractId' });
        return;
      }

      const progress = await historicalDataBackfillService.completeBackfill(contractId);

      res.json({
        message: 'Backfill completed',
        progress,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to complete backfill' });
    }
  },
);

// ── POST /api/v3/backfill/fail
// Mark a backfill job as failed. Requires EXECUTOR role.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/backfill/fail',
  requireWalletAuth,
  requireRole('EXECUTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { contractId, error } = req.body;

      if (!contractId) {
        res.status(400).json({ error: 'Missing contractId' });
        return;
      }

      const progress = await historicalDataBackfillService.failBackfill(
        contractId,
        error || 'Unknown error',
      );

      res.json({
        message: 'Backfill marked as failed',
        progress,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark backfill as failed' });
    }
  },
);

// ── GET /api/v3/backfill/progress/:contractId
// Get backfill progress for a contract.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/backfill/progress/:contractId',
  requireWalletAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { contractId } = req.params;

      const progress = await historicalDataBackfillService.getProgress(contractId);

      if (!progress) {
        res.status(404).json({ error: 'No backfill progress found for contract' });
        return;
      }

      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get backfill progress' });
    }
  },
);

// ── GET /api/v3/backfill/active
// Get all active backfill jobs. Requires EXECUTOR role.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/backfill/active',
  requireWalletAuth,
  requireRole('EXECUTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const backfills = await historicalDataBackfillService.getActiveBackfills();

      res.json({
        activeBackfills: backfills,
        count: backfills.length,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get active backfills' });
    }
  },
);

// ── DELETE /api/v3/backfill/cancel/:contractId
// Cancel a backfill job. Requires EXECUTOR role.
// ─────────────────────────────────────────────────────────────────────────────
router.delete(
  '/backfill/cancel/:contractId',
  requireWalletAuth,
  requireRole('EXECUTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { contractId } = req.params;

      await historicalDataBackfillService.cancelBackfill(contractId);

      res.json({
        message: 'Backfill cancelled',
        contractId,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to cancel backfill' });
    }
  },
);

export default router;
