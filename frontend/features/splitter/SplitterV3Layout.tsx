"use client";

/**
 * SplitterV3Layout
 * Issue: V3 Splitter foundational layout
 *
 * Architecture:
 *  - Sticky header: Asset Selector + Split Mode toggle (Push / Pull)
 *  - Two-column body: Left = VirtualRecipientGrid, Right = Split Summary Sidebar
 *  - Three wizard states: "setup" → "review" → "execute"
 *  - Framer Motion AnimatePresence for step transitions
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Zap,
  ArrowDownToLine,
  CheckCircle2,
  Loader2,
  Users,
  Coins,
} from "lucide-react";
import { VirtualRecipientGrid, emptyRow, type GridRow } from "./VirtualRecipientGrid";
import { CsvUploadWizard, type MappedRow } from "./CsvUploadWizard";
import { useOrgMembers } from "@/lib/hooks/use-org-members";
import type { DirectoryEntry } from "@/lib/fuzzy-address-match";

// ── Types ─────────────────────────────────────────────────────────────────────

type SplitMode = "push" | "pull";
type WorkflowStep = "setup" | "review" | "execute";

const ASSETS = ["USDC", "XLM", "BRLG", "ARST"] as const;
type Asset = (typeof ASSETS)[number];

const STEP_ORDER: WorkflowStep[] = ["setup", "review", "execute"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function stepIndex(s: WorkflowStep) {
  return STEP_ORDER.indexOf(s);
}

// ── Main layout ───────────────────────────────────────────────────────────────

const DEFAULT_ORG_ADDRESS = "demo-org";

export function SplitterV3Layout() {
  const [asset, setAsset] = useState<Asset>("USDC");
  const [mode, setMode] = useState<SplitMode>("push");
  const [step, setStep] = useState<WorkflowStep>("setup");
  const [rows, setRows] = useState<GridRow[]>([emptyRow()]);
  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);
  const [showCsvWizard, setShowCsvWizard] = useState(false);

  // ── Organization Directory (for fuzzy address matching) ────────────────────
  const { members } = useOrgMembers(DEFAULT_ORG_ADDRESS);
  const directory: DirectoryEntry[] = useMemo(
    () =>
      members.map((m) => ({
        address: m.address,
        name: m.displayName || undefined,
      })),
    [members],
  );

  // ── Derived stats ──────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const validRows = rows.filter(
      (r) => r.address.startsWith("G") && r.address.length === 56,
    );
    const total = rows.reduce((s, r) => {
      const n = parseFloat(r.amount);
      return s + (isNaN(n) ? 0 : n);
    }, 0);
    const errorCount = rows.filter((r) => r.errors.address || r.errors.amount).length;
    return { validRows: validRows.length, total, errorCount, rowCount: rows.length };
  }, [rows]);

  const canAdvance =
    step === "setup"
      ? stats.validRows > 0 && stats.errorCount === 0
      : step === "review";

  // ── CSV import ─────────────────────────────────────────────────────────────

  function handleCsvImport(mapped: MappedRow[]) {
    const imported: GridRow[] = mapped.map((m) => ({
      id: crypto.randomUUID(),
      address: m.address,
      amount: m.amount,
      errors: {},
    }));
    setRows((prev) => {
      // Replace placeholder empty rows, then append
      const nonEmpty = prev.filter((r) => r.address || r.amount);
      return [...nonEmpty, ...imported];
    });
    setShowCsvWizard(false);
  }

  // ── Execute (stub) ─────────────────────────────────────────────────────────

  async function handleExecute() {
    setExecuting(true);
    await new Promise((r) => setTimeout(r, 1800)); // simulate tx submission
    setExecuting(false);
    setExecuted(true);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-[#080c12] text-white">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#080c12]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">
          {/* Title */}
          <span className="font-heading text-sm font-bold text-white/80 mr-auto">
            Splitter <span className="text-cyan-400">V3</span>
          </span>

          {/* Asset selector */}
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            {ASSETS.map((a) => (
              <button
                key={a}
                onClick={() => setAsset(a)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${asset === a
                  ? "bg-cyan-500/15 text-cyan-400"
                  : "text-white/40 hover:text-white/60"
                  }`}
              >
                {a}
              </button>
            ))}
          </div>

          {/* Split mode toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            <ModeButton
              active={mode === "push"}
              onClick={() => setMode("push")}
              icon={<Zap className="h-3 w-3" />}
              label="Push"
              title="Sender initiates — funds sent directly to recipients"
            />
            <ModeButton
              active={mode === "pull"}
              onClick={() => setMode("pull")}
              icon={<ArrowDownToLine className="h-3 w-3" />}
              label="Pull"
              title="Recipients claim their allocation"
            />
          </div>

          {/* Step breadcrumb */}
          <StepBreadcrumb current={step} />
        </div>
      </header>

      {/* ── Body ── */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-6 py-6">
        <AnimatePresence mode="wait">
          {/* ── Setup step ── */}
          {step === "setup" && (
            <motion.div
              key="setup"
              className="flex flex-1 gap-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Left: Grid + CSV import */}
              <div className="flex flex-1 flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-base font-bold text-white/80">
                    Recipients
                  </h2>
                  <button
                    onClick={() => setShowCsvWizard((v) => !v)}
                    className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-white/50 hover:text-cyan-400/80 transition-colors"
                  >
                    {showCsvWizard ? "Hide CSV import" : "Import CSV"}
                  </button>
                </div>

                <AnimatePresence>
                  {showCsvWizard && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
                    >
                      <CsvUploadWizard onComplete={handleCsvImport} directory={directory} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <VirtualRecipientGrid rows={rows} onChange={setRows} directory={directory} />
              </div>

              {/* Right: Summary sidebar */}
              <SplitSummary
                asset={asset}
                mode={mode}
                stats={stats}
                canAdvance={canAdvance}
                onAdvance={() => setStep("review")}
              />
            </motion.div>
          )}

          {/* ── Review step ── */}
          {step === "review" && (
            <motion.div
              key="review"
              className="flex flex-1 gap-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Left: read-only row list */}
              <div className="flex flex-1 flex-col gap-4">
                <h2 className="font-heading text-base font-bold text-white/80">
                  Review Split
                </h2>
                <div className="overflow-y-auto rounded-xl border border-white/[0.08]" style={{ maxHeight: 480 }}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#0d1117]">
                      <tr className="border-b border-white/[0.06]">
                        <th className="px-3 py-2 text-left text-white/40">#</th>
                        <th className="px-3 py-2 text-left text-white/40">Address</th>
                        <th className="px-3 py-2 text-left text-white/40">Amount ({asset})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows
                        .filter((r) => r.address && r.amount)
                        .map((r, i) => (
                          <tr key={r.id} className="border-b border-white/[0.04] last:border-0">
                            <td className="px-3 py-1.5 text-white/20">{i + 1}</td>
                            <td className="px-3 py-1.5 font-mono text-white/60 max-w-[260px] truncate">{r.address}</td>
                            <td className="px-3 py-1.5 text-white/70">{r.amount}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: summary + actions */}
              <SplitSummary
                asset={asset}
                mode={mode}
                stats={stats}
                canAdvance={canAdvance}
                onAdvance={() => setStep("execute")}
                onBack={() => setStep("setup")}
                advanceLabel="Confirm & Execute →"
              />
            </motion.div>
          )}

          {/* ── Execute step ── */}
          {step === "execute" && (
            <motion.div
              key="execute"
              className="flex flex-1 flex-col items-center justify-center gap-6 py-16"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
            >
              {executed ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle2 className="h-16 w-16 text-emerald-400" />
                  </motion.div>
                  <div className="text-center">
                    <p className="font-heading text-xl font-bold text-white">Split executed!</p>
                    <p className="mt-1 text-sm text-white/40">
                      {stats.validRows} recipients · {stats.total.toLocaleString()} {asset}
                    </p>
                  </div>
                  <button
                    onClick={() => { setStep("setup"); setExecuted(false); setRows([emptyRow()]); }}
                    className="rounded-xl border border-white/[0.08] px-6 py-2.5 text-sm text-white/50 hover:text-white/70 transition-colors"
                  >
                    New split
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className="font-heading text-xl font-bold text-white">Ready to execute</p>
                    <p className="mt-1 text-sm text-white/40">
                      {stats.validRows} recipients · {stats.total.toLocaleString()} {asset} · {mode === "push" ? "Push" : "Pull"} mode
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep("review")}
                      className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm text-white/50 hover:text-white/70 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleExecute}
                      disabled={executing}
                      className="flex items-center gap-2 rounded-xl bg-cyan-500/15 px-6 py-2.5 text-sm font-bold text-cyan-400 hover:bg-cyan-500/25 disabled:opacity-60 transition-all"
                    >
                      {executing ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                      ) : (
                        "Execute split"
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ModeButton({
  active, onClick, icon, label, title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${active ? "bg-cyan-500/15 text-cyan-400" : "text-white/40 hover:text-white/60"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StepBreadcrumb({ current }: { current: WorkflowStep }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      {STEP_ORDER.map((s, i) => (
        <span key={s} className="flex items-center gap-1.5">
          <span
            className={
              s === current
                ? "font-semibold text-cyan-400"
                : stepIndex(s) < stepIndex(current)
                  ? "text-white/40"
                  : "text-white/20"
            }
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
          {i < STEP_ORDER.length - 1 && <ChevronRight className="h-3 w-3 text-white/20" />}
        </span>
      ))}
    </div>
  );
}

interface SplitSummaryProps {
  asset: Asset;
  mode: SplitMode;
  stats: { validRows: number; total: number; errorCount: number; rowCount: number };
  canAdvance: boolean;
  onAdvance: () => void;
  onBack?: () => void;
  advanceLabel?: string;
}

function SplitSummary({
  asset, mode, stats, canAdvance, onAdvance, onBack, advanceLabel = "Review →",
}: SplitSummaryProps) {
  return (
    <aside className="w-72 shrink-0">
      <div className="sticky top-20 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-5">
        <h3 className="font-heading text-sm font-bold text-white/70">Split Summary</h3>

        {/* Stats */}
        <div className="space-y-3">
          <SummaryRow icon={<Users className="h-3.5 w-3.5" />} label="Recipients" value={String(stats.validRows)} />
          <SummaryRow
            icon={<Coins className="h-3.5 w-3.5" />}
            label={`Total (${asset})`}
            value={stats.total > 0 ? stats.total.toLocaleString() : "—"}
            highlight
          />
          <SummaryRow
            label="Mode"
            value={mode === "push" ? "⚡ Push" : "⬇ Pull"}
          />
          {stats.errorCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2 text-xs text-amber-300">
              {stats.errorCount} validation error{stats.errorCount !== 1 ? "s" : ""} — fix before continuing
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onAdvance}
            disabled={!canAdvance}
            className="w-full rounded-xl bg-cyan-500/10 py-2.5 text-sm font-bold text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {advanceLabel}
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="w-full rounded-xl border border-white/[0.06] py-2 text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              ← Back to setup
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function SummaryRow({
  icon, label, value, highlight,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-white/40">
        {icon}
        {label}
      </span>
      <span className={highlight ? "font-semibold text-cyan-400/90" : "text-white/60"}>{value}</span>
    </div>
  );
}
