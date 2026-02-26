// API routes and controllers
// REST API endpoints for querying stream data

import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/client/index.js';
import { calculateUsdValue } from '../services/index.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/streams:
 *   get:
 *     summary: Get all streams
 *     description: Retrieve all payment streams with USD values
 *     tags:
 *       - Streams
 *     responses:
 *       200:
 *         description: List of streams with USD values
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 streams:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Stream ID
 *                       sender:
 *                         type: string
 *                         description: Sender address
 *                       receiver:
 *                         type: string
 *                         description: Receiver address
 *                       tokenAddress:
 *                         type: string
 *                         description: Token contract address
 *                       amountPerSecond:
 *                         type: string
 *                         description: Amount streamed per second
 *                       totalAmount:
 *                         type: string
 *                         description: Total stream amount
 *                       status:
 *                         type: string
 *                         description: Stream status
 *                       estimatedUsdValue:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           value:
 *                             type: string
 *                             description: USD value
 *                           timestamp:
 *                             type: string
 *                             description: Price timestamp
 *                           stale:
 *                             type: boolean
 *                             description: Whether price is stale
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
router.get('/streams', async (_req: Request, res: Response) => {
  try {
    const streams = await prisma.stream.findMany({
      orderBy: { id: 'desc' },
    });

    // Enrich streams with USD values
    const enrichedStreams = await Promise.all(
      streams.map(async (stream) => {
        const estimatedUsdValue = await calculateUsdValue(
          stream.tokenAddress,
          stream.totalAmount
        );

        return {
          id: stream.id,
          sender: stream.sender,
          receiver: stream.receiver,
          tokenAddress: stream.tokenAddress,
          amountPerSecond: stream.amountPerSecond.toString(),
          totalAmount: stream.totalAmount.toString(),
          status: stream.status,
          estimatedUsdValue,
        };
      })
    );

    res.json({ streams: enrichedStreams });
  } catch (error) {
    console.error('Error fetching streams:', error);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

/**
 * @swagger
 * /api/streams/{id}:
 *   get:
 *     summary: Get stream by ID
 *     description: Retrieve a specific payment stream by its ID with USD value
 *     tags:
 *       - Streams
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stream ID
 *     responses:
 *       200:
 *         description: Stream details with USD value
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 sender:
 *                   type: string
 *                 receiver:
 *                   type: string
 *                 tokenAddress:
 *                   type: string
 *                 amountPerSecond:
 *                   type: string
 *                 totalAmount:
 *                   type: string
 *                 status:
 *                   type: string
 *                 estimatedUsdValue:
 *                   type: object
 *                   nullable: true
 *       404:
 *         description: Stream not found
 *       500:
 *         description: Server error
 */
router.get('/streams/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stream = await prisma.stream.findUnique({
      where: { id },
    });

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const estimatedUsdValue = await calculateUsdValue(
      stream.tokenAddress,
      stream.totalAmount
    );

    const enrichedStream = {
      id: stream.id,
      sender: stream.sender,
      receiver: stream.receiver,
      tokenAddress: stream.tokenAddress,
      amountPerSecond: stream.amountPerSecond.toString(),
      totalAmount: stream.totalAmount.toString(),
      status: stream.status,
      estimatedUsdValue,
    };

    res.json(enrichedStream);
  } catch (error) {
    console.error('Error fetching stream:', error);
    res.status(500).json({ error: 'Failed to fetch stream' });
  }
});

/**
 * @swagger
 * /api/streams/sender/{address}:
 *   get:
 *     summary: Get streams by sender
 *     description: Retrieve all payment streams for a specific sender address
 *     tags:
 *       - Streams
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Sender wallet address
 *         example: GABC123...
 *     responses:
 *       200:
 *         description: List of streams for the sender
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 streams:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/streams/sender/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const streams = await prisma.stream.findMany({
      where: { sender: address },
      orderBy: { id: 'desc' },
    });

    const enrichedStreams = await Promise.all(
      streams.map(async (stream) => {
        const estimatedUsdValue = await calculateUsdValue(
          stream.tokenAddress,
          stream.totalAmount
        );

        return {
          id: stream.id,
          sender: stream.sender,
          receiver: stream.receiver,
          tokenAddress: stream.tokenAddress,
          amountPerSecond: stream.amountPerSecond.toString(),
          totalAmount: stream.totalAmount.toString(),
          status: stream.status,
          estimatedUsdValue,
        };
      })
    );

    res.json({ streams: enrichedStreams });
  } catch (error) {
    console.error('Error fetching sender streams:', error);
    res.status(500).json({ error: 'Failed to fetch sender streams' });
  }
});

/**
 * GET /api/streams/receiver/:address
 * Get all streams for a receiver with USD values
 */
router.get('/streams/receiver/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const streams = await prisma.stream.findMany({
      where: { receiver: address },
      orderBy: { id: 'desc' },
    });

    const enrichedStreams = await Promise.all(
      streams.map(async (stream) => {
        const estimatedUsdValue = await calculateUsdValue(
          stream.tokenAddress,
          stream.totalAmount
        );

        return {
          id: stream.id,
          sender: stream.sender,
          receiver: stream.receiver,
          tokenAddress: stream.tokenAddress,
          amountPerSecond: stream.amountPerSecond.toString(),
          totalAmount: stream.totalAmount.toString(),
          status: stream.status,
          estimatedUsdValue,
        };
      })
    );

    res.json({ streams: enrichedStreams });
  } catch (error) {
    console.error('Error fetching receiver streams:', error);
    res.status(500).json({ error: 'Failed to fetch receiver streams' });
  }
});

export default router;
