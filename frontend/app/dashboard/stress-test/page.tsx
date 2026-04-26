'use client';

import React, { useEffect, useState } from 'react';
import { RecipientGrid, type Recipient } from '@/components/dashboard/RecipientGrid';
import { RecipientMap } from '@/components/dashboard/RecipientMap';

/**
 * Stress Test Page
 * Tests the RecipientGrid and RecipientMap components with 500+ recipients
 * Measures Time to Interactive (TTI) and validates performance
 */
export default function StressTestPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tti, setTti] = useState<number | null>(null);

  useEffect(() => {
    const loadRecipients = async () => {
      try {
        setLoading(true);
        setError(null);

        // Capture performance start time before fetch
        const startTime = performance.now();

        // Fetch dummy recipients from public folder
        const response = await fetch('/dummy-recipients.json');

        if (!response.ok) {
          throw new Error(
            `Failed to load dummy recipients: ${response.statusText}`
          );
        }

        const data: Recipient[] = await response.json();

        // Validate data shape
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Invalid or empty recipients data');
        }

        setRecipients(data);

        // Measure TTI after first paint
        // Use requestAnimationFrame to ensure paint has occurred
        requestAnimationFrame(() => {
          const endTime = performance.now();
          const ttiMs = endTime - startTime;
          setTti(ttiMs);

          // Log TTI to console for performance monitoring
          console.log(
            `✅ RecipientGrid TTI: ${ttiMs.toFixed(2)}ms (${data.length} recipients)`
          );
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error loading recipients:', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadRecipients();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-stellar-bg p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-stellar-text-primary font-syne">
              X-Ray Component Stress Test
            </h1>
            <p className="text-stellar-text-secondary mt-2">
              Loading recipients for performance testing...
            </p>
          </div>

          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-stellar-primary mb-4"></div>
              <p className="text-stellar-text-secondary">Loading test data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stellar-bg p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-stellar-text-primary font-syne">
              X-Ray Component Stress Test
            </h1>
            <p className="text-stellar-text-secondary mt-2">
              Performance testing for recipient grid and map
            </p>
          </div>

          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-red-400 mb-2">
              Error Loading Test Data
            </h2>
            <p className="text-stellar-text-secondary mb-4">{error}</p>
            <div className="bg-stellar-glass-card p-4 rounded border border-stellar-glass-border">
              <p className="text-sm text-stellar-text-secondary mb-2">
                To generate dummy recipients, run:
              </p>
              <code className="text-xs font-mono text-stellar-primary bg-black/30 p-2 rounded block">
                npx ts-node scripts/generate-dummy-recipients.ts
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stellar-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stellar-text-primary font-syne">
            X-Ray Component Stress Test
          </h1>
          <p className="text-stellar-text-secondary mt-2">
            Performance testing for recipient grid and map with{' '}
            <span className="text-stellar-primary font-semibold">
              {recipients.length} recipients
            </span>
          </p>

          {tti !== null && (
            <div className="mt-4 p-3 bg-stellar-glass-card border border-stellar-glass-border rounded-lg">
              <p className="text-sm text-stellar-text-secondary">
                Time to Interactive:{' '}
                <span className="text-stellar-primary font-mono font-semibold">
                  {tti.toFixed(2)}ms
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Recipient Grid Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-stellar-text-primary mb-4 font-syne">
            Virtualized Recipient Grid
          </h2>
          <div className="bg-stellar-glass-card rounded-lg border border-stellar-glass-border overflow-hidden">
            <RecipientGrid recipients={recipients} />
          </div>
          <p className="text-xs text-stellar-text-secondary mt-2">
            Virtualized table with {recipients.length} rows. Scroll to test
            performance.
          </p>
        </div>

        {/* Recipient Map Section */}
        <div>
          <h2 className="text-xl font-semibold text-stellar-text-primary mb-4 font-syne">
            Recipient Map with Clustering
          </h2>
          <div className="bg-stellar-glass-card rounded-lg border border-stellar-glass-border overflow-hidden">
            <RecipientMap recipients={recipients} />
          </div>
          <p className="text-xs text-stellar-text-secondary mt-2">
            Map with {recipients.length} markers and clustering. Click markers
            to view details.
          </p>
        </div>
      </div>
    </div>
  );
}
