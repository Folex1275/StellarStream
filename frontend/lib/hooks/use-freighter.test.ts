// Feature: freighter-wallet-hook
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock @stellar/freighter-api before importing the hook
// ---------------------------------------------------------------------------

const mockIsConnected = vi.fn();
const mockGetAddress = vi.fn();
const mockGetNetwork = vi.fn();
const mockRequestAccess = vi.fn();

vi.mock("@stellar/freighter-api", () => ({
  isConnected: (...args: unknown[]) => mockIsConnected(...args),
  getAddress: (...args: unknown[]) => mockGetAddress(...args),
  getNetwork: (...args: unknown[]) => mockGetNetwork(...args),
  requestAccess: (...args: unknown[]) => mockRequestAccess(...args),
}));

// Minimal React hooks stub — the hook uses useState, useCallback, useEffect.
// We replicate just enough to exercise the logic synchronously.

let stateSlots: unknown[] = [];
let stateIndex = 0;
let effects: Array<() => void | (() => void)> = [];

function resetReactMock() {
  stateSlots = [];
  stateIndex = 0;
  effects = [];
}

vi.mock("react", () => ({
  useState: (init: unknown) => {
    const idx = stateIndex++;
    if (stateSlots[idx] === undefined) {
      stateSlots[idx] = typeof init === "function" ? (init as () => unknown)() : init;
    }
    const setState = (val: unknown) => {
      stateSlots[idx] =
        typeof val === "function" ? (val as (prev: unknown) => unknown)(stateSlots[idx]) : val;
    };
    return [stateSlots[idx], setState];
  },
  useCallback: (fn: unknown) => fn,
  useEffect: (fn: () => void | (() => void)) => {
    effects.push(fn);
  },
}));

import { useFreighter } from "./use-freighter";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// Stub `window` so the SSR guard (`typeof window === "undefined"`) passes
// in the Node test environment.
beforeEach(() => {
  if (typeof globalThis.window === "undefined") {
    (globalThis as Record<string, unknown>).window = {};
  }
});

describe("useFreighter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetReactMock();
  });

  it("returns initial disconnected state", () => {
    const result = useFreighter();
    expect(result.isConnected).toBe(false);
    expect(result.address).toBeNull();
    expect(result.network).toBeNull();
    expect(result.isLoading).toBe(false);
    expect(result.error).toBeNull();
  });

  it("connect sets address and network on success", async () => {
    mockRequestAccess.mockResolvedValue({ address: "GTEST123", error: undefined });
    mockGetNetwork.mockResolvedValue({ network: "TESTNET" });

    const hook = useFreighter();
    await hook.connect();

    // Re-read state after the async connect mutated it
    stateIndex = 0;
    const updated = useFreighter();
    expect(updated.isConnected).toBe(true);
    expect(updated.address).toBe("GTEST123");
    expect(updated.network).toBe("TESTNET");
    expect(updated.error).toBeNull();
  });

  it("connect sets error when Freighter returns an error", async () => {
    mockRequestAccess.mockResolvedValue({ error: "User rejected" });

    const hook = useFreighter();
    await hook.connect();

    stateIndex = 0;
    const updated = useFreighter();
    expect(updated.isConnected).toBe(false);
    expect(updated.error).toBe("User rejected");
  });

  it("disconnect clears address and network", async () => {
    mockRequestAccess.mockResolvedValue({ address: "GTEST123", error: undefined });
    mockGetNetwork.mockResolvedValue({ network: "TESTNET" });

    const hook = useFreighter();
    await hook.connect();

    stateIndex = 0;
    const connected = useFreighter();
    connected.disconnect();

    stateIndex = 0;
    const disconnected = useFreighter();
    expect(disconnected.isConnected).toBe(false);
    expect(disconnected.address).toBeNull();
  });

  it("registers a useEffect for detecting Freighter on mount", () => {
    useFreighter();
    expect(effects.length).toBeGreaterThan(0);
  });

  it("useEffect detects an already-connected Freighter session", async () => {
    mockIsConnected.mockResolvedValue(true);
    mockGetAddress.mockResolvedValue({ address: "GEXISTING", error: undefined });
    mockGetNetwork.mockResolvedValue({ network: "PUBLIC" });

    useFreighter();

    // Run the effect registered by useEffect — the inner detect() is async,
    // so we call the effect and then flush all microtasks.
    effects[0]();
    await new Promise((r) => setTimeout(r, 0));

    stateIndex = 0;
    const updated = useFreighter();
    expect(updated.isConnected).toBe(true);
    expect(updated.address).toBe("GEXISTING");
    expect(updated.network).toBe("PUBLIC");
  });
});
