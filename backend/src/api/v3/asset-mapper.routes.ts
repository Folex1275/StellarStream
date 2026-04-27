import { Router, Request, Response } from "express";
import { z } from "zod";
import { AssetMapperService } from "../../services/asset-mapper.service.js";
import validateRequest from "../../middleware/validateRequest.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { logger } from "../../logger.js";

const router = Router();
const assetMapperService = new AssetMapperService();

const assetQuerySchema = z.object({
  asset: z.string().optional(),
  chain: z.string().optional(),
});

/**
 * GET /api/v3/assets/mappings
 *
 * Returns metadata for bridged assets mapping Stellar assets to their
 * counterparts on other chains (Ethereum, Solana, Polygon, etc.).
 *
 * Query parameters:
 * - asset: Filter by specific Stellar asset
 * - chain: Filter by specific destination chain
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     [stellarAsset]: {
 *       stellarAsset: string,
 *       stellarContractId?: string,
 *       chains: {
 *         [chainName]: {
 *           contractAddress: string,
 *           decimals: number,
 *           symbol: string
 *         }
 *       }
 *     }
 *   }
 * }
 */
router.get(
  "/mappings",
  validateRequest({ query: assetQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { asset, chain } = req.query as { asset?: string; chain?: string };

    try {
      let mappings = assetMapperService.getAssetMappings();

      // Filter by specific asset if provided
      if (asset) {
        const assetMapping = assetMapperService.getAssetMapping(asset);
        if (!assetMapping) {
          return res.status(404).json({
            success: false,
            error: `Asset mapping not found for ${asset}`,
          });
        }
        mappings = { [asset]: assetMapping };
      }

      // Filter by chain if provided
      if (chain) {
        const filtered: typeof mappings = {};
        for (const [key, value] of Object.entries(mappings)) {
          if (value.chains[chain]) {
            filtered[key] = value;
          }
        }
        mappings = filtered;
      }

      return res.json({
        success: true,
        data: mappings,
      });
    } catch (error) {
      logger.error("Failed to fetch asset mappings:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch asset mappings",
      });
    }
  })
);

/**
 * GET /api/v3/assets/:asset/chains
 *
 * Get all available chains for a specific Stellar asset.
 */
router.get(
  "/:asset/chains",
  asyncHandler(async (req: Request, res: Response) => {
    const { asset } = req.params;

    try {
      const chains = assetMapperService.getAvailableChains(asset);

      if (chains.length === 0) {
        return res.status(404).json({
          success: false,
          error: `No chain mappings found for asset ${asset}`,
        });
      }

      return res.json({
        success: true,
        data: {
          asset,
          availableChains: chains,
        },
      });
    } catch (error) {
      logger.error("Failed to fetch available chains:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch available chains",
      });
    }
  })
);

/**
 * GET /api/v3/assets/:asset/flow-info
 *
 * Get cross-chain flow information for an asset.
 */
router.get(
  "/:asset/flow-info",
  asyncHandler(async (req: Request, res: Response) => {
    const { asset } = req.params;

    try {
      const flowInfo = assetMapperService.getCrossChainFlowInfo(asset);

      if (!flowInfo) {
        return res.status(404).json({
          success: false,
          error: `Flow information not found for asset ${asset}`,
        });
      }

      return res.json({
        success: true,
        data: flowInfo,
      });
    } catch (error) {
      logger.error("Failed to fetch flow information:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch flow information",
      });
    }
  })
);

export default router;
