import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";

export interface FlowDataPoint {
  date: string;
  inbound: string;
  outbound: string;
}

export class HistoricalFlowService {
  /**
   * Get time-series flow data for an address
   * Groups ContractEvents by day over a 30-day window
   */
  async getFlowHistory(address: string, days = 30): Promise<FlowDataPoint[]> {
    try {
      const startDate = new Date();
      startDate.setUTCDate(startDate.getUTCDate() - days);
      startDate.setUTCHours(0, 0, 0, 0);

      // Get all events for this address as receiver (inbound) and sender (outbound)
      const events = await prisma.$queryRaw<
        Array<{
          date: string;
          event_type: string;
          total_amount: string;
        }>
      >`
        SELECT
          DATE(el."createdAt") AS date,
          el."eventType" AS event_type,
          COALESCE(SUM(el.amount::NUMERIC), 0)::TEXT AS total_amount
        FROM "EventLog" el
        WHERE (
          (el."eventType" = 'withdraw' AND el.receiver = ${address})
          OR
          (el."eventType" = 'create' AND el.sender = ${address})
        )
        AND el."createdAt" >= ${startDate}
        GROUP BY DATE(el."createdAt"), el."eventType"
        ORDER BY date ASC
      `;

      // Aggregate by date
      const flowMap = new Map<string, { inbound: string; outbound: string }>();

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setUTCDate(date.getUTCDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        flowMap.set(dateStr, { inbound: "0", outbound: "0" });
      }

      // Fill in actual data
      for (const event of events) {
        const existing = flowMap.get(event.date) || { inbound: "0", outbound: "0" };

        if (event.event_type === "withdraw") {
          existing.inbound = event.total_amount;
        } else if (event.event_type === "create") {
          existing.outbound = event.total_amount;
        }

        flowMap.set(event.date, existing);
      }

      // Convert to array format for Recharts
      return Array.from(flowMap.entries()).map(([date, flow]) => ({
        date,
        inbound: flow.inbound,
        outbound: flow.outbound,
      }));
    } catch (error) {
      logger.error("Failed to get flow history", { address, error });
      throw error;
    }
  }

  /**
   * Get net worth progression (cumulative inbound - outbound)
   */
  async getNetWorthHistory(address: string, days = 30): Promise<FlowDataPoint[]> {
    try {
      const flowData = await this.getFlowHistory(address, days);

      let cumulativeInbound = BigInt(0);
      let cumulativeOutbound = BigInt(0);

      return flowData.map((point) => {
        cumulativeInbound += BigInt(point.inbound || 0);
        cumulativeOutbound += BigInt(point.outbound || 0);

        return {
          date: point.date,
          inbound: cumulativeInbound.toString(),
          outbound: cumulativeOutbound.toString(),
        };
      });
    } catch (error) {
      logger.error("Failed to get net worth history", { address, error });
      throw error;
    }
  }

  /**
   * Get inbound vs outbound comparison
   */
  async getFlowComparison(address: string, days = 30): Promise<{
    totalInbound: string;
    totalOutbound: string;
    netFlow: string;
  }> {
    try {
      const flowData = await this.getFlowHistory(address, days);

      let totalInbound = BigInt(0);
      let totalOutbound = BigInt(0);

      for (const point of flowData) {
        totalInbound += BigInt(point.inbound || 0);
        totalOutbound += BigInt(point.outbound || 0);
      }

      const netFlow = totalInbound - totalOutbound;

      return {
        totalInbound: totalInbound.toString(),
        totalOutbound: totalOutbound.toString(),
        netFlow: netFlow.toString(),
      };
    } catch (error) {
      logger.error("Failed to get flow comparison", { address, error });
      throw error;
    }
  }

  /**
   * Optimize with materialized view if event table > 100k rows
   */
  async ensureMaterializedView(): Promise<void> {
    try {
      const eventCount = await prisma.eventLog.count();

      if (eventCount > 100000) {
        logger.info("Creating materialized view for flow data", { eventCount });

        await prisma.$executeRaw`
          CREATE MATERIALIZED VIEW IF NOT EXISTS flow_data_mv AS
          SELECT
            DATE(el."createdAt") AS date,
            el.receiver AS address,
            'inbound' AS flow_type,
            COALESCE(SUM(el.amount::NUMERIC), 0) AS total_amount
          FROM "EventLog" el
          WHERE el."eventType" = 'withdraw'
          GROUP BY DATE(el."createdAt"), el.receiver
          UNION ALL
          SELECT
            DATE(el."createdAt") AS date,
            el.sender AS address,
            'outbound' AS flow_type,
            COALESCE(SUM(el.amount::NUMERIC), 0) AS total_amount
          FROM "EventLog" el
          WHERE el."eventType" = 'create'
          GROUP BY DATE(el."createdAt"), el.sender
        `;

        logger.info("Materialized view created successfully");
      }
    } catch (error) {
      logger.warn("Failed to create materialized view", error);
      // Non-critical, continue with regular queries
    }
  }
}
