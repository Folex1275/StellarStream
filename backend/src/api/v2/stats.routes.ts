import { Router, Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { prisma } from "../../lib/db.js";

const router = Router();

/**
 * GET /api/v2/stats/protocol
 * Returns real-time protocol-wide volume metrics.
 */
router.get(
    "/protocol",
    asyncHandler(async (_req: Request, res: Response) => {
        const streams = await prisma.stream.findMany({
            select: { amount: true, withdrawn: true, status: true }
        });

        let totalVolume = 0n;
        let totalWithdrawn = 0n;
        let activeStreamsCount = 0;

        for (const s of streams) {
            totalVolume += BigInt(s.amount || '0');
            totalWithdrawn += BigInt(s.withdrawn || '0');
            if (s.status === "ACTIVE") {
                activeStreamsCount++;
            }
        }

        res.json({
            totalVolume: totalVolume.toString(),
            totalWithdrawn: totalWithdrawn.toString(),
            activeStreamsCount
        });
    })
);

export default router;
