/**
 * Audit Log Service
 * Manages event logging for all protocol actions
 */

import { prisma } from "../lib/db.js";
import { logger } from "../logger";

interface PrismaWithAuditEvent {
  auditEvent: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
    findMany: (args: { orderBy?: { createdAt: string }; take?: number; where?: { streamId: string } }) => Promise<unknown[]>;
  };
}

export interface EventLogEntry {
  eventType: string;
  streamId: string;
  txHash: string;
  ledger: number;
  ledgerClosedAt: string;
  sender?: string;
  receiver?: string;
  amount?: bigint;
  metadata?: Record<string, unknown>;
}

export interface AuditLogItem {
  id: string;
  eventType: string;
  streamId: string;
  txHash: string;
  ledger: number;
  ledgerClosedAt: string;
  sender: string | null;
  receiver: string | null;
  amount: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export class AuditLogService {
  /**
   * Log an event to the audit log
   */
  async logEvent(entry: EventLogEntry): Promise<void> {
    try {
      await (prisma as unknown as PrismaWithAuditEvent).auditEvent.create({
        data: {
          eventType: entry.eventType,
          streamId: entry.streamId,
          txHash: entry.txHash,
          ledger: entry.ledger,
          ledgerClosedAt: entry.ledgerClosedAt,
          sender: entry.sender ?? null,
          receiver: entry.receiver ?? null,
          amount: entry.amount ?? null,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        },
      });

      logger.info("Event logged to audit log", {
        eventType: entry.eventType,
        streamId: entry.streamId,
        txHash: entry.txHash,
      });
    } catch (error) {
      logger.error("Failed to log event to audit log", error, {
        eventType: entry.eventType,
        streamId: entry.streamId,
      });
    }
  }

  /**
   * Get the last N events from the audit log
   */
  async getRecentEvents(limit: number = 50): Promise<AuditLogItem[]> {
    try {
      const events = await (prisma as unknown as PrismaWithAuditEvent).auditEvent.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      }) as Array<{ id: string; eventType: string; streamId: string; txHash: string; ledger: number; ledgerClosedAt: string; sender: string | null; receiver: string | null; amount: bigint | null; metadata: string | null; createdAt: Date }>;

      return events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        streamId: event.streamId,
        txHash: event.txHash,
        ledger: event.ledger,
        ledgerClosedAt: event.ledgerClosedAt,
        sender: event.sender,
        receiver: event.receiver,
        amount: event.amount?.toString() ?? null,
        metadata: event.metadata ? JSON.parse(event.metadata) as Record<string, unknown> : null,
        createdAt: event.createdAt,
      }));
    } catch (error) {
      logger.error("Failed to retrieve audit log", error);
      throw error;
    }
  }

  /**
   * Get events for a specific stream
   */
  async getStreamEvents(streamId: string): Promise<AuditLogItem[]> {
    try {
      const events = await (prisma as unknown as PrismaWithAuditEvent).auditEvent.findMany({
        where: {
          streamId,
        },
        orderBy: {
          createdAt: "desc",
        },
      }) as Array<{ id: string; eventType: string; streamId: string; txHash: string; ledger: number; ledgerClosedAt: string; sender: string | null; receiver: string | null; amount: bigint | null; metadata: string | null; createdAt: Date }>;

      return events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        streamId: event.streamId,
        txHash: event.txHash,
        ledger: event.ledger,
        ledgerClosedAt: event.ledgerClosedAt,
        sender: event.sender,
        receiver: event.receiver,
        amount: event.amount?.toString() ?? null,
        metadata: event.metadata ? JSON.parse(event.metadata) as Record<string, unknown> : null,
        createdAt: event.createdAt,
      }));
    } catch (error) {
      logger.error("Failed to retrieve stream events", error, { streamId });
      throw error;
    }
  }
}
