'use client';

import { useState, useEffect } from 'react';

export type Theme = 'default' | 'dark-hc';

const STORAGE_KEY = 'stellar-theme';
const HC_CLASS = 'dark-hc';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('default');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'dark-hc') {
      setThemeState('dark-hc');
      document.documentElement.classList.add(HC_CLASS);
    }
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    if (next === 'dark-hc') {
      document.documentElement.classList.add(HC_CLASS);
    } else {
      document.documentElement.classList.remove(HC_CLASS);
    }
  };

  const toggleTheme = () => setTheme(theme === 'dark-hc' ? 'default' : 'dark-hc');

  return { theme, setTheme, toggleTheme, isDarkHC: theme === 'dark-hc' };
}
