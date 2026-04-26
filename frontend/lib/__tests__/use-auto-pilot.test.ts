"use client";

import { renderHook, act } from '@testing-library/react';
import { useAutoPilot } from '../use-auto-pilot';
import { useGasBuffer } from '../use-gas-buffer';

// Mock dependencies
jest.mock('../use-gas-buffer');
jest.mock('../../utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useAutoPilot', () => {
  const mockDeposit = jest.fn();
  const mockStatus = { balanceXlm: 10 };

  beforeEach(() => {
    jest.clearAllMocks();
    (useGasBuffer as jest.Mock).mockReturnValue({
      status: mockStatus,
      loading: false,
      deposit: mockDeposit,
    });
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('initial state', () => {
    it('should initialize with default config', () => {
      const { result } = renderHook(() => useAutoPilot());
      
      expect(result.current.config).toEqual({
        enabled: false,
        thresholdXlm: 15,
        refillAmountXlm: 25,
      });
      expect(result.current.error).toBeNull();
      expect(result.current.isValid).toBe(true);
    });

    it('should load config from localStorage', () => {
      const savedConfig = JSON.stringify({
        enabled: true,
        thresholdXlm: 20,
        refillAmountXlm: 30,
      });
      localStorageMock.getItem.mockReturnValue(savedConfig);

      const { result } = renderHook(() => useAutoPilot());
      
      expect(result.current.config).toEqual({
        enabled: true,
        thresholdXlm: 20,
        refillAmountXlm: 30,
      });
    });

    it('should handle invalid localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => useAutoPilot());
      
      expect(result.current.error?.code).toBe('STORAGE_ERROR');
      expect(result.current.isValid).toBe(false);
    });
  });

  describe('updateConfig', () => {
    it('should update config and save to localStorage', () => {
      const { result } = renderHook(() => useAutoPilot());
      
      act(() => {
        result.current.updateConfig({ enabled: true });
      });
      
      expect(result.current.config.enabled).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gas-auto-pilot-config',
        JSON.stringify({ enabled: true, thresholdXlm: 15, refillAmountXlm: 25 })
      );
    });

    it('should validate threshold limits', () => {
      const { result } = renderHook(() => useAutoPilot());
      
      act(() => {
        result.current.updateConfig({ thresholdXlm: 150 }); // Above max limit
      });
      
      expect(result.current.error?.code).toBe('VALIDATION_ERROR');
      expect(result.current.isValid).toBe(false);
    });

    it('should validate refill amount limits', () => {
      const { result } = renderHook(() => useAutoPilot());
      
      act(() => {
        result.current.updateConfig({ refillAmountXlm: 0 }); // Below min limit
      });
      
      expect(result.current.error?.code).toBe('VALIDATION_ERROR');
      expect(result.current.isValid).toBe(false);
    });
  });

  describe('calculateGasRequirements', () => {
    it('should calculate gas deficit correctly', () => {
      const { result } = renderHook(() => useAutoPilot());
      
      const calculation = result.current.calculateGasRequirements(15);
      
      expect(calculation).toEqual({
        requiredGas: 15,
        currentGas: 10,
        deficit: 5,
        needsRefill: true,
        suggestedRefillAmount: 10, // 5 + 5 buffer
      });
    });

    it('should return no refill needed when sufficient gas', () => {
      const { result } = renderHook(() => useAutoPilot());
      
      const calculation = result.current.calculateGasRequirements(5);
      
      expect(calculation.needsRefill).toBe(false);
      expect(calculation.suggestedRefillAmount).toBe(0);
    });

    it('should handle zero or negative requirements', () => {
      const { result } = renderHook(() => useAutoPilot());
      
      const calculation1 = result.current.calculateGasRequirements(0);
      const calculation2 = result.current.calculateGasRequirements(-5);
      
      expect(calculation1.needsRefill).toBe(false);
      expect(calculation2.needsRefill).toBe(false);
    });
  });

  describe('batchRefillForSplit', () => {
    it('should perform batch refill when needed', async () => {
      const { result } = renderHook(() => useAutoPilot());
      mockDeposit.mockResolvedValue(undefined);
      
      let success;
      await act(async () => {
        success = await result.current.batchRefillForSplit(15);
      });
      
      expect(success).toBe(true);
      expect(mockDeposit).toHaveBeenCalledWith(10); // 5 deficit + 5 buffer
    });

    it('should return false when no refill needed', async () => {
      const { result } = renderHook(() => useAutoPilot());
      
      let success;
      await act(async () => {
        success = await result.current.batchRefillForSplit(5);
      });
      
      expect(success).toBe(false);
      expect(mockDeposit).not.toHaveBeenCalled();
    });

    it('should handle deposit errors', async () => {
      const { result } = renderHook(() => useAutoPilot());
      mockDeposit.mockRejectedValue(new Error('Deposit failed'));
      
      let success;
      await act(async () => {
        success = await result.current.batchRefillForSplit(15);
      });
      
      expect(success).toBe(false);
      expect(result.current.error?.code).toBe('DEPOSIT_ERROR');
    });
  });

  describe('checkAndAutoRefill', () => {
    it('should auto-refill when enabled and below threshold', async () => {
      (useGasBuffer as jest.Mock).mockReturnValue({
        status: { balanceXlm: 5 }, // Below threshold
        loading: false,
        deposit: mockDeposit,
      });
      
      const { result } = renderHook(() => useAutoPilot());
      act(() => {
        result.current.updateConfig({ enabled: true, thresholdXlm: 10 });
      });
      
      mockDeposit.mockResolvedValue(undefined);
      
      let success;
      await act(async () => {
        success = await result.current.checkAndAutoRefill();
      });
      
      expect(success).toBe(true);
      expect(mockDeposit).toHaveBeenCalledWith(25);
    });

    it('should not auto-refill when disabled', async () => {
      const { result } = renderHook(() => useAutoPilot());
      
      let success;
      await act(async () => {
        success = await result.current.checkAndAutoRefill();
      });
      
      expect(success).toBe(false);
      expect(mockDeposit).not.toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useAutoPilot());
      
      act(() => {
        result.current.updateConfig({ thresholdXlm: 150 }); // Trigger validation error
      });
      
      expect(result.current.error).not.toBeNull();
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });
});
