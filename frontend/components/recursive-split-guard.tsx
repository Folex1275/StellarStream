"use client";

import { useState, useEffect } from "react";
import { ShieldX, AlertTriangle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecursiveSplitGuardProps {
  /** The address the user is trying to add as a recipient */
  recipientAddress: string;
  /** The current contract's own address — adding this as a recipient is blocked */
  currentContractId: string;
  /** Called with `true` when the address is a self-referential contract */
  onBlockedChange?: (isBlocked: boolean) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns whether `address` matches the current contract ID.
 * Extend this with an on-chain lookup if you need to detect *other* splitter contracts.
 */
export function useRecursiveSplitGuard(
  recipientAddress: string,
  currentContractId: string,
): boolean {
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const blocked =
      recipientAddress.trim().length > 0 &&
      recipientAddress.trim().toLowerCase() === currentContractId.trim().toLowerCase();
    setIsBlocked(blocked);
  }, [recipientAddress, currentContractId]);

  return isBlocked;
}

// ─── Inline warning banner ────────────────────────────────────────────────────

export function RecursiveSplitWarning({ address }: { address: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
      <ShieldX className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">Inception Split Blocked</p>
        <p className="mt-0.5 text-xs text-red-400/70">
          <span className="font-mono">{address.slice(0, 8)}…{address.slice(-4)}</span> is this
          contract's own address. Adding it as a recipient would create a recursive loop.
        </p>
      </div>
    </div>
  );
}

// ─── Submit-button guard wrapper ──────────────────────────────────────────────

/**
 * Wraps a submit button and hard-blocks it when `isBlocked` is true.
 */
export function GuardedSubmitButton({
  isBlocked,
  onClick,
  children,
  className = "",
}: {
  isBlocked: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        disabled={isBlocked}
        onClick={onClick}
        className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition
          ${isBlocked
            ? "cursor-not-allowed bg-white/5 text-white/30"
            : "bg-indigo-600 text-white hover:bg-indigo-500"
          } ${className}`}
      >
        {children}
      </button>
      {isBlocked && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          Remove the self-referential address to continue.
        </div>
      )}
    </div>
  );
}
