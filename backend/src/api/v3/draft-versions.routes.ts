import { Router, Request, Response } from "express";
import { z } from "zod";
import asyncHandler from "../../utils/asyncHandler.js";
import { DisbursementDraftService } from "../../services/disbursement-draft.service.js";

const router = Router();
const draftService = new DisbursementDraftService();

const recipientSchema = z.object({
  address: z.string().trim().min(1),
  amount: z.string().regex(/^\d+$/),
});

const createDraftSchema = z.object({
  senderAddress: z.string().startsWith("G").min(56),
  name: z.string().trim().max(255).optional(),
  asset: z.string().trim().min(1),
  recipients: z.array(recipientSchema).min(1).max(1000),
  changedBy: z.string().startsWith("G").min(56),
});

const updateDraftSchema = z.object({
  recipients: z.array(recipientSchema).min(1).max(1000),
  changeNote: z.string().trim().max(500).optional(),
  changedBy: z.string().startsWith("G").min(56),
});

const restoreSchema = z.object({
  version: z.number().int().min(1),
  changedBy: z.string().startsWith("G").min(56),
});

router.post(
  "/drafts",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = createDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }

    const draft = await draftService.createDraft(parsed.data);
    res.status(201).json({ success: true, data: draft });
  }),
);

router.get(
  "/drafts",
  asyncHandler(async (req: Request, res: Response) => {
    const sender = req.query.sender as string;
    if (!sender) {
      res.status(400).json({ success: false, error: "sender query parameter required" });
      return;
    }

    const limit = Math.min(Number.parseInt(req.query.limit as string, 10) || 20, 100);
    const drafts = await draftService.listDrafts(sender, limit);
    res.json({ success: true, data: drafts, count: drafts.length });
  }),
);

router.get(
  "/drafts/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const draft = await draftService.getDraft(req.params.id);
    if (!draft) {
      res.status(404).json({ success: false, error: "Draft not found" });
      return;
    }

    res.json({ success: true, data: draft });
  }),
);

router.get(
  "/drafts/:id/versions/:version",
  asyncHandler(async (req: Request, res: Response) => {
    const version = Number.parseInt(req.params.version, 10);
    if (Number.isNaN(version)) {
      res.status(400).json({ success: false, error: "Invalid version number" });
      return;
    }

    const versionRecord = await draftService.getVersion(req.params.id, version);
    if (!versionRecord) {
      res.status(404).json({ success: false, error: "Version not found" });
      return;
    }

    res.json({ success: true, data: versionRecord });
  }),
);

router.post(
  "/drafts/:id/versions",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateDraftSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }

    try {
      const draft = await draftService.saveNewVersion(req.params.id, parsed.data);
      res.status(201).json({ success: true, data: draft });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ success: false, error: message });
    }
  }),
);

router.post(
  "/drafts/:id/restore",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = restoreSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }

    try {
      const draft = await draftService.restoreVersion(req.params.id, parsed.data.version, parsed.data.changedBy);
      res.json({ success: true, data: draft, message: `Restored from version ${parsed.data.version}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ success: false, error: message });
    }
  }),
);

router.delete(
  "/drafts/:id",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      await draftService.deleteDraft(req.params.id);
      res.json({ success: true, message: "Draft deleted" });
    } catch {
      res.status(404).json({ success: false, error: "Draft not found" });
    }
  }),
);

export default router;
