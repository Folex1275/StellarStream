import { PriceService } from "../services/price.service.js";

// Mock prisma
jest.mock("../lib/db.js", () => ({
  prisma: {
    priceHistory: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    splitLog: {
      create: jest.fn(),
    },
    stream: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    tokenPrice: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock("../logger.js", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

import { prisma } from "../lib/db.js";

describe("PriceService", () => {
  let service: PriceService;

  beforeEach(() => {
    service = new PriceService();
    jest.clearAllMocks();
  });

  describe("recordPriceHistory", () => {
    it("stores price history record in database", async () => {
      (prisma.priceHistory.create as jest.Mock).mockResolvedValueOnce({});

      await service.recordPriceHistory("native", "XLM", 0.12, "coingecko");

      expect(prisma.priceHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          asset: "native",
          symbol: "XLM",
          priceUsd: 0.12,
          source: "coingecko",
        }),
      });
    });

    it("handles database error gracefully", async () => {
      (prisma.priceHistory.create as jest.Mock).mockRejectedValueOnce(
        new Error("DB error")
      );

      await expect(
        service.recordPriceHistory("native", "XLM", 0.12, "coingecko")
      ).resolves.not.toThrow();
    });
  });

  describe("getNearestPrice", () => {
    it("returns nearest price for an asset", async () => {
      const mockPrice = {
        priceUsd: 0.12,
        source: "coingecko",
        recordedAt: new Date(),
      };

      (prisma.priceHistory.findFirst as jest.Mock).mockResolvedValueOnce(
        mockPrice
      );

      const result = await service.getNearestPrice("native", new Date());

      expect(result).not.toBeNull();
      expect(result?.priceUsd).toBe(0.12);
      expect(result?.source).toBe("coingecko");
    });

    it("returns null when no price history exists", async () => {
      (prisma.priceHistory.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getNearestPrice("native", new Date());

      expect(result).toBeNull();
    });

    it("handles database error gracefully", async () => {
      (prisma.priceHistory.findFirst as jest.Mock).mockRejectedValueOnce(
        new Error("DB error")
      );

      const result = await service.getNearestPrice("native", new Date());

      expect(result).toBeNull();
    });
  });

  describe("logSplitWithPrice", () => {
    it("creates split log linked to nearest price", async () => {
      const mockPrice = {
        priceUsd: 0.12,
        source: "coingecko",
        recordedAt: new Date(),
      };

      (prisma.priceHistory.findFirst as jest.Mock).mockResolvedValueOnce(
        mockPrice
      );
      (prisma.splitLog.create as jest.Mock).mockResolvedValueOnce({});

      await service.logSplitWithPrice({
        streamId: "stream-1",
        asset: "native",
        amount: "1000000",
        sender: "GABC",
        receiver: "GDEF",
        txHash: "tx-hash-1",
        executedAt: new Date(),
      });

      expect(prisma.splitLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          streamId: "stream-1",
          asset: "native",
          priceUsd: 0.12,
          priceSource: "coingecko",
        }),
      });
    });

    it("creates split log with null price when no history exists", async () => {
      (prisma.priceHistory.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (prisma.splitLog.create as jest.Mock).mockResolvedValueOnce({});

      await service.logSplitWithPrice({
        streamId: "stream-1",
        asset: "native",
        amount: "1000000",
        sender: "GABC",
        receiver: "GDEF",
        txHash: "tx-hash-2",
        executedAt: new Date(),
      });

      expect(prisma.splitLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priceUsd: null,
          priceSource: null,
        }),
      });
    });

    it("handles database error gracefully", async () => {
      (prisma.priceHistory.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (prisma.splitLog.create as jest.Mock).mockRejectedValueOnce(
        new Error("DB error")
      );

      await expect(
        service.logSplitWithPrice({
          streamId: "stream-1",
          asset: "native",
          amount: "1000000",
          sender: "GABC",
          receiver: "GDEF",
          txHash: "tx-hash-3",
          executedAt: new Date(),
        })
      ).resolves.not.toThrow();
    });
  });

  describe("getCachedPrice", () => {
    it("returns cached price from database", async () => {
      (prisma.tokenPrice.findUnique as jest.Mock).mockResolvedValueOnce({
        priceUsd: 0.12,
      });

      const result = await service.getCachedPrice("native");

      expect(result).toBe(0.12);
    });

    it("returns 0 when no cached price exists", async () => {
      (prisma.tokenPrice.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.getCachedPrice("native");

      expect(result).toBe(0);
    });
  });
});
