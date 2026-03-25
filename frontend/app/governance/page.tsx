"use client";

import { useState, useEffect, useRef } from "react";
import ProposalVoting from "@/components/governance/ProposalVoting";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProposalStatus = "active" | "urgent" | "passed" | "failed";
type ProposalCategory =
  | "Fee Structure"
  | "Pool Addition"
  | "Treasury"
  | "Security";
type VoteChoice = "for" | "against" | null;

interface Proposal {
  id: string;
  title: string;
  category: ProposalCategory;
  status: ProposalStatus;
  votesFor: number;
  votesAgainst: number;
  quorum: number;
  endsIn: string;
  proposer: string;
  description: string;
}

interface VotingStats {
  votingPower: number;
  stakedXLM: number;
  stakedSTRM: number;
  rank: string;
  proposalThreshold: number;
  participationRate: number;
}

interface PastVote {
  id: string;
  vote: "For" | "Against";
  outcome: "Passed" | "Failed";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PROPOSALS: Proposal[] = [
  {
    id: "SIP-047",
    title: "Reduce Protocol Fee from 0.3% to 0.25%",
    category: "Fee Structure",
    status: "active",
    votesFor: 2_847_392,
    votesAgainst: 891_204,
    quorum: 5_000_000,
    endsIn: "2d 14h",
    proposer: "0x3f...a91c",
    description:
      "Lower swap fees to increase competitive positioning against Uniswap v4 deployments on Stellar.",
  },
  {
    id: "SIP-046",
    title: "Add AQUA/XLM Pool with 0.1% Tier",
    category: "Pool Addition",
    status: "active",
    votesFor: 4_102_881,
    votesAgainst: 342_009,
    quorum: 5_000_000,
    endsIn: "5d 3h",
    proposer: "0x7b...22fd",
    description:
      "Introduce a new concentrated liquidity pool for the AQUA/XLM pair with a reduced fee tier.",
  },
  {
    id: "SIP-045",
    title: "Treasury Allocation: Dev Fund Q3 2025",
    category: "Treasury",
    status: "active",
    votesFor: 1_203_445,
    votesAgainst: 2_910_002,
    quorum: 5_000_000,
    endsIn: "1d 6h",
    proposer: "0xc2...88b3",
    description:
      "Allocate 150,000 STRM from protocol treasury to fund core development for Q3 2025.",
  },
  {
    id: "SIP-044",
    title: "Emergency: Pause USDC/STRM Pool",
    category: "Security",
    status: "urgent",
    votesFor: 4_891_002,
    votesAgainst: 98_441,
    quorum: 5_000_000,
    endsIn: "6h 22m",
    proposer: "0x9a...f03d",
    description:
      "Temporary emergency pause on USDC/STRM pool following oracle price deviation detected.",
  },
];

const USER_STATS: VotingStats = {
  votingPower: 184_500,
  stakedXLM: 120_000,
  stakedSTRM: 64_500,
  rank: "Council Elder",
  proposalThreshold: 100_000,
  participationRate: 87,
};

const PAST_VOTES: PastVote[] = [
  { id: "SIP-043", vote: "For", outcome: "Passed" },
  { id: "SIP-041", vote: "Against", outcome: "Failed" },
  { id: "SIP-039", vote: "For", outcome: "Passed" },
];

const PROTOCOL_STATS = [
  { label: "Active Proposals", value: "4" },
  { label: "Total Votes Cast", value: "16.3M" },
  { label: "Protocol TVL", value: "$84.2M" },
  { label: "STRM Price", value: "$2.41" },
];

const CATEGORY_STYLES: Record<ProposalCategory, { pill: string }> = {
  "Fee Structure": {
    pill: "bg-indigo-400/10 border-indigo-400/30 text-indigo-400",
  },
  "Pool Addition": {
    pill: "bg-emerald-400/10 border-emerald-400/30 text-emerald-400",
  },
  Treasury: { pill: "bg-amber-400/10 border-amber-400/30 text-amber-400" },
  Security: { pill: "bg-red-400/10 border-red-400/30 text-red-400" },
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

// ─── Seal of Governance SVG ───────────────────────────────────────────────────

function SealOfGovernance({
  canPropose,
  power,
}: {
  canPropose: boolean;
  power: number;
}) {
  const [rotation, setRotation] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!canPropose) return;
    let angle = 0;
    const animate = () => {
      angle += 0.18;
      setRotation(angle);
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [canPropose]);

  const progress = Math.min((power / USER_STATS.proposalThreshold) * 100, 100);
  const circumference = 2 * Math.PI * 60;
  const dash = (progress / 100) * circumference;
  const runeAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div className="relative flex items-center justify-center h-52">
      {canPropose && (
        <>
          <div className="absolute w-48 h-48 rounded-full bg-[radial-gradient(circle,rgba(138,0,255,0.15)_0%,transparent_70%)] animate-pulse" />
          <div className="absolute w-40 h-40 rounded-full border border-[#8a00ff]/30 animate-pulse" />
        </>
      )}
      <svg
        width={140}
        height={140}
        viewBox="0 0 140 140"
        style={{
          transform: `rotate(${rotation}deg)`,
          filter: canPropose
            ? "drop-shadow(0 0 18px rgba(138,0,255,0.7)) drop-shadow(0 0 36px rgba(138,0,255,0.35))"
            : "drop-shadow(0 0 4px rgba(138,0,255,0.2))",
        }}
        aria-label="Seal of Governance"
      >
        <circle
          cx={70}
          cy={70}
          r={66}
          fill="none"
          stroke={canPropose ? "#8a00ff" : "#2d0066"}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <circle
          cx={70}
          cy={70}
          r={60}
          fill="none"
          stroke={canPropose ? "#b84dff" : "#5b00b8"}
          strokeWidth={3}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          opacity={0.85}
        />
        <polygon
          points="70,18 101,29 122,56 122,84 101,111 70,122 39,111 18,84 18,56 39,29"
          fill="rgba(138,0,255,0.07)"
          stroke={canPropose ? "#8a00ff" : "#2d0066"}
          strokeWidth={1.5}
        />
        <polygon
          points="70,36 75,58 97,58 80,71 87,93 70,80 53,93 60,71 43,58 65,58"
          fill={canPropose ? "rgba(184,77,255,0.25)" : "rgba(91,0,184,0.1)"}
          stroke={canPropose ? "#c084fc" : "#5b00b8"}
          strokeWidth={1}
        />
        <circle
          cx={70}
          cy={70}
          r={6}
          fill={canPropose ? "#b84dff" : "#5b00b8"}
        />
        {runeAngles.map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <circle
              key={i}
              cx={70 + 52 * Math.cos(rad)}
              cy={70 + 52 * Math.sin(rad)}
              r={2.5}
              fill={canPropose ? "#8a00ff" : "#2d0066"}
              opacity={canPropose ? 0.9 : 0.4}
            />
          );
        })}
        <defs>
          <path id="councilArc" d="M 20,70 A 50,50 0 0,1 120,70" />
        </defs>
        <text
          fontSize={7.5}
          fill={canPropose ? "#c084fc" : "#5b00b8"}
          letterSpacing={2.5}
        >
          <textPath href="#councilArc" startOffset="8%">
            COUNCIL · OF · FLOW
          </textPath>
        </text>
      </svg>
      <p
        className={`absolute bottom-0 font-ticker text-[10px] tracking-[0.18em] uppercase ${canPropose ? "text-[#b84dff]" : "text-[#5b00b8]"}`}
      >
        {canPropose
          ? "⬡ Proposal Rights Active"
          : `${Math.round(progress)}% to Proposal Rights`}
      </p>
    </div>
  );
}

