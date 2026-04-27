"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  Fingerprint,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptic-feedback";
import { verifyQuickSignCredential, isWebAuthnAvailable } from "@/lib/webauthn-quick-sign";
import { toast } from "@/lib/toast";

interface BiometricConfirmationProps {
  isOpen: boolean;
  amount: number;
  token: string;
  streamId: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  walletAddress?: string;
}

const HIGH_VALUE_THRESHOLD = 10000; // USD equivalent threshold

export function BiometricConfirmation({
  isOpen,
  amount,
  token,
  streamId,
  onConfirm,
  onCancel,
  walletAddress,
}: BiometricConfirmationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const controls = useAnimation();

  const isHighValue = amount >= HIGH_VALUE_THRESHOLD;

  const handleBiometricVerify = useCallback(async () => {
    if (!walletAddress || !isWebAuthnAvailable()) {
      toast.error({
        title: "Biometric Unavailable",
        description: "Please use the standard approval flow.",
        duration: 5000,
      });
      onCancel();
      return;
    }

    setIsVerifying(true);
    triggerHaptic("medium");

    try {
      await verifyQuickSignCredential(walletAddress);
      setVerificationSuccess(true);
      triggerHaptic("success");

      // Auto-submit after successful verification
      setTimeout(async () => {
        setIsSubmitting(true);
        try {
          await onConfirm();
        } catch (error) {
          toast.error({
            title: "Approval Failed",
            description: error instanceof Error ? error.message : "Unknown error occurred",
            duration: 6000,
          });
          onCancel();
        } finally {
          setIsSubmitting(false);
        }
      }, 800);
    } catch (error) {
      triggerHaptic("error");
      controls.start({
        x: [-10, 10, -10, 10, 0],
        transition: { duration: 0.4 },
      });

      toast.error({
        title: "Verification Failed",
        description:
          error instanceof Error ? error.message : "Biometric verification was cancelled",
        duration: 5000,
      });
    } finally {
      setIsVerifying(false);
    }
  }, [walletAddress, onConfirm, onCancel, controls]);

  const handleCancel = useCallback(() => {
    triggerHaptic("light");
    setVerificationSuccess(false);
    onCancel();
  }, [onCancel]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={handleCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a0f]/95 p-6 shadow-2xl backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                isHighValue
                  ? "border-orange-500/30 bg-orange-500/10"
                  : "border-[#00f5ff]/30 bg-[#00f5ff]/10"
              }`}
            >
              {isHighValue ? (
                <AlertTriangle size={24} className="text-orange-400" />
              ) : (
                <Shield size={24} className="text-[#00f5ff]" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg text-white">
                {isHighValue ? "High-Value Transaction" : "Security Check"}
              </h3>
              <p className="font-body text-xs text-white/40 mt-0.5">
                Biometric verification required
              </p>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-widest text-white/40">Amount</span>
              <span className="font-heading text-xl text-white">
                {amount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-sm text-white/50">{token}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-white/40">Stream ID</span>
              <span className="font-mono text-xs text-white/60">{streamId}</span>
            </div>
          </div>

          {/* Biometric Button or Success State */}
          <AnimatePresence mode="wait">
            {verificationSuccess ? (
              <motion.div
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center gap-4 py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#00f5ff]/40 bg-[#00f5ff]/10"
                >
                  {isSubmitting ? (
                    <Loader2 size={32} className="animate-spin text-[#00f5ff]" />
                  ) : (
                    <CheckCircle2 size={40} className="text-[#00f5ff]" />
                  )}
                </motion.div>
                <p className="font-heading text-base text-[#00f5ff]">
                  {isSubmitting ? "Submitting Approval..." : "Verified"}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="verify"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <motion.button
                  animate={controls}
                  onClick={handleBiometricVerify}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#00f5ff] to-[#8a00ff] px-6 py-4 text-base font-bold text-black hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Fingerprint size={24} />
                      Use Biometrics to Approve
                    </>
                  )}
                </motion.button>

                <button
                  onClick={handleCancel}
                  disabled={isVerifying || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <XCircle size={16} />
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info Text */}
          {!verificationSuccess && (
            <p className="mt-4 text-center text-xs text-white/30">
              {isHighValue
                ? "Transactions above $10,000 require biometric confirmation for security"
                : "Quick biometric approval for enhanced security"}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
