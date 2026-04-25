jest.mock("../lib/db.js", () => ({
  prisma: {
    eventLog: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("../logger.js", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    event: jest.fn(),
  },
}));

import { prisma } from "../lib/db.js";
import { computeEntryHash } from "../lib/audit-hash-chain.js";
import { AuditChainVerificationService } from "../services/audit-chain-verification.service.js";

describe("AuditChainVerificationService", () => {
  const service = new AuditChainVerificationService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an intact result for an empty chain", async () => {
    (prisma.eventLog.findMany as jest.Mock).mockResolvedValueOnce([]);

    const result = await service.verifyChain();

    expect(result).toMatchObject({
      totalEntries: 0,
      verifiedEntries: 0,
      brokenLinks: [],
      isIntact: true,
    });
  });

  it("returns an intact result for a valid chain", async () => {
    const firstInput = {
      eventType: "create",
      streamId: "stream-1",
      txHash: "tx-1",
      eventIndex: 0,
      ledger: 100,
      ledgerClosedAt: "2026-04-24T00:00:00.000Z",
      sender: "GAAAA",
      receiver: "GBBBB",
      amount: "1000",
      metadata: JSON.stringify({ step: 1 }),
    };
    const firstHash = computeEntryHash(firstInput, null);
    const secondInput = {
      eventType: "withdraw",
      streamId: "stream-1",
      txHash: "tx-2",
      eventIndex: 0,
      ledger: 101,
      ledgerClosedAt: "2026-04-24T00:05:00.000Z",
      sender: "GAAAA",
      receiver: "GBBBB",
      amount: "250",
      metadata: JSON.stringify({ step: 2 }),
    };
    const secondHash = computeEntryHash(secondInput, firstHash);

    (prisma.eventLog.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: "evt-1",
        ...firstInput,
        amount: 1000n,
        parentHash: null,
        entryHash: firstHash,
        createdAt: new Date("2026-04-24T00:00:00.000Z"),
      },
      {
        id: "evt-2",
        ...secondInput,
        amount: 250n,
        parentHash: firstHash,
        entryHash: secondHash,
        createdAt: new Date("2026-04-24T00:05:00.000Z"),
      },
    ]);

    const result = await service.verifyChain();

    expect(result.isIntact).toBe(true);
    expect(result.verifiedEntries).toBe(2);
    expect(result.brokenLinks).toEqual([]);
  });

  it("detects a tampered entry", async () => {
    const firstInput = {
      eventType: "create",
      streamId: "stream-1",
      txHash: "tx-1",
      eventIndex: 0,
      ledger: 100,
      ledgerClosedAt: "2026-04-24T00:00:00.000Z",
      sender: "GAAAA",
      receiver: "GBBBB",
      amount: "1000",
      metadata: JSON.stringify({ step: 1 }),
    };
    const firstHash = computeEntryHash(firstInput, null);

    (prisma.eventLog.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: "evt-1",
        ...firstInput,
        amount: 1000n,
        parentHash: null,
        entryHash: firstHash,
        createdAt: new Date("2026-04-24T00:00:00.000Z"),
      },
      {
        id: "evt-2",
        eventType: "withdraw",
        streamId: "stream-1",
        txHash: "tx-2",
        eventIndex: 0,
        ledger: 101,
        ledgerClosedAt: "2026-04-24T00:05:00.000Z",
        sender: "GAAAA",
        receiver: "GBBBB",
        amount: 999n,
        metadata: JSON.stringify({ step: "tampered" }),
        parentHash: firstHash,
        entryHash: "bad-hash",
        createdAt: new Date("2026-04-24T00:05:00.000Z"),
      },
    ]);

    const result = await service.verifyChain();

    expect(result.isIntact).toBe(false);
    expect(result.brokenLinks).toHaveLength(1);
    expect(result.brokenLinks[0]).toMatchObject({
      id: "evt-2",
      actualHash: "bad-hash",
      position: 1,
    });
  });
});
