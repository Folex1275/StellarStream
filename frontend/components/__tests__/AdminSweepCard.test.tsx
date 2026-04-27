import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminSweepCard } from "../settings/AdminSweepCard";
import { vi, describe, it, expect } from "vitest";

// Mock the dependencies
vi.mock("@/lib/contracts/stellarstream", () => ({
    formatAmount: (amount: bigint) => amount.toString(),
    mockClient: {
        getOrphanBalances: vi.fn().mockResolvedValue([
            { assetCode: "USDC", balance: BigInt("1000000") },
        ]),
        reclaimDust: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock("@/lib/toast", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe("AdminSweepCard", () => {
    it("renders orphan balances", async () => {
        render(<AdminSweepCard />);
        
        expect(screen.getByText(/Scanning contract/i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText("USDC")).toBeInTheDocument();
            expect(screen.getByText("1000000")).toBeInTheDocument();
        });
    });

    it("triggers sweep action", async () => {
        render(<AdminSweepCard />);
        
        await waitFor(() => {
            expect(screen.getByText("Reclaim Dust")).toBeInTheDocument();
        });
        
        const sweepButton = screen.getByText("Reclaim Dust");
        fireEvent.click(sweepButton);
        
        expect(screen.getByText(/Preparing Sweep/i)).toBeInTheDocument();
    });
});
