'use client';

import React from 'react';

type ViewMode = 'all' | 'active' | 'legacy';

interface StreamArchiveToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function StreamArchiveToggle({ currentView, onViewChange }: StreamArchiveToggleProps) {
  const views: { key: ViewMode; label: string }[] = [
    { key: 'all', label: 'All Streams' },
    { key: 'active', label: 'Active' },
    { key: 'legacy', label: 'Legacy V1' },
  ];

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
      {views.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onViewChange(key)}
          className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
            currentView === key
              ? 'bg-white dark:bg-gray-900 shadow-sm text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}