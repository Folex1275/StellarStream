import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireWalletAuth } from '../middleware/requireWalletAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { orgMemberSyncService } from '../services/org-member-sync.service.js';

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────────────

const syncMembersSchema = z.object({
  members: z.array(
    z.object({
      memberAddress: z.string().min(56).startsWith('G'),
      role: z.enum(['DRAFTER', 'APPROVER', 'EXECUTOR']),
      tags: z.array(z.string()).optional(),
    }),
  ),
});

const addTagsSchema = z.object({
  memberAddress: z.string().min(56).startsWith('G'),
  tags: z.array(z.string().min(1).max(50)),
});

const removeTagsSchema = z.object({
  memberAddress: z.string().min(56).startsWith('G'),
  tags: z.array(z.string().min(1).max(50)),
});

// ── GET /api/v3/org/members
// List all members with tags. Requires DRAFTER role.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/org/members',
  requireWalletAuth,
  requireRole('DRAFTER'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgAddress = req.query.orgAddress as string;
      if (!orgAddress) {
        res.status(400).json({ error: 'Missing orgAddress query parameter' });
        return;
      }

      const members = await orgMemberSyncService.listMembersWithTags(orgAddress);
      res.json({ orgAddress, members, count: members.length });
    } catch (error) {
      res.status(500).json({ error: 'Failed to list members' });
    }
  },
);

// ── POST /api/v3/org/members
// Sync members with tagging. Only EXECUTORs may sync members.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/org/members',
  requireWalletAuth,
  requireRole('EXECUTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgAddress = req.query.orgAddress as string;
      if (!orgAddress) {
        res.status(400).json({ error: 'Missing orgAddress query parameter' });
        return;
      }

      const parsed = syncMembersSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
        return;
      }

      await orgMemberSyncService.syncMembers(orgAddress, parsed.data.members);
      res.status(201).json({
        orgAddress,
        synced: parsed.data.members.length,
        message: 'Members synced successfully',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to sync members' });
    }
  },
);

// ── POST /api/v3/org/members/tags
// Add tags to a member. Only EXECUTORs may manage tags.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/org/members/tags',
  requireWalletAuth,
  requireRole('EXECUTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgAddress = req.query.orgAddress as string;
      if (!orgAddress) {
        res.status(400).json({ error: 'Missing orgAddress query parameter' });
        return;
      }

      const parsed = addTagsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
        return;
      }

      await orgMemberSyncService.addTagsToMember(
        orgAddress,
        parsed.data.memberAddress,
        parsed.data.tags,
      );
      res.json({
        orgAddress,
        memberAddress: parsed.data.memberAddress,
        tags: parsed.data.tags,
        message: 'Tags added successfully',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add tags' });
    }
  },
);

// ── DELETE /api/v3/org/members/tags
// Remove tags from a member. Only EXECUTORs may manage tags.
// ─────────────────────────────────────────────────────────────────────────────
router.delete(
  '/org/members/tags',
  requireWalletAuth,
  requireRole('EXECUTOR'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgAddress = req.query.orgAddress as string;
      if (!orgAddress) {
        res.status(400).json({ error: 'Missing orgAddress query parameter' });
        return;
      }

      const parsed = removeTagsSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
        return;
      }

      await orgMemberSyncService.removeTagsFromMember(
        orgAddress,
        parsed.data.memberAddress,
        parsed.data.tags,
      );
      res.json({
        orgAddress,
        memberAddress: parsed.data.memberAddress,
        tags: parsed.data.tags,
        message: 'Tags removed successfully',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove tags' });
    }
  },
);

// ── GET /api/v3/org/members/by-tag/:tag
// Get members by tag. Requires DRAFTER role.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/org/members/by-tag/:tag',
  requireWalletAuth,
  requireRole('DRAFTER'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgAddress = req.query.orgAddress as string;
      const { tag } = req.params;

      if (!orgAddress) {
        res.status(400).json({ error: 'Missing orgAddress query parameter' });
        return;
      }

      const members = await orgMemberSyncService.getMembersByTag(orgAddress, tag);
      res.json({ orgAddress, tag, members, count: members.length });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get members by tag' });
    }
  },
);

// ── GET /api/v3/org/tags
// Get all tags in organization. Requires DRAFTER role.
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/org/tags',
  requireWalletAuth,
  requireRole('DRAFTER'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orgAddress = req.query.orgAddress as string;
      if (!orgAddress) {
        res.status(400).json({ error: 'Missing orgAddress query parameter' });
        return;
      }

      const tags = await orgMemberSyncService.getOrgTags(orgAddress);
      res.json({ orgAddress, tags, count: tags.length });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get organization tags' });
    }
  },
);

export default router;
