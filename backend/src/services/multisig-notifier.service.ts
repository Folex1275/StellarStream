/**
 * Autopilot Multi-Sig Notifier
 *
 * Scans AutopilotSchedule rows that:
 *   1. Have a releaseTime within the next 24 hours
 *   2. Have at least one signer address
 *   3. Have NOT already been notified (notifiedAt is null)
 *
 * For each matching schedule it pings every signer via their registered
 * Discord/Telegram subscription (reusing NotificationSubscription).
 * Falls back to a Discord webhook env-var when no subscription is found.
 */

import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Optional fallback Discord webhook for signers with no registered subscription.
const FALLBACK_DISCORD_WEBHOOK = process.env.MULTISIG_ALERT_DISCORD_WEBHOOK ?? "";

interface SignerNotification {
  scheduleId: string;
  scheduleName: string;
  releaseTime: Date;
  signerAddress: string;
}

// ── Discord helpers ───────────────────────────────────────────────────────────

function buildDiscordPayload(n: SignerNotification): object {
  return {
    username: "StellarStream 🌊",
    embeds: [
      {
        title: "🔏 Signature Required — Scheduled Split",
        description: `Your signature is needed for **${n.scheduleName}** before it executes.`,
        color: 0xf59e0b, // amber
        fields: [
          { name: "📅 Release Time", value: n.releaseTime.toUTCString(), inline: false },
          { name: "🔑 Signer", value: `\`${n.signerAddress}\``, inline: false },
          { name: "🆔 Schedule ID", value: `\`${n.scheduleId}\``, inline: false },
        ],
        footer: { text: "StellarStream Autopilot • Sign within 24 hours to avoid delay" },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

async function sendDiscord(webhookUrl: string, n: SignerNotification): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildDiscordPayload(n)),
  });
  if (!res.ok) {
    throw new Error(`Discord webhook failed: ${res.status} ${res.statusText}`);
  }
}

// ── Email helper (SMTP via env vars) ─────────────────────────────────────────

async function sendEmail(to: string, n: SignerNotification): Promise<void> {
  // Lazy-import nodemailer so the service still boots when it's not installed.
  let nodemailer: typeof import("nodemailer");
  try {
    nodemailer = await import("nodemailer");
  } catch {
    throw new Error("nodemailer is not installed — skipping email notification");
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP env vars not configured");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM ?? SMTP_USER,
    to,
    subject: `[StellarStream] Signature required: ${n.scheduleName}`,
    text: [
      `Your signature is required for the scheduled split "${n.scheduleName}".`,
      ``,
      `Release time: ${n.releaseTime.toUTCString()}`,
      `Signer address: ${n.signerAddress}`,
      `Schedule ID: ${n.scheduleId}`,
      ``,
      `Please sign within 24 hours to avoid execution delay.`,
    ].join("\n"),
  });
}

// ── Core scan ─────────────────────────────────────────────────────────────────

export class MultisigNotifierService {
  /**
   * Find schedules entering the 24-hour window and notify their signers.
   * Marks each schedule with notifiedAt so it is not re-notified.
   */
  async notifyPendingSigners(): Promise<void> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + TWENTY_FOUR_HOURS_MS);

    // Schedules due within 24 h that haven't been notified yet.
    const schedules = await prisma.autopilotSchedule.findMany({
      where: {
        isActive: true,
        notifiedAt: null,
        releaseTime: { gte: now, lte: windowEnd },
      },
    });

    if (schedules.length === 0) {
      logger.debug("[MultisigNotifier] No schedules entering 24-hour window");
      return;
    }

    logger.info(`[MultisigNotifier] Notifying signers for ${schedules.length} schedule(s)`);

    for (const schedule of schedules) {
      if (!schedule.releaseTime || schedule.signers.length === 0) continue;

      const releaseTime = schedule.releaseTime;

      await Promise.allSettled(
        schedule.signers.map((signerAddress) =>
          this.notifySigner({ scheduleId: schedule.id, scheduleName: schedule.name, releaseTime, signerAddress })
        )
      );

      // Mark as notified regardless of individual delivery failures so we
      // don't spam signers on the next hourly tick.
      await prisma.autopilotSchedule.update({
        where: { id: schedule.id },
        data: { notifiedAt: now },
      });

      logger.info(`[MultisigNotifier] Marked schedule "${schedule.name}" as notified`);
    }
  }

  private async notifySigner(n: SignerNotification): Promise<void> {
    // Look up registered notification subscriptions for this signer address.
    const subs = await (prisma as any).notificationSubscription.findMany({
      where: { stellarAddress: n.signerAddress, isActive: true },
    });

    let dispatched = false;

    for (const sub of subs) {
      try {
        if (sub.platform === "discord" && sub.webhookUrl) {
          await sendDiscord(sub.webhookUrl, n);
          logger.info(`[MultisigNotifier] Discord alert sent to ${n.signerAddress} for schedule ${n.scheduleId}`);
          dispatched = true;
        } else if (sub.platform === "email" && sub.chatId) {
          // chatId stores the email address for email-platform subscriptions.
          await sendEmail(sub.chatId, n);
          logger.info(`[MultisigNotifier] Email alert sent to ${n.signerAddress} for schedule ${n.scheduleId}`);
          dispatched = true;
        }
      } catch (err) {
        logger.error(`[MultisigNotifier] Failed to notify ${n.signerAddress} via ${sub.platform}`, err);
      }
    }

    // Fallback: use the global Discord webhook env var if no subscription found.
    if (!dispatched && FALLBACK_DISCORD_WEBHOOK) {
      try {
        await sendDiscord(FALLBACK_DISCORD_WEBHOOK, n);
        logger.info(`[MultisigNotifier] Fallback Discord alert sent for signer ${n.signerAddress}`);
      } catch (err) {
        logger.error(`[MultisigNotifier] Fallback Discord alert failed for ${n.signerAddress}`, err);
      }
    }

    if (!dispatched && !FALLBACK_DISCORD_WEBHOOK) {
      logger.warn(`[MultisigNotifier] No notification channel found for signer ${n.signerAddress} — schedule ${n.scheduleId}`);
    }
  }
}
