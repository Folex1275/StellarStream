"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export interface DisbursementEvent {
  id: string;
  timestamp: number;
  resourceFeeXlm: number;
}

export interface GasAdvisorSuggestion {
  averageCostXlm: number;
  disbursementsPerMonth: number;
  suggestedBufferXlm: number;
  currentRunwayDays: number | null;
  history: DisbursementEvent[];
}

/**
 * Mock function to fetch last 10 disbursement costs.
 * In production, this would query the Soroban audit log or a history indexer.
 */
async function fetchDisbursementHistory(): Promise<DisbursementEvent[]> {
  await new Promise((r) => setTimeout(r, 800));
  
  // Generate 10 plausible disbursement events from the last 30 days
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  return Array.from({ length: 10 }, (_, i) => ({
    id: `tx_${10 - i}`,
    // Spread over ~20 days to simulate periodic activity
    timestamp: now - (i * 2.1 * dayMs) - (Math.random() * dayMs),
    // resource fees vary based on ledger state and batch size
    resourceFeeXlm: 0.05 + Math.random() * 0.15,
  })).reverse();
}

/**
 * Hook to analyze disbursement history and suggest optimal gas tank levels.
 */
export function useGasAdvisor(currentBalanceXlm: number = 0) {
  const [history, setHistory] = useState<DisbursementEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDisbursementHistory();
      setHistory(data);
      setError(null);
    } catch (e) {
      setError("Failed to fetch disbursement history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const suggestion = useMemo((): GasAdvisorSuggestion | null => {
    if (history.length < 2) return null;

    // 1. Calculate Average Cost
    const totalCost = history.reduce((acc: number, h: DisbursementEvent) => acc + h.resourceFeeXlm, 0);
    const averageCostXlm = totalCost / history.length;

    // 2. Calculate Burn Rate (Frequency)
    const timeSpanMs = history[history.length - 1].timestamp - history[0].timestamp;
    const timeSpanDays = timeSpanMs / (1000 * 60 * 60 * 24);
    
    // Protect against zero time span
    const safeDays = Math.max(timeSpanDays, 0.1);
    const disbursementsPerDay = (history.length - 1) / safeDays;
    const disbursementsPerMonth = disbursementsPerDay * 30.44; // average month

    // 3. Suggest 3-Month Buffer (90 days)
    // Formula: (Avg Cost * Frequency * 90) + 10% safety margin + 5 XLM base account reserve
    const suggestedBufferXlm = (averageCostXlm * disbursementsPerDay * 91.32) * 1.1 + 5;

    // 4. Current Runway
    const currentRunwayDays = disbursementsPerDay > 0 ? currentBalanceXlm / (averageCostXlm * disbursementsPerDay) : null;

    return {
      averageCostXlm,
      disbursementsPerMonth,
      suggestedBufferXlm,
      currentRunwayDays,
      history,
    };
  }, [history, currentBalanceXlm]);

  return {
    suggestion,
    loading,
    error,
    refreshHistory,
  };
}
