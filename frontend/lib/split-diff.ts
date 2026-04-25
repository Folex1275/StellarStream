// lib/split-diff.ts

import type { RecipientRow } from "@/components/recipient-grid";

export type DiffStatus = "New" | "Removed" | "Changed" | "Unchanged";

export interface SplitDiffRow {
  id: string;
  address: string;
  baseAmount: string | null;
  currAmount: string | null;
  baseMemo: string | null;
  currMemo: string | null;
  status: DiffStatus;
  deltaAmount: number | null; // difference (Current - Baseline)
}

/**
 * Computes the difference between a baseline snapshot and a current snapshot.
 * Matches rows by their Stellar public address.
 */
export function computeSplitDiff(baseRows: RecipientRow[], currentRows: RecipientRow[]): SplitDiffRow[] {
  const result: SplitDiffRow[] = [];
  
  // Create a map of baseline recipients
  const baseMap = new Map<string, RecipientRow>();
  for (const row of baseRows) {
    // Only index validly formatted addresses to avoid empty string hashing collisions
    if (row.address.trim()) {
      baseMap.set(row.address.trim(), row);
    }
  }

  // Iterate current rows to find New, Changed, and Unchanged
  const currSet = new Set<string>();
  
  let idCounter = 0;
  
  for (const curr of currentRows) {
    const address = curr.address.trim();
    if (!address) continue;
    
    currSet.add(address);
    const base = baseMap.get(address);
    
    const currNum = parseFloat(curr.amount) || 0;
    
    if (!base) {
      // New recipient
      result.push({
        id: `diff-${++idCounter}`,
        address,
        baseAmount: null,
        currAmount: curr.amount,
        baseMemo: null,
        currMemo: curr.memo,
        status: "New",
        deltaAmount: currNum,
      });
    } else {
      // Present in both, check for changes
      const baseNum = parseFloat(base.amount) || 0;
      const isAmountChanged = baseNum !== currNum;
      // We can also check memo changes if desired, but "Changed Amount" is the primary diff
      const isChanged = isAmountChanged; 
      
      result.push({
        id: `diff-${++idCounter}`,
        address,
        baseAmount: base.amount,
        currAmount: curr.amount,
        baseMemo: base.memo,
        currMemo: curr.memo,
        status: isChanged ? "Changed" : "Unchanged",
        deltaAmount: isChanged ? currNum - baseNum : 0,
      });
    }
  }

  // Check for Removed rows (in Base but not in Current)
  for (const base of baseRows) {
    const address = base.address.trim();
    if (!address || currSet.has(address)) continue;
    
    const baseNum = parseFloat(base.amount) || 0;
    result.push({
      id: `diff-${++idCounter}`,
      address,
      baseAmount: base.amount,
      currAmount: null,
      baseMemo: base.memo,
      currMemo: null,
      status: "Removed",
      deltaAmount: -baseNum,
    });
  }

  // Sort: Removed, New, Changed, Unchanged
  const statusWeight: Record<DiffStatus, number> = {
    Removed: 1,
    New: 2,
    Changed: 3,
    Unchanged: 4,
  };

  result.sort((a, b) => statusWeight[a.status] - statusWeight[b.status]);

  return result;
}

/**
 * Creates a CSV string export of the diff results.
 */
export function exportDiffToCSV(diffs: SplitDiffRow[]): string {
  const headers = ["Address", "Status", "Baseline Amount", "Current Amount", "Delta"];
  const rows = diffs.map((d) => [
    d.address,
    d.status,
    d.baseAmount || "0",
    d.currAmount || "0",
    d.deltaAmount !== null ? (d.deltaAmount > 0 ? "+" + d.deltaAmount : d.deltaAmount.toString()) : "0"
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.join(","))
  ].join("\\n");

  return csvContent;
}
