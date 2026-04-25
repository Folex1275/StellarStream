jest.mock("../lib/db.js", () => ({
  prisma: {
    disbursementDraft: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    disbursementDraftVersion: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock("../logger.js", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { prisma } from "../lib/db.js";
import { DisbursementDraftService } from "../services/disbursement-draft.service.js";

const mockPrisma = prisma as unknown as {
  disbursementDraft: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  disbursementDraftVersion: {
    create: jest.Mock;
    findUnique: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe("DisbursementDraftService", () => {
  let service: DisbursementDraftService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DisbursementDraftService();
  });

  it("creates a draft with version 1 and total amount", async () => {
    const createdDraft = {
      id: "draft-1",
      senderAddress: "G".repeat(56),
      asset: "USDC:GA".repeat(7),
      currentVersion: 1,
      status: "DRAFT",
      versions: [
        {
          id: "version-1",
          version: 1,
          totalAmount: "35",
          recipients: [
            { address: "GA", amount: "10" },
            { address: "GB", amount: "25" },
          ],
        },
      ],
    };
    mockPrisma.disbursementDraft.create.mockResolvedValue(createdDraft);

    const result = await service.createDraft({
      senderAddress: "G".repeat(56),
      name: "Payroll",
      asset: "native",
      recipients: [
        { address: "GA", amount: "10" },
        { address: "GB", amount: "25" },
      ],
      changedBy: "G".repeat(56),
    });

    expect(mockPrisma.disbursementDraft.create).toHaveBeenCalledWith({
      data: {
        senderAddress: "G".repeat(56),
        name: "Payroll",
        asset: "native",
        currentVersion: 1,
        status: "DRAFT",
        versions: {
          create: {
            version: 1,
            totalAmount: "35",
            recipients: [
              { address: "GA", amount: "10" },
              { address: "GB", amount: "25" },
            ],
            changedBy: "G".repeat(56),
          },
        },
      },
      include: {
        versions: {
          orderBy: { version: "desc" },
        },
      },
    });
    expect(result).toEqual(createdDraft);
  });

  it("saves a new version with an incremented version number", async () => {
    mockPrisma.disbursementDraft.findUnique.mockResolvedValue({
      id: "draft-1",
      currentVersion: 1,
      status: "DRAFT",
    });

    const tx = {
      disbursementDraft: {
        update: jest.fn().mockResolvedValue({ id: "draft-1", currentVersion: 2 }),
        findUnique: jest.fn().mockResolvedValue({
          id: "draft-1",
          currentVersion: 2,
          versions: [{ version: 2, totalAmount: "12" }],
        }),
      },
      disbursementDraftVersion: {
        create: jest.fn().mockResolvedValue({ id: "version-2", version: 2 }),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (callback: any) => callback(tx));

    const result = await service.saveNewVersion("draft-1", {
      recipients: [{ address: "GC", amount: "12" }],
      changeNote: "Adjusted payout",
      changedBy: "G".repeat(56),
    });

    expect(tx.disbursementDraft.update).toHaveBeenCalledWith({
      where: { id: "draft-1" },
      data: { currentVersion: 2 },
    });
    expect(tx.disbursementDraftVersion.create).toHaveBeenCalledWith({
      data: {
        draftId: "draft-1",
        version: 2,
        totalAmount: "12",
        recipients: [{ address: "GC", amount: "12" }],
        changeNote: "Adjusted payout",
        changedBy: "G".repeat(56),
      },
    });
    expect(result).toEqual({
      id: "draft-1",
      currentVersion: 2,
      versions: [{ version: 2, totalAmount: "12" }],
    });
  });

  it("restores a prior version into a new version with restore note", async () => {
    mockPrisma.disbursementDraft.findUnique.mockResolvedValue({
      id: "draft-1",
      currentVersion: 2,
      status: "DRAFT",
    });
    mockPrisma.disbursementDraftVersion.findUnique.mockResolvedValue({
      id: "version-1",
      draftId: "draft-1",
      version: 1,
      totalAmount: "42",
      recipients: [{ address: "GD", amount: "42" }],
    });

    const tx = {
      disbursementDraft: {
        update: jest.fn().mockResolvedValue({ id: "draft-1", currentVersion: 3 }),
        findUnique: jest.fn().mockResolvedValue({
          id: "draft-1",
          currentVersion: 3,
          versions: [{ version: 3, changeNote: "Restored from version 1" }],
        }),
      },
      disbursementDraftVersion: {
        create: jest.fn().mockResolvedValue({ id: "version-3", version: 3 }),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (callback: any) => callback(tx));

    const result = await service.restoreVersion("draft-1", 1, "G".repeat(56));

    expect(mockPrisma.disbursementDraftVersion.findUnique).toHaveBeenCalledWith({
      where: { draftId_version: { draftId: "draft-1", version: 1 } },
    });
    expect(tx.disbursementDraftVersion.create).toHaveBeenCalledWith({
      data: {
        draftId: "draft-1",
        version: 3,
        totalAmount: "42",
        recipients: [{ address: "GD", amount: "42" }],
        changeNote: "Restored from version 1",
        changedBy: "G".repeat(56),
      },
    });
    expect(result).toEqual({
      id: "draft-1",
      currentVersion: 3,
      versions: [{ version: 3, changeNote: "Restored from version 1" }],
    });
  });

  it("does not allow modifying a non-DRAFT disbursement", async () => {
    mockPrisma.disbursementDraft.findUnique.mockResolvedValue({
      id: "draft-1",
      currentVersion: 4,
      status: "EXECUTED",
    });

    await expect(
      service.saveNewVersion("draft-1", {
        recipients: [{ address: "GE", amount: "1" }],
        changedBy: "G".repeat(56),
      }),
    ).rejects.toThrow("Cannot modify a non-DRAFT disbursement");

    await expect(service.restoreVersion("draft-1", 1, "G".repeat(56))).rejects.toThrow(
      "Cannot modify a non-DRAFT disbursement",
    );
  });

  it("calculates BigInt totals correctly", () => {
    const total = (service as unknown as { calculateTotal: (recipients: Array<{ address: string; amount: string }>) => string }).calculateTotal([
      { address: "GA", amount: "9007199254740993" },
      { address: "GB", amount: "7" },
      { address: "GC", amount: "1000000" },
    ]);

    expect(total).toBe("9007199255741000");
  });

  it("deletes a draft and relies on cascade delete for versions", async () => {
    mockPrisma.disbursementDraft.delete.mockResolvedValue({ id: "draft-1" });

    await service.deleteDraft("draft-1");

    expect(mockPrisma.disbursementDraft.delete).toHaveBeenCalledWith({ where: { id: "draft-1" } });
    expect(mockPrisma.disbursementDraftVersion.create).not.toHaveBeenCalled();
  });
});
