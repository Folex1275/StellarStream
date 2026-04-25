"use client";

// #980 – Post-Split Summary & Shareable Receipt

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ExternalLink, CheckCircle2, Copy, Download, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateProofOfPaymentPDF } from "@/lib/proof-of-payment-pdf";

const STELLAR_EXPERT_BASE =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
    ? "https://stellar.expert/explorer/public/op"
    : "https://stellar.expert/explorer/testnet/op";

interface OperationRow {
  index: number;
  operationId: string;
  url: string;
}

function buildRows(txHash: string, opCount: number): OperationRow[] {
  return Array.from({ length: opCount }, (_, i) => {
    const operationId = `${txHash.slice(0, 16)}…op${i}`;
    return { index: i, operationId, url: `${STELLAR_EXPERT_BASE}/${operationId}` };
  });
}

// ── Waterfall animation ──────────────────────────────────────────────────────

interface WaterfallHop {
  label: string;
  amount: string;
  color: string;
}

function WaterfallAnimation({ hops }: { hops: WaterfallHop[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 mb-6">
      <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Fund Distribution</p>
      <div className="flex flex-col gap-0">
        {hops.map((hop, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.18, duration: 0.35 }}
            className="flex items-center gap-3"
          >
            <div className="flex flex-col items-center">
              <div
                className="h-3 w-3 rounded-full border-2"
                style={{ borderColor: hop.color, background: `${hop.color}22` }}
              />
              {i < hops.length - 1 && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.18 + 0.15, duration: 0.2 }}
                  className="w-px flex-1 origin-top"
                  style={{ background: `${hop.color}55`, minHeight: 24 }}
                />
              )}
            </div>
            <div className="flex items-center justify-between flex-1 py-1">
              <span className="text-sm text-white/70">{hop.label}</span>
              <span className="font-mono text-sm font-bold" style={{ color: hop.color }}>
                {hop.amount}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={copy}
      aria-label="Copy"
      className="ml-2 text-white/30 hover:text-white/70 transition-colors"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span key="ok" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
            <CheckCircle2 size={13} className="text-emerald-400" />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
            <Copy size={13} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ── Main content ─────────────────────────────────────────────────────────────

function ReportContent() {
  const params = useSearchParams();
  const txHash = params.get("tx") ?? "demo_tx_hash_placeholder";
  const opCount = Number(params.get("ops") ?? "3");
  const sender = params.get("sender") ?? "GABC…7XYZ";
  const asset = params.get("asset") ?? "USDC";
  const amount = params.get("amount") ?? "0";
  const rows = buildRows(txHash, opCount);

  const [shareLabel, setShareLabel] = useState("Share Link");
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const waterfallHops: WaterfallHop[] = [
    { label: "Sender Wallet", amount: `${amount} ${asset}`, color: "#00f5ff" },
    { label: "StellarStream Contract", amount: `${amount} ${asset}`, color: "#8a00ff" },
    ...rows.map((r, i) => ({
      label: `Recipient ${i + 1} (${r.operationId.slice(0, 10)}…)`,
      amount: opCount > 0 ? `${(Number(amount) / opCount).toFixed(2)} ${asset}` : "0",
      color: i % 2 === 0 ? "#22d3ee" : "#34d399",
    })),
  ];

  async function handleDownloadPDF() {
    await generateProofOfPaymentPDF({
      streamId: txHash.slice(0, 12),
      sender,
      receiver: `${opCount} recipients`,
      asset,
      amount: `${amount} ${asset}`,
      timestamp: new Date().toISOString(),
      txHash,
    });
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: "StellarStream Split Receipt", url: shareUrl });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setShareLabel("Copied!");
      setTimeout(() => setShareLabel("Share Link"), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          <CheckCircle2 className="text-emerald-400 h-8 w-8 flex-shrink-0" />
        </motion.div>
        <div>
          <h1 className="text-xl font-bold">Split Confirmed</h1>
          <p className="text-sm text-white/50 mt-0.5">
            {opCount} payment{opCount !== 1 ? "s" : ""} confirmed on the Stellar network.
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60 hover:text-white transition-colors"
          >
            <Download size={13} />
            Download PDF
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-[#00f5ff]/20 bg-[#00f5ff]/[0.06] px-3 py-2 text-xs text-[#00f5ff]/80 hover:text-[#00f5ff] transition-colors"
          >
            <Share2 size={13} />
            {shareLabel}
          </button>
        </div>
      </motion.div>

      {/* Waterfall */}
      <WaterfallAnimation hops={waterfallHops} />

      {/* Tx hash */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 mb-6">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Transaction Hash</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-white/80 break-all">{txHash}</span>
          <CopyButton text={txHash} />
        </div>
      </div>

      {/* Operations table */}
      <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
        Operations ({rows.length})
      </p>
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="text-left px-4 py-3 text-white/40 font-normal">#</th>
              <th className="text-left px-4 py-3 text-white/40 font-normal">Operation ID</th>
              <th className="px-4 py-3 text-white/40 font-normal text-right">Explorer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.index}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-3 text-white/40">{row.index + 1}</td>
                <td className="px-4 py-3 font-mono text-white/70">
                  {row.operationId}
                  <CopyButton text={row.operationId} />
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    View
                    <ExternalLink size={13} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-white/30 text-center">
        Links open Stellar.Expert in a new tab. Data is read-only and non-custodial.
      </p>
    </div>
  );
}

export default function SplitReportPage() {
  return (
    <Suspense>
      <ReportContent />
    </Suspense>
  );
}
