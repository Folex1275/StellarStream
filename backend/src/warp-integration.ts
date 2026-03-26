/**
 * Warp Integration Hook
 * Connects the Warp service to the event ingestion pipeline
 * Broadcasts on-chain events to connected WebSocket clients in real-time
 */

import { WarpService } from './services/warp.service.js';
import { logger } from './logger.js';

export interface WarpIntegrationConfig {
  warpService: WarpService;
}

/**
 * Hook into the event ingestion pipeline to broadcast events via Warp
 * Call this after an event has been successfully logged to the audit log
 */
export function broadcastEventViaWarp(
  warpService: WarpService,
  eventData: {
    streamId: string;
    eventType: 'create' | 'withdraw' | 'cancel' | 'topup' | 'edit';
    sender: string;
    receiver: string;
    amount?: string;
    asset?: string;
    txHash: string;
    ledger: number;
    ledgerClosedAt: string;
  }
): void {
  try {
    warpService.broadcastTransaction({
      streamId: eventData.streamId,
      eventType: eventData.eventType,
      sender: eventData.sender,
      receiver: eventData.receiver,
      amount: eventData.amount,
      asset: eventData.asset,
      txHash: eventData.txHash,
      ledger: eventData.ledger,
      timestamp: eventData.ledgerClosedAt,
    });
  } catch (error) {
    logger.error('Failed to broadcast event via Warp', error, {
      streamId: eventData.streamId,
      eventType: eventData.eventType,
    });
  }
}
