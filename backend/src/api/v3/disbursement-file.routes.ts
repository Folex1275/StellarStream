import { Router, Request, Response } from "express";
import { z } from "zod";
import { processFile } from "../../services/disbursement-file.service.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();

const querySchema = z.object({
  format: z.enum(["csv", "json"]).default("json"),
});

/**
 * POST /api/v3/process-disbursement-file
 *
 * Accepts a raw CSV or JSON body of recipients and returns a sanitized,
 * normalized payload ready for contract interaction.
 *
 * Query params:
 *   - format: "csv" | "json" (default: "json")
 *
 * Request body (JSON format):
 *   [{ "address": "G...", "amount": "100.50" }, ...]
 *
 * Request body (CSV format, text/plain or text/csv):
 *   address,amount
 *   G...,100.50
 *
 * Response:
 *   { success: true, data: { valid: [...], errors: [...], totalRows: number } }
 */
router.post(
  "/process-disbursement-file",
  asyncHandler(async (req: Request, res: Response) => {
    const { format } = querySchema.parse(req.query);

    let rawContent: string;

    if (format === "csv") {
      if (typeof req.body !== "string" || req.body.trim() === "") {
        res.status(400).json({ success: false, error: "CSV body must be a non-empty string. Set Content-Type: text/csv" });
        return;
      }
      rawContent = req.body as string;
    } else {
      rawContent = JSON.stringify(req.body);
    }

    const result = await processFile(rawContent, format);

    res.json({ success: true, data: result });
  })
);

export default router;
