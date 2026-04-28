// lib/hooks/use-organization-health.ts
import { useState, useEffect, useCallback } from 'react';

export interface OrganizationHealthData {
  successRate: number; // percentage
  totalVolume30d: number; // in USD
  activeProposals: number;
}

export interface UseOrganizationHealthReturn {
  data: OrganizationHealthData | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  lastFetchedAt: number | null;
}

/**
 * Hook to fetch and manage organization health data
 * Includes real API fetch, error handling, retry functionality, and auto-refresh every 5 minutes
 */
export const useOrganizationHealth = (): UseOrganizationHealthReturn => {
  const [data, setData] = useState<OrganizationHealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  /**
   * Fetch organization health data from API
   */
  const fetchOrganizationHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(
        `${apiUrl}/analytics/organization-health`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch organization health: ${response.statusText}`
        );
      }

      const result = await response.json();

      // Validate response shape and provide defaults for missing fields
      const validatedData: OrganizationHealthData = {
        successRate: result.successRate ?? 0,
        totalVolume30d: result.totalVolume30d ?? 0,
        activeProposals: result.activeProposals ?? 0,
      };

      setData(validatedData);
      setLastFetchedAt(Date.now());
      setLoading(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Failed to fetch organization health:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      // Keep existing data if available (do not clear on auto-refresh failure)
    }
  }, []);

  /**
   * Retry function to manually trigger a re-fetch
   */
  const retry = useCallback(() => {
    setError(null);
    fetchOrganizationHealth();
  }, [fetchOrganizationHealth]);

  /**
   * Initial fetch and auto-refresh every 5 minutes
   */
  useEffect(() => {
    // Fetch on mount
    fetchOrganizationHealth();

    // Set up auto-refresh interval (300,000 ms = 5 minutes)
    const intervalId = setInterval(() => {
      fetchOrganizationHealth();
    }, 300_000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchOrganizationHealth]);

  return { data, loading, error, retry, lastFetchedAt };
};