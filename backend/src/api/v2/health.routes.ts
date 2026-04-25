/**
 * GET /api/v2/health
 *
 * Internal dashboard endpoint for monitoring the indexer's health,
 * memory usage, and sync status.
 *
 * Response shape:
 *   current_ledger  – last successfully ingested ledger sequence
 *   network_ledger  – current network tip from the Soroban RPC
 *   lag             – network_ledger - current_ledger
 *   status          – SYNCING | LOCKED | STALLED
 *   memory          – Node.js process memory snapshot (bytes)
 *   uptime_seconds  – process uptime
 *
 * Alerting:
 *   If lag > 50 ledgers a CRITICAL log is emitted and a system-level
 *   notification is sent via the OS `wall` command (Ubuntu).
 */

import { Router, Request, Response } from "express";
import { SorobanRpc } from "@stellar/stellar-sdk";
import { prisma } from "../../lib/db.js";
import { logger } from "../../logger.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { execFile } from "child_process";

const router = Router();

// ── Constants ─────────────────────────────────────────────────────────────────

/** Ledger lag threshold that triggers STALLED status and CRITICAL alert. */
const STALL_THRESHOLD = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derives the sync status from the ledger lag.
 *
 * LOCKED  – indexer has never processed a ledger (cold start / DB empty)
 * STALLED – lag exceeds STALL_THRESHOLD (indexer is falling behind)
 * SYNCING – lag is within acceptable range
 */
function deriveStatus(currentLedger: number, lag: number): "SYNCING" | "LOCKED" | "STALLED" {
  if (currentLedger === 0) return "LOCKED";
  if (lag > STALL_THRESHOLD) return "STALLED";
  return "SYNCING";
}

/**
 * Fires a system-level `wall` broadcast on Ubuntu so any logged-in
 * terminal session sees the alert immediately.  Non-blocking — failures
 * are swallowed so they never affect the HTTP response.
 */
function broadcastSystemAlert(message: string): void {
  execFile("wall", [message], (err: Error | null) => {
    if (err) {
      // `wall` may not be available in all environments (e.g. Docker without tty).
      // Log at debug level so it doesn't pollute production error streams.
      logger.debug("[HealthCheck] wall broadcast unavailable", { err: err.message });
    }
  });
}

// ── Route ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/v2/health
 */
router.get(
  "/health",
  asyncHandler(async (_req: Request, res: Response) => {
    const rpcUrl = process.env.STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";

    const rpc = new SorobanRpc.Server(rpcUrl, {
      allowHttp: rpcUrl.startsWith("http://"),
    });

    // Run DB and RPC queries in parallel to minimise latency.
    const [syncState, latestLedgerInfo] = await Promise.all([
      prisma.syncState.findUnique({ where: { id: 1 } }),
      rpc.getLatestLedger(),
    ]);

    const currentLedger = syncState?.lastLedgerSequence ?? 0;
    const networkLedger = latestLedgerInfo.sequence;
    const lag = Math.max(0, networkLedger - currentLedger);
    const status = deriveStatus(currentLedger, lag);

    // ── Alerting ──────────────────────────────────────────────────────────────
    if (lag > STALL_THRESHOLD) {
      const alertMsg =
        `[StellarStream] CRITICAL: Indexer lag is ${lag} ledgers ` +
        `(current=${currentLedger}, network=${networkLedger}). ` +
        `Threshold is ${STALL_THRESHOLD}.`;

      logger.error(alertMsg, {
        level: "CRITICAL",
        current_ledger: currentLedger,
        network_ledger: networkLedger,
        lag,
        status,
      });

      broadcastSystemAlert(alertMsg);
    }

    // ── Memory snapshot ───────────────────────────────────────────────────────
    const mem = process.memoryUsage();

    res.json({
      current_ledger: currentLedger,
      network_ledger: networkLedger,
      lag,
      status,
      memory: {
        rss_bytes: mem.rss,
        heap_used_bytes: mem.heapUsed,
        heap_total_bytes: mem.heapTotal,
        external_bytes: mem.external,
      },
      uptime_seconds: Math.floor(process.uptime()),
    });
  }),
);

export default router;
