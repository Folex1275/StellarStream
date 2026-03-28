import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Moves EventLog rows older than 1 year into DisbursementArchive,
 * then deletes them from the hot table.
 *
 * Designed to be idempotent — safe to re-run if interrupted.
 */
export async function archiveOldDisbursements(): Promise<void> {
  const cutoff = new Date(Date.now() - ONE_YEAR_MS);

  logger.info("[DisbursementArchive] Starting monthly archive job", { cutoff });

  // Fetch rows to archive in batches to avoid locking the table for too long.
  const BATCH = 500;
  let archived = 0;

  while (true) {
    const rows = await prisma.eventLog.findMany({
      where: { createdAt: { lt: cutoff } },
      take: BATCH,
    });

    if (rows.length === 0) break;

    // Insert into archive table via raw SQL (no Prisma model yet).
    for (const row of rows) {
      await prisma.$executeRaw`
        INSERT INTO "DisbursementArchive"
          (id, event_type, stream_id, tx_hash, ledger, ledger_closed_at,
           sender, receiver, amount, metadata, created_at)
        VALUES (
          ${row.id}, ${row.eventType}, ${row.streamId}, ${row.txHash},
          ${row.ledger}, ${row.ledgerClosedAt}, ${row.sender}, ${row.receiver},
          ${row.amount}, ${row.metadata}, ${row.createdAt}
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }

    const ids = rows.map((r) => r.id);
    await prisma.eventLog.deleteMany({ where: { id: { in: ids } } });

    archived += rows.length;
    logger.info(`[DisbursementArchive] Archived batch`, { count: rows.length, total: archived });
  }

  logger.info("[DisbursementArchive] Archive job complete", { totalArchived: archived });
}
