"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { Contract, rpc as SorobanRpc } from "@stellar/stellar-sdk";
import { useWallet } from "@/lib/wallet-context";
import { useTransactionToast, TxOperation, TxResult } from "@/lib/hooks/useTransactionToast";

// ============================================================================
// Contract ID Constants
// ============================================================================

/**
 * V1 (Legacy) Contract ID
 * The original StellarStream contract deployed on Stellar
 * 
 * Set via NEXT_PUBLIC_CONTRACT_ID environment variable
 */
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || "";

/**
 * V2 (Nebula) Contract ID
 * The new Nebula V2 contract with enhanced features
 * 
 * Set via NEXT_PUBLIC_NEBULA_CONTRACT_ID environment variable
 */
export const NEBULA_CONTRACT_ID = process.env.NEXT_PUBLIC_NEBULA_CONTRACT_ID || "";

/**
 * Supported contract versions
 */
export type ContractVersion = "v1" | "v2";

/**
 * Contract configuration for each version
 */
export interface ContractConfig {
  id: string;
  version: ContractVersion;
  name: string;
  description: string;
}

// ============================================================================
// Contract Configurations
// ============================================================================

const CONTRACT_CONFIGS: Record<ContractVersion, ContractConfig> = {
  v1: {
    id: CONTRACT_ID,
    version: "v1",
    name: "StellarStream V1",
    description: "Legacy streaming contract",
  },
  v2: {
    id: NEBULA_CONTRACT_ID,
    version: "v2",
    name: "Nebula V2",
    description: "Enhanced streaming with advanced features",
  },
};

// ============================================================================
// RPC Configuration
// ============================================================================

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-rpc.stellar.org";

// ============================================================================
// Provider Types
// ============================================================================

export interface BalanceInfo {
  available: bigint;
  locked: bigint;
  total: bigint;
  lastUpdated: Date;
}

export interface ContractBalance {
  v1: BalanceInfo | null;
  v2: BalanceInfo | null;
  combined: {
    available: bigint;
    locked: bigint;
    total: bigint;
  };
}

export interface StellarProviderState {
  // Contract instances
  v1Contract: Contract | null;
  v2Contract: Contract | null;
  activeContract: Contract | null;
  activeVersion: ContractVersion;
  
  // RPC Server
  rpcServer: SorobanRpc.Server;
  
  // Balance information
  balances: ContractBalance;
  isLoadingBalances: boolean;
  balanceError: string | null;
  
  // Contract metadata
  contractConfigs: typeof CONTRACT_CONFIGS;
}

interface StellarProviderContextType extends StellarProviderState {
  // Contract selection
  setActiveVersion: (version: ContractVersion) => void;
  
  // Balance operations
  refreshBalances: () => Promise<void>;
  
  // Contract utilities
  getContractByVersion: (version: ContractVersion) => Contract | null;
  getContractConfig: (version: ContractVersion) => ContractConfig;

  // Transaction helper — fires GlowToast on success/failure
  sendTransaction: <T extends TxResult>(operation: TxOperation, fn: () => Promise<T>) => Promise<T>;
}

const StellarProviderContext = createContext<StellarProviderContextType | undefined>(undefined);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get contract instance for a specific version
 */
function getContract(version: ContractVersion): Contract | null {
  const contractId = version === "v1" ? CONTRACT_ID : NEBULA_CONTRACT_ID;
  if (!contractId) {
    return null;
  }
  return new Contract(contractId);
}

/**
 * Format address for display (shortened)
 */
function formatAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Parse amount from contract units to display units (7 decimals)
 */
function parseContractAmount(amount: bigint, decimals: number = 7): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const decimalPart = amount % divisor;
  
  if (decimalPart === BigInt(0)) {
    return integerPart.toString();
  }
  
  return `${integerPart}.${decimalPart.toString().padStart(decimals, "0").replace(/0+$/, "")}`;
}

// ============================================================================
// Provider Component
// ============================================================================

