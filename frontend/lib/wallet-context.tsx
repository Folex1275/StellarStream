"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { isConnected, getAddress, getNetwork, requestAccess, setAllowed } from "@stellar/freighter-api";
import { rpc as SorobanRpc } from "@stellar/stellar-sdk";
import { CONTRACT_ID, NEBULA_CONTRACT_ID } from "@/lib/providers";

// Wallet types
export type WalletType = "freighter" | "xbull" | "albedo" | null;

export interface BalanceInfo {
  v1: bigint | null;
  v2: bigint | null;
  combined: bigint;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  walletType: WalletType;
  network: string | null;
  isConnecting: boolean;
  error: string | null;
  balances: BalanceInfo;
  isLoadingBalances: boolean;
}

interface WalletContextType extends WalletState {
  connectFreighter: () => Promise<void>;
  connectXBull: () => Promise<void>;
  connectAlbedo: () => Promise<void>;
  disconnect: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  isModalOpen: boolean;
  refreshBalances: () => Promise<void>;
}

// RPC URL for balance queries
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-rpc.stellar.org";

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// xBull wallet interface
interface XBullWallet {
  connect: () => Promise<{ publicKey: string }>;
  disconnect: () => Promise<void>;
  getNetwork: () => Promise<string>;
}

interface AlbedoPublicKeyResponse {
  pubkey?: string;
  public_key?: string;
}

declare global {
  interface Window {
    xBull?: XBullWallet;
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    walletType: null,
    network: null,
    isConnecting: false,
    error: null,
    balances: {
      v1: null,
      v2: null,
      combined: BigInt(0),
    },
    isLoadingBalances: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  /**
   * Fetch balance for both V1 and V2 contracts
   */
  const refreshBalances = useCallback(async () => {
    if (!state.address) {
      setState((prev) => ({
        ...prev,
        balances: { v1: null, v2: null, combined: BigInt(0) },
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoadingBalances: true }));

    try {
      const rpcServer = new SorobanRpc.Server(RPC_URL);
      
      // Fetch balances for both contracts in parallel
      // Balance fetching requires contract-specific ABI calls; return 0 as placeholder
      const [v1Balance, v2Balance] = ["0", "0"];

      const v1 = BigInt(v1Balance);
      const v2 = BigInt(v2Balance);

      setState((prev) => ({
        ...prev,
        balances: {
          v1: v1,
          v2: v2,
          combined: v1 + v2,
        },
        isLoadingBalances: false,
      }));
    } catch (error) {
      console.error("Error fetching balances:", error);
      setState((prev) => ({ ...prev, isLoadingBalances: false }));
    }
  }, [state.address]);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        // Check Freighter
        const connected = await isConnected();
        if (connected) {
          const addressResult = await getAddress();
          const networkResult = await getNetwork();
          
          if (addressResult && !addressResult.error) {
            setState({
              isConnected: true,
              address: addressResult.address,
              walletType: "freighter",
              network: networkResult.network,
              isConnecting: false,
              error: null,
              balances: { v1: null, v2: null, combined: BigInt(0) },
              isLoadingBalances: false,
            });
            // Refresh balances for both protocols after connection
            setTimeout(() => refreshBalances(), 100);
          }
        }
      } catch {
        // No existing connection
      }
    };
    checkExistingConnection();
  }, [refreshBalances]);

  const connectFreighter = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check if Freighter is installed
      const connected = await isConnected();
      
      if (!connected) {
        // Request access - this will prompt user to connect
        const accessResult = await requestAccess();
        
        if (accessResult.error) {
          throw new Error(accessResult.error);
        }
        
        const networkResult = await getNetwork();
        
          setState({
            isConnected: true,
            address: accessResult.address,
            walletType: "freighter",
            network: networkResult.network,
            isConnecting: false,
            error: null,
            balances: { v1: null, v2: null, combined: BigInt(0) },
            isLoadingBalances: false,
          });
          closeModal();
          // Refresh balances for both protocols after connection
          setTimeout(() => refreshBalances(), 100);
        } else {
        // Already connected, get address
        const addressResult = await getAddress();
        const networkResult = await getNetwork();
        
        if (addressResult.error) {
          // Need to request access
          const accessResult = await requestAccess();
          
          if (accessResult.error) {
            throw new Error(accessResult.error);
          }
          
          setState({
            isConnected: true,
            address: accessResult.address,
            walletType: "freighter",
            network: networkResult.network,
            isConnecting: false,
            error: null,
            balances: { v1: null, v2: null, combined: BigInt(0) },
            isLoadingBalances: false,
          });
          closeModal();
          // Refresh balances for both protocols after connection
          setTimeout(() => refreshBalances(), 100);
        } else {
          setState({
            isConnected: true,
            address: addressResult.address,
            walletType: "freighter",
            network: networkResult.network,
            isConnecting: false,
            error: null,
            balances: { v1: null, v2: null, combined: BigInt(0) },
            isLoadingBalances: false,
          });
          closeModal();
          // Refresh balances for both protocols after connection
          setTimeout(() => refreshBalances(), 100);
        }
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Failed to connect Freighter wallet",
      }));
    }
  }, [closeModal, refreshBalances]);

  const connectXBull = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check if xBull is installed
      if (typeof window.xBull === "undefined") {
        throw new Error("xBull wallet is not installed. Please install xBull extension.");
      }

      const result = await window.xBull!.connect();
      const network = await window.xBull!.getNetwork();

      setState({
        isConnected: true,
        address: result.publicKey,
        walletType: "xbull",
        network: network,
        isConnecting: false,
        error: null,
        balances: { v1: null, v2: null, combined: BigInt(0) },
        isLoadingBalances: false,
      });
      closeModal();
      // Refresh balances for both protocols after connection
      setTimeout(() => refreshBalances(), 100);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Failed to connect xBull wallet",
      }));
    }
  }, [closeModal, refreshBalances]);

  const connectAlbedo = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const albedoModule = await import("@albedo-link/intent");
      const albedo = albedoModule.default;
      const result = (await albedo.publicKey({
        token: "StellarStream",
      })) as AlbedoPublicKeyResponse;

      const address = result.pubkey ?? result.public_key;
      if (!address) {
        throw new Error("Albedo did not return a public key");
      }

      const configuredPassphrase = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "";
      const network = configuredPassphrase.includes("Public") ? "PUBLIC" : "TESTNET";

      setState({
        isConnected: true,
        address,
        walletType: "albedo",
        network,
        isConnecting: false,
        error: null,
        balances: { v1: null, v2: null, combined: BigInt(0) },
        isLoadingBalances: false,
      });
      closeModal();
      setTimeout(() => refreshBalances(), 100);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Failed to connect Albedo wallet",
      }));
    }
  }, [closeModal, refreshBalances]);

  const disconnect = useCallback(async () => {
    // Note: Freighter doesn't have a disconnect method
    // We just clear the local state
    setState({
      isConnected: false,
      address: null,
      walletType: null,
      network: null,
      isConnecting: false,
      error: null,
      balances: { v1: null, v2: null, combined: BigInt(0) },
      isLoadingBalances: false,
    });
  }, []);

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connectFreighter,
        connectXBull,
        connectAlbedo,
        disconnect,
        openModal,
        closeModal,
        isModalOpen,
        refreshBalances,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
