import request from "supertest";
import express, { Express } from "express";
import { responseWrapper } from "../middleware/responseWrapper.js";
import exportRouter from "../api/v3/export.routes.js";
import { prisma } from "../lib/db.js";

// Mock Prisma
jest.mock("../lib/db", () => ({
  prisma: {
    disbursement: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock the export service so tests don't need a real PDF/XLSX render pass
jest.mock("../services/split-audit-export.service", () => ({
  generateSplitAuditPDF: jest.fn().mockResolvedValue(Buffer.from("PDF_CONTENT")),
  generateSplitAuditXLSX: jest.fn().mockResolvedValue(Buffer.from("XLSX_CONTENT")),
}));

import {
  generateSplitAuditPDF,
  generateSplitAuditXLSX,
} from "../services/split-audit-export.service.js";

// ── Shared fixture ────────────────────────────────────────────────────────────
const TX_HASH = "aabbccddeeff00112233445566778899aabbccddeeff001122334455";

const mockDisbursement = {
  id:            "dis_1",
  txHash:        TX_HASH,
  senderAddress: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  asset:         "USDC",
  totalAmount:   "50000000",
  createdAt:     new Date("2024-06-01T12:00:00Z"),
  recipients: [
    { recipientAddress: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB", amount: "20000000", status: "SENT" },
    { recipientAddress: "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", amount: "20000000", status: "SENT" },
    { recipientAddress: "GDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD", amount: "10000000", status: "PENDING" },
  ],
};

// ── Test suite ────────────────────────────────────────────────────────────────
describe("GET /api/v3/export/:tx_hash", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(responseWrapper);
    app.use("/api/v3", exportRouter);
    jest.clearAllMocks();
  });

  // ── 404 handling ─────────────────────────────────────────────────────────

  it("returns 404 when disbursement is not found", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).disbursement.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(app).get(`/api/v3/export/${TX_HASH}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Disbursement not found");
    expect(res.body.code).toBe("NOT_FOUND");
  });

  // ── PDF (default) ─────────────────────────────────────────────────────────

  it("returns a PDF by default (no format param)", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).disbursement.findUnique as jest.Mock).mockResolvedValue(mockDisbursement);

    const res = await request(app).get(`/api/v3/export/${TX_HASH}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(res.headers["content-disposition"]).toContain("attachment");
    expect(res.headers["content-disposition"]).toContain(".pdf");
    expect(generateSplitAuditPDF).toHaveBeenCalledTimes(1);
    expect(generateSplitAuditXLSX).not.toHaveBeenCalled();
  });

  it("returns a PDF when format=pdf is explicit", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).disbursement.findUnique as jest.Mock).mockResolvedValue(mockDisbursement);

    const res = await request(app).get(`/api/v3/export/${TX_HASH}?format=pdf`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(generateSplitAuditPDF).toHaveBeenCalledTimes(1);
  });

  it("passes the correct audit data to the PDF generator", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).disbursement.findUnique as jest.Mock).mockResolvedValue(mockDisbursement);

    await request(app).get(`/api/v3/export/${TX_HASH}?format=pdf`);

    const [calledWith] = (generateSplitAuditPDF as jest.Mock).mock.calls[0];
    expect(calledWith.txHash).toBe(TX_HASH);
    expect(calledWith.senderAddress).toBe(mockDisbursement.senderAddress);
    expect(calledWith.asset).toBe("USDC");
    expect(calledWith.totalAmount).toBe("50000000");
    expect(calledWith.recipients).toHaveLength(3);
  });

  it("uses the tx_hash prefix in the PDF filename", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).disbursement.findUnique as jest.Mock).mockResolvedValue(mockDisbursement);

    const res = await request(app).get(`/api/v3/export/${TX_HASH}?format=pdf`);

    expect(res.headers["content-disposition"]).toContain(
      `split-audit-${TX_HASH.slice(0, 16)}.pdf`,
    );
  });

  // ── XLSX ──────────────────────────────────────────────────────────────────

  it("returns an XLSX when format=xlsx", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).disbursement.findUnique as jest.Mock).mockResolvedValue(mockDisbursement);

    const res = await request(app).get(`/api/v3/export/${TX_HASH}?format=xlsx`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(res.headers["content-disposition"]).toContain("attachment");
    expect(res.headers["content-disposition"]).toContain(".xlsx");
    expect(generateSplitAuditXLSX).toHaveBeenCalledTimes(1);
    expect(generateSplitAuditPDF).not.toHaveBeenCalled();
  });

  it("passes the correct audit data to the XLSX generator", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).disbursement.findUnique as jest.Mock).mockResolvedValue(mockDisbursement);

    await request(app).get(`/api/v3/export/${TX_HASH}?format=xlsx`);

    const [calledWith] = (generateSplitAuditXLSX as jest.Mock).mock.calls[0];
    expect(calledWith.txHash).toBe(TX_HASH);
    expect(calledWith.recipients).toHaveLength(3);
  });

  it("uses the tx_hash prefix in the XLSX filename", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).disbursement.findUnique as jest.Mock).mockResolvedValue(mockDisbursement);

    const res = await request(app).get(`/api/v3/export/${TX_HASH}?format=xlsx`);

    expect(res.headers["content-disposition"]).toContain(
      `split-audit-${TX_HASH.slice(0, 16)}.xlsx`,
    );
  });

  // ── Invalid format ────────────────────────────────────────────────────────

  it("returns 400 for an invalid format value", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).disbursement.findUnique as jest.Mock).mockResolvedValue(mockDisbursement);

    const res = await request(app).get(`/api/v3/export/${TX_HASH}?format=csv`);

    expect(res.status).toBe(400);
  });

  // ── Prisma query shape ────────────────────────────────────────────────────

  it("queries Prisma with the correct tx_hash and includes recipients", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((prisma as any).disbursement.findUnique as jest.Mock).mockResolvedValue(mockDisbursement);

    await request(app).get(`/api/v3/export/${TX_HASH}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((prisma as any).disbursement.findUnique).toHaveBeenCalledWith({
      where: { txHash: TX_HASH },
      include: {
        recipients: {
          select: {
            recipientAddress: true,
            amount: true,
            status: true,
          },
        },
      },
    });
  });
});
