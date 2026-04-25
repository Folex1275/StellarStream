import { Request, Response, Router } from "express";
import { z } from "zod";
import { analyzeSplitDraft } from "../../services/split-analysis.service.js";

const router = Router();

const recipientSchema = z.object({
  address: z.string().trim().min(1),
});

const requestSchema = z.object({
  recipients: z.array(recipientSchema).min(1).max(1000),
  estimatedFeeStroops: z.string().regex(/^\d+$/).optional(),
  totalAmountStroops: z.string().regex(/^\d+$/).optional(),
});

/**
 * POST /api/v3/split/analyze
 *
 * Analyzes a draft split and returns optimization suggestions such as
 * duplicate-recipient merge opportunities and optionally high-fee warnings.
 */
router.post("/split/analyze", (req: Request, res: Response) => {
  const parsed = requestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.flatten(),
    });
    return;
  }

  const result = analyzeSplitDraft(parsed.data);

  res.json({
    suggestions: result.suggestions,
    duplicateGroups: result.duplicateGroups,
  });
});

export default router;
