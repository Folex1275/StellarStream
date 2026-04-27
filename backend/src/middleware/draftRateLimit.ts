import { Request, Response, NextFunction } from "express";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { redis } from "../lib/redis.js";

const DRAFT_POINTS = 10;       // max drafts per window
const DRAFT_DURATION_SEC = 60; // 1-minute window

const draftLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl:v3:draft",
  points: DRAFT_POINTS,
  duration: DRAFT_DURATION_SEC,
});

/**
 * Rate limiter for V3 Split-Draft creation (#848).
 * Limits each Organisation_ID to 10 drafts/minute to prevent spam.
 * Falls back to IP-based limiting when no orgAddress is present.
 */
export async function draftRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const key: string = req.body?.orgAddress ?? req.ip ?? "unknown";

  try {
    const result: RateLimiterRes = await draftLimiter.consume(key);
    res.set("X-RateLimit-Limit", String(DRAFT_POINTS));
    res.set("X-RateLimit-Remaining", String(result.remainingPoints));
    next();
  } catch (err) {
    if (err instanceof Error) {
      res.status(503).json({ success: false, error: "Rate limit service unavailable." });
      return;
    }
    const rlRes = err as RateLimiterRes;
    const retryAfter = Math.ceil((rlRes.msBeforeNext ?? 1000) / 1000);
    res.set("Retry-After", String(retryAfter));
    res.set("X-RateLimit-Limit", String(DRAFT_POINTS));
    res.set("X-RateLimit-Remaining", "0");
    res.status(429).json({
      success: false,
      error: "Too Many Requests",
      message: `Draft rate limit exceeded. Retry in ${retryAfter}s.`,
    });
  }
}
