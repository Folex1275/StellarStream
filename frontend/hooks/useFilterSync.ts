"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * Custom hook to sync state with URL query parameters
 * Enables shareable "Filtered Views" by persisting filters to URL
 */
export function useFilterSync<T extends Record<string, any>>(
  initialState: T
): {
  filters: T;
  updateFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  updateFilters: (updates: Partial<T>) => void;
  clearFilters: () => void;
  isInitialized: boolean;
} {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [filters, setFilters] = useState<T>(initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const initialized: Partial<T> = {};

    Object.keys(initialState).forEach((key) => {
      const paramValue = params.get(key);
      if (paramValue !== null) {
        // Parse the parameter value based on the initial state type
        const initialValue = initialState[key as keyof T];
        if (Array.isArray(initialValue)) {
          initialized[key as keyof T] = paramValue
            ? (paramValue.split(",").filter(Boolean) as any)
            : initialValue;
        } else if (typeof initialValue === "number") {
          initialized[key as keyof T] = (parseFloat(paramValue) || 0) as any;
        } else if (typeof initialValue === "boolean") {
          initialized[key as keyof T] = (paramValue === "true") as any;
        } else {
          initialized[key as keyof T] = paramValue as any;
        }
      }
    });

    if (Object.keys(initialized).length > 0) {
      setFilters((prev) => ({ ...prev, ...initialized }));
    }
    setIsInitialized(true);
  }, [searchParams, initialState]);

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: T) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(","));
          } else {
            params.delete(key);
          }
        } else if (typeof value === "number" || typeof value === "boolean") {
          params.set(key, String(value));
        } else if (value !== "") {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });

      const newURL = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;

      router.push(newURL, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Update a single filter
  const updateFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters((prev) => {
        const newFilters = { ...prev, [key]: value };
        updateURL(newFilters);
        return newFilters;
      });
    },
    [updateURL]
  );

  // Update multiple filters at once
  const updateFilters = useCallback(
    (updates: Partial<T>) => {
      setFilters((prev) => {
        const newFilters = { ...prev, ...updates };
        updateURL(newFilters);
        return newFilters;
      });
    },
    [updateURL]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(initialState);
    // Clear all filter params from URL
    const params = new URLSearchParams(searchParams.toString());
    Object.keys(initialState).forEach((key) => {
      params.delete(key);
    });
    const newURL = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.push(newURL, { scroll: false });
  }, [initialState, pathname, router, searchParams]);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    isInitialized,
  };
}
