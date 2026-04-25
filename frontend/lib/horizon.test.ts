// Feature: horizon-balance-fetcher
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseBalances,
  fetchAccountBalances,
  HORIZON_TESTNET_URL,
  type StellarBalance,
} from "./horizon";

// ---------------------------------------------------------------------------
// parseBalances — pure unit tests (no network)
// ---------------------------------------------------------------------------

describe("parseBalances", () => {
  it("extracts native XLM balance", () => {
    const balances: StellarBalance[] = [
      { asset_type: "native", balance: "123.4567890" },
    ];
    const result = parseBalances(balances);
    expect(result.xlm).toBe("123.4567890");
    expect(Object.keys(result.tokens)).toHaveLength(0);
  });

  it("extracts custom token balances keyed by CODE:ISSUER", () => {
    const issuer = "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEBD9AFZQ7TM4JRS9";
    const balances: StellarBalance[] = [
      { asset_type: "native", balance: "50.0000000" },
      {
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: issuer,
        balance: "250.0000000",
      },
    ];
    const result = parseBalances(balances);
    expect(result.xlm).toBe("50.0000000");
    expect(result.tokens[`USDC:${issuer}`]).toBe("250.0000000");
  });

  it("handles multiple tokens", () => {
    const issuer1 = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
    const issuer2 = "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEBD9AFZQ7TM4JRS9";
    const balances: StellarBalance[] = [
      { asset_type: "native", balance: "10.0000000" },
      {
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        asset_issuer: issuer1,
        balance: "100.0000000",
      },
      {
        asset_type: "credit_alphanum12",
        asset_code: "AQUA",
        asset_issuer: issuer2,
        balance: "5000.0000000",
      },
    ];
    const result = parseBalances(balances);
    expect(result.xlm).toBe("10.0000000");
    expect(Object.keys(result.tokens)).toHaveLength(2);
    expect(result.tokens[`USDC:${issuer1}`]).toBe("100.0000000");
    expect(result.tokens[`AQUA:${issuer2}`]).toBe("5000.0000000");
  });

  it("returns xlm '0' when no native balance is present", () => {
    const result = parseBalances([]);
    expect(result.xlm).toBe("0");
    expect(result.tokens).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// fetchAccountBalances — network tests (fetch mocked)
// ---------------------------------------------------------------------------

describe("fetchAccountBalances", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed balances for a valid account", async () => {
    const mockResponse = {
      balances: [
        { asset_type: "native", balance: "99.0000000" },
        {
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEBD9AFZQ7TM4JRS9",
          balance: "42.0000000",
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await fetchAccountBalances("GABC123");
    expect(result.xlm).toBe("99.0000000");
    expect(
      result.tokens[
        "USDC:GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEBD9AFZQ7TM4JRS9"
      ],
    ).toBe("42.0000000");

    expect(fetch).toHaveBeenCalledWith(
      `${HORIZON_TESTNET_URL}/accounts/GABC123`,
    );
  });

  it("throws when the account is not found (404)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: "Not Found" }),
    );

    await expect(fetchAccountBalances("GNOTFOUND")).rejects.toThrow(
      "Account not found: GNOTFOUND",
    );
  });

  it("throws on non-404 Horizon errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Internal Server Error" }),
    );

    await expect(fetchAccountBalances("GFAIL")).rejects.toThrow(
      "Horizon request failed: 500 Internal Server Error",
    );
  });
});
