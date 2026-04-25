import { Router, Request, Response } from "express";
import { TrustScoreService } from "../../services/trust-score.service.js";

const router = Router();
const trustScoreService = new TrustScoreService();

router.get("/org/:id/trust-profile", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Organization ID is required" });
      return;
    }

    const profile = await trustScoreService.calculateTrustScore(id);

    if (!profile) {
      res.status(500).json({ error: "Failed to calculate trust score" });
      return;
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching trust profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
