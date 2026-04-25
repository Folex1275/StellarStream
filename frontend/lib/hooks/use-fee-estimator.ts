"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeeBreakdown {
  /** Base network fee in XLM: baseFeeStroops * txSize / 10_000_000 */
  networkFee: number;
  /** Soroban resource fee in XLM derived from simulation */
  resourceFee: number;
  /** Nebula Protocol fee in XLM from the Fee Oracle */
  nebulaFee: number;
  /** Sum of all three */
  totalFee: number;
}

export type FeeEstimatorStatus = "idle" | "loading" | "success" | "error";

export interface UseFeeEstimatorResult {
  status: FeeEstimatorStatus;
  breakdown: FeeBreakdown | null;
  errorMessage: string | null;
}

export interface UseFeeEstimatorOptions {
  /** Base-64 XDR of the transaction to simulate */
  transactionXdr: string | null;
  /** Number of recipients — triggers recalculation when it changes */
  recipientCount: number;
  /** Debounce delay in ms (default: 500) */
  debounceMs?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STROOPS_PER_XLM = 10_000_000;
const BASE_FEE_STROOPS = 100;
// Approximate transaction size in bytes for base-fee calculation
const TX_SIZE_BYTES = 300;

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "";

// ─── Oracle response shape ────────────────────────────────────────────────────

interface FeeOracleResponse {
  baseFeeStroops: number;
  nebulaFeeXlm: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFeeEstimator({
  transactionXdr,
  recipientCount,
  debounceMs = 500,
}: UseFeeEstimatorOptions): UseFeeEstimatorResult {
  const [status, setStatus] = useState<FeeEstimatorStatus>("idle");
  const [breakdown, setBreakdown] = useState<FeeBreakdown | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track the latest request to discard stale responses
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!transactionXdr) {
      setStatus("idle");
      setBreakdown(null);
      setErrorMessage(null);
      return;
    }

    const timer = setTimeout(async () => {
      const requestId = ++requestIdRef.current;

      setStatus("loading");
      setBreakdown(null);
      setErrorMessage(null);

      try {
        // Run simulation and oracle fetch in parallel
        const [simRes, oracleRes] = await Promise.all([
          fetch(
            `/api/v2/fees/estimate?transactionXdr=${encodeURIComponent(transactionXdr)}`
          ),
          fetch(`${BACKEND_URL}/api/v3/fees/oracle`),
        ]);

        // Discard if a newer request has started
        if (requestId !== requestIdRef.current) return;

        if (!simRes.ok) {
          const body = await simRes.json().catch(() => ({ error: simRes.statusText }));
          throw new Error(body.error ?? `Simulation failed (HTTP ${simRes.status})`);
        }

        const simData = await simRes.json() as { inclusionFee: number; resourceFee: number };

        // Oracle is best-effort — fall back to network defaults if unavailable
        let baseFeeStroops = BASE_FEE_STROOPS;
        let nebulaFeeXlm = 0;
        if (oracleRes.ok) {
          const oracle = await oracleRes.json() as FeeOracleResponse;
          baseFeeStroops = oracle.baseFeeStroops ?? BASE_FEE_STROOPS;
          nebulaFeeXlm = oracle.nebulaFeeXlm ?? 0;
        }

        const networkFee = (baseFeeStroops * TX_SIZE_BYTES) / STROOPS_PER_XLM;
        const resourceFee = simData.resourceFee / STROOPS_PER_XLM;
        const totalFee = networkFee + resourceFee + nebulaFeeXlm;

        if (requestId !== requestIdRef.current) return;

        setBreakdown({ networkFee, resourceFee, nebulaFee: nebulaFeeXlm, totalFee });
        setStatus("success");
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        const message = err instanceof Error ? err.message : "Unknown error during fee estimation";
        setErrorMessage(message);
        setStatus("error");
      }
    }, debounceMs);

    return () => clearTimeout(timer);
    // recipientCount is intentionally included to trigger recalculation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionXdr, recipientCount, debounceMs]);

  return { status, breakdown, errorMessage };
}
