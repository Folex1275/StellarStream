/**
 * Protocol statistics routes
 * Provides protocol-wide metrics like TVL
 */

import { Router, Request, Response } from 'express';
import { getProtocolStats } from '../services/protocol-stats.service.js';
import { logger } from '../logger.js';

const router = Router();

/**
 * @swagger
 * /api/v1/protocol/stats:
 *   get:
 *     summary: Get protocol statistics
 *     description: Retrieve protocol-wide statistics including Total Value Locked (TVL). Results are cached for 60 seconds for optimal performance.
 *     tags:
 *       - Protocol
 *     responses:
 *       200:
 *         description: Protocol statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalValueLocked:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: string
 *                       description: Total USD value locked across all active streams
 *                       example: "125000.50"
 *                     byToken:
 *                       type: object
 *                       description: TVL breakdown by token address
 *                       additionalProperties:
 *                         type: string
 *                       example:
 *                         "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC": "100000.00"
 *                         "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75": "25000.50"
 *                 activeStreamsCount:
 *                   type: integer
 *                   description: Number of active streams
 *                   example: 42
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: When these stats were calculated
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getProtocolStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching protocol stats', { error });
    res.status(500).json({ error: 'Failed to fetch protocol statistics' });
  }
});

export default router;
