import { describe, expect, it } from "vitest";
import {
  base64UrlToBytes,
  bytesToBase64Url,
  getQuickSignStorageKey,
  loadQuickSignCredential,
} from "./webauthn-quick-sign";

describe("webauthn quick sign helpers", () => {
  it("round-trips credential IDs with base64url encoding", () => {
    const credentialId = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    const encoded = bytesToBase64Url(credentialId);

    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
    expect(Array.from(base64UrlToBytes(encoded))).toEqual(Array.from(credentialId));
  });

  it("scopes stored credentials by wallet address", () => {
    expect(getQuickSignStorageKey("GABC123")).toBe("stellarstream.quickSignCredential.gabc123");
  });

  it("does not read browser storage during server-side rendering", () => {
    expect(loadQuickSignCredential("GABC123")).toBeNull();
  });
});
