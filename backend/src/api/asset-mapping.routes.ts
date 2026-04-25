import { Router, Request, Response } from "express";
import { AssetMappingService } from "../services/asset-mapping.service.js";

const router = Router();
const svc = new AssetMappingService();

/** GET /api/v2/asset-mapping?symbol=USDC  — list all (or filter by symbol) */
router.get("/", async (req: Request, res: Response) => {
  const symbol = typeof req.query.symbol === "string" ? req.query.symbol : undefined;
  const mappings = await svc.list(symbol);
  res.json({ success: true, mappings });
});

/** GET /api/v2/asset-mapping/:stellarAssetId  — single lookup */
router.get("/:stellarAssetId", async (req: Request, res: Response) => {
  const mapping = await svc.getByAssetId(req.params.stellarAssetId);
  if (!mapping) {
    res.status(404).json({ error: "Asset mapping not found" });
    return;
  }
  res.json({ success: true, mapping });
});

export default router;
