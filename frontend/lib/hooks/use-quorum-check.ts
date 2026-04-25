"use client";

// lib/hooks/use-quorum-check.ts
// Issue #679 — Quorum-Check Pre-Submission Logic

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "@/lib/wallet-context";
import { Horizon } from "@stellar/stellar-sdk";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Signer {
  key: string;
  weight: number;
  type: "ed25519" | "sha256" | "preauth" | "custom";
}

export interface AccountThreshold {
  low: number;
  med: number;
  high: number;
}

export interface QuorumCheckResult {
  /** Whether the user's weight meets or exceeds the transaction threshold */
  canExecute: boolean;
  /** The user's weight from their signer entry */
  userWeight: number;
  /** The threshold required for execution (using 'med' by default) */
  threshold: number;
  /** All signers for the account */
  signers: Signer[];
  /** Account thresholds */
  thresholds: AccountThreshold;
  /** Loading state while fetching account data */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refresh the quorum check data */
  refresh: () => Promise<void>;
}

export type QuorumStatus = "loading" | "sufficient" | "insufficient" | "error";

// ─── Constants ───────────────────────────────────────────────────────────────

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-rpc.stellar.org";

/**
 * Threshold level to use for transaction execution.
 * - 'low': Low security (e.g., claimable balances)
 * - 'med': Medium security (e.g., payments, streaming)
 * - 'high': High security (e.g., account merge, clawback)
 */
const DEFAULT_THRESHOLD_LEVEL: keyof AccountThreshold = "med";

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * useQuorumCheck - Checks if the connected wallet has sufficient signing weight
 * to execute a transaction, or if it needs to trigger a multi-sig proposal.
 *
 * Usage:
 *   const quorum = useQuorumCheck();
 *
 *   if (quorum.status === "loading") return <Spinner />;
 *   if (!quorum.canExecute) {
 *     return <ProposeTransactionButton />;
 *   }
 *   return <ExecuteButton />;
 */
export function useQuorumCheck(): QuorumCheckResult {
  const { address, isConnected, network } = useWallet();
  const [signers, setSigners] = useState<Signer[]>([]);
  const [thresholds, setThresholds] = useState<AccountThreshold>({
    low: 0,
    med: 0,
    high: 0,
  });
  const [userWeight, setUserWeight] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountData = useCallback(async () => {
    if (!address || !isConnected) {
      setSigners([]);
      setThresholds({ low: 0, med: 0, high: 0 });
      setUserWeight(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const horizon = new Horizon.Server("https://horizon.stellar.org");

      // Fetch account data from Horizon
      const accountData = await horizon.loadAccount(address);

      // Extract thresholds (Account has these as properties)
      const newThresholds: AccountThreshold = {
        low: accountData.thresholds.low_threshold,
        med: accountData.thresholds.med_threshold,
        high: accountData.thresholds.high_threshold,
      };

      // Extract signers
      const parsedSigners: Signer[] = accountData.signers.map((signer) => ({
        key: signer.key,
        weight: signer.weight,
        type: (() => {
          const keyType = signer.key.split(":")[0];
          switch (keyType) {
            case "ed25519":
              return "ed25519";
            case "sha256":
              return "sha256";
            case "preauth":
              return "preauth";
            default:
              return "custom";
          }
        })(),
      }));

      // Find the current user's weight
      const currentUserSigner = parsedSigners.find(
        (s) => s.key === address || s.key.startsWith(address.slice(0, 10))
      );
      const currentUserWeight = currentUserSigner?.weight ?? 0;

      setSigners(parsedSigners);
      setThresholds(newThresholds);
      setUserWeight(currentUserWeight);
    } catch (err) {
      console.error("[QuorumCheck] Failed to fetch account data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch account data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Fetch account data on mount or when address changes
  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  // Calculate if user can execute
  const threshold = thresholds[DEFAULT_THRESHOLD_LEVEL];
  const canExecute = userWeight >= threshold;

  return {
    canExecute,
    userWeight,
    threshold,
    signers,
    thresholds,
    isLoading,
    error,
    refresh: fetchAccountData,
  };
}

/**
 * useQuorumStatus - Returns a simple status enum for UI rendering
 */
export function useQuorumStatus(): {
  status: QuorumStatus;
  result: QuorumCheckResult;
} {
  const result = useQuorumCheck();

  if (result.isLoading) {
    return { status: "loading", result };
  }

  if (result.error) {
    return { status: "error", result };
  }

  if (result.canExecute) {
    return { status: "sufficient", result };
  }

  return { status: "insufficient", result };
}
