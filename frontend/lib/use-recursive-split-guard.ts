"use client";
import { useMemo } from "react";
import { CONTRACT_ID, NEBULA_CONTRACT_ID } from "@/lib/providers";

export interface RecursiveSplitGuardResult {
  isSelfReference: boolean;
  offendingAddresses: string[];
}

export function useRecursiveSplitGuard(addresses: string[]): RecursiveSplitGuardResult {
  return useMemo(() => {
    const contractIds = [CONTRACT_ID, NEBULA_CONTRACT_ID]
      .filter(Boolean)
      .map(a => a.trim().toUpperCase());

    const cleaned = addresses.map(a => a.trim().toUpperCase()).filter(Boolean);

    const offending = cleaned.filter(a => contractIds.includes(a));

    // Also flag duplicate recipients
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const a of cleaned) {
      if (seen.has(a)) dupes.push(a);
      seen.add(a);
    }

    const all = Array.from(new Set([...offending, ...dupes]));
    return { isSelfReference: all.length > 0, offendingAddresses: all };
  }, [addresses]);
}
