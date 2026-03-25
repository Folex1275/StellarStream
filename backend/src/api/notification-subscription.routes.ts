/**
 * Notification Subscription Routes
 *
 * POST /api/v1/notifications/subscribe   — register a Discord/Telegram subscription
 * DELETE /api/v1/notifications/unsubscribe — remove a subscription
 * GET  /api/v1/notifications/:address    — list subscriptions for an address
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '../generated/client/index.js';
import { logger } from '../logger.js';

const router = Router();
const prisma = new PrismaClient();

// ── Validation schemas ────────────────────────────────────────────────────────

const subscribeSchema = z.object({
  stellarAddress: z.string().min(1),
  platform: z.enum(['discord', 'telegram']),
  webhookUrl: z.string().url().optional(),
  chatId: z.string().optional(),
}).refine(
  (d: { platform: string; webhookUrl?: string; chatId?: string }) =>
    d.platform === 'discord' ? !!d.webhookUrl : !!d.chatId,
  { message: 'discord requires webhookUrl; telegram requires chatId' }
);

const unsubscribeSchema = z.object({
  stellarAddress: z.string().min(1),
  platform: z.enum(['discord', 'telegram']),
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /notifications/subscribe:
 *   post:
 *     summary: Subscribe to stream notifications
 *     description: Register a Stellar address to receive "Stream Received" alerts via Discord or Telegram.
 *     tags:
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stellarAddress, platform]
 *             properties:
 *               stellarAddress:
 *                 type: string
 *                 example: GDEF...UVW
 *               platform:
 *                 type: string
 *                 enum: [discord, telegram]
 *               webhookUrl:
 *                 type: string
 *                 description: Required when platform is discord
 *               chatId:
 *                 type: string
 *                 description: Required when platform is telegram
 *     responses:
 *       201:
 *         description: Subscription created or updated
 *       400:
 *         description: Validation error
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const { stellarAddress, platform, webhookUrl, chatId } = parsed.data;

  try {
    const sub = await (prisma as any).notificationSubscription.upsert({
      where: { stellarAddress_platform: { stellarAddress, platform } },
      update: { webhookUrl, chatId, isActive: true },
      create: { stellarAddress, platform, webhookUrl, chatId },
    });

    logger.info('[Notification] Subscription saved', { stellarAddress, platform });
    res.status(201).json({ success: true, data: sub });
  } catch (err) {
    logger.error('[Notification] Subscribe failed', { err });
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

/**
 * @openapi
 * /notifications/unsubscribe:
 *   delete:
 *     summary: Unsubscribe from stream notifications
 *     tags:
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stellarAddress, platform]
 *             properties:
 *               stellarAddress:
 *                 type: string
 *               platform:
 *                 type: string
 *                 enum: [discord, telegram]
 *     responses:
 *       200:
 *         description: Unsubscribed successfully
 *       404:
 *         description: Subscription not found
 */
router.delete('/unsubscribe', async (req: Request, res: Response) => {
  const parsed = unsubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const { stellarAddress, platform } = parsed.data;

  try {
    await (prisma as any).notificationSubscription.update({
      where: { stellarAddress_platform: { stellarAddress, platform } },
      data:  { isActive: false },
    });

    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Subscription not found' });
  }
});

/**
 * @openapi
 * /notifications/{address}:
 *   get:
 *     summary: List subscriptions for a Stellar address
 *     tags:
 *       - Notifications
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of active subscriptions
 */
router.get('/:address', async (req: Request, res: Response) => {
  const { address } = req.params;
  try {
    const subs = await (prisma as any).notificationSubscription.findMany({
      where: { stellarAddress: address, isActive: true },
      select: { id: true, platform: true, isActive: true, createdAt: true },
    });
    res.json({ success: true, data: subs });
  } catch (err) {
    logger.error('[Notification] List failed', { err });
    res.status(500).json({ error: 'Failed to retrieve subscriptions' });
  }
});

export default router;
