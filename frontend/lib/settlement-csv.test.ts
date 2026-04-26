import { describe, expect, it } from "vitest";
import { buildSettlementCsv } from "@/lib/settlement-csv";

describe("settlement-csv", () => {
  it("builds accounting-compatible CSV rows for provided recipients", () => {
    const csv = buildSettlementCsv({
      txHash: "abc123def456",
      sender: "GD5SENDER",
      asset: "USDC",
      totalAmount: "175.5",
      timestamp: "2026-04-25T10:00:00.000Z",
      streamId: "stream-42",
      memo: "Payroll April",
      recipients: [
        {
          address: "GRECIPIENT1",
          payee: "Alice",
          amount: 100,
          operationId: "abc-op0",
        },
        {
          address: "GRECIPIENT2",
          payee: "Bob",
          amount: "75.5",
          operationId: "abc-op1",
        },
      ],
    });

    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe(
      "Date,Amount,Payee,Description,Reference,Currency,Debit,Credit,Tx_Hash,Operation_ID,Stream_ID,Sender_Address,Recipient_Address,Asset,Memo,Status",
    );
    expect(lines[1]).toContain("2026-04-25,-100,Alice");
    expect(lines[1]).toContain(
      ",StellarStream split settlement (USDC),SETTLEMENT-abc123def456,USDC,100,0,abc123def456,abc-op0,stream-42,GD5SENDER,GRECIPIENT1,USDC,Payroll April,Settled",
    );
    expect(lines[2]).toContain("2026-04-25,-75.5,Bob");
  });

  it("creates fallback rows when recipients are not provided", () => {
    const csv = buildSettlementCsv({
      txHash: "def456abc123",
      sender: "GSENDERXYZ",
      asset: "XLM",
      totalAmount: "30",
      fallbackRecipientCount: 3,
    });

    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain(",-10,Recipient 1,");
    expect(lines[2]).toContain(",-10,Recipient 2,");
    expect(lines[3]).toContain(",-10,Recipient 3,");
  });
});
