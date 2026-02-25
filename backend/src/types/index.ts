// Type definitions for StellarStream backend
// High-precision financial data types for Stellar network

export interface StreamData {
  id: string;
  sender: string;
  receiver: string;
  amount: string; // Using string for high-precision decimal values
  startTime: number;
  endTime: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface StellarTransaction {
  hash: string;
  ledger: number;
  timestamp: number;
  operations: unknown[];
}

export interface EnrichedStream {
  id: string;
  sender: string;
  receiver: string;
  tokenAddress: string;
  amountPerSecond: string;
  totalAmount: string;
  status: string;
  estimatedUsdValue: number | null;
}
