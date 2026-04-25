/**
 * XLM Buffer Monitor Worker
 *
 * Runs every 24 hours. For each active organization it checks the contract's
 * XLM balance via Horizon and sends an email alert to the org admin when the
 * balance falls below LOW_BALANCE_THRESHOLD_XLM (50 XLM).
 */

import { schedule, type ScheduledTask } from "node-cron";
import { logger } from "./logger.js";
import { prisma } from "./lib/db.js";

// 24-hour schedule at 08:00 UTC
const SCHEDULE = "0 8 * * *";

// 50 XLM expressed in stroops (1 XLM = 10_000_000 stroops)
const LOW_BALANCE_THRESHOLD_STROOPS = 50n * 10_000_000n;

const HORIZON_URL =
  process.env.HORIZON_URL ?? "https://horizon.stellar.org";

async function fetchXlmBalance(contractId: string): Promise<bigint> {
  const url = `${HORIZON_URL}/accounts/${contractId}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Horizon returned ${res.status} for account ${contractId}`);
  }
  const data = (await res.json()) as {
    balances: Array<{ asset_type: string; balance: string }>;
  };
  const native = data.balances.find((b) => b.asset_type === "native");
  if (!native) return 0n;
  // balance is a decimal string like "123.4567890"
  const [whole, frac = ""] = native.balance.split(".");
  const stroops = BigInt(whole) * 10_000_000n + BigInt(frac.padEnd(7, "0").slice(0, 7));
  return stroops;
}

async function sendLowBalanceAlert(
  orgId: string,
  adminEmail: string,
  contractId: string,
  balanceXlm: string,
): Promise<void> {
  // In production wire this to your email provider (SES, SendGrid, etc.).
  // For now we log a structured alert that can be picked up by any log-based
  // alerting system (Datadog, CloudWatch, PagerDuty, etc.).
  logger.warn("LOW_XLM_BALANCE_ALERT", {
    orgId,
    adminEmail,
    contractId,
    balanceXlm,
    thresholdXlm: "50",
    message: `Organization ${orgId} contract ${contractId} has only ${balanceXlm} XLM remaining (threshold: 50 XLM). Please top up.`,
  });

  // If SMTP / email service env vars are present, send a real email.
  if (process.env.ALERT_EMAIL_FROM && process.env.SMTP_HOST) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.ALERT_EMAIL_FROM,
        to: adminEmail,
        subject: `[Alert] Low XLM buffer for org ${orgId}`,
        text: `Your contract ${contractId} has only ${balanceXlm} XLM remaining.\nPlease top up to avoid disruption.`,
      });
      logger.info("Low-balance alert email sent", { orgId, adminEmail });
    } catch (err) {
      logger.error("Failed to send low-balance alert email", err);
    }
  }
}

export class XlmBufferMonitorWorker {
  private task: ScheduledTask | null = null;
  private isRunning = false;

  start(): void {
    if (this.task !== null) {
      logger.warn("XlmBufferMonitorWorker is already running");
      return;
    }

    this.task = schedule(SCHEDULE, async () => {
      if (this.isRunning) {
        logger.warn("Skipping XLM buffer check — previous run still active");
        return;
      }
      this.isRunning = true;
      logger.info("XLM buffer monitor job triggered");

      try {
        // Fetch all active organizations that have a contract address and admin email.
        const orgs = await (prisma as any).organization.findMany({
          where: { isActive: true },
          select: {
            id: true,
            contractId: true,
            adminEmail: true,
          },
        });

        for (const org of orgs) {
          if (!org.contractId || !org.adminEmail) continue;
          try {
            const balanceStoops = await fetchXlmBalance(org.contractId);
            if (balanceStoops < LOW_BALANCE_THRESHOLD_STROOPS) {
              const balanceXlm = (Number(balanceStoops) / 10_000_000).toFixed(7);
              await sendLowBalanceAlert(
                org.id,
                org.adminEmail,
                org.contractId,
                balanceXlm,
              );
            }
          } catch (err) {
            logger.error("Failed to check XLM balance for org", err, {
              orgId: org.id,
              contractId: org.contractId,
            });
          }
        }
      } catch (err) {
        logger.error("XLM buffer monitor job failed", err);
      } finally {
        this.isRunning = false;
      }
    });

    logger.info("XlmBufferMonitorWorker started", { schedule: SCHEDULE });
  }

  stop(): void {
    if (this.task === null) return;
    this.task.stop();
    this.task = null;
    logger.info("XlmBufferMonitorWorker stopped");
  }
}
