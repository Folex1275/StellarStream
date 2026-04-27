/**
 * stellar-toml-validator.test.ts
 * 
 * Unit tests for stellar.toml parsing and validation utility.
 */

import { describe, it, expect, vi } from "vitest";
import { parseStellarToml, validateVerificationRequest } from "@/lib/stellar-toml-validator";

// Declare global for TypeScript
declare const global: typeof globalThis;

describe("parseStellarToml", () => {
  it("should parse valid TOML with CURRENCIES and AUTH_ENDPOINT", () => {
    const tomlContent = `
VERSION = 1

[DOCUMENTATION]
ORG_NAME = "Test Organization"
DOCUMENTATION = "https://example.com/docs"

[[CURRENCIES]]
code = "USD"
issuer = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7"
status = "live"
display_decimals = 2

[[CURRENCIES]]
code = "EUR"
issuer = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7"
status = "live"

[CLIENT_ATTRIBUTION]
AUTH_ENDPOINT = "https://example.com/auth"
`;

    const result = parseStellarToml(tomlContent);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.currencies).toHaveLength(2);
    expect(result.currencies[0].code).toBe("USD");
    expect(result.currencies[1].code).toBe("EUR");
    expect(result.authEndpoint).toBe("https://example.com/auth");
    expect(result.orgName).toBe("Test Organization");
    expect(result.documentationUrl).toBe("https://example.com/docs");
  });

  it("should detect missing AUTH_ENDPOINT and add warning", () => {
    const tomlContent = `
VERSION = 1

[[CURRENCIES]]
code = "USD"
issuer = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7"
`;

    const result = parseStellarToml(tomlContent);

    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain(
      "No AUTH_ENDPOINT found. This is recommended for SEP-10 authentication."
    );
    expect(result.authEndpoint).toBeNull();
  });

  it("should detect invalid AUTH_ENDPOINT URL", () => {
    const tomlContent = `
VERSION = 1

[[CURRENCIES]]
code = "USD"

[CLIENT_ATTRIBUTION]
AUTH_ENDPOINT = "not-a-valid-url"
`;

    const result = parseStellarToml(tomlContent);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid AUTH_ENDPOINT URL: not-a-valid-url");
  });

  it("should detect currency missing code field", () => {
    const tomlContent = `
VERSION = 1

[[CURRENCIES]]
issuer = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7"
`;

    const result = parseStellarToml(tomlContent);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Currency at index 0 is missing required 'code' field");
  });

  it("should detect anchored asset missing issuer", () => {
    const tomlContent = `
VERSION = 1

[[CURRENCIES]]
code = "USD"
is_asset_anchored = true
`;

    const result = parseStellarToml(tomlContent);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Currency USD is anchored but missing 'issuer'");
  });

  it("should detect invalid Stellar address format", () => {
    const tomlContent = `
VERSION = 1

[[CURRENCIES]]
code = "USD"
issuer = "INVALID_ADDRESS"
`;

    const result = parseStellarToml(tomlContent);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Currency USD has invalid issuer address: INVALID_ADDRESS");
  });

  it("should handle TOML without CURRENCIES section", () => {
    const tomlContent = `
VERSION = 1

[DOCUMENTATION]
ORG_NAME = "Test Org"
`;

    const result = parseStellarToml(tomlContent);

    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain("No CURRENCIES section found in stellar.toml");
    expect(result.currencies).toHaveLength(0);
  });

  it("should handle invalid TOML syntax", () => {
    const tomlContent = `
INVALID TOML CONTENT [[[
`;

    const result = parseStellarToml(tomlContent);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Failed to parse TOML");
  });

  it("should extract multiple currencies with all fields", () => {
    const tomlContent = `
VERSION = 1

[[CURRENCIES]]
code = "USDC"
issuer = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
status = "live"
display_decimals = 7
name = "USD Coin"
desc = "Fully reserved stablecoin"
is_asset_anchored = true
fixed_number = 1000000000

[[CURRENCIES]]
code = "XLM"
status = "live"
display_decimals = 7
`;

    const result = parseStellarToml(tomlContent);

    expect(result.isValid).toBe(true);
    expect(result.currencies).toHaveLength(2);
    expect(result.currencies[0]).toEqual({
      code: "USDC",
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      status: "live",
      display_decimals: 7,
      name: "USD Coin",
      desc: "Fully reserved stablecoin",
      conditions: undefined,
      is_asset_anchored: true,
      fixed_number: 1000000000,
      max_number: undefined,
    });
    expect(result.currencies[1].code).toBe("XLM");
  });
});

describe("validateVerificationRequest", () => {
  it("should validate complete request with valid TOML", async () => {
    // Mock fetch for TOML
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(`
VERSION = 1

[[CURRENCIES]]
code = "USD"
issuer = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7"

[CLIENT_ATTRIBUTION]
AUTH_ENDPOINT = "https://example.com/auth"
`),
    });

    const result = await validateVerificationRequest({
      officialWebsite: "https://example.com",
      stellarTomlLink: "https://example.com/.well-known/stellar.toml",
      businessRegistration: null,
    });

    expect(result.isValid).toBe(true);
    expect(result.currencies).toHaveLength(1);
    expect(result.authEndpoint).toBe("https://example.com/auth");

    vi.restoreAllMocks();
  });

  it("should reject invalid website URL", async () => {
    const result = await validateVerificationRequest({
      officialWebsite: "not-a-url",
      stellarTomlLink: "https://example.com/.well-known/stellar.toml",
      businessRegistration: null,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid official website URL");
  });

  it("should reject invalid TOML URL", async () => {
    const result = await validateVerificationRequest({
      officialWebsite: "https://example.com",
      stellarTomlLink: "not-a-url",
      businessRegistration: null,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid stellar.toml link URL");
  });

  it("should handle failed TOML fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await validateVerificationRequest({
      officialWebsite: "https://example.com",
      stellarTomlLink: "https://example.com/.well-known/stellar.toml",
      businessRegistration: null,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Failed to fetch stellar.toml");

    vi.restoreAllMocks();
  });
});
