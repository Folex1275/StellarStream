"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import {
  type GovernanceProposal,
  type VoteChoice,
  type VotingPowerSnapshot,
  fetchGovernanceProposals,
  fetchVotingPower,
  voteOnProposal,
} from "@/lib/governance-client";

function shortAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function fmtNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function fmtBigintString(value: string): string {
  const asBigInt = BigInt(value || "0");
  return asBigInt.toLocaleString("en-US");
}

function getSupportRatio(proposal: GovernanceProposal): number {
  const total = proposal.votesFor + proposal.votesAgainst;
  if (total <= 0) return 0;
  return (proposal.votesFor / total) * 100;
}

export default function GovernancePage() {
  const { isConnected, address } = useWallet();

  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [votingPower, setVotingPower] = useState<VotingPowerSnapshot | null>(
    null,
  );
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [loadingPower, setLoadingPower] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingProposalId, setPendingProposalId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    const loadProposals = async () => {
      setLoadingProposals(true);
      setError(null);
      try {
        const next = await fetchGovernanceProposals();
        if (!cancelled) {
          setProposals(next);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load proposals",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProposals(false);
        }
      }
    };

    loadProposals();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadVotingPower = async () => {
      if (!address) {
        setVotingPower(null);
        return;
      }

      setLoadingPower(true);
      try {
        const next = await fetchVotingPower(address);
        if (!cancelled) {
          setVotingPower(next);
        }
      } catch {
        if (!cancelled) {
          setVotingPower(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingPower(false);
        }
      }
    };

    loadVotingPower();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const activeCount = proposals.length;
  const totalVotes = useMemo(
    () =>
      proposals.reduce(
        (sum, proposal) => sum + proposal.votesFor + proposal.votesAgainst,
        0,
      ),
    [proposals],
  );

  const handleVote = async (proposalId: string, vote: VoteChoice) => {
    if (!address) {
      setError("Connect your wallet to vote.");
      return;
    }

    setPendingProposalId(proposalId);
    setError(null);

    try {
      await voteOnProposal(proposalId, address, vote);

      setProposals((current) =>
        current.map((proposal) => {
          if (proposal.id !== proposalId) return proposal;
          return {
            ...proposal,
            votesFor:
              vote === "yes" ? proposal.votesFor + 1 : proposal.votesFor,
            votesAgainst:
              vote === "no" ? proposal.votesAgainst + 1 : proposal.votesAgainst,
          };
        }),
      );
    } catch (voteError) {
      setError(
        voteError instanceof Error
          ? voteError.message
          : "Vote transaction failed",
      );
    } finally {
      setPendingProposalId(null);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-4">
      <section className="rounded-3xl border border-white/10 bg-white/4 backdrop-blur-xl p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">
              Nebula DAO
            </p>
            <h1 className="font-heading mt-2 text-3xl md:text-5xl liquid-chrome">
              Voting Portal
            </h1>
            <p className="font-body mt-3 text-white/60 max-w-xl text-sm leading-relaxed">
              Review active proposals from AccessControl governance state and
              cast your Yes/No vote.
            </p>
          </div>
          <div className="flex gap-2 shrink-0 pt-1">
            <div className="rounded-xl border border-[#8a00ff]/30 bg-[#8a00ff]/10 px-4 py-2 flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b84dff] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#b84dff]" />
              </span>
              <span className="font-ticker text-[10px] tracking-widest text-[#b84dff] uppercase">
                {activeCount} Active
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
          <p className="font-ticker text-[10px] uppercase tracking-wider text-white/40">
            Active Proposals
          </p>
          <p className="mt-2 font-heading text-2xl text-white">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
          <p className="font-ticker text-[10px] uppercase tracking-wider text-white/40">
            Total Votes
          </p>
          <p className="mt-2 font-heading text-2xl text-white">
            {fmtNumber(totalVotes)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
          <p className="font-ticker text-[10px] uppercase tracking-wider text-white/40">
            Voting Power
          </p>
          <p className="mt-2 font-heading text-2xl text-white">
            {loadingPower
              ? "…"
              : votingPower
                ? fmtBigintString(votingPower.votingPower)
                : "-"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/3 p-4">
          <p className="font-ticker text-[10px] uppercase tracking-wider text-white/40">
            Active Stream Volume
          </p>
          <p className="mt-2 font-heading text-2xl text-white">
            {loadingPower
              ? "…"
              : votingPower
                ? fmtBigintString(votingPower.activeStreamingVolume)
                : "-"}
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!isConnected && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Connect your wallet to calculate personal voting power and submit
          votes.
        </div>
      )}

      <section className="space-y-3">
        {loadingProposals && (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5 text-white/60 text-sm">
            Loading proposals...
          </div>
        )}

        {!loadingProposals && proposals.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5 text-white/60 text-sm">
            No active proposals found.
          </div>
        )}

        {proposals.map((proposal) => {
          const supportRatio = getSupportRatio(proposal);
          const total = proposal.votesFor + proposal.votesAgainst;
          const isSubmitting = pendingProposalId === proposal.id;

          return (
            <article
              key={proposal.id}
              className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-xl p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-ticker text-[10px] uppercase tracking-[0.2em] text-white/35">
                    Proposal {proposal.id}
                  </p>
                  <h2 className="font-heading text-xl text-white mt-1">
                    {proposal.description || "Untitled proposal"}
                  </h2>
                  <p className="mt-2 text-xs text-white/45 font-body">
                    Creator: {shortAddress(proposal.creator)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5">
                  <span className="font-ticker text-[10px] tracking-wider uppercase text-emerald-300">
                    Active
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/2 px-3 py-2">
                  <p className="text-white/40 text-[11px] uppercase tracking-wide">
                    Votes For
                  </p>
                  <p className="text-emerald-300 font-medium mt-1">
                    {fmtNumber(proposal.votesFor)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/2 px-3 py-2">
                  <p className="text-white/40 text-[11px] uppercase tracking-wide">
                    Votes Against
                  </p>
                  <p className="text-red-300 font-medium mt-1">
                    {fmtNumber(proposal.votesAgainst)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/2 px-3 py-2">
                  <p className="text-white/40 text-[11px] uppercase tracking-wide">
                    Quorum
                  </p>
                  <p className="text-white font-medium mt-1">
                    {fmtNumber(proposal.quorum)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-emerald-400 to-cyan-300"
                    style={{ width: `${Math.min(100, supportRatio)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-white/45">
                  {supportRatio.toFixed(1)}% support • {fmtNumber(total)} votes
                  cast
                </p>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  disabled={!isConnected || isSubmitting}
                  onClick={() => handleVote(proposal.id, "yes")}
                  className="flex-1 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-sm font-medium text-emerald-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Vote Yes"}
                </button>
                <button
                  disabled={!isConnected || isSubmitting}
                  onClick={() => handleVote(proposal.id, "no")}
                  className="flex-1 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-2.5 text-sm font-medium text-red-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Vote No"}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
