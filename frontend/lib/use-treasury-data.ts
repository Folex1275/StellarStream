"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// Placeholder for the DAO Treasury address
export const DAO_TREASURY_ADDRESS = "GDDAO_TREASURY_777_STREAMS_X99_ABC";

export interface TreasuryTransaction {
  id: string;
  type: "inflow" | "outflow";
  amount: number;
  token: string;
  timestamp: number;
  counterParty: string;
  category: string;
}

export interface MonthlyFlow {
  month: string;
  inflow: number;
  outflow: number;
}

export interface TreasuryData {
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  monthlyHistory: MonthlyFlow[];
  recentTransactions: TreasuryTransaction[];
}

/**
 * Mock data generation for treasury splits and inflows.
 */
function generateMockTreasuryHistory(): TreasuryTransaction[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const transactions: TreasuryTransaction[] = [];

  // Generate 20 transactions over the last 90 days
  for (let i = 0; i < 20; i++) {
    const isOutflow = Math.random() > 0.3; // 70% are outflows (splits)
    const amount = isOutflow 
      ? 500 + Math.random() * 5000 
      : 2000 + Math.random() * 8000;
    
    transactions.push({
      id: `tx_${i}`,
      type: isOutflow ? "outflow" : "inflow",
      amount,
      token: "USDC",
      timestamp: now - (i * 4 * dayMs) - (Math.random() * 2 * dayMs),
      counterParty: isOutflow ? `G...RECIPIENT_${i}` : `G...DONOR_${i}`,
      category: isOutflow ? "DAO Split" : "Treasury Inflow",
    });
  }

  return transactions.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Hook to fetch and aggregate DAO Treasury financial data.
 */
export function useTreasuryData() {
  const [rawHistory, setRawHistory] = useState<TreasuryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise((r) => setTimeout(r, 1000));
      const data = generateMockTreasuryHistory();
      setRawHistory(data);
      setError(null);
    } catch (e) {
      setError("Failed to load treasury history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const treasuryData = useMemo((): TreasuryData | null => {
    if (rawHistory.length === 0) return null;

    const totalInflow = rawHistory
      .filter((t) => t.type === "inflow")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOutflow = rawHistory
      .filter((t) => t.type === "outflow")
      .reduce((sum, t) => sum + t.amount, 0);

    // Aggregate monthly data
    const monthlyMap = new Map<string, { inflow: number, outflow: number }>();
    
    rawHistory.forEach((t) => {
      const date = new Date(t.timestamp);
      const month = date.toLocaleString('default', { month: 'short' });
      const current = monthlyMap.get(month) || { inflow: 0, outflow: 0 };
      
      if (t.type === "inflow") {
        current.inflow += t.amount;
      } else {
        current.outflow += t.amount;
      }
      monthlyMap.set(month, current);
    });

    const monthlyHistory = Array.from(monthlyMap.entries())
      .map(([month, flow]) => ({
        month,
        inflow: flow.inflow,
        outflow: flow.outflow,
      }))
      .reverse(); // Simplified: should ideally sort by date

    return {
      totalInflow,
      totalOutflow,
      netFlow: totalInflow - totalOutflow,
      monthlyHistory,
      recentTransactions: rawHistory.slice(0, 10),
    };
  }, [rawHistory]);

  return {
    data: treasuryData,
    loading,
    error,
    refreshData,
  };
}
