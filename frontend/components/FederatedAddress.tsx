/**
 * Component: Federated Address Display
 * Displays Stellar addresses with federation resolution
 * Shows user*domain.com instead of G...123 when available
 */

'use client';

import { useEffect, useState } from 'react';
import { federationResolver } from '@/lib/federation-resolver';
import { FederationRecord, isFederationError } from '@/lib/federation-types';

interface FederatedAddressProps {
  address: string;
  fallbackToShort?: boolean;
  className?: string;
}

export function FederatedAddress({ 
  address, 
  fallbackToShort = true,
  className = '' 
}: FederatedAddressProps) {
  const [displayAddress, setDisplayAddress] = useState<string>(address);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If it's already a federation address, display it
    if (address.includes('*')) {
      setDisplayAddress(address);
      return;
    }

    // Try to reverse lookup (not implemented in basic version)
    // For now, just show shortened version if requested
    if (fallbackToShort && address.startsWith('G') && address.length > 20) {
      setDisplayAddress(`${address.slice(0, 4)}...${address.slice(-4)}`);
    } else {
      setDisplayAddress(address);
    }
  }, [address, fallbackToShort]);

  return (
    <span className={className} title={address}>
      {displayAddress}
    </span>
  );
}

interface ResolvedAddressProps {
  federationAddress: string;
  showAccountId?: boolean;
  className?: string;
}

export function ResolvedAddress({ 
  federationAddress, 
  showAccountId = false,
  className = '' 
}: ResolvedAddressProps) {
  const [record, setRecord] = useState<FederationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolve() {
      setLoading(true);
      const result = await federationResolver.resolve(federationAddress);

      if (isFederationError(result)) {
        setError(result.error);
        setRecord(null);
      } else {
        setRecord(result);
        setError(null);
      }
      setLoading(false);
    }

    resolve();
  }, [federationAddress]);

  if (loading) {
    return <span className={className}>Resolving...</span>;
  }

  if (error || !record) {
    return <span className={className} title={error || undefined}>{federationAddress}</span>;
  }

  if (showAccountId) {
    return (
      <span className={className} title={record.account_id}>
        {federationAddress} ({record.account_id.slice(0, 4)}...{record.account_id.slice(-4)})
      </span>
    );
  }

  return (
    <span className={className} title={record.account_id}>
      {federationAddress}
    </span>
  );
}
