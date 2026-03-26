import { Router, Request, Response } from "express";
import { AssetMetadataService } from "../../services/asset-metadata.service.js";
import { logger } from "../../logger.js";

const router = Router();
const assetService = new AssetMetadataService();

/**
 * GET /api/v2/assets/:tokenAddress
 * Get asset metadata (name, icon, decimals, etc.)
 */
router.get("/:tokenAddress", async (req: Request, res: Response) => {
  try {
    const { tokenAddress } = req.params;

    if (!tokenAddress) {
      res.status(400).json({
        success: false,
        error: "Token address is required",
      });
      return;
    }

    const metadata = await assetService.getAssetMetadata(tokenAddress);

    if (!metadata) {
      res.status(404).json({
        success: false,
        error: "Asset metadata not found",
      });
      return;
    }

    res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    logger.error("Failed to get asset metadata", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve asset metadata",
    });
  }
});

/**
 * POST /api/v2/assets/:tokenAddress/discover
 * Trigger discovery of asset metadata from stellar.toml
 */
router.post("/:tokenAddress/discover", async (req: Request, res: Response) => {
  try {
    const { tokenAddress } = req.params;

    if (!tokenAddress) {
      res.status(400).json({
        success: false,
        error: "Token address is required",
      });
      return;
    }

    await assetService.discoverAsset(tokenAddress);

    const metadata = await assetService.getAssetMetadata(tokenAddress);

    res.json({
      success: true,
      data: metadata,
      message: "Asset discovery completed",
    });
  } catch (error) {
    logger.error("Failed to discover asset", error);
    res.status(500).json({
      success: false,
      error: "Failed to discover asset metadata",
    });
  }
});

/**
 * POST /api/v2/assets/discover-all
 * Trigger discovery for all new assets (admin only)
 */
router.post("/discover-all", async (req: Request, res: Response) => {
  try {
    // TODO: Add admin auth check
    await assetService.discoverNewAssets();

    res.json({
      success: true,
      message: "Asset discovery batch completed",
    });
  } catch (error) {
    logger.error("Failed to discover new assets", error);
    res.status(500).json({
      success: false,
      error: "Failed to discover new assets",
    });
  }
});

export default router;
