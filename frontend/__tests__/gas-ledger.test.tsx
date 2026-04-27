import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import GasLedger from "@/components/gasledger";
import * as api from "@/lib/api";
import type { GasEvent } from "@/lib/api";

const MOCK_EVENTS: GasEvent[] = [
  {
    id: "1",
    type: "Refill",
    amount: 10.5,
    txHash: "abc123def456",
    timestamp: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    type: "Debit",
    amount: 0.001,
    txHash: "xyz789uvw012",
    timestamp: "2024-01-16T14:00:00Z",
  },
];

describe("GasLedger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state while fetching", () => {
    vi.spyOn(api, "fetchGasEvents").mockReturnValue(new Promise(() => {})); // never resolves
    render(<GasLedger walletAddress="G123" />);
    expect(screen.getByTestId("gas-ledger-loading")).toBeInTheDocument();
  });

  it("renders correct rows from mocked API response", async () => {
    vi.spyOn(api, "fetchGasEvents").mockResolvedValue(MOCK_EVENTS);
    render(<GasLedger walletAddress="G123" />);
    await waitFor(() =>
      expect(screen.getByTestId("gas-ledger-rows")).toBeInTheDocument()
    );
    const rows = screen.getAllByTestId("gas-ledger-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Refill");
    expect(rows[1]).toHaveTextContent("Debit");
  });

  it("shows empty state when no events returned", async () => {
    vi.spyOn(api, "fetchGasEvents").mockResolvedValue([]);
    render(<GasLedger walletAddress="G123" />);
    await waitFor(() =>
      expect(screen.getByTestId("gas-ledger-empty")).toBeInTheDocument()
    );
  });

  it("shows error state on fetch failure", async () => {
    vi.spyOn(api, "fetchGasEvents").mockRejectedValue(new Error("Network error"));
    render(<GasLedger walletAddress="G123" />);
    await waitFor(() =>
      expect(screen.getByTestId("gas-ledger-error")).toBeInTheDocument()
    );
    expect(screen.getByTestId("gas-ledger-error")).toHaveTextContent("Network error");
  });
});
