import { computeEntryHash } from "../lib/audit-hash-chain.js";

describe("computeEntryHash", () => {
  const input = {
    eventType: "create",
    streamId: "stream-123",
    txHash: "tx-hash-123",
    eventIndex: 0,
    ledger: 42,
    ledgerClosedAt: "2026-04-24T00:00:00.000Z",
    sender: "GAAAA",
    receiver: "GBBBB",
    amount: "1000",
    metadata: JSON.stringify({ foo: "bar" }),
  };

  it("returns a deterministic SHA-256 hex string for a genesis entry", () => {
    const hash = computeEntryHash(input, null);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe("ddddee51f86067529c3c276584cb635288fcdc12d22d7c7e689a6239af41cb24");
  });

  it("returns a different hash when parentHash is provided", () => {
    const genesisHash = computeEntryHash(input, null);
    const chainedHash = computeEntryHash(input, "parent-hash");

    expect(chainedHash).not.toBe(genesisHash);
  });

  it("returns the same hash for the same input", () => {
    expect(computeEntryHash(input, "parent")).toBe(computeEntryHash(input, "parent"));
  });

  it("returns different hashes for different inputs", () => {
    const baseline = computeEntryHash(input, null);
    const updated = computeEntryHash(
      {
        ...input,
        metadata: JSON.stringify({ foo: "baz" }),
      },
      null,
    );

    expect(updated).not.toBe(baseline);
  });
});
