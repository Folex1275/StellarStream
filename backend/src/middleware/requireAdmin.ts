import { Request, Response, NextFunction } from "express";

/**
 * AdminOnly middleware.
 * Expects the ADMIN_API_KEY environment variable to be set.
 * Callers must pass it as: Authorization: Bearer <key>  OR  X-Admin-Key: <key>
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    res.status(503).json({ error: "Admin auth not configured", code: "ADMIN_NOT_CONFIGURED" });
    return;
  }

  const provided =
    req.headers["x-admin-key"] ??
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!provided || provided !== adminKey) {
    res.status(403).json({ error: "Forbidden", code: "ADMIN_FORBIDDEN" });
    return;
  }

  next();
}
