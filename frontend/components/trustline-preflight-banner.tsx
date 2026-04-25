"use client";

// components/trustline-preflight-banner.tsx
// Issue: Trustline Preflight Warning
// Shows a warning banner listing recipients missing the required trustline,
// with a "Fix All" button that suggests switching to Claim-Based (Pull) mode.

import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTrustlinePreflight } from "@/lib/use-trustline-preflight";
import type { RecipientRow } from "@/components/recipient-grid";

interface Props {
  rows: RecipientRow[];
  assetCode: string;
  assetIssuer: string;
  /** Called when the user clicks "Fix All" — switch to claim-based mode */
  onSwitchToClaimBased: () => void;
}

export function TrustlinePreflightBanner({
  rows,
  assetCode,
  assetIssuer,
  onSwitchToClaimBased,
}: Props) {
  const { invalidAddresses, isChecking, error, check, reset } =
    useTrustlinePreflight();

  const addresses = rows.map((r) => r.address).filter(Boolean);
  const hasChecked = invalidAddresses.size > 0 || (!isChecking && error === null && addresses.length > 0);
  const invalidCount = invalidAddresses.size;

  return (
    <div className="space-y-2">
      {/* Run check button */}
      <button
        onClick={() => {
          reset();
          check(addresses, assetCode, assetIssuer);
        }}
        disabled={isChecking || addresses.length === 0}
        className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/50 hover:text-white/80 disabled:opacity-40 transition-colors"
      >
        {isChecking ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <ShieldAlert className="h-3 w-3" />
        )}
        {isChecking ? "Checking trustlines…" : "Run Preflight Check"}
      </button>

      <AnimatePresence>
        {/* Error state */}
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3"
          >
            <p className="text-[11px] text-red-400/80">⚠ {error}</p>
          </motion.div>
        )}

        {/* All clear */}
        {!isChecking && !error && hasChecked && invalidCount === 0 && (
          <motion.div
            key="ok"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-2.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <p className="text-[11px] text-emerald-400/80">
              All recipients have the {assetCode} trustline.
            </p>
          </motion.div>
        )}

        {/* Warning: missing trustlines */}
        {!isChecking && invalidCount > 0 && (
          <motion.div
            key="warn"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 py-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                <div>
                  <p className="text-[11px] font-semibold text-amber-400">
                    {invalidCount} recipient{invalidCount > 1 ? "s" : ""} missing {assetCode} trustline
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/40">
                    These addresses cannot receive {assetCode} via a direct push payment.
                  </p>
                </div>
              </div>
              <button
                onClick={onSwitchToClaimBased}
                className="shrink-0 rounded-lg bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 text-[11px] font-semibold text-amber-400 hover:bg-amber-400/20 transition-colors"
              >
                Fix All → Claim-Based
              </button>
            </div>

            {/* List of invalid addresses */}
            <ul className="space-y-1 pl-5">
              {[...invalidAddresses].map((addr) => (
                <li key={addr} className="flex items-center gap-1.5 text-[10px] text-white/40 font-mono">
                  <AlertTriangle className="h-2.5 w-2.5 text-amber-400/60 shrink-0" />
                  {addr.slice(0, 8)}…{addr.slice(-6)}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
