"use client";

/**
 * use-optimistic-signing.ts
 *
 * Implements "Optimistic Signing" for high-complexity V3 disbursement
 * transactions.
 *
 * Problem: Hardware wallets (Ledger, Trezor) and even software wallets can
 * take 30–120 s to confirm a large Soroban XDR.  Without special handling the
 * UI either times out or shows a frozen spinner with no feedback.
 *
 * Solution:
 *   1. The moment `sign()` is called the state transitions to `"awaiting"`.
 *      The UI can immediately render a "Waiting for wallet confirmation…"
 *      overlay — no timeout is started.
 *   2. XDR payloads are checked against wallet size limits before the popup
 *      opens (via `xdr-size-guard`).
 *   3. On success the state moves to `"success"` with the signed XDR.
 *   4. On rejection / error the state moves to `"error"` with a message.
 *   5. `reset()` returns to `"idle"` so the user can retry.
 *
 * The hook is intentionally wallet-agnostic: callers pass a `signerFn` that
 * wraps whichever wallet API they use (Freighter, Albedo, xBull, etc.).
 */

import { useState, useCallback, useRef } from "react";
import { checkXdrSize, assertXdrSizesWithinLimit } from "@/lib/xdr-size-guard";
import type { XdrSizeReport } from "@/lib/xdr-size-guard";

// ── Types ─────────────────────────────────────────────────────────────────────

export type OptimisticSigningStatus =
  | "idle"
  | "checking"    // running XDR size guard
  | "awaiting"    // wallet popup open, waiting for user confirmation
  | "success"
  | "error";

export interface OptimisticSigningState {
  status: OptimisticSigningStatus;
  /** Index of the batch currently being signed (0-based). */
  currentBatch: number;
  /** Total number of batches to sign. */
  totalBatches: number;
  /** Signed XDR strings collected so far. */
  signedXdrs: string[];
  /** Size reports for each XDR (populated after the `checking` phase). */
  sizeReports: XdrSizeReport[];
  /** Error message when status === "error". */
  error: string | null;
}

/**
 * A function that signs one XDR string and returns the signed XDR.
 * Wrap your wallet's `signTransaction` call here.
 */
export type SignerFn = (xdrBase64: string) => Promise<string>;

export interface UseOptimisticSigningReturn {
  state: OptimisticSigningState;
  /**
   * Sign one or more XDR payloads sequentially.
   *
   * @param xdrList    Array of base64 XDR strings to sign in order.
   * @param signerFn   Wallet signing function.
   * @param walletType Wallet key for size-limit checks ("freighter" | "albedo" | …).
   * @returns          Array of signed XDR strings on full success.
   */
  sign: (
    xdrList: string[],
    signerFn: SignerFn,
    walletType?: string | null
  ) => Promise<string[]>;
  /** Reset state back to idle so the user can retry. */
  reset: () => void;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const INITIAL_STATE: OptimisticSigningState = {
  status: "idle",
  currentBatch: 0,
  totalBatches: 0,
  signedXdrs: [],
  sizeReports: [],
  error: null,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOptimisticSigning(): UseOptimisticSigningReturn {
  const [state, setState] = useState<OptimisticSigningState>(INITIAL_STATE);

  // Ref lets us read the latest state inside async callbacks without stale closures.
  const stateRef = useRef(state);
  stateRef.current = state;

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const sign = useCallback(
    async (
      xdrList: string[],
      signerFn: SignerFn,
      walletType?: string | null
    ): Promise<string[]> => {
      if (xdrList.length === 0) {
        throw new Error("useOptimisticSigning: xdrList must not be empty.");
      }

      // ── Phase 1: size check ────────────────────────────────────────────────
      setState((_prev: OptimisticSigningState) => ({
        ..._prev,
        status: "checking",
        totalBatches: xdrList.length,
        currentBatch: 0,
        signedXdrs: [],
        sizeReports: [],
        error: null,
      }));

      let sizeReports: XdrSizeReport[];
      try {
        // Collect reports first so we can surface them in the UI.
        sizeReports = xdrList.map((xdr) => checkXdrSize(xdr, walletType));
        // Then assert — throws on the first oversized payload.
        assertXdrSizesWithinLimit(xdrList, walletType);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setState((p: OptimisticSigningState) => ({ ...p, status: "error", error: message }));
        throw err;
      }

      setState((p: OptimisticSigningState) => ({ ...p, sizeReports }));

      // ── Phase 2: sequential optimistic signing ────────────────────────────
      const signedXdrs: string[] = [];

      for (let i = 0; i < xdrList.length; i++) {
        // Transition to "awaiting" immediately — no timeout is set.
        // The UI should render a persistent "Confirm on wallet" overlay.
        setState((p: OptimisticSigningState) => ({
          ...p,
          status: "awaiting",
          currentBatch: i,
        }));

        try {
          const signed = await signerFn(xdrList[i]);
          signedXdrs.push(signed);

          // Optimistically update the collected list after each success.
          setState((p: OptimisticSigningState) => ({
            ...p,
            signedXdrs: [...signedXdrs],
          }));
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          setState((p: OptimisticSigningState) => ({
            ...p,
            status: "error",
            error: message,
          }));
          throw err;
        }
      }

      // ── Phase 3: done ──────────────────────────────────────────────────────
      setState((p: OptimisticSigningState) => ({
        ...p,
        status: "success",
        signedXdrs,
      }));

      return signedXdrs;
    },
    []
  );

  return { state, sign, reset };
}
