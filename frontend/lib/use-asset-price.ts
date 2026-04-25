"use client";

import { useState, useEffect, useRef } from "react";
import { getAssetPrice } from "./price-service";

interface UseAssetPriceResult {
  price: number | null;
  isLoading: boolean;
  justUpdated: boolean;
}

/**
 * Hook to fetch and poll for asset prices.
 *
 * @param assetCode - The Stellar asset code (e.g., "XLM")
 * @param intervalMs - Polling interval in milliseconds (default: 30000ms)
 */
export function useAssetPrice(
  assetCode: string | null | undefined,
  intervalMs: number = 30000
): UseAssetPriceResult {
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const lastPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!assetCode) return;

    let cancelled = false;

    const fetchPrice = async () => {
      if (!lastPriceRef.current) setIsLoading(true);
      
      const newPrice = await getAssetPrice(assetCode);
      
      if (cancelled) return;

      if (newPrice !== null && newPrice !== lastPriceRef.current) {
        setPrice(newPrice);
        
        // Only trigger "just updated" if it's not the first fetch
        if (lastPriceRef.current !== null) {
          setJustUpdated(true);
          setTimeout(() => {
            if (!cancelled) setJustUpdated(false);
          }, 2000);
        }
        
        lastPriceRef.current = newPrice;
      }
      
      setIsLoading(false);
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [assetCode, intervalMs]);

  return { price, isLoading, justUpdated };
}
