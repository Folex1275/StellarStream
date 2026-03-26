import { Parser } from "json2csv";
import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";

export interface AuditLogExportRow {
  Timestamp: string;
  Action: string;
  Amount: string;
  Asset: string;
  TX_Hash: string;
  Sender: string | null;
  Receiver: string | null;
}

export class ExportService {
  /**
   * Export stream audit log as CSV
   */
  async exportStreamAsCSV(streamId: string): Promise<string> {
    try {
      const events = await prisma.eventLog.findMany({
        where: { streamId },
        orderBy: { createdAt: "asc" },
      });

      if (events.length === 0) {
        return "Timestamp,Action,Amount,Asset,TX_Hash,Sender,Receiver\n";
      }

      const rows: AuditLogExportRow[] = events.map((event) => ({
        Timestamp: event.ledgerClosedAt,
        Action: event.eventType.toUpperCase(),
        Amount: event.amount?.toString() ?? "0",
        Asset: event.metadata
          ? (() => {
              try {
                const meta = JSON.parse(event.metadata);
                return meta.asset || "UNKNOWN";
              } catch {
                return "UNKNOWN";
              }
            })()
          : "UNKNOWN",
        TX_Hash: event.txHash,
        Sender: event.sender,
        Receiver: event.receiver,
      }));

      const parser = new Parser<AuditLogExportRow>({
        fields: [
          "Timestamp",
          "Action",
          "Amount",
          "Asset",
          "TX_Hash",
          "Sender",
          "Receiver",
        ],
      });

      return parser.parse(rows);
    } catch (error) {
      logger.error("Failed to export stream as CSV", error, { streamId });
      throw error;
    }
  }

  /**
   * Export stream audit log as JSON
   */
  async exportStreamAsJSON(streamId: string): Promise<string> {
    try {
      const events = await prisma.eventLog.findMany({
        where: { streamId },
        orderBy: { createdAt: "asc" },
      });

      const rows: AuditLogExportRow[] = events.map((event) => ({
        Timestamp: event.ledgerClosedAt,
        Action: event.eventType.toUpperCase(),
        Amount: event.amount?.toString() ?? "0",
        Asset: event.metadata
          ? (() => {
              try {
                const meta = JSON.parse(event.metadata);
                return meta.asset || "UNKNOWN";
              } catch {
                return "UNKNOWN";
              }
            })()
          : "UNKNOWN",
        TX_Hash: event.txHash,
        Sender: event.sender,
        Receiver: event.receiver,
      }));

      return JSON.stringify(rows, null, 2);
    } catch (error) {
      logger.error("Failed to export stream as JSON", error, { streamId });
      throw error;
    }
  }
}
