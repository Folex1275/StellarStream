import { Router, Request, Response } from "express";
import { z } from "zod";
import asyncHandler from "../../utils/asyncHandler.js";
import { WebhookDispatcherService } from "../../services/webhook-dispatcher.service.js";

const router = Router();
const webhookService = new WebhookDispatcherService();

const registerWebhookSchema = z.object({
  url: z.string().url(),
  eventType: z.string().trim().min(1).default("split.completed"),
  description: z.string().trim().max(255).optional(),
});

router.post(
  "/webhooks/register",
  asyncHandler(async (req: Request, res: Response) => {
    const { url, eventType, description } = registerWebhookSchema.parse(req.body);

    const webhook = await webhookService.registerWebhook(url, eventType, description);

    res.status(201).json({
      success: true,
      data: {
        webhookId: webhook.id,
        secretKey: webhook.secretKey,
        eventType,
      },
      message: "Webhook registered successfully. Store the secretKey securely.",
    });
  })
);

export default router;
