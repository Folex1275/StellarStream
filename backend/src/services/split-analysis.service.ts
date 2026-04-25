export interface SplitAnalyzeRecipient {
  address: string;
}

export interface SplitAnalyzeRequest {
  recipients: SplitAnalyzeRecipient[];
  estimatedFeeStroops?: string;
  totalAmountStroops?: string;
}

export type SplitSuggestionType =
  | "merge_duplicate_addresses"
  | "high_fee_transaction";

export interface SplitSuggestion {
  type: SplitSuggestionType;
  message: string;
  severity: "info" | "warning";
  addresses?: string[];
  rowIndexes?: number[];
  feeRatio?: number;
}

export interface SplitAnalyzeResult {
  suggestions: SplitSuggestion[];
  duplicateGroups: Array<{
    address: string;
    count: number;
    rowIndexes: number[];
  }>;
}

const HIGH_FEE_RATIO_THRESHOLD = 0.05;

function normalizeAddress(address: string): string {
  return address.trim().toUpperCase();
}

function parseStroops(value?: string): bigint | null {
  if (value === undefined) return null;
  if (!/^\d+$/.test(value)) return null;
  return BigInt(value);
}

export function analyzeSplitDraft(payload: SplitAnalyzeRequest): SplitAnalyzeResult {
  const duplicateMap = new Map<string, number[]>();

  payload.recipients.forEach((recipient, index) => {
    const normalizedAddress = normalizeAddress(recipient.address);
    const existingIndexes = duplicateMap.get(normalizedAddress) ?? [];
    existingIndexes.push(index);
    duplicateMap.set(normalizedAddress, existingIndexes);
  });

  const duplicateGroups = Array.from(duplicateMap.entries())
    .filter(([, rowIndexes]) => rowIndexes.length > 1)
    .map(([address, rowIndexes]) => ({
      address,
      count: rowIndexes.length,
      rowIndexes,
    }));

  const suggestions: SplitSuggestion[] = duplicateGroups.map((group) => ({
    type: "merge_duplicate_addresses",
    severity: "info",
    message: `Address ${group.address} appears ${group.count} times. Merge into one row?`,
    addresses: [group.address],
    rowIndexes: group.rowIndexes,
  }));

  const estimatedFeeStroops = parseStroops(payload.estimatedFeeStroops);
  const totalAmountStroops = parseStroops(payload.totalAmountStroops);

  if (
    estimatedFeeStroops !== null &&
    totalAmountStroops !== null &&
    totalAmountStroops > 0n
  ) {
    const feeRatio = Number(estimatedFeeStroops) / Number(totalAmountStroops);

    if (feeRatio >= HIGH_FEE_RATIO_THRESHOLD) {
      suggestions.push({
        type: "high_fee_transaction",
        severity: "warning",
        message: `Estimated fee is ${(feeRatio * 100).toFixed(2)}% of the split total. Consider consolidating rows before submitting.`,
        feeRatio,
      });
    }
  }

  return {
    suggestions,
    duplicateGroups,
  };
}
