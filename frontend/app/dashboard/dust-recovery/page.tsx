"use client";

// #775 – Dust Recovery Tool
// Fetches accumulated dust balance and generates reclaim_dust XDR for admin signature.

import { useState, useEffect } from "react";
import { Loader2, Coins, Copy, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAdminGuard } from "@/lib/use-admin-guard";
import { formatAmount } from "@/lib/contracts/stellarstream";

// Stub: replace with real Soroban contract call to `get_dust_balance`
async function fetchDustBalance(): Promise<bigint> {
  await new Promise((r) => setTimeout(r, 800));
  return BigInt("1234567"); // 0.1234567 USDC (7 decimals)
}

// Stub: replace with real XDR generation via stellar-sdk TransactionBuilder
async function buildReclaimDustXdr(
  destination: string,
  _dustAmount: bigint
): Promise<string> {
  await new Promise((r) => setTimeout(r, 600));
  return `AAAAAgAAAA${destination.slice(0, 8)}AAAA...RECLAIM_DUST_XDR_PLACEHOLDER`;
}

export default function DustRecoveryPage() {
  const guard = useAdminGuard();
  const [dustBalance, setDustBalance] = useState<bigint | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [destination, setDestination] = useState("");
  const [xdr, setXdr] = useState<string | null>(null);
  const [generatingXdr, setGeneratingXdr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDustBalance()
      .then(setDustBalance)
      .catch(() => setError("Failed to fetch dust balance."))
      .finally(() => setLoadingBalance(false));
  }, []);

  if (guard.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (guard.status === "unauthorized") return null;

  async function handleGenerate() {
    if (!destination.trim() || dustBalance === null) return;
    setGeneratingXdr(true);
    setError(null);
    setXdr(null);
    try {
      const result = await buildReclaimDustXdr(destination.trim(), dustBalance);
      setXdr(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "XDR generation failed.");
    } finally {
      setGeneratingXdr(false);
    }
  }

  async function handleCopy() {
    if (!xdr) return;
    await navigator.clipboard.writeText(xdr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasDust = dustBalance !== null && dustBalance > BigInt(0);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Coins className="text-amber-400 h-7 w-7 flex-shrink-0" />
        <div>
          <h1 className="text-xl font-bold">Dust Recovery</h1>
          <p className="text-sm text-white/50 mt-0.5">
            Reclaim accumulated protocol dust to a charity or treasury address.
          </p>
        </div>
      </div>

      {/* Dust balance card */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 mb-6">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
          Current Dust Balance
        </p>
        {loadingBalance ? (
          <div className="flex items-center gap-2 text-white/40">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Fetching from contract…</span>
          </div>
        ) : dustBalance !== null ? (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400">
              {formatAmount(dustBalance)}
            </span>
            <span className="text-sm text-white/40">USDC</span>
          </div>
        ) : (
          <p className="text-sm text-red-400">Could not load balance.</p>
        )}
      </div>

      {/* No dust state */}
      {!loadingBalance && !hasDust && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-3 text-white/50 text-sm mb-6">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          No dust to reclaim at this time.
        </div>
      )}

      {/* Generate XDR form */}
      {hasDust && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">
              Destination Address
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="G… (charity or treasury)"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-mono text-white placeholder-white/20 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>

          <button
            disabled={!destination.trim() || generatingXdr}
            onClick={handleGenerate}
            className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed py-3 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {generatingXdr ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Generating XDR…
              </>
            ) : (
              "Generate reclaim_dust XDR"
            )}
          </button>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
              <AlertTriangle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* XDR output */}
          {xdr && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/40 uppercase tracking-wider">
                  Transaction XDR
                </p>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  {copied ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <Copy size={13} />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-xs font-mono text-white/60 break-all whitespace-pre-wrap">
                {xdr}
              </pre>
              <p className="text-xs text-white/30">
                Submit this XDR via Stellar Laboratory or your admin wallet to
                execute the reclaim.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
