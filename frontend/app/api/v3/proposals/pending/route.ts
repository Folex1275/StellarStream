import { NextRequest, NextResponse } from "next/server";

// Shape mirrors the backend /api/v3/proposals/pending contract.
// Replace mock data with a real fetch to the backend analytics layer.
export interface ProposalRecipient {
    address: string;
    amount: number;
    token: string;
    note?: string;
}

export interface DraftProposal {
    id: string;
    title: string;
    drafter: string;
    drafterEmail?: string;
    createdAt: string; // ISO
    expiresAt: string; // ISO
    recipients: ProposalRecipient[];
    totalAmount: number;
    token: string;
    status: "pending" | "approved" | "rejected";
}

const MOCK_PROPOSALS: DraftProposal[] = [
    {
        id: "prop-001",
        title: "Q2 Contractor Payroll Split",
        drafter: "GABC...7XYZ",
        drafterEmail: "drafter@example.com",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 46).toISOString(),
        token: "USDC",
        totalAmount: 24500,
        status: "pending",
        recipients: [
            { address: "GBTY...8NOP", amount: 8000, token: "USDC", note: "Lead Engineer" },
            { address: "GCQR...2STU", amount: 6500, token: "USDC", note: "Designer" },
            { address: "GDZX...4KLM", amount: 10000, token: "USDC", note: "PM" },
        ],
    },
    {
        id: "prop-002",
        title: "Marketing Campaign Disbursement",
        drafter: "GDEF...3QRS",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 21).toISOString(),
        token: "XLM",
        totalAmount: 5000,
        status: "pending",
        recipients: [
            { address: "GBTY...8NOP", amount: 2000, token: "XLM", note: "Content Creator" },
            { address: "GABC...7XYZ", amount: 3000, token: "XLM", note: "Ad Spend Wallet" },
        ],
    },
    {
        id: "prop-003",
        title: "Protocol Grants — Wave 3",
        drafter: "GCQR...2STU",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 16).toISOString(),
        token: "USDC",
        totalAmount: 75000,
        status: "pending",
        recipients: [
            { address: "GDZX...4KLM", amount: 25000, token: "USDC", note: "Grant #1" },
            { address: "GBTY...8NOP", amount: 25000, token: "USDC", note: "Grant #2" },
            { address: "GABC...7XYZ", amount: 15000, token: "USDC", note: "Grant #3" },
            { address: "GDEF...3QRS", amount: 10000, token: "USDC", note: "Grant #4" },
        ],
    },
];

export async function GET(_req: NextRequest) {
    // TODO: replace with real backend fetch:
    // const res = await fetch(`${process.env.BACKEND_URL}/api/v3/proposals/pending`, {
    //   headers: { Authorization: `Bearer ${token}` },
    // });
    // const data = await res.json();
    return NextResponse.json({ proposals: MOCK_PROPOSALS });
}
