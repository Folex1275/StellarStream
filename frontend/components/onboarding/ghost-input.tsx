'use client';

import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GhostInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  hint?: string;
  type?: string;
}

export function GhostInput({
  label,
  placeholder,
  value,
  onChange,
  icon,
  hint,
  type = 'text',
}: GhostInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-white/70">
        {label}
      </label>

      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className={`
            absolute left-4 top-1/2 -translate-y-1/2
            transition-colors duration-300
            ${isFocused ? 'text-primary' : 'text-white/40'}
          `}>
            {icon}
          </div>
        )}

        {/* Input */}
        <motion.input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            w-full py-4 px-5 ${icon ? 'pl-12' : ''}
            bg-white/5 border-2 border-white/20
            rounded-xl text-white placeholder:text-white/30
            transition-all duration-300 ease-out
            focus:outline-none focus:bg-white/[0.07]
            ${isFocused ? 'pulse-cyan-border' : ''}
          `}
          animate={{
            boxShadow: isFocused
              ? '0 0 20px rgba(0, 245, 255, 0.15), inset 0 0 20px rgba(0, 245, 255, 0.05)'
              : '0 0 0px rgba(0, 245, 255, 0)',
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Cyan Glow Effect on Focus */}
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, rgba(0,245,255,0.1), transparent, rgba(138,0,255,0.1))',
              opacity: 0.5,
            }}
          />
        )}
      </div>

      {/* Hint Text */}
      {hint && (
        <p className="text-xs text-white/40 mt-1">
          {hint}
        </p>
      )}

      {/* Cyan Pulse Animation Styles */}
      <style jsx>{`
        .pulse-cyan-border {
          border-color: rgba(0, 245, 255, 0.5);
          animation: pulse-cyan 2s ease-in-out infinite;
        }

        @keyframes pulse-cyan {
          0%, 100% {
            border-color: rgba(0, 245, 255, 0.4);
            box-shadow: 0 0 10px rgba(0, 245, 255, 0.1);
          }
          50% {
            border-color: rgba(0, 245, 255, 0.7);
            box-shadow: 0 0 20px rgba(0, 245, 255, 0.25);
          }
        }
      `}</style>
    </div>
  );
}
