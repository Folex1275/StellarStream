"use client";

import { useState, useEffect } from "react";

const HORIZON_URL = "https://horizon.stellar.org";
const DEFAULT_DECIMALS = 7;

/**
 * Fetches the decimal precision for a Stellar asset from Horizon.
 *
 * Native XLM always uses 7 decimals. For issued assets, Horizon's
 * asset endpoint returns `precision` (if set by the issuer via TOML)
 * or we fall back to 7 (the Stellar network default).
 *
 * @param assetCode   - e.g. "USDC", "XLM"
 * @param assetIssuer - issuer account ID (omit for native XLM)
 */
export function useAssetDecimals(
  assetCode: string | null | undefined,
  assetIssuer: string | null | undefined,
): { decimals: number; isLoading: boolean } {
  const [decimals, setDecimals] = useState(DEFAULT_DECIMALS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Native XLM is always 7
    if (!assetCode || !assetIssuer || assetCode === "XLM") {
      setDecimals(DEFAULT_DECIMALS);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch(
      `${HORIZON_URL}/assets?asset_code=${encodeURIComponent(assetCode)}&asset_issuer=${encodeURIComponent(assetIssuer)}&limit=1`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const record = data?._embedded?.records?.[0];
        // Horizon exposes `precision` for assets that declare it via TOML
        const precision =
          typeof record?.precision === "number"
            ? record.precision
            : DEFAULT_DECIMALS;
        setDecimals(precision);
      })
      .catch(() => {
        if (!cancelled) setDecimals(DEFAULT_DECIMALS);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assetCode, assetIssuer]);

  return { decimals, isLoading };
}
