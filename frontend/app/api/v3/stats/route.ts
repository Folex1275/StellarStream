import { NextResponse } from "next/server";

export interface TopRecipient {
  address: string;
  label?: string;
  totalReceived: number; // USD
}

export interface AssetVolume {
  token: string;
  usdVolume: number;
  color: string;
}

export interface TreasuryStats {
  totalVolume: number;       // USD all-time
  activeStreams: number;
  topRecipients: TopRecipient[];
  assetVolumes: AssetVolume[];
}

const MOCK_STATS: TreasuryStats = {
  totalVolume: 4_820_500,
  activeStreams: 142,
  topRecipients: [
    { address: "GBTY...8NOP", label: "Engineering",  totalReceived: 980_000 },
    { address: "GCQR...2STU", label: "Design",       totalReceived: 640_000 },
    { address: "GDZX...4KLM", label: "Operations",   totalReceived: 510_000 },
    { address: "GABC...7XYZ", label: "Marketing",    totalReceived: 390_000 },
    { address: "GDEF...3QRS", label: "Legal",        totalReceived: 280_000 },
  ],
  assetVolumes: [
    { token: "USDC", usdVolume: 3_856_400, color: "#2775CA" },
    { token: "XLM",  usdVolume:   964_100, color: "#22d3ee" },
  ],
};

/**
 * GET /api/v3/stats
 * Returns treasury health stats for the org admin dashboard.
 */
export async function GET() {
  // TODO: replace with real backend fetch:
  // const res = await fetch(`${process.env.BACKEND_URL}/api/v3/stats`, { ... });
  return NextResponse.json(MOCK_STATS);
}
