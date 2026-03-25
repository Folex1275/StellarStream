/**
 * Warp – High-Performance Soroban Event-Polling Service (Issue #479)
 *
 * Polls the Stellar RPC for events emitted by the Nebula V2 contract,
 * persists a cursor in the SyncState table so the indexer resumes
 * exactly where it left off after a crash or restart.
 */

import { SorobanRpc } from "@stellar/stellar-sdk";
import {
  getLastLedgerSequence,
  saveLastLedgerSequence,
} from "../services/syncMetadata.service.js";
import { logger } from "../logger.js";

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS ?? "5000", 10);
const CONTRACT_ID = process.env.NEBULA_CONTRACT_ID ?? "";
const RPC_URL = process.env.STELLAR_RPC_URL ?? "";

export class WarpService {
  private server: SorobanRpc.Server;
  private running = false;
  private pollTimeout?: NodeJS.Timeout;

  constructor(rpcUrl = RPC_URL) {
    this.server = new SorobanRpc.Server(rpcUrl, {
      allowHttp: rpcUrl.startsWith("http://"),
    });
  }

  /** Start the recursive polling loop. */
  async start(): Promise<void> {
    if (this.running) return;
    if (!CONTRACT_ID) throw new Error("NEBULA_CONTRACT_ID is not set");

    this.running = true;
    logger.info("[Warp] Starting event-polling service", { contractId: CONTRACT_ID });
    await this.poll();
  }

  /** Gracefully stop the polling loop. */
  stop(): void {
    this.running = false;
    if (this.pollTimeout) clearTimeout(this.pollTimeout);
    logger.info("[Warp] Stopped");
  }

  // ── Core polling logic ────────────────────────────────────────────────────

  private async poll(): Promise<void> {
    if (!this.running) return;

    try {
      await this.fetchAndProcess();
    } catch (err) {
      logger.error("[Warp] Poll error", { err });
    }

    this.pollTimeout = setTimeout(() => this.poll(), POLL_INTERVAL_MS);
  }

  private async fetchAndProcess(): Promise<void> {
    const startLedger = await getLastLedgerSequence();

    const response = await this.server.getEvents({
      startLedger: startLedger === 0 ? undefined : startLedger + 1,
      filters: [
        {
          type: "contract",
          contractIds: [CONTRACT_ID],
        },
      ],
    });

    const events = response.events ?? [];

    if (events.length === 0) {
      logger.debug("[Warp] No new events", { startLedger });
      return;
    }

    logger.info(`[Warp] Processing ${events.length} event(s)`);

    let latestLedger = startLedger;

    for (const event of events) {
      await this.handleEvent(event);
      if (event.ledger > latestLedger) latestLedger = event.ledger;
    }

    // Persist cursor only after the full batch is processed (idempotency).
    await saveLastLedgerSequence(latestLedger);
  }

  /**
   * Dispatch a single contract event.
   * Extend this method to fan-out to stream-lifecycle, audit-log, etc.
   */
  private async handleEvent(
    event: SorobanRpc.Api.EventResponse,
  ): Promise<void> {
    logger.debug("[Warp] Event received", {
      id: event.id,
      ledger: event.ledger,
      type: event.type,
      topics: event.topic,
    });
    // TODO: wire into StreamLifecycleService / AuditLogService
  }
}
