import { describe, it, expect } from "vitest";
import BigNumber from "bignumber.js";
import {
    bpsToPercentage,
    percentageToBps,
    bpsToAbsolute,
    absoluteToBps,
    enrichEntry,
    calcDisbursementList,
    updateEntryByPercentage,
    updateEntryByAbsolute,
    normaliseShares,
    getRemainderWarning,
    humanToI128,
    i128ToHuman,
} from "./disbursement-math";

describe("bpsToPercentage", () => {
    it("converts 10 000 BPS → 100.00 %", () => {
        expect(bpsToPercentage(10_000)).toBe("100.00");
    });

    it("converts 5 000 BPS → 50.00 %", () => {
        expect(bpsToPercentage(5_000)).toBe("50.00");
    });

    it("converts 1 BPS → 0.01 %", () => {
        expect(bpsToPercentage(1)).toBe("0.01");
    });

    it("converts 3 333 BPS → 33.33 %", () => {
        expect(bpsToPercentage(3_333)).toBe("33.33");
    });

    it("accepts a BigNumber argument", () => {
        expect(bpsToPercentage(new BigNumber(2500))).toBe("25.00");
    });
});

describe("percentageToBps", () => {
    it("converts 50 % → 5 000 BPS", () => {
        expect(percentageToBps("50")).toBe(5_000);
    });

    it("converts 33.33 % → 3 333 BPS (floors)", () => {
        expect(percentageToBps("33.33")).toBe(3_333);
    });

    it("converts 100 % → 10 000 BPS", () => {
        expect(percentageToBps("100")).toBe(10_000);
    });

    it("converts 0 % → 0 BPS", () => {
        expect(percentageToBps("0")).toBe(0);
    });

    it("throws on negative percentage", () => {
        expect(() => percentageToBps("-1")).toThrow(RangeError);
    });

    it("throws on > 100 %", () => {
        expect(() => percentageToBps("100.01")).toThrow(RangeError);
    });

    it("throws on NaN input", () => {
        expect(() => percentageToBps("abc")).toThrow(RangeError);
    });
});

describe("bpsToAbsolute", () => {
    const total = "100000000"; // 100 USDC (6 decimals)

    it("50 % of 100 USDC = 50 000 000 stroops", () => {
        expect(bpsToAbsolute(5_000, total)).toBe("50000000");
    });

    it("100 % = full total", () => {
        expect(bpsToAbsolute(10_000, total)).toBe("100000000");
    });

    it("1 BPS of 100 USDC = 10 000 stroops (0.01 USDC)", () => {
        expect(bpsToAbsolute(1, total)).toBe("10000");
    });

    it("floors fractional stroops (no decimals in i128)", () => {
        // 1/3 of 100_000_001 — should not produce a decimal
        const result = bpsToAbsolute(3_333, "100000001");
        expect(result).toMatch(/^\d+$/);
    });

    it("works with bigint totalAmount", () => {
        expect(bpsToAbsolute(5_000, BigInt(100_000_000))).toBe("50000000");
    });
});

describe("absoluteToBps", () => {
    const total = "100000000";

    it("50 000 000 / 100 000 000 = 5 000 BPS", () => {
        expect(absoluteToBps("50000000", total)).toBe(5_000);
    });

    it("0 / total = 0 BPS", () => {
        expect(absoluteToBps("0", total)).toBe(0);
    });

    it("total / total = 10 000 BPS", () => {
        expect(absoluteToBps(total, total)).toBe(10_000);
    });

    it("throws when absolute > total", () => {
        expect(() => absoluteToBps("100000001", total)).toThrow(RangeError);
    });

    it("throws when totalAmount is 0", () => {
        expect(() => absoluteToBps("0", "0")).toThrow(RangeError);
    });

    it("rounds to nearest BPS on non-exact values", () => {
        // 33 333 333 / 100 000 000 * 10 000 = 3333.3333 → rounds to 3333
        expect(absoluteToBps("33333333", total)).toBe(3_333);
    });
});

describe("enrichEntry", () => {
    const entry = { address: "GABC123", share_bps: 5_000 };
    const total = "100000000";
    const enriched = enrichEntry(entry, total);

    it("preserves original fields", () => {
        expect(enriched.address).toBe("GABC123");
        expect(enriched.share_bps).toBe(5_000);
    });

    it("computes percentageDisplay", () => {
        expect(enriched.percentageDisplay).toBe("50.00");
    });

    it("computes absoluteDisplay", () => {
        expect(enriched.absoluteDisplay).toBe("50000000");
    });

    it("stores BigNumber internals", () => {
        expect(enriched._bpsRaw.toNumber()).toBe(5_000);
        expect(enriched._absoluteRaw.toFixed(0)).toBe("50000000");
    });
});

