'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/**
 * Recipient interface for stress testing
 * Matches the design document specification
 */
export interface Recipient {
  id: number;
  address: string;
  label: string;
  amount: string;
  token: string;
  taxId?: string;
  transactions: number;
  lastActive: string;
  lat?: number;
  lng?: number;
}

/**
 * RecipientRow component - memoized to prevent unnecessary re-renders
 * Renders a single table row with recipient data
 */
const RecipientRow = React.memo(function RecipientRow({
  recipient,
}: {
  recipient: Recipient;
}) {
  return (
    <tr className="border-b border-stellar-glass-border hover:bg-stellar-glass-hover transition-colors">
      <td className="px-4 py-3 text-sm font-mono text-stellar-text-secondary truncate">
        {recipient.address}
      </td>
      <td className="px-4 py-3 text-sm text-stellar-text-primary">
        {recipient.label}
      </td>
      <td className="px-4 py-3 text-sm text-stellar-text-primary text-right">
        {recipient.amount}
      </td>
      <td className="px-4 py-3 text-sm text-stellar-text-primary text-center">
        {recipient.token}
      </td>
      <td className="px-4 py-3 text-sm text-stellar-text-secondary text-center">
        {recipient.transactions}
      </td>
      <td className="px-4 py-3 text-sm text-stellar-text-secondary">
        {new Date(recipient.lastActive).toLocaleDateString()}
      </td>
    </tr>
  );
});

/**
 * RecipientGrid component
 * Renders a virtualized table of recipients using @tanstack/react-virtual
 * Supports 500+ rows with minimal DOM nodes
 */
export function RecipientGrid({ recipients }: { recipients: Recipient[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: recipients.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      className="w-full h-[600px] overflow-y-auto border border-stellar-glass-border rounded-lg bg-stellar-glass-card"
    >
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-stellar-glass-header z-10">
          <tr className="border-b border-stellar-glass-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-stellar-text-secondary uppercase tracking-wider">
              Address
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-stellar-text-secondary uppercase tracking-wider">
              Label
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-stellar-text-secondary uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-stellar-text-secondary uppercase tracking-wider">
              Token
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-stellar-text-secondary uppercase tracking-wider">
              Transactions
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-stellar-text-secondary uppercase tracking-wider">
              Last Active
            </th>
          </tr>
        </thead>
        <tbody
          style={{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <RecipientRow recipient={recipients[virtualItem.index]} />
            </div>
          ))}
        </tbody>
      </table>
    </div>
  );
}
