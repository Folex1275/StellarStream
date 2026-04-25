import { useCallback, useState, useEffect } from "react";
import { useWallet } from "@/lib/wallet-context";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HardwareWalletConfig {
  /** Standard transaction timeout in milliseconds (default: 30s) */
  standardTimeout: number;
  /** Hardware wallet timeout in milliseconds (default: 120s) */
  hardwareTimeout: number;
  /** Size threshold for considering a transaction "large" (in bytes) */
  largeTransactionThreshold: number;
}

export interface TransactionTimeout {
  timeoutMs: number;
  isHardwareWallet: boolean;
  isLargeTransaction: boolean;
  shouldConfirmOnDevice: boolean;
}

// ─── Default configuration ─────────────────────────────────────────────────────

const DEFAULT_CONFIG: HardwareWalletConfig = {
  standardTimeout: 30_000,      // 30 seconds
  hardwareTimeout: 120_000,     // 120 seconds (as required)
  largeTransactionThreshold: 2_000, // 2KB threshold
};

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Hook for managing hardware wallet transaction timeouts
 * 
 * Features:
 * - Automatically detects hardware wallet type
 * - Increases timeout to 120 seconds for hardware wallets
 * - Detects large transactions that require device scrolling
 * - Manages confirm-on-device modal state
 * 
 * @param config Optional configuration overrides
 * @returns Transaction timeout configuration and modal state management
 */
export function useHardwareWalletTimeout(
  config: Partial<HardwareWalletConfig> = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { walletType } = useWallet();
  
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [transactionSize, setTransactionSize] = useState<number | null>(null);
  const [activeDeviceName, setActiveDeviceName] = useState<string | null>(null);

  // ── Detect if hardware wallet ──────────────────────────────────────────────
  const isHardwareWallet = useCallback(
    (type: typeof walletType): boolean => {
      // Check for known hardware wallet types
      const HARDWARE_WALLETS = ["ledger", "trezor", "blockto", "lattice"];
      if (typeof type === "string") {
        return HARDWARE_WALLETS.some((hw) =>
          type.toLowerCase().includes(hw)
        );
      }
      return false;
    },
    []
  );

  // ── Detect large transaction ───────────────────────────────────────────────
  const isLargeTransaction = useCallback(
    (sizeBytes: number): boolean => {
      return sizeBytes > mergedConfig.largeTransactionThreshold;
    },
    [mergedConfig.largeTransactionThreshold]
  );

  // ── Get appropriate timeout ────────────────────────────────────────────────
  const getTimeout = useCallback((): TransactionTimeout => {
    const _isHardwareWallet = isHardwareWallet(walletType);
    const _isLargeTransaction =
      transactionSize !== null && isLargeTransaction(transactionSize);

    return {
      timeoutMs: _isHardwareWallet
        ? mergedConfig.hardwareTimeout
        : mergedConfig.standardTimeout,
      isHardwareWallet: _isHardwareWallet,
      isLargeTransaction: _isLargeTransaction,
      shouldConfirmOnDevice: _isHardwareWallet && _isLargeTransaction,
    };
  }, [
    walletType,
    transactionSize,
    isHardwareWallet,
    isLargeTransaction,
    mergedConfig,
  ]);

  // ── Open confirm modal    ──────────────────────────────────────────────────
  const openConfirmModal = useCallback((deviceName: string = "Hardware Wallet") => {
    setActiveDeviceName(deviceName);
    setConfirmModalOpen(true);
  }, []);

  // ── Close confirm modal ────────────────────────────────────────────────────
  const closeConfirmModal = useCallback(() => {
    setConfirmModalOpen(false);
    setActiveDeviceName(null);
  }, []);

  // ── Prepare transaction for signing ────────────────────────────────────────
  const prepareForSigning = useCallback(
    (txnXdr: string) => {
      // Estimate transaction size from XDR string (rough estimate)
      const estimatedSize = Buffer.from(txnXdr, "base64").length;
      setTransactionSize(estimatedSize);

      const timeout = getTimeout();
      
      // If hardware wallet with large transaction, show confirm modal
      if (timeout.shouldConfirmOnDevice) {
        const deviceMap: Record<string, string> = {
          ledger: "Ledger Device",
          trezor: "Trezor Wallet",
          blockto: "Blockto Wallet",
          lattice: "Lattice1",
        };
        const detected = Object.entries(deviceMap).find(([key]) =>
          walletType?.toLowerCase().includes(key)
        )?.[1];
        
        openConfirmModal(detected || "Hardware Wallet");
      }

      return timeout;
    },
    [getTimeout, walletType, openConfirmModal]
  );

  // ── Reset state when wallet disconnects ────────────────────────────────────
  useEffect(() => {
    if (!walletType) {
      setTransactionSize(null);
      setConfirmModalOpen(false);
      setActiveDeviceName(null);
    }
  }, [walletType]);

  return {
    // State
    confirmModalOpen,
    activeDeviceName,
    transactionSize,

    // Configuration
    config: mergedConfig,

    // Getters
    getTimeout,

    // Methods
    openConfirmModal,
    closeConfirmModal,
    prepareForSigning,
  };
}
