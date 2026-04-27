/**
 * GET /api/v3/split/expand
 *
 * #842 — Split-Link Payload Decompressor
 *
 * Accepts a zlib-compressed, base64url-encoded split payload (from a Share Link)
 * and returns the full JSON split list.
 *
 * Query params:
 *   payload — base64url-encoded zlib-compressed JSON string
 *
 * Response:
 *   { recipients: { address: string; amount: string }[]; asset?: string; memo?: string }
 */

import { Router, Request, Response } from "express";
import { inflateSync } from "zlib";
import { z } from "zod";

const router = Router();

const recipientSchema = z.object({
  address: z.string().min(1),
  amount: z.string().regex(/^\d+$/),
});

const splitPayloadSchema = z.object({
  recipients: z.array(recipientSchema).min(1).max(1000),
  asset: z.string().optional(),
  memo: z.string().max(28).optional(),
});

router.get("/split/expand", (req: Request, res: Response) => {
  const { payload } = req.query;

  if (!payload || typeof payload !== "string") {
    res.status(400).json({ error: "Missing required query parameter: payload" });
    return;
  }

  let decompressed: string;
  try {
    // base64url → Buffer → zlib inflate
    const buf = Buffer.from(payload, "base64url");
    decompressed = inflateSync(buf).toString("utf8");
  } catch {
    res.status(422).json({ error: "Failed to decompress payload. Ensure it is base64url-encoded zlib data." });
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decompressed);
  } catch {
    res.status(422).json({ error: "Decompressed payload is not valid JSON." });
    return;
  }

  const result = splitPayloadSchema.safeParse(parsed);
  if (!result.success) {
    res.status(422).json({
      error: "Invalid split payload structure.",
      details: result.error.flatten(),
    });
    return;
  }

  res.json({ data: result.data });
});

export default router;
