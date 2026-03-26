import request from "supertest";
import express, { Express } from "express";
import { responseWrapper } from "../middleware/responseWrapper.js";
import streamsRouter from "../api/v2/streams.routes.js";
import { prisma } from "../lib/db.js";

// Mock Prisma
jest.mock("../lib/db", () => ({
  prisma: {
    stream: {
      findUnique: jest.fn(),
    },
    eventLog: {
      findMany: jest.fn(),
    },
  },
}));

describe("Export Endpoint Integration", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(responseWrapper);
    app.use("/api/v2/streams", streamsRouter);
    jest.clearAllMocks();
  });

  describe("GET /api/v2/streams/:id/export", () => {
    it("should return 404 when stream does not exist", async () => {
      (prisma.stream.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get("/api/v2/streams/nonexistent/export");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Stream not found");
    });

    it("should export stream as CSV by default", async () => {
      const mockStream = {
        id: "stream-123",
        streamId: "contract-stream-123",
        txHash: "tx-hash-1",
        sender: "GAAAA",
        receiver: "GBBBB",
        tokenAddress: "CUSDC",
        amount: "1000000000",
        duration: 86400,
        status: "ACTIVE",
        withdrawn: "0",
        legacy: false,
        migrated: false,
        isPrivate: false,
        createdAt: new Date(),
      };

      const mockEvents = [
        {
          id: "event-1",
          eventType: "create",
          streamId: "stream-123",
          txHash: "tx-hash-1",
          eventIndex: 0,
          ledger: 100,
          ledgerClosedAt: "2024-01-01T00:00:00Z",
          sender: "GAAAA",
          receiver: "GBBBB",
          amount: BigInt("1000000000"),
          metadata: JSON.stringify({ asset: "USDC" }),
          createdAt: new Date(),
        },
        {
          id: "event-2",
          eventType: "withdraw",
          streamId: "stream-123",
          txHash: "tx-hash-2",
          eventIndex: 0,
          ledger: 101,
          ledgerClosedAt: "2024-01-02T12:30:00Z",
          sender: "GAAAA",
          receiver: "GBBBB",
          amount: BigInt("500000000"),
          metadata: JSON.stringify({ asset: "USDC" }),
          createdAt: new Date(),
        },
      ];

      (prisma.stream.findUnique as jest.Mock).mockResolvedValue(mockStream);
      (prisma.eventLog.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const response = await request(app).get("/api/v2/streams/stream-123/export");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/csv");
      expect(response.headers["content-disposition"]).toContain(
        "attachment; filename="
      );
      expect(response.text).toContain("Timestamp");
      expect(response.text).toContain("Action");
      expect(response.text).toContain("Amount");
      expect(response.text).toContain("Asset");
      expect(response.text).toContain("TX_Hash");
      expect(response.text).toContain("Sender");
      expect(response.text).toContain("Receiver");
      expect(response.text).toContain("CREATE");
      expect(response.text).toContain("WITHDRAW");
      expect(response.text).toContain("1000000000");
      expect(response.text).toContain("500000000");
      expect(response.text).toContain("USDC");
    });

    it("should export stream as JSON when format=json", async () => {
      const mockStream = {
        id: "stream-123",
        streamId: "contract-stream-123",
        txHash: "tx-hash-1",
        sender: "GAAAA",
        receiver: "GBBBB",
        tokenAddress: "CUSDC",
        amount: "1000000000",
        duration: 86400,
        status: "ACTIVE",
        withdrawn: "0",
        legacy: false,
        migrated: false,
        isPrivate: false,
        createdAt: new Date(),
      };

      const mockEvents = [
        {
          id: "event-1",
          eventType: "create",
          streamId: "stream-123",
          txHash: "tx-hash-1",
          eventIndex: 0,
          ledger: 100,
          ledgerClosedAt: "2024-01-01T00:00:00Z",
          sender: "GAAAA",
          receiver: "GBBBB",
          amount: BigInt("1000000000"),
          metadata: JSON.stringify({ asset: "USDC" }),
          createdAt: new Date(),
        },
      ];

      (prisma.stream.findUnique as jest.Mock).mockResolvedValue(mockStream);
      (prisma.eventLog.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const response = await request(app).get(
        "/api/v2/streams/stream-123/export?format=json"
      );

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("application/json");
      expect(response.headers["content-disposition"]).toContain(
        "attachment; filename="
      );

      const data = JSON.parse(response.text);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0]).toEqual({
        Timestamp: "2024-01-01T00:00:00Z",
        Action: "CREATE",
        Amount: "1000000000",
        Asset: "USDC",
        TX_Hash: "tx-hash-1",
        Sender: "GAAAA",
        Receiver: "GBBBB",
      });
    });

    it("should handle empty event logs", async () => {
      const mockStream = {
        id: "stream-123",
        streamId: "contract-stream-123",
        txHash: "tx-hash-1",
        sender: "GAAAA",
        receiver: "GBBBB",
        tokenAddress: "CUSDC",
        amount: "1000000000",
        duration: 86400,
        status: "ACTIVE",
        withdrawn: "0",
        legacy: false,
        migrated: false,
        isPrivate: false,
        createdAt: new Date(),
      };

      (prisma.stream.findUnique as jest.Mock).mockResolvedValue(mockStream);
      (prisma.eventLog.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get("/api/v2/streams/stream-123/export");

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/csv");
      // Empty CSV should have just the header
      expect(response.text.trim()).toMatch(/^"?Timestamp"?/);
      expect(response.text).toContain("Action");
      expect(response.text).toContain("Amount");
      expect(response.text).toContain("Asset");
      expect(response.text).toContain("TX_Hash");
      expect(response.text).toContain("Sender");
      expect(response.text).toContain("Receiver");
    });

    it("should handle events with missing metadata", async () => {
      const mockStream = {
        id: "stream-123",
        streamId: "contract-stream-123",
        txHash: "tx-hash-1",
        sender: "GAAAA",
        receiver: "GBBBB",
        tokenAddress: "CUSDC",
        amount: "1000000000",
        duration: 86400,
        status: "ACTIVE",
        withdrawn: "0",
        legacy: false,
        migrated: false,
        isPrivate: false,
        createdAt: new Date(),
      };

      const mockEvents = [
        {
          id: "event-1",
          eventType: "create",
          streamId: "stream-123",
          txHash: "tx-hash-1",
          eventIndex: 0,
          ledger: 100,
          ledgerClosedAt: "2024-01-01T00:00:00Z",
          sender: "GAAAA",
          receiver: "GBBBB",
          amount: BigInt("1000000000"),
          metadata: null,
          createdAt: new Date(),
        },
      ];

      (prisma.stream.findUnique as jest.Mock).mockResolvedValue(mockStream);
      (prisma.eventLog.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const response = await request(app).get("/api/v2/streams/stream-123/export");

      expect(response.status).toBe(200);
      expect(response.text).toContain("UNKNOWN");
    });

    it("should handle invalid format parameter gracefully", async () => {
      const mockStream = {
        id: "stream-123",
        streamId: "contract-stream-123",
        txHash: "tx-hash-1",
        sender: "GAAAA",
        receiver: "GBBBB",
        tokenAddress: "CUSDC",
        amount: "1000000000",
        duration: 86400,
        status: "ACTIVE",
        withdrawn: "0",
        legacy: false,
        migrated: false,
        isPrivate: false,
        createdAt: new Date(),
      };

      (prisma.stream.findUnique as jest.Mock).mockResolvedValue(mockStream);
      (prisma.eventLog.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get(
        "/api/v2/streams/stream-123/export?format=invalid"
      );

      // Should default to CSV
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/csv");
    });

    it("should include correct Content-Disposition header for downloads", async () => {
      const mockStream = {
        id: "stream-123",
        streamId: "contract-stream-123",
        txHash: "tx-hash-1",
        sender: "GAAAA",
        receiver: "GBBBB",
        tokenAddress: "CUSDC",
        amount: "1000000000",
        duration: 86400,
        status: "ACTIVE",
        withdrawn: "0",
        legacy: false,
        migrated: false,
        isPrivate: false,
        createdAt: new Date(),
      };

      (prisma.stream.findUnique as jest.Mock).mockResolvedValue(mockStream);
      (prisma.eventLog.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get("/api/v2/streams/stream-123/export");

      expect(response.headers["content-disposition"]).toBe(
        'attachment; filename="stream-stream-123-audit-log.csv"'
      );
    });

    it("should include correct Content-Disposition header for JSON downloads", async () => {
      const mockStream = {
        id: "stream-123",
        streamId: "contract-stream-123",
        txHash: "tx-hash-1",
        sender: "GAAAA",
        receiver: "GBBBB",
        tokenAddress: "CUSDC",
        amount: "1000000000",
        duration: 86400,
        status: "ACTIVE",
        withdrawn: "0",
        legacy: false,
        migrated: false,
        isPrivate: false,
        createdAt: new Date(),
      };

      (prisma.stream.findUnique as jest.Mock).mockResolvedValue(mockStream);
      (prisma.eventLog.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get(
        "/api/v2/streams/stream-123/export?format=json"
      );

      expect(response.headers["content-disposition"]).toBe(
        'attachment; filename="stream-stream-123-audit-log.json"'
      );
    });
  });
});
