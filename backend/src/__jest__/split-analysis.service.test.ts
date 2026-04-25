import { analyzeSplitDraft } from "../services/split-analysis.service.js";

describe("analyzeSplitDraft", () => {
  it("suggests merging duplicate addresses case-insensitively", () => {
    const result = analyzeSplitDraft({
      recipients: [
        { address: "gabc123" },
        { address: " GABC123 " },
        { address: "GXYZ999" },
      ],
    });

    expect(result.duplicateGroups).toEqual([
      {
        address: "GABC123",
        count: 2,
        rowIndexes: [0, 1],
      },
    ]);

    expect(result.suggestions).toContainEqual(
      expect.objectContaining({
        type: "merge_duplicate_addresses",
        severity: "info",
        addresses: ["GABC123"],
        rowIndexes: [0, 1],
      }),
    );
  });

  it("adds a high-fee warning when the fee ratio crosses the threshold", () => {
    const result = analyzeSplitDraft({
      recipients: [{ address: "GABC123" }],
      estimatedFeeStroops: "750000",
      totalAmountStroops: "10000000",
    });

    expect(result.suggestions).toContainEqual(
      expect.objectContaining({
        type: "high_fee_transaction",
        severity: "warning",
        feeRatio: 0.075,
      }),
    );
  });

  it("ignores invalid fee inputs instead of crashing", () => {
    const result = analyzeSplitDraft({
      recipients: [{ address: "GABC123" }],
      estimatedFeeStroops: "not-a-number",
      totalAmountStroops: "10000000",
    });

    expect(result.suggestions).toEqual([]);
  });
});
