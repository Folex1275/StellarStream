"use client";

import { useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    Clock,
    AlertTriangle,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Loader2,
    Users,
} from "lucide-react";
import { useDraftProposals, type DraftProposal } from "@/lib/use-draft-proposals";
import { DraftEditingIndicator } from "@/components/dashboard/DraftEditingIndicator";
import { Can } from "@/components/Can";
import { toast } from "@/lib/toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function timeUntil(iso: string): string {
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return "Expired";
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms / 60_000);
    const h = Math.floor(ms / 3_600_000);
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return "just now";
}

function shortenAddr(addr: string) {
    return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

// ─── RejectModal ──────────────────────────────────────────────────────────────

function RejectModal({
    proposal,
    onConfirm,
    onCancel,
    isSubmitting,
}: {
    proposal: DraftProposal;
    onConfirm: (comment: string) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}) {
    const [comment, setComment] = useState("");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0f] p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                        <XCircle size={18} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="font-heading text-base text-white">Reject Proposal</h3>
                        <p className="font-body text-xs text-white/40">{proposal.title}</p>
                    </div>
                </div>

                <p className="font-body text-sm text-white/50 mb-3">
                    Leave a comment for{" "}
                    <span className="font-mono text-white/70">{shortenAddr(proposal.drafter)}</span> explaining
                    why this proposal was rejected.
                </p>

                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="e.g. Amounts exceed Q2 budget cap. Please revise and resubmit."
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:border-red-500/40 transition-colors"
                />

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-sm text-white/60 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(comment)}
                        disabled={isSubmitting || !comment.trim()}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/80 py-2 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Sending…
                            </>
                        ) : (
                            "Reject & Notify"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── ProposalCard ─────────────────────────────────────────────────────────────

function ProposalCard({
    proposal,
    isRejecting,
    onReject,
    activeEditor,
    currentUserAddress,
}: {
    proposal: DraftProposal;
    isRejecting: boolean;
    onReject: (comment: string) => void;
    activeEditor?: string;
    currentUserAddress?: string | null;
}) {
    const [expanded, setExpanded] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    const expiresUrgent = new Date(proposal.expiresAt).getTime() - Date.now() < 1000 * 60 * 60 * 6;

    return (
        <>
            <div
                className={`rounded-2xl border backdrop-blur-xl transition-all duration-300 ${expiresUrgent
                    ? "border-orange-500/40 bg-orange-500/[0.03]"
                    : "border-white/10 bg-white/[0.03]"
                    }`}
            >
                {expiresUrgent && (
                    <div className="h-px w-full rounded-t-2xl bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
                )}

                {/* Card header */}
                <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-mono text-[11px] text-white/40 bg-white/[0.04] border border-white/10 rounded px-1.5 py-0.5">
                                    {proposal.id}
                                </span>
                                {expiresUrgent && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-orange-400 border border-orange-500/30 bg-orange-500/10 rounded-full px-2 py-0.5">
                                        <AlertTriangle size={9} />
                                        Urgent
                                    </span>
                                )}
                            </div>
                            <h3 className="font-heading text-lg text-white leading-tight">{proposal.title}</h3>
                            <p className="font-body text-xs text-white/40 mt-0.5">
                                Drafted by{" "}
                                <span className="font-mono text-white/60">{shortenAddr(proposal.drafter)}</span>
                                {" · "}
                                {timeAgo(proposal.createdAt)}
                            </p>
                        </div>

                        <div className="flex-shrink-0 text-right">
                            <p className="font-heading text-xl text-white">
                                {fmt(proposal.totalAmount)}{" "}
                                <span className="text-sm text-white/50">{proposal.token}</span>
                            </p>
                            <p className="font-body text-[11px] text-white/35 flex items-center justify-end gap-1 mt-0.5">
                                <Users size={10} />
                                {proposal.recipients.length} recipients
                            </p>
                        </div>
                    </div>

                    {/* Action row */}
                    <div className="flex items-center gap-2 mt-4">
                        {activeEditor && (
                            <DraftEditingIndicator
                                editorAddress={activeEditor}
                                currentUserAddress={currentUserAddress}
                            />
                        )}
                        <button
                            onClick={() => setExpanded((v) => !v)}
                            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/[0.07] transition-all"
                        >
                            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {expanded ? "Collapse" : "Expand"} Recipients
                        </button>

                        <div className="flex-1" />

                        <Can
                            permission="reject_proposal"
                            fallback={
                                <button disabled className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-bold text-white/20 cursor-not-allowed">
                                    <XCircle size={13} />
                                    Reject
                                </button>
                            }
                        >
                            <button
                                onClick={() => setShowRejectModal(true)}
                                disabled={isRejecting}
                                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <XCircle size={13} />
                                Reject
                            </button>
                        </Can>

                        <Can
                            permission="approve_proposal"
                            fallback={
                                <button disabled className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-1.5 text-xs font-bold text-white/25 cursor-not-allowed">
                                    <CheckCircle2 size={13} />
                                    Approve
                                </button>
                            }
                        >
                            <button
                                className="flex items-center gap-1.5 rounded-xl bg-[#00f5ff] px-4 py-1.5 text-xs font-bold text-black hover:bg-[#00e0e8] hover:shadow-[0_0_16px_rgba(0,245,255,0.35)] active:scale-95 transition-all"
                            >
                                <CheckCircle2 size={13} />
                                Approve
                            </button>
                        </Can>
                    </div>
                </div>

                {/* Expanded recipients */}
                {expanded && (
                    <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
                        <p className="font-body text-[11px] tracking-widest uppercase text-white/30 mb-3">
                            Split Breakdown
                        </p>
                        <div className="space-y-2">
                            {proposal.recipients.map((r, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-bold text-white/40">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-mono text-xs text-white/70">{r.address}</p>
                                            {r.note && (
                                                <p className="font-body text-[11px] text-white/35">{r.note}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-heading text-sm text-white">
                                            {fmt(r.amount)}{" "}
                                            <span className="text-xs text-white/40">{r.token}</span>
                                        </p>
                                        <p className="font-body text-[10px] text-white/30">
                                            {((r.amount / proposal.totalAmount) * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total row */}
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                            <span className="font-body text-xs text-white/50">Total</span>
                            <span className="font-heading text-sm text-white">
                                {fmt(proposal.totalAmount)}{" "}
                                <span className="text-xs text-white/50">{proposal.token}</span>
                            </span>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between px-5 pb-4 text-[11px] text-white/30">
                    <span>Created {timeAgo(proposal.createdAt)}</span>
                    <span
                        className={`flex items-center gap-1 ${expiresUrgent ? "text-orange-400/70" : ""}`}
                    >
                        <Clock size={10} />
                        Expires in {timeUntil(proposal.expiresAt)}
                    </span>
                </div>
            </div>

            {showRejectModal && (
                <RejectModal
                    proposal={proposal}
                    isSubmitting={isRejecting}
                    onCancel={() => setShowRejectModal(false)}
                    onConfirm={(comment) => {
                        onReject(comment);
                        setShowRejectModal(false);
                    }}
                />
            )}
        </>
    );
}

// ─── ApprovalInbox ────────────────────────────────────────────────────────────

export default function ApprovalInbox() {
    const { proposals, loading, error, rejectingIds, rejectProposal, refresh, activeEditors, connected } = useDraftProposals();
    // TODO: replace with real wallet address from useWallet() when integrating auth
    const currentUserAddress: string | null = null;

    const handleReject = async (proposal: DraftProposal, comment: string) => {
        try {
            await rejectProposal({ proposalId: proposal.id, comment });
            toast.success({
                title: "Proposal Rejected",
                description: `Drafter ${shortenAddr(proposal.drafter)} has been notified.`,
                duration: 5000,
            });
        } catch {
            toast.error({ title: "Rejection Failed", description: "Please try again.", duration: 5000 });
        }
    };

    return (
        <>
            {/* Page header */}
            <section className="col-span-full rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">
                            Treasury Manager
                        </p>
                        <h1 className="font-heading mt-2 text-3xl md:text-4xl">Approval Inbox</h1>
                        <p className="font-body mt-1 text-sm text-white/40 max-w-lg">
                            Draft splits awaiting your review. Expand each proposal to inspect the full
                            recipient breakdown before signing or rejecting.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
                            <p className="font-heading text-xl leading-none text-white">{proposals.length}</p>
                            <p className="font-body text-[10px] tracking-widest text-white/40 uppercase mt-0.5">
                                Pending
                            </p>
                        </div>
                        <button
                            onClick={refresh}
                            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/50 hover:text-white transition-colors"
                        >
                            <RefreshCw size={12} />
                            Refresh
                        </button>
                        <div
                            title={connected ? "Live sync active" : "Reconnecting…"}
                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs ${
                                connected
                                    ? "border-[#00f5ff]/20 bg-[#00f5ff]/[0.05] text-[#00f5ff]/70"
                                    : "border-white/10 bg-white/[0.04] text-white/30"
                            }`}
                        >
                            <span className={`relative flex h-1.5 w-1.5 ${connected ? "" : "opacity-40"}`}>
                                {connected && (
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00f5ff] opacity-60" />
                                )}
                                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${connected ? "bg-[#00f5ff]" : "bg-white/30"}`} />
                            </span>
                            {connected ? "Live" : "Offline"}
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            {loading ? (
                <div className="col-span-full flex items-center justify-center py-24">
                    <Loader2 size={28} className="animate-spin text-white/30" />
                </div>
            ) : error ? (
                <div className="col-span-full rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-6 text-center">
                    <p className="font-body text-sm text-red-400">{error}</p>
                    <button
                        onClick={refresh}
                        className="mt-3 text-xs text-white/40 hover:text-white underline"
                    >
                        Retry
                    </button>
                </div>
            ) : proposals.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                        <CheckCircle2 size={28} className="text-[#00f5ff]/50" />
                    </div>
                    <h3 className="font-heading text-lg text-white/70 mb-1">Inbox Clear</h3>
                    <p className="font-body text-sm text-white/35 max-w-xs">
                        No draft splits are waiting for your approval right now.
                    </p>
                </div>
            ) : (
                proposals.map((proposal) => (
                    <div key={proposal.id} className="col-span-full lg:col-span-6">
                        <ProposalCard
                            proposal={proposal}
                            isRejecting={rejectingIds.has(proposal.id)}
                            onReject={(comment) => handleReject(proposal, comment)}
                            activeEditor={activeEditors[proposal.id]}
                            currentUserAddress={currentUserAddress}
                        />
                    </div>
                ))
            )}
        </>
    );
}
