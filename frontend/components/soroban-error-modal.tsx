"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XCircle,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  X,
  Bug,
} from "lucide-react";
import { useErrorDecoder, type DecodedError } from "@/lib/use-error-decoder";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SorobanErrorModalProps {
  /** Raw XDR result string, error object, numeric code, or null/undefined to close */
  error: unknown;
  onClose: () => void;
  /** Optional transaction hash — adds a Stellar.Expert link */
  txHash?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<
  DecodedError["severity"],
  { icon: React.ReactNode; border: string; glow: string; badge: string }
> = {
  fatal: {
    icon: <XCircle className="h-6 w-6 text-red-400" />,
    border: "border-red-500/30",
    glow: "shadow-[0_0_40px_rgba(239,68,68,0.12)]",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  error: {
    icon: <AlertCircle className="h-6 w-6 text-orange-400" />,
    border: "border-orange-500/30",
    glow: "shadow-[0_0_40px_rgba(249,115,22,0.12)]",
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-yellow-400" />,
    border: "border-yellow-500/30",
    glow: "shadow-[0_0_40px_rgba(234,179,8,0.10)]",
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
};

// ─── Support payload builder ──────────────────────────────────────────────────

function buildSupportPayload(decoded: DecodedError, txHash?: string): string {
  return JSON.stringify(
    {
      title: decoded.title,
      description: decoded.description,
      severity: decoded.severity,
      raw: decoded.raw,
      txHash: txHash ?? null,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    },
    null,
    2
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SorobanErrorModal({
  error,
  onClose,
  txHash,
}: SorobanErrorModalProps) {
  const { decode } = useErrorDecoder();
  const [copied, setCopied] = useState(false);

  const isOpen = error !== null && error !== undefined;
  const decoded = isOpen ? decode(error) : null;
  const style = decoded ? SEVERITY_STYLES[decoded.severity] : null;

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleCopy = useCallback(async () => {
    if (!decoded) return;
    try {
      await navigator.clipboard.writeText(buildSupportPayload(decoded, txHash));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be blocked in some browsers
    }
  }, [decoded, txHash]);

  return (
    <AnimatePresence>
      {isOpen && decoded && style && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* Modal */}
          <motion.div
            key="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="error-modal-title"
            aria-describedby="error-modal-desc"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={`fixed left-1/2 top-1/2 z-[71] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-[#0a0a0f]/95 backdrop-blur-2xl p-6 ${style.border} ${style.glow}`}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close error dialog"
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${style.border} bg-white/5`}
              >
                {style.icon}
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2
                    id="error-modal-title"
                    className="font-heading text-base font-semibold text-white"
                  >
                    {decoded.title}
                  </h2>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.badge}`}
                  >
                    {decoded.severity}
                  </span>
                </div>
                <p
                  id="error-modal-desc"
                  className="font-body mt-1 text-sm text-white/60 leading-relaxed"
                >
                  {decoded.description}
                </p>
              </div>
            </div>

            {/* Raw XDR value */}
            <div className="mb-4 rounded-xl border border-white/8 bg-white/[0.03] p-3">
              <p className="font-body mb-1.5 text-[10px] font-medium uppercase tracking-widest text-white/30">
                Raw Error Value
              </p>
              <p className="font-ticker break-all text-xs text-white/50">
                {String(decoded.raw)}
              </p>
            </div>

            {/* Tx hash */}
            {txHash && (
              <div className="mb-4 rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <p className="font-body mb-1.5 text-[10px] font-medium uppercase tracking-widest text-white/30">
                  Transaction Hash
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-ticker truncate text-xs text-white/50">
                    {txHash}
                  </p>
                  <a
                    href={`https://stellar.expert/explorer/public/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[#00f5ff]/70 hover:text-[#00f5ff] transition-colors"
                    aria-label="View on Stellar.Expert"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Docs link */}
            {decoded.docsUrl && (
              <a
                href={decoded.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 flex items-center gap-1.5 text-xs text-[#00f5ff]/70 hover:text-[#00f5ff] transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                View documentation for this error
              </a>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all duration-200 ${
                  copied
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied for Support
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Error for Support
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <Bug className="h-4 w-4" />
                Dismiss
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
