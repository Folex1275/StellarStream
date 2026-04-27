import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Step3 } from "./page";
import { useProtocolStatus } from "@/lib/use-protocol-status";

// Mock the hooks
vi.mock("@/lib/use-protocol-status", () => ({
  useProtocolStatus: vi.fn(),
}));

vi.mock("@/lib/wallet-context", () => ({
  useWallet: vi.fn(() => ({ address: "GABC...1234" })),
}));

// Mock the priority hook
vi.mock("@/lib/use-transaction-priority", () => ({
  useTransactionPriority: vi.fn(() => ({
    tier: { id: "medium", label: "Medium", fee: 100 },
    setTierId: vi.fn(),
    totalFeeStroops: vi.fn(() => 100),
  })),
}));

// Mock builders and components that might cause issues in a shallow-ish test
vi.mock("@/lib/simulation-waterfall", () => ({
  buildSimulationWaterfall: vi.fn(() => ({
    hops: [],
    totalRecipientAmount: 99.6,
    protocolFee: 0.3,
    networkFee: 0.1,
  })),
}));

vi.mock("@/components/dashboard/simulation-waterfall", () => ({
  SimulationWaterfall: () => <div data-testid="simulation-waterfall" />,
}));

vi.mock("@/components/transaction-priority-selector", () => ({
  TransactionPrioritySelector: () => <div data-testid="priority-selector" />,
}));

describe("Step3 Fee Breakdown", () => {
  const mockForm = {
    asset: "USDC",
    recipientAddress: "GABC...5678",
    recipientLabel: "Test Recipient",
    recipientTaxId: "",
    splitEnabled: false,
    splitAddress: "",
    splitPercent: 0,
    splitRecipients: [],
    privacyShieldEnabled: false,
    totalAmount: "100",
    rateType: "per-hour" as const,
    durationPreset: "1 Month",
    customEndDate: null,
    ratePerSecond: 0,
    endDate: null,
  };

  it("calculates protocol fee correctly based on feeBps from protocol status", () => {
    // Set fee to 50 bps (0.5%)
    (useProtocolStatus as any).mockReturnValue({ feeBps: 50 });

    render(
      <Step3
        form={mockForm}
        onSign={() => {}}
        signing={false}
        priorityTier="medium"
        onPriorityChange={() => {}}
        recipientValidation={{}}
        balanceValidation="ok"
        validationLoading={false}
        validationError={null}
        quickSignStatus="verified"
        quickSignError={null}
        hasQuickSignCredential={true}
        onSetupQuickSign={() => {}}
        onVerifyQuickSign={() => {}}
      />
    );

    // Expand the accordion
    const toggle = screen.getByText(/Fee Breakdown/i);
    fireEvent.click(toggle);

    // Check Gross Amount
    expect(screen.getAllByText("100.00 USDC").length).toBeGreaterThan(0);

    // Check Protocol Fee (0.5% of 100 = 0.5)
    expect(screen.getByText("-0.50 USDC")).toBeDefined();
    expect(screen.getByText(/Rate: 0.50% \(50 bps\)/i)).toBeDefined();

    // Check Net Recipient Total
    expect(screen.getByText("99.49 USDC")).toBeDefined();
  });

  it("updates fee breakdown when feeBps changes", () => {
    // Set fee to 100 bps (1.0%)
    (useProtocolStatus as any).mockReturnValue({ feeBps: 100 });

    render(
      <Step3
        form={mockForm}
        onSign={() => {}}
        signing={false}
        priorityTier="medium"
        onPriorityChange={() => {}}
        recipientValidation={{}}
        balanceValidation="ok"
        validationLoading={false}
        validationError={null}
        quickSignStatus="verified"
        quickSignError={null}
        hasQuickSignCredential={true}
        onSetupQuickSign={() => {}}
        onVerifyQuickSign={() => {}}
      />
    );

    // Check Protocol Fee (1.0% of 100 = 1.0)
    expect(screen.getByText("-1.00 USDC")).toBeDefined();
    expect(screen.getByText(/Rate: 1.00% \(100 bps\)/i)).toBeDefined();
  });

});
