import { PayoutStatus } from "../generated/client/index.js";
import { prisma } from "../lib/db.js";
import { RecipientVerificationService } from "../services/recipient-verification.service.js";

jest.mock("../lib/db.js", () => ({
  prisma: {
    splitRecipient: {
      findMany: jest.fn(),
    },
  },
}));

describe("RecipientVerificationService", () => {
  let service: RecipientVerificationService;

  beforeEach(() => {
    service = new RecipientVerificationService();
    jest.clearAllMocks();
  });

  it("returns payments for a valid address", async () => {
    const createdAt = new Date("2026-04-24T12:00:00.000Z");
    (prisma.splitRecipient.findMany as jest.Mock).mockResolvedValue([
      {
        disbursementId: "disb_1",
        recipientAddress: "GRECIPIENT111111111111111111111111111111111111111111111111",
        amount: "2500000",
        status: PayoutStatus.PENDING,
        disbursement: {
          id: "disb_1",
          senderAddress: "GSENDER111111111111111111111111111111111111111111111111111",
          asset: "USDC:GISSUER11111111111111111111111111111111111111111111111111",
          createdAt,
        },
      },
    ]);

    const result = await service.getMyPayments(
      "GRECIPIENT111111111111111111111111111111111111111111111111",
    );

    expect(result).toEqual([
      {
        disbursementId: "disb_1",
        recipientAddress: "GRECIPIENT111111111111111111111111111111111111111111111111",
        amount: "2500000",
        status: PayoutStatus.PENDING,
        asset: "USDC:GISSUER11111111111111111111111111111111111111111111111111",
        senderAddress: "GSENDER111111111111111111111111111111111111111111111111111",
        createdAt,
      },
    ]);
  });

  it("returns an empty array for an address not in any splits", async () => {
    (prisma.splitRecipient.findMany as jest.Mock).mockResolvedValue([]);

    const result = await service.getMyPayments(
      "GABSENT1111111111111111111111111111111111111111111111111111",
    );

    expect(result).toEqual([]);
  });

  it("includes the correct fields for each payment", async () => {
    const createdAt = new Date("2026-04-24T09:00:00.000Z");
    (prisma.splitRecipient.findMany as jest.Mock).mockResolvedValue([
      {
        disbursementId: "disb_2",
        recipientAddress: "GRECIPIENT222222222222222222222222222222222222222222222222",
        amount: "4200000",
        status: PayoutStatus.SENT,
        disbursement: {
          id: "disb_2",
          senderAddress: "GSENDER222222222222222222222222222222222222222222222222222",
          asset: "XLM",
          createdAt,
        },
      },
    ]);

    const [payment] = await service.getMyPayments(
      "GRECIPIENT222222222222222222222222222222222222222222222222",
    );

    expect(payment.amount).toBe("4200000");
    expect(payment.status).toBe(PayoutStatus.SENT);
    expect(payment.asset).toBe("XLM");
    expect(payment.senderAddress).toBe(
      "GSENDER222222222222222222222222222222222222222222222222222",
    );
    expect(payment.createdAt).toEqual(createdAt);
  });

  it("requests rows ordered by disbursement createdAt descending", async () => {
    (prisma.splitRecipient.findMany as jest.Mock).mockResolvedValue([
      {
        disbursementId: "disb_new",
        recipientAddress: "GRECIPIENT333333333333333333333333333333333333333333333333",
        amount: "1",
        status: PayoutStatus.PENDING,
        disbursement: {
          id: "disb_new",
          senderAddress: "GSENDER333333333333333333333333333333333333333333333333333",
          asset: "XLM",
          createdAt: new Date("2026-04-24T12:00:00.000Z"),
        },
      },
      {
        disbursementId: "disb_old",
        recipientAddress: "GRECIPIENT333333333333333333333333333333333333333333333333",
        amount: "2",
        status: PayoutStatus.SENT,
        disbursement: {
          id: "disb_old",
          senderAddress: "GSENDER333333333333333333333333333333333333333333333333333",
          asset: "USDC",
          createdAt: new Date("2026-04-23T12:00:00.000Z"),
        },
      },
    ]);

    const result = await service.getMyPayments(
      "GRECIPIENT333333333333333333333333333333333333333333333333",
    );

    expect(prisma.splitRecipient.findMany).toHaveBeenCalledWith({
      where: {
        recipientAddress: "GRECIPIENT333333333333333333333333333333333333333333333333",
        status: {
          in: [PayoutStatus.PENDING, PayoutStatus.SENT],
        },
      },
      include: {
        disbursement: {
          select: {
            id: true,
            senderAddress: true,
            asset: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        disbursement: {
          createdAt: "desc",
        },
      },
    });
    expect(result.map((payment) => payment.disbursementId)).toEqual(["disb_new", "disb_old"]);
  });
});
