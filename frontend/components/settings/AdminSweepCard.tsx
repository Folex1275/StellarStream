"use client";

import { useState, useEffect } from "react";
import { Coins, Loader2, RefreshCw, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { formatAmount, mockClient, OrphanBalance } from "@/lib/contracts/stellarstream";
import { toast } from "@/lib/toast";

// Stub: replace with real contract call
async function fetchOrphanBalances(): Promise<OrphanBalance[]> {
    return mockClient.getOrphanBalances();
}

export function AdminSweepCard() {
    const [balances, setBalances] = useState<OrphanBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSweeping, setIsSweeping] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadBalances = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchOrphanBalances();
            setBalances(data.filter(b => b.balance > 0n));
        } catch (e) {
            setError("Failed to fetch orphan balances");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBalances();
    }, []);

    const handleSweep = async () => {
        setIsSweeping(true);
        try {
            await mockClient.reclaimDust({ destination: "G_TREASURY_OR_CHARITY" });
            toast.success({
                title: "Sweep initiated",
                description: "Dust recovery transaction has been generated for signing.",
            });
            // In a real app, this would redirect to a signing flow or show an XDR
            window.location.href = "/dashboard/dust-recovery";
        } catch (e) {
            toast.error({
                title: "Sweep failed",
                description: "An error occurred while initiating the sweep.",
            });
        } finally {
            setIsSweeping(false);
        }
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-colors duration-300">
            <div className="p-5 space-y-5">
                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                            <Coins size={18} className="text-amber-400/70" />
                        </div>
                        <div>
                            <h3 className="font-heading text-base text-white">Admin Sweep</h3>
                            <p className="font-body text-xs text-white/40">
                                Reclaim unallocated "dust" from the contract
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={loadBalances}
                        disabled={loading}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* ── Content ── */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                            <Loader2 className="h-6 w-6 animate-spin text-[#00f5ff]/40" />
                            <p className="text-xs text-white/30 font-body">Scanning contract for orphan balances...</p>
                        </div>
                    ) : error ? (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
                            <AlertTriangle size={18} className="text-red-400 shrink-0" />
                            <p className="text-xs text-red-400/80 font-body">{error}</p>
                        </div>
                    ) : balances.length === 0 ? (
                        <div className="rounded-xl border border-white/5 bg-white/[0.01] p-8 text-center">
                            <CheckCircle2 size={24} className="mx-auto text-emerald-400/40 mb-3" />
                            <p className="font-heading text-sm text-white/60">No Dust Found</p>
                            <p className="font-body text-xs text-white/30 mt-1">All contract funds are properly allocated.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                                {balances.map((asset, i) => (
                                    <div 
                                        key={asset.assetCode} 
                                        className={`flex items-center justify-between p-3 ${i !== balances.length - 1 ? "border-b border-white/5" : ""}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center font-heading text-[10px] text-white/60">
                                                {asset.assetCode.slice(0, 3)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white">{asset.assetCode}</p>
                                                {asset.assetIssuer && (
                                                    <p className="text-[10px] text-white/30 font-mono">
                                                        {asset.assetIssuer.slice(0, 4)}...{asset.assetIssuer.slice(-4)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-mono font-bold text-amber-400">
                                                {formatAmount(asset.balance)}
                                            </p>
                                            <p className="text-[10px] text-white/30 uppercase tracking-widest">Available</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleSweep}
                                disabled={isSweeping}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-xs font-bold text-black hover:bg-amber-400 hover:shadow-[0_0_16px_rgba(245,158,11,0.35)] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSweeping ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Preparing Sweep...
                                    </>
                                ) : (
                                    <>
                                        Reclaim Dust
                                        <ArrowRight size={14} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
