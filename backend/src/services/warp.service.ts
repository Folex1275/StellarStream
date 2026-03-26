/**
 * Warp Service - Real-Time Push Notifications via Socket.io
 * Broadcasts on-chain events to connected clients in real-time
 */

import { WebSocketService } from './websocket.service.js';
import { logger } from '../logger.js';

export interface WarpEventPayload {
  streamId: string;
  eventType: 'create' | 'withdraw' | 'cancel' | 'topup' | 'edit';
  sender: string;
  receiver: string;
  amount?: string;
  asset?: string;
  txHash: string;
  ledger: number;
  timestamp: string;
}

export class WarpService {
  constructor(private wsService: WebSocketService) {}

  /**
   * Broadcast a new transaction event to relevant users
   * Emits to both sender and receiver rooms
   */
  broadcastTransaction(payload: WarpEventPayload): void {
    try {
      // Emit to sender's room
      this.wsService.emitNewStream(payload.sender, {
        streamId: payload.streamId,
        sender: payload.sender,
        receiver: payload.receiver,
        amount: payload.amount,
        status: payload.eventType,
        timestamp: payload.timestamp,
      });

      // Emit to receiver's room
      this.wsService.emitNewStream(payload.receiver, {
        streamId: payload.streamId,
        sender: payload.sender,
        receiver: payload.receiver,
        amount: payload.amount,
        status: payload.eventType,
        timestamp: payload.timestamp,
      });

      logger.info('Warp event broadcasted', {
        streamId: payload.streamId,
        eventType: payload.eventType,
        txHash: payload.txHash,
      });
    } catch (error) {
      logger.error('Failed to broadcast warp event', error, {
        streamId: payload.streamId,
      });
    }
  }

  /**
   * Broadcast balance update to a specific user
   */
  broadcastBalanceUpdate(userAddress: string, newBalance: string): void {
    try {
      this.wsService.emitBalanceUpdate(userAddress, {
        address: userAddress,
        newBalance,
        timestamp: new Date().toISOString(),
      });

      logger.info('Balance update broadcasted', {
        userAddress,
        newBalance,
      });
    } catch (error) {
      logger.error('Failed to broadcast balance update', error, {
        userAddress,
      });
    }
  }
}
