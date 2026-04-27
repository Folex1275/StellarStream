import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import TransactionHistory from "@/components/dashboard/TransactionHistory";

// Mock Next.js navigation hooks
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/dashboard/transactions",
}));

describe("TransactionHistory Advanced Filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the filter sidebar toggle button", () => {
    render(<TransactionHistory />);
    
    const filterButton = screen.getByText(/filters/i);
    expect(filterButton).toBeInTheDocument();
  });

  it("opens the advanced filter sidebar when toggle is clicked", () => {
    render(<TransactionHistory />);
    
    const filterButton = screen.getByText(/filters/i);
    fireEvent.click(filterButton);
    
    expect(screen.getByText(/advanced filters/i)).toBeInTheDocument();
  });

  it("displays multi-select options for Status, Asset Type, and Sender Role", () => {
    render(<TransactionHistory />);
    
    const filterButton = screen.getByText(/filters/i);
    fireEvent.click(filterButton);
    
    expect(screen.getByText(/status/i)).toBeInTheDocument();
    expect(screen.getByText(/asset type/i)).toBeInTheDocument();
    expect(screen.getByText(/sender role/i)).toBeInTheDocument();
    expect(screen.getByText(/amount range/i)).toBeInTheDocument();
  });

  it("shows active filter count badge when filters are applied", () => {
    render(<TransactionHistory />);
    
    const filterButton = screen.getByText(/filters/i);
    fireEvent.click(filterButton);
    
    // Find and click a status checkbox
    const successCheckbox = screen.getByLabelText(/success/i);
    fireEvent.click(successCheckbox);
    
    // Badge should show "1" for one active filter
    const badge = screen.getByText("1");
    expect(badge).toBeInTheDocument();
  });

  it("has a Clear All button in the sidebar", () => {
    render(<TransactionHistory />);
    
    const filterButton = screen.getByText(/filters/i);
    fireEvent.click(filterButton);
    
    const clearAllButton = screen.getByText(/clear all filters/i);
    expect(clearAllButton).toBeInTheDocument();
  });

  it("filters transactions by status", () => {
    render(<TransactionHistory />);
    
    // Initially should show all 12 transactions (first page shows 8)
    expect(screen.getByText(/1–8 of 12/i)).toBeInTheDocument();
    
    const filterButton = screen.getByText(/filters/i);
    fireEvent.click(filterButton);
    
    // Filter by Success status
    const successCheckbox = screen.getByLabelText(/success/i);
    fireEvent.click(successCheckbox);
    
    // Close sidebar by clicking overlay
    const overlay = screen.getByRole("dialog").parentElement;
    if (overlay) {
      fireEvent.click(overlay);
    }
    
    // Should now show fewer results (only Success transactions)
    const successCount = 7; // From mock data
    expect(screen.getByText(new RegExp(`1–8 of ${successCount}`, "i"))).toBeInTheDocument();
  });

  it("filters transactions by amount range", () => {
    render(<TransactionHistory />);
    
    const filterButton = screen.getByText(/filters/i);
    fireEvent.click(filterButton);
    
    // Set amount range
    const minInput = screen.getByPlaceholderText("0");
    const maxInput = screen.getByPlaceholderText("∞");
    
    fireEvent.change(minInput, { target: { value: "10000" } });
    fireEvent.change(maxInput, { target: { value: "50000" } });
    
    // Close sidebar
    const overlay = screen.getByRole("dialog").parentElement;
    if (overlay) {
      fireEvent.click(overlay);
    }
    
    // Should filter to transactions within range
    expect(screen.getByText(/results/i)).toBeInTheDocument();
  });

  it("clears all filters when Clear All button is clicked", () => {
    render(<TransactionHistory />);
    
    const filterButton = screen.getByText(/filters/i);
    fireEvent.click(filterButton);
    
    // Apply some filters
    const successCheckbox = screen.getByLabelText(/success/i);
    fireEvent.click(successCheckbox);
    
    // Click Clear All
    const clearAllButton = screen.getByText(/clear all filters/i);
    fireEvent.click(clearAllButton);
    
    // Should return to showing all transactions
    expect(screen.getByText(/1–8 of 12/i)).toBeInTheDocument();
  });

  it("syncs filters to URL query parameters", () => {
    render(<TransactionHistory />);
    
    const filterButton = screen.getByText(/filters/i);
    fireEvent.click(filterButton);
    
    // Apply a filter
    const successCheckbox = screen.getByLabelText(/success/i);
    fireEvent.click(successCheckbox);
    
    // Should update URL with query params
    expect(mockPush).toHaveBeenCalled();
    const calledURL = mockPush.mock.calls[0][0];
    expect(calledURL).toContain("status=");
    expect(calledURL).toContain("Success");
  });
});
