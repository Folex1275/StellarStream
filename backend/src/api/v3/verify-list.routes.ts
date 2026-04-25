/**
 * GET /api/v3/verify-list
 *
 * Accepts an array of Stellar addresses and returns their verification status
 * from the Redis identity cache (with DB fallback).
 *
 * Body: { addresses: string[] }
 * Response: { results: { address: string; verified: boolean }[] }
 */

import { Router, Request, Response } from "express";
import { bulkCheckVerified } from "../../services/identity-cache.service.js";
import { logger } from "../../logger.js";

const router = Router();

const MAX_ADDRESSES = 200;

router.post("/verify-list", async (req: Request, res: Response) => {
  const { addresses } = req.body as { addresses?: unknown };

  if (!Array.isArray(addresses)) {
    res.status(400).json({ error: "addresses must be an array" });
    return;
  }

  if (addresses.length > MAX_ADDRESSES) {
    res.status(400).json({ error: `Maximum ${MAX_ADDRESSES} addresses per request` });
    return;
  }

  const sanitized = addresses
    .filter((a): a is string => typeof a === "string" && a.length > 0)
    .map((a) => a.trim());

  try {
    const statusMap = await bulkCheckVerified(sanitized);
    const results = sanitized.map((address) => ({
      address,
      verified: statusMap[address] ?? false,
    }));
    res.json({ results });
  } catch (err) {
    logger.error("[verify-list] Unexpected error", { err });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
