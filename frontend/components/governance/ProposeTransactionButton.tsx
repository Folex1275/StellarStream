"use client";

// components/governance/ProposeTransactionButton.tsx
// Issue #679 — Quorum-Check Pre-Submission Logic

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import { useQuorumCheck } from "@/lib/hooks/use-quorum-check";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProposeTransactionButtonProps {
  /** Description of the transaction being proposed */
  transactionDescription: string;
  /** Action type (e.g., "SPLIT_BULK_DISPATCH", "STREAM_CREATE") */
  action: string;
  /** The encoded transaction XDR to propose */
  txData: string;
  /** Called when proposal is successfully created */
  onProposalCreated?: (proposalId: string) => void;
  /** Custom className for the button */
  className?: string;
  /** Label for the execute button (when sufficient weight) */
  executeLabel?: string;
  /** Label for the propose button (when insufficient weight) */
  proposeLabel?: string;
}

interface ProposalApiResponse {
  success: boolean;
  proposal: {
    id: string;
    creator: string;
    description: string;
    action: string;
    txData: string;
    signers: string[];
    requiredSignatures: number;
    status: string;
    createdAt: string;
  };
}

interface ProposalErrorResponse {
  success: boolean;
  error: string;
}

// ─── API ────────────────────────────────────────────────────────────────────

const BACKEND_API_BASE =
  process.env.NEXT_PUBLIC_NEBULA_WARP_INDEXER_URL ??
  process.env.NEXT_PUBLIC_BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

/**
 * Submit a new transaction proposal to the governance backend
 */
async function createProposal(
  creator: string,
  description: string,
  action: string,
  txData: string
): Promise<ProposalApiResponse> {
  const response = await fetch(`${BACKEND_API_BASE}/governance/proposals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      creator,
      description,
      action,
      txData,
      // Get signers from account - in a real implementation this would fetch from the account
      signers: [creator],
      requiredSignatures: 1,
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ProposalErrorResponse;
    throw new Error(errorData.error ?? "Failed to create proposal");
  }

  return (await response.json()) as ProposalApiResponse;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ProposeTransactionButton({
  transactionDescription,
  action,
  txData,
  onProposalCreated,
  className = "",
  executeLabel = "Execute Transaction",
  proposeLabel = "Propose Transaction",
}: ProposeTransactionButtonProps) {
  const { address, isConnected } = useWallet();
  const quorum = useQuorumCheck();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle proposal creation
  const handlePropose = async () => {
    if (!address || !isConnected || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createProposal(
        address,
        transactionDescription,
        action,
        txData
      );

      if (result.success && result.proposal) {
        setProposalId(result.proposal.id);
        onProposalCreated?.(result.proposal.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to propose transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not connected state
  if (!isConnected || !address) {
    return (
      <button
        disabled
        className={`w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/30 cursor-not-allowed ${className}`}
      >
        Connect Wallet to Continue
      </button>
    );
  }

  // Loading state while checking quorum
  if (quorum.isLoading) {
    return (
      <button
        disabled
        className={`w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/50 flex items-center justify-center gap-2 cursor-wait ${className}`}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking permissions...
      </button>
    );
  }

  // Error state
  if (quorum.error) {
    return (
      <div className="space-y-2">
        <button
          disabled
          className={`w-full rounded-xl border border-red-400/30 bg-red-400/10 py-3 text-sm font-medium text-red-300 flex items-center justify-center gap-2 cursor-not-allowed ${className}`}
        >
          <AlertCircle className="h-4 w-4" />
          Error checking permissions
        </button>
        <p className="text-xs text-red-400/70 px-1">{quorum.error}</p>
      </div>
    );
  }

  // Success - user has sufficient weight
  if (quorum.canExecute) {
    return (
      <button
        className={`w-full rounded-xl border border-emerald-400/30 bg-emerald-400/10 py-3 text-sm font-medium text-emerald-300 transition-all hover:bg-emerald-400/20 hover:border-emerald-400/50 ${className}`}
      >
        {executeLabel}
      </button>
    );
  }

  // Insufficient weight - show propose button
  return (
    <div className="space-y-2">
      <AnimatePresence mode="wait">
        {proposalId ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full rounded-xl border border-emerald-400/30 bg-emerald-400/10 py-3 text-sm font-medium text-emerald-300 flex items-center justify-center gap-2 ${className}`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Proposal Submitted
          </motion.div>
        ) : isSubmitting ? (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`w-full rounded-xl border border-amber-400/30 bg-amber-400/10 py-3 text-sm font-medium text-amber-300 flex items-center justify-center gap-2 cursor-wait ${className}`}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating Proposal...
          </motion.div>
        ) : (
          <motion.div key="propose" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={handlePropose}
              className={`w-full rounded-xl border border-[#8a00ff]/30 bg-[#8a00ff]/10 py-3 text-sm font-medium text-[#c084fc] transition-all hover:bg-[#8a00ff]/20 hover:border-[#8a00ff]/50 ${className}`}
            >
              <span className="flex items-center justify-center gap-2">
                <ShieldPlus className="h-4 w-4" />
                {proposeLabel}
              </span>
            </button>

            {/* Informational message */}
            <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-white/50">
                Your account weight ({quorum.userWeight}) is below the required threshold ({quorum.threshold}). 
                This transaction must be proposed to the multi-sig queue for approval.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400/70 px-1">{error}</p>
      )}

      {/* Proposal ID display */}
      {proposalId && (
        <p className="text-xs text-white/40 px-1 font-mono">
          Proposal ID: {proposalId}
        </p>
      )}
    </div>
  );
}

// ─── Quorum Display (for debugging/info) ───────────────────────────────────

interface QuorumInfoBadgeProps {
  compact?: boolean;
}

export function QuorumInfoBadge({ compact = false }: QuorumInfoBadgeProps) {
  const { isConnected } = useWallet();
  const quorum = useQuorumCheck();

  if (!isConnected || quorum.isLoading || quorum.error) {
    return null;
  }

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${
          quorum.canExecute
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
            : "border-amber-400/30 bg-amber-400/10 text-amber-400"
        }`}
      >
        {quorum.canExecute ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <ShieldPlus className="h-3 w-3" />
        )}
        {quorum.userWeight}/{quorum.threshold}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/50">Signing Weight</span>
        <span className="text-white font-medium">{quorum.userWeight}</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/50">Required Threshold</span>
        <span className="text-white font-medium">{quorum.threshold}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white/50">Status</span>
        <span
          className={
            quorum.canExecute ? "text-emerald-400" : "text-amber-400"
          }
        >
          {quorum.canExecute ? "Can Execute" : "Needs Proposal"}
        </span>
      </div>
    </div>
  );
}
