/**
 * Bridge Observer Service - Monitors cross-chain bridge transfers
 * Tracks Axelar/Allbridge events and updates stream status
 */

import { prisma } from '../lib/db.js';
import { logger } from '../logger.js';
import { WebSocketService } from './websocket.service.js';

export interface BridgeTransferEvent {
  bridge: 'axelar' | 'allbridge';
  sourceChain: string;
  targetChain: string;
  sourceAsset: string;
  targetAsset: string;
  amount: string;
  sender: string;
  recipient: string;
  txHash: string;
  sourceChainTxHash: string;
}

export class BridgeObserverService {
  private pollInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 30000; // 30 seconds

  constructor(private wsService: WebSocketService) {}

  /**
   * Start monitoring bridge transfers
   */
  start(): void {
    if (this.pollInterval) {
      logger.warn('Bridge observer already running');
      return;
    }

    logger.info('Starting bridge observer');
    this.pollInterval = setInterval(() => this.checkPendingBridges(), this.POLL_INTERVAL_MS);
    // Run immediately on start
    this.checkPendingBridges().catch((err) =>
      logger.error('Initial bridge check failed', err)
    );
  }

  /**
   * Stop monitoring bridge transfers
   */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      logger.info('Bridge observer stopped');
    }
  }

  /**
   * Check pending bridge transfers and update status
   */
  private async checkPendingBridges(): Promise<void> {
    try {
      const pendingBridges = await prisma.bridgeLog.findMany({
        where: { status: 'PENDING_BRIDGE' },
      });

      for (const bridge of pendingBridges) {
        await this.updateBridgeStatus(bridge);
      }
    } catch (error) {
      logger.error('Failed to check pending bridges', error);
    }
  }

  /**
   * Update bridge transfer status based on source chain confirmation
   */
  private async updateBridgeStatus(
    bridge: {
      id: string;
      bridge: string;
      sourceChain: string;
      targetChain: string;
      recipient: string;
      txHash: string;
      payload: string | null;
    }
  ): Promise<void> {
    try {
      // In production, query the source chain RPC to verify transaction finality
      // For now, simulate with a timeout-based approach
      const createdAt = new Date(bridge.id);
      const ageMs = Date.now() - createdAt.getTime();
      const CONFIRMATION_TIME_MS = 60000; // 1 minute

      if (ageMs < CONFIRMATION_TIME_MS) {
        return; // Still waiting for confirmation
      }

      // Simulate successful bridge completion
      // In production: query Axelar/Allbridge API or source chain RPC
      const isConfirmed = Math.random() > 0.05; // 95% success rate for demo

      if (isConfirmed) {
        // Update bridge log status
        await prisma.bridgeLog.update({
          where: { id: bridge.id },
          data: {
            status: 'ACTIVE',
            landedAt: new Date(),
          },
        });

        // Update associated stream status if exists
        const payload = bridge.payload ? JSON.parse(bridge.payload) : {};
        if (payload.streamId) {
          await prisma.stream.update({
            where: { streamId: payload.streamId },
            data: { status: 'ACTIVE' },
          });

          // Notify recipient
          this.wsService.emitNewStream(bridge.recipient, {
            streamId: payload.streamId,
            sender: payload.sender || 'unknown',
            receiver: bridge.recipient,
            amount: payload.amount,
            status: 'bridge_completed',
            timestamp: new Date().toISOString(),
          });
        }

        logger.info('Bridge transfer confirmed', {
          bridgeId: bridge.id,
          sourceChain: bridge.sourceChain,
          targetChain: bridge.targetChain,
        });
      } else {
        // Mark as failed
        await prisma.bridgeLog.update({
          where: { id: bridge.id },
          data: { status: 'BRIDGE_FAILED' },
        });

        // Notify recipient of failure
        const payload = bridge.payload ? JSON.parse(bridge.payload) : {};
        if (payload.streamId) {
          this.wsService.emitNewStream(bridge.recipient, {
            streamId: payload.streamId,
            sender: payload.sender || 'unknown',
            receiver: bridge.recipient,
            status: 'bridge_failed',
            timestamp: new Date().toISOString(),
          });
        }

        logger.warn('Bridge transfer failed', {
          bridgeId: bridge.id,
          sourceChain: bridge.sourceChain,
        });
      }
    } catch (error) {
      logger.error('Failed to update bridge status', error, {
        bridgeId: bridge.id,
      });
    }
  }

  /**
   * Log a new bridge transfer event
   */
  async logBridgeTransfer(event: BridgeTransferEvent): Promise<void> {
    try {
      await prisma.bridgeLog.create({
        data: {
          bridge: event.bridge,
          eventType: 'transfer_initiated',
          sourceChain: event.sourceChain,
          targetChain: event.targetChain,
          sourceAsset: event.sourceAsset,
          targetAsset: event.targetAsset,
          amount: event.amount,
          sender: event.sender,
          recipient: event.recipient,
          txHash: event.txHash,
          status: 'PENDING_BRIDGE',
          payload: JSON.stringify({
            sourceChainTxHash: event.sourceChainTxHash,
          }),
        },
      });

      logger.info('Bridge transfer logged', {
        bridge: event.bridge,
        sourceChain: event.sourceChain,
        txHash: event.txHash,
      });
    } catch (error) {
      logger.error('Failed to log bridge transfer', error, {
        txHash: event.txHash,
      });
    }
  }
}
