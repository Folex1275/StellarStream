'use client';

import React from 'react';
import { useAccessibility } from '../hooks/useAccessibility'; 

export default function AccessibilityToggle() {
  const { highContrast, toggleHighContrast } = useAccessibility();

  return (
    <button
      onClick={toggleHighContrast}
      aria-pressed={highContrast}
      aria-label={highContrast ? "Disable High Contrast Mode" : "Enable Aria-Glow High Contrast Mode"}
      className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all font-medium text-sm"
    >
      <span className="text-lg">✨</span>
      <span>Aria-Glow</span>
      
      {/* Toggle Switch */}
      <div className={`w-10 h-5 rounded-full border-2 border-black dark:border-white relative transition-colors ${highContrast ? 'bg-black dark:bg-white' : 'bg-transparent'}`}>
        <div 
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-black border border-black dark:border-white transition-all duration-200 ${highContrast ? 'translate-x-5' : ''}`} 
        />
      </div>
    </button>
  );
}