// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import DeepSpaceAssetBrowser from "../DeepSpaceAssetBrowser";

// DEFAULT_ASSETS used by the component — key ones for assertions
const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3I6J6AYGQL2S2KY7VPNB";

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSelect: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("DeepSpaceAssetBrowser — search", () => {
  it("renders the modal when open", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    expect(screen.getByText("Deep Space Asset Browser")).toBeInTheDocument();
  });

  it("returns null when isOpen is false", () => {
    const { container } = render(
      <DeepSpaceAssetBrowser {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("filters by asset code", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    const input = screen.getByPlaceholderText(
      "Search by code, name, domain, or issuer address..."
    );
    fireEvent.change(input, { target: { value: "XLM" } });
    expect(screen.getByText("Stellar Lumens")).toBeInTheDocument();
    expect(screen.queryByText("USD Coin")).not.toBeInTheDocument();
  });

  it("filters by asset name", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    const input = screen.getByPlaceholderText(
      "Search by code, name, domain, or issuer address..."
    );
    fireEvent.change(input, { target: { value: "lumens" } });
    expect(screen.getByText("Stellar Lumens")).toBeInTheDocument();
    expect(screen.queryByText("USD Coin")).not.toBeInTheDocument();
  });

  it("filters by issuer address substring", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    const input = screen.getByPlaceholderText(
      "Search by code, name, domain, or issuer address..."
    );
    fireEvent.change(input, { target: { value: USDC_ISSUER.slice(0, 8) } });
    expect(screen.getByText("USD Coin")).toBeInTheDocument();
    expect(screen.queryByText("Stellar Lumens")).not.toBeInTheDocument();
  });

  it("shows 'No assets found' when search matches nothing", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    const input = screen.getByPlaceholderText(
      "Search by code, name, domain, or issuer address..."
    );
    fireEvent.change(input, { target: { value: "ZZZNOMATCH" } });
    expect(screen.getByText("No assets found")).toBeInTheDocument();
  });
});

describe("DeepSpaceAssetBrowser — category filters", () => {
  it("shows the Top Rated filter chip", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    expect(screen.getByRole("button", { name: /top rated/i })).toBeInTheDocument();
  });

  it("Top Rated filter shows only assets with rating >= 7", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /top rated/i }));
    // XLM (10), USDC (9), EURT (7), ETH (8), BTC (8) qualify; ARST (6), BRLT (5), MXNT (5) do not
    expect(screen.getByText("Stellar Lumens")).toBeInTheDocument();
    expect(screen.getByText("USD Coin")).toBeInTheDocument();
    expect(screen.queryByText("Argentine Peso")).not.toBeInTheDocument();
    expect(screen.queryByText("Brazilian Real")).not.toBeInTheDocument();
  });

  it("Verified filter hides unverified assets", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Verified" }));
    // All DEFAULT_ASSETS are currently verified — just checking the filter is applied
    expect(screen.getByText("Stellar Lumens")).toBeInTheDocument();
  });

  it("Stellar filter hides cross-chain assets", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Stellar" }));
    expect(screen.queryByText("Ethereum")).not.toBeInTheDocument();
    expect(screen.queryByText("Bitcoin")).not.toBeInTheDocument();
    expect(screen.getByText("Stellar Lumens")).toBeInTheDocument();
  });

  it("Cross-Chain filter shows only non-Stellar assets", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Cross-Chain" }));
    // "Ethereum" appears in both the chain badge and the asset name
    expect(screen.getAllByText("Ethereum").length).toBeGreaterThan(0);
    expect(screen.queryByText("Stellar Lumens")).not.toBeInTheDocument();
  });
});

describe("DeepSpaceAssetBrowser — issuer display", () => {
  it("shows truncated issuer address for assets with an issuer", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    const expectedText = `${USDC_ISSUER.slice(0, 6)}…${USDC_ISSUER.slice(-6)}`;
    const issuerEl = screen.getByTitle(USDC_ISSUER);
    expect(issuerEl).toHaveTextContent(expectedText);
  });

  it("does not render issuer element for native assets without issuer", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    // XLM has no issuer — searching for a title that contains "undefined" should find nothing
    expect(screen.queryByTitle("undefined")).not.toBeInTheDocument();
  });
});

describe("DeepSpaceAssetBrowser — rating display", () => {
  it("shows the rating badge for assets that have stellarExpertRating", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    // XLM has rating 10; "Stellar Expert Rating: 10/10" should appear in a title attr
    const ratingEl = screen.getByTitle("Stellar Expert Rating: 10/10");
    expect(ratingEl).toHaveTextContent("10");
  });

  it("sorts higher-rated verified assets above lower-rated ones", () => {
    render(<DeepSpaceAssetBrowser {...defaultProps} />);
    // After sort: verified first, then by rating desc. XLM (10) > USDC (9) > EURT (7)
    const items = screen.getAllByRole("button", { name: /lumens|coin|token|peso|real|ethereum|bitcoin/i });
    const texts = items.map((el) => el.textContent);
    const xlmIdx = texts.findIndex((t) => t?.includes("Stellar Lumens"));
    const usdcIdx = texts.findIndex((t) => t?.includes("USD Coin"));
    expect(xlmIdx).toBeLessThan(usdcIdx);
  });
});

describe("DeepSpaceAssetBrowser — selection and close", () => {
  it("calls onSelect and onClose when an asset row is clicked", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <DeepSpaceAssetBrowser isOpen={true} onSelect={onSelect} onClose={onClose} />
    );
    // Click the XLM row button (matches "Stellar Lumens" text inside)
    const xlmButton = screen.getByRole("button", { name: /stellar lumens/i });
    fireEvent.click(xlmButton);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ code: "XLM" })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <DeepSpaceAssetBrowser isOpen={true} onSelect={vi.fn()} onClose={onClose} />
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
