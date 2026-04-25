import { useCallback } from "react";
import { glowToast } from "@/components/GlowToast";

export type TxOperation = "create_stream" | "withdraw" | "cancel_stream" | "generic";

export interface TxResult {
  hash: string;
  /** Parsed amount for withdrawal toasts */
  amount?: string;
  /** Token symbol for withdrawal toasts */
  token?: string;
}

/**
 * useTransactionToast
 *
 * Wraps any Soroban/XDR transaction call and fires the correct GlowToast
 * based on the operation type and result.
 *
 * Usage:
 *   const { send } = useTransactionToast();
 *   const result = await send("create_stream", () => contract.createStream(...));
 */
export function useTransactionToast() {
  const send = useCallback(
    async <T extends TxResult>(
      operation: TxOperation,
      fn: () => Promise<T>
    ): Promise<T> => {
      try {
        const result = await fn();

        switch (operation) {
          case "create_stream":
            glowToast.streamCreated(result.hash);
            break;
          case "withdraw":
            glowToast.withdrawalSuccess(
              result.amount ?? "0",
              result.token ?? "XLM",
              result.hash
            );
            break;
          default:
            // cancel_stream / generic — no success toast needed by spec
            break;
        }

        return result;
      } catch (err) {
        const reason =
          err instanceof Error ? err.message : "Unknown error occurred";
        glowToast.transactionFailed(reason);
        throw err;
      }
    },
    []
  );

  return { send };
}