// ─── Proposal Card ────────────────────────────────────────────────────────────

function ProposalCard({
  proposal,
  index,
  onClick,
}: {
  proposal: Proposal;
  index: number;
  onClick: () => void;
}) {
  const [voted, setVoted] = useState<VoteChoice>(null);

  const total = proposal.votesFor + proposal.votesAgainst;
  const forPct = (proposal.votesFor / total) * 100;
  const quorumPct = Math.min((total / proposal.quorum) * 100, 100);
  const catStyle = CATEGORY_STYLES[proposal.category];
  const isUrgent = proposal.status === "urgent";

  return (
    <div
      className="group rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 transition-all duration-300 hover:bg-white/[0.07] hover:border-[#8a00ff]/30 hover:shadow-[0_8px_40px_rgba(138,0,255,0.12)] cursor-pointer"
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={onClick}
    >
      {/* Top row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-ticker text-[10px] tracking-[0.18em] text-white/30 uppercase">
            {proposal.id}
          </span>
          <span
            className={`font-ticker text-[10px] px-2.5 py-0.5 rounded-full border ${catStyle.pill}`}
          >
            {proposal.category}
          </span>
          {isUrgent && (
            <span className="font-ticker text-[10px] px-2.5 py-0.5 rounded-full border border-red-400/40 bg-red-400/10 text-red-400 animate-pulse">
              ⚡ URGENT
            </span>
          )}
        </div>
        <span className="font-ticker text-[10px] text-white/30 whitespace-nowrap">
          {proposal.endsIn} left
        </span>
      </div>

      {/* Title */}
      <h3 className="font-heading text-lg font-bold text-white/90 mb-2 leading-snug">
        {proposal.title}
      </h3>

      {/* Description – visible on hover */}
      <p className="font-body text-xs text-white/40 leading-relaxed mb-4 max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-300">
        {proposal.description}
      </p>

      {/* Vote bar */}
      <div className="mb-3">
        <div className="h-1.5 rounded-full bg-red-400/15 overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${forPct}%`,
              background: "linear-gradient(90deg, #8a00ff, #b84dff)",
            }}
          />
        </div>
        <div className="flex justify-between">
          <span className="font-ticker text-[10px] text-[#b84dff]">
            For {forPct.toFixed(1)}% ·{" "}
            {(proposal.votesFor / 1_000_000).toFixed(2)}M
          </span>
          <span className="font-ticker text-[10px] text-red-400">
            {(proposal.votesAgainst / 1_000_000).toFixed(2)}M ·{" "}
            {(100 - forPct).toFixed(1)}% Against
          </span>
        </div>
      </div>

      {/* Quorum */}
      <div className="mb-5">
        <div className="flex justify-between mb-1">
          <span className="font-ticker text-[10px] text-white/25 uppercase tracking-widest">
            Quorum
          </span>
          <span
            className={`font-ticker text-[10px] ${quorumPct >= 100 ? "text-emerald-400" : "text-white/25"}`}
          >
            {quorumPct.toFixed(0)}%{quorumPct >= 100 ? " ✓ Reached" : ""}
          </span>
        </div>
        <div className="h-0.5 rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${quorumPct}%`,
              background: quorumPct >= 100 ? "#34d399" : "rgba(138,0,255,0.5)",
            }}
          />
        </div>
      </div>

      {/* Vote buttons – stop propagation so clicking them doesn't open the modal */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {(
          [
            {
              label: "Vote For",
              val: "for" as const,
              active: "border-[#8a00ff]/50 bg-[#8a00ff]/15 text-[#b84dff]",
            },
            {
              label: "Vote Against",
              val: "against" as const,
              active: "border-red-400/40 bg-red-400/10 text-red-400",
            },
          ] as const
        ).map(({ label, val, active }) => (
          <button
            key={val}
            onClick={() => setVoted(voted === val ? null : val)}
            className={`flex-1 py-2 rounded-xl border font-body text-xs tracking-wide transition-all duration-200 ${
              voted === val
                ? active
                : "border-white/10 bg-white/[0.03] text-white/30 hover:border-[#8a00ff]/30 hover:text-white/60"
            }`}
          >
            {voted === val ? "✓ " : ""}
            {label}
          </button>
        ))}
      </div>

      {/* Click hint */}
      <p className="font-ticker text-[10px] text-white/20 mt-3 flex justify-between">
        <span>Proposed by {proposal.proposer}</span>
        <span className="text-[#8a00ff]/50 group-hover:text-[#b84dff] transition-colors duration-200">
          Click to vote →
        </span>
      </p>
    </div>
  );
}

