'use client';

import { HealthCard } from '@/components/dashboard/HealthCard';
import { GlobalSearch } from '@/components/globalsearch';

/**
 * Organization Health Command Center Page
 * Displays high-level dashboard for executives to see the health of their disbursement pipeline
 * Requirements: 3.1, 3.2, 3.9
 */
export default function HealthPage() {
  return (
    <div className="min-h-screen bg-stellar-bg p-6">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stellar-text-primary font-syne">
            Organization Health
          </h1>
          <p className="text-stellar-text-secondary mt-2">
            Disbursement pipeline status across all assets
          </p>
        </div>

        {/* Global Search */}
        <div className="mb-8">
          <GlobalSearch />
        </div>

        {/* Health Card */}
        <div className="bg-stellar-glass-card rounded-lg border border-stellar-glass-border p-6">
          <HealthCard />
        </div>
      </div>
    </div>
  );
}
