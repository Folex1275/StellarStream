'use client';

import React, { useState } from 'react';

interface StreamMemoInputProps {
  value: string;
  onChange: (memo: string) => void;
  disabled?: boolean;
}

export default function StreamMemoInput({
  value,
  onChange,
  disabled = false,
}: StreamMemoInputProps) {
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const byteLength = new TextEncoder().encode(input).length;

    if (byteLength > 32) {
      setError(`Memo must be ≤ 32 bytes (${byteLength}/32)`);
    } else {
      setError('');
      onChange(input);
    }
  };

  const byteLength = new TextEncoder().encode(value).length;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Stream Memo <span className="text-xs text-gray-500">(Optional - max 32 bytes)</span>
      </label>

      <input
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="e.g. Invoice #INV-2026-045 or Q1 Milestone"
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 disabled:opacity-60"
      />

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      {value && !error && (
        <p className="text-xs text-green-600 dark:text-green-400">
          {byteLength} / 32 bytes
        </p>
      )}
    </div>
  );
}