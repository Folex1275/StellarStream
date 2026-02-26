import { Request, Response } from 'express';
import { prisma } from '../lib/db.js';
import type { Prisma } from '../generated/client/client.js';

const MAX_SEARCH_LIMIT = 50;

/**
 * GET /stats - Aggregate stream statistics (rate-limited).
 */
export async function getStats(_req: Request, res: Response): Promise<void> {
  try {
    const [totalStreams, bySenderCount, byReceiverCount] = await Promise.all([
      prisma.stream.count(),
      prisma.stream.groupBy({
        by: ['sender'],
        _count: { id: true },
      }),
      prisma.stream.groupBy({
        by: ['receiver'],
        _count: { id: true },
      }),
    ]);

    const uniqueSenders = bySenderCount.length;
    const uniqueReceivers = byReceiverCount.length;

    res.json({
      totalStreams,
      uniqueSenders,
      uniqueReceivers,
    });
  } catch (err) {
    console.error('[GET /stats]', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to compute stats.',
    });
  }
}

/**
 * GET /search - Search streams with optional filters (rate-limited).
 * Query params: q (search in id, sender, receiver), sender, receiver, limit (cap 50), offset.
 */
export async function getSearch(req: Request, res: Response): Promise<void> {
  try {
    const rawLimit = req.query.limit;
    const limit = Math.min(
      Math.max(1, parseInt(String(rawLimit), 10) || 20),
      MAX_SEARCH_LIMIT
    );
    const offset = Math.max(0, parseInt(String(req.query.offset), 10) || 0);
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const sender = typeof req.query.sender === 'string' ? req.query.sender.trim() : '';
    const receiver = typeof req.query.receiver === 'string' ? req.query.receiver.trim() : '';

    const where: Prisma.StreamWhereInput = {};

    if (sender) {
      where.sender = { contains: sender };
    }
    if (receiver) {
      where.receiver = { contains: receiver };
    }
    if (q) {
      where.OR = [
        { id: { contains: q } },
        { sender: { contains: q } },
        { receiver: { contains: q } },
      ];
    }

    const [streams, total] = await Promise.all([
      prisma.stream.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { id: 'desc' },
      }),
      prisma.stream.count({ where }),
    ]);

    res.json({
      streams,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error('[GET /search]', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Search failed.',
    });
  }
}
