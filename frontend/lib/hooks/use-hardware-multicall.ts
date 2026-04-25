"use client";

// lib/hooks/use-hardware-multicall.ts
// Issue #780 — Hardware-Wallet Multi-Call Handler
//
// Handles the Ledger "handshake" pattern required when signing multiple
// Soroban invocations in sequence:
//   1. Sign tx[0] → wait for device ready → sign tx[1] → …
//   2. On 0x6985 (User Rejected), surface a "Restart Current Batch" action.

import { useState, useCallback } from "react";

export type MultiCallStatus = "idle" | "awaiting_device" | "signing" | "done" | "rejected";

export interface MultiCallState {
  status: MultiCallStatus;
  currentIndex: number;
  total: number;
  /** Set when the device returns 0x6985 */
  rejectedIndex: number | null;
}

export interface UseHardwareMulticallReturn {
  state: MultiCallState;
  /** Execute `txns` sequentially with inter-signature prompts. */
  execute: (txns: (() => Promise<string>)[]) => Promise<string[]>;
  /** Restart the batch from the rejected index. */
  restartFromRejected: (txns: (() => Promise<string>)[]) => Promise<string[]>;
  reset: () => void;
}

const LEDGER_USER_REJECTED = "0x6985";

function isUserRejected(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes(LEDGER_USER_REJECTED) || msg.toLowerCase().includes("user rejected");
}

const INITIAL_STATE: MultiCallState = {
  status: "idle",
  currentIndex: 0,
  total: 0,
  rejectedIndex: null,
};

export function useHardwareMulticall(): UseHardwareMulticallReturn {
  const [state, setState] = useState<MultiCallState>(INITIAL_STATE);

  const runFrom = useCallback(
    async (
      txns: (() => Promise<string>)[],
      startIndex: number,
    ): Promise<string[]> => {
      const results: string[] = new Array(startIndex).fill("");

      setState((prev) => ({
        ...prev,
        status: "signing",
        currentIndex: startIndex,
        total: txns.length,
        rejectedIndex: null,
      }));

      for (let i = startIndex; i < txns.length; i++) {
        // Prompt "Ready for next signature?" between submissions
        if (i > startIndex) {
          setState((prev) => ({ ...prev, status: "awaiting_device", currentIndex: i }));
          // Small yield so the UI can re-render the prompt before the next sign call
          await new Promise((r) => setTimeout(r, 400));
        }

        setState((prev) => ({ ...prev, status: "signing", currentIndex: i }));

        try {
          const hash = await txns[i]();
          results.push(hash);
        } catch (err) {
          if (isUserRejected(err)) {
            setState((prev) => ({
              ...prev,
              status: "rejected",
              rejectedIndex: i,
            }));
            return results;
          }
          throw err;
        }
      }

      setState((prev) => ({ ...prev, status: "done" }));
      return results;
    },
    [],
  );

  const execute = useCallback(
    (txns: (() => Promise<string>)[]) => runFrom(txns, 0),
    [runFrom],
  );

  const restartFromRejected = useCallback(
    (txns: (() => Promise<string>)[]) => {
      const from = state.rejectedIndex ?? 0;
      return runFrom(txns, from);
    },
    [state.rejectedIndex, runFrom],
  );

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return { state, execute, restartFromRejected, reset };
}
