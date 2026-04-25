"use client";

/**
 * AuditTrailVisualizer
 * Issue #1004 — Visualize the Hash-Chained Audit Logs.
 *
 * Renders a vertical "chain" timeline. Each node is a log entry link.
 * A local SHA-256 check produces a green shield (verified) or red cross (tampered).
 * Connecting lines are green when the link is verified, red when broken.
 */

import { useEffect, useMemo, useState } from "react";
import {
    ShieldCheck,
    ShieldAlert,
    Link2,
    ExternalLink,
    Loader2,
    Clock,
    Database,
    AlertTriangle,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import {
    verifyAuditChain,
    type AuditLogEntry,
    type ChainVerificationResult,
} from "@/lib/audit-hash-chain";
import { motion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditTrailVisualizerProps {
    /** API endpoint to fetch raw audit-log entries from */
    apiUrl?: string;
    /** Limit number of entries fetched */
    limit?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncateHash(hash: string, start = 6, end = 6): string {
    if (hash.length <= start + end + 3) return hash;
    return `${hash.slice(0, start)}…${hash.slice(-end)}`;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString();
}

function getEventColor(type: string): string {
    switch (type) {
        case "create":
            return "text-emerald-400";
        case "withdraw":
            return "text-orange-400";
        case "cancel":
            return "text-rose-400";
        default:
            return "text-white/40";
    }
}

function getEventBg(type: string): string {
    switch (type) {
        case "create":
            return "bg-emerald-400/10 border-emerald-400/20";
        case "withdraw":
            return "bg-orange-400/10 border-orange-400/20";
        case "cancel":
            return "bg-rose-400/10 border-rose-400/20";
        default:
            return "bg-white/5 border-white/10";
    }
}

function getEventLabel(type: string): string {
    switch (type) {
        case "create":
            return "Stream Created";
        case "withdraw":
            return "Withdrawal";
        case "cancel":
            return "Cancellation";
        default:
            return type.charAt(0).toUpperCase() + type.slice(1);
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AuditTrailVisualizer({
    apiUrl = "/api/audit-log",
    limit = 100,
}: AuditTrailVisualizerProps) {
    const [entries, setEntries] = useState<AuditLogEntry[]>([]);
    const [verification, setVerification] = useState<ChainVerificationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch audit log entries (ascending chronological order)
    const fetchEntries = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${apiUrl}?limit=${limit}`);
            if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Unknown error");
            // Sort oldest → newest (chronological order for chain verification)
            const sorted = (data.events as AuditLogEntry[]).sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            setEntries(sorted);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, [apiUrl, limit]);

    // Run local chain verification whenever entries change
    useEffect(() => {
        if (entries.length === 0) return;
        verifyAuditChain(entries).then(setVerification);
    }, [entries]);

    // ── Render states ──────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                <p className="text-sm text-white/40">Fetching audit log…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-6 text-center">
                <AlertTriangle className="mx-auto h-6 w-6 text-rose-400 mb-2" />
                <p className="text-sm text-rose-300">{error}</p>
                <button
                    onClick={fetchEntries}
                    className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 underline"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="py-20 text-center text-white/30 text-sm">
                <Database className="mx-auto h-8 w-8 mb-3 opacity-40" />
                No audit log entries found.
            </div>
        );
    }

    // ── Summary banner ─────────────────────────────────────────────────────────

    const summary = verification
        ? {
            total: verification.totalEntries,
            verified: verification.verifiedCount,
            broken: verification.brokenCount,
            intact: verification.isIntact,
        }
        : { total: entries.length, verified: 0, broken: 0, intact: false };

    return (
        <div className="space-y-6">
            {/* Top summary banner */}
            <div
                className={`rounded-2xl border p-5 transition-colors ${summary.intact
                    ? "border-emerald-400/20 bg-emerald-400/[0.05]"
                    : "border-rose-400/20 bg-rose-400/[0.05]"
                    }`}
            >
                <div className="flex items-center gap-3 mb-3">
                    {summary.intact ? (
                        <ShieldCheck className="h-6 w-6 text-emerald-400" />
                    ) : (
                        <ShieldAlert className="h-6 w-6 text-rose-400" />
                    )}
                    <div>
                        <h3 className="text-sm font-bold text-white/90">
                            {summary.intact ? "Chain Intact" : "Chain Broken"}
                        </h3>
                        <p className="text-[11px] text-white/40">
                            Local SHA-256 verification performed in-browser
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <SummaryPill
                        label="Entries"
                        value={String(summary.total)}
                        icon={<Database className="h-3.5 w-3.5" />}
                    />
                    <SummaryPill
                        label="Verified"
                        value={String(summary.verified)}
                        icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                        highlight="emerald"
                    />
                    <SummaryPill
                        label="Tampered"
                        value={String(summary.broken)}
                        icon={<XCircle className="h-3.5 w-3.5 text-rose-400" />}
                        highlight={summary.broken > 0 ? "rose" : undefined}
                    />
                </div>
                {verification && (
                    <p className="mt-3 text-[10px] text-white/20 font-mono">
                        Verified at {new Date(verification.verifiedAt).toLocaleString()}
                    </p>
                )}
            </div>

            {/* Vertical chain timeline */}
            <div className="relative pl-6">
                {/* Vertical connector line */}
                <div className="absolute left-[11px] top-0 bottom-0 w-px bg-white/10" />

                <div className="space-y-6">
                    {verification?.links.map((link, idx) => {
                        const isLast = idx === verification.links.length - 1;
                        const isBroken = !link.isValid && link.entry.entryHash;
                        const isNeutral = !link.entry.entryHash;

                        return (
                            <motion.div
                                key={link.entry.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03, duration: 0.25 }}
                                className="relative"
                            >
                                {/* Node dot on the vertical line */}
                                <div
                                    className={`absolute -left-[17px] top-3 h-3 w-3 rounded-full border-2 ${isBroken
                                        ? "border-rose-400 bg-rose-400/20"
                                        : isNeutral
                                            ? "border-white/20 bg-white/5"
                                            : "border-emerald-400 bg-emerald-400/20"
                                        }`}
                                />

                                {/* Connector segment color */}
                                {!isLast && (
                                    <div
                                        className={`absolute -left-[17px] top-6 h-[calc(100%+1.5rem)] w-px ${isBroken ? "bg-rose-400/30" : "bg-emerald-400/20"
                                            }`}
                                        style={{ left: "11px" }}
                                    />
                                )}

                                {/* Link card */}
                                <div
                                    className={`rounded-xl border p-4 transition-all hover:bg-white/[0.02] ${isBroken
                                        ? "border-rose-400/20 bg-rose-400/[0.03]"
                                        : getEventBg(link.entry.eventType)
                                        }`}
                                >
                                    {/* Header row */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {/* Verification icon */}
                                            <div className="shrink-0" title={isNeutral ? "No hash stored" : isBroken ? "Tampered" : "Verified"}>
                                                {isNeutral ? (
                                                    <Clock className="h-4 w-4 text-white/30" />
                                                ) : isBroken ? (
                                                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                                                ) : (
                                                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-semibold ${getEventColor(link.entry.eventType)}`}>
                                                    {getEventLabel(link.entry.eventType)}
                                                </p>
                                                <p className="text-[10px] text-white/30 tabular-nums">
                                                    {formatDate(link.entry.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <a
                                            href={`https://stellar.expert/explorer/public/tx/${link.entry.txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-cyan-400/70 hover:bg-cyan-400/10 transition-colors"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Explorer
                                        </a>
                                    </div>

                                    {/* Details grid */}
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <DetailRow label="Stream ID" value={link.entry.streamId} />
                                        <DetailRow
                                            label="TX Hash"
                                            value={truncateHash(link.entry.txHash)}
                                            mono
                                        />
                                        <DetailRow label="Ledger" value={String(link.entry.ledger)} />
                                        <DetailRow
                                            label="Amount"
                                            value={
                                                link.entry.amount
                                                    ? `${(Number(link.entry.amount) / 10_000_000).toLocaleString()} XLM`
                                                    : "—"
                                            }
                                        />
                                        <DetailRow
                                            label="Sender"
                                            value={link.entry.sender ? truncateHash(link.entry.sender, 4, 4) : "—"}
                                            mono
                                        />
                                        <DetailRow
                                            label="Receiver"
                                            value={link.entry.receiver ? truncateHash(link.entry.receiver, 4, 4) : "—"}
                                            mono
                                        />
                                    </div>

                                    {/* Hash display */}
                                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                                        <HashRow
                                            label="Entry Hash"
                                            hash={link.entry.entryHash}
                                            isValid={link.isValid}
                                            isNeutral={isNeutral}
                                        />
                                        {link.entry.parentHash && (
                                            <HashRow
                                                label="Parent Hash"
                                                hash={link.entry.parentHash}
                                                isValid={true}
                                                dim
                                            />
                                        )}
                                        {isBroken && (
                                            <div className="flex items-center gap-2 mt-1 rounded-md bg-rose-400/10 px-2 py-1">
                                                <AlertTriangle className="h-3 w-3 text-rose-400" />
                                                <span className="text-[10px] text-rose-300 font-mono">
                                                    Expected: {truncateHash(link.expectedHash, 8, 8)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryPill({
    label,
    value,
    icon,
    highlight,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    highlight?: "emerald" | "rose";
}) {
    return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-white/30">{icon}</span>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
            </div>
            <p
                className={`text-lg font-bold tabular-nums ${highlight === "emerald"
                    ? "text-emerald-400"
                    : highlight === "rose"
                        ? "text-rose-400"
                        : "text-white/70"
                    }`}
            >
                {value}
            </p>
        </div>
    );
}

function DetailRow({
    label,
    value,
    mono,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-center justify-between rounded-md bg-white/[0.02] px-2 py-1">
            <span className="text-white/30">{label}</span>
            <span className={`text-white/60 ${mono ? "font-mono" : ""}`}>{value}</span>
        </div>
    );
}

function HashRow({
    label,
    hash,
    isValid,
    isNeutral,
    dim,
}: {
    label: string;
    hash: string | null;
    isValid: boolean;
    isNeutral?: boolean;
    dim?: boolean;
}) {
    return (
        <div className="flex items-center gap-2">
            <span className={`text-[10px] text-white/20 w-20 shrink-0 ${dim ? "opacity-60" : ""}`}>
                {label}
            </span>
            <span
                className={`text-[10px] font-mono truncate ${isNeutral
                    ? "text-white/20"
                    : isValid
                        ? "text-emerald-400/60"
                        : "text-rose-400/60"
                    }`}
            >
                {hash ?? "—"}
            </span>
        </div>
    );
}

