'use client';

import { useState, useEffect } from 'react';

export const useAccessibility = () => {
  const [highContrast, setHighContrast] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('stellar-high-contrast');
    if (saved === 'true') {
      setHighContrast(true);
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);

    if (newValue) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('stellar-high-contrast', 'true');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.setItem('stellar-high-contrast', 'false');
    }
  };

  return {
    highContrast,
    toggleHighContrast,
  };
};