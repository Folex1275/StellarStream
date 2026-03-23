/**
 * Indexer integration tests
 *
 * Simulates Soroban contract events from the Stellar RPC and verifies
 * that the indexer correctly parses and persists them via the lifecycle service.
 *
 * Strategy:
 *  - Inject a mock SorobanRpc.Server via the EventWatcher deps parameter
 *    so no real network calls are made.
 *  - Inject a hand-built mock StreamLifecycleService to intercept DB writes
 *    (analogous to mocking a Prisma client create / upsert calls).
 *  - Drive the watcher through a single poll cycle and assert the correct
 *    service method was called with the expected payload.
 *
 * No module-level mocking is needed because EventWatcher accepts both
 * dependencies via its constructor deps parameter.
 */

import { jest } from "@jest/globals";
import { SorobanRpc, xdr } from "@stellar/stellar-sdk";
import { EventWatcher } from "../event-watcher.js";
import type { StreamLifecycleService } from "../services/stream-lifecycle-service.js";
import type { EventWatcherConfig } from "../types.js";

// ─── XDR helpers ─────────────────────────────────────────────────────────────

function sym(s: string): xdr.ScVal {
  return xdr.ScVal.scvSymbol(Buffer.from(s));
}

function u64(n: bigint): xdr.ScVal {
  return xdr.ScVal.scvU64(new xdr.Uint64(Number(n)));
}

function str(s: string): xdr.ScVal {
  return xdr.ScVal.scvString(Buffer.from(s));
}

function scMap(entries: Record<string, xdr.ScVal>): xdr.ScVal {
  return xdr.ScVal.scvMap(
    Object.entries(entries).map(
      ([k, v]) => new xdr.ScMapEntry({ key: sym(k), val: v })
    )
  );
}

// ─── Mock event builders ──────────────────────────────────────────────────────

function buildStreamCreatedEvent(): SorobanRpc.Api.EventResponse {
  return {
    id: "event-001",
    type: "contract",
    ledger: 500,
    ledgerClosedAt: "2024-01-01T00:00:00Z",
    contractId: "CTEST_CONTRACT_ID_000000000000000000000000000000000000000",
    topic: [sym("stream_created")],
    value: scMap({
      stream_id: u64(42n),
      sender: str("GABC1234SENDER"),
      receiver: str("GXYZ5678RECEIVER"),
      total_amount: u64(1_000_000n),
      timestamp: u64(1_700_000_000n),
    }),
    inSuccessfulContractCall: true,
    pagingToken: "token-001",
  } as unknown as SorobanRpc.Api.EventResponse;
}

function buildStreamWithdrawnEvent(): SorobanRpc.Api.EventResponse {
  return {
    id: "event-002",
    type: "contract",
    ledger: 510,
    ledgerClosedAt: "2024-01-01T01:00:00Z",
    contractId: "CTEST_CONTRACT_ID_000000000000000000000000000000000000000",
    topic: [sym("claim")],
    value: scMap({
      stream_id: u64(42n),
      amount: u64(250_000n),
    }),
    inSuccessfulContractCall: true,
    pagingToken: "token-002",
  } as unknown as SorobanRpc.Api.EventResponse;
}

function buildStreamCancelledEvent(): SorobanRpc.Api.EventResponse {
  return {
    id: "event-003",
    type: "contract",
    ledger: 520,
    ledgerClosedAt: "2024-01-01T02:00:00Z",
    contractId: "CTEST_CONTRACT_ID_000000000000000000000000000000000000000",
    topic: [sym("cancel")],
    value: scMap({
      stream_id: u64(42n),
      to_receiver: u64(250_000n),
      to_sender: u64(750_000n),
      timestamp: u64(1_700_003_600n),
    }),
    inSuccessfulContractCall: true,
    pagingToken: "token-003",
  } as unknown as SorobanRpc.Api.EventResponse;
}

// ─── Test config ──────────────────────────────────────────────────────────────

const TEST_CONFIG: EventWatcherConfig = {
  rpcUrl: "http://localhost:8000",
  networkPassphrase: "Test SDF Network ; September 2015",
  contractId: "CTEST_CONTRACT_ID_000000000000000000000000000000000000000",
  pollIntervalMs: 5000,
  maxRetries: 3,
  retryDelayMs: 1000,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("EventWatcher - indexer integration", () => {
  let mockServer: {
    getLatestLedger: jest.Mock<() => Promise<SorobanRpc.Api.GetLatestLedgerResponse>>;
    getEvents: jest.Mock<() => Promise<SorobanRpc.Api.GetEventsResponse>>;
  };
  let mockService: jest.Mocked<StreamLifecycleService>;

  beforeEach(() => {
    mockServer = {
      getLatestLedger: (jest.fn() as jest.Mock<() => Promise<SorobanRpc.Api.GetLatestLedgerResponse>>).mockResolvedValue({
        id: "ledger-id",
        sequence: 499,
        protocolVersion: "20",
      }),
      getEvents: jest.fn() as jest.Mock<() => Promise<SorobanRpc.Api.GetEventsResponse>>,
    };

    mockService = {
      upsertCreatedStream: (jest.fn() as jest.Mock<() => Promise<void>>).mockResolvedValue(undefined),
      registerWithdrawal: (jest.fn() as jest.Mock<() => Promise<void>>).mockResolvedValue(undefined),
      cancelStream: (jest.fn() as jest.Mock<() => Promise<{
        streamId: string;
        originalTotalAmount: bigint;
        finalStreamedAmount: bigint;
        remainingUnstreamedAmount: bigint;
        closedAtIso: string;
      }>>) .mockResolvedValue({
        streamId: "42",
        originalTotalAmount: 1_000_000n,
        finalStreamedAmount: 250_000n,
        remainingUnstreamedAmount: 750_000n,
        closedAtIso: "2024-01-01T02:00:00Z",
      }),
    } as unknown as jest.Mocked<StreamLifecycleService>;
  });

  async function runOnePollCycle(events: SorobanRpc.Api.EventResponse[]): Promise<void> {
    mockServer.getEvents.mockResolvedValueOnce({ latestLedger: 600, events });
    const watcher = new EventWatcher(TEST_CONFIG, {
      server: mockServer as unknown as SorobanRpc.Server,
      streamLifecycleService: mockService,
    });
    type Private = { fetchAndProcessEvents: () => Promise<void> };
    await (watcher as unknown as Private).fetchAndProcessEvents();
  }

  describe("stream_created event", () => {
    it("calls upsertCreatedStream with the correct payload", async () => {
      await runOnePollCycle([buildStreamCreatedEvent()]);

      expect(mockService.upsertCreatedStream).toHaveBeenCalledTimes(1);
      expect(mockService.upsertCreatedStream).toHaveBeenCalledWith(
        expect.objectContaining({
          streamId: "42",
          txHash: "event-001",
          sender: "GABC1234SENDER",
          receiver: "GXYZ5678RECEIVER",
          totalAmount: 1_000_000n,
          ledger: 500,
        })
      );
    });

    it("does NOT call registerWithdrawal or cancelStream", async () => {
      await runOnePollCycle([buildStreamCreatedEvent()]);
      expect(mockService.registerWithdrawal).not.toHaveBeenCalled();
      expect(mockService.cancelStream).not.toHaveBeenCalled();
    });
  });

  describe("claim (stream_withdrawn) event", () => {
    it("calls registerWithdrawal with the correct payload", async () => {
      await runOnePollCycle([buildStreamWithdrawnEvent()]);

      expect(mockService.registerWithdrawal).toHaveBeenCalledTimes(1);
      expect(mockService.registerWithdrawal).toHaveBeenCalledWith(
        expect.objectContaining({
          streamId: "42",
          amount: 250_000n,
          ledger: 510,
        })
      );
    });

    it("does NOT call upsertCreatedStream or cancelStream", async () => {
      await runOnePollCycle([buildStreamWithdrawnEvent()]);
      expect(mockService.upsertCreatedStream).not.toHaveBeenCalled();
      expect(mockService.cancelStream).not.toHaveBeenCalled();
    });
  });

  describe("cancel (stream_cancelled) event", () => {
    it("calls cancelStream with the correct payload", async () => {
      await runOnePollCycle([buildStreamCancelledEvent()]);

      expect(mockService.cancelStream).toHaveBeenCalledTimes(1);
      expect(mockService.cancelStream).toHaveBeenCalledWith(
        expect.objectContaining({
          streamId: "42",
          toReceiver: 250_000n,
          toSender: 750_000n,
          ledger: 520,
        })
      );
    });

    it("does NOT call upsertCreatedStream or registerWithdrawal", async () => {
      await runOnePollCycle([buildStreamCancelledEvent()]);
      expect(mockService.upsertCreatedStream).not.toHaveBeenCalled();
      expect(mockService.registerWithdrawal).not.toHaveBeenCalled();
    });
  });

  describe("multiple events in a single poll", () => {
    it("processes all three event types in order", async () => {
      await runOnePollCycle([
        buildStreamCreatedEvent(),
        buildStreamWithdrawnEvent(),
        buildStreamCancelledEvent(),
      ]);

      expect(mockService.upsertCreatedStream).toHaveBeenCalledTimes(1);
      expect(mockService.registerWithdrawal).toHaveBeenCalledTimes(1);
      expect(mockService.cancelStream).toHaveBeenCalledTimes(1);
    });
  });

  describe("empty poll response", () => {
    it("does not call any service method when there are no events", async () => {
      mockServer.getLatestLedger.mockResolvedValue({ id: "l", sequence: 600, protocolVersion: "20" });
      mockServer.getEvents.mockResolvedValueOnce({ latestLedger: 600, events: [] });

      const watcher = new EventWatcher(TEST_CONFIG, {
        server: mockServer as unknown as SorobanRpc.Server,
        streamLifecycleService: mockService,
      });
      type Private = { fetchAndProcessEvents: () => Promise<void> };
      await (watcher as unknown as Private).fetchAndProcessEvents();

      expect(mockService.upsertCreatedStream).not.toHaveBeenCalled();
      expect(mockService.registerWithdrawal).not.toHaveBeenCalled();
      expect(mockService.cancelStream).not.toHaveBeenCalled();
    });
  });

  describe("malformed / unparseable event", () => {
    it("skips the event gracefully without throwing", async () => {
      const badEvent = {
        id: "bad-event",
        type: "contract",
        ledger: 530,
        ledgerClosedAt: "2024-01-01T03:00:00Z",
        contractId: "CTEST",
        topic: null,
        value: null,
        inSuccessfulContractCall: false,
        pagingToken: "token-bad",
      } as unknown as SorobanRpc.Api.EventResponse;

      await expect(runOnePollCycle([badEvent])).resolves.not.toThrow();

      expect(mockService.upsertCreatedStream).not.toHaveBeenCalled();
      expect(mockService.registerWithdrawal).not.toHaveBeenCalled();
      expect(mockService.cancelStream).not.toHaveBeenCalled();
    });
  });
});
