import { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis.js";

const TTL_SECONDS = 600; // 10 minutes
const KEY_PREFIX = "idempotency:v3:";

/**
 * #650 — Idempotency-Key middleware for V3 split submissions.
 *
 * Requires an `Idempotency-Key` header on every request.
 * - First request: stores a placeholder in Redis (TTL 10 min) and proceeds.
 * - Duplicate request within TTL: returns 409 Conflict.
 */
export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const key = req.headers["idempotency-key"];

  if (!key || typeof key !== "string" || key.trim() === "") {
    res.status(400).json({
      error: "Missing Idempotency-Key",
      message: "All V3 split submissions require an Idempotency-Key header.",
    });
    return;
  }

  const redisKey = `${KEY_PREFIX}${key.trim()}`;

  // NX = only set if not exists; returns null if key already present
  const set = await redis.set(redisKey, "1", "EX", TTL_SECONDS, "NX");

  if (set === null) {
    res.status(409).json({
      error: "Duplicate Request",
      message: "This Idempotency-Key has already been used. Retry with a new key after 10 minutes.",
    });
    return;
  }

  next();
}
