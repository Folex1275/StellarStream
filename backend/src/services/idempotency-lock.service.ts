import { redis } from '../lib/redis.js';

const LOCK_TTL = 5; // 5 seconds as per issue requirement
const LOCK_PREFIX = 'idempotency-lock:';
const IDEMPOTENCY_PREFIX = 'idempotency-key:';

export class IdempotencyLockService {
  /**
   * Acquire a distributed lock for a sender address.
   * Returns true if lock acquired, false if already locked.
   */
  async acquireLock(senderAddress: string): Promise<boolean> {
    const lockKey = `${LOCK_PREFIX}${senderAddress}`;
    const result = await redis.set(lockKey, '1', 'EX', LOCK_TTL, 'NX');
    return result === 'OK';
  }

  /**
   * Release a lock for a sender address.
   */
  async releaseLock(senderAddress: string): Promise<void> {
    const lockKey = `${LOCK_PREFIX}${senderAddress}`;
    await redis.del(lockKey);
  }

  /**
   * Check if an idempotency key has been processed.
   * Returns the cached result if found, null otherwise.
   */
  async getIdempotencyResult(idempotencyKey: string): Promise<any | null> {
    const key = `${IDEMPOTENCY_PREFIX}${idempotencyKey}`;
    const result = await redis.get(key);
    return result ? JSON.parse(result) : null;
  }

  /**
   * Store an idempotency result with TTL.
   */
  async storeIdempotencyResult(idempotencyKey: string, result: any, ttlSeconds = 3600): Promise<void> {
    const key = `${IDEMPOTENCY_PREFIX}${idempotencyKey}`;
    await redis.setex(key, ttlSeconds, JSON.stringify(result));
  }

  /**
   * Validate idempotency key format.
   */
  validateIdempotencyKey(key: string): boolean {
    return typeof key === 'string' && key.trim().length > 0 && key.length <= 256;
  }
}

export const idempotencyLockService = new IdempotencyLockService();
