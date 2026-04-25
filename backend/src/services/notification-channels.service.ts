import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";
import crypto from "crypto";

export interface NotificationChannel {
  id: string;
  orgId: string;
  platform: "discord" | "slack";
  webhookUrl: string;
  isActive: boolean;
  createdAt: Date;
}

export interface DisbursementNotification {
  splitId: string;
  txHash: string;
  sender: string;
  recipients: Array<{ address: string; amount: string }>;
  asset: string;
  totalAmount: string;
  timestamp: string;
}

export class NotificationChannelsService {
  /**
   * Encrypt webhook URL for storage
   */
  private encryptWebhookUrl(url: string): string {
    const key = process.env.WEBHOOK_ENCRYPTION_KEY || "default-key-change-in-prod";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key.padEnd(32, "0").slice(0, 32)), iv);
    let encrypted = cipher.update(url, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  }

  /**
   * Decrypt webhook URL from storage
   */
  private decryptWebhookUrl(encrypted: string): string {
    const key = process.env.WEBHOOK_ENCRYPTION_KEY || "default-key-change-in-prod";
    const [ivHex, encryptedData] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key.padEnd(32, "0").slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  /**
   * Register a new notification channel for an organization
   */
  async registerChannel(orgId: string, platform: "discord" | "slack", webhookUrl: string): Promise<NotificationChannel> {
    const encrypted = this.encryptWebhookUrl(webhookUrl);

    const channel = await prisma.notificationSubscription.create({
      data: {
        stellarAddress: orgId,
        platform: platform === "discord" ? "discord" : "telegram", // Map to existing enum
        webhookUrl: encrypted,
        isActive: true,
      },
    });

    return {
      id: channel.id,
      orgId,
      platform,
      webhookUrl,
      isActive: channel.isActive,
      createdAt: channel.createdAt,
    };
  }

  /**
   * Get all active notification channels for an organization
   */
  async getChannels(orgId: string): Promise<NotificationChannel[]> {
    const subscriptions = await prisma.notificationSubscription.findMany({
      where: {
        stellarAddress: orgId,
        isActive: true,
      },
    });

    return subscriptions
      .filter((s) => s.webhookUrl)
      .map((s) => ({
        id: s.id,
        orgId,
        platform: (s.platform === "discord" ? "discord" : "slack") as "discord" | "slack",
        webhookUrl: this.decryptWebhookUrl(s.webhookUrl!),
        isActive: s.isActive,
        createdAt: s.createdAt,
      }));
  }

  /**
   * Format disbursement notification payload
   */
  private formatDiscordPayload(notification: DisbursementNotification): object {
    const recipientList = notification.recipients.map((r) => `• ${r.address}: ${r.amount} ${notification.asset}`).join("\n");

    return {
      embeds: [
        {
          title: "💸 Disbursement Completed",
          color: 65280, // Green
          fields: [
            {
              name: "Split ID",
              value: notification.splitId,
              inline: true,
            },
            {
              name: "Transaction Hash",
              value: `\`${notification.txHash}\``,
              inline: false,
            },
            {
              name: "From",
              value: notification.sender,
              inline: true,
            },
            {
              name: "Total Amount",
              value: `${notification.totalAmount} ${notification.asset}`,
              inline: true,
            },
            {
              name: "Recipients",
              value: recipientList,
              inline: false,
            },
          ],
          timestamp: notification.timestamp,
          footer: {
            text: "StellarStream",
          },
        },
      ],
    };
  }

  /**
   * Format Slack notification payload
   */
  private formatSlackPayload(notification: DisbursementNotification): object {
    const recipientList = notification.recipients.map((r) => `• ${r.address}: ${r.amount} ${notification.asset}`).join("\n");

    return {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "💸 Disbursement Completed",
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Split ID:*\n${notification.splitId}`,
            },
            {
              type: "mrkdwn",
              text: `*Total Amount:*\n${notification.totalAmount} ${notification.asset}`,
            },
            {
              type: "mrkdwn",
              text: `*From:*\n${notification.sender}`,
            },
            {
              type: "mrkdwn",
              text: `*Timestamp:*\n${notification.timestamp}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Transaction Hash:*\n\`${notification.txHash}\``,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Recipients:*\n${recipientList}`,
          },
        },
      ],
    };
  }

  /**
   * Send notification to a webhook with retry logic
   */
  async sendNotification(
    webhookUrl: string,
    platform: "discord" | "slack",
    notification: DisbursementNotification,
    maxRetries: number = 3
  ): Promise<boolean> {
    const payload = platform === "discord" ? this.formatDiscordPayload(notification) : this.formatSlackPayload(notification);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          logger.info(`Notification sent successfully to ${platform} webhook`);
          return true;
        }

        if (response.status >= 400 && response.status < 500) {
          logger.error(`Webhook error (${response.status}): ${response.statusText}`);
          return false;
        }

        logger.warn(`Webhook returned ${response.status}, retrying...`);
      } catch (error) {
        logger.error(`Attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        }
      }
    }

    logger.error(`Failed to send notification after ${maxRetries} attempts`);
    return false;
  }

  /**
   * Dispatch notification to all active channels for an organization
   */
  async dispatchToOrg(orgId: string, notification: DisbursementNotification): Promise<void> {
    const channels = await this.getChannels(orgId);

    for (const channel of channels) {
      try {
        await this.sendNotification(channel.webhookUrl, channel.platform, notification);
      } catch (error) {
        logger.error(`Failed to dispatch to channel ${channel.id}:`, error);
      }
    }
  }
}
