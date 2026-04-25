"use client";

/**
 * ConflictStateCard — Issue #1016
 * Shown in the Multi-Sig queue when at least one signer has rejected a proposal.
 * Displays who rejected, their reason note (if provided), and a "Restart Proposal"
 * action that wipes all signatures so the proposal can be re-signed from scratch.
 */

import { useState } from "react";
import { AlertTriangle, RotateCcw, MessageSquare, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { PendingStream } from "@/lib/use-pending-streams";

interface ConflictStateCardProps {
    stream: PendingStream;
    signedCount: number;
    isRestarting: boolean;
    onRestart: () => void;
}

function timeAgo(d: Date): string {
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
}

export function ConflictStateCard({ stream, signedCount, isRestarting, onRestart }: ConflictStateCardProps) {
    const [confirmed, setConfirmed] = useState(false);

    const rejectors = stream.signers.filter((s) => s.status === "rejected");
    const signers = stream.signers;

    const handleRestart = () => {
        if (!confirmed) {
            setConfirmed(true);
            return;
        }
        setConfirmed(false);
        onRestart();
    };

    return (
        <div className="relative rounded-2xl border border-red-500/40 bg-red-500/[0.04] backdrop-blur-xl p-5 space-y-4">
            {/* Top accent line */}
            <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-red-300">Signature Conflict</p>
                        <p className="text-xs text-white/40">
                            {rejectors.length} rejection{rejectors.length !== 1 ? "s" : ""} · {signedCount} of {stream.requiredSignatures} required signatures
                        </p>
                    </div>
                </div>
                <span className="font-mono text-[11px] text-white/30 bg-white/[0.04] border border-white/10 rounded px-1.5 py-0.5">
                    {stream.streamId}
                </span>
            </div>

            {/* Resolution path */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60 leading-relaxed">
                <span className="font-semibold text-white/80">Path to resolution: </span>
                All existing signatures are invalidated by a rejection. Use{" "}
                <span className="text-red-300 font-semibold">Restart Proposal</span> to wipe all signatures
                and allow signers to re-evaluate the updated proposal.
            </div>

            {/* Signer breakdown */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                {signers.map((signer, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                            {signer.status === "signed" && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                            {signer.status === "rejected" && <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                            {signer.status === "pending" && <Clock className="h-3.5 w-3.5 text-white/25 shrink-0" />}
                            <span className={`font-mono truncate ${
                                signer.address === stream.currentUserAddress ? "text-cyan-400/80" : "text-white/50"
                            }`}>
                                {signer.address}
                                {signer.address === stream.currentUserAddress && (
                                    <span className="ml-1.5 text-[9px] tracking-widest uppercase text-cyan-400/50">you</span>
                                )}
                            </span>
                        </div>
                        <span className={`shrink-0 ${
                            signer.status === "signed" ? "text-cyan-400/60" :
                            signer.status === "rejected" ? "text-red-400/80" : "text-white/25"
                        }`}>
                            {signer.status === "signed" && signer.signedAt ? timeAgo(signer.signedAt) :
                             signer.status === "rejected" ? "rejected" : "awaiting"}
                        </span>
                    </div>
                ))}
            </div>

            {/* Rejection reason notes */}
            {rejectors.some((r) => r.rejectionNote) && (
                <div className="space-y-2">
                    {rejectors.filter((r) => r.rejectionNote).map((r, i) => (
                        <div key={i} className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400/80">
                                <MessageSquare className="h-3 w-3" />
                                Rejection note · {r.address}
                            </div>
                            <p className="text-xs text-red-200/80 leading-relaxed">{r.rejectionNote}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Restart action */}
            <button
                type="button"
                onClick={handleRestart}
                disabled={isRestarting}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                    confirmed
                        ? "bg-red-500 text-white hover:bg-red-400 shadow-[0_0_20px_rgba(239,68,68,0.35)]"
                        : "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                <RotateCcw className={`h-4 w-4 ${isRestarting ? "animate-spin" : ""}`} />
                {isRestarting ? "Restarting…" : confirmed ? "Confirm — wipe all signatures" : "Restart Proposal"}
            </button>
            {confirmed && (
                <p className="text-center text-[11px] text-red-400/70">
                    This will clear all {signedCount} existing signature{signedCount !== 1 ? "s" : ""}. Click again to confirm.
                </p>
            )}
        </div>
    );
}
