/**
 * Identity Cache Service
 *
 * Maintains a Redis-backed cache of verified Stellar addresses.
 * Used by the verify-list endpoint to answer bulk verification queries
 * without hitting the database on every request.
 *
 * Cache key: identity:verified:<address>  →  "1" (verified) | absent (unverified)
 * TTL: 10 minutes (configurable via IDENTITY_CACHE_TTL_SECONDS env var)
 */

import { redis } from "../lib/redis.js";
import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";

const KEY_PREFIX = "identity:verified:";
const TTL_SECONDS = parseInt(process.env.IDENTITY_CACHE_TTL_SECONDS ?? "600", 10);

function cacheKey(address: string): string {
  return `${KEY_PREFIX}${address}`;
}

/**
 * Mark an address as verified in the cache.
 * Called when a verification event is ingested from the contract.
 */
export async function setVerified(address: string): Promise<void> {
  await redis.set(cacheKey(address), "1", "EX", TTL_SECONDS);
}

/**
 * Remove an address from the verified cache (e.g. revocation).
 */
export async function revokeVerified(address: string): Promise<void> {
  await redis.del(cacheKey(address));
}

/**
 * Bulk-check an array of addresses.
 * Returns a map of address → boolean.
 *
 * Strategy:
 *  1. Check Redis for all addresses in a single pipeline.
 *  2. For any cache miss, fall back to the DB and backfill the cache.
 */
export async function bulkCheckVerified(
  addresses: string[],
): Promise<Record<string, boolean>> {
  if (addresses.length === 0) return {};

  // 1. Pipeline GET for all addresses
  const pipeline = redis.pipeline();
  for (const addr of addresses) pipeline.get(cacheKey(addr));
  const results = await pipeline.exec();

  const statusMap: Record<string, boolean> = {};
  const cacheMisses: string[] = [];

  addresses.forEach((addr, i) => {
    const [err, val] = results?.[i] ?? [null, null];
    if (err || val === null) {
      cacheMisses.push(addr);
    } else {
      statusMap[addr] = val === "1";
    }
  });

  // 2. DB fallback for cache misses
  if (cacheMisses.length > 0) {
    try {
      // The VerifiedUser model stores verified addresses.
      // We query which of the misses exist as verified in the DB.
      const verified = await prisma.stream.findMany({
        where: {
          receiver: { in: cacheMisses },
          status: "ACTIVE",
        },
        select: { receiver: true },
        distinct: ["receiver"],
      });

      const verifiedSet = new Set(verified.map((r) => r.receiver));

      // Backfill cache and populate result map
      const backfillPipeline = redis.pipeline();
      for (const addr of cacheMisses) {
        const isVerified = verifiedSet.has(addr);
        statusMap[addr] = isVerified;
        if (isVerified) {
          backfillPipeline.set(cacheKey(addr), "1", "EX", TTL_SECONDS);
        }
      }
      await backfillPipeline.exec();
    } catch (err) {
      logger.error("[IdentityCache] DB fallback error", { err });
      // Return false for all misses on DB error — fail safe
      for (const addr of cacheMisses) {
        statusMap[addr] = statusMap[addr] ?? false;
      }
    }
  }

  return statusMap;
}
