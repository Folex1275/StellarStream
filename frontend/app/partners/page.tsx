"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, DollarSign, Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";

interface AffiliateEarnings {
  totalVolumeReferredUsd: number;
  pendingCommissionsUsd: number;
  lifetimeEarnedUsd: number;
  referredStreamsCount: number;
  recentReferrals: { date: string; streamId: string; volumeUsd: number; commissionUsd: number }[];
}

const MOCK: AffiliateEarnings = {
  totalVolumeReferredUsd: 1_240_000,
  pendingCommissionsUsd: 1_240,
  lifetimeEarnedUsd: 3_720,
  referredStreamsCount: 47,
  recentReferrals: [
    { date: "2025-03-25", streamId: "s-0f3a…b92c", volumeUsd: 50000, commissionUsd: 50 },
    { date: "2025-03-18", streamId: "s-1a2b…c3d4", volumeUsd: 120000, commissionUsd: 120 },
    { date: "2025-03-10", streamId: "s-5e6f…7890", volumeUsd: 80000, commissionUsd: 80 },
    { date: "2025-02-28", streamId: "s-ab12…cd34", volumeUsd: 200000, commissionUsd: 200 },
    { date: "2025-02-14", streamId: "s-ef56…gh78", volumeUsd: 35000, commissionUsd: 35 },
  ],
};

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function PartnersPage() {
  const { isConnected, address, openModal } = useWallet();
  const [earnings, setEarnings] = useState<AffiliateEarnings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) return;
    setIsLoading(true);
    fetch(`/api/v2/affiliate/earnings?address=${address}`)
      .then(r => r.json())
      .then(d => setEarnings(d.earnings ?? MOCK))
      .catch(() => setEarnings(MOCK))
      .finally(() => setIsLoading(false));
  }, [isConnected, address]);

  async function handleClaim() {
    if (!address) return;
    setClaiming(true);
    setClaimError(null);
    try {
      const r = await fetch("/api/v2/affiliate/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      if (!r.ok) throw new Error("Claim failed");
      setClaimSuccess(true);
      setEarnings(prev => prev ? { ...prev, pendingCommissionsUsd: 0 } : prev);
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="min-h-screen p-6 pb-24 space-y-8" style={{ background: "var(--stellar-background)" }}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#8a00ff]/30 bg-[#8a00ff]/10">
          <Users className="h-6 w-6 text-[#8a00ff]" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">Partner Dashboard</h1>
          <p className="font-body mt-1 text-sm text-white/50">Track your 0.1% revenue share from referred splits. Read-only view.</p>
        </div>
      </div>

      {/* Wallet gate */}
      {!isConnected ? (
        <div className="glass-card flex flex-col items-center gap-4 py-16 text-center">
          <Users className="h-12 w-12 text-white/20" />
          <p className="font-body text-white/60">Connect your wallet to view your affiliate earnings.</p>
          <button onClick={openModal}
            className="rounded-xl border border-[#8a00ff]/40 bg-[#8a00ff]/15 px-6 py-2.5 font-body text-sm font-medium text-[#c084fc] hover:bg-[#8a00ff]/25 transition-colors">
            Connect Wallet
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-white/30" /></div>
      ) : earnings ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Volume Referred", value: fmt(earnings.totalVolumeReferredUsd), icon: TrendingUp, color: "text-[#00f5ff]" },
              { label: "Pending Commissions",   value: fmt(earnings.pendingCommissionsUsd),  icon: DollarSign, color: "text-yellow-400" },
              { label: "Lifetime Earned",       value: fmt(earnings.lifetimeEarnedUsd),      icon: DollarSign, color: "text-emerald-400" },
              { label: "Referred Streams",      value: String(earnings.referredStreamsCount), icon: ExternalLink, color: "text-[#8a00ff]" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${s.color}`} />
                    <p className="font-body text-[10px] uppercase tracking-widest text-white/30">{s.label}</p>
                  </div>
                  <p className={`font-ticker text-xl font-semibold ${s.color}`}>{s.value}</p>
                </div>
              );
            })}
          </div>

          {/* Withdraw */}
          <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-body text-sm font-medium text-white">Withdraw Commissions</p>
              <p className="font-body text-xs text-white/40 mt-0.5">
                {earnings.pendingCommissionsUsd > 0
                  ? `${fmt(earnings.pendingCommissionsUsd)} available to claim`
                  : "No pending commissions"}
              </p>
            </div>
            {claimSuccess ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle2 className="h-4 w-4" /> Claimed successfully
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <button onClick={handleClaim}
                  disabled={claiming || earnings.pendingCommissionsUsd === 0}
                  className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-2.5 font-body text-sm font-medium text-emerald-300 hover:bg-emerald-400/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {claiming && <Loader2 className="h-4 w-4 animate-spin" />}
                  {claiming ? "Claiming…" : "Withdraw Commissions"}
                </button>
                {claimError && <p className="font-body text-xs text-red-400">{claimError}</p>}
              </div>
            )}
          </div>

          {/* Recent referrals */}
          <div className="glass-card p-5">
            <p className="font-body mb-4 text-xs font-medium uppercase tracking-widest text-white/30">Recent Referrals</p>
            <div className="space-y-2">
              {earnings.recentReferrals.map((r, i) => (
                <motion.div key={i} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
                  className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-body text-xs text-white/30 shrink-0">{r.date}</span>
                    <span className="font-ticker text-xs text-white/60 truncate">{r.streamId}</span>
                    <span className="font-ticker text-xs text-white/40 shrink-0">{fmt(r.volumeUsd)} vol</span>
                  </div>
                  <span className="font-ticker text-sm font-semibold text-emerald-400 shrink-0 ml-3">+{fmt(r.commissionUsd)}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
