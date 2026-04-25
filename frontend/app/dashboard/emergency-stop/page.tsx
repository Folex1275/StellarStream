"use client";

// #774 – Emergency-Stop Dashboard Control
// Double-confirmation "Panic Button" for admins; reflects paused state globally.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ShieldOff, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { useAdminGuard } from "@/lib/use-admin-guard";
import { useProtocolStatus } from "@/lib/use-protocol-status";

type PanicState = "idle" | "confirm1" | "confirm2" | "pending" | "done";

// Stub: replace with real Soroban invocation of `emergency_pause`
async function invokeEmergencyPause(): Promise<void> {
  await new Promise((r) => setTimeout(r, 2000));
}

export default function EmergencyStopPage() {
  const guard = useAdminGuard();
  const { isEmergency } = useProtocolStatus();
  const [panicState, setPanicState] = useState<PanicState>("idle");
  const [confirmText, setConfirmText] = useState("");

  if (guard.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (guard.status === "unauthorized") return null;

  async function handleFinalConfirm() {
    if (confirmText !== "PAUSE") return;
    setPanicState("pending");
    await invokeEmergencyPause();
    setPanicState("done");
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="text-red-400 h-7 w-7 flex-shrink-0" />
        <div>
          <h1 className="text-xl font-bold">Emergency Stop</h1>
          <p className="text-sm text-white/50 mt-0.5">
            Immediately pause all protocol activity.
          </p>
        </div>
      </div>

      {/* Global paused status indicator */}
      <div
        className={`rounded-xl border px-4 py-3 mb-8 flex items-center gap-3 text-sm ${
          isEmergency
            ? "border-red-500/30 bg-red-500/10 text-red-300"
            : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
        }`}
      >
        {isEmergency ? (
          <ShieldAlert size={16} className="flex-shrink-0" />
        ) : (
          <CheckCircle2 size={16} className="flex-shrink-0" />
        )}
        <span>
          Protocol is currently{" "}
          <strong>{isEmergency ? "PAUSED" : "ACTIVE"}</strong>.
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Idle: show panic button ── */}
        {panicState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              disabled={isEmergency}
              onClick={() => setPanicState("confirm1")}
              className="w-full rounded-2xl border-2 border-red-500/40 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed py-6 flex flex-col items-center gap-2 transition-colors group"
            >
              <ShieldAlert className="h-10 w-10 text-red-400 group-hover:scale-110 transition-transform" />
              <span className="text-lg font-bold text-red-300">
                {isEmergency ? "Protocol Already Paused" : "Trigger Emergency Pause"}
              </span>
              {!isEmergency && (
                <span className="text-xs text-red-400/60">
                  This will halt all streams and deposits immediately.
                </span>
              )}
            </button>
          </motion.div>
        )}

        {/* ── Confirm step 1 ── */}
        {panicState === "confirm1" && (
          <motion.div
            key="confirm1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle size={18} />
              <span className="font-semibold">Security Check — Step 1 of 2</span>
            </div>
            <p className="text-sm text-white/60">
              You are about to pause the entire StellarStream protocol. All active
              streams will be frozen. Are you sure you want to continue?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPanicState("idle")}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-white/50 hover:text-white hover:border-white/20 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setPanicState("confirm2")}
                className="flex-1 rounded-xl bg-yellow-600 hover:bg-yellow-500 py-2.5 font-semibold text-sm transition-colors"
              >
                Yes, Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Confirm step 2: type PAUSE ── */}
        {panicState === "confirm2" && (
          <motion.div
            key="confirm2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-red-400">
              <ShieldOff size={18} />
              <span className="font-semibold">Security Check — Step 2 of 2</span>
            </div>
            <p className="text-sm text-white/60">
              Type <strong className="text-white">PAUSE</strong> below to confirm
              the emergency stop.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="PAUSE"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-mono text-white placeholder-white/20 focus:outline-none focus:border-red-500/60 transition-colors"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setPanicState("idle"); setConfirmText(""); }}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-white/50 hover:text-white hover:border-white/20 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                disabled={confirmText !== "PAUSE"}
                onClick={handleFinalConfirm}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 font-semibold text-sm transition-colors"
              >
                Execute Emergency Pause
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Pending ── */}
        {panicState === "pending" && (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-16"
          >
            <Loader2 className="h-10 w-10 text-red-400 animate-spin" />
            <p className="text-white/60">Invoking emergency_pause on-chain…</p>
          </motion.div>
        )}

        {/* ── Done ── */}
        {panicState === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <ShieldAlert className="h-12 w-12 text-red-400" />
            <p className="text-lg font-bold text-red-300">Protocol Paused</p>
            <p className="text-sm text-white/50">
              The emergency_pause transaction was submitted. The global status
              banner will reflect the new state within the next polling cycle.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
