import { PrismaClient } from "../generated/client/index.js";
import { createHmac } from "crypto";
import { logger } from "../logger.js";

const prisma = new PrismaClient();

export interface WebhookPayload {
  eventType: string;
  streamId: string | null;
  txHash: string;
  sender: string;
  receiver: string;
  amount: string;
  timestamp: string;
  [key: string]: unknown;
}

const RETRY_DELAYS = [1000, 5000, 30000, 300000, 900000]; // 1s, 5s, 30s, 5m, 15m

export class WebhookDispatcherService {
  /**
   * Register a new webhook for external developers
   */
  async registerWebhook(
    url: string,
    eventType: string = "*",
    description?: string
  ): Promise<{ id: string; secretKey: string }> {
    const secretKey = this.generateSecretKey();

    const webhook = await (prisma as any).webhook.create({
      data: {
        url,
        eventType,
        description,
        secretKey,
        isActive: true,
      },
    });

    logger.info(`Webhook registered: ${webhook.id} for ${eventType} events`);
    return { id: webhook.id, secretKey };
  }

  /**
   * Dispatch event to all matching webhooks with retry logic
   */
  async dispatch(payload: WebhookPayload): Promise<void> {
    try {
      const webhooks = await (prisma as any).webhook.findMany({
        where: {
          isActive: true,
          OR: [
            { eventType: "*" },
            { eventType: payload.eventType },
          ],
        },
      });

      if (webhooks.length === 0) return;

      for (const webhook of webhooks) {
        await this.createDeliveryRecord(webhook.id, payload);
      }

      // Process deliveries asynchronously
      this.processDeliveries().catch((err) =>
        logger.error("Error processing webhook deliveries", err)
      );
    } catch (error) {
      logger.error("Failed to dispatch webhooks", error);
    }
  }

  /**
   * Create a delivery record for retry processing
   */
  private async createDeliveryRecord(
    webhookId: string,
    payload: WebhookPayload
  ): Promise<void> {
    await (prisma as any).webhookDelivery.create({
      data: {
        webhookId,
        eventType: payload.eventType,
        payload,
        status: "pending",
        attempts: 0,
        maxRetries: 5,
        nextRetryAt: new Date(),
      },
    });
  }

  /**
   * Process pending webhook deliveries with exponential backoff
   */
  async processDeliveries(): Promise<void> {
    const pending = await (prisma as any).webhookDelivery.findMany({
      where: {
        status: "pending",
        nextRetryAt: { lte: new Date() },
      },
      include: { webhook: true },
      take: 100,
    });

    for (const delivery of pending) {
      await this.attemptDelivery(delivery);
    }
  }

  /**
   * Attempt to deliver a webhook with HMAC signature
   */
  private async attemptDelivery(delivery: any): Promise<void> {
    const webhook = delivery.webhook;
    const signature = this.signPayload(
      JSON.stringify(delivery.payload),
      webhook.secretKey
    );

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-ID": webhook.id,
          "User-Agent": "StellarStream-Webhook/1.0",
        },
        body: JSON.stringify(delivery.payload),
        timeout: 10000,
      });

      if (response.ok) {
        await (prisma as any).webhookDelivery.update({
          where: { id: delivery.id },
          data: { status: "success", attempts: delivery.attempts + 1 },
        });
        logger.info(`Webhook delivered: ${webhook.id}`);
      } else {
        await this.scheduleRetry(delivery, `HTTP ${response.status}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.scheduleRetry(delivery, errorMsg);
    }
  }

  /**
   * Schedule retry with exponential backoff
   */
  private async scheduleRetry(delivery: any, error: string): Promise<void> {
    const nextAttempt = delivery.attempts + 1;

    if (nextAttempt >= delivery.maxRetries) {
      await (prisma as any).webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "failed",
          attempts: nextAttempt,
          lastError: error,
        },
      });
      logger.warn(`Webhook delivery failed after ${nextAttempt} attempts: ${delivery.webhookId}`);
    } else {
      const delayMs = RETRY_DELAYS[nextAttempt - 1] || 900000;
      const nextRetryAt = new Date(Date.now() + delayMs);

      await (prisma as any).webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          attempts: nextAttempt,
          nextRetryAt,
          lastError: error,
        },
      });
    }
  }

  /**
   * Generate HMAC-SHA256 signature
   */
  private signPayload(payload: string, secretKey: string): string {
    return createHmac("sha256", secretKey).update(payload).digest("hex");
  }

  /**
   * Generate a secure random secret key
   */
  private generateSecretKey(): string {
    return require("crypto").randomBytes(32).toString("hex");
  }

  /**
   * Verify webhook signature (for receiver validation)
   */
  static verifySignature(
    payload: string,
    signature: string,
    secretKey: string
  ): boolean {
    const expected = createHmac("sha256", secretKey)
      .update(payload)
      .digest("hex");
    return signature === expected;
  }
}
