/**
 * React Hook for Federation Address Resolution
 */

import { useState, useCallback } from 'react';
import { federationResolver } from './federation-resolver';
import { FederationRecord, FederationError, isFederationError } from './federation-types';

export function useFederation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = useCallback(async (address: string): Promise<FederationRecord | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await federationResolver.resolve(address);

      if (isFederationError(result)) {
        setError(result.error);
        return null;
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveBatch = useCallback(async (addresses: string[]): Promise<Map<string, FederationRecord | FederationError>> => {
    setLoading(true);
    setError(null);

    try {
      const results = await federationResolver.resolveBatch(addresses);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return new Map();
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    resolve,
    resolveBatch,
    loading,
    error,
  };
}
