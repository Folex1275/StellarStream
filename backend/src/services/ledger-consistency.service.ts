import { SorobanRpc } from "@stellar/stellar-sdk";
import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const BATCH_SIZE = 100;

export interface ConsistencyFlag {
  streamId: string;
  txHash: string;
  reason: string;
}

/**
 * Ledger Consistency Checker (#849)
 *
 * Runs every 6 hours (scheduled in schedulers.ts).
 * Queries all ACTIVE/COMPLETED streams that are marked "Confirmed" in the DB
 * and verifies each transaction exists on the Stellar ledger via Soroban RPC.
 * Flags entries whose txHash cannot be found on-chain.
 */
export class LedgerConsistencyChecker {
  private rpc: SorobanRpc.Server;

  constructor() {
    this.rpc = new SorobanRpc.Server(RPC_URL);
  }

  async run(): Promise<ConsistencyFlag[]> {
    const flags: ConsistencyFlag[] = [];
    let skip = 0;

    while (true) {
      const streams = await prisma.stream.findMany({
        where: { status: { in: ["ACTIVE", "COMPLETED"] } },
        select: { streamId: true, txHash: true },
        skip,
        take: BATCH_SIZE,
      });

      if (streams.length === 0) break;

      for (const stream of streams) {
        try {
          const result = await this.rpc.getTransaction(stream.txHash);
          if (result.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
            flags.push({
              streamId: stream.streamId ?? stream.txHash,
              txHash: stream.txHash,
              reason: "Transaction confirmed in DB but not found on ledger",
            });
            logger.warn("[LedgerConsistency] Flagged missing tx", {
              txHash: stream.txHash,
              streamId: stream.streamId,
            });
          }
        } catch (err) {
          logger.warn("[LedgerConsistency] RPC error for tx", {
            txHash: stream.txHash,
            err: err instanceof Error ? err.message : String(err),
          });
        }
      }

      skip += streams.length;
      if (streams.length < BATCH_SIZE) break;
    }

    if (flags.length > 0) {
      logger.error("[LedgerConsistency] Audit complete — inconsistencies found", {
        count: flags.length,
        flags,
      });
    } else {
      logger.info("[LedgerConsistency] Audit complete — all entries consistent");
    }

    return flags;
  }
}
