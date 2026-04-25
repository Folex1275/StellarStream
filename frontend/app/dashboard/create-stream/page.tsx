"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ShieldAlert, ArrowLeftRight, Fingerprint, LockKeyhole, ShieldCheck } from "lucide-react";
import { useProtocolStatus } from "@/lib/use-protocol-status";
import { Can } from "@/components/Can";
import PrivacyShieldToggle from "@/components/privacy-shield-toggle";
import { useRecursiveSplitGuard } from "@/lib/use-recursive-split-guard";
import { SelfReferenceTooltip } from "@/components/self-reference-tooltip";
import { TransactionPrioritySelector } from "@/components/transaction-priority-selector";
import { useTransactionPriority, type PriorityTier } from "@/lib/use-transaction-priority";
import SwapAndStream from "@/components/swap-and-stream";
import { InsufficientXLMCard, NetworkCongestedCard } from "@/components/error-recovery-cards";
import type { RecoveryErrorType } from "@/components/error-recovery-cards";
import { useHardwareWalletTimeout } from "@/lib/hooks/use-hardware-wallet-timeout";
import { ConfirmOnDeviceModal } from "@/components/confirm-on-device-modal";
import { LoadProposalDataButton } from "@/components/load-proposal-data-button";
import { HighContrastGrid } from "@/components/high-contrast-grid";
import { useWallet } from "@/lib/wallet-context";
import { Horizon } from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk";
import { SimulationWaterfall } from "@/components/dashboard/simulation-waterfall";
import { buildSimulationWaterfall } from "@/lib/simulation-waterfall";
import {
  isWebAuthnAvailable,
  loadQuickSignCredential,
  registerQuickSignCredential,
  verifyQuickSignCredential,
} from "@/lib/webauthn-quick-sign";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  // Step 1
  asset: string;
  recipientAddress: string;
  recipientLabel: string;
  /** Optional Tax ID / internal note — stored backend-only, never on-chain. */
  recipientTaxId: string;
  // Stream Splitter (Issue #55)
  splitEnabled: boolean;
  splitAddress: string;
  splitPercent: number; // 0–50
  splitRecipients: Array<{ address: string; percent: number }>;
  // Privacy Shield (Issue #463)
  privacyShieldEnabled: boolean;
  // Step 2
  totalAmount: string;
  rateType: "per-second" | "per-minute" | "per-hour" | "per-day";
  durationPreset: string;
  customEndDate: Date | null;
  // Step 3 (computed)
  ratePerSecond: number;
  endDate: Date | null;
}

const INITIAL_FORM: FormData = {
  asset: "",
  recipientAddress: "",
  recipientLabel: "",
  recipientTaxId: "",
  splitEnabled: false,
  splitAddress: "",
  splitPercent: 10,
  splitRecipients: [],
  privacyShieldEnabled: false,
  totalAmount: "",
  rateType: "per-hour",
  durationPreset: "1 Month",
  customEndDate: null,
  ratePerSecond: 0,
  endDate: null,
};

// ─── Constants ────────────────────────────────────────────────────────────────
const ASSETS = [
  { symbol: "USDC", name: "USD Coin", icon: "◎", color: "#2775CA" },
  { symbol: "USDT", name: "Tether USD", icon: "₮", color: "#26A17B" },
  { symbol: "DAI", name: "Dai Stablecoin", icon: "◈", color: "#F5AC37" },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ", color: "#627EEA" },
  { symbol: "WBTC", name: "Wrapped BTC", icon: "₿", color: "#F7931A" },
  { symbol: "STRK", name: "Starknet", icon: "★", color: "#EC796B" },
];

const DURATION_PRESETS = [
  { label: "1 Hour", seconds: 3_600 },
  { label: "1 Day", seconds: 86_400 },
  { label: "1 Week", seconds: 604_800 },
  { label: "1 Month", seconds: 2_592_000 },
  { label: "3 Months", seconds: 7_776_000 },
  { label: "1 Year", seconds: 31_536_000 },
];

const RATE_LABELS: Record<FormData["rateType"], string> = {
  "per-second": "/ sec",
  "per-minute": "/ min",
  "per-hour": "/ hr",
  "per-day": "/ day",
};

const RATE_SECONDS: Record<FormData["rateType"], number> = {
  "per-second": 1,
  "per-minute": 60,
  "per-hour": 3600,
  "per-day": 86400,
};

const HORIZON_SERVER = new Horizon.Server("https://horizon.stellar.org");

type RecipientValidationStatus =
  | "ok"
  | "missing_trustline"
  | "account_not_funded"
  | "invalid_address";

type BalanceValidationStatus =
  | "ok"
  | "insufficient_asset"
  | "insufficient_xlm"
  | "not_connected"
  | "pending";

type QuickSignStatus =
  | "checking"
  | "unsupported"
  | "needs_setup"
  | "locked"
  | "verifying"
  | "verified"
  | "error";

function getRecipientStatusLabel(status: RecipientValidationStatus): string {
  switch (status) {
    case "ok":
      return "Ready to receive";
    case "missing_trustline":
      return "Missing Trustline";
    case "account_not_funded":
      return "Account Not Funded";
    case "invalid_address":
      return "Invalid Stellar address";
  }
}

function parseStellarBalance(balance: string | undefined): number {
  return balance ? parseFloat(balance) : 0;
}

function hasTrustlineForAsset(account: any, assetCode: string): boolean {
  if (assetCode.toUpperCase() === "XLM") return true;
  return account.balances.some((balance: any) =>
    balance.asset_type !== "native" && balance.asset_code === assetCode
  );
}

function getBalanceForAsset(account: any, assetCode: string): number {
  if (assetCode.toUpperCase() === "XLM") {
    const native = account.balances.find((balance: any) => balance.asset_type === "native");
    return parseStellarBalance(native?.balance);
  }
  const asset = account.balances.find((balance: any) => balance.asset_code === assetCode);
  return parseStellarBalance(asset?.balance);
}

function getAccountStatus(assetCode: string, account: any): RecipientValidationStatus {
  if (!account) return "invalid_address";
  if (assetCode.toUpperCase() === "XLM") return "ok";
  return hasTrustlineForAsset(account, assetCode) ? "ok" : "missing_trustline";
}

function isHorizonNotFound(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const err = error as any;
  return err?.response?.status === 404 || err?.status === 404;
}

function feeStroopsToXlm(stroops: number): number {
  return stroops / 1e7;
}

const STEPS = [
  { number: 1, label: "Asset & Recipient", short: "Asset" },
  { number: 2, label: "Rate & Duration", short: "Rate" },
  { number: 3, label: "Review & Sign", short: "Sign" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const fmtDuration = (seconds: number): string => {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.round(seconds / 86400)}d`;
  if (seconds < 2592000) return `${Math.round(seconds / 604800)}w`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)}mo`;
  return `${(seconds / 31536000).toFixed(1)}yr`;
};

function calcRatePerSecond(totalAmount: string, durationSeconds: number): number {
  const total = parseFloat(totalAmount) || 0;
  return durationSeconds > 0 ? total / durationSeconds : 0;
}

function calcDisplayRate(ratePerSecond: number, rateType: FormData["rateType"]): number {
  return ratePerSecond * RATE_SECONDS[rateType];
}

// ─── Nebula background glow ───────────────────────────────────────────────────
function PageNebula() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full opacity-10 blur-[100px]"
        style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/3 -left-40 h-[400px] w-[400px] rounded-full opacity-6 blur-[80px]"
        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
      />
    </div>
  );
}

