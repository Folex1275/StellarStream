import express from "express";
import request from "supertest";
import { requireAuth } from "../middleware/requireAuth";

const registerWebhookMock = jest.fn();

jest.mock("../services/webhook-dispatcher.service", () => ({
  WebhookDispatcherService: jest.fn().mockImplementation(() => ({
    registerWebhook: registerWebhookMock,
  })),
}));

describe("POST /api/v3/webhooks/register", () => {
  beforeEach(() => {
    registerWebhookMock.mockReset();
  });

  it("registers a webhook and defaults the event type to split.completed", async () => {
    registerWebhookMock.mockResolvedValue({
      id: "wh_123",
      secretKey: "secret_abc",
    });

    const router = (await import("../api/v3/webhooks.routes")).default;
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.authenticated = true;
      next();
    });
    app.use(requireAuth);
    app.use(router);

    const response = await request(app)
      .post("/webhooks/register")
      .send({
        url: "https://erp.example.com/hooks/stellarstream",
        description: "ERP notifications",
      });

    expect(response.status).toBe(201);
    expect(registerWebhookMock).toHaveBeenCalledWith(
      "https://erp.example.com/hooks/stellarstream",
      "split.completed",
      "ERP notifications"
    );
    expect(response.body).toEqual({
      success: true,
      data: {
        webhookId: "wh_123",
        secretKey: "secret_abc",
        eventType: "split.completed",
      },
      message: "Webhook registered successfully. Store the secretKey securely.",
    });
  });
});
