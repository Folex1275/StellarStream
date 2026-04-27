"use client";
import { useState, useEffect } from "react";
export interface SplitEvent { id: string; date: string; recipient: string; token: string; amountUsd: number; streamId: string; }
export interface MonthlyDisbursement { month: string; label: string; totalUsd: number; events: SplitEvent[]; }
export interface DisbursementData { months: MonthlyDisbursement[]; totalUsd: number; peakMonth: string; }
const MOCK: MonthlyDisbursement[] = [
  { month:"2024-10",label:"Oct '24",totalUsd:42800,events:[{id:"e1",date:"2024-10-03",recipient:"GABC…1234",token:"USDC",amountUsd:18000,streamId:"s-001"},{id:"e2",date:"2024-10-15",recipient:"GDEF…5678",token:"USDC",amountUsd:14800,streamId:"s-002"},{id:"e3",date:"2024-10-28",recipient:"GHIJ…9012",token:"USDT",amountUsd:10000,streamId:"s-003"}]},
  { month:"2024-11",label:"Nov '24",totalUsd:61200,events:[{id:"e4",date:"2024-11-01",recipient:"GABC…1234",token:"USDC",amountUsd:22000,streamId:"s-001"},{id:"e5",date:"2024-11-14",recipient:"GKLM…3456",token:"USDC",amountUsd:25200,streamId:"s-004"},{id:"e6",date:"2024-11-29",recipient:"GDEF…5678",token:"USDT",amountUsd:14000,streamId:"s-002"}]},
  { month:"2024-12",label:"Dec '24",totalUsd:38500,events:[{id:"e7",date:"2024-12-05",recipient:"GHIJ…9012",token:"USDC",amountUsd:20000,streamId:"s-003"},{id:"e8",date:"2024-12-20",recipient:"GABC…1234",token:"USDC",amountUsd:18500,streamId:"s-001"}]},
  { month:"2025-01",label:"Jan '25",totalUsd:74100,events:[{id:"e9",date:"2025-01-02",recipient:"GABC…1234",token:"USDC",amountUsd:30000,streamId:"s-001"},{id:"e10",date:"2025-01-15",recipient:"GDEF…5678",token:"USDC",amountUsd:24100,streamId:"s-002"},{id:"e11",date:"2025-01-28",recipient:"GNOP…7890",token:"USDT",amountUsd:20000,streamId:"s-005"}]},
  { month:"2025-02",label:"Feb '25",totalUsd:55300,events:[{id:"e12",date:"2025-02-07",recipient:"GKLM…3456",token:"USDC",amountUsd:28000,streamId:"s-004"},{id:"e13",date:"2025-02-21",recipient:"GABC…1234",token:"USDC",amountUsd:27300,streamId:"s-001"}]},
  { month:"2025-03",label:"Mar '25",totalUsd:89700,events:[{id:"e14",date:"2025-03-01",recipient:"GABC…1234",token:"USDC",amountUsd:35000,streamId:"s-001"},{id:"e15",date:"2025-03-12",recipient:"GDEF…5678",token:"USDC",amountUsd:30000,streamId:"s-002"},{id:"e16",date:"2025-03-25",recipient:"GNOP…7890",token:"USDT",amountUsd:24700,streamId:"s-005"}]},
];
export function useDisbursementData(_address?: string): { data: DisbursementData | null; isLoading: boolean } {
  const [data, setData] = useState<DisbursementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(() => {
      const total = MOCK.reduce((s, m) => s + m.totalUsd, 0);
      const peak = MOCK.reduce((a, b) => b.totalUsd > a.totalUsd ? b : a);
      setData({ months: MOCK, totalUsd: total, peakMonth: peak.label });
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [_address]);
  return { data, isLoading };
}
