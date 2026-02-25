// API routes and controllers
// REST API endpoints for querying stream data

import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/client/index.js';
import { calculateUsdValue } from '../services/index.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/streams
 * Get all streams with USD values
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
 * GET /api/streams/:id
 * Get a specific stream by ID with USD value
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
 * GET /api/streams/sender/:address
 * Get all streams for a sender with USD values
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
