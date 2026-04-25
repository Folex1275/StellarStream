"use client";

import React, { useState, useEffect } from "react";
import { useBulkSplitter } from "@/lib/bulk-splitter/use-bulk-splitter";
import { BulkDispatchPanel } from "@/components/dashboard/BulkDispatchPanel";
import { SessionRestorePrompt } from "@/components/dashboard/SessionRestorePrompt";
import { FileUp, Calculator, Share2, AlertCircle, Download } from "lucide-react";
import type { Recipient } from "@/lib/bulk-splitter/types";
import { useSaveContacts } from "@/lib/hooks/use-save-contacts";
import { downloadBulkUploadCsvTemplate } from "@/lib/csv-template";

export default function SplitterPage() {
  const {
    status,
    voters,
    batches,
    batchStates,
    totalRecipients,
    error,
    parse,
    calculate,
    dispatch,
    retryFailed,
    reset,
  } = useBulkSplitter();

  const [rewardAmount, setRewardAmount] = useState("1000");
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [saveToContacts, setSaveToContacts] = useState(false);
  const saveContacts = useSaveContacts();

  // Detect existing session on mount
  useEffect(() => {
    const saved = localStorage.getItem("stellar_stream_bulk_splitter_session");
    if (saved && status === "idle") {
      setShowRestorePrompt(true);
    }
  }, [status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parse(text);
    };
    reader.readAsText(file);
  };

  const handleCalculate = () => {
    calculate(BigInt(rewardAmount) * BigInt(1e7)); // Assuming 7 decimals
  };

  // Mock submitBatch for demonstration
  const mockSubmitBatch = async (recipients: Recipient[]) => {
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
    if (Math.random() < 0.1) throw new Error("Network congestion or timeout");
    return "0x" + Math.random().toString(16).slice(2, 10) + "..." + Math.random().toString(16).slice(2, 6);
  };

  const handleDispatch = async () => {
    await dispatch(mockSubmitBatch);
    if (saveToContacts) {
      const addresses = voters.map((v) => v.address);
      await saveContacts(addresses);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl md:text-5xl text-white">Splitter Module</h1>
        <p className="font-body text-white/60">
          Disburse rewards to hundreds of recipients in efficient batches.
        </p>
      </header>

      {showRestorePrompt && (
        <SessionRestorePrompt
          onRestore={() => setShowRestorePrompt(false)}
          onClear={() => {
            reset();
            setShowRestorePrompt(false);
          }}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Step 1: Upload */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-full bg-cyan-400/10 p-2 text-cyan-400">
              <FileUp className="h-5 w-5" />
            </div>
            <h2 className="font-heading text-xl">1. Load Recipients</h2>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => downloadBulkUploadCsvTemplate()}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-400/20"
            >
              <Download className="h-3.5 w-3.5" />
              Download Template
            </button>
            <label className="block">
              <span className="sr-only">Choose CSV/JSON file</span>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="block w-full text-sm text-white/50
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-xl file:border-0
                  file:text-xs file:font-semibold
                  file:bg-cyan-400 file:text-black
                  hover:file:bg-cyan-300 transition-all cursor-pointer"
              />
            </label>
            {voters.length > 0 && (
              <p className="text-xs text-emerald-400 font-body">
                ✓ {voters.length} recipients loaded successfully.
              </p>
            )}
          </div>
        </section>

        {/* Step 2: Calculate */}
        <section className={`rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition-opacity ${voters.length === 0 ? "opacity-40 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-full bg-violet-400/10 p-2 text-violet-400">
              <Calculator className="h-5 w-5" />
            </div>
            <h2 className="font-heading text-xl">2. Configure Rewards</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest mb-1.5 block">Total Reward (USDC)</label>
              <input
                type="number"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white focus:outline-none focus:ring-1 focus:ring-violet-400/50"
              />
            </div>
            <button
              onClick={handleCalculate}
              disabled={status === "calculating"}
              className="w-full rounded-xl bg-violet-400 p-3 font-heading font-bold text-black hover:bg-violet-300 disabled:opacity-50 transition-all"
            >
              {status === "calculating" ? "Calculating..." : "Calculate Distribution"}
            </button>
          </div>
        </section>
      </div>

      {/* Step 3: Dispatch */}
      <section className={`rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition-all ${batches.length === 0 ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-emerald-400/10 p-2 text-emerald-400">
            <Share2 className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-xl">3. Batch Dispatch</h2>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-xs text-red-400 flex gap-2 items-center">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <label className="flex items-center gap-2 mb-6 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={saveToContacts}
            onChange={(e) => setSaveToContacts(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-black/20 accent-emerald-400"
          />
          <span className="text-sm text-white/60">Save new recipients to contacts</span>
        </label>

        {batches.length > 0 && (
          <BulkDispatchPanel
            batchStates={batchStates}
            onDispatch={handleDispatch}
            onRetryFailed={retryFailed}
            submitBatch={mockSubmitBatch}
          />
        )}
      </section>
    </div>
  );
}
