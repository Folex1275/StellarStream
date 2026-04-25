import BigNumber from "bignumber.js";

BigNumber.config({
    DECIMAL_PLACES: 20,
    ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
    EXPONENTIAL_AT: [-30, 30],
});

/** Basis points in a whole (100 %). */
export const BPS_TOTAL = new BigNumber(10_000);

/** Maximum share_bps any single recipient may hold. */
export const BPS_MAX = BPS_TOTAL;

/** Minimum non-zero share_bps (0.01 %). */
export const BPS_MIN_NONZERO = new BigNumber(1);

/** Displayable percentage precision (2 d.p.). */
const PCT_DP = 2;

export interface DisbursementEntry {
    address: string;
    /** Raw basis points stored in contract state (0 – 10 000). */
    share_bps: number;
}

/**
 * A single row in the UI's disbursement list with both display modes.
 */
export interface EnrichedEntry extends DisbursementEntry {
    /** Human-readable percentage string, e.g. "33.33". */
    percentageDisplay: string;
    /** Absolute token amount string (in smallest unit), e.g. "3333333". */
    absoluteDisplay: string;
    /** Raw BigNumber for internal calculations. */
    _bpsRaw: BigNumber;
    /** Raw absolute BigNumber for internal calculations. */
    _absoluteRaw: BigNumber;
}

export type InputMode = "percentage" | "absolute";

/**
 * Result of a full list recalculation, including remainder analysis.
 */
export interface DisbursementCalcResult {
    entries: EnrichedEntry[];
    /** Sum of all share_bps (should equal 10 000 for a valid list). */
    bpsSum: number;
    /** Remainder in basis points (bpsSum - 10 000). Negative = shortfall. */
    bpsRemainder: number;
    /** Remainder as a human-readable percentage string (e.g. "-0.50"). */
    remainderPct: string;
    /** true only when bpsSum === 10 000. */
    isValid: boolean;
    /** Absolute total actually allocated across all entries. */
    allocatedAbsolute: string;
    /** Unallocated absolute amount (totalAmount - allocatedAbsolute). */
    unallocatedAbsolute: string;
}

/**
 * Convert a basis-point integer to a display percentage string.
 *
 * @example bpsToPercentage(5000) → "50.00"
 */
export function bpsToPercentage(bps: number | BigNumber): string {
    const n = new BigNumber(bps);
    return n.dividedBy(BPS_TOTAL).multipliedBy(100).toFixed(PCT_DP);
}

/**
 * Convert a display percentage string / number to basis points (integer).
 * Result is floored so the sum of all BPS never accidentally exceeds 10 000
 * due to rounding.
 *
 * @example percentageToBps("50.00") → 5000
 * @throws {RangeError} if the resulting BPS would exceed [0, 10 000].
 */
export function percentageToBps(pct: string | number): number {
    let n: BigNumber;
    try {
        n = new BigNumber(pct);
    } catch (error) {
        throw new RangeError(`percentageToBps: "${pct}" is not a number`);
    }
    if (n.isNaN()) throw new RangeError(`percentageToBps: "${pct}" is not a number`);
    const bps = n.dividedBy(100).multipliedBy(BPS_TOTAL).integerValue(BigNumber.ROUND_FLOOR);
    if (bps.isLessThan(0) || bps.isGreaterThan(BPS_TOTAL)) {
        throw new RangeError(`percentageToBps: ${pct}% is out of range [0, 100]`);
    }
    return bps.toNumber();
}

/**
 * Convert basis points + totalAmount (in token's smallest unit) to the
 * absolute amount that recipient would receive.
 *
 * Returns a string representation of a BigInt-compatible integer.
 *
 * @example bpsToAbsolute(5000, "100000000") → "50000000"
 */
export function bpsToAbsolute(bps: number | BigNumber, totalAmount: bigint | string): string {
    const n = new BigNumber(bps);
    const total = new BigNumber(totalAmount.toString());
    return n
        .multipliedBy(total)
        .dividedBy(BPS_TOTAL)
        .integerValue(BigNumber.ROUND_FLOOR)
        .toFixed(0);
}

/**
 * Convert an absolute token amount to basis points given a totalAmount.
 *
 * Result is rounded to nearest integer BPS.
 *
 * @throws {RangeError} if the resulting BPS would exceed 10 000.
 */
