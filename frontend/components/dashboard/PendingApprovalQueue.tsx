"use client";

import { useState, useMemo } from "react";
import { Clock, CheckCircle2, XCircle, Pen, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { usePendingStreams, type PendingStream, type Signer } from "@/lib/use-pending-streams";
import { toast } from "@/lib/toast";
import { ConflictStateCard } from "./ConflictStateCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, d = 2) =>
    n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function timeUntil(date: Date): string {
    const ms = date.getTime() - Date.now();
    if (ms <= 0) return "Expired";
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function timeAgo(date: Date): string {
    const ms = Date.now() - date.getTime();
    const m = Math.floor(ms / 60_000);
    const h = Math.floor(ms / 3_600_000);
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return "just now";
}

function shortenAddr(addr: string) {
    return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

// ─── SignatureProgress ────────────────────────────────────────────────────────

function SignaturePips({
    signers,
    required,
}: {
    signers: Signer[];
    required: number;
}) {
    return (
        <div className="flex items-center gap-1.5">
            {signers.map((signer, i) => {
                const isSigned = signer.status === "signed";
                const isRejected = signer.status === "rejected";
                return (
                    <div
                        key={i}
                        title={`${shortenAddr(signer.address)}: ${signer.status}`}
                        className={`relative flex h-6 w-6 items-center justify-center rounded-full border text-[10px] transition-all duration-500 ${isSigned
                                ? "border-[#00f5ff]/60 bg-[#00f5ff]/20 text-[#00f5ff]"
                                : isRejected
                                    ? "border-red-500/60 bg-red-500/10 text-red-400"
                                    : "border-white/15 bg-white/[0.04] text-white/30"
                            }`}
                    >
                        {isSigned ? (
                            <CheckCircle2 size={12} />
                        ) : isRejected ? (
                            <XCircle size={12} />
                        ) : (
                            <span className="font-mono font-bold">{i + 1}</span>
                        )}
                        {isSigned && (
                            <span
                                className="absolute inset-0 rounded-full border border-[#00f5ff]/40 animate-ping opacity-50"
                                style={{ animationDuration: `${2 + i * 0.4}s` }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── PendingStreamCard ────────────────────────────────────────────────────────

function PendingStreamCard({
    stream,
    isSigning,
    onSign,
    signedCount,
}: {
    stream: PendingStream;
    isSigning: boolean;
    onSign: () => void;
    signedCount: number;
}) {
    const progress = (signedCount / stream.requiredSignatures) * 100;
    const isFullySigned = signedCount >= stream.requiredSignatures;
    const expiresUrgent =
        stream.expiresAt.getTime() - Date.now() < 1000 * 60 * 60 * 6; // < 6h

    return (
        <div
            className={`relative rounded-2xl border backdrop-blur-xl p-5 transition-all duration-300 hover:bg-white/[0.05] ${isFullySigned
                    ? "border-[#00f5ff]/50 bg-[#00f5ff]/[0.04]"
                    : expiresUrgent
                        ? "border-orange-500/40 bg-orange-500/[0.03]"
                        : "border-white/10 bg-white/[0.03]"
                }`}
        >
            {/* Urgency indicator */}
            {expiresUrgent && !isFullySigned && (
                <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
            )}

            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-[11px] text-white/40 bg-white/[0.04] border border-white/10 rounded px-1.5 py-0.5">
                            {stream.streamId}
                        </span>
                        {expiresUrgent && !isFullySigned && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-orange-400 border border-orange-500/30 bg-orange-500/10 rounded-full px-2 py-0.5">
                                <AlertTriangle size={9} />
                                Urgent
                            </span>
                        )}
                        {isFullySigned && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-[#00f5ff] border border-[#00f5ff]/30 bg-[#00f5ff]/10 rounded-full px-2 py-0.5">
                                <CheckCircle2 size={9} />
                                Ready
                            </span>
                        )}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="font-heading text-xl text-white">
                            {fmt(stream.amount)} {stream.token}
                        </span>
                        <span className="font-body text-xs text-white/40">
                            → {shortenAddr(stream.recipient)}
                        </span>
                    </div>
                    <p className="font-body text-xs text-white/35 mt-0.5">
                        {fmt(stream.ratePerSecond, 5)} {stream.token}/sec · {stream.duration}d stream
                    </p>
                </div>

                {/* Sign Now button */}
                {!stream.hasCurrentUserSigned && !isFullySigned && (
                    <button
                        onClick={onSign}
                        disabled={isSigning}
                        className={`flex-shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 ${isSigning
                                ? "bg-white/10 text-white/40 cursor-not-allowed"
                                : "bg-[#00f5ff] text-black hover:bg-[#00e0e8] hover:shadow-[0_0_20px_rgba(0,245,255,0.4)] active:scale-95"
                            }`}
                    >
                        {isSigning ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Signing…
                            </>
                        ) : (
                            <>
                                <Pen size={14} />
                                Sign Now
                            </>
                        )}
                    </button>
                )}

                {stream.hasCurrentUserSigned && !isFullySigned && (
                    <div className="flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 border border-[#00f5ff]/20 bg-[#00f5ff]/5 text-xs text-[#00f5ff]/70">
                        <CheckCircle2 size={13} />
                        Signed
                    </div>
                )}
            </div>

            {/* Signature progress */}
            <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-body text-xs text-white/50">
                        Signatures:{" "}
                        <span className="font-bold text-white/80">
                            {signedCount} of {stream.requiredSignatures}
                        </span>
                    </span>
                    <SignaturePips signers={stream.signers} required={stream.requiredSignatures} />
                </div>

                {/* Progress bar */}
                <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${progress}%`,
                            background:
                                isFullySigned
                                    ? "linear-gradient(90deg, #00f5ff, #8a00ff)"
                                    : "linear-gradient(90deg, #00f5ff80, #00f5ff)",
                            boxShadow: isFullySigned ? "0 0 10px rgba(0,245,255,0.5)" : undefined,
                        }}
                    />
                </div>
            </div>

            {/* Signers detail */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1.5 mb-3">
                {stream.signers.map((signer, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <div
                                className={`h-1.5 w-1.5 rounded-full ${signer.status === "signed"
                                        ? "bg-[#00f5ff]"
                                        : signer.status === "rejected"
                                            ? "bg-red-400"
                                            : "bg-white/20"
                                    }`}
                            />
                            <span
                                className={`font-mono ${signer.address === stream.currentUserAddress
                                        ? "text-[#00f5ff]/80"
                                        : "text-white/40"
                                    }`}
                            >
                                {signer.address}
                                {signer.address === stream.currentUserAddress && (
                                    <span className="ml-1.5 text-[9px] tracking-widest uppercase text-[#00f5ff]/50">
                                        you
                                    </span>
                                )}
                            </span>
                        </div>
                        <span
                            className={`${signer.status === "signed"
                                    ? "text-[#00f5ff]/60"
                                    : signer.status === "rejected"
                                        ? "text-red-400/60"
                                        : "text-white/25"
                                }`}
                        >
                            {signer.status === "signed" && signer.signedAt
                                ? timeAgo(signer.signedAt)
                                : signer.status === "rejected"
                                    ? "rejected"
                                    : "awaiting"}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between text-[11px] text-white/30">
                <span>Created {timeAgo(stream.createdAt)}</span>
                <span
                    className={`flex items-center gap-1 ${expiresUrgent && !isFullySigned ? "text-orange-400/70" : ""
                        }`}
                >
                    <Clock size={10} />
                    Expires in {timeUntil(stream.expiresAt)}
                </span>
            </div>
        </div>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <CheckCircle2 size={28} className="text-[#00f5ff]/50" />
            </div>
            <h3 className="font-heading text-lg text-white/70 mb-1">No Pending Approvals</h3>
            <p className="font-body text-sm text-white/35 max-w-xs">
                All multi-sig streams are fully signed. New requests will appear here automatically.
            </p>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PendingApprovalQueue() {
    const { streams, signingIds, lastRefreshed, signStream, signedCount, restartProposal } = usePendingStreams();
    const [filter, setFilter] = useState<"all" | "mine" | "ready" | "conflict">("all");
    const [restartingIds, setRestartingIds] = useState<Set<string>>(new Set());

    const filtered = useMemo(() => {
        return streams.filter((s) => {
            const hasConflict = s.signers.some((sg) => sg.status === "rejected");
            if (filter === "conflict") return hasConflict;
            if (filter === "mine") return !s.hasCurrentUserSigned && !hasConflict;
            if (filter === "ready") return signedCount(s) >= s.requiredSignatures - 1 && !hasConflict;
            return true;
        });
    }, [streams, filter, signedCount]);

    const awaitingMySignature = streams.filter((s) => !s.hasCurrentUserSigned).length;
    const conflictCount = streams.filter((s) => s.signers.some((sg) => sg.status === "rejected")).length;

    const handleRestart = async (stream: PendingStream) => {
        setRestartingIds((prev) => new Set(prev).add(stream.id));
        try {
            restartProposal(stream.id);
            toast.success({ title: "Proposal Restarted", description: `All signatures for ${stream.streamId} have been cleared.`, duration: 5000 });
        } catch {
            toast.error({ title: "Restart Failed", description: "Please try again.", duration: 5000 });
        } finally {
            setRestartingIds((prev) => { const n = new Set(prev); n.delete(stream.id); return n; });
        }
    };

    const handleSign = async (stream: PendingStream) => {
        try {
            const { txHash } = await signStream(stream.id);
            toast.success({
                title: "Signature Submitted",
                description: `Approved stream ${stream.streamId}`,
                txHash,
                duration: 6000,
            });
        } catch (err) {
            toast.error({
                title: "Signature Failed",
                description: err instanceof Error ? err.message : "Unknown error",
                duration: 6000,
            });
        }
    };

    return (
        <>
            {/* ── Page Header ── */}
            <section className="col-span-full rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">
                                Multi-Sig
                            </p>
                            {awaitingMySignature > 0 && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00f5ff]/30 bg-[#00f5ff]/10 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-[#00f5ff] uppercase">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00f5ff] opacity-75" />
                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#00f5ff]" />
                                    </span>
                                    {awaitingMySignature} Action{awaitingMySignature !== 1 ? "s" : ""} Required
                                </span>
                            )}
                        </div>
                        <h1 className="font-heading mt-2 text-3xl md:text-4xl">Pending Approvals</h1>
                        <p className="font-body mt-1 text-sm text-white/40 max-w-lg">
                            Streams awaiting multi-signature approval before activation. Sign to advance
                            each request toward the required threshold.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Stats pills */}
                        <div className="flex gap-2">
                            {[
                                { label: "Total", value: streams.length },
                                { label: "Need Sig", value: awaitingMySignature, accent: true },
                                { label: "Conflict", value: conflictCount, danger: true },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className={`rounded-xl border px-3 py-2 text-center ${
                                        stat.danger && stat.value > 0
                                            ? "border-red-500/30 bg-red-500/[0.06]"
                                            : stat.accent && stat.value > 0
                                                ? "border-[#00f5ff]/30 bg-[#00f5ff]/[0.06]"
                                                : "border-white/10 bg-white/[0.04]"
                                    }`}
                                >
                                    <p className={`font-heading text-xl leading-none ${
                                        stat.danger && stat.value > 0 ? "text-red-400" :
                                        stat.accent && stat.value > 0 ? "text-[#00f5ff]" : "text-white"
                                    }`}>
                                        {stat.value}
                                    </p>
                                    <p className="font-body text-[10px] tracking-widest text-white/40 uppercase mt-0.5">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div
                            className="flex items-center gap-1.5 text-[11px] text-white/30"
                            title={`Last refreshed: ${lastRefreshed.toLocaleTimeString()}`}
                        >
                            <RefreshCw size={10} className="animate-spin" style={{ animationDuration: "4s" }} />
                            Live
                        </div>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="mt-5 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 w-fit">
                    {(
                        [
                            { key: "all", label: "All Pending" },
                            { key: "mine", label: "My Signature" },
                            { key: "ready", label: "Almost Ready" },
                            { key: "conflict", label: `Conflicts${conflictCount > 0 ? ` (${conflictCount})` : ""}` },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`rounded-lg px-4 py-1.5 text-sm font-body transition-all duration-200 ${filter === tab.key
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-white/40 hover:text-white/70"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Stream Cards ── */}
            {filtered.length === 0 ? (
                <div className="col-span-full rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl min-h-[300px] flex items-center">
                    <EmptyState />
                </div>
            ) : (
                filtered.map((stream) => {
                    const hasConflict = stream.signers.some((sg) => sg.status === "rejected");
                    return (
                        <div key={stream.id} className="col-span-full lg:col-span-6">
                            {hasConflict ? (
                                <ConflictStateCard
                                    stream={stream}
                                    signedCount={signedCount(stream)}
                                    isRestarting={restartingIds.has(stream.id)}
                                    onRestart={() => handleRestart(stream)}
                                />
                            ) : (
                                <PendingStreamCard
                                    stream={stream}
                                    isSigning={signingIds.has(stream.id)}
                                    onSign={() => handleSign(stream)}
                                    signedCount={signedCount(stream)}
                                />
                            )}
                        </div>
                    );
                })
            )}
        </>
    );
}