/**
 * Indexer integration tests
 *
 * Simulates Soroban contract events (stream_created, stream_withdrawn,
 * stream_cancelled) and verifies that the indexer correctly persists
 * them to the DB via AuditLogService → prisma.eventLog.create.
 *
 * Strategy:
 *  - Mock `../generated/client/index.js` so no real DB connection is needed.
 *  - Build real XDR ScVal objects via @stellar/stellar-sdk to exercise the
 *    actual parseContractEvent / parseScVal code paths.
 *  - Inject the mock PrismaClient into AuditLogService via module mocking.
 */

import { xdr, nativeToScVal } from "@stellar/stellar-sdk";

// ─── Mock Prisma before any service imports ───────────────────────────────────
const mockEventLogUpsert = jest.fn().mockResolvedValue({ id: "mock-id" });
const mockEventLogFindMany = jest.fn().mockResolvedValue([]);
const mockEventLogFindFirst = jest.fn().mockResolvedValue(null);

jest.mock("../lib/db.js", () => {
  return {
    prisma: {
      eventLog: {
        upsert: mockEventLogUpsert,
        findMany: mockEventLogFindMany,
        findFirst: mockEventLogFindFirst,
      },
    },
  };
});

// Mock Sentry so XDR parse errors don't blow up in tests
jest.mock("@sentry/node", () => ({
  withScope: jest.fn(),
  captureException: jest.fn(),
  init: jest.fn(),
}));

// ─── Imports (after mocks are registered) ────────────────────────────────────
import { parseContractEvent } from "../event-parser.js";
import { AuditLogService } from "../services/audit-log.service.js";
import type { SorobanRpc } from "@stellar/stellar-sdk";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a minimal SorobanRpc.Api.EventResponse-shaped object.
 * `topic` and `value` are real XDR ScVal instances so parseContractEvent
 * exercises the actual XDR decode path.
 */
function buildRawEvent(
  overrides: Partial<{
    id: string;
    type: string;
    ledger: number;
    ledgerClosedAt: string;
    contractId: string;
    txHash: string;
    topic: xdr.ScVal[];
    value: xdr.ScVal;
    inSuccessfulContractCall: boolean;
  }> = {}
): SorobanRpc.Api.EventResponse {
  return {
    id: overrides.id ?? "event-001",
    type: (overrides.type ?? "contract") as SorobanRpc.Api.EventResponse["type"],
    ledger: overrides.ledger ?? 1000,
    ledgerClosedAt: overrides.ledgerClosedAt ?? "2025-01-01T00:00:00Z",
    contractId: overrides.contractId ?? "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
    txHash: overrides.txHash ?? "abc123txhash",
    topic: overrides.topic ?? [nativeToScVal("stream_created", { type: "symbol" })],
    value: overrides.value ?? nativeToScVal(null),
    inSuccessfulContractCall: overrides.inSuccessfulContractCall ?? true,
    pagingToken: "0",
  } as unknown as SorobanRpc.Api.EventResponse;
}

/**
 * Build an scvMap ScVal from a plain JS object (string keys, mixed values).
 * This mirrors what the Soroban contract emits as the event payload.
 */
