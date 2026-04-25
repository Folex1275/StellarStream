"use client";

import { useState, useEffect, useRef } from "react";
import { getAssetPrice } from "./price-service";

const SLIPPAGE_THRESHOLD = 0.02; // 2%

export interface PriceSlippageResult {
  /** Price captured when the hook was first mounted (setup phase start). */
  priceAtStart: number | null;
  /** Latest fetched price. */
  priceNow: number | null;
  /** Absolute delta as a fraction, e.g. 0.025 = 2.5% */
  delta: number | null;
  /** True when |delta| > SLIPPAGE_THRESHOLD (2%). Requires a price refresh. */
  slippageExceeded: boolean;
  /** Call this after the user acknowledges and refreshes — resets priceAtStart to priceNow. */
  acknowledgeRefresh: () => void;
}

/**
 * Tracks price movement between setup start and confirmation.
 * Triggers slippageExceeded when the price moves more than 2%.
 *
 * @param assetCode - Stellar asset code, e.g. "XLM". Pass null to disable.
 * @param pollMs    - Polling interval in ms (default 15 000).
 */
export function usePriceSlippage(
  assetCode: string | null | undefined,
  pollMs = 15_000,
): PriceSlippageResult {
  const [priceAtStart, setPriceAtStart] = useState<number | null>(null);
  const [priceNow, setPriceNow] = useState<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!assetCode) return;
    let cancelled = false;

    const fetchAndCompare = async () => {
      const p = await getAssetPrice(assetCode);
      if (cancelled || p === null) return;

      // Capture baseline on first fetch
      if (startRef.current === null) {
        startRef.current = p;
        setPriceAtStart(p);
      }

      setPriceNow(p);
    };

    fetchAndCompare();
    const id = setInterval(fetchAndCompare, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [assetCode, pollMs]);

  const delta =
    priceAtStart !== null && priceNow !== null && priceAtStart !== 0
      ? Math.abs(priceNow - priceAtStart) / priceAtStart
      : null;

  const slippageExceeded = delta !== null && delta > SLIPPAGE_THRESHOLD;

  const acknowledgeRefresh = () => {
    if (priceNow === null) return;
    startRef.current = priceNow;
    setPriceAtStart(priceNow);
  };

  return { priceAtStart, priceNow, delta, slippageExceeded, acknowledgeRefresh };
}
