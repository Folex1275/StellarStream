"use client";

// lib/hooks/use-duplicate-split.ts
// Clones a past successful disbursement into a new draft and triggers a balance check.

import { useCallback, useEffect, useState } from "react";
import { useSplitSync } from "@/lib/providers/SplitSyncProvider";
import type { DraftProposal } from "@/app/api/v3/proposals/pending/route";

export type BalanceCheckStatus = "idle" | "checking" | "ok" | "insufficient";

export interface UseDuplicateSplitReturn {
  /** Clone a past disbursement. Returns the new draft ID. */
  duplicate: (source: DraftProposal) => string;
  /** ID of the most recently cloned draft, null when none pending. */
  clonedId: string | null;
  /** Balance check status for the cloned draft. */
  balanceStatus: BalanceCheckStatus;
}

/**
 * Wraps cloneDisbursement from SplitSyncProvider and automatically
 * triggers a balance check whenever a new clone is created.
 *
 * The balance check is a lightweight simulation — replace the
 * `checkBalance` body with a real RPC/API call when the backend is ready.
 */
export function useDuplicateSplit(walletBalance?: bigint): UseDuplicateSplitReturn {
  const { cloneDisbursement, pendingBalanceCheckId, clearPendingBalanceCheck, proposals } =
    useSplitSync();

  const [balanceStatus, setBalanceStatus] = useState<BalanceCheckStatus>("idle");

  const duplicate = useCallback(
    (source: DraftProposal): string => {
      setBalanceStatus("idle");
      return cloneDisbursement(source);
    },
    [cloneDisbursement],
  );

  // Run balance check whenever a new clone lands
  useEffect(() => {
    if (!pendingBalanceCheckId) return;

    const draft = proposals.find((p) => p.id === pendingBalanceCheckId);
    if (!draft) return;

    setBalanceStatus("checking");

    // Simulate async balance check — swap for real RPC call as needed
    const timer = setTimeout(() => {
      if (walletBalance !== undefined) {
        const totalStroops = BigInt(Math.round(draft.totalAmount * 1e7));
        setBalanceStatus(walletBalance >= totalStroops ? "ok" : "insufficient");
      } else {
        // No wallet balance provided — mark ok optimistically
        setBalanceStatus("ok");
      }
      clearPendingBalanceCheck();
    }, 800);

    return () => clearTimeout(timer);
  }, [pendingBalanceCheckId, proposals, walletBalance, clearPendingBalanceCheck]);

  return { duplicate, clonedId: pendingBalanceCheckId, balanceStatus };
}
