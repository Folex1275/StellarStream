import { randomBytes } from "crypto";
import { NextFunction, Request, Response, Router } from "express";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";
import { z } from "zod";
import { logger } from "../../logger.js";
import { redis } from "../../lib/redis.js";
import {
  consumeNonce,
  getStoredNonce,
  storeNonce,
  verifyStellarSignature,
} from "../../lib/signatureAuth.js";
import { RecipientVerificationService } from "../../services/recipient-verification.service.js";
import asyncHandler from "../../utils/asyncHandler.js";

const router = Router();
const verificationService = new RecipientVerificationService();

const PUBLIC_VERIFY_POINTS = 10;
const PUBLIC_VERIFY_DURATION_SEC = 60;

const publicVerifyLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl:v3:public-verify",
  points: PUBLIC_VERIFY_POINTS,
  duration: PUBLIC_VERIFY_DURATION_SEC,
});

const challengeSchema = z.object({
  address: z.string().trim().startsWith("G").min(56, "Valid Stellar G-address required"),
});

const verifySchema = z.object({
  address: z.string().trim().startsWith("G").min(56),
  nonce: z.string().min(1),
  signature: z.string().min(1),
});

async function publicVerifyRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const key = req.ip ?? "unknown";

  try {
    const result: RateLimiterRes = await publicVerifyLimiter.consume(key);
    res.set("X-RateLimit-Limit", String(PUBLIC_VERIFY_POINTS));
    res.set("X-RateLimit-Remaining", String(result.remainingPoints));
    next();
  } catch (error) {
    if (error instanceof Error) {
      logger.error("[PublicVerifyPayment] Rate limiter unavailable", error, { key });
      res.status(503).json({ success: false, error: "Rate limit service unavailable." });
      return;
    }

    const rateLimitResult = error as RateLimiterRes;
    const retryAfter = Math.ceil((rateLimitResult.msBeforeNext ?? 1000) / 1000);
    res.set("Retry-After", String(retryAfter));
    res.set("X-RateLimit-Limit", String(PUBLIC_VERIFY_POINTS));
    res.set("X-RateLimit-Remaining", "0");
    res.status(429).json({
      success: false,
      error: "Too many requests. Try again later.",
    });
  }
}

router.use("/public/verify-my-payment", publicVerifyRateLimitMiddleware);

router.post(
  "/public/verify-my-payment/challenge",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = challengeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Valid Stellar G-address required" });
      return;
    }

    const nonce = randomBytes(32).toString("hex");
    await storeNonce(nonce);

    res.json({
      success: true,
      data: {
        nonce,
        message: `Sign the following message with your wallet: "Stellar Signed Message:\n${nonce}"`,
      },
    });
  }),
);

router.post(
  "/public/verify-my-payment",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "address, nonce, and signature are required" });
      return;
    }

    const { address, nonce, signature } = parsed.data;
    const stored = await getStoredNonce(nonce);
    const consumed = await consumeNonce(nonce);

    if (!stored || !consumed) {
      res.status(401).json({ success: false, error: "Invalid or expired nonce" });
      return;
    }

    const valid = verifyStellarSignature({ address, nonce, signatureBase64: signature });
    if (!valid) {
      res.status(401).json({ success: false, error: "Invalid signature" });
      return;
    }

    const payments = await verificationService.getMyPayments(address);

    logger.info("[PublicVerifyPayment] Verified recipient query", {
      address,
      paymentsFound: payments.length,
    });

    res.json({
      success: true,
      data: {
        address,
        payments,
        count: payments.length,
      },
    });
  }),
);

export default router;
