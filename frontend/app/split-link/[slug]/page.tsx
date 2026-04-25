"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import { OrganizationAvatar } from "@/components/organization-avatar";
import { QRStudio } from "@/components/qr-studio";

interface SplitLinkInfo {
    slug: string;
    orgName: string;
    totalSplitAmount: string;
    tokenSymbol: string;
    status: "Claim Pending" | "Paid Out" | "Processing" | "Awaiting Wallet";
    isClaimBased: boolean;
    trustScore: number;
    details: string;
    createdAt: string;
    stellarAddress: string;
    logoUrl?: string;
}

const statusStyles: Record<SplitLinkInfo["status"], string> = {
    "Claim Pending": "bg-amber-500/10 text-amber-300 border border-amber-400/20",
    "Paid Out": "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20",
    "Processing": "bg-sky-500/10 text-sky-300 border border-sky-400/20",
    "Awaiting Wallet": "bg-violet-500/10 text-violet-300 border border-violet-400/20",
};
export default function SplitLinkLandingPage() {
    const params = useParams();
    const { slug } = params as { slug?: string };
    const { openModal, isConnected } = useWallet();

    const [splitLink, setSplitLink] = useState<SplitLinkInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;

        setLoading(true);
        setError(null);
        fetch(`/api/v3/split-links/${encodeURIComponent(slug)}`)
            .then(async (res) => {
                if (!res.ok) {
                    const payload = await res.json().catch(() => ({}));
                    throw new Error(payload.error || `Failed to load split link (${res.status})`);
                }
                return res.json() as Promise<SplitLinkInfo>;
            })
            .then((data) => {
                setSplitLink(data);
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : "Unable to fetch split link.");
            })
            .finally(() => setLoading(false));
    }, [slug]);

    const trustBadgeClass = useMemo(() => {
        if (!splitLink) return "bg-white/5 text-white border border-white/10";
        if (splitLink.trustScore >= 85) return "bg-emerald-500/10 text-emerald-200 border border-emerald-400/30";
        if (splitLink.trustScore >= 65) return "bg-sky-500/10 text-sky-200 border border-sky-400/30";
        return "bg-amber-500/10 text-amber-200 border border-amber-400/30";
    }, [splitLink]);

    const statusClass = useMemo(() => {
        if (!splitLink) return "bg-white/10 text-white/80 border border-white/10";
        return statusStyles[splitLink.status];
    }, [splitLink]);

    const primaryButtonText = splitLink?.isClaimBased
        ? "Connect Wallet to Claim"
        : isConnected
            ? "View Your Wallet"
            : "Connect Wallet";

    const statusLabel = splitLink ? splitLink.status : "Loading status...";

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#030305] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,245,255,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(138,0,255,0.18),transparent_22%)]" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_18%)]" />
            <div className="relative z-10 max-w-6xl mx-auto px-4 py-20">
                <div className="glass-card border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] mx-auto max-w-3xl p-8 md:p-12">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex items-center gap-4">
                                {splitLink && (
                                    <OrganizationAvatar
                                        stellarAddress={splitLink.stellarAddress}
                                        size={48}
                                        className="rounded-xl border border-white/20 shadow-[0_0_16px_rgba(0,245,255,0.15)] hidden sm:block"
                                    />
                                )}
                                <div>
                                    <p className="text-sm uppercase tracking-[0.32em] text-white/50">Split Link</p>
                                    <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl flex items-center gap-3">
                                        {splitLink && (
                                            <OrganizationAvatar
                                                stellarAddress={splitLink.stellarAddress}
                                                size={32}
                                                className="rounded-lg sm:hidden border border-white/20"
                                            />
                                        )}
                                        {splitLink?.orgName ?? "Loading organization..."}
                                    </h1>
                                </div>
                            </div>
                            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${trustBadgeClass}`}>
                                <ShieldCheck className="h-4 w-4" />
                                Trust Score {splitLink?.trustScore ?? "--"}/100
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Total Split Amount</p>
                                <p className="mt-4 text-4xl font-black tracking-tight text-white">
                                    {splitLink?.totalSplitAmount ?? "—"}
                                </p>
                                <p className="mt-2 text-sm text-white/60">{splitLink?.tokenSymbol ?? "Asset"}</p>
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Status</p>
                                <div className={`mt-4 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${statusClass}`}>
                                    {statusLabel}
                                </div>
                                <p className="mt-3 text-sm leading-6 text-white/60">
                                    {splitLink?.details ?? "Fetching status details…"}
                                </p>
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                                <p className="text-xs uppercase tracking-[0.3em] text-white/40">Split ID</p>
                                <p className="mt-4 break-all text-base font-semibold text-white/90">{slug ?? "—"}</p>
                                <p className="mt-3 text-sm text-white/60">
                                    This is your reference link for the public split status page.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
                            {loading ? (
                                <div className="flex items-center justify-center gap-3 py-12 text-sm text-white/70">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Loading split status…
                                </div>
                            ) : error ? (
                                <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-200">
                                    {error}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-white/50">Payment details</p>
                                            <p className="mt-1 text-lg font-semibold text-white/90">
                                                {splitLink?.isClaimBased ? "Claim-based payment" : "Standard payout"}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={openModal}
                                            className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                                        >
                                            {primaryButtonText}
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                                            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Created</p>
                                            <p className="mt-3 text-sm font-semibold text-white/90">
                                                {new Date(splitLink?.createdAt ?? "").toLocaleDateString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </div>
                                        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                                            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Recipient action</p>
                                            <p className="mt-3 text-sm font-semibold text-white/90">
                                                {splitLink?.isClaimBased
                                                    ? "Requires wallet connection to claim"
                                                    : "Monitored by StellarStream"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* QR Studio — only shown once the split link has loaded */}
                    {splitLink && slug && (
                        <QRStudio
                            url={`${typeof window !== "undefined" ? window.location.origin : "https://stellarstream.app"}/split-link/${slug}`}
                            logoUrl={splitLink.logoUrl}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
