import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../lib/redis.js';

const PUBLIC_POINTS = 100;
const PUBLIC_DURATION_SEC = 60;
const AUTH_POINTS = 500;
const AUTH_DURATION_SEC = 60;

const publicLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:public',
  points: PUBLIC_POINTS,
  duration: PUBLIC_DURATION_SEC,
});

const authLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:auth',
  points: AUTH_POINTS,
  duration: AUTH_DURATION_SEC,
});

function getRateLimitKey(req: Request): string {
  if (req.authenticated && req.authenticatedKeyId) {
    return `apikey:${req.authenticatedKeyId}`;
  }
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}

/**
 * Tiered rate limit: 100/min public, 500/min authenticated.
 * Apply only to /stats and /search. Fail-closed on Redis errors (503).
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = getRateLimitKey(req);
  const limiter = req.authenticated ? authLimiter : publicLimiter;

  limiter
    .consume(key)
    .then(() => {
      next();
    })
    .catch((rejRes) => {
      if (rejRes instanceof Error) {
        res.status(503).json({
          error: 'Rate limit unavailable',
          message: 'Service temporarily unable to check rate limit. Try again later.',
        });
        return;
      }
      const secs = Math.round(((rejRes as { msBeforeNext?: number }).msBeforeNext ?? 1000) / 1000) || 1;
      res.set('Retry-After', String(secs));
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${secs} seconds.`,
      });
    });
}
