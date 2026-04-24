/**
 * WeeklyLedgerAuditWorker
 *
 * Runs once a week (Sunday 03:00 UTC) to cross-reference every Stream row in
 * the database against the Stellar ledger's on-chain ContractEvents.
 *
 * Any entry where `total_amount` does not match the on-chain event is flagged
 * and written to the AuditLog for ops review. The worker is read-only — it
 * never mutates financial records.
 *
 * Schedule: "0 3 * * 0"  (Sunday at 03:00 UTC)
 */

import { schedule, type ScheduledTask } from "node-cron";
import { logger } from "./logger.js";
import { WeeklyLedgerAuditService } from "./services/weekly-ledger-audit.service.js";
import { AuditLogService } from "./services/audit-log.service.js";

const AUDIT_SCHEDULE = "0 3 * * 0"; // Sunday 03:00 UTC

export class WeeklyLedgerAuditWorker {
  private task: ScheduledTask | null = null;
  private isRunning = false;
  private readonly auditService: WeeklyLedgerAuditService;
  private readonly auditLogService: AuditLogService;

  constructor(
    auditService: WeeklyLedgerAuditService = new WeeklyLedgerAuditService(),
    auditLogService: AuditLogService = new AuditLogService(),
  ) {
    this.auditService = auditService;
    this.auditLogService = auditLogService;
  }

  start(): void {
    if (this.task !== null) {
      logger.warn("[WeeklyLedgerAuditWorker] Already running");
      return;
    }

    this.task = schedule(AUDIT_SCHEDULE, async () => {
      if (this.isRunning) {
        logger.warn("[WeeklyLedgerAuditWorker] Previous run still active — skipping");
        return;
      }

      this.isRunning = true;
      logger.info("[WeeklyLedgerAuditWorker] Weekly ledger audit triggered");

      try {
        const report = await this.auditService.runAudit();

        // Persist report to audit log for traceability
        await this.auditLogService.logEvent({
          eventType: "weekly_ledger_audit",
          streamId: "system",
          txHash: report.reportId,
          eventIndex: 0,
          ledger: 0,
          ledgerClosedAt: new Date().toISOString(),
          metadata: {
            contractId: report.contractId,
            generatedAt: report.generatedAt,
            totalStreamsScanned: report.totalStreamsScanned,
            matchedStreams: report.matchedStreams,
            mismatchCount: report.mismatches.length,
            durationMs: report.durationMs,
            // Store full mismatch list for ops review
            mismatches: report.mismatches,
          },
        });

        if (report.mismatches.length === 0) {
          logger.info("[WeeklyLedgerAuditWorker] Audit passed — zero discrepancies", {
            totalStreamsScanned: report.totalStreamsScanned,
            durationMs: report.durationMs,
          });
        } else {
          logger.warn(
            `[WeeklyLedgerAuditWorker] Audit flagged ${report.mismatches.length} discrepancies`,
            {
              reportId: report.reportId,
              mismatchCount: report.mismatches.length,
            },
          );
        }
      } catch (error) {
        logger.error("[WeeklyLedgerAuditWorker] Audit run failed", error);
      } finally {
        this.isRunning = false;
      }
    });

    logger.info("[WeeklyLedgerAuditWorker] Started", { schedule: AUDIT_SCHEDULE });
  }

  stop(): void {
    if (this.task === null) return;
    this.task.stop();
    this.task = null;
    logger.info("[WeeklyLedgerAuditWorker] Stopped");
  }
}
