describe("WebhookDispatcherService signatures", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("sends the Nebula signature header on webhook deliveries", async () => {
    const updateMock = jest.fn(async () => undefined);

    jest.doMock("../generated/client/index.js", () => ({
      PrismaClient: jest.fn().mockImplementation(() => ({
        webhookDelivery: {
          findMany: jest.fn(async () => [
            {
              id: "delivery_1",
              attempts: 0,
              maxRetries: 5,
              payload: {
                eventType: "split.completed",
                splitId: "42",
                txHash: "tx_42",
                timestamp: "2026-03-29T00:00:00.000Z",
              },
              webhook: {
                id: "wh_1",
                url: "https://example.com/webhook",
                secretKey: "super-secret",
              },
            },
          ]),
          update: updateMock,
        },
      })),
    }));

    const fetchMock = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
    }));
    global.fetch = fetchMock as any;

    const { WebhookDispatcherService } = await import("../services/webhook-dispatcher.service");
    const service = new WebhookDispatcherService();

    await service.processDeliveries();

    if (fetchMock.mock.calls.length !== 1) {
      throw new Error(`Expected 1 fetch call, received ${fetchMock.mock.calls.length}`);
    }
    const firstCall = fetchMock.mock.calls[0] as unknown as [
      string,
      { headers: Record<string, string> }
    ];
    const options = firstCall[1];
    if (!options?.headers?.["X-Nebula-Signature"]) {
      throw new Error("Missing X-Nebula-Signature header");
    }
    if (options.headers["X-Nebula-Signature"] !== options.headers["X-Webhook-Signature"]) {
      throw new Error("Nebula signature header does not match legacy webhook signature");
    }
    if (updateMock.mock.calls.length !== 1) {
      throw new Error(`Expected 1 delivery update, received ${updateMock.mock.calls.length}`);
    }
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "delivery_1" },
      data: { status: "success", attempts: 1 },
    });
  });
});
