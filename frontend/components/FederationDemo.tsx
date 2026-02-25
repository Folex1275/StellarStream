/**
 * Demo Component: Federation Address Resolver
 * Example usage of the federation resolver service
 */

'use client';

import { useState } from 'react';
import { useFederation } from '@/lib/use-federation';
import { FederationRecord } from '@/lib/federation-types';

export function FederationDemo() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<FederationRecord | null>(null);
  const { resolve, loading, error } = useFederation();

  const handleResolve = async () => {
    const record = await resolve(address);
    setResult(record);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Federation Address Resolver</h2>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Federation Address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="user*domain.com"
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <button
        onClick={handleResolve}
        disabled={loading || !address}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {loading ? 'Resolving...' : 'Resolve'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
          <p className="text-green-800 font-medium">Resolved Successfully</p>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Account ID:</span> {result.account_id}</p>
            {result.stellar_address && (
              <p><span className="font-medium">Stellar Address:</span> {result.stellar_address}</p>
            )}
            {result.memo_type && (
              <p><span className="font-medium">Memo Type:</span> {result.memo_type}</p>
            )}
            {result.memo && (
              <p><span className="font-medium">Memo:</span> {result.memo}</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Example Addresses</h3>
        <ul className="text-sm space-y-1 text-gray-600">
          <li>• user*example.com</li>
          <li>• alice*stellar.org</li>
          <li>• Format: username*domain.com</li>
        </ul>
      </div>
    </div>
  );
}
