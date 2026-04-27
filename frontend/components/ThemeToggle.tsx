'use client';

import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { isDarkHC, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-pressed={isDarkHC}
      aria-label={isDarkHC ? 'Switch to default theme' : 'Switch to high-contrast dark mode'}
      title={isDarkHC ? 'Default theme' : 'High-contrast dark'}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200
        ${isDarkHC
          ? 'border-[#00e5ff]/40 bg-[#050a14] text-[#00e5ff] hover:border-[#00e5ff]/70 hover:bg-[#0a1628]'
          : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white'
        } ${className}`}
    >
      {isDarkHC ? (
        <Moon className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Sun className="w-4 h-4" aria-hidden="true" />
      )}
      <span className="text-xs font-medium hidden sm:inline">
        {isDarkHC ? 'Dark HC' : 'Default'}
      </span>

      {/* Toggle pill */}
      <div
        className={`w-8 h-4 rounded-full border relative transition-colors duration-200
          ${isDarkHC ? 'bg-[#00e5ff]/20 border-[#00e5ff]/50' : 'bg-white/10 border-white/20'}`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200
            ${isDarkHC
              ? 'left-[calc(100%-14px)] bg-[#00e5ff]'
              : 'left-0.5 bg-white/60'
            }`}
        />
      </div>
    </button>
  );
}
