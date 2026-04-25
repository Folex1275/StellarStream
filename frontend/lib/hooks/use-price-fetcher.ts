"use client";

// lib/hooks/use-price-fetcher.ts
// Issue #689 — Multi-Asset "Value-Aggregator" in USD
// Fetches token prices from backend and provides utilities to calculate USD values

import { useState, useEffect, useCallback } from "react";

export interface TokenPrice {
  tokenAddress: string;
  symbol: string;
  priceUsd: number;
  decimals: number;
}

export interface PriceData {
  prices: TokenPrice[];
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and cache token prices from the backend
 * Uses /api/v1/prices endpoint with 60-second caching
 */
export function usePriceFetcher() {
  const [data, setData] = useState<PriceData>({
    prices: [],
    lastUpdated: null,
    isLoading: false,
    error: null,
  });

  const fetchPrices = useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/v1/prices");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch prices");
      }

      setData({
        prices: result.prices || [],
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Fetch prices on mount
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Get price for a specific token address
  const getPrice = useCallback(
    (tokenAddress: string): number => {
      const token = data.prices.find(
        (p) =>
          p.tokenAddress.toLowerCase() === tokenAddress.toLowerCase() ||
          p.symbol.toLowerCase() === tokenAddress.toLowerCase()
      );
      return token?.priceUsd ?? 0;
    },
    [data.prices]
  );

  // Get token info by address or symbol
  const getTokenInfo = useCallback(
    (tokenAddress: string): TokenPrice | undefined => {
      return data.prices.find(
        (p) =>
          p.tokenAddress.toLowerCase() === tokenAddress.toLowerCase() ||
          p.symbol.toLowerCase() === tokenAddress.toLowerCase()
      );
    },
    [data.prices]
  );

  return {
    ...data,
    fetchPrices,
    getPrice,
    getTokenInfo,
  };
}

/**
 * Calculate USD value for a given amount of tokens
 * @param amount - The token amount (in base units, e.g., stroops for XLM)
 * @param tokenAddress - The token address or symbol
 * @param prices - Array of token prices
 * @returns The USD value
 */
export function calculateUsdValue(
  amount: string | bigint | number,
  tokenAddress: string,
  prices: TokenPrice[]
): number {
  const token = prices.find(
    (p) =>
      p.tokenAddress.toLowerCase() === tokenAddress.toLowerCase() ||
      p.symbol.toLowerCase() === tokenAddress.toLowerCase()
  );

  if (!token || token.priceUsd === 0) {
    return 0;
  }

  // Convert amount to number (handle bigint)
  const amountNum = typeof amount === "bigint" 
    ? Number(amount) 
    : typeof amount === "string" 
      ? parseFloat(amount) 
      : amount;

  if (isNaN(amountNum)) {
    return 0;
  }

  // Normalize by decimals: amount / 10^decimals
  const normalizedAmount = amountNum / Math.pow(10, token.decimals);

  // Calculate USD value
  return normalizedAmount * token.priceUsd;
}

/**
 * Calculate total USD value for multiple recipients
 * @param recipients - Array of recipients with token addresses and amounts
 * @param prices - Array of token prices
 * @returns The total USD value
 */
export function calculateTotalUsdValue(
  recipients: Array<{ tokenAddress: string; amount: string | bigint | number }>,
  prices: TokenPrice[]
): number {
  return recipients.reduce((total, recipient) => {
    return total + calculateUsdValue(recipient.amount, recipient.tokenAddress, prices);
  }, 0);
}

/**
 * Format USD value for display
 * @param value - The USD value
 * @returns Formatted string (e.g., "$1,240.50")
 */
export function formatUsdValue(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
