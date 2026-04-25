"use client";

// lib/use-trustline-preflight.ts
// Issue: Trustline Preflight Warning
// Checks which recipients are missing the required trustline for the selected asset.

import { useState, useCallback } from "react";

export interface TrustlineResult {
  /** Addresses that are missing the trustline */
  invalidAddresses: Set<string>;
  /** True while the check is running */
  isChecking: boolean;
  /** Error message if the check failed */
  error: string | null;
  /** Run the preflight check */
  check: (addresses: string[], assetCode: string, assetIssuer: string) => Promise<void>;
  /** Clear results */
  reset: () => void;
}

// ─── Mock backend call ────────────────────────────────────────────────────────
// Replace with: fetch(`${BACKEND_URL}/api/v1/preflight/trustlines`, { method: "POST", body: ... })

async function fetchTrustlineStatus(
  addresses: string[],
  assetCode: string,
  _assetIssuer: string,
): Promise<Record<string, boolean>> {
  await new Promise((r) => setTimeout(r, 700));
  // Mock: every other address is missing the trustline
  return Object.fromEntries(
    addresses.map((addr, i) => [addr, assetCode === "XLM" || i % 2 === 0]),
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTrustlinePreflight(): TrustlineResult {
  const [invalidAddresses, setInvalidAddresses] = useState<Set<string>>(new Set());
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(
    async (addresses: string[], assetCode: string, assetIssuer: string) => {
      if (addresses.length === 0) return;
      setIsChecking(true);
      setError(null);
      try {
        const result = await fetchTrustlineStatus(addresses, assetCode, assetIssuer);
        const invalid = new Set(
          Object.entries(result)
            .filter(([, hasTrustline]) => !hasTrustline)
            .map(([addr]) => addr),
        );
        setInvalidAddresses(invalid);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Trustline check failed");
      } finally {
        setIsChecking(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setInvalidAddresses(new Set());
    setError(null);
  }, []);

  return { invalidAddresses, isChecking, error, check, reset };
}
