"use client";

// #773 – "Deploy My Splitter" wizard: triggers create_contract with V3 WASM hash

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Rocket, CheckCircle2, Loader2, Copy, ExternalLink } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";

// Replace with the real V3 WASM hash after upload
const V3_WASM_HASH =
  process.env.NEXT_PUBLIC_V3_WASM_HASH ??
  "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899";

type Step = "config" | "review" | "deploying" | "done";

interface Config {
  instanceName: string;
  adminAddress: string;
  feePercent: string;
}

const SLIDE = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

// Stub: replace with real Soroban host-function invocation via stellar-sdk
async function invokeCreateContract(
  wasmHash: string,
  config: Config,
  _walletAddress: string
): Promise<string> {
  await new Promise((r) => setTimeout(r, 2200));
  // Return a mock deployed contract address
  return `G${wasmHash.slice(0, 4).toUpperCase()}DEPLOY${config.instanceName
    .toUpperCase()
    .replace(/\s/g, "")
    .slice(0, 8)}XXXX`;
}

export default function DeploySplitterPage() {
  const { isConnected, address } = useWallet();
  const [step, setStep] = useState<Step>("config");
  const [config, setConfig] = useState<Config>({
    instanceName: "",
    adminAddress: address ?? "",
    feePercent: "0.1",
  });
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDeploy() {
    if (!isConnected || !address) return;
    setStep("deploying");
    setError(null);
    try {
      const addr = await invokeCreateContract(V3_WASM_HASH, config, address);
      setDeployedAddress(addr);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deployment failed");
      setStep("review");
    }
  }

  const canProceed =
    config.instanceName.trim().length > 0 &&
    config.adminAddress.trim().length > 0 &&
    Number(config.feePercent) >= 0;

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Rocket className="text-indigo-400 h-7 w-7 flex-shrink-0" />
        <div>
          <h1 className="text-xl font-bold">Deploy My Splitter</h1>
          <p className="text-sm text-white/50 mt-0.5">
            Launch your own V3 StellarStream instance on Soroban.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-xs text-white/40">
        {(["config", "review", "deploying", "done"] as Step[]).map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <span
              className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                step === s
                  ? "border-indigo-400 text-indigo-400"
                  : "border-white/10 text-white/20"
              }`}
            >
              {i + 1}
            </span>
            <span className={step === s ? "text-white/70" : ""}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {i < 3 && <ChevronRight size={12} />}
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Config ── */}
        {step === "config" && (
          <motion.div key="config" {...SLIDE} className="space-y-5">
            <Field
              label="Instance Name"
              value={config.instanceName}
              onChange={(v) => setConfig((c) => ({ ...c, instanceName: v }))}
              placeholder="Acme Corp Payroll"
            />
            <Field
              label="Admin Address"
              value={config.adminAddress}
              onChange={(v) => setConfig((c) => ({ ...c, adminAddress: v }))}
              placeholder="G…"
              mono
            />
            <Field
              label="Protocol Fee (%)"
              value={config.feePercent}
              onChange={(v) => setConfig((c) => ({ ...c, feePercent: v }))}
              placeholder="0.1"
              type="number"
            />
            <button
              disabled={!canProceed}
              onClick={() => setStep("review")}
              className="w-full mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed py-3 font-semibold transition-colors"
            >
              Review Configuration
            </button>
          </motion.div>
        )}

        {/* ── Step 2: Review ── */}
        {step === "review" && (
          <motion.div key="review" {...SLIDE} className="space-y-4">
            <ReviewRow label="Instance Name" value={config.instanceName} />
            <ReviewRow label="Admin Address" value={config.adminAddress} mono />
            <ReviewRow label="Protocol Fee" value={`${config.feePercent}%`} />
            <ReviewRow label="WASM Hash" value={V3_WASM_HASH} mono truncate />

            {error && (
              <p className="text-sm text-red-400 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep("config")}
                className="flex-1 rounded-xl border border-white/10 py-3 text-white/60 hover:text-white hover:border-white/20 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleDeploy}
                disabled={!isConnected}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed py-3 font-semibold transition-colors"
              >
                {isConnected ? "Deploy Contract" : "Connect Wallet First"}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Deploying ── */}
        {step === "deploying" && (
          <motion.div
            key="deploying"
            {...SLIDE}
            className="flex flex-col items-center gap-4 py-16"
          >
            <Loader2 className="h-10 w-10 text-indigo-400 animate-spin" />
            <p className="text-white/60">Invoking create_contract on Soroban…</p>
          </motion.div>
        )}

        {/* ── Step 4: Done ── */}
        {step === "done" && deployedAddress && (
          <motion.div key="done" {...SLIDE} className="space-y-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-400 h-7 w-7 flex-shrink-0" />
              <p className="text-lg font-semibold">Splitter Deployed!</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                Contract Address
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-white/80 break-all">
                  {deployedAddress}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(deployedAddress)}
                  className="text-white/30 hover:text-white/70 transition-colors"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
            <a
              href={`https://stellar.expert/explorer/${
                process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
                  ? "public"
                  : "testnet"
              }/contract/${deployedAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View on Stellar.Expert <ExternalLink size={13} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/60 transition-colors ${
          mono ? "font-mono" : ""
        }`}
      />
    </div>
  );
}

function ReviewRow({
  label,
  value,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="text-xs text-white/40 uppercase tracking-wider flex-shrink-0">{label}</span>
      <span
        className={`text-sm text-white/80 text-right ${mono ? "font-mono" : ""} ${
          truncate ? "truncate max-w-[200px]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
