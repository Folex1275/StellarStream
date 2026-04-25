import { Request, Response, NextFunction } from 'express';
import { OrgMemberService, OrgRole, hasMinRole } from '../services/org-member.service.js';

const orgMemberService = new OrgMemberService();

/**
 * Middleware factory that enforces RBAC for a shared G-address organisation.
 *
 * Prerequisites (must run before this middleware):
 *   1. `requireWalletAuth`  — sets req.walletAddress
 *
 * The org address is resolved from (in order):
 *   - req.params.orgAddress
 *   - req.body.orgAddress
 *   - req.query.orgAddress
 *
 * On success, sets `req.orgRole` so downstream handlers can inspect it.
 *
 * @param minimumRole  The lowest role that is allowed to proceed.
 *
 * @example
 *   router.post('/splits/draft',   requireWalletAuth, requireRole('DRAFTER'),  draftSplit);
 *   router.post('/splits/approve', requireWalletAuth, requireRole('APPROVER'), approveSplit);
 *   router.post('/splits/execute', requireWalletAuth, requireRole('EXECUTOR'), executeSplit);
 */
export function requireRole(minimumRole: OrgRole) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // requireWalletAuth must have run first
    if (!req.walletAuthenticated || !req.walletAddress) {
      res.status(401).json({ error: 'Unauthorized', code: 'WALLET_AUTH_REQUIRED' });
      return;
    }

    const orgAddress =
      (req.params.orgAddress as string | undefined) ??
      (req.body as Record<string, unknown>)?.orgAddress as string | undefined ??
      (req.query.orgAddress as string | undefined);

    if (!orgAddress) {
      res.status(400).json({ error: 'Missing orgAddress', code: 'ORG_ADDRESS_REQUIRED' });
      return;
    }

    try {
      const role = await orgMemberService.getRole(orgAddress, req.walletAddress);

      if (!role) {
        res.status(403).json({ error: 'Not a member of this organisation', code: 'NOT_A_MEMBER' });
        return;
      }

      if (!hasMinRole(role, minimumRole)) {
        res.status(403).json({
          error: `Requires ${minimumRole} role or higher`,
          code: 'INSUFFICIENT_ROLE',
          yourRole: role,
          requiredRole: minimumRole,
        });
        return;
      }

      req.orgRole = role;
      next();
    } catch {
      res.status(503).json({ error: 'Role check unavailable', code: 'ROLE_CHECK_FAILED' });
    }
  };
}
