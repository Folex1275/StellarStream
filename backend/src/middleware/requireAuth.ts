import { Request, Response, NextFunction } from 'express';

/**
 * Enforces that the request has been authenticated by authMiddleware.
 * Must be placed after authMiddleware in the middleware chain.
 * Returns 401 if no valid API key / Bearer token was provided.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.authenticated) {
    res.status(401).json({ error: 'Unauthorized', code: 'MISSING_AUTH' });
    return;
  }
  next();
}
