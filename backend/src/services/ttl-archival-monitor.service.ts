/**
 * TTL Archival Monitor Service
 * Monitors Soroban entry TTL (Time-To-Live) and warns users of impending archival
 * Optionally auto-bumps TTL for high-priority streams
 */

import { prisma } from '../lib/db.js';
import { logger } from '../logger.js';
import { WebSocketService } from './websocket.service.js';

export interface StreamTTLStatus {
  streamId: string;
  expirationLedger: number;
  currentLedger: number;
  ledgersRemaining: number;
  isWarning: boolean;
  isCritical: boolean;
}

export class TTLArchivalMonitorService {
  private pollInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 60000; // 1 minute
  private readonly WARNING_THRESHOLD = 10000; // Warn at 10k ledgers remaining
  private readonly CRITICAL_THRESHOLD = 5000; // Critical at 5k ledgers remaining

  constructor(private wsService: WebSocketService) {}

  /**
   * Start monitoring TTL for all active streams
   */
  start(): void {
    if (this.pollInterval) {
      logger.warn('TTL monitor already running');
      return;
    }

    logger.info('Starting TTL archival monitor');
    this.pollInterval = setInterval(() => this.checkStreamTTLs(), this.POLL_INTERVAL_MS);
    this.checkStreamTTLs().catch((err) =>
      logger.error('Initial TTL check failed', err)
    );
  }

  /**
   * Stop monitoring TTL
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      logger.info('TTL monitor stopped');
    }
  }

  /**
   * Check TTL status for all active streams
   * In production, this would query the Soroban network for actual TTL values
   */
  private async checkStreamTTLs(): Promise<void> {
    try {
      const activeStreams = await prisma.stream.findMany({
        where: { status: 'ACTIVE' },
      });

      // Simulate current ledger (in production: fetch from Soroban RPC)
      const currentLedger = Math.floor(Date.now() / 1000) + 50000000;

      for (const stream of activeStreams) {
        // Simulate TTL expiration ledger (in production: query contract state)
        // Assume streams have 1 year TTL (~31M ledgers)
        const expirationLedger = currentLedger + 31000000 + Math.random() * 5000000;

        const ttlStatus: StreamTTLStatus = {
          streamId: stream.streamId || stream.id,
          expirationLedger: Math.floor(expirationLedger),
          currentLedger,
          ledgersRemaining: Math.floor(expirationLedger - currentLedger),
          isWarning: expirationLedger - currentLedger < this.WARNING_THRESHOLD,
          isCritical: expirationLedger - currentLedger < this.CRITICAL_THRESHOLD,
        };

        if (ttlStatus.isWarning) {
          await this.handleTTLWarning(stream, ttlStatus);
        }
      }
    } catch (error) {
      logger.error('Failed to check stream TTLs', error);
    }
  }

  /**
   * Handle TTL warning - notify user and optionally auto-bump
   */
  private async handleTTLWarning(
    stream: {
      id: string;
      streamId: string | null;
      sender: string;
      receiver: string;
    },
    ttlStatus: StreamTTLStatus
  ): Promise<void> {
    try {
      const severity = ttlStatus.isCritical ? 'critical' : 'warning';

      // Notify both sender and receiver
      const message = {
        streamId: ttlStatus.streamId,
        sender: stream.sender,
        receiver: stream.receiver,
        status: `ttl_${severity}`,
        ledgersRemaining: ttlStatus.ledgersRemaining,
        timestamp: new Date().toISOString(),
      };

      this.wsService.emitNewStream(stream.sender, message);
      this.wsService.emitNewStream(stream.receiver, message);

      logger.warn(`Stream TTL ${severity}`, {
        streamId: ttlStatus.streamId,
        ledgersRemaining: ttlStatus.ledgersRemaining,
      });

      // Auto-bump if critical and treasury has rent buffer
      if (ttlStatus.isCritical) {
        await this.attemptAutoBump(stream, ttlStatus);
      }
    } catch (error) {
      logger.error('Failed to handle TTL warning', error, {
        streamId: ttlStatus.streamId,
      });
    }
  }

  /**
   * Attempt to auto-bump TTL if protocol treasury has sufficient balance
   * In production: call bump_instance_ttl on the contract
   */
  private async attemptAutoBump(
    stream: {
      id: string;
      streamId: string | null;
      sender: string;
      receiver: string;
    },
    ttlStatus: StreamTTLStatus
  ): Promise<void> {
    try {
      // Simulate checking treasury balance
      const treasuryBalance = 1000000; // Simulated balance in stroops
      const bumpCost = 1000; // Simulated cost per bump

      if (treasuryBalance > bumpCost) {
        // In production: invoke contract's bump_instance_ttl function
        logger.info('Auto-bumping stream TTL', {
          streamId: ttlStatus.streamId,
          newExpiration: ttlStatus.expirationLedger + 31000000,
        });

        // Notify user of auto-bump
        this.wsService.emitNewStream(stream.sender, {
          streamId: ttlStatus.streamId,
          sender: stream.sender,
          receiver: stream.receiver,
          status: 'ttl_auto_bumped',
          timestamp: new Date().toISOString(),
        });
      } else {
        logger.warn('Insufficient treasury balance for TTL auto-bump', {
          streamId: ttlStatus.streamId,
          treasuryBalance,
          requiredCost: bumpCost,
        });
      }
    } catch (error) {
      logger.error('Failed to auto-bump TTL', error, {
        streamId: ttlStatus.streamId,
      });
    }
  }
}