// ─── Progress Pill ────────────────────────────────────────────────────────────
function ProgressPill({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
      {STEPS.map((s, i) => {
        const done = step > s.number;
        const active = step === s.number;
        return (
          <div key={s.number} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className="h-px w-6 transition-all duration-500"
                style={{
                  background: done || active
                    ? "linear-gradient(90deg,#22d3ee,rgba(34,211,238,0.3))"
                    : "rgba(255,255,255,0.10)",
                }}
              />
            )}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-300 ${active
                ? "bg-cyan-400 text-black"
                : done
                  ? "bg-cyan-400/20 text-cyan-400"
                  : "text-white/30"
                }`}
              style={active ? { boxShadow: "0 0 16px rgba(34,211,238,0.5)" } : undefined}
            >
              <span className="font-body text-[10px] font-bold tracking-wider">
                {done ? "✓" : `0${s.number}`}
              </span>
              <span className="hidden sm:block font-body text-[10px] font-bold tracking-[0.08em] uppercase">
                {s.short}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Slide wrapper ────────────────────────────────────────────────────────────
function SlidePanel({
  children,
  direction,
  id,
}: {
  children: React.ReactNode;
  direction: "enter" | "exit-left" | "idle";
  id: number;
}) {
  return (
    <div
      key={id}
      className="w-full"
      style={{
        animation:
          direction === "enter"
            ? "slideInRight 0.38s cubic-bezier(0.16,1,0.3,1) forwards"
            : direction === "exit-left"
              ? "slideOutLeft 0.28s cubic-bezier(0.4,0,1,1) forwards"
              : "none",
      }}
    >
      {children}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(48px) scale(0.98); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0)    scale(1);    }
          to   { opacity: 0; transform: translateX(-48px) scale(0.98); }
        }
      `}</style>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <label className="block font-body text-[10px] tracking-[0.12em] text-white/50 uppercase">{label}</label>
      {children}
      {hint && <p className="font-body text-xs text-white/30">{hint}</p>}
    </div>
  );
}

// ─── Glass input ──────────────────────────────────────────────────────────────
function GlassInput({
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
  suffix,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border bg-white/[0.03] px-4 py-3 transition-all duration-200 ${className}`}
      style={{
        borderColor: focused ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.10)",
        boxShadow: focused ? "0 0 0 1px rgba(34,211,238,0.15), 0 0 24px rgba(34,211,238,0.08)" : "none",
      }}
    >
      {prefix && <span className="text-white/30 font-body text-sm flex-shrink-0">{prefix}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent font-body text-sm text-white/90 outline-none placeholder:text-white/20"
        style={{ caretColor: "#22d3ee" }}
      />
      {suffix && <span className="text-white/40 font-body text-xs flex-shrink-0">{suffix}</span>}
    </div>
  );
}

// ─── Stellar address validator ────────────────────────────────────────────────
function isValidStellarAddress(addr: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(addr.trim());
}

// ─── Stream Splitter UI ───────────────────────────────────────────────────────
function StreamSplitter({
  form,
  update,
  recipientValidation,
}: {
  form: FormData;
  update: (patch: Partial<FormData>) => void;
  recipientValidation: Record<string, RecipientValidationStatus>;
}) {
  const [focused, setFocused] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [splitRecipients, setSplitRecipients] = useState<Array<{ address: string; percent: number }>>(form.splitRecipients || []);
  const [mergeSuggestionVisible, setMergeSuggestionVisible] = useState(false);

  const normalizedRecipients = splitRecipients.map((item) => ({ address: item.address.toUpperCase(), percent: item.percent }));

  useEffect(() => {
    setSplitRecipients(form.splitRecipients || []);
  }, [form.splitRecipients]);

  const duplicates = normalizedRecipients.reduce<Record<string, number[]>>((acc, recipient, index) => {
    const addr = recipient.address;
    if (!acc[addr]) acc[addr] = [];
    acc[addr].push(index);
    return acc;
  }, {});

  const duplicateAddresses = Object.keys(duplicates).filter((addr) => duplicates[addr].length > 1);

  useEffect(() => {
    setMergeSuggestionVisible(duplicateAddresses.length > 0);
    update({ splitRecipients });
  }, [splitRecipients, duplicateAddresses.length, update]);

  const addSplitRecipient = () => {
    if (!isValidStellarAddress(form.splitAddress)) {
      setProposalError("Address is invalid");
      return;
    }
    const percent = Number(form.splitPercent);
    if (Number.isNaN(percent) || percent <= 0 || percent > 100) {
      setProposalError("Split percentage must be 1-100");
      return;
    }

    const newRecipient = {
      address: form.splitAddress.toUpperCase(),
      percent,
    };
    setSplitRecipients((prev) => [...prev, newRecipient]);
    update({ splitAddress: "", splitPercent: 10, splitEnabled: true });
  };

  const removeRecipient = (index: number) => {
    setSplitRecipients((prev) => prev.filter((_, idx) => idx !== index));
  };

  const mergeDuplicateRows = () => {
    const mergedMap: Record<string, number> = {};
    splitRecipients.forEach((recipient) => {
      const address = recipient.address.toUpperCase();
      mergedMap[address] = (mergedMap[address] || 0) + recipient.percent;
    });

    const merged = Object.entries(mergedMap).map(([address, total]) => ({
      address,
      percent: Math.min(total, 100),
    }));

    setSplitRecipients(merged);
    setMergeSuggestionVisible(false);
  };

  const addressDirty = form.splitAddress.length > 0;
  const addressValid = isValidStellarAddress(form.splitAddress);
  const addressError = addressDirty && !addressValid;

  // ── Handle proposal data loading ────────────────────────────────────────────
  const handleProposalLoaded = (recipients: Array<{ address: string; percentage: number }>) => {
    try {
      setProposalError(null);

      if (recipients.length === 0) {
        setProposalError("No recipients found in proposal");
        return;
      }

      // For now, use the first recipient (can be extended for multi-recipient support)
      const primaryRecipient = recipients[0];

      if (!isValidStellarAddress(primaryRecipient.address)) {
        setProposalError("Proposal contains invalid recipient address");
        return;
      }

      // Enable split and auto-fill recipient list
      const normalized = recipients.map((item) => ({
        address: item.address.toUpperCase(),
        percent: Math.min(Math.round(item.percentage), 100),
      }));

      update({
        splitEnabled: true,
        splitAddress: primaryRecipient.address,
        splitPercent: Math.min(Math.round(primaryRecipient.percentage), 50), // cap at 50%
        splitRecipients: normalized,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load proposal";
      setProposalError(msg);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="font-body text-[10px] tracking-[0.12em] text-white/50 uppercase">
            Split Stream
          </p>
          <p className="font-body text-xs text-white/30 mt-0.5">
            Route a portion to a second wallet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LoadProposalDataButton
            disabled={!form.splitEnabled}
            onProposalLoaded={handleProposalLoaded}
            onError={setProposalError}
          />
          <button
            type="button"
            role="switch"
            aria-checked={form.splitEnabled}
            onClick={() => update({ splitEnabled: !form.splitEnabled })}
            className="relative h-6 w-11 rounded-full border transition-all duration-300 focus:outline-none flex-shrink-0"
            style={{
              background: form.splitEnabled
              ? "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(99,102,241,0.3))"
              : "rgba(255,255,255,0.06)",
            borderColor: form.splitEnabled
              ? "rgba(34,211,238,0.5)"
              : "rgba(255,255,255,0.12)",
            boxShadow: form.splitEnabled ? "0 0 12px rgba(34,211,238,0.2)" : "none",
          }}
        >
          <span
            className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-all duration-300"
            style={{
              background: form.splitEnabled
                ? "linear-gradient(135deg, #22d3ee, #6366f1)"
                : "rgba(255,255,255,0.25)",
              transform: form.splitEnabled ? "translateX(20px)" : "translateX(0)",
              boxShadow: form.splitEnabled ? "0 0 8px rgba(34,211,238,0.5)" : "none",
            }}
          />
        </button>
        </div>
      </div>

      {form.splitEnabled && (
        <div
          className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.03] p-4 space-y-4"
          style={{ animation: "splitExpand 0.25s cubic-bezier(0.16,1,0.3,1)" }}
        >
          <style>{`
            @keyframes splitExpand {
              from { opacity: 0; transform: translateY(-6px) scaleY(0.95); }
              to   { opacity: 1; transform: translateY(0)   scaleY(1);    }
            }
          `}</style>

          {/* Proposal error message */}
          {proposalError && (
            <div className="rounded-lg border border-red-400/30 bg-red-400/[0.06] px-3 py-2">
              <p className="text-xs text-red-300">{proposalError}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-body text-[10px] tracking-[0.1em] text-white/40 uppercase">
                Split Percentage
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className="font-heading text-2xl tabular-nums"
                  style={{ color: "#22d3ee", textShadow: "0 0 12px rgba(34,211,238,0.4)" }}
                >
                  {form.splitPercent}
                </span>
                <span className="font-body text-xs text-white/40">%</span>
              </div>
            </div>

            <div className="relative py-2">
              <div
                className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(form.splitPercent / 50) * 100}%`,
                    background: "linear-gradient(90deg, #22d3ee, #6366f1)",
                    boxShadow: "0 0 8px rgba(34,211,238,0.4)",
                  }}
                />
              </div>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={form.splitPercent}
                onChange={(e) => update({ splitPercent: Number(e.target.value) })}
                className="relative w-full appearance-none bg-transparent cursor-pointer"
                style={{ height: "24px" }}
              />
              <style>{`
                input[type=range]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  width: 18px; height: 18px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #22d3ee, #6366f1);
                  border: 2px solid rgba(255,255,255,0.9);
                  box-shadow: 0 0 10px rgba(34,211,238,0.5);
                  cursor: pointer;
                }
                input[type=range]::-moz-range-thumb {
                  width: 18px; height: 18px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #22d3ee, #6366f1);
                  border: 2px solid rgba(255,255,255,0.9);
                  box-shadow: 0 0 10px rgba(34,211,238,0.5);
                  cursor: pointer;
                }
              `}</style>
            </div>

            <div className="flex justify-between">
              {[0, 10, 20, 30, 40, 50].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update({ splitPercent: v === 0 ? 1 : v })}
                  className="font-body text-[9px] text-white/25 hover:text-cyan-400/70 transition-colors tabular-nums"
                >
                  {v}%
                </button>
              ))}
            </div>

            {form.splitPercent > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden flex">
                  <div
                    className="h-full rounded-l-full"
                    style={{ width: `${100 - form.splitPercent}%`, background: "rgba(34,211,238,0.35)" }}
                  />
                  <div
                    className="h-full rounded-r-full"
                    style={{ width: `${form.splitPercent}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }}
                  />
                </div>
                <div className="flex items-center gap-2 text-[9px] font-body flex-shrink-0">
                  <span className="text-cyan-400/70">{100 - form.splitPercent}% primary</span>
                  <span className="text-white/20">·</span>
                  <span className="text-indigo-400/70">{form.splitPercent}% split</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="font-body text-[10px] tracking-[0.1em] text-white/40 uppercase">
              Split Recipient Address
            </p>
            <div
              className="flex items-center gap-2 rounded-2xl border bg-white/[0.03] px-4 py-3 transition-all duration-200"
              style={{
                borderColor: addressError
                  ? "rgba(248,113,113,0.5)"
                  : addressValid
                    ? "rgba(34,211,238,0.4)"
                    : focused
                      ? "rgba(34,211,238,0.3)"
                      : "rgba(255,255,255,0.10)",
                boxShadow: addressError
                  ? "0 0 0 1px rgba(248,113,113,0.15)"
                  : addressValid
                    ? "0 0 0 1px rgba(34,211,238,0.1), 0 0 16px rgba(34,211,238,0.06)"
                    : "none",
              }}
            >
              <span className="text-white/25 font-body text-sm flex-shrink-0">G</span>
              <input
                type="text"
                value={form.splitAddress.startsWith("G") ? form.splitAddress.slice(1) : form.splitAddress}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\s/g, "");
                  update({ splitAddress: raw ? `G${raw}` : "" });
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="…56-character Stellar address"
                maxLength={55}
                className="flex-1 bg-transparent font-body text-sm text-white/90 outline-none placeholder:text-white/15 font-mono"
                style={{ caretColor: "#22d3ee", letterSpacing: "0.02em" }}
              />
              {addressValid && <span className="text-cyan-400 text-sm flex-shrink-0">✓</span>}
              {addressError && <span className="text-red-400 text-sm flex-shrink-0">✗</span>}
            </div>
            {addressError && (
              <p className="font-body text-xs text-red-400/80">
                Must be a valid Stellar address starting with G (56 characters, A–Z and 2–7)
              </p>
            )}
            {addressValid && (
              <p className="font-body text-xs text-cyan-400/60">Valid Stellar address ✓</p>
            )}
            <SelfReferenceTooltip
              show={addressValid && form.splitAddress.trim().toUpperCase() === (process.env.NEXT_PUBLIC_CONTRACT_ID ?? "").toUpperCase() || addressValid && form.splitAddress.trim().toUpperCase() === (process.env.NEXT_PUBLIC_NEBULA_CONTRACT_ID ?? "").toUpperCase()}
              message="Self-Reference Error: This address matches the Splitter contract. Adding the contract as a recipient could lock funds or cause a recursive loop."
            />

            {/* Add recipient to split list */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={addSplitRecipient}
                disabled={!addressValid || form.splitPercent <= 0}
                className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Recipient
              </button>
              <p className="text-xs text-white/40">Once added, this recipient joins the split list.</p>
            </div>

            {mergeSuggestionVisible && (
              <div className="mt-3 rounded-xl border border-yellow-400/40 bg-yellow-400/10 p-3 text-xs text-yellow-200">
                We detected multiple entries for the same address. <button type="button" onClick={mergeDuplicateRows} className="font-semibold underline">Merge Rows</button>
              </div>
            )}

            {splitRecipients.length > 0 && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <h4 className="text-xs text-white/60 uppercase tracking-wider">Split Recipients</h4>
                <div className="mt-2">
                  <HighContrastGrid
                    rows={splitRecipients}
                    rowKey={(recipient, index) => `${recipient.address}-${index}`}
                    columns={[
                      {
                        key: "address",
                        header: "Address",
                        render: (recipient) => {
                          const status = recipientValidation[recipient.address] || "ok";
                          const warning = status !== "ok";
                          return (
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="break-all font-mono text-[12px] font-semibold text-white/95">
                                  {recipient.address}
                                </p>
                                {warning && (
                                  <span
                                    className="text-yellow-300 text-[11px] font-bold"
                                    title={getRecipientStatusLabel(status)}
                                  >
                                    ⚠
                                  </span>
                                )}
                              </div>
                              {warning && (
                                <p className="mt-1 text-[11px] font-semibold text-yellow-300">
                                  {getRecipientStatusLabel(status)}
                                </p>
                              )}
                            </div>
                          );
                        },
                      },
                      {
                        key: "percent",
                        header: "Share",
                        className: "text-right",
                        render: (recipient) => {
                          const status = recipientValidation[recipient.address] || "ok";
                          const warning = status !== "ok";
                          return (
                            <p
                              className={`font-mono text-[13px] font-extrabold tabular-nums ${
                                warning ? "text-yellow-200" : "text-cyan-200"
                              }`}
                            >
                              {recipient.percent.toFixed(2)}%
                            </p>
                          );
                        },
                      },
                      {
                        key: "actions",
                        header: "",
                        className: "text-right",
                        render: (_, index) => (
                          <button
                            type="button"
                            onClick={() => removeRecipient(index)}
                            className="text-red-300 text-[11px] font-bold hover:text-red-200"
                          >
                            Remove
                          </button>
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 1: Asset & Recipient ────────────────────────────────────────────────
function Step1({
  form,
  update,
  recipientValidation,
}: {
  form: FormData;
  update: (patch: Partial<FormData>) => void;
  recipientValidation: Record<string, RecipientValidationStatus>;
}) {
  const [showSwap, setShowSwap] = useState(false);

  if (showSwap) {
    return (
      <div style={{ animation: "slideInRight 0.38s cubic-bezier(0.16,1,0.3,1)" }}>
        <SwapAndStream
          onComplete={(_, toAsset) => {
            update({ asset: toAsset.symbol });
            setShowSwap(false);
          }}
          onCancel={() => setShowSwap(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Swap entry point banner */}
      <button
        type="button"
        onClick={() => setShowSwap(true)}
        className="w-full flex items-center justify-between gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-400/20 px-4 py-3 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center group-hover:bg-cyan-400/15 transition-colors">
            <ArrowLeftRight size={14} className="text-cyan-400/70 group-hover:text-cyan-400 transition-colors" />
          </div>
          <div className="text-left">
            <p className="font-body text-xs font-bold text-white/60 group-hover:text-white/80 transition-colors">
              Don&apos;t have the right asset?
            </p>
            <p className="font-body text-[11px] text-white/30">Swap first, then stream in one flow</p>
          </div>
        </div>
        <span className="font-body text-[10px] font-bold text-cyan-400/60 group-hover:text-cyan-400 tracking-wider uppercase transition-colors">
          Swap →
        </span>
      </button>

      <Field label="Select Asset">
        <div className="grid grid-cols-3 gap-2">
          {ASSETS.map((a) => {
            const active = form.asset === a.symbol;
            return (
              <button
                key={a.symbol}
                onClick={() => update({ asset: a.symbol })}
                className={`relative flex flex-col items-center gap-2 rounded-2xl border p-3.5 transition-all duration-200 ${active
                  ? "border-cyan-400/50 bg-cyan-400/10"
                  : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                  }`}
                style={active ? { boxShadow: "0 0 20px rgba(34,211,238,0.18), inset 0 0 20px rgba(34,211,238,0.04)" } : undefined}
              >
                <span
                  className="text-xl font-bold"
                  style={{ color: active ? "#22d3ee" : a.color, textShadow: active ? "0 0 12px rgba(34,211,238,0.6)" : "none" }}
                >
                  {a.icon}
                </span>
                <span className={`font-body text-xs font-bold ${active ? "text-cyan-400" : "text-white/60"}`}>
                  {a.symbol}
                </span>
                {active && <span className="absolute top-2 right-2 text-[8px] text-cyan-400">✓</span>}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="h-px bg-white/[0.06]" />

      <Field label="Recipient Address" hint="Enter a wallet address or ENS name.">
        <GlassInput
          value={form.recipientAddress}
          onChange={(v) => update({ recipientAddress: v })}
          placeholder="0x... or name.eth"
          prefix="→"
        />
      </Field>

      <Field label="Recipient Label (optional)" hint="A private label shown only to you.">
        <GlassInput
          value={form.recipientLabel}
          onChange={(v) => update({ recipientLabel: v })}
          placeholder="e.g. Dev Fund, Alice"
          prefix="🏷"
        />
      </Field>

      <Field label="Tax ID / Internal Note (optional)" hint="Stored on our servers only — never written to the public ledger.">
        <GlassInput
          value={form.recipientTaxId}
          onChange={(v) => update({ recipientTaxId: v })}
          placeholder="e.g. 12-3456789 or contractor ref"
          prefix="🔒"
        />
      </Field>

      <div className="h-px bg-white/[0.06]" />

      <StreamSplitter form={form} update={update} recipientValidation={recipientValidation} />

      <div className="h-px bg-white/[0.06]" />

      <PrivacyShieldToggle
        enabled={form.privacyShieldEnabled}
        onChange={(enabled) => update({ privacyShieldEnabled: enabled })}
      />
    </div>
  );
}

// ─── Step 2: Rate & Duration ──────────────────────────────────────────────────
function Step2({
  form,
  update,
}: {
  form: FormData;
  update: (patch: Partial<FormData>) => void;
}) {
  const durationSeconds =
    DURATION_PRESETS.find((p) => p.label === form.durationPreset)?.seconds ??
    (form.customEndDate ? Math.floor((form.customEndDate.getTime() - Date.now()) / 1000) : 0);

  const ratePerSec = calcRatePerSecond(form.totalAmount, durationSeconds);
  const displayRate = calcDisplayRate(ratePerSec, form.rateType);
  const endDate = durationSeconds > 0 ? new Date(Date.now() + durationSeconds * 1000) : null;

  return (
    <div className="space-y-6">
      <Field label="Total Stream Amount">
        <div
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 transition-all focus-within:border-cyan-400/40"
          style={{ boxShadow: form.totalAmount ? "0 0 24px rgba(34,211,238,0.06)" : "none" }}
        >
          <input
            type="text"
            inputMode="decimal"
            value={form.totalAmount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, "");
              if ((v.match(/\./g) ?? []).length > 1) return;
              update({ totalAmount: v });
            }}
            placeholder="0.00"
            className="flex-1 bg-transparent font-heading text-4xl text-white outline-none placeholder:text-white/15 tabular-nums"
            style={{ caretColor: "#22d3ee" }}
          />
          <span className="font-body text-sm font-bold text-white/40 tracking-widest">{form.asset || "USDC"}</span>
        </div>
      </Field>

      <Field label="Displayed Rate">
        <div className="flex gap-2 flex-wrap">
          {(["per-second", "per-minute", "per-hour", "per-day"] as FormData["rateType"][]).map((r) => {
            const active = form.rateType === r;
            return (
              <button
                key={r}
                onClick={() => update({ rateType: r })}
                className={`rounded-xl border px-3 py-1.5 font-body text-xs font-bold transition-all duration-200 ${active
                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-400"
                  : "border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70"
                  }`}
                style={active ? { boxShadow: "0 0 10px rgba(34,211,238,0.2)" } : undefined}
              >
                {RATE_LABELS[r]}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Duration">
        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map((p) => {
            const active = form.durationPreset === p.label;
            return (
              <button
                key={p.label}
                onClick={() => update({ durationPreset: p.label, customEndDate: null })}
                className={`rounded-xl border px-3 py-2 font-body text-sm font-bold transition-all duration-200 ${active
                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-400"
                  : "border-white/10 bg-white/[0.03] text-white/40 hover:text-white/70 hover:border-white/20"
                  }`}
                style={active ? { boxShadow: "0 0 12px rgba(34,211,238,0.2), inset 0 0 12px rgba(34,211,238,0.04)" } : undefined}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </Field>

      {form.totalAmount && durationSeconds > 0 && (
        <div
          className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] px-5 py-4 space-y-3"
          style={{ animation: "fadeUp 0.2s ease" }}
        >
          <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }`}</style>
          <p className="font-body text-[10px] tracking-widest text-white/35 uppercase">Stream Preview</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Rate", value: `${fmt(displayRate)} ${form.asset || "USDC"} ${RATE_LABELS[form.rateType]}` },
              { label: "Duration", value: fmtDuration(durationSeconds) },
              { label: "Ends", value: endDate ? fmtDate(endDate) : "—" },
            ].map((row) => (
              <div key={row.label}>
                <p className="font-body text-[10px] text-white/30 uppercase tracking-wider">{row.label}</p>
                <p className="font-body text-sm font-bold text-cyan-400 mt-0.5 tabular-nums">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Review & Sign ────────────────────────────────────────────────────
function Step3({
  form,
  onSign,
  signing,
  priorityTier,
  onPriorityChange,
  recoveryError,
  onDismissRecovery,
  onAcceptFee,
  onSwapToXLM,
  recipientValidation,
  balanceValidation,
  validationLoading,
  validationError,
  quickSignStatus,
  quickSignError,
  hasQuickSignCredential,
  onSetupQuickSign,
  onVerifyQuickSign,
}: {
  form: FormData;
  onSign: () => void;
  signing: boolean;
  priorityTier: PriorityTier;
  onPriorityChange: (id: PriorityTier) => void;
  recoveryError?: RecoveryErrorType | null;
  onDismissRecovery?: () => void;
  onAcceptFee?: (fee: number) => void;
  onSwapToXLM?: () => void;
  recipientValidation: Record<string, RecipientValidationStatus>;
  balanceValidation: BalanceValidationStatus;
  validationLoading: boolean;
  validationError: string | null;
  quickSignStatus: QuickSignStatus;
  quickSignError: string | null;
  hasQuickSignCredential: boolean;
  onSetupQuickSign: () => void;
  onVerifyQuickSign: () => void;
}) {
  const asset = ASSETS.find((a) => a.symbol === form.asset);
  const durationSeconds =
    DURATION_PRESETS.find((p) => p.label === form.durationPreset)?.seconds ?? 0;
  const ratePerSec = calcRatePerSecond(form.totalAmount, durationSeconds);
  const displayRate = calcDisplayRate(ratePerSec, form.rateType);
  const endDate = durationSeconds > 0 ? new Date(Date.now() + durationSeconds * 1000) : null;
  const totalAmount = parseFloat(form.totalAmount) || 0;
  const protocolFee = totalAmount * 0.003;
  const networkFee = Math.max(0.00001, totalAmount * 0.0001);
  const recipientAmount = Math.max(0, totalAmount - protocolFee - networkFee);

  const claimableRecipients = Object.values(recipientValidation).filter((status) =>
    status === "missing_trustline" || status === "account_not_funded"
  );
  const invalidRecipients = Object.values(recipientValidation).filter((status) => status === "invalid_address");
  const hasRecipientIssues = invalidRecipients.length > 0;
  const balanceProblem = balanceValidation !== "ok" && balanceValidation !== "pending";
  const quickSignReady = quickSignStatus === "verified";
  const quickSignBusy = quickSignStatus === "checking" || quickSignStatus === "verifying";
  const confirmDisabled = signing || validationLoading || hasRecipientIssues || balanceProblem || !quickSignReady;

  const rows = [
    { label: "Asset", value: `${asset?.icon ?? ""} ${form.asset}` },
    {
      label: "Recipient", value: form.recipientLabel
        ? `${form.recipientLabel} · ${form.recipientAddress.slice(0, 10)}…`
        : `${form.recipientAddress.slice(0, 14)}…`
    },
    { label: "Total", value: `${fmt(totalAmount || 0)} ${form.asset}` },
    { label: "Rate", value: `${fmt(displayRate)} ${form.asset} ${RATE_LABELS[form.rateType]}` },
    { label: "Duration", value: form.durationPreset },
    { label: "End Date", value: endDate ? fmtDate(endDate) : "—" },
    ...(form.splitEnabled ? [
      { label: "Split To", value: `${form.splitAddress.slice(0, 6)}…${form.splitAddress.slice(-4)}`, accent: true },
      { label: "Split %", value: `${form.splitPercent}% → ${100 - form.splitPercent}% primary`, accent: true },
    ] : []),
    ...(form.privacyShieldEnabled ? [
      { label: "Privacy", value: "🔐 P25 Privacy Shield Enabled", accent: true },
    ] : []),
  ];
  const simulation = buildSimulationWaterfall({
    senderLabel: "Connected Wallet",
    protocolLabel: "StellarStream Router",
    totalAmount,
    protocolFee,
    networkFee,
    recipients: [
      {
        address: form.recipientAddress || "recipient",
        label: form.recipientLabel || "Recipient",
        amount: recipientAmount,
      },
    ],
  });

  return (
    <div className="space-y-5">
      <p className="font-body text-sm text-white/50">
        Review your stream parameters before signing the on-chain transaction.
      </p>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] divide-y divide-white/[0.05] overflow-hidden">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-5 py-3.5"
            style={"accent" in row && row.accent ? { background: "rgba(99,102,241,0.06)" } : undefined}
          >
            <span
              className="font-body text-xs tracking-wider uppercase"
              style={"accent" in row && row.accent ? { color: "rgba(165,180,252,0.7)" } : { color: "rgba(255,255,255,0.35)" }}
            >
              {row.label}
            </span>
            <span
              className="font-body text-sm font-bold tabular-nums text-right"
              style={"accent" in row && row.accent ? { color: "rgba(165,180,252,0.9)" } : { color: "rgba(255,255,255,0.85)" }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <SimulationWaterfall
        asset={form.asset}
        summary={simulation}
        description="A step-by-step preview of how the signed transaction distributes funds, including estimated protocol and network fees."
      />
      <div className="flex gap-3 rounded-2xl border border-orange-400/20 bg-orange-400/[0.05] px-4 py-3">
        <span className="text-orange-400 text-sm flex-shrink-0 mt-0.5">⚠</span>
        <p className="font-body text-xs text-orange-300/70 leading-relaxed">
          Streams are immutable once created. Cancellation will stop the stream and return remaining funds.
          Ensure all details are correct before signing.
        </p>
      </div>

      <button
        onClick={onSign}
        disabled={signing || isSelfReference || hasDuplicates}
        className="w-full rounded-2xl bg-cyan-400 py-4 font-body text-base font-bold text-black transition-all duration-200 hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ boxShadow: signing ? "none" : "0 0 32px rgba(34,211,238,0.35)" }}
      <TransactionPrioritySelector
        selected={priorityTier}
        onChange={onPriorityChange}
      />
      <div
        className={`rounded-2xl border px-4 py-4 ${
          quickSignReady
            ? "border-emerald-400/25 bg-emerald-400/[0.06]"
            : "border-cyan-400/20 bg-cyan-400/[0.05]"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              quickSignReady
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
            }`}
          >
            {quickSignReady ? <ShieldCheck size={20} /> : <Fingerprint size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-body text-[10px] tracking-[0.14em] text-white/40 uppercase">
                  Biometric Quick-Sign
                </p>
                <p className="mt-1 font-body text-sm font-semibold text-white/85">
                  {quickSignReady
                    ? "Biometric check passed"
                    : hasQuickSignCredential
                      ? "Unlock signing with device biometrics"
                      : "Set up Face ID, Touch ID, or device screen lock"}
                </p>
              </div>
              <button
                type="button"
                onClick={hasQuickSignCredential ? onVerifyQuickSign : onSetupQuickSign}
                disabled={quickSignBusy || quickSignReady || quickSignStatus === "unsupported"}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 font-body text-xs font-bold text-white/75 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {quickSignBusy ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : quickSignReady ? (
                  <ShieldCheck size={15} />
                ) : (
                  <LockKeyhole size={15} />
                )}
                {quickSignBusy
                  ? "Waiting..."
                  : quickSignReady
                    ? "Ready"
                    : hasQuickSignCredential
                      ? "Verify"
                      : "Set Up"}
              </button>
            </div>
            <p className="mt-2 font-body text-xs leading-relaxed text-white/45">
              The Sign button stays locked until this device verifies you with WebAuthn user verification.
              StellarStream stores only a local passkey credential ID for this wallet.
            </p>
            {quickSignStatus === "unsupported" && (
              <p className="mt-2 font-body text-xs text-orange-300/80">
                Device biometrics require a secure browser context with WebAuthn support.
              </p>
            )}
            {quickSignError && (
              <p className="mt-2 font-body text-xs text-red-300/85">{quickSignError}</p>
            )}
          </div>
        </div>
      </div>
      {validationLoading && (
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3 text-cyan-100 text-sm">
          Verifying recipient trustlines and sender balance before allowing confirmation...
        </div>
      )}
      {validationError && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-red-200 text-sm">
          {validationError}
        </div>
      )}
      {claimableRecipients.length > 0 && (
        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.08] px-4 py-3 text-yellow-100 text-sm">
          <p className="font-semibold">{claimableRecipients.length} recipient{claimableRecipients.length !== 1 ? "s" : ""} will need to claim their funds manually.</p>
          <p className="mt-1 text-[11px] text-yellow-100/80">
            The contract will create claimable balances for recipients who cannot receive the selected asset directly.
          </p>
        </div>
      )}
      {hasRecipientIssues && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-red-200 text-sm">
          Some split recipients have an invalid Stellar address and must be corrected before submission.
        </div>
      )}
      {balanceValidation === "insufficient_asset" && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-red-200 text-sm">
          Your Stellar account does not hold enough {form.asset || "the selected asset"} to cover the total amount.
        </div>
      )}
      {balanceValidation === "insufficient_xlm" && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-red-200 text-sm">
          You do not have enough native XLM for transaction fees.
        </div>
      )}
      {/* ── Recovery cards ── */}
      {recoveryError === "insufficient-xlm" && (
        <InsufficientXLMCard
          currentBalance={1.2}
          requiredBalance={5}
          onSwap={onSwapToXLM}
          onDismiss={onDismissRecovery}
        />
      )}
      {recoveryError === "network-congested" && (
        <NetworkCongestedCard
          baseFee={100}
          suggestedFee={500}
          onAcceptFee={onAcceptFee}
          onRetry={onSign}
          onDismiss={onDismissRecovery}
        />
      )}

      <Can
        permission="submit_to_ledger"
        fallback={
          <button
            disabled
            className="w-full rounded-2xl bg-white/10 py-4 font-body text-base font-bold text-white/25 cursor-not-allowed"
          >
            Submit to Ledger — Insufficient Role
          </button>
        }
      >
        <button
          onClick={onSign}
          disabled={confirmDisabled}
          className="w-full rounded-2xl bg-cyan-400 py-4 font-body text-base font-bold text-black transition-all duration-200 hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ boxShadow: confirmDisabled ? "none" : "0 0 32px rgba(34,211,238,0.35)" }}
        >
          {signing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Awaiting Signature…
            </span>
          ) : (
            "Sign & Create Stream ✦"
          )}
        </button>
      </Can>

      <p className="text-center font-body text-[11px] text-white/20">
        You will be prompted to sign this transaction in your wallet
      </p>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ form, onReset }: { form: FormData; onReset: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center space-y-6"
      style={{ animation: "successIn 0.4s cubic-bezier(0.16,1,0.3,1)" }}
    >
      <style>{`@keyframes successIn { from { opacity:0; transform:scale(0.88) translateY(16px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>

      <div
        className="h-20 w-20 rounded-full flex items-center justify-center text-3xl"
        style={{
          background: "rgba(34,211,238,0.12)",
          border: "1px solid rgba(34,211,238,0.4)",
          boxShadow: "0 0 48px rgba(34,211,238,0.3), 0 0 80px rgba(34,211,238,0.1)",
        }}
      >
        ✦
      </div>

      <div>
        <p className="font-body text-xs tracking-[0.15em] text-cyan-400/70 uppercase mb-2">Stream Created</p>
        <h2 className="font-heading text-3xl md:text-4xl">It's live.</h2>
        <p className="font-body mt-3 text-sm text-white/50 max-w-sm mx-auto">
          Your stream of{" "}
          <span className="text-cyan-400 font-bold">{fmt(parseFloat(form.totalAmount) || 0)} {form.asset}</span>{" "}
          is now streaming on-chain.
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 flex items-center gap-3">
        <span className="font-body text-[10px] text-white/30 uppercase tracking-wider">Stream ID</span>
        <code className="font-body text-xs text-cyan-400">0x4f3a…b92c</code>
        <button className="font-body text-xs text-white/30 hover:text-white/60 transition">⎘</button>
      </div>

      <div className="flex gap-3 w-full">
        <button
          className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] py-3 font-body text-sm text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
          onClick={() => { }}
        >
          View Stream →
        </button>
        <button
          className="flex-1 rounded-2xl bg-cyan-400 py-3 font-body text-sm font-bold text-black transition hover:bg-cyan-300 hover:shadow-[0_0_0_2px_rgba(34,211,238,0.6),0_0_16px_rgba(34,211,238,0.3)]"
          onClick={onReset}
        >
          + New Stream
        </button>
      </div>
    </div>
  );
}

// ─── Main Wizard Page ─────────────────────────────────────────────────────────
export default function CreateStreamPage() {
  const [step, setStep] = useState(1);
  const [prevStep, setPrevStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [recoveryError, setRecoveryError] = useState<RecoveryErrorType | null>(null);
  const [signAttempts, setSignAttempts] = useState(0);
  const [recipientValidation, setRecipientValidation] = useState<Record<string, RecipientValidationStatus>>({});
  const [balanceValidation, setBalanceValidation] = useState<BalanceValidationStatus>("pending");
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [quickSignStatus, setQuickSignStatus] = useState<QuickSignStatus>("checking");
  const [quickSignError, setQuickSignError] = useState<string | null>(null);
  const [hasQuickSignCredential, setHasQuickSignCredential] = useState(false);
  const wallet = useWallet();

  // ── Transaction priority (#456) ──────────────────────────────────────────────
  const { tier: priorityTier, setTierId: setPriorityTierId, totalFeeStroops } = useTransactionPriority();
  const feeStroops = totalFeeStroops(0);

  // ── Emergency gate (#426) ────────────────────────────────────────────────────
  const { isEmergency } = useProtocolStatus();

  // ── Hardware wallet timeout (#XXX) ───────────────────────────────────────────
  const {
    confirmModalOpen,
    activeDeviceName,
    closeConfirmModal,
    prepareForSigning,
    getTimeout,
  } = useHardwareWalletTimeout();

  const update = useCallback((patch: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    setQuickSignError(null);

    if (!wallet.address) {
      setHasQuickSignCredential(false);
      setQuickSignStatus("needs_setup");
      return;
    }

    if (!isWebAuthnAvailable()) {
      setHasQuickSignCredential(false);
      setQuickSignStatus("unsupported");
      return;
    }

    const credential = loadQuickSignCredential(wallet.address);
    setHasQuickSignCredential(!!credential);
    setQuickSignStatus(credential ? "locked" : "needs_setup");
  }, [wallet.address]);

  const setupQuickSign = useCallback(async () => {
    if (!wallet.address) {
      setQuickSignError("Connect your wallet before setting up Quick-Sign.");
      return;
    }

    try {
      setQuickSignStatus("verifying");
      setQuickSignError(null);
      await registerQuickSignCredential(wallet.address);
      setHasQuickSignCredential(true);
      setQuickSignStatus("verified");
    } catch (error) {
      setQuickSignStatus(hasQuickSignCredential ? "locked" : "needs_setup");
      setQuickSignError(error instanceof Error ? error.message : "Quick-Sign setup failed.");
    }
  }, [hasQuickSignCredential, wallet.address]);

  const verifyQuickSign = useCallback(async () => {
    if (!wallet.address) {
      setQuickSignError("Connect your wallet before verifying Quick-Sign.");
      return;
    }

    try {
      setQuickSignStatus("verifying");
      setQuickSignError(null);
      await verifyQuickSignCredential(wallet.address);
      setHasQuickSignCredential(true);
      setQuickSignStatus("verified");
    } catch (error) {
      setQuickSignStatus(hasQuickSignCredential ? "locked" : "needs_setup");
      setQuickSignError(error instanceof Error ? error.message : "Biometric verification failed.");
    }
  }, [hasQuickSignCredential, wallet.address]);

  useEffect(() => {
    let cancelled = false;
    const addresses = Array.from(
      new Set(form.splitRecipients.map((recipient) => recipient.address.trim()).filter(Boolean))
    );

    if (!addresses.length || !form.asset) {
      setRecipientValidation({});
      return;
    }

    const validateRecipients = async () => {
      setValidationLoading(true);
      setValidationError(null);

      const checks = await Promise.all(
        addresses.map(async (address) => {
          try {
            const account = await HORIZON_SERVER.loadAccount(address);
            return [address, getAccountStatus(form.asset, account)] as const;
          } catch (error) {
            const status = isHorizonNotFound(error) ? "account_not_funded" : "invalid_address";
            return [address, status] as const;
          }
        })
      );

      if (!cancelled) {
        setRecipientValidation(Object.fromEntries(checks));
        setValidationLoading(false);
      }
    };

    validateRecipients();

    return () => {
      cancelled = true;
    };
  }, [form.splitRecipients, form.asset]);

  useEffect(() => {
    let cancelled = false;
    const amount = parseFloat(form.totalAmount);

    if (!wallet.address || !form.asset || isNaN(amount) || amount <= 0) {
      setBalanceValidation("pending");
      return;
    }

    const address = wallet.address;

    const validateBalance = async () => {
      try {
        const account = await HORIZON_SERVER.loadAccount(address);
        const nativeBalance = getBalanceForAsset(account, "XLM");
        const assetBalance = getBalanceForAsset(account, form.asset);
        const feeXlm = feeStroops === 0 ? 0 : feeStroopsToXlm(feeStroops);

        if (form.asset.toUpperCase() === "XLM") {
          if (nativeBalance < amount + feeXlm) {
            setBalanceValidation("insufficient_xlm");
            return;
          }
        } else {
          if (assetBalance < amount) {
            setBalanceValidation("insufficient_asset");
            return;
          }
          if (nativeBalance < feeXlm) {
            setBalanceValidation("insufficient_xlm");
            return;
          }
        }

        if (!cancelled) {
          setBalanceValidation("ok");
        }
      } catch (error) {
        if (!cancelled) {
          setBalanceValidation("insufficient_xlm");
        }
      }
    };

    validateBalance();

    return () => {
      cancelled = true;
    };
  }, [wallet.address, form.asset, form.totalAmount, feeStroops]);

  const direction = step > prevStep ? "enter" : "enter";

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!form.asset) errs.asset = "Select an asset.";
      if (!form.recipientAddress) errs.recipient = "Enter a recipient address.";
      else if (!form.recipientAddress.startsWith("0x") && !form.recipientAddress.endsWith(".eth"))
        errs.recipient = "Enter a valid address (0x…) or ENS name.";
      if (form.splitEnabled) {
        if (!form.splitAddress)
          errs.split = "Enter a split recipient address.";
        else if (!isValidStellarAddress(form.splitAddress))
          errs.split = "Split address must be a valid Stellar G… address (56 characters).";
      }
    }
    if (s === 2) {
      const n = parseFloat(form.totalAmount);
      if (!form.totalAmount || isNaN(n) || n <= 0) errs.amount = "Enter a valid amount.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setPrevStep(step);
    setStep((s) => s + 1);
    setAnimKey((k) => k + 1);
  };

  const goBack = () => {
    setPrevStep(step);
    setStep((s) => s - 1);
    setAnimKey((k) => k + 1);
  };

  const handleSign = async () => {
    if (quickSignStatus !== "verified") {
      setQuickSignError("Verify Quick-Sign before opening your wallet for signing.");
      return;
    }

    setSigning(true);
    // totalFeeStroops(0) gives the fee with no simulated resource fee.
    // In production, pass the real simulated resource fee here.
    const feeStoops = totalFeeStroops(0);
    const claimableRecipients = Object.values(recipientValidation).filter((status) =>
      status === "missing_trustline" || status === "account_not_funded"
    );
    const contractAction = claimableRecipients.length > 0 ? "create_claimable_balances" : "split_funds";
    console.info(
      `[CreateStream] Submitting with fee: ${feeStoops} stroops (priority: ${priorityTier.id})`,
    );
    console.info(
      `[CreateStream] Using contract action: ${contractAction} for ${claimableRecipients.length} claimable recipient${claimableRecipients.length !== 1 ? "s" : ""}`,
    );
    setRecoveryError(null);

    // Get hardware wallet timeout configuration
    const { timeoutMs, isHardwareWallet, isLargeTransaction } = getTimeout();
    const timeoutSeconds = Math.ceil(timeoutMs / 1000);

    // Prepare transaction for signing (shows modal if needed)
    const mockXdrTransaction = btoa("mock-transaction-xdr-data");
    prepareForSigning(mockXdrTransaction);

    // Log security info
    if (isHardwareWallet) {
      console.info(
        `[CreateStream] Hardware wallet detected. Using extended timeout: ${timeoutSeconds}s`,
        { isLargeTransaction }
      );
    }

    // Simulate transaction signing with appropriate timeout
    await new Promise((r) => setTimeout(r, 2200));
    setSigning(false);
    closeConfirmModal();

    // Simulate recovery errors on first two attempts for demo purposes
    const attempt = signAttempts + 1;
    setSignAttempts(attempt);
    if (attempt === 1) { setRecoveryError("insufficient-xlm"); return; }
    if (attempt === 2) { setRecoveryError("network-congested"); return; }

    // POST off-chain metadata (Tax ID) — only when a taxId was provided
    if (form.recipientTaxId.trim()) {
      const splitId = `stream-${Date.now()}`;
      await fetch("/api/v3/split/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          splitId,
          recipients: [{ address: form.recipientAddress, taxId: form.recipientTaxId.trim() }],
        }),
      }).catch((err) => console.error("[CreateStream] metadata POST failed", err));
    }

    setSuccess(true);
  };

  const handleAcceptFee = (_fee: number) => {
    // Fee accepted — clear the card and re-attempt sign
    setRecoveryError(null);
    handleSign();
  };

  const reset = () => {
    setForm(INITIAL_FORM);
    setStep(1);
    setSuccess(false);
    setAnimKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col items-center justify-start gap-6">
      <PageNebula />

      {/* ── Emergency gate (#426) — replaces the whole wizard when active ── */}
      {isEmergency && (
        <div className="w-full max-w-2xl">
          <div
            className="rounded-3xl border border-red-500/40 bg-red-500/[0.06] backdrop-blur-xl p-6 md:p-8 flex flex-col items-center text-center gap-4"
            style={{ boxShadow: "0 0 40px rgba(239,68,68,0.12)" }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
              <ShieldAlert size={24} className="text-red-400" />
            </div>
            <div>
              <h2 className="font-heading text-2xl text-red-300">Stream Creation Paused</h2>
              <p className="font-body mt-2 text-sm text-red-200/60 max-w-md">
                The protocol is currently in Emergency Mode. Creating new streams has been
                temporarily disabled. Your existing streams and funds are fully safe.
              </p>
            </div>
            <p className="font-body text-xs text-red-400/40 tracking-wider">
              This page will unlock automatically once the guardian clears the emergency.
            </p>
          </div>
        </div>
      )}

      {/* Page header — hidden during emergency */}
      {!isEmergency && !success && (
        <div className="w-full max-w-2xl">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8">
            <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">New Payment</p>
            <h1 className="font-heading mt-2 text-3xl md:text-5xl">Create a Stream</h1>
            <p className="font-body mt-4 text-white/72">
              Set up a continuous on-chain payment in three steps — asset, rate, then sign.
            </p>
          </section>
        </div>
      )}

      {/* Wizard card — hidden during emergency */}
      {!isEmergency && (
        <div className="w-full max-w-2xl">
          <div
            className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl overflow-hidden"
            style={{
              boxShadow: success
                ? "0 0 0 1px rgba(34,211,238,0.15), 0 40px 80px rgba(0,0,0,0.6), 0 0 120px rgba(34,211,238,0.08)"
                : "0 40px 80px rgba(0,0,0,0.5)",
            }}
          >
            {!success && (
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4 md:px-8">
                <ProgressPill step={step} />
                <span className="font-body text-xs text-white/30 hidden sm:block">
                  Step {step} of {STEPS.length}
                </span>
              </div>
            )}

            <div className="p-6 md:p-8 overflow-hidden">
              {success ? (
                <SuccessScreen form={form} onReset={reset} />
              ) : (
                <SlidePanel key={animKey} direction="enter" id={animKey}>
                  <div className="mb-6">
                    <p className="font-body text-[10px] tracking-[0.15em] text-cyan-400/70 uppercase mb-1">
                      Step {step} — {STEPS[step - 1].label}
                    </p>
                    <h2 className="font-heading text-2xl md:text-3xl">
                      {step === 1 && "Who & What?"}
                      {step === 2 && "How Much & How Long?"}
                      {step === 3 && "Ready to stream?"}
                    </h2>
                  </div>

                  {Object.keys(errors).length > 0 && (
                    <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
                      {Object.values(errors).map((e, i) => (
                        <p key={i} className="font-body text-xs text-red-400">• {e}</p>
                      ))}
                    </div>
                  )}

                  {step === 1 && <Step1 form={form} update={update} recipientValidation={recipientValidation} />}
                  {step === 2 && <Step2 form={form} update={update} />}
                  {step === 3 && <Step3
                    form={form}
                    onSign={handleSign}
                    signing={signing}
                    priorityTier={priorityTier.id}
                    onPriorityChange={setPriorityTierId}
                    recoveryError={recoveryError}
                    onDismissRecovery={() => setRecoveryError(null)}
                    onAcceptFee={handleAcceptFee}
                    onSwapToXLM={() => { setStep(1); setAnimKey((k) => k + 1); }}
                    recipientValidation={recipientValidation}
                    balanceValidation={balanceValidation}
                    validationLoading={validationLoading}
                    validationError={validationError}
                    quickSignStatus={quickSignStatus}
                    quickSignError={quickSignError}
                    hasQuickSignCredential={hasQuickSignCredential}
                    onSetupQuickSign={setupQuickSign}
                    onVerifyQuickSign={verifyQuickSign}
                  />}

                  {step < 3 && (
                    <div className="flex gap-3 mt-8">
                      {step > 1 && (
                        <button
                          onClick={goBack}
                          className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] py-3.5 font-body text-sm text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
                        >
                          ← Back
                        </button>
                      )}
                      <button
                        onClick={goNext}
                        className="flex-1 rounded-2xl bg-cyan-400 py-3.5 font-body text-sm font-bold text-black transition hover:bg-cyan-300"
                        style={{ boxShadow: "0 0 20px rgba(34,211,238,0.3)" }}
                      >
                        Continue →
                      </button>
                    </div>
                  )}

                  {step === 3 && (
                    <Can permission="edit_draft">
                      <button
                        onClick={goBack}
                        className="w-full mt-3 rounded-2xl border border-white/10 bg-white/[0.03] py-3 font-body text-sm text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
                      >
                        ← Edit Details
                      </button>
                    </Can>
                  )}
                </SlidePanel>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm on Device Modal — for hardware wallets */}
      <ConfirmOnDeviceModal
        isOpen={confirmModalOpen}
        walletType="hardware"
        deviceName={activeDeviceName || "Hardware Wallet"}
        timeoutSeconds={Math.ceil(getTimeout().timeoutMs / 1000)}
        isLargeTransaction={getTimeout().isLargeTransaction}
        onTimeout={() => {
          closeConfirmModal();
          setSigning(false);
          setRecoveryError("network-congested");
        }}
        onConfirmed={() => {
          closeConfirmModal();
        }}
      />
    </div>
  );
}
