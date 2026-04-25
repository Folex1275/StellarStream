import { describe, expect, it } from "vitest";
import { buildDisbursementReportCsv, type DisbursementReportRow } from "@/lib/disbursement-report";

describe("disbursement-report", () => {
  it("builds a CSV with the expected headers and values", () => {
    const rows: DisbursementReportRow[] = [
      {
        date: "2026-04-01",
        streamId: "STRM-1001",
        asset: "USDC",
        recipient: "GABC...1234",
        amount: 12500.5,
        status: "Completed",
        txHash: "abc123def456",
      },
    ];

    const csv = buildDisbursementReportCsv(rows);

    expect(csv).toContain("Date,Stream ID,Asset,Recipient,Amount,Status,Tx Hash");
    expect(csv).toContain("2026-04-01");
    expect(csv).toContain("USDC");
    expect(csv).toContain("12500.50");
    expect(csv).toContain("abc123def456");
  });
});