describe("calcDisbursementList", () => {
    const total = "100000000";

    it("marks a perfectly split list as valid", () => {
        const entries = [
            { address: "GA", share_bps: 5_000 },
            { address: "GB", share_bps: 5_000 },
        ];
        const result = calcDisbursementList(entries, total);
        expect(result.isValid).toBe(true);
        expect(result.bpsSum).toBe(10_000);
        expect(result.bpsRemainder).toBe(0);
    });

    it("reports a shortfall correctly", () => {
        const entries = [
            { address: "GA", share_bps: 4_000 },
            { address: "GB", share_bps: 4_000 },
        ];
        const result = calcDisbursementList(entries, total);
        expect(result.isValid).toBe(false);
        expect(result.bpsRemainder).toBe(-2_000);
        expect(result.remainderPct).toBe("-20.00");
    });

    it("reports an over-allocation correctly", () => {
        const entries = [
            { address: "GA", share_bps: 6_000 },
            { address: "GB", share_bps: 5_000 },
        ];
        const result = calcDisbursementList(entries, total);
        expect(result.isValid).toBe(false);
        expect(result.bpsRemainder).toBe(1_000);
    });

    it("computes correct allocatedAbsolute and unallocatedAbsolute", () => {
        const entries = [
            { address: "GA", share_bps: 5_000 },
            { address: "GB", share_bps: 4_000 },
        ];
        const result = calcDisbursementList(entries, total);
        expect(result.allocatedAbsolute).toBe("90000000");
        expect(result.unallocatedAbsolute).toBe("10000000");
    });
});

describe("updateEntryByPercentage", () => {
    const entry = { address: "GA", share_bps: 1_000 };

    it("updates share_bps from a new percentage", () => {
        const updated = updateEntryByPercentage(entry, "25");
        expect(updated.share_bps).toBe(2_500);
    });

    it("does not mutate the original entry", () => {
        updateEntryByPercentage(entry, "25");
        expect(entry.share_bps).toBe(1_000);
    });
});

describe("updateEntryByAbsolute", () => {
    const entry = { address: "GA", share_bps: 1_000 };
    const total = "100000000";

    it("updates share_bps from an absolute amount", () => {
        const updated = updateEntryByAbsolute(entry, "30000000", total);
        expect(updated.share_bps).toBe(3_000);
    });
});

describe("normaliseShares", () => {
    it("three equal thirds sum to exactly 10 000", () => {
        const entries = [
            { address: "GA", share_bps: 3_333 },
            { address: "GB", share_bps: 3_333 },
            { address: "GC", share_bps: 3_334 },
        ];
        const normalised = normaliseShares(entries);
        const sum = normalised.reduce((acc, e) => acc + e.share_bps, 0);
        expect(sum).toBe(10_000);
    });

    it("does not change an already valid list", () => {
        const entries = [
            { address: "GA", share_bps: 5_000 },
            { address: "GB", share_bps: 5_000 },
        ];
        const normalised = normaliseShares(entries);
        expect(normalised[0].share_bps).toBe(5_000);
        expect(normalised[1].share_bps).toBe(5_000);
    });

    it("returns empty array for empty input", () => {
        expect(normaliseShares([])).toEqual([]);
    });

    it("handles a 120-recipient list without loss", () => {
        const entries = Array.from({ length: 120 }, (_, i) => ({
            address: `G${i}`,
            share_bps: Math.floor(10_000 / 120),
        }));
        const normalised = normaliseShares(entries);
        const sum = normalised.reduce((acc, e) => acc + e.share_bps, 0);
        expect(sum).toBe(10_000);
    });
});

describe("getRemainderWarning", () => {
    it("returns ok for exactly 10 000", () => {
        expect(getRemainderWarning(10_000).severity).toBe("ok");
    });

    it("returns warning for ±1 BPS", () => {
        expect(getRemainderWarning(9_999).severity).toBe("warning");
        expect(getRemainderWarning(10_001).severity).toBe("warning");
    });

    it("returns error for > 1 BPS difference", () => {
        expect(getRemainderWarning(9_500).severity).toBe("error");
        expect(getRemainderWarning(10_500).severity).toBe("error");
    });

    it("includes direction in label for error", () => {
        expect(getRemainderWarning(9_500).label).toContain("-");
        expect(getRemainderWarning(10_500).label).toContain("+");
    });
});

describe("humanToI128", () => {
    it("converts 100 USDC (6 decimals) correctly", () => {
        expect(humanToI128("100", 6)).toBe("100000000");
    });

    it("converts 0.01 USDC", () => {
        expect(humanToI128("0.01", 6)).toBe("10000");
    });

    it("floors sub-stroop amounts", () => {
        expect(humanToI128("100.0000001", 6)).toBe("100000000");
    });

    it("throws on negative input", () => {
        expect(() => humanToI128("-1", 6)).toThrow(RangeError);
    });

    it("throws on NaN input", () => {
        expect(() => humanToI128("abc", 6)).toThrow(RangeError);
    });
});

describe("i128ToHuman", () => {
    it("converts 100 000 000 back to 100.000000 USDC", () => {
        expect(i128ToHuman("100000000", 6)).toBe("100.000000");
    });

    it("respects custom dp", () => {
        expect(i128ToHuman("100000000", 6, 2)).toBe("100.00");
    });
});


describe("floating-point regression", () => {
    it("0.1 + 0.2 scenario: bps add cleanly", () => {
        // Native JS: (0.1 + 0.2) * 10000 = 3000.0000000000005
        // BigNumber must give exactly 3000
        const entries = [
            { address: "GA", share_bps: percentageToBps("10") },
            { address: "GB", share_bps: percentageToBps("20") },
        ];
        expect(entries[0].share_bps + entries[1].share_bps).toBe(3_000);
    });

    it("three-way 33.33 % split absolute amounts do not overflow", () => {
        const total = "99999999"; // intentionally odd number
        const a = bpsToAbsolute(3_333, total);
        const b = bpsToAbsolute(3_333, total);
        const c = bpsToAbsolute(3_334, total);
        const sum = new BigNumber(a).plus(b).plus(c);
        // Sum must be <= total (no overflow due to rounding)
        expect(sum.isLessThanOrEqualTo(total)).toBe(true);
    });
});