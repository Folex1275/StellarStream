import { ExportService } from "../services/export.service";
import { prisma } from "../lib/db";

jest.mock("../lib/db", () => ({
  prisma: {
    eventLog: {
      findMany: jest.fn(),
    },
  },
}));

describe("ExportService", () => {
  let exportService: ExportService;

  beforeEach(() => {
    exportService = new ExportService();
    jest.clearAllMocks();
  });

  describe("exportStreamAsCSV", () => {
    it("should return empty CSV header when no events exist", async () => {
      (prisma.eventLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await exportService.exportStreamAsCSV("stream-123");

      expect(result).toBe("Timestamp,Action,Amount,Asset,TX_Hash,Sender,Receiver\n");
    });

    it("should export events as CSV with correct fields", async () => {
      const mockEvents = [
        {
          id: "event-1",
          eventType: "create",
          streamId: "stream-123",
          txHash: "tx-hash-1",
          ledger: 100,
          ledgerClosedAt: "2024-01-01T00:00:00Z",
          sender: "GAAAA",
          receiver: "GBBBB",
          amount: BigInt("1000000"),
          metadata: JSON.stringify({ asset: "USDC" }),
          createdAt: new Date(),
        },
        {
          id: "event-2",
          eventType: "withdraw",
          streamId: "stream-123",
          txHash: "tx-hash-2",
          ledger: 101,
          ledgerClosedAt: "2024-01-02T00:00:00Z",
          sender: "GAAAA",
          receiver: "GBBBB",
          amount: BigInt("500000"),
          metadata: JSON.stringify({ asset: "USDC" }),
          createdAt: new Date(),
        },
      ];

      (prisma.eventLog.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await exportService.exportStreamAsCSV("stream-123");

      expect(result).toContain("CREATE");
      expect(result).toContain("WITHDRAW");
      expect(result).toContain("1000000");
      expect(result).toContain("500000");
      expect(result).toContain("USDC");
      expect(result).toContain("tx-hash-1");
      expect(result).toContain("tx-hash-2");
    });

    it("should handle missing metadata gracefully", async () => {
      const mockEvents = [
        {
          id: "event-1",
          eventType: "create",
          streamId: "stream-123",
          txHash: "tx-hash-1",
          ledger: 100,
          ledgerClosedAt: "2024-01-01T00:00:00Z",
          sender: "GAAAA",
          receiver: "GBBBB",
          amount: BigInt("1000000"),
          metadata: null,
          createdAt: new Date(),
        },
      ];

      (prisma.eventLog.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await exportService.exportStreamAsCSV("stream-123");

      expect(result).toContain("UNKNOWN");
    });
  });

  describe("exportStreamAsJSON", () => {
    it("should return empty array when no events exist", async () => {
      (prisma.eventLog.findMany as jest.Mock).mockResolvedValue([]);

      const result = await exportService.exportStreamAsJSON("stream-123");
      const parsed = JSON.parse(result);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(0);
    });

    it("should export events as JSON with correct structure", async () => {
      const mockEvents = [
        {
          id: "event-1",
          eventType: "create",
          streamId: "stream-123",
          txHash: "tx-hash-1",
          ledger: 100,
          ledgerClosedAt: "2024-01-01T00:00:00Z",
          sender: "GAAAA",
          receiver: "GBBBB",
          amount: BigInt("1000000"),
          metadata: JSON.stringify({ asset: "USDC" }),
          createdAt: new Date(),
        },
      ];

      (prisma.eventLog.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await exportService.exportStreamAsJSON("stream-123");
      const parsed = JSON.parse(result);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0]).toEqual({
        Timestamp: "2024-01-01T00:00:00Z",
        Action: "CREATE",
        Amount: "1000000",
        Asset: "USDC",
        TX_Hash: "tx-hash-1",
        Sender: "GAAAA",
        Receiver: "GBBBB",
      });
    });
  });
});
