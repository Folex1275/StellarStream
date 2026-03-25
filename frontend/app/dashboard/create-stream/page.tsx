"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ShieldAlert } from "lucide-react";
import { useProtocolStatus } from "@/lib/use-protocol-status";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  // Step 1
  asset: string;
  recipientAddress: string;
  recipientLabel: string;
  // Stream Splitter (Issue #55)
  splitEnabled: boolean;
  splitAddress: string;
  splitPercent: number; // 0–50
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
  splitEnabled: false,
  splitAddress: "",
  splitPercent: 10,
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
}: {
  form: FormData;
  update: (patch: Partial<FormData>) => void;
}) {
  const [focused, setFocused] = useState(false);

  const addressDirty = form.splitAddress.length > 0;
  const addressValid = isValidStellarAddress(form.splitAddress);
  const addressError = addressDirty && !addressValid;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-[10px] tracking-[0.12em] text-white/50 uppercase">
            Split Stream
          </p>
          <p className="font-body text-xs text-white/30 mt-0.5">
            Route a portion to a second wallet
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.splitEnabled}
          onClick={() => update({ splitEnabled: !form.splitEnabled })}
          className="relative h-6 w-11 rounded-full border transition-all duration-300 focus:outline-none"
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
}: {
  form: FormData;
  update: (patch: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-6">
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

      <div className="h-px bg-white/[0.06]" />

      <StreamSplitter form={form} update={update} />
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
}: {
  form: FormData;
  onSign: () => void;
  signing: boolean;
}) {
  const asset = ASSETS.find((a) => a.symbol === form.asset);
  const durationSeconds =
    DURATION_PRESETS.find((p) => p.label === form.durationPreset)?.seconds ?? 0;
  const ratePerSec = calcRatePerSecond(form.totalAmount, durationSeconds);
  const displayRate = calcDisplayRate(ratePerSec, form.rateType);
  const endDate = durationSeconds > 0 ? new Date(Date.now() + durationSeconds * 1000) : null;

  const rows = [
    { label: "Asset", value: `${asset?.icon ?? ""} ${form.asset}` },
    {
      label: "Recipient", value: form.recipientLabel
        ? `${form.recipientLabel} · ${form.recipientAddress.slice(0, 10)}…`
        : `${form.recipientAddress.slice(0, 14)}…`
    },
    { label: "Total", value: `${fmt(parseFloat(form.totalAmount) || 0)} ${form.asset}` },
    { label: "Rate", value: `${fmt(displayRate)} ${form.asset} ${RATE_LABELS[form.rateType]}` },
    { label: "Duration", value: form.durationPreset },
    { label: "End Date", value: endDate ? fmtDate(endDate) : "—" },
    ...(form.splitEnabled ? [
      { label: "Split To", value: `${form.splitAddress.slice(0, 6)}…${form.splitAddress.slice(-4)}`, accent: true },
      { label: "Split %", value: `${form.splitPercent}% → ${100 - form.splitPercent}% primary`, accent: true },
    ] : []),
  ];

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

      <div className="flex gap-3 rounded-2xl border border-orange-400/20 bg-orange-400/[0.05] px-4 py-3">
        <span className="text-orange-400 text-sm flex-shrink-0 mt-0.5">⚠</span>
        <p className="font-body text-xs text-orange-300/70 leading-relaxed">
          Streams are immutable once created. Cancellation will stop the stream and return remaining funds.
          Ensure all details are correct before signing.
        </p>
      </div>

      <button
        onClick={onSign}
        disabled={signing}
        className="w-full rounded-2xl bg-cyan-400 py-4 font-body text-base font-bold text-black transition-all duration-200 hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ boxShadow: signing ? "none" : "0 0 32px rgba(34,211,238,0.35)" }}
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

  // ── Emergency gate (#426) ────────────────────────────────────────────────────
  const { isEmergency } = useProtocolStatus();

  const update = useCallback((patch: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

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
    setSigning(true);
    await new Promise((r) => setTimeout(r, 2200));
    setSigning(false);
    setSuccess(true);
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

                  {step === 1 && <Step1 form={form} update={update} />}
                  {step === 2 && <Step2 form={form} update={update} />}
                  {step === 3 && <Step3 form={form} onSign={handleSign} signing={signing} />}

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
                    <button
                      onClick={goBack}
                      className="w-full mt-3 rounded-2xl border border-white/10 bg-white/[0.03] py-3 font-body text-sm text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
                    >
                      ← Edit Details
                    </button>
                  )}
                </SlidePanel>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}