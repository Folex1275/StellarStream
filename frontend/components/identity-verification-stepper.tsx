"use client";

// components/identity-verification-stepper.tsx
// Issue #782 — Identity-Verification Progress Stepper
//
// Functional KYC stepper that integrates an external verification SDK
// (Persona / Sumsub) and updates the user's "Verified" status on success.

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type KycStep = "intro" | "document" | "selfie" | "review" | "done" | "failed";

interface IdentityVerificationStepperProps {
  /** Called with the SDK inquiry/applicant ID when verification succeeds. */
  onVerified: (referenceId: string) => void;
  /** Persona/Sumsub SDK launcher — injected so the component stays SDK-agnostic. */
  launchSdk: () => Promise<{ referenceId: string }>;
}

const STEPS: { id: KycStep; label: string }[] = [
  { id: "intro",    label: "Start" },
  { id: "document", label: "Document" },
  { id: "selfie",   label: "Selfie" },
  { id: "review",   label: "Review" },
  { id: "done",     label: "Verified" },
];

const STEP_INDEX: Record<KycStep, number> = {
  intro: 0, document: 1, selfie: 2, review: 3, done: 4, failed: 4,
};

export function IdentityVerificationStepper({
  onVerified,
  launchSdk,
}: IdentityVerificationStepperProps) {
  const [step, setStep] = useState<KycStep>("intro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStep("document");

    try {
      // Simulate step progression while SDK is open
      await new Promise((r) => setTimeout(r, 300));
      setStep("selfie");
      await new Promise((r) => setTimeout(r, 300));
      setStep("review");

      const { referenceId } = await launchSdk();

      setStep("done");
      onVerified(referenceId);
    } catch (err) {
      setStep("failed");
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [launchSdk, onVerified]);

  const activeIndex = STEP_INDEX[step];

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d14] p-6">
      {/* Step indicators */}
      <div className="mb-6 flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex && step !== "failed";
          const failed = step === "failed" && i === activeIndex;
          return (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                    failed
                      ? "bg-red-400/20 text-red-400"
                      : done
                      ? "bg-emerald-400 text-black"
                      : active
                      ? "bg-cyan-400 text-black"
                      : "bg-white/10 text-white/30"
                  }`}
                >
                  {done ? "✓" : failed ? "✗" : i + 1}
                </div>
                <span
                  className={`text-[10px] ${
                    active || done ? "text-white/70" : "text-white/25"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="mx-1 mb-4 h-px flex-1 transition-colors"
                  style={{
                    background: done ? "#34d399" : "rgba(255,255,255,0.08)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {step === "intro" && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-white/70">
                Complete identity verification to unlock gated splits. This
                process takes about 2 minutes.
              </p>
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full rounded-xl bg-cyan-400 py-2.5 text-sm font-bold text-black hover:bg-cyan-300 transition-colors disabled:opacity-50"
              >
                Begin Verification
              </button>
            </div>
          )}

          {(step === "document" || step === "selfie" || step === "review") && (
            <div className="flex flex-col items-center gap-3 py-4">
              <svg
                className="h-8 w-8 animate-spin text-cyan-400"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <p className="text-sm text-white/60">
                {step === "document" && "Scanning document…"}
                {step === "selfie" && "Capturing selfie…"}
                {step === "review" && "Reviewing submission…"}
              </p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15">
                <svg
                  className="h-6 w-6 text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-emerald-400">
                Identity Verified
              </p>
              <p className="text-xs text-white/40">
                Your profile has been updated. Gated splits are now unlocked.
              </p>
            </div>
          )}

          {step === "failed" && (
            <div className="space-y-3 text-center">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={() => { setStep("intro"); setError(null); }}
                className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-white/60 hover:bg-white/5 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
