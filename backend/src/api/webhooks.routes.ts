import { Router, Request, Response } from "express";
import { WebhookDispatcherService } from "../services/webhook-dispatcher.service.js";
import { logger } from "../logger.js";

const router = Router();
const webhookService = new WebhookDispatcherService();

/**
 * POST /api/v1/webhooks/register
 * Register a new webhook for external developers
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { url, eventType, description } = req.body;

    if (!url) {
      res.status(400).json({ error: "URL is required" });
      return;
    }

    const webhook = await webhookService.registerWebhook(
      url,
      eventType || "*",
      description
    );

    res.status(201).json({
      success: true,
      webhook,
      message: "Webhook registered successfully. Store the secretKey securely.",
    });
  } catch (error) {
    logger.error("Error registering webhook", error);
    res.status(500).json({ error: "Failed to register webhook" });
  }
});

/**
 * POST /api/v1/webhooks/test
 * Test webhook delivery
 */
router.post("/test", async (req: Request, res: Response) => {
  try {
    const { webhookId } = req.body;

    if (!webhookId) {
      res.status(400).json({ error: "Webhook ID is required" });
      return;
    }

    const testPayload = {
      eventType: "test",
      streamId: null,
      txHash: "test_" + Date.now(),
      sender: "GTEST",
      receiver: "GTEST",
      amount: "1000000",
      timestamp: new Date().toISOString(),
    };

    await webhookService.dispatch(testPayload);

    res.json({ success: true, message: "Test webhook dispatched" });
  } catch (error) {
    logger.error("Error testing webhook", error);
    res.status(500).json({ error: "Failed to test webhook" });
  }
});

export default router;
