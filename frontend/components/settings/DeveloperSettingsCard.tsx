"use client";

import { useState } from "react";
import { Key, Copy, Eye, EyeOff, Trash2, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "@/lib/toast";

export function DeveloperSettingsCard() {
    const [apiKey, setApiKey] = useState<string | null>("sk_live_xray_8f92a4b1c3d5e6f7g8h9i0j1k2l3m4n5");
    const [showRevealModal, setShowRevealModal] = useState(false);
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [revokeConfirmText, setRevokeConfirmText] = useState("");
    const [isRevoking, setIsRevoking] = useState(false);

    const handleCopy = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
        toast.success({
            title: "Copied to clipboard",
            description: "API Key has been copied to your clipboard.",
        });
    };

    const handleGenerateKey = () => {
        // Mock generating a new key
        setApiKey(`sk_live_xray_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`);
        setShowRevealModal(true);
        toast.success({
            title: "API Key Generated",
            description: "A new X-Ray Backend API key has been generated.",
        });
    };

    const handleRevoke = async () => {
        if (revokeConfirmText !== "REVOKE") return;
        
        setIsRevoking(true);
        // Mock API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        setApiKey(null);
        setShowRevealModal(false);
        setShowRevokeModal(false);
        setRevokeConfirmText("");
        setIsRevoking(false);
        
        toast.success({
            title: "API Key Revoked",
            description: "The API key has been permanently revoked.",
        });
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-colors duration-300">
            <div className="p-5 space-y-5">
                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                            <Key size={18} className="text-[#00f5ff]/70" />
                        </div>
                        <div>
                            <h3 className="font-heading text-base text-white">Developer Settings</h3>
                            <p className="font-body text-xs text-white/40">
                                Manage API keys for X-Ray Backend integration
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="space-y-4">
                    {!apiKey ? (
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
                            <Key size={24} className="mx-auto text-white/20 mb-3" />
                            <p className="font-heading text-sm text-white mb-1">No Active API Key</p>
                            <p className="font-body text-xs text-white/40 mb-4 max-w-sm mx-auto">
                                Generate an API key to authenticate requests from your external services to the X-Ray Backend.
                            </p>
                            <button
                                onClick={handleGenerateKey}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#00f5ff] px-4 py-2 text-xs font-bold text-black hover:bg-[#00e0e8] hover:shadow-[0_0_16px_rgba(0,245,255,0.35)] active:scale-95 transition-all"
                            >
                                Generate New Key
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex flex-col gap-2">
                                <label className="font-body text-[11px] tracking-widest uppercase text-white/40">
                                    Active Secret Key
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-sm text-white/80">
                                        {"sk_live_xray_" + "•".repeat(32)}
                                    </div>
                                    <button
                                        onClick={() => setShowRevealModal(true)}
                                        className="flex h-[42px] px-4 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/80 font-bold hover:text-white hover:bg-white/[0.08] transition-all text-sm"
                                    >
                                        <Eye size={16} /> Reveal Key
                                    </button>
                                </div>
                                <p className="font-body text-[11px] text-white/30 flex items-center gap-1.5 mt-1">
                                    <AlertTriangle size={12} className="text-orange-400/70" />
                                    Never share this key or commit it to version control.
                                </p>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={() => setShowRevokeModal(true)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all"
                                >
                                    <Trash2 size={14} />
                                    Revoke Key
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Revoke Key Modal (Double Confirmation) ── */}
            {showRevokeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0a0a0a] shadow-2xl overflow-hidden">
                        <div className="h-1 w-full bg-gradient-to-r from-red-500/50 via-red-500 to-red-500/50" />
                        <div className="p-6 space-y-6">
                            <div className="flex gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                                    <ShieldAlert size={24} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-heading text-lg text-white">Revoke API Key</h3>
                                    <p className="font-body text-sm text-white/60 mt-1">
                                        This action is <strong className="text-red-400">irreversible</strong>. Any applications using this key will immediately lose access to the X-Ray Backend.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                <label className="font-body text-xs text-white/60">
                                    Type <strong className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">REVOKE</strong> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={revokeConfirmText}
                                    onChange={(e) => setRevokeConfirmText(e.target.value)}
                                    placeholder="REVOKE"
                                    className="w-full rounded-lg border border-red-500/30 bg-black/50 px-3 py-2.5 font-mono text-sm text-white focus:border-red-500 focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowRevokeModal(false);
                                        setRevokeConfirmText("");
                                    }}
                                    className="rounded-xl px-4 py-2 font-body text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                                    disabled={isRevoking}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRevoke}
                                    disabled={revokeConfirmText !== "REVOKE" || isRevoking}
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 font-body text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                                >
                                    {isRevoking ? "Revoking..." : "Confirm Revocation"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Reveal Key Modal ── */}
            {showRevealModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden">
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                                    <Key size={18} className="text-[#00f5ff]" />
                                </div>
                                <div>
                                    <h3 className="font-heading text-lg text-white">Your Secret API Key</h3>
                                    <p className="font-body text-xs text-white/60">
                                        Please copy this key and store it securely.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-xl border border-white/10 bg-black/50 p-4">
                                    <p className="font-mono text-sm text-white break-all text-center">
                                        {apiKey}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00f5ff] py-2.5 font-bold text-black hover:bg-[#00e0e8] transition-all"
                                    >
                                        <Copy size={16} />
                                        Copy to Clipboard
                                    </button>
                                    <button
                                        onClick={() => setShowRevealModal(false)}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 font-bold text-white hover:bg-white/10 transition-all"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
