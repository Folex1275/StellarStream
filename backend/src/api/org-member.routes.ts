import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireWalletAuth } from '../middleware/requireWalletAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { OrgMemberService } from '../services/org-member.service.js';

const router = Router();
const service = new OrgMemberService();

// ── Validation schemas ────────────────────────────────────────────────────────

const upsertSchema = z.object({
  memberAddress: z.string().min(56).startsWith('G'),
  role: z.enum(['DRAFTER', 'APPROVER', 'EXECUTOR']),
});

const removeSchema = z.object({
  memberAddress: z.string().min(56).startsWith('G'),
});

// ── GET /api/v1/orgs/:orgAddress/role
// Resolve the caller's role in an org (used by the frontend useRole hook).
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/orgs/:orgAddress/role',
  requireWalletAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { orgAddress } = req.params;
    const role = await service.getRole(orgAddress, req.walletAddress!).catch(() => null);
    if (!role) {
      res.status(404).json({ error: 'Not a member', code: 'NOT_A_MEMBER' });
      return;
    }
    res.json({ orgAddress, memberAddress: req.walletAddress, role });
  },
);

// ── GET /api/v1/orgs/:orgAddress/members
// List all active members. Requires at least DRAFTER.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/orgs/:orgAddress/members',
  requireWalletAuth,
  requireRole('DRAFTER'),
  async (req: Request, res: Response): Promise<void> => {
    const { orgAddress } = req.params;
    try {
      const members = await service.listMembers(orgAddress);
      res.json({ orgAddress, members });
    } catch {
      res.status(500).json({ error: 'Failed to list members' });
    }
  },
);

// ── POST /api/v1/orgs/:orgAddress/members
// Add or update a member's role. Only EXECUTORs may manage membership.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/orgs/:orgAddress/members',
  requireWalletAuth,
  requireRole('EXECUTOR'),
  async (req: Request, res: Response): Promise<void> => {
    const { orgAddress } = req.params;
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      return;
    }
    const { memberAddress, role } = parsed.data;
    try {
      await service.upsertMember(orgAddress, memberAddress, role, req.walletAddress!);
      res.status(201).json({ orgAddress, memberAddress, role });
    } catch {
      res.status(500).json({ error: 'Failed to upsert member' });
    }
  },
);

// ── DELETE /api/v1/orgs/:orgAddress/members
// Remove (deactivate) a member. Only EXECUTORs may remove members.
// ─────────────────────────────────────────────────────────────────────────────
router.delete(
  '/orgs/:orgAddress/members',
  requireWalletAuth,
  requireRole('EXECUTOR'),
  async (req: Request, res: Response): Promise<void> => {
    const { orgAddress } = req.params;
    const parsed = removeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
      return;
    }
    const { memberAddress } = parsed.data;
    try {
      await service.removeMember(orgAddress, memberAddress);
      res.json({ orgAddress, memberAddress, status: 'removed' });
    } catch {
      res.status(500).json({ error: 'Failed to remove member' });
    }
  },
);

// ── Example: role-gated split endpoints ──────────────────────────────────────
// These stubs show how requireRole plugs into split lifecycle routes.

/**
 * POST /api/v1/orgs/:orgAddress/splits/draft
 * Create a draft split. Requires DRAFTER role.
 */
router.post(
  '/orgs/:orgAddress/splits/draft',
  requireWalletAuth,
  requireRole('DRAFTER'),
  (_req: Request, res: Response) => {
    // TODO: wire to split draft service
    res.status(501).json({ message: 'Draft split — not yet implemented' });
  },
);

/**
 * POST /api/v1/orgs/:orgAddress/splits/:splitId/approve
 * Approve a pending split. Requires APPROVER role.
 */
router.post(
  '/orgs/:orgAddress/splits/:splitId/approve',
  requireWalletAuth,
  requireRole('APPROVER'),
  (_req: Request, res: Response) => {
    // TODO: wire to split approval service
    res.status(501).json({ message: 'Approve split — not yet implemented' });
  },
);

/**
 * POST /api/v1/orgs/:orgAddress/splits/:splitId/execute
 * Submit an approved split to the ledger. Requires EXECUTOR role.
 */
router.post(
  '/orgs/:orgAddress/splits/:splitId/execute',
  requireWalletAuth,
  requireRole('EXECUTOR'),
  (_req: Request, res: Response) => {
    // TODO: wire to on-chain execution service
    res.status(501).json({ message: 'Execute split — not yet implemented' });
  },
);

export default router;
