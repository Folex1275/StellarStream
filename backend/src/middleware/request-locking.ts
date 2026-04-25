import { Request, Response, NextFunction } from 'express';
import { idempotencyLockService } from '../services/idempotency-lock.service.js';

/**
 * Issue #945: Request-Locking Middleware
 * Prevents race conditions by locking sender address during processing.
 * Requires idempotency-key header and sender_address in body.
 */
export async function requestLockingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const idempotencyKey = req.headers['idempotency-key'];
  const senderAddress = req.body?.sender_address;

  // Validate headers and body
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    res.status(400).json({
      error: 'Missing idempotency-key header',
      code: 'MISSING_IDEMPOTENCY_KEY',
    });
    return;
  }

  if (!idempotencyLockService.validateIdempotencyKey(idempotencyKey)) {
    res.status(400).json({
      error: 'Invalid idempotency-key format',
      code: 'INVALID_IDEMPOTENCY_KEY',
    });
    return;
  }

  if (!senderAddress || typeof senderAddress !== 'string') {
    res.status(400).json({
      error: 'Missing or invalid sender_address in request body',
      code: 'MISSING_SENDER_ADDRESS',
    });
    return;
  }

  // Check for cached result from previous identical request
  const cachedResult = await idempotencyLockService.getIdempotencyResult(idempotencyKey);
  if (cachedResult) {
    res.status(200).json(cachedResult);
    return;
  }

  // Try to acquire lock
  const lockAcquired = await idempotencyLockService.acquireLock(senderAddress);
  if (!lockAcquired) {
    res.status(429).json({
      error: 'Request already in progress for this sender',
      code: 'LOCK_CONFLICT',
      message: 'Another request is being processed for this sender. Please retry after 5 seconds.',
    });
    return;
  }

  // Store lock info in request for cleanup
  (req as any).lockInfo = {
    senderAddress,
    idempotencyKey,
  };

  // Wrap res.json to capture response and store idempotency result
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyLockService.storeIdempotencyResult(idempotencyKey, body).catch((err) => {
        console.error('[IdempotencyLock] Failed to store result:', err);
      });
    }
    return originalJson(body);
  };

  // Cleanup lock on response finish
  res.on('finish', async () => {
    const lockInfo = (req as any).lockInfo;
    if (lockInfo) {
      await idempotencyLockService.releaseLock(lockInfo.senderAddress);
    }
  });

  next();
}