function buildMapScVal(data: Record<string, unknown>): xdr.ScVal {
  return nativeToScVal(data, { type: "map" });
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("Indexer — Soroban event parsing and DB persistence", () => {
  let auditLogService: AuditLogService;

  beforeEach(() => {
    jest.clearAllMocks();
    auditLogService = new AuditLogService();
  });

  // ── parseContractEvent ────────────────────────────────────────────────────

  describe("parseContractEvent()", () => {
    it("parses a stream_created event into a structured ParsedContractEvent", () => {
      const payload = buildMapScVal({
        stream_id: 42,
        sender: "GALICESENDERADDRESS",
        receiver: "GBOBRECEIVER",
        total_amount: 5000000000,
      });

      const raw = buildRawEvent({
        id: "evt-create-1",
        ledger: 1234,
        ledgerClosedAt: "2025-06-01T12:00:00Z",
        txHash: "txhash_create_001",
        topic: [
          nativeToScVal("stream_created", { type: "symbol" }),
          // Sender is encoded as a symbol in the topic (account addresses
          // are not valid for nativeToScVal address type in this SDK version)
          nativeToScVal("GALICESENDERADDRESS", { type: "symbol" }),
        ],
        value: payload,
      });

      const parsed = parseContractEvent(raw);

      expect(parsed).not.toBeNull();
      expect(parsed!.id).toBe("evt-create-1");
      expect(parsed!.ledger).toBe(1234);
      expect(parsed!.txHash).toBe("txhash_create_001");
      expect(parsed!.ledgerClosedAt).toBe("2025-06-01T12:00:00Z");
      expect(parsed!.inSuccessfulContractCall).toBe(true);
      // topics are base64-encoded XDR strings
      expect(Array.isArray(parsed!.topics)).toBe(true);
      expect(parsed!.topics.length).toBe(2);
      // value is decoded from the scvMap
      expect(typeof parsed!.value).toBe("object");
    });

    it("parses a stream_withdrawn event correctly", () => {
      const payload = buildMapScVal({ stream_id: 42, amount: 1000000 });

      const raw = buildRawEvent({
        id: "evt-withdraw-1",
        txHash: "txhash_withdraw_001",
        topic: [nativeToScVal("stream_withdrawn", { type: "symbol" })],
        value: payload,
      });

      const parsed = parseContractEvent(raw);

      expect(parsed).not.toBeNull();
      expect(parsed!.txHash).toBe("txhash_withdraw_001");
      const value = parsed!.value as Record<string, unknown>;
      expect(value).toHaveProperty("stream_id");
      expect(value).toHaveProperty("amount");
    });

    it("parses a stream_cancelled event correctly", () => {
      const payload = buildMapScVal({
        stream_id: 7,
        to_receiver: 800000,
        to_sender: 200000,
      });

      const raw = buildRawEvent({
        id: "evt-cancel-1",
        txHash: "txhash_cancel_001",
        topic: [nativeToScVal("stream_cancelled", { type: "symbol" })],
        value: payload,
      });

      const parsed = parseContractEvent(raw);

      expect(parsed).not.toBeNull();
      expect(parsed!.txHash).toBe("txhash_cancel_001");
      const value = parsed!.value as Record<string, unknown>;
      expect(value).toHaveProperty("to_receiver");
      expect(value).toHaveProperty("to_sender");
    });

    it("returns null for a malformed event (missing topic.toXDR)", () => {
      // Simulate a broken event where topic entries lack toXDR
      const brokenEvent = {
        id: "evt-broken",
        type: "contract",
        ledger: 999,
        ledgerClosedAt: "2025-01-01T00:00:00Z",
        contractId: "CTEST",
        txHash: "txhash_broken",
        topic: [{ toXDR: () => { throw new Error("XDR failure"); } }],
        value: nativeToScVal(null),
        inSuccessfulContractCall: true,
      } as unknown as SorobanRpc.Api.EventResponse;

      const parsed = parseContractEvent(brokenEvent);
      expect(parsed).toBeNull();
    });
  });

  // ── AuditLogService → prisma.eventLog.create ─────────────────────────────

  describe("AuditLogService.logEvent() — DB persistence", () => {
    it("calls prisma.eventLog.upsert with correct data for a stream_created event", async () => {
      await auditLogService.logEvent({
        eventType: "create",
        streamId: "42",
        txHash: "txhash_create_001",
        ledger: 1234,
        ledgerClosedAt: "2025-06-01T12:00:00Z",
        sender: "GALICESENDERADDRESS",
        receiver: "GBOBRECEIVER",
        amount: 5000000000n,
        metadata: { stream_id: "42", total_amount: "5000000000" },
      });

      expect(mockEventLogUpsert).toHaveBeenCalledTimes(1);
      const upsertArg = mockEventLogUpsert.mock.calls[0][0];
      expect(upsertArg.create).toEqual({
          eventType: "create",
          streamId: "42",
          txHash: "txhash_create_001",
          eventIndex: 0,
          ledger: 1234,
          ledgerClosedAt: "2025-06-01T12:00:00Z",
          sender: "GALICESENDERADDRESS",
          receiver: "GBOBRECEIVER",
          amount: 5000000000n,
          metadata: JSON.stringify({
            stream_id: "42",
            total_amount: "5000000000",
          }),
        },
      );
    });

    it("calls prisma.eventLog.upsert with correct data for a stream_withdrawn event", async () => {
      await auditLogService.logEvent({
        eventType: "withdraw",
        streamId: "42",
        txHash: "txhash_withdraw_001",
        ledger: 1300,
        ledgerClosedAt: "2025-06-02T08:00:00Z",
        amount: 1000000n,
        metadata: { stream_id: "42", amount: "1000000" },
      });

      expect(mockEventLogUpsert).toHaveBeenCalledTimes(1);
      const upsertArg = mockEventLogUpsert.mock.calls[0][0];
      expect(upsertArg.create.eventType).toBe("withdraw");
      expect(upsertArg.create.streamId).toBe("42");
      expect(upsertArg.create.amount).toBe(1000000n);
      expect(upsertArg.create.sender).toBeNull();
      expect(upsertArg.create.receiver).toBeNull();
    });

    it("calls prisma.eventLog.upsert with correct data for a stream_cancelled event", async () => {
      await auditLogService.logEvent({
        eventType: "cancel",
        streamId: "7",
        txHash: "txhash_cancel_001",
        ledger: 1500,
        ledgerClosedAt: "2025-06-10T15:00:00Z",
        amount: 1000000n, // to_receiver + to_sender
        metadata: { stream_id: "7", to_receiver: "800000", to_sender: "200000" },
      });

      expect(mockEventLogUpsert).toHaveBeenCalledTimes(1);
      const upsertArg = mockEventLogUpsert.mock.calls[0][0];
      expect(upsertArg.create.eventType).toBe("cancel");
      expect(upsertArg.create.streamId).toBe("7");
      expect(upsertArg.create.amount).toBe(1000000n);
      expect(upsertArg.create.metadata).toBe(
        JSON.stringify({ stream_id: "7", to_receiver: "800000", to_sender: "200000" })
      );
    });

    it("serializes metadata as JSON string", async () => {
      const meta = { foo: "bar", nested: { x: 1 } };

      await auditLogService.logEvent({
        eventType: "create",
        streamId: "1",
        txHash: "txhash_meta_test",
        ledger: 100,
        ledgerClosedAt: "2025-01-01T00:00:00Z",
        metadata: meta,
      });

      const upsertArg = mockEventLogUpsert.mock.calls[0][0];
      expect(upsertArg.create.metadata).toBe(JSON.stringify(meta));
    });

    it("passes null for optional fields when not provided", async () => {
      await auditLogService.logEvent({
        eventType: "create",
        streamId: "99",
        txHash: "txhash_nulls",
        ledger: 200,
        ledgerClosedAt: "2025-01-01T00:00:00Z",
        // no sender, receiver, amount, metadata
      });

      const upsertArg = mockEventLogUpsert.mock.calls[0][0];
      expect(upsertArg.create.sender).toBeNull();
      expect(upsertArg.create.receiver).toBeNull();
      expect(upsertArg.create.amount).toBeNull();
      expect(upsertArg.create.metadata).toBeNull();
    });

    it("does not throw when prisma.eventLog.upsert rejects (error is swallowed)", async () => {
      mockEventLogUpsert.mockRejectedValueOnce(new Error("DB connection lost"));

      // AuditLogService catches and logs errors — it must not propagate
      await expect(
        auditLogService.logEvent({
          eventType: "create",
          streamId: "1",
          txHash: "txhash_err",
          ledger: 1,
          ledgerClosedAt: "2025-01-01T00:00:00Z",
        })
      ).resolves.toBeUndefined();
    });
  });

  // ── End-to-end: parse event → log to DB ───────────────────────────────────

  describe("End-to-end: parse Soroban event → persist to DB", () => {
    it("parses a stream_created event and saves it via AuditLogService", async () => {
      const payload = buildMapScVal({
        stream_id: 42,
        sender: "GALICESENDERADDRESS",
        receiver: "GBOBRECEIVER",
        total_amount: 5000000000,
      });

      const raw = buildRawEvent({
        id: "e2e-create-1",
        ledger: 2000,
        ledgerClosedAt: "2025-07-01T00:00:00Z",
        txHash: "e2e_txhash_create",
        topic: [nativeToScVal("stream_created", { type: "symbol" })],
        value: payload,
      });

      // Step 1: parse the raw Soroban event
      const parsed = parseContractEvent(raw);
      expect(parsed).not.toBeNull();

      // Step 2: simulate what the indexer does — log to audit DB
      const eventData = parsed!.value as Record<string, unknown>;
      await auditLogService.logEvent({
        eventType: "create",
        streamId: String(eventData.stream_id ?? ""),
        txHash: parsed!.txHash,
        ledger: parsed!.ledger,
        ledgerClosedAt: parsed!.ledgerClosedAt,
        sender: typeof eventData.sender === "string" ? eventData.sender : undefined,
        receiver: typeof eventData.receiver === "string" ? eventData.receiver : undefined,
        amount: typeof eventData.total_amount === "bigint" ? eventData.total_amount : undefined,
        metadata: eventData,
      });

      // Step 3: verify the Prisma create was called with the right data
      expect(mockEventLogUpsert).toHaveBeenCalledTimes(1);
      const saved = mockEventLogUpsert.mock.calls[0][0].create;
      expect(saved.eventType).toBe("create");
      expect(saved.txHash).toBe("e2e_txhash_create");
      expect(saved.ledger).toBe(2000);
      expect(saved.ledgerClosedAt).toBe("2025-07-01T00:00:00Z");
    });

    it("parses a stream_withdrawn event and saves it via AuditLogService", async () => {
      const payload = buildMapScVal({ stream_id: 42, amount: 1000000 });

      const raw = buildRawEvent({
        id: "e2e-withdraw-1",
        ledger: 2100,
        ledgerClosedAt: "2025-07-02T00:00:00Z",
        txHash: "e2e_txhash_withdraw",
        topic: [nativeToScVal("stream_withdrawn", { type: "symbol" })],
        value: payload,
      });

      const parsed = parseContractEvent(raw);
      expect(parsed).not.toBeNull();

      const eventData = parsed!.value as Record<string, unknown>;
      await auditLogService.logEvent({
        eventType: "withdraw",
        streamId: String(eventData.stream_id ?? ""),
        txHash: parsed!.txHash,
        ledger: parsed!.ledger,
        ledgerClosedAt: parsed!.ledgerClosedAt,
        amount: typeof eventData.amount === "bigint" ? eventData.amount : undefined,
        metadata: eventData,
      });

      expect(mockEventLogUpsert).toHaveBeenCalledTimes(1);
      const saved = mockEventLogUpsert.mock.calls[0][0].create;
      expect(saved.eventType).toBe("withdraw");
      expect(saved.txHash).toBe("e2e_txhash_withdraw");
      expect(saved.ledger).toBe(2100);
    });

    it("parses a stream_cancelled event and saves it via AuditLogService", async () => {
      const payload = buildMapScVal({
        stream_id: 7,
        to_receiver: 800000,
        to_sender: 200000,
      });

      const raw = buildRawEvent({
        id: "e2e-cancel-1",
        ledger: 2200,
        ledgerClosedAt: "2025-07-03T00:00:00Z",
        txHash: "e2e_txhash_cancel",
        topic: [nativeToScVal("stream_cancelled", { type: "symbol" })],
        value: payload,
      });

      const parsed = parseContractEvent(raw);
      expect(parsed).not.toBeNull();

      const eventData = parsed!.value as Record<string, unknown>;
      const toReceiver = typeof eventData.to_receiver === "bigint" ? eventData.to_receiver : 0n;
      const toSender = typeof eventData.to_sender === "bigint" ? eventData.to_sender : 0n;

      await auditLogService.logEvent({
        eventType: "cancel",
        streamId: String(eventData.stream_id ?? ""),
        txHash: parsed!.txHash,
        ledger: parsed!.ledger,
        ledgerClosedAt: parsed!.ledgerClosedAt,
        amount: toReceiver + toSender,
        metadata: {
          ...eventData,
          to_receiver: toReceiver.toString(),
          to_sender: toSender.toString(),
        },
      });

      expect(mockEventLogUpsert).toHaveBeenCalledTimes(1);
      const saved = mockEventLogUpsert.mock.calls[0][0].create;
      expect(saved.eventType).toBe("cancel");
      expect(saved.txHash).toBe("e2e_txhash_cancel");
      expect(saved.ledger).toBe(2200);
    });
  });
});
