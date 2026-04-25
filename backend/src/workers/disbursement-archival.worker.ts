import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";

export class DisbursementArchivalWorker {
  private readonly ARCHIVAL_THRESHOLD_MONTHS = 18;

  async archiveOldDisbursements(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - this.ARCHIVAL_THRESHOLD_MONTHS);

      const disbursementsToArchive = await prisma.disbursement.findMany({
        where: {
          status: "COMPLETED",
          completedAt: {
            lt: cutoffDate,
          },
        },
        take: 1000,
      });

      if (disbursementsToArchive.length === 0) {
        logger.info("No disbursements to archive");
        return 0;
      }

      const archivedRecords = disbursementsToArchive.map((d) => ({
        streamId: d.streamId,
        txHash: d.txHash,
        sender: d.sender,
        receiver: d.receiver,
        amount: d.amount,
        tokenAddress: d.tokenAddress,
        status: d.status,
        completedAt: d.completedAt!,
        originalLedger: d.ledger,
      }));

      await prisma.archivedDisbursement.createMany({
        data: archivedRecords,
      });

      const txHashes = disbursementsToArchive.map((d) => d.txHash);
      await prisma.disbursement.deleteMany({
        where: {
          txHash: {
            in: txHashes,
          },
        },
      });

      logger.info("Disbursement archival completed", {
        archived: disbursementsToArchive.length,
        cutoffDate,
      });

      return disbursementsToArchive.length;
    } catch (error) {
      logger.error("Failed to archive disbursements", error);
      throw error;
    }
  }
}
