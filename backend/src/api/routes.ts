import { Router, Request, Response } from "express";
import { BatchMetadataService } from "../services/batch-metadata.service.js";
import { getStreamGraph } from "../services/stream-graph.service.js";
import { prisma } from "../lib/db.js";

/**
 * Maximum number of stream IDs allowed in a single batch request.
 * Prevents abuse and keeps response times predictable.
 */
const MAX_BATCH_SIZE = 200;

/**
 * Creates an Express Router with the batch metadata endpoint.
 *
 * @param batchService - Optional injected service (defaults to production instance).
 *                       Pass a custom instance in tests to point at a test DB file.
 */
export function createBatchRoutes(
    batchService: BatchMetadataService = new BatchMetadataService(),
): Router {
    const router = Router();

    /**
     * POST /api/v1/streams/metadata/batch
     *
     * Accept an array of Stream IDs and return all their current
     * balances and statuses in a single response.
     *
     * Request body:
     *   { "streamIds": ["id1", "id2", ...] }
     *
     * Response:
     *   {
     *     "results": [ { stream_id, status, sender, receiver, ... } ],
     *     "errors":  [ { stream_id, error } ]
     *   }
     */
    router.post(
        "/api/v1/streams/metadata/batch",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const { streamIds } = req.body as { streamIds?: unknown };

                // ── Validation ────────────────────────────────────────────
                if (!Array.isArray(streamIds)) {
                    res.status(400).json({
                        error:
                            "Invalid request body: 'streamIds' must be an array of strings.",
                    });
                    return;
                }

                if (streamIds.length === 0) {
                    res.status(400).json({
                        error: "'streamIds' array must not be empty.",
                    });
                    return;
                }

                if (streamIds.length > MAX_BATCH_SIZE) {
                    res.status(400).json({
                        error: `Batch size exceeds the maximum of ${MAX_BATCH_SIZE}. Received ${streamIds.length}.`,
                    });
                    return;
                }

                const invalidIds = streamIds.filter(
                    (id: unknown) => typeof id !== "string" || id.trim().length === 0,
                );
                if (invalidIds.length > 0) {
                    res.status(400).json({
                        error:
                            "All entries in 'streamIds' must be non-empty strings.",
                    });
                    return;
                }

                // ── Service call ──────────────────────────────────────────
                const response = await batchService.getStreamMetadataBatch(
                    streamIds as string[],
                );
                res.status(200).json(response);
            } catch (err) {
                console.error("[BatchMetadata] Unexpected error:", err);
                res.status(500).json({ error: "Internal server error" });
            }
        },
    );

    /**
     * GET /api/v1/streams/:id/graph
     *
     * Returns 20 data points of unlocked amount over the stream's duration
     * for the Stream Flow visualizer. projectedYield is null until vault association exists.
     */
    router.get(
        "/api/v1/streams/:id/graph",
        async (req: Request, res: Response): Promise<void> => {
            try {
                const id = req.params.id?.trim();
                if (!id) {
                    res.status(400).json({
                        error: "Stream ID is required.",
                    });
                    return;
                }
                const result = await getStreamGraph(id, batchService, prisma);
                if (result === null) {
                    res.status(404).json({
                        error: "Stream not found.",
                    });
                    return;
                }
                res.status(200).json(result);
            } catch (err) {
                console.error("[StreamGraph] Unexpected error:", err);
                res.status(500).json({ error: "Internal server error" });
            }
        },
    );

    return router;
}

// Default export for production usage
export default createBatchRoutes();