// ─── Voting Power Panel ───────────────────────────────────────────────────────

function VotingPowerPanel() {
  const canPropose = USER_STATS.votingPower >= USER_STATS.proposalThreshold;

  return (
    <div
      className={`rounded-3xl border backdrop-blur-xl p-6 relative overflow-hidden transition-all duration-500 ${canPropose ? "border-[#8a00ff]/40 bg-[#8a00ff]/[0.06] shadow-[0_0_40px_rgba(138,0,255,0.15)]" : "border-white/10 bg-white/[0.04]"}`}
    >
      {canPropose && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(138,0,255,0.1)_0%,transparent_60%)] pointer-events-none" />
      )}
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <span className="font-ticker text-[10px] tracking-[0.2em] text-white/30 uppercase">
            Voting Power
          </span>
          <span className="font-ticker text-[10px] px-2.5 py-0.5 rounded-full border border-[#8a00ff]/30 bg-[#8a00ff]/10 text-[#b84dff]">
            {USER_STATS.rank}
          </span>
        </div>
        <div className="mb-1">
          <span className="font-heading text-4xl font-bold text-white">
            {fmt(USER_STATS.votingPower)}
          </span>
          <span className="font-ticker text-sm text-white/30 ml-2">VP</span>
        </div>
        <SealOfGovernance
          canPropose={canPropose}
          power={USER_STATS.votingPower}
        />
        <div className="space-y-3 mt-2">
          {[
            {
              label: "Staked XLM",
              value: USER_STATS.stakedXLM,
              color: "#00f5ff",
            },
            {
              label: "Staked STRM",
              value: USER_STATS.stakedSTRM,
              color: "#b84dff",
            },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between mb-1.5">
                <span className="font-ticker text-[10px] text-white/30 uppercase tracking-widest">
                  {label}
                </span>
                <span className="font-ticker text-[10px]" style={{ color }}>
                  {fmt(value)}
                </span>
              </div>
              <div className="h-0.5 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(value / USER_STATS.votingPower) * 100}%`,
                    background: `linear-gradient(90deg, ${color}55, ${color})`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 p-3.5 rounded-2xl border border-[#8a00ff]/20 bg-[#8a00ff]/[0.07]">
          <div className="flex justify-between items-center">
            <span className="font-ticker text-[10px] text-white/30 uppercase tracking-widest">
              Participation Rate
            </span>
            <span className="font-heading text-xl font-bold text-[#b84dff]">
              {USER_STATS.participationRate}%
            </span>
          </div>
          <div className="h-0.5 rounded-full bg-white/[0.06] mt-2">
            <div
              className="h-full rounded-full"
              style={{
                width: `${USER_STATS.participationRate}%`,
                background: "linear-gradient(90deg, #8a00ff, #b84dff)",
              }}
            />
          </div>
        </div>
        <button
          disabled={!canPropose}
          className={`w-full mt-4 py-3 rounded-xl font-body text-xs tracking-[0.15em] uppercase font-semibold transition-all duration-300 ${
            canPropose
              ? "bg-gradient-to-r from-[#8a00ff] to-[#b84dff] text-white shadow-[0_4px_24px_rgba(138,0,255,0.4)] hover:shadow-[0_4px_36px_rgba(138,0,255,0.65)] cursor-pointer"
              : "bg-white/[0.04] border border-white/10 text-white/20 cursor-not-allowed"
          }`}
        >
          {canPropose
            ? "⬡ Create Proposal"
            : `Need ${fmt(USER_STATS.proposalThreshold - USER_STATS.votingPower)} more VP`}
        </button>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 rounded-3xl border border-white/10 bg-white/[0.04] overflow-hidden mb-8">
      {PROTOCOL_STATS.map((stat, i) => (
        <div
          key={stat.label}
          className={`px-5 py-4 ${i < PROTOCOL_STATS.length - 1 ? "border-r border-white/[0.06]" : ""}`}
        >
          <p className="font-ticker text-[10px] tracking-widest text-white/30 uppercase mb-1">
            {stat.label}
          </p>
          <p className="font-heading text-2xl font-bold text-white">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Voting Modal ─────────────────────────────────────────────────────────────

function VotingModal({ onClose }: { onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(8px)",
        padding: "24px",
        animation: "fadeInOverlay 0.2s ease both",
      }}
    >
      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpModal  { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* Modal container — stop clicks bubbling to overlay */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 540,
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 24,
          animation: "slideUpModal 0.25s cubic-bezier(.34,1.2,.64,1) both",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 10,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        <ProposalVoting />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterType = "all" | ProposalCategory;

export default function GovernanceHubPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);

  const filters: FilterType[] = [
    "all",
    "Fee Structure",
    "Pool Addition",
    "Treasury",
    "Security",
  ];
  const filtered =
    filter === "all"
      ? PROPOSALS
      : PROPOSALS.filter((p) => p.category === filter);

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-4">
      {/* ── Page Header ── */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">
              Protocol Governance
            </p>
            <h1 className="font-heading mt-2 text-3xl md:text-5xl liquid-chrome">
              The Council of Flow
            </h1>
            <p className="font-body mt-3 text-white/60 max-w-lg text-sm leading-relaxed">
              Shape the protocol. Vote on parameter changes, allocate treasury
              funds, and guide the future of StellarStream.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 pt-1">
            <div className="rounded-xl border border-[#8a00ff]/30 bg-[#8a00ff]/10 px-4 py-2 flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b84dff] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#b84dff]" />
              </span>
              <span className="font-ticker text-[10px] tracking-widest text-[#b84dff] uppercase">
                4 Active
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <StatsBar />

      {/* ── Bento Grid ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px] items-start">
        {/* LEFT – Proposals */}
        <div>
          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`font-ticker text-[10px] px-3 py-1.5 rounded-xl border uppercase tracking-wider transition-all duration-200 ${
                  filter === f
                    ? "border-[#8a00ff]/50 bg-[#8a00ff]/15 text-[#b84dff]"
                    : "border-white/10 bg-white/[0.03] text-white/30 hover:border-white/20 hover:text-white/60"
                }`}
              >
                {f === "all" ? "All Proposals" : f}
              </button>
            ))}
          </div>

          {/* Proposal list */}
          <div className="space-y-4">
            {filtered.map((p, i) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                index={i}
                onClick={() => setSelectedProposal(p.id)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center">
                <p className="font-body text-sm text-white/30">
                  No proposals in this category.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT – Voting Power + Side panels */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <VotingPowerPanel />

          {/* Delegate */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
            <p className="font-ticker text-[10px] tracking-[0.2em] text-white/30 uppercase mb-3">
              Delegation
            </p>
            <p className="font-body text-xs text-white/40 mb-3 leading-relaxed">
              No active delegation. Delegate your voting power to a trusted
              council member.
            </p>
            <button className="w-full py-2.5 rounded-xl border border-white/10 bg-white/[0.03] font-body text-xs tracking-wider text-white/30 hover:border-[#8a00ff]/30 hover:text-[#b84dff] transition-all duration-200">
              ⬡ Delegate Power
            </button>
          </div>

          {/* Past votes */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
            <p className="font-ticker text-[10px] tracking-[0.2em] text-white/30 uppercase mb-4">
              Recent Votes
            </p>
            <div className="divide-y divide-white/[0.04]">
              {PAST_VOTES.map(({ id, vote, outcome }) => (
                <div
                  key={id}
                  className="flex items-center justify-between py-2.5"
                >
                  <span className="font-ticker text-xs text-white/40">
                    {id}
                  </span>
                  <span
                    className={`font-ticker text-[10px] ${vote === "For" ? "text-[#b84dff]" : "text-red-400"}`}
                  >
                    {vote}
                  </span>
                  <span
                    className={`font-ticker text-[10px] ${outcome === "Passed" ? "text-emerald-400" : "text-white/25"}`}
                  >
                    {outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Voting Modal ── */}
      {selectedProposal && (
        <VotingModal onClose={() => setSelectedProposal(null)} />
      )}
    </div>
  );
}