export function StellarProvider({ children }: { children: React.ReactNode }) {
  // Wallet state from existing context
  const wallet = useWallet();
  
  // Toast-aware transaction sender
  const { send: sendTransaction } = useTransactionToast();
  
  // Contract instances
  const [v1Contract] = useState<Contract | null>(() => getContract("v1"));
  const [v2Contract] = useState<Contract | null>(() => getContract("v2"));
  const [activeVersion, setActiveVersion] = useState<ContractVersion>("v2");
  
  // RPC Server instance
  const rpcServer = useMemo(() => new SorobanRpc.Server(RPC_URL), []);
  
  // Balance state
  const [balances, setBalances] = useState<ContractBalance>({
    v1: null,
    v2: null,
    combined: {
      available: BigInt(0),
      locked: BigInt(0),
      total: BigInt(0),
    },
  });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  
  // Get active contract based on version
  const activeContract = useMemo(() => {
    return activeVersion === "v1" ? v1Contract : v2Contract;
  }, [activeVersion, v1Contract, v2Contract]);
  
  /**
   * Fetch balance for a specific contract version
   */
  const fetchBalanceForVersion = useCallback(async (
    version: ContractVersion,
    address: string
  ): Promise<BalanceInfo | null> => {
    const contract = version === "v1" ? v1Contract : v2Contract;
    
    if (!contract) {
      return null;
    }
    
    try {
      // Get the user's balance from the contract
      // This uses the contract's balance query function
      const balanceKey = {
        contractId: contract.contractId,
        key: "balance",
        type: "i128" as const,
      };
      
      // Balance fetching requires contract-specific ABI calls; return 0 as placeholder
      const balanceResult = "0";
      
      return {
        available: BigInt(balanceResult),
        locked: BigInt(0),
        total: BigInt(balanceResult),
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error(`Error fetching ${version} balance:`, error);
      // Return a default balance structure for contracts without existing balance
      return {
        available: BigInt(0),
        locked: BigInt(0),
        total: BigInt(0),
        lastUpdated: new Date(),
      };
    }
  }, [v1Contract, v2Contract, rpcServer]);
  
  /**
   * Refresh balances for both contract versions
   */
  const refreshBalances = useCallback(async () => {
    if (!wallet.address) {
      setBalances({
        v1: null,
        v2: null,
        combined: {
          available: BigInt(0),
          locked: BigInt(0),
          total: BigInt(0),
        },
      });
      return;
    }
    
    setIsLoadingBalances(true);
    setBalanceError(null);
    
    try {
      // Fetch both balances in parallel
      const [v1Balance, v2Balance] = await Promise.all([
        fetchBalanceForVersion("v1", wallet.address),
        fetchBalanceForVersion("v2", wallet.address),
      ]);
      
      // Calculate combined totals
      const combined = {
        available: (v1Balance?.available || BigInt(0)) + (v2Balance?.available || BigInt(0)),
        locked: (v1Balance?.locked || BigInt(0)) + (v2Balance?.locked || BigInt(0)),
        total: (v1Balance?.total || BigInt(0)) + (v2Balance?.total || BigInt(0)),
      };
      
      setBalances({
        v1: v1Balance,
        v2: v2Balance,
        combined,
      });
    } catch (error) {
      console.error("Error refreshing balances:", error);
      setBalanceError(error instanceof Error ? error.message : "Failed to fetch balances");
    } finally {
      setIsLoadingBalances(false);
    }
  }, [wallet.address, fetchBalanceForVersion]);
  
  /**
   * Get contract instance by version
   */
  const getContractByVersion = useCallback((version: ContractVersion): Contract | null => {
    return version === "v1" ? v1Contract : v2Contract;
  }, [v1Contract, v2Contract]);
  
  /**
   * Get contract configuration by version
   */
  const getContractConfig = useCallback((version: ContractVersion): ContractConfig => {
    return CONTRACT_CONFIGS[version];
  }, []);
  
  // Fetch balances when wallet connects or changes
  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      refreshBalances();
    }
  }, [wallet.isConnected, wallet.address, refreshBalances]);
  
  // Value object for the context
  const value: StellarProviderContextType = {
    // Contract instances
    v1Contract,
    v2Contract,
    activeContract,
    activeVersion,
    
    // RPC Server
    rpcServer,
    
    // Balance information
    balances,
    isLoadingBalances,
    balanceError,
    
    // Contract metadata
    contractConfigs: CONTRACT_CONFIGS,
    
    // Methods
    setActiveVersion,
    refreshBalances,
    getContractByVersion,
    getContractConfig,
    sendTransaction,
  };
  
  return (
    <StellarProviderContext.Provider value={value}>
      {children}
    </StellarProviderContext.Provider>
  );
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * useContract - Hook to get contract instance by version
 * 
 * @param version - The contract version to use ('v1' | 'v2')
 * @returns Contract instance for the specified version
 * 
 * @example
 * ```tsx
 * const contract = useContract('v2');
 * const stream = await contract.getStream(streamId);
 * ```
 */
export function useContract(version: ContractVersion): Contract | null {
  const context = useContext(StellarProviderContext);
  if (context === undefined) {
    throw new Error("useContract must be used within a StellarProvider");
  }
  return context.getContractByVersion(version);
}

/**
 * useActiveContract - Hook to get the currently active contract
 * 
 * @returns The currently active contract instance and version
 * 
 * @example
 * ```tsx
 * const { activeContract, activeVersion, setActiveVersion } = useActiveContract();
 * ```
 */
export function useActiveContract() {
  const context = useContext(StellarProviderContext);
  if (context === undefined) {
    throw new Error("useActiveContract must be used within a StellarProvider");
  }
  return {
    contract: context.activeContract,
    version: context.activeVersion,
    setVersion: context.setActiveVersion,
  };
}

/**
 * useBalances - Hook to get user's balance information across both contracts
 * 
 * @returns Balance information for V1, V2, and combined totals
 * 
 * @example
 * ```tsx
 * const { v1, v2, combined, refreshBalances, isLoading } = useBalances();
 * console.log(`Total balance: ${combined.total}`);
 * ```
 */
export function useBalances() {
  const context = useContext(StellarProviderContext);
  if (context === undefined) {
    throw new Error("useBalances must be used within a StellarProvider");
  }
  return {
    v1: context.balances.v1,
    v2: context.balances.v2,
    combined: context.balances.combined,
    refreshBalances: context.refreshBalances,
    isLoading: context.isLoadingBalances,
    error: context.balanceError,
  };
}

/**
 * useStellarProvider - Main hook to access the StellarProvider context
 * 
 * @returns Full StellarProvider context with all methods and state
 * 
 * @example
 * ```tsx
 * const {
 *   v1Contract,
 *   v2Contract,
 *   balances,
 *   activeVersion,
 *   setActiveVersion,
 *   refreshBalances,
 * } = useStellarProvider();
 * ```
 */
export function useStellarProvider(): StellarProviderContextType {
  const context = useContext(StellarProviderContext);
  if (context === undefined) {
    throw new Error("useStellarProvider must be used within a StellarProvider");
  }
  return context;
}

// ============================================================================
// Re-export types for external use
// Note: Types are exported inline above (no duplicate exports needed)
// ============================================================================
