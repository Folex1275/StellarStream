import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FeeBumpRelayerService,
  type FeeBumpRelayerPrismaClient,
  calculateBumpedFeeStroops,
  type MonitorRequest,
} from "../services/fee-bump-relayer.service.js";

type MonitorRecord = {
  id: string;
  txHash: string;
  txXdr: string;
  sourceAddress: string;
  originalFeeSt: string;
  currentFeeSt: string;
  bumpCount: number;
  maxBumps: number;
  status: string;
  submittedAt: Date;
  confirmedAt: Date | null;
  lastBumpAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

class FakeMonitoredTransactionDelegate {
  private record: MonitorRecord | null = null;

  async create({
    data,
  }: {
    data: Pick<
      MonitorRecord,
      "txHash" | "txXdr" | "sourceAddress" | "originalFeeSt" | "currentFeeSt" | "maxBumps" | "status"
    >;
  }): Promise<MonitorRecord> {
    const now = new Date();
    this.record = {
      id: "mon_1",
      txHash: data.txHash,
      txXdr: data.txXdr,
      sourceAddress: data.sourceAddress,
      originalFeeSt: data.originalFeeSt,
      currentFeeSt: data.currentFeeSt,
      bumpCount: 0,
      maxBumps: data.maxBumps,
      status: data.status,
      submittedAt: now,
      confirmedAt: null,
      lastBumpAt: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };

    return this.clone();
  }

  async findUniqueOrThrow({ where }: { where: { id: string } }): Promise<MonitorRecord> {
    if (!this.record || this.record.id !== where.id) {
      throw new Error("Record not found");
    }

    return this.clone();
  }

  async update({
    where,
    data,
  }: {
    where: { id: string };
    data: Partial<MonitorRecord> & { bumpCount?: { increment: number } };
  }): Promise<MonitorRecord> {
    if (!this.record || this.record.id !== where.id) {
      throw new Error("Record not found");
    }

    const nextRecord = { ...this.record };

    if (typeof data.txHash === "string") nextRecord.txHash = data.txHash;
    if (typeof data.txXdr === "string") nextRecord.txXdr = data.txXdr;
    if (typeof data.currentFeeSt === "string") nextRecord.currentFeeSt = data.currentFeeSt;
    if (typeof data.status === "string") nextRecord.status = data.status;
    if (typeof data.errorMessage === "string" || data.errorMessage === null) {
      nextRecord.errorMessage = data.errorMessage ?? null;
    }
    if (data.confirmedAt instanceof Date || data.confirmedAt === null) {
      nextRecord.confirmedAt = data.confirmedAt ?? null;
    }
    if (data.lastBumpAt instanceof Date || data.lastBumpAt === null) {
      nextRecord.lastBumpAt = data.lastBumpAt ?? null;
    }
    if (data.bumpCount) {
      nextRecord.bumpCount += data.bumpCount.increment;
    }

    nextRecord.updatedAt = new Date();
    this.record = nextRecord;

    return this.clone();
  }

  async findUnique({ where }: { where: { txHash: string } }): Promise<MonitorRecord | null> {
    if (!this.record || this.record.txHash !== where.txHash) {
      return null;
    }

    return this.clone();
  }

  async findMany(_: {
    where?: { status: string };
    orderBy: { createdAt: "desc" };
    take: number;
  }): Promise<MonitorRecord[]> {
    return this.record ? [this.clone()] : [];
  }

  snapshot(): MonitorRecord | null {
    return this.record ? this.clone() : null;
  }

  private clone(): MonitorRecord {
    if (!this.record) {
      throw new Error("Record not found");
    }

    return {
      ...this.record,
      submittedAt: new Date(this.record.submittedAt),
      confirmedAt: this.record.confirmedAt ? new Date(this.record.confirmedAt) : null,
      lastBumpAt: this.record.lastBumpAt ? new Date(this.record.lastBumpAt) : null,
      createdAt: new Date(this.record.createdAt),
      updatedAt: new Date(this.record.updatedAt),
    };
  }
}

function createService(overrides: {
  pollForConfirmationFn?: (txHash: string, timeoutMs: number) => Promise<"SUCCESS" | "FAILED" | "PENDING">;
  bumpFeeFn?: (originalXdr: string, currentFeeStroops: string) => Promise<{
    newTxHash: string;
    newTxXdr: string;
    newFeeStroops: string;
  }>;
  feeBufferSecret?: string;
} = {}) {
  const monitoredTransaction = new FakeMonitoredTransactionDelegate();
  const prismaClient: FeeBumpRelayerPrismaClient = {
    monitoredTransaction,
  };

  const service = new FeeBumpRelayerService({
    prismaClient,
    feeBufferSecret: overrides.feeBufferSecret,
    pollForConfirmationFn: overrides.pollForConfirmationFn,
    bumpFeeFn: overrides.bumpFeeFn,
  });

  return { service, monitoredTransaction };
}

describe("calculateBumpedFeeStroops", () => {
  it("calculates a 20 percent fee bump", () => {
    assert.equal(calculateBumpedFeeStroops("100"), "120");
  });

  it("compounds multiple bumps", () => {
    const firstBump = calculateBumpedFeeStroops("100");
    const secondBump = calculateBumpedFeeStroops(firstBump);

    assert.equal(firstBump, "120");
    assert.equal(secondBump, "144");
  });
});

describe("FeeBumpRelayerService", () => {
  const request: MonitorRequest = {
    txHash: "tx_1",
    txXdr: "AAAA",
    sourceAddress: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    feeStroops: "100",
    maxBumps: 2,
  };

  it("expires after reaching the max bump limit", async () => {
    let txCounter = 1;
    const { service, monitoredTransaction } = createService({
      pollForConfirmationFn: async () => "PENDING",
      bumpFeeFn: async (_originalXdr, currentFeeStroops) => {
        txCounter += 1;

        return {
          newTxHash: `tx_${txCounter}`,
          newTxXdr: `XDR_${txCounter}`,
          newFeeStroops: calculateBumpedFeeStroops(currentFeeStroops),
        };
      },
    });

    const result = await service.monitorTransaction(request);
    const record = monitoredTransaction.snapshot();

    assert.equal(result.status, "EXPIRED");
    assert.equal(result.finalFeeStroops, "144");
    assert.equal(result.bumpCount, 2);
    assert.equal(record?.status, "EXPIRED");
    assert.equal(record?.errorMessage, "Max fee bumps (2) exceeded");
  });

  it("handles missing fee buffer secret gracefully", async () => {
    const { service, monitoredTransaction } = createService({
      feeBufferSecret: "",
      pollForConfirmationFn: async () => "PENDING",
    });

    const result = await service.monitorTransaction({ ...request, maxBumps: 1 });
    const record = monitoredTransaction.snapshot();

    assert.equal(result.status, "FAILED");
    assert.equal(result.bumpCount, 0);
    assert.match(result.errorMessage ?? "", /FEE_BUFFER_SECRET_KEY not configured/);
    assert.equal(record?.status, "FAILED");
  });
});
