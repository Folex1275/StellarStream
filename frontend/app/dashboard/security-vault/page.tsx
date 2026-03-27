"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  ShieldOff,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  KeyRound,
} from "lucide-react";
import { useAdminGuard } from "@/lib/use-admin-guard";
import { Can } from "@/components/Can";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToggleState = "idle" | "confirming" | "pending" | "done";

interface SignatureEntry {
  id: string;
  action: string;
  description: string;
  requiredSigs: number;
  collectedSigs: { address: string; signedAt: Date }[];
  status: "pending" | "ready" | "executed" | "expired";
  expiresAt: Date;
}

// ─── Mock data — replace with contract/API calls ──────────────────────────────

const MOCK_QUEUE: SignatureEntry[] = [
  {
    id: "sig-001",
    action: "EMERGENCY_PAUSE",
    description: "Pause all protocol streams and disable new deposits.",
    requiredSigs: 3,
    collectedSigs: [
      { address: "GABC...1234", signedAt: new Date(Date.now() - 3_600_000) },
      { address: "GDEF...5678", signedAt: new Date(Date.now() - 1_800_000) },
    ],
    status: "pending",
    expiresAt: new Date(Date.now() + 86_400_000),
  },
  {
    id: "sig-002",
    action: "MIGRATION_PAUSE",
    description: "Halt V1→V2 migration pipeline until audit completes.",
    requiredSigs: 2,
    collectedSigs: [
      { address: "GHIJ...9012", signedAt: new Date(Date.now() - 7_200_000) },
      { address: "GKLM...3456", signedAt: new Date(Date.now() - 900_000) },
    ],
    status: "ready",
    expiresAt: new Date(Date.now() + 43_200_000),
  },
  {
    id: "sig-003",
    action: "FEE_UPDATE",
    description: "Update protocol fee from 0.1% to 0.05%.",
    requiredSigs: 3,
    collectedSigs: [
      { address: "GNOP...7890", signedAt: new Date(Date.now() - 10_800_000) },
    ],
    status: "pending",
    expiresAt: new Date(Date.now() + 172_800_000),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function fmtExpiry(date: Date) {
  const h = Math.max(0, Math.floor((date.getTime() - Date.now()) / 3_600_000));
  const m = Math.max(
    0,
    Math.floor(((date.getTime() - Date.now()) % 3_600_000) / 60_000)
  );
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

const STATUS_STYLES: Record<
  SignatureEntry["status"],
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  ready: {
    label: "Ready to Execute",
    color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  executed: {
    label: "Executed",
    color: "text-white/40 border-white/10 bg-white/5",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  expired: {
    label: "Expired",
    color: "text-red-400 border-red-400/30 bg-red-400/10",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KillSwitchToggle({
  label,
  description,
  icon: Icon,
  activeColor,
  activeLabel,
  inactiveLabel,
}: {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  activeColor: string;
  activeLabel: string;
  inactiveLabel: string;
}) {
  const [active, setActive] = useState(false);
  const [toggleState, setToggleState] = useState<ToggleState>("idle");

  async function handleToggle() {
    if (toggleState !== "idle") return;
    setToggleState("confirming");
  }

  async function handleConfirm() {
    setToggleState("pending");
    // Simulate contract call — replace with actual Soroban invocation
    await new Promise((r) => setTimeout(r, 1800));
    setActive((v) => !v);
    setToggleState("done");
    setTimeout(() => setToggleState("idle"), 2000);
  }

  return (
    <div
      className={`glass-card p-5 transition-all duration-300 ${
        active ? `border-${activeColor}/40 shadow-[0_0_24px_rgba(0,0,0,0.4)]` : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300 ${
              active
                ? `border-${activeColor}/40 bg-${activeColor}/15`
                : "border-white/10 bg-white/5"
            }`}
          >
            <Icon
              className={`h-5 w-5 transition-colors duration-300 ${
                active ? `text-${activeColor}` : "text-white/50"
              }`}
            />
          </div>
          <div>
            <p className="font-body text-sm font-medium text-white">{label}</p>
            <p className="font-body mt-0.5 text-xs text-white/50">
              {description}
            </p>
          </div>
        </div>

        {/* Toggle pill */}
        <button
          onClick={handleToggle}
          disabled={toggleState !== "idle"}
          aria-pressed={active}
          aria-label={`${label}: currently ${active ? activeLabel : inactiveLabel}`}
          className={`relative flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60 ${
            active
              ? `border-${activeColor}/50 bg-${activeColor}/25`
              : "border-white/15 bg-white/8"
          }`}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className={`absolute h-5 w-5 rounded-full shadow-md transition-colors duration-300 ${
              active ? `left-[30px] bg-${activeColor}` : "left-[3px] bg-white/40"
            }`}
          />
        </button>
      </div>

      {/* Status label */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-300 ${
            active
              ? `border-${activeColor}/30 bg-${activeColor}/10 text-${activeColor}`
              : "border-white/10 bg-white/5 text-white/40"
          }`}
        >
          {active ? (
            <Lock className="h-3 w-3" />
          ) : (
            <Unlock className="h-3 w-3" />
          )}
          {active ? activeLabel : inactiveLabel}
        </span>
      </div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {toggleState === "confirming" && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
          >
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <p className="font-body text-xs text-red-300">
                This action requires your wallet signature and will be broadcast
                to the multisig queue. Confirm only if you are certain.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-colors"
              >
                Confirm &amp; Sign
              </button>
              <button
                onClick={() => setToggleState("idle")}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {toggleState === "pending" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 text-xs text-white/50"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Broadcasting to Soroban…
          </motion.div>
        )}

        {toggleState === "done" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 text-xs text-emerald-400"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Transaction submitted to signature queue.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SignatureQueueCard({ entry }: { entry: SignatureEntry }) {
  const style = STATUS_STYLES[entry.status];
  const progress = (entry.collectedSigs.length / entry.requiredSigs) * 100;

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-ticker text-xs text-white/40 mb-0.5">
            {entry.id}
          </p>
          <p className="font-body text-sm font-medium text-white">
            {entry.action}
          </p>
          <p className="font-body text-xs text-white/50 mt-0.5">
            {entry.description}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.color}`}
        >
          {style.icon}
          {style.label}
        </span>
      </div>

      {/* Signature progress bar */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-body text-xs text-white/40">
            Signatures: {entry.collectedSigs.length} / {entry.requiredSigs}
          </span>
          <span className="font-body text-xs text-white/30">
            {fmtExpiry(entry.expiresAt)}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`h-full rounded-full ${
              entry.status === "ready"
                ? "bg-emerald-400"
                : "bg-[#8a00ff]"
            }`}
          />
        </div>
      </div>

      {/* Signer list */}
      <div className="flex flex-wrap gap-2">
        {entry.collectedSigs.map((sig) => (
          <span
            key={sig.address}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span className="font-ticker">{fmtAddress(sig.address)}</span>
          </span>
        ))}
        {Array.from({
          length: entry.requiredSigs - entry.collectedSigs.length,
        }).map((_, i) => (
          <span
            key={`empty-${i}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-white/10 bg-transparent px-2 py-1 text-xs text-white/25"
          >
            <Clock className="h-3 w-3" />
            Awaiting
          </span>
        ))}
      </div>

      {/* Execute button — only shown when ready */}
      {entry.status === "ready" && (
        <Can
          permission="execute_action"
          fallback={
            <button disabled className="w-full rounded-xl border border-dashed border-white/10 py-2 text-xs text-white/25 cursor-not-allowed">
              Execute Action — Insufficient Role
            </button>
          }
        >
          <button className="w-full rounded-xl border border-emerald-400/30 bg-emerald-400/10 py-2 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-400/20">
            Execute Action
          </button>
        </Can>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SecurityVaultPage() {
  const guard = useAdminGuard();
  const [queueFilter, setQueueFilter] = useState<
    "all" | SignatureEntry["status"]
  >("all");

  if (guard.status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (guard.status === "unauthorized") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldOff className="h-12 w-12 text-red-400/60" />
        <p className="font-body text-lg text-white/60">Access Restricted</p>
        <p className="font-body text-sm text-white/30">
          This area is only accessible to protocol administrators.
        </p>
      </div>
    );
  }

  const filteredQueue =
    queueFilter === "all"
      ? MOCK_QUEUE
      : MOCK_QUEUE.filter((e) => e.status === queueFilter);

  return (
    <div className="space-y-8 p-6 pb-24 md:pb-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
          <ShieldAlert className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">
            Security Vault
          </h1>
          <p className="font-body mt-1 text-sm text-white/50">
            Admin-only controls for emergency protocol management. All actions
            require multisig approval.
          </p>
        </div>
      </div>

      {/* ── Admin identity badge ── */}
      <div className="inline-flex items-center gap-2 rounded-xl border border-[#8a00ff]/30 bg-[#8a00ff]/10 px-3 py-1.5">
        <KeyRound className="h-3.5 w-3.5 text-[#c084fc]" />
        <span className="font-ticker text-xs text-[#c084fc]">
          {guard.address}
        </span>
        <span className="rounded-full bg-[#8a00ff]/30 px-1.5 py-0.5 text-[10px] font-medium text-[#c084fc]">
          ADMIN
        </span>
      </div>

      {/* ── Kill-Switch Toggles ── */}
      <section>
        <p className="font-body mb-3 text-xs font-medium uppercase tracking-widest text-white/30">
          Kill-Switch Controls
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <KillSwitchToggle
            label="Emergency Pause"
            description="Immediately halts all active streams and blocks new deposits across the protocol."
            icon={ShieldAlert}
            activeColor="red-500"
            activeLabel="Protocol Paused"
            inactiveLabel="Protocol Active"
          />
          <KillSwitchToggle
            label="Migration Pause"
            description="Suspends the V1→V2 migration pipeline. Existing streams remain unaffected."
            icon={Lock}
            activeColor="orange-400"
            activeLabel="Migration Halted"
            inactiveLabel="Migration Active"
          />
        </div>
      </section>

      {/* ── Signature Queue ── */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-body text-xs font-medium uppercase tracking-widest text-white/30">
            Signature Queue
          </p>
          {/* Filter tabs */}
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            {(["all", "pending", "ready", "executed", "expired"] as const).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setQueueFilter(f)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    queueFilter === f
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {f}
                </button>
              )
            )}
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredQueue.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card flex flex-col items-center gap-2 py-10 text-center"
              >
                <CheckCircle2 className="h-8 w-8 text-white/20" />
                <p className="font-body text-sm text-white/30">
                  No items in this category.
                </p>
              </motion.div>
            ) : (
              filteredQueue.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <SignatureQueueCard entry={entry} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