export function absoluteToBps(absolute: bigint | string, totalAmount: bigint | string): number {
    const abs = new BigNumber(absolute.toString());
    const total = new BigNumber(totalAmount.toString());
    if (total.isZero()) throw new RangeError("absoluteToBps: totalAmount must be > 0");

    // Check before calculation to avoid silent acceptance
    if (abs.isGreaterThan(total)) {
        throw new RangeError(
            `absoluteToBps: absolute amount ${absolute} exceeds totalAmount ${totalAmount}. ` +
            "absolute amount cannot exceed totalAmount."
        );
    }

    const bps = abs.dividedBy(total).multipliedBy(BPS_TOTAL).integerValue(BigNumber.ROUND_HALF_UP);
    if (bps.isGreaterThan(BPS_TOTAL)) {
        throw new RangeError(
            `absoluteToBps: computed ${bps.toFixed(0)} BPS exceeds 10 000 (100 %). ` +
            "absolute amount cannot exceed totalAmount."
        );
    }
    return bps.toNumber();
}

/**
 * Enrich a single DisbursementEntry with computed display fields.
 */
export function enrichEntry(
    entry: DisbursementEntry,
    totalAmount: bigint | string
): EnrichedEntry {
    const bpsRaw = new BigNumber(entry.share_bps);
    const absoluteRaw = new BigNumber(bpsToAbsolute(bpsRaw, totalAmount));
    return {
        ...entry,
        percentageDisplay: bpsToPercentage(bpsRaw),
        absoluteDisplay: absoluteRaw.toFixed(0),
        _bpsRaw: bpsRaw,
        _absoluteRaw: absoluteRaw,
    };
}

/**
 * Recalculate an entire disbursement list, enriching every entry and computing
 * the remainder watcher values.
 *
 * @param entries   Raw entries (address + share_bps).
 * @param totalAmount  Total to distribute in smallest token unit.
 */
export function calcDisbursementList(
    entries: DisbursementEntry[],
    totalAmount: bigint | string
): DisbursementCalcResult {
    const enriched = entries.map((e) => enrichEntry(e, totalAmount));

    const bpsSum = enriched.reduce((acc, e) => acc + e.share_bps, 0);
    const bpsRemainder = bpsSum - 10_000;

    const remainderPct = new BigNumber(bpsRemainder)
        .dividedBy(BPS_TOTAL)
        .multipliedBy(100)
        .toFixed(PCT_DP);

    const allocatedAbsolute = enriched
        .reduce((acc, e) => acc.plus(e._absoluteRaw), new BigNumber(0))
        .toFixed(0);

    const unallocatedAbsolute = new BigNumber(totalAmount.toString())
        .minus(allocatedAbsolute)
        .toFixed(0);

    return {
        entries: enriched,
        bpsSum,
        bpsRemainder,
        remainderPct,
        isValid: bpsRemainder === 0,
        allocatedAbsolute,
        unallocatedAbsolute,
    };
}

/**
 * Update a single entry's share when the user types a new percentage in the UI.
 *
 * Returns a fresh DisbursementEntry with the updated share_bps.
 * Does NOT modify the passed entry or the list — callers must rebuild.
 *
 * @param entry       Entry to update.
 * @param newPct      User-supplied percentage string (e.g. "33.33").
 */
export function updateEntryByPercentage(
    entry: DisbursementEntry,
    newPct: string
): DisbursementEntry {
    return { ...entry, share_bps: percentageToBps(newPct) };
}

/**
 * Update a single entry's share when the user types a new absolute amount.
 *
 * @param entry        Entry to update.
 * @param newAbsolute  User-supplied absolute token string (e.g. "50000000").
 * @param totalAmount  Total to distribute (reference for BPS back-conversion).
 */
export function updateEntryByAbsolute(
    entry: DisbursementEntry,
    newAbsolute: string,
    totalAmount: bigint | string
): DisbursementEntry {
    return { ...entry, share_bps: absoluteToBps(newAbsolute, totalAmount) };
}

/**
 * Redistribute any BPS remainder across recipients proportionally so the list
 * sums to exactly 10 000.
 *
 * Uses the "largest remainder method" to preserve proportions and avoid
 * penny-off errors.
 *
 * @param entries   Entries whose share_bps to normalise.
 * @returns         New entries with adjusted share_bps.
 */
