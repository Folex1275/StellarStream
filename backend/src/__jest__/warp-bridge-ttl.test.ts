/**
 * Integration tests for Warp, Bridge Observer, and TTL Monitor services
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { WarpService } from '../services/warp.service';
import { BridgeObserverService } from '../services/bridge-observer.service';
import { TTLArchivalMonitorService } from '../services/ttl-archival-monitor.service';
import { WebSocketService } from '../services/websocket.service';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

describe('Warp Service', () => {
  let warpService: WarpService;
  let wsService: WebSocketService;
  let io: SocketIOServer;

  beforeEach(() => {
    const httpServer = createServer();
    io = new SocketIOServer(httpServer);
    wsService = new WebSocketService(io);
    warpService = new WarpService(wsService);
  });

  afterEach(() => {
    io.close();
  });

  it('should broadcast transaction to sender and receiver', () => {
    const emitSpy = jest.spyOn(wsService, 'emitNewStream');

    warpService.broadcastTransaction({
      streamId: 'stream-123',
      eventType: 'withdraw',
      sender: 'GSENDER...',
      receiver: 'GRECEIVER...',
      amount: '1000000',
      asset: 'USDC',
      txHash: 'tx-hash-123',
      ledger: 50000000,
      timestamp: new Date().toISOString(),
    });

    expect(emitSpy).toHaveBeenCalledTimes(2);
    expect(emitSpy).toHaveBeenCalledWith(
      'GSENDER...',
      expect.objectContaining({
        streamId: 'stream-123',
        status: 'withdraw',
      })
    );
    expect(emitSpy).toHaveBeenCalledWith(
      'GRECEIVER...',
      expect.objectContaining({
        streamId: 'stream-123',
        status: 'withdraw',
      })
    );
  });

  it('should broadcast balance update', () => {
    const emitSpy = jest.spyOn(wsService, 'emitBalanceUpdate');

    warpService.broadcastBalanceUpdate('GUSER...', '5000000');

    expect(emitSpy).toHaveBeenCalledWith(
      'GUSER...',
      expect.objectContaining({
        address: 'GUSER...',
        newBalance: '5000000',
      })
    );
  });
});

describe('Bridge Observer Service', () => {
  let bridgeObserver: BridgeObserverService;
  let wsService: WebSocketService;
  let io: SocketIOServer;

  beforeEach(() => {
    const httpServer = createServer();
    io = new SocketIOServer(httpServer);
    wsService = new WebSocketService(io);
    bridgeObserver = new BridgeObserverService(wsService);
  });

  afterEach(() => {
    bridgeObserver.stop();
    io.close();
  });

  it('should start and stop polling', () => {
    expect(() => bridgeObserver.start()).not.toThrow();
    expect(() => bridgeObserver.stop()).not.toThrow();
  });

  it('should log bridge transfer', async () => {
    await expect(
      bridgeObserver.logBridgeTransfer({
        bridge: 'axelar',
        sourceChain: 'ethereum',
        targetChain: 'stellar',
        sourceAsset: '0xUSDC...',
        targetAsset: 'USDC:...',
        amount: '1000000000',
        sender: '0x...',
        recipient: 'GXXXXXX...',
        txHash: 'stellar-tx-hash',
        sourceChainTxHash: 'ethereum-tx-hash',
      })
    ).resolves.not.toThrow();
  });

  it('should handle bridge observer errors gracefully', async () => {
    const logSpy = jest.spyOn(console, 'error').mockImplementation();

    // Start observer (will attempt to check pending bridges)
    bridgeObserver.start();

    // Wait for first poll
    await new Promise((resolve) => setTimeout(resolve, 100));

    bridgeObserver.stop();
    logSpy.mockRestore();
  });
});

describe('TTL Archival Monitor Service', () => {
  let ttlMonitor: TTLArchivalMonitorService;
  let wsService: WebSocketService;
  let io: SocketIOServer;

  beforeEach(() => {
    const httpServer = createServer();
    io = new SocketIOServer(httpServer);
    wsService = new WebSocketService(io);
    ttlMonitor = new TTLArchivalMonitorService(wsService);
  });

  afterEach(() => {
    ttlMonitor.stop();
    io.close();
  });

  it('should start and stop monitoring', () => {
    expect(() => ttlMonitor.start()).not.toThrow();
    expect(() => ttlMonitor.stop()).not.toThrow();
  });

  it('should handle TTL monitor errors gracefully', async () => {
    const logSpy = jest.spyOn(console, 'error').mockImplementation();

    ttlMonitor.start();

    // Wait for first poll
    await new Promise((resolve) => setTimeout(resolve, 100));

    ttlMonitor.stop();
    logSpy.mockRestore();
  });

  it('should not start multiple instances', () => {
    ttlMonitor.start();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    ttlMonitor.start(); // Should warn

    expect(warnSpy).toHaveBeenCalled();
    ttlMonitor.stop();
    warnSpy.mockRestore();
  });
});

describe('WebSocket Service Integration', () => {
  let wsService: WebSocketService;
  let io: SocketIOServer;

  beforeEach(() => {
    const httpServer = createServer();
    io = new SocketIOServer(httpServer);
    wsService = new WebSocketService(io);
  });

  afterEach(() => {
    io.close();
  });

  it('should track connected users', () => {
    expect(wsService.getConnectedUsers()).toEqual([]);
  });

  it('should emit new stream events', () => {
    const emitSpy = jest.spyOn(io, 'to');

    wsService.emitNewStream('GUSER...', {
      streamId: 'stream-123',
      sender: 'GSENDER...',
      receiver: 'GRECEIVER...',
      status: 'create',
      timestamp: new Date().toISOString(),
    });

    expect(emitSpy).toHaveBeenCalledWith('stream-GUSER...');
  });

  it('should emit balance updates', () => {
    const emitSpy = jest.spyOn(io, 'to');

    wsService.emitBalanceUpdate('GUSER...', {
      address: 'GUSER...',
      newBalance: '5000000',
      timestamp: new Date().toISOString(),
    });

    expect(emitSpy).toHaveBeenCalledWith('stream-GUSER...');
  });

  it('should broadcast to all clients', () => {
    const emitSpy = jest.spyOn(io, 'emit');

    wsService.broadcastToAll('test-event', { data: 'test' });

    expect(emitSpy).toHaveBeenCalledWith('test-event', { data: 'test' });
  });
});
