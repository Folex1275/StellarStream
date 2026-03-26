import { Router, Request, Response } from "express";
import { z } from "zod";
import asyncHandler from "../../../utils/asyncHandler.js";
import { requireAdmin } from "../../../middleware/requireAdmin.js";
import { AssetConfigService } from "../../../services/asset-config.service.js";

const router = Router();
const assetService = new AssetConfigService();

// All routes in this file require admin auth
router.use(requireAdmin);

// ── Validation schemas ────────────────────────────────────────────────────────

const createAssetSchema = z.object({
  assetId: z.string().min(1),
  symbol: z.string().min(1).max(12),
  name: z.string().min(1).max(64),
  decimals: z.number().int().min(0).max(18).optional(),
  isVerified: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  yieldEnabled: z.boolean().optional(),
  iconUrl: z.string().url().optional(),
});

const updateAssetSchema = z.object({
  symbol: z.string().min(1).max(12).optional(),
  name: z.string().min(1).max(64).optional(),
  decimals: z.number().int().min(0).max(18).optional(),
  isVerified: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  yieldEnabled: z.boolean().optional(),
  iconUrl: z.string().url().nullable().optional(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/v2/admin/assets
 * List all whitelisted assets (admin view, includes hidden).
 */
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const assets = await assetService.listAssets(false);
    res.json({ success: true, data: assets });
  }),
);

/**
 * GET /api/v2/admin/assets/:assetId
 * Get a single asset config.
 */
router.get(
  "/:assetId",
  asyncHandler(async (req: Request, res: Response) => {
    const asset = await assetService.getAsset(req.params.assetId);
    if (!asset) {
      res.status(404).json({ success: false, error: "Asset not found", code: "ASSET_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: asset });
  }),
);

/**
 * POST /api/v2/admin/assets
 * Add a new asset to the whitelist.
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = createAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid request body",
        code: "VALIDATION_ERROR",
        details: parsed.error.flatten(),
      });
      return;
    }

    try {
      const asset = await assetService.createAsset(parsed.data);
      res.status(201).json({ success: true, data: asset });
    } catch (err: unknown) {
      // Unique constraint violation (assetId already exists)
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        res.status(409).json({ success: false, error: "Asset already exists", code: "ASSET_CONFLICT" });
        return;
      }
      throw err;
    }
  }),
);

/**
 * PUT /api/v2/admin/assets/:assetId
 * Update an asset's configuration (including toggling yieldEnabled).
 */
router.put(
  "/:assetId",
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Invalid request body",
        code: "VALIDATION_ERROR",
        details: parsed.error.flatten(),
      });
      return;
    }

    const updated = await assetService.updateAsset(req.params.assetId, parsed.data);
    if (!updated) {
      res.status(404).json({ success: false, error: "Asset not found", code: "ASSET_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: updated });
  }),
);

/**
 * DELETE /api/v2/admin/assets/:assetId
 * Remove an asset from the whitelist.
 */
router.delete(
  "/:assetId",
  asyncHandler(async (req: Request, res: Response) => {
    const deleted = await assetService.deleteAsset(req.params.assetId);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Asset not found", code: "ASSET_NOT_FOUND" });
      return;
    }
    res.json({ success: true, data: { deleted: true, assetId: req.params.assetId } });
  }),
);

export default router;
