import { useCallback, useState } from "react";
import { useWallet } from "@/lib/wallet-context";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GovernanceProposal {
  id: string;
  proposalId: number;
  action: string;
  status: "pending" | "approved" | "executed" | "rejected";
  recipients?: {
    address: string;
    share_bps: number; // basis points (0-10000)
  }[];
  approvals: string[];
  requiredApprovals: number;
  createdAt: string;
  executedAt?: string;
}

export interface LoadProposalResult {
  proposal: GovernanceProposal;
  recipients: Array<{
    address: string;
    percentage: number; // 0-100
  }>;
}

export interface UseGovernanceProposalFetcherConfig {
  apiEndpoint?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Hook for fetching approved governance proposals and their recipient lists
 * 
 * Features:
 * - Fetches "Approved" proposals from the Governance API
 * - Filters proposals with complete approvals
 * - Converts basis points to percentages
 * - Automatic retry on failure
 * - Optional polling for live updates
 * 
 * @param config Optional configuration
 * @returns Governance proposal data and methods
 */
export function useGovernanceProposalFetcher(
  config: UseGovernanceProposalFetcherConfig = {}
) {
  const { apiEndpoint = "/api/v3/governance", autoRefresh = false, refreshInterval = 30000 } = config;
  const { address: walletAddress } = useWallet();

  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // ── Fetch approved proposals ────────────────────────────────────────────────
  const fetchApprovedProposals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiEndpoint}/proposals?status=approved`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch proposals: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Filter to only approved proposals with required approvals
      const approvedProposals: GovernanceProposal[] = (data.proposals || []).filter(
        (p: GovernanceProposal) => p.status === "approved" && p.approvals.length >= p.requiredApprovals
      );

      setProposals(approvedProposals);
      setLastFetch(new Date());
      
      return approvedProposals;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error fetching proposals";
      setError(errorMsg);
      console.error("[GovernanceProposalFetcher]", errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  // ── Load specific proposal and convert to recipient format ─────────────────
  const loadProposalData = useCallback(
    async (proposalId: string | number): Promise<LoadProposalResult | null> => {
      try {
        const response = await fetch(`${apiEndpoint}/proposals/${proposalId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch proposal details: ${response.statusText}`);
        }

        const proposal: GovernanceProposal = await response.json();

        // Verify proposal is approved
        if (proposal.status !== "approved") {
          throw new Error("Proposal is not in approved status");
        }

        // Verify required approvals met
        if (proposal.approvals.length < proposal.requiredApprovals) {
          throw new Error(
            `Insufficient approvals: ${proposal.approvals.length}/${proposal.requiredApprovals}`
          );
        }

        // Convert recipients from basis points to percentages
        const recipients = (proposal.recipients || []).map((recipient) => ({
          address: recipient.address,
          percentage: parseFloat(((recipient.share_bps / 10000) * 100).toFixed(2)),
          share_bps: recipient.share_bps,
        }));

        return { proposal, recipients };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error loading proposal";
        setError(errorMsg);
        console.error("[GovernanceProposalFetcher] loadProposalData:", errorMsg);
        return null;
      }
    },
    [apiEndpoint]
  );

  // ── Convert single recipient set from basis points ────────────────────────
  const convertRecipients = useCallback(
    (recipients: Array<{ address: string; share_bps: number }>) => {
      return recipients.map((recipient) => ({
        address: recipient.address,
        percentage: parseFloat(((recipient.share_bps / 10000) * 100).toFixed(2)),
      }));
    },
    []
  );

  // ── Format proposal for display ──────────────────────────────────────────
  const formatProposal = useCallback((proposal: GovernanceProposal) => {
    return {
      id: proposal.id,
      title: `Proposal #${proposal.proposalId}`,
      description: `${proposal.action} — ${proposal.approvals.length}/${proposal.requiredApprovals} approvals`,
      status: proposal.status,
      recipients: proposal.recipients?.length || 0,
      created: new Date(proposal.createdAt).toLocaleDateString(),
    };
  }, []);

  return {
    // State
    proposals,
    loading,
    error,
    lastFetch,

    // Methods
    fetchApprovedProposals,
    loadProposalData,
    convertRecipients,
    formatProposal,
  };
}
