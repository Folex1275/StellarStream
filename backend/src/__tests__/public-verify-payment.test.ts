import express from "express";
import request from "supertest";
import publicVerifyPaymentRouter from "../api/v3/public-verify-payment.routes";
import { responseWrapper } from "../middleware/responseWrapper.js";
import {
  consumeNonce,
  getStoredNonce,
  storeNonce,
  verifyStellarSignature,
} from "../lib/signatureAuth.js";

var mockGetMyPayments: jest.Mock;

jest.mock("rate-limiter-flexible", () => ({
  RateLimiterRedis: jest.fn().mockImplementation(() => ({
    consume: jest.fn().mockResolvedValue({ remainingPoints: 9 }),
  })),
}));

jest.mock("../lib/redis.js", () => ({
  redis: {},
}));

jest.mock("../lib/signatureAuth.js", () => ({
  storeNonce: jest.fn(),
  getStoredNonce: jest.fn(),
  consumeNonce: jest.fn(),
  verifyStellarSignature: jest.fn(),
}));

jest.mock("../services/recipient-verification.service.js", () => {
  mockGetMyPayments = jest.fn();

  return {
    RecipientVerificationService: jest.fn().mockImplementation(() => ({
      getMyPayments: mockGetMyPayments,
    })),
  };
});

describe("public verify payment routes", () => {
  const validAddress = "G" + "A".repeat(55);
  const senderAddress = "G" + "B".repeat(55);
  const app = express();
  app.use(express.json());
  app.use(responseWrapper);
  app.use("/api/v3", publicVerifyPaymentRouter);

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMyPayments.mockReset();
  });

  it("challenge endpoint returns a nonce", async () => {
    const res = await request(app)
      .post("/api/v3/public/verify-my-payment/challenge")
      .send({
        address: validAddress,
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        nonce: expect.any(String),
        message: expect.stringContaining("Stellar Signed Message:"),
      },
    });
    expect(storeNonce).toHaveBeenCalledWith(expect.any(String));
  });

  it("verify returns 401 for an invalid nonce", async () => {
    (getStoredNonce as jest.Mock).mockResolvedValue(null);
    (consumeNonce as jest.Mock).mockResolvedValue(false);

    const res = await request(app).post("/api/v3/public/verify-my-payment").send({
      address: validAddress,
      nonce: "expired-nonce",
      signature: "ZmFrZQ==",
    });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      error: "Invalid or expired nonce",
    });
  });

  it("verify returns 401 for an invalid signature", async () => {
    (getStoredNonce as jest.Mock).mockResolvedValue("nonce-123");
    (consumeNonce as jest.Mock).mockResolvedValue(true);
    (verifyStellarSignature as jest.Mock).mockReturnValue(false);

    const res = await request(app).post("/api/v3/public/verify-my-payment").send({
      address: validAddress,
      nonce: "nonce-123",
      signature: "ZmFrZQ==",
    });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      error: "Invalid signature",
    });
  });

  it("successful verify returns payment data", async () => {
    const payments = [
      {
        disbursementId: "disb_1",
        recipientAddress: validAddress,
        amount: "1000000",
        status: "PENDING",
        asset: "USDC",
        senderAddress,
        createdAt: new Date("2026-04-24T10:00:00.000Z"),
      },
    ];

    (getStoredNonce as jest.Mock).mockResolvedValue("nonce-456");
    (consumeNonce as jest.Mock).mockResolvedValue(true);
    (verifyStellarSignature as jest.Mock).mockReturnValue(true);
    mockGetMyPayments.mockResolvedValue(payments);

    const res = await request(app).post("/api/v3/public/verify-my-payment").send({
      address: validAddress,
      nonce: "nonce-456",
      signature: "dmFsaWQ=",
    });

    expect(res.status).toBe(200);
    expect(verifyStellarSignature).toHaveBeenCalledWith({
      address: validAddress,
      nonce: "nonce-456",
      signatureBase64: "dmFsaWQ=",
    });
    expect(mockGetMyPayments).toHaveBeenCalledWith(validAddress);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        address: validAddress,
        count: 1,
        payments: [
          expect.objectContaining({
            disbursementId: "disb_1",
            amount: "1000000",
            status: "PENDING",
            asset: "USDC",
          }),
        ],
      },
    });
  });
});
