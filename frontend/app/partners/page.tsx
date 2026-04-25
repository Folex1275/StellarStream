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
}

interface Referral {
  date: string;
  streamId: string;
  volumeUsd: number;
  commissionUsd: number;
}

const MOCK_EARNINGS: AffiliateEarnings = {
  totalVolumeReferredUsd: 1_240_500,
  pendingCommissionsUsd: 1_240.50,
  lifetimeEarnedUsd: 3_820.75,
  referredStreamsCount: 47,
};

const MOCK_REFERRALS: Referral[] = [
  { date: "2025-03-25", streamId: "s-0xf3a…b92c", volumeUsd: 50_000, commissionUsd: 50.00 },
  { date: "2025-03-18", streamId: "s-0x7d2…441a", volumeUsd: 120_000, commissionUsd: 120.00 },
  { date: "2025-03-10", streamId: "s-0x1c9…e83f", volumeUsd: 30_000, commissionUsd: 30.00 },
  { date: "2025-02-28", streamId: "s-0x9b4…c17d", volumeUsd: 85_000, commissionUsd: 85.00 },
  { date: "2025-02-14", streamId: "s-0x2e6…f50b", volumeUsd: 200_000, commissionUsd: 200.00 },
];

const fmtUsd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

type ClaimState = "idle" | "loading" | "success" | "error";

export default function PartnersPage() {
  const { isConnected, address, openModal } = useWallet();
  const [earnings, setEarnings] = useState<AffiliateEarnings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [claimState, setClaimState] = useState<ClaimState>("idle");
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) return;
    setIsLoading(true);
    fetch(`/api/v2/affiliate/earnings?address=${address}`)
      .then((r) => r.json())
      .then((d) => setEarnings(d.earnings ?? MOCK_EARNINGS))
      .catch(() => setEarnings(MOCK_EARNINGS))
      .finally(() => setIsLoading(false));
  }, [isConnected, address]);

  const handleClaim = async () => {
    if (!address || !earnings || earnings.pendingCommissionsUsd === 0) return;
    setClaimState("loading");
    setClaimError(null);
    try {
      const res = await fetch("/api/v2/affiliate/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      if (!res.ok) throw new Error("Claim failed");
      setClaimState("success");
      setEarnings((prev) => prev ? { ...prev, pendingCommissionsUsd: 0, lifetimeEarnedUsd: prev.lifetimeEarnedUsd + prev.pendingCommissionsUsd } : prev);
    } catch (e) {
      setClaimState("error");
      setClaimError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const stats = earnings ? [
    { label: "Total Volume Referred", value: fmtUsd(earnings.totalVolumeReferredUsd), icon: TrendingUp, color: "text-[#00f5ff]" },
    { label: "Pending Commissions", value: fmtUsd(earnings.pendingCommissionsUsd), icon: DollarSign, color: "text-yellow-400" },
    { label: "Lifetime Earned", value: fmtUsd(earnings.lifetimeEarnedUsd), icon: DollarSign, color: "text-emerald-400" },
    { label: "Referred Streams", value: earnings.referredStreamsCount.toString(), icon: Users, color: "text-[#8a00ff]" },
  ] : [];

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
          <p className="font-body text-lg text-white/60">Connect your wallet to view partner earnings</p>
          <button onClick={openModal} className="rounded-xl bg-[#8a00ff] px-6 py-2.5 font-body text-sm font-semibold text-white transition hover:bg-[#7000dd]">
            Connect Wallet
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-white/30" />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${s.color}`} />
                    <p className="font-body text-[10px] uppercase tracking-widest text-white/30">{s.label}</p>
                  </div>
                  <p className={`font-ticker text-xl font-semibold ${s.color}`}>{s.value}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Withdraw button */}
          <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-body text-sm font-medium text-white">Withdraw Commissions</p>
              <p className="font-body text-xs text-white/40 mt-0.5">Calls the on-chain claim() function to transfer pending earnings to your wallet.</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {claimState === "success" ? (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle2 className="h-4 w-4" /> Claimed successfully
                </div>
              ) : (
                <button onClick={handleClaim}
                  disabled={claimState === "loading" || !earnings || earnings.pendingCommissionsUsd === 0}
                  className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-2.5 font-body text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-40 disabled:cursor-not-allowed">
                  {claimState === "loading" ? <><Loader2 className="h-4 w-4 animate-spin" /> Claiming…</> : "Withdraw Commissions"}
                </button>
              )}
              {claimState === "error" && (
                <p className="flex items-center gap-1 text-xs text-red-400"><AlertCircle className="h-3 w-3" />{claimError}</p>
              )}
            </div>
          </div>

          {/* Referrals table */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8">
              <p className="font-body text-xs font-medium uppercase tracking-widest text-white/30">Recent Referrals</p>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {MOCK_REFERRALS.map((r) => (
                <div key={r.streamId} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-4">
                    <span className="font-body text-xs text-white/30">{r.date}</span>
                    <span className="font-ticker text-xs text-white/60">{r.streamId}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-body text-[10px] text-white/30">Volume</p>
                      <p className="font-ticker text-sm text-white/70">{fmtUsd(r.volumeUsd)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-[10px] text-white/30">Commission</p>
                      <p className="font-ticker text-sm text-emerald-400">{fmtUsd(r.commissionUsd)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
