"use client";
import { useMemo } from "react";
import { CONTRACT_ID, NEBULA_CONTRACT_ID } from "@/lib/providers";

export interface RecursiveSplitGuardResult {
  isSelfReference: boolean;
  offendingAddresses: string[];
  hasDuplicates: boolean;
}

export function useRecursiveSplitGuard(addresses: string[]): RecursiveSplitGuardResult {
  return useMemo(() => {
    const contractIds = [CONTRACT_ID, NEBULA_CONTRACT_ID]
      .filter(Boolean)
      .map((id) => id.trim().toUpperCase());

    const cleaned = addresses.map((a) => a.trim().toUpperCase()).filter(Boolean);

    const offending = cleaned.filter((a) => contractIds.includes(a));

    // Duplicate recipient check
    const seen = new Set<string>();
    let hasDuplicates = false;
    for (const a of cleaned) {
      if (seen.has(a)) { hasDuplicates = true; break; }
      seen.add(a);
    }

    return {
      isSelfReference: offending.length > 0,
      offendingAddresses: offending,
      hasDuplicates,
    };
  }, [addresses]);
}
