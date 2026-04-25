"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, AlertCircle, CheckCircle2, Loader2, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useGovernanceProposalFetcher, type GovernanceProposal } from "@/lib/hooks/use-governance-proposal-fetcher";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoadProposalDataButtonProps {
  onProposalLoaded: (recipients: Array<{ address: string; percentage: number }>) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function LoadProposalDataButton({
  onProposalLoaded,
  onError,
  disabled = false,
}: LoadProposalDataButtonProps) {
  const { proposals, loading, error, fetchApprovedProposals, loadProposalData, formatProposal } =
    useGovernanceProposalFetcher();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<GovernanceProposal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Fetch proposals on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && proposals.length === 0 && !loading) {
      fetchApprovedProposals();
    }
  }, [isOpen, proposals.length, loading, fetchApprovedProposals]);

  // ── Handle proposal selection ──────────────────────────────────────────────
  const handleSelectProposal = async (proposal: GovernanceProposal) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await loadProposalData(proposal.id);
      if (!result) {
        throw new Error("Failed to load proposal data");
      }

      // Call the parent callback with recipient data
      onProposalLoaded(result.recipients);
      
      // Close dropdown and reset
      setIsOpen(false);
      setSelectedProposal(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setLoadError(errorMsg);
      onError?.(errorMsg);
      console.error("[LoadProposalDataButton]", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const hasError = error || loadError;
  const formattedProposals = proposals.map((p) => ({
    ...p,
    formatted: formatProposal(p),
  }));

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/[0.08] hover:bg-cyan-400/[0.12] disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-2 transition-all duration-200"
        title="Load recipient list from an approved governance proposal"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
        ) : (
          <Download className="h-4 w-4 text-cyan-400" />
        )}
        <span className="text-xs font-semibold text-cyan-300">
          {isLoading ? "Loading..." : "Load Proposal"}
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 text-cyan-400/60 transition-transform"
          style={{ transform: isOpen ? "rotateZ(180deg)" : "rotateZ(0deg)" }}
        />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-full right-0 mt-2 w-80 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-xl z-50 overflow-hidden"
          >
            {/* Loading state */}
            {loading && proposals.length === 0 && (
              <div className="flex items-center justify-center gap-2 px-4 py-6">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                <span className="text-xs text-white/60">Fetching approved proposals…</span>
              </div>
            )}

            {/* Error state */}
            {hasError && proposals.length === 0 && (
              <div className="space-y-2 px-4 py-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-300">Failed to load proposals</p>
                    <p className="text-xs text-red-200/70">{hasError}</p>
                  </div>
                </div>
                <button
                  onClick={() => fetchApprovedProposals()}
                  className="w-full rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && proposals.length === 0 && !hasError && (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-white/40">No approved proposals found</p>
              </div>
            )}

            {/* Proposals list */}
            {!loading && proposals.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                {formattedProposals.map((proposal, idx) => (
                  <motion.button
                    key={proposal.id}
                    onClick={() => handleSelectProposal(proposal)}
                    disabled={isLoading}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/[0.08] transition-colors disabled:opacity-50 border-b border-white/[0.05] last:border-0"
                  >
                    {/* Status icon */}
                    <div className="mt-1 flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-white">
                        {proposal.formatted.title}
                      </p>
                      <p className="text-xs text-white/50 mt-0.5">
                        {proposal.formatted.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded px-1.5 py-0.5">
                          {proposal.formatted.recipients} recipients
                        </span>
                        <span className="text-[10px] text-white/40">
                          {proposal.formatted.created}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronDown className="h-4 w-4 text-white/30 -rotate-90 flex-shrink-0 mt-1" />
                  </motion.button>
                ))}
              </div>
            )}

            {/* Footer info */}
            <div className="border-t border-white/[0.05] px-4 py-2.5 bg-white/[0.02]">
              <p className="text-[10px] text-white/40">
                Select a proposal to auto-fill the recipient grid
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error tooltip */}
      {loadError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 top-full mt-2 rounded-lg border border-red-400/30 bg-red-400/[0.08] px-3 py-2 text-xs text-red-300 whitespace-nowrap"
        >
          {loadError}
        </motion.div>
      )}
    </div>
  );
}
