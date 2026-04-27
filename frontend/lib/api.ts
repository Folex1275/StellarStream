// ─── API Client ───────────────────────────────────────────────────────────────
// Thin fetch wrapper matching the project's inline-mock pattern.
// Base URL is read from env; falls back to localhost for local dev.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface GasEvent {
  id: string;
  type: "Refill" | "Debit";
  amount: number;
  txHash: string;
  timestamp: string; // ISO-8601
}

export async function fetchGasEvents(walletAddress: string): Promise<GasEvent[]> {
  const res = await fetch(
    `${BASE_URL}/api/gas-events?wallet=${encodeURIComponent(walletAddress)}`
  );
  if (!res.ok) throw new Error(`Failed to fetch gas events: ${res.status}`);
  return res.json() as Promise<GasEvent[]>;
}
