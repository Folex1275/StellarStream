import { describe, expect, it } from "vitest";
import { Networks } from "@stellar/stellar-sdk";
import { __internal } from "@/lib/wallet-signers/albedo-v3-signer";

describe("albedo v3 signer helpers", () => {
  it("maps network passphrase to albedo network", () => {
    expect(__internal.resolveAlbedoNetwork(Networks.PUBLIC)).toBe("public");
    expect(__internal.resolveAlbedoNetwork(Networks.TESTNET)).toBe("testnet");
  });

  it("accepts payload with signed xdr and tx hash", () => {
    const result = __internal.normalizeAlbedoTxPayload({
      signed_envelope_xdr: "AAAA",
      tx_hash: "abc123",
      submitted: true,
    });

    expect(result.signedTxXdr).toBe("AAAA");
    expect(result.txHash).toBe("abc123");
    expect(result.submitted).toBe(true);
  });

  it("throws if callback does not confirm submission", () => {
    expect(() =>
      __internal.normalizeAlbedoTxPayload({
        signed_envelope_xdr: "AAAA",
      }),
    ).toThrow("did not confirm network submission");
  });

  it("throws if payload has an explicit wallet error", () => {
    expect(() =>
      __internal.normalizeAlbedoTxPayload({
        error: "User rejected request",
      }),
    ).toThrow("User rejected request");
  });
});
