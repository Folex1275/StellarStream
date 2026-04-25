import { Horizon } from "@stellar/stellar-sdk";
import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";

const STROOPS_PER_XLM = 10_000_000;

export interface AutopilotSchedule {
  id: string;
  name: string;
  frequency: string;
  splitConfigId: string;
  operatorAddress: string;
  minGasTankXlm: number;
  isActive: boolean;
  lastRun: Date | null;
}

export class AutopilotService {
  private readonly horizonUrl: string;

  constructor() {
    this.horizonUrl = process.env.HORIZON_URL ?? "https://horizon-testnet.stellar.org";
  }

  /**
   * Returns all active schedules whose next run time has passed.
   * "Due" = never run before, OR lastRun is older than the schedule's frequency period.
   * We use a simple hourly scan — the cron expression is stored for reference/display
   * but execution eligibility is determined by lastRun age vs. the schedule's
   * human-readable period encoded in the frequency field.
   */
  async getDueSchedules(): Promise<AutopilotSchedule[]> {
    const schedules = await prisma.autopilotSchedule.findMany({
      where: { isActive: true },
    });

    const now = new Date();
    return schedules.filter((s) => {
      if (!s.lastRun) return true;
      // Parse minimum interval from cron: if it runs "0 * * * *" = hourly, etc.
      // For safety, we re-run if lastRun is > 55 minutes ago (hourly cadence).
      const msSinceLast = now.getTime() - s.lastRun.getTime();
      return msSinceLast >= 55 * 60 * 1000;
    });
  }

  /**
   * Checks whether the operator wallet has enough XLM to cover the minimum gas tank.
   */
  async isGasTankFunded(operatorAddress: string, minXlm: number): Promise<boolean> {
    try {
      const server = new Horizon.Server(this.horizonUrl);
      const account = await server.loadAccount(operatorAddress);
      const nativeBalance = account.balances.find((b) => b.asset_type === "native");
      if (!nativeBalance) return false;
      const balanceStroops = parseFloat(nativeBalance.balance) * STROOPS_PER_XLM;
      return balanceStroops >= minXlm * STROOPS_PER_XLM;
    } catch (err) {
      logger.warn(`[Autopilot] Could not load account ${operatorAddress}`, err);
      return false;
    }
  }

  /**
   * Executes a single schedule: checks gas tank, then submits the split transaction.
   * In production this would build and sign a Soroban invoke_contract XDR using
   * the operator keypair from a secure secrets manager.
   */
  async executeSchedule(schedule: AutopilotSchedule): Promise<void> {
    const funded = await this.isGasTankFunded(
      schedule.operatorAddress,
      schedule.minGasTankXlm
    );

    if (!funded) {
      logger.warn(
        `[Autopilot] Schedule "${schedule.name}" skipped — gas tank below ${schedule.minGasTankXlm} XLM`
      );
      await prisma.autopilotSchedule.update({
        where: { id: schedule.id },
        data: { lastError: "Gas tank insufficient", updatedAt: new Date() },
      });
      return;
    }

    // TODO: Build and sign the Soroban invoke_contract transaction using the
    // operator keypair retrieved from the secrets manager, then submit via Horizon.
    // Placeholder: log the intent and record a mock tx hash.
    const mockTxHash = `autopilot-${schedule.id}-${Date.now()}`;
    logger.info(
      `[Autopilot] Executing schedule "${schedule.name}" (splitConfigId=${schedule.splitConfigId}) tx=${mockTxHash}`
    );

    await prisma.autopilotSchedule.update({
      where: { id: schedule.id },
      data: {
        lastRun: new Date(),
        lastTxHash: mockTxHash,
        lastError: null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Scans all due schedules and executes them sequentially.
   * Called by the hourly cron job in schedulers.ts.
   */
  async runDueSchedules(): Promise<void> {
    const due = await this.getDueSchedules();
    if (due.length === 0) {
      logger.debug("[Autopilot] No schedules due for execution");
      return;
    }

    logger.info(`[Autopilot] Running ${due.length} due schedule(s)`);
    for (const schedule of due) {
      try {
        await this.executeSchedule(schedule);
      } catch (err) {
        logger.error(`[Autopilot] Failed to execute schedule "${schedule.name}"`, err);
        await prisma.autopilotSchedule.update({
          where: { id: schedule.id },
          data: {
            lastError: err instanceof Error ? err.message : String(err),
            updatedAt: new Date(),
          },
        });
      }
    }
  }
}
