"use client";

import { useState, useEffect, useCallback } from "react";
import { useGasBuffer } from "./use-gas-buffer";

// Constants for validation
const MIN_THRESHOLD_XLM = 1;
const MAX_THRESHOLD_XLM = 100;
const MIN_REFILL_XLM = 1;
const MAX_REFILL_XLM = 1000;
const GAS_BUFFER_XLM = 5; // Buffer amount added to suggested refill

interface AutoPilotConfig {
  enabled: boolean;
  thresholdXlm: number;
  refillAmountXlm: number;
}

interface GasCalculation {
  requiredGas: number;
  currentGas: number;
  deficit: number;
  needsRefill: boolean;
  suggestedRefillAmount: number;
}

interface AutoPilotError {
  code: 'STORAGE_ERROR' | 'VALIDATION_ERROR' | 'DEPOSIT_ERROR' | 'NETWORK_ERROR';
  message: string;
}

// Validation functions
const validateConfig = (config: Partial<AutoPilotConfig>): AutoPilotError | null => {
  if (config.thresholdXlm !== undefined) {
    if (config.thresholdXlm < MIN_THRESHOLD_XLM || config.thresholdXlm > MAX_THRESHOLD_XLM) {
      return {
        code: 'VALIDATION_ERROR',
        message: `Threshold must be between ${MIN_THRESHOLD_XLM} and ${MAX_THRESHOLD_XLM} XLM`
      };
    }
  }
  
  if (config.refillAmountXlm !== undefined) {
    if (config.refillAmountXlm < MIN_REFILL_XLM || config.refillAmountXlm > MAX_REFILL_XLM) {
      return {
        code: 'VALIDATION_ERROR',
        message: `Refill amount must be between ${MIN_REFILL_XLM} and ${MAX_REFILL_XLM} XLM`
      };
    }
  }
  
  return null;
};

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
};

export function useAutoPilot() {
  const { status, loading, deposit } = useGasBuffer();
  const [config, setConfig] = useState<AutoPilotConfig>({
    enabled: false,
    thresholdXlm: 15,
    refillAmountXlm: 25,
  });
  const [error, setError] = useState<AutoPilotError | null>(null);

  // Load config from localStorage
  useEffect(() => {
    const saved = safeLocalStorage.getItem("gas-auto-pilot-config");
    if (saved) {
      try {
        const parsedConfig = JSON.parse(saved);
        const validationError = validateConfig(parsedConfig);
        if (validationError) {
          setError(validationError);
          // Reset to defaults on validation error
          setConfig({
            enabled: false,
            thresholdXlm: 15,
            refillAmountXlm: 25,
          });
        } else {
          setConfig(parsedConfig);
        }
      } catch (parseError) {
        setError({
          code: 'STORAGE_ERROR',
          message: 'Invalid configuration data found'
        });
      }
    }
  }, []);

  // Save config to localStorage
  const updateConfig = useCallback((newConfig: Partial<AutoPilotConfig>) => {
    const validationError = validateConfig(newConfig);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    
    const success = safeLocalStorage.setItem("gas-auto-pilot-config", JSON.stringify(updated));
    if (!success) {
      setError({
        code: 'STORAGE_ERROR',
        message: 'Failed to save configuration'
      });
    }
  }, [config]);

  // Calculate gas requirements for a split
  const calculateGasRequirements = useCallback((requiredXlm: number): GasCalculation => {
    if (requiredXlm <= 0) {
      return {
        requiredGas: requiredXlm,
        currentGas: status?.balanceXlm ?? 0,
        deficit: 0,
        needsRefill: false,
        suggestedRefillAmount: 0,
      };
    }

    const currentGas = status?.balanceXlm ?? 0;
    const deficit = Math.max(0, requiredXlm - currentGas);
    const needsRefill = deficit > 0;
    
    // Suggested refill amount covers the deficit plus a buffer
    const suggestedRefillAmount = needsRefill 
      ? Math.ceil(deficit + GAS_BUFFER_XLM)
      : 0;

    return {
      requiredGas: requiredXlm,
      currentGas,
      deficit,
      needsRefill,
      suggestedRefillAmount,
    };
  }, [status]);

  // Auto-refill logic
  const checkAndAutoRefill = useCallback(async (): Promise<boolean> => {
    if (!config.enabled || loading || !status) return false;

    const shouldAutoRefill = status.balanceXlm < config.thresholdXlm;
    
    if (shouldAutoRefill) {
      try {
        await deposit(config.refillAmountXlm);
        setError(null);
        return true;
      } catch (error) {
        const errorObj: AutoPilotError = {
          code: 'DEPOSIT_ERROR',
          message: error instanceof Error ? error.message : 'Auto-refill failed'
        };
        setError(errorObj);
        return false;
      }
    }
    
    return false;
  }, [config, loading, status, deposit]);

  // Batch refill for splits
  const batchRefillForSplit = useCallback(async (requiredXlm: number): Promise<boolean> => {
    if (!status || requiredXlm <= 0) return false;

    const calculation = calculateGasRequirements(requiredXlm);
    
    if (calculation.needsRefill) {
      try {
        await deposit(calculation.suggestedRefillAmount);
        setError(null);
        return true;
      } catch (error) {
        const errorObj: AutoPilotError = {
          code: 'DEPOSIT_ERROR',
          message: error instanceof Error ? error.message : 'Batch refill failed'
        };
        setError(errorObj);
        return false;
      }
    }
    
    return false;
  }, [status, calculateGasRequirements, deposit]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    config,
    error,
    updateConfig,
    calculateGasRequirements,
    checkAndAutoRefill,
    batchRefillForSplit,
    clearError,
    isAutoRefillPossible: status !== null && status.balanceXlm < config.thresholdXlm,
    isValid: error === null,
  };
}
