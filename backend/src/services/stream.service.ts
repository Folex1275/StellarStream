import { prisma } from "../lib/db";
import { StreamStatus } from "../generated/client";
import { SorobanRpc, scValToNative } from "@stellar/stellar-sdk";
import { createHash } from "crypto";

export type StreamDirection = "inbound" | "outbound";
export type StreamStatusFilter = "active" | "paused" | "completed";

export interface StreamFilters {
  direction?: StreamDirection;
  status?: StreamStatusFilter;
  tokenAddresses?: string[];
}

export interface StreamVerificationData {
  streamId: string;
  events: any[];
  proof: {
    contractId: string;
    totalEvents: number;
    lastLedger: number;
    hash: string;
  };
}

export class StreamService {
  private server: SorobanRpc.Server;

  constructor() {
    const rpcUrl = process.env.STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
    this.server = new SorobanRpc.Server(rpcUrl, {
      allowHttp: rpcUrl.startsWith("http://"),
    });
  }

  async getStreamsForAddress(address: string, filters: StreamFilters = {}) {
    const { direction, status, tokenAddresses } = filters;

    const where: any = {
      ...(direction === "inbound" && { receiver: address }),
      ...(direction === "outbound" && { sender: address }),
      ...(!direction && {
        OR: [{ sender: address }, { receiver: address }],
      }),
      ...(status && { status: status.toUpperCase() as StreamStatus }),
      ...(tokenAddresses?.length && { tokenAddress: { in: tokenAddresses } }),
    };

    return prisma.stream.findMany({
      where,
      orderBy: { id: "desc" },
    });
  }

  async verifyStream(streamId: string): Promise<StreamVerificationData | null> {
    const contractId = process.env.NEBULA_CONTRACT_ID;
    if (!contractId) {
      throw new Error("NEBULA_CONTRACT_ID not configured");
    }

    try {
      // Get events for this stream ID
      const response = await this.server.getEvents({
        filters: [
          {
            type: "contract",
            contractIds: [contractId],
            topics: [[streamId]], // Stream ID as first topic
          },
        ],
        limit: 100, // Limit to prevent too large responses
      });

      const events = response.events || [];

      // Parse events into structured format
      const parsedEvents = events.map(event => {
        let action = 'Unknown';
        let amount: string | undefined;
        let details = 'No details';

        try {
          // For V2 events, topic[1] contains the action
          if (event.topic && event.topic.length > 1) {
            const actionScVal = scValToNative(event.topic[1]);
            action = typeof actionScVal === 'symbol' ? actionScVal.toString() : String(actionScVal);
          }

          // Parse the NebulaEvent value
          if (event.value) {
            const nebulaEvent = scValToNative(event.value) as any;
            if (nebulaEvent && nebulaEvent.data && Array.isArray(nebulaEvent.data)) {
              // For create events, data[4] is the amount
              if (nebulaEvent.data[4]) {
                const amountVal = scValToNative(nebulaEvent.data[4]);
                if (typeof amountVal === 'bigint') {
                  amount = amountVal.toString();
                }
              }
            }
            details = JSON.stringify(nebulaEvent);
          }
        } catch (e) {
          details = 'Parse error';
        }

        return {
          ledger: event.ledger,
          txHash: event.txHash,
          timestamp: event.ledgerClosedAt,
          action,
          amount,
          details,
        };
      });

      // Calculate a simple hash of the events for proof
      const eventData = parsedEvents.map(e => `${e.ledger}:${e.txHash}:${e.action}`).join(",");
      const hash = createHash("sha256").update(eventData).digest("hex");

      return {
        streamId,
        events: parsedEvents,
        proof: {
          contractId,
          totalEvents: parsedEvents.length,
          lastLedger: parsedEvents.length > 0 ? Math.max(...parsedEvents.map(e => e.ledger)) : 0,
          hash,
        },
      };
    } catch (error) {
      console.error("Error verifying stream:", error);
      return null;
    }
  }
}
