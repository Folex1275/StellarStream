import { nativeToScVal } from "@stellar/stellar-sdk";

describe("V3SplitIngestor split-completion webhooks", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.V3_CONTRACT_ID = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4";
  });

  it("dispatches a split.completed webhook when SplitExecuted is indexed", async () => {
    const upsertMock = jest.fn(async () => undefined);
    const dispatchMock = jest.fn(async () => undefined);

    jest.doMock("../generated/client/index.js", () => ({
      PrismaClient: jest.fn().mockImplementation(() => ({
        disbursement: {
          upsert: upsertMock,
        },
      })),
    }));

    jest.doMock("../services/syncMetadata.service.js", () => ({
      getLastLedgerSequence: jest.fn(async () => 0),
      saveLastLedgerSequence: jest.fn(async () => undefined),
    }));

    jest.doMock("../services/webhook-dispatcher.service.js", () => ({
      WebhookDispatcherService: jest.fn().mockImplementation(() => ({
        dispatch: dispatchMock,
      })),
    }));

    const { V3SplitIngestor } = await import("../ingestor/v3-split-ingestor");
    const ingestor = new V3SplitIngestor("http://localhost:8000");

    await (ingestor as any).handleSplitExecuted({
      txHash: "tx_split_42",
      value: nativeToScVal(
        {
          split_id: 42,
          sender: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
          total_amount: "15000000",
          asset: "USDC:GA5ZSEJYB37PYPZC5UOZYL3LP4TQ3SD6J4ZX3J6M7WMS7JQH7K2W6S7N",
        },
        { type: "map" }
      ),
    });

    expect(upsertMock).toHaveBeenCalledWith({
      where: { txHash: "tx_split_42" },
      create: {
        senderAddress: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
        totalAmount: "15000000",
        asset: "USDC:GA5ZSEJYB37PYPZC5UOZYL3LP4TQ3SD6J4ZX3J6M7WMS7JQH7K2W6S7N",
        txHash: "tx_split_42",
      },
      update: {},
    });

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "split.completed",
        splitId: "42",
        streamId: "42",
        txHash: "tx_split_42",
        sender: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
        totalAmount: "15000000",
        asset: "USDC:GA5ZSEJYB37PYPZC5UOZYL3LP4TQ3SD6J4ZX3J6M7WMS7JQH7K2W6S7N",
      })
    );
  });
});