export function normaliseShares(entries: DisbursementEntry[]): DisbursementEntry[] {
    if (entries.length === 0) return [];

    const totalRaw = entries.reduce((acc, e) => acc + e.share_bps, 0);
    if (totalRaw === 0) return entries;

    // Compute exact fractional BPS for each entry.
    const scaled = entries.map((e) => {
        const exact = new BigNumber(e.share_bps)
            .dividedBy(totalRaw)
            .multipliedBy(BPS_TOTAL);
        return {
            entry: e,
            exact,
            floor: exact.integerValue(BigNumber.ROUND_FLOOR).toNumber(),
            remainder: exact.minus(exact.integerValue(BigNumber.ROUND_FLOOR)).toNumber(),
        };
    });

    const floorSum = scaled.reduce((acc, s) => acc + s.floor, 0);
    let toDistribute = 10_000 - floorSum;

    // Sort by descending fractional remainder, distribute 1 BPS at a time.
    scaled.sort((a, b) => b.remainder - a.remainder);
    const result = scaled.map((s, i) => ({
        ...s.entry,
        share_bps: s.floor + (i < toDistribute ? 1 : 0),
    }));

    return result;
}

export type RemainderSeverity = "ok" | "warning" | "error";

export interface RemainderWarning {
    severity: RemainderSeverity;
    /** Short message suitable for an inline badge. */
    label: string;
    /** Full message for a tooltip / alert body. */
    detail: string;
}

/**
 * Analyse the current BPS sum and return a structured warning for the UI.
 *
 * Severity levels:
 *   ok      — sums to exactly 10 000 (valid)
 *   warning — within ±1 BPS (rounding artifact; can auto-fix)
 *   error   — difference > 1 BPS (user must intervene)
 */
export function getRemainderWarning(bpsSum: number): RemainderWarning {
    const diff = bpsSum - 10_000;

    if (diff === 0) {
        return {
            severity: "ok",
            label: "100 %",
            detail: "All shares are correctly allocated.",
        };
    }

    const pct = new BigNumber(Math.abs(diff))
        .dividedBy(BPS_TOTAL)
        .multipliedBy(100)
        .toFixed(PCT_DP);

    const direction = diff > 0 ? "over" : "under";
    const absDiff = Math.abs(diff);

    if (absDiff <= 1) {
        return {
            severity: "warning",
            label: `${direction === "over" ? "+" : "-"}${pct} %`,
            detail:
                `Shares are ${direction}-allocated by ${absDiff} basis point (${pct} %). ` +
                "This is likely a rounding artifact. Use auto-normalise to fix.",
        };
    }

    return {
        severity: "error",
        label: `${direction === "over" ? "+" : "-"}${pct} % unallocated`,
        detail:
            `Shares are ${direction}-allocated by ${absDiff} basis points (${pct} %). ` +
            "Adjust individual entries or use auto-normalise before submitting.",
    };
}

/**
 * Convert a human-readable token amount (e.g. "100.50" USDC with 6 decimals)
 * to the raw i128 smallest-unit string expected by the contract.
 *
 * @param humanAmount  Display amount (e.g. "100.50").
 * @param decimals     Token precision (USDC = 6, XLM = 7).
 * @returns            Integer string for use in prepareSplitTransaction.
 */
export function humanToI128(humanAmount: string, decimals: number): string {
    let n: BigNumber;
    try {
        n = new BigNumber(humanAmount);
    } catch (error) {
        throw new RangeError(`humanToI128: "${humanAmount}" is not a valid positive amount`);
    }
    if (n.isNaN() || n.isNegative()) {
        throw new RangeError(`humanToI128: "${humanAmount}" is not a valid positive amount`);
    }
    return n
        .multipliedBy(new BigNumber(10).pow(decimals))
        .integerValue(BigNumber.ROUND_FLOOR)
        .toFixed(0);
}

/**
 * Convert a raw i128 string back to a human-readable display amount.
 *
 * @param raw       Integer string (e.g. "100500000").
 * @param decimals  Token precision.
 * @param dp        Display decimal places (default = decimals).
 */
export function i128ToHuman(raw: string | bigint, decimals: number, dp?: number): string {
    const n = new BigNumber(raw.toString());
    return n
        .dividedBy(new BigNumber(10).pow(decimals))
        .toFixed(dp ?? decimals);
}