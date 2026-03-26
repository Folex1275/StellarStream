import { Router, Request, Response } from "express";
import { PriceService } from "../../services/price.service.js";
import { logger } from "../../logger.js";

const router = Router();
const priceService = new PriceService();

/**
 * GET /api/v2/prices/:assetAddress
 * Get current price for an asset
 */
router.get("/:assetAddress", async (req: Request, res: Response) => {
  try {
    const { assetAddress } = req.params;

    if (!assetAddress) {
      res.status(400).json({
        success: false,
        error: "Asset address is required",
      });
      return;
    }

    const priceUsd = await priceService.getCachedPrice(assetAddress);

    res.json({
      success: true,
      assetAddress,
      priceUsd,
    });
  } catch (error) {
    logger.error("Failed to get price", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve price",
    });
  }
});

/**
 * POST /api/v2/prices/update
 * Trigger price update for all assets (admin only)
 */
router.post("/update", async (req: Request, res: Response) => {
  try {
    // TODO: Add admin auth check
    await priceService.updateAllPrices();

    res.json({
      success: true,
      message: "Prices updated successfully",
    });
  } catch (error) {
    logger.error("Failed to update prices", error);
    res.status(500).json({
      success: false,
      error: "Failed to update prices",
    });
  }
});

export default router;
