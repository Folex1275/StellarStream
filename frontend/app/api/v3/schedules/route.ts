import { NextResponse } from "next/server";

export interface ScheduledSplit {
  id: string;
  title: string;
  token: string;
  /** Total amount per occurrence in token units */
  amount: number;
  /** ISO date of next execution */
  nextRunAt: string;
  /** Recurrence interval in days. null = one-shot */
  intervalDays: number | null;
  /** How many future occurrences to project (for recurring). Default 3. */
  occurrences?: number;
}

// Mock data — replace with a real backend fetch when ready
const MOCK_SCHEDULES: ScheduledSplit[] = [
  {
    id: "sched-001",
    title: "Monthly Contributor Payroll",
    token: "USDC",
    amount: 18_500,
    nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    intervalDays: 30,
    occurrences: 3,
  },
  {
    id: "sched-002",
    title: "Bi-weekly DAO Rewards",
    token: "XLM",
    amount: 8_000,
    nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    intervalDays: 14,
    occurrences: 6,
  },
  {
    id: "sched-003",
    title: "Q2 Contractor Bonus",
    token: "USDC",
    amount: 12_000,
    nextRunAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 22).toISOString(),
    intervalDays: null,
  },
];

export async function GET() {
  // TODO: proxy to backend: GET /api/v3/schedules
  return NextResponse.json(MOCK_SCHEDULES);
}
