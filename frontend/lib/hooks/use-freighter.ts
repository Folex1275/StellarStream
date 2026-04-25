// lib/hooks/use-freighter.ts
// Issue #42 — Wallet: Freighter Connection Hook
//
// SSR-safe React hook for connecting / disconnecting the Freighter
// browser extension.  All Freighter API calls are guarded behind a
// `typeof window !== "undefined"` check so the hook can be imported
// in server-rendered pages without crashing.

import { useState, useCallback, useEffect } from "react";

// ---------------------------------------------------------------------------
// Freighter API helpers — lazy-imported only on the client
// ---------------------------------------------------------------------------

async function getFreighterApi() {
  if (typeof window === "undefined") return null;
  try {
    const api = await import("@stellar/freighter-api");
    return api;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface FreighterState {
  /** Whether the Freighter extension is installed in the browser */
  isAvailable: boolean;
  /** Whether we have an active connection */
  isConnected: boolean;
  /** The connected Stellar public key (G…) or null */
  address: string | null;
  /** The network reported by Freighter (e.g. "TESTNET") */
  network: string | null;
  /** True while a connect / disconnect operation is in flight */
  isLoading: boolean;
  /** Last error message, cleared on next successful operation */
  error: string | null;
}

export interface UseFreighterReturn extends FreighterState {
  /** Request access to the user's Freighter wallet */
  connect: () => Promise<void>;
  /** Clear local connection state (Freighter has no server-side disconnect) */
  disconnect: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFreighter(): UseFreighterReturn {
  const [state, setState] = useState<FreighterState>({
    isAvailable: false,
    isConnected: false,
    address: null,
    network: null,
    isLoading: false,
    error: null,
  });

  // Detect Freighter on mount (client-only)
  useEffect(() => {
    let cancelled = false;

    async function detect() {
      const api = await getFreighterApi();
      if (!api || cancelled) return;

      try {
        const connected = await api.isConnected();
        if (cancelled) return;

        if (connected) {
          const addrResult = await api.getAddress();
          const netResult = await api.getNetwork();

          if (!cancelled && addrResult && !addrResult.error) {
            setState({
              isAvailable: true,
              isConnected: true,
              address: addrResult.address,
              network: netResult.network,
              isLoading: false,
              error: null,
            });
            return;
          }
        }

        setState((prev) => ({ ...prev, isAvailable: true }));
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, isAvailable: false }));
        }
      }
    }

    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const api = await getFreighterApi();
    if (!api) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Freighter extension not available",
      }));
      return;
    }

    try {
      const accessResult = await api.requestAccess();

      if (accessResult.error) {
        throw new Error(accessResult.error);
      }

      const netResult = await api.getNetwork();

      setState({
        isAvailable: true,
        isConnected: true,
        address: accessResult.address,
        network: netResult.network,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to connect Freighter",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      isAvailable: state.isAvailable,
      isConnected: false,
      address: null,
      network: null,
      isLoading: false,
      error: null,
    });
  }, [state.isAvailable]);

  return { ...state, connect, disconnect };
}
