import { Router, Request, Response } from "express";
import { z } from "zod";
import asyncHandler from "../../utils/asyncHandler.js";
import { StreamService } from "../../services/stream.service.js";
import stellarAddressSchema from "../../validation/stellar.js";

const router = Router();
const streamService = new StreamService();

const getStreamsParamsSchema = z.object({
    address: stellarAddressSchema,
});

/**
 * GET /api/v2/streams/:address
 * Fetches V1 and V2 streams for a user, sorted by status.
 * Returns { success: true, data: { v1: [...], v2: [...] } } via middleware.
 */
router.get(
    "/:address",
    asyncHandler(async (req: Request, res: Response) => {
        // Validate address
        const parseResult = getStreamsParamsSchema.safeParse(req.params);
        if (!parseResult.success) {
            res.status(400).json({ error: "Invalid address format" });
            return;
        }
        const { address } = parseResult.data;

        // Fetch all current streams (assume all are v1 for now)
        const streams = await streamService.getStreamsForAddress(address);

        // Sort by status
        const statusOrder = { ACTIVE: 1, PAUSED: 2, COMPLETED: 3, CANCELED: 4 };
        streams.sort((a, b) => {
            const aRank = statusOrder[a.status as keyof typeof statusOrder] || 10;
            const bRank = statusOrder[b.status as keyof typeof statusOrder] || 10;
            return aRank - bRank;
        });

        // Provide empty array for v2 as placeholder for future Nebula features
        res.json({
            v1: streams,
            v2: []
        });
    })
);

export default router;
