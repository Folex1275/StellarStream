"use client";

import { useState, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Pen, Loader2, AlertTriangle } from "lucide-react";
import type { PendingStream } from "@/lib/use-pending-streams";
import { triggerHaptic } from "@/lib/haptic-feedback";
import { BiometricConfirmation } from "./BiometricConfirmation";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function timeUntil(date: Date): string {
  const ms = date.getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function shortenAddr(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

const SWIPE_THRESHOLD = 120;
const HIGH_VALUE_THRESHOLD = 10000;

// ─── SwipeCard Component ──────────────────────────────────────────────────────

interface SwipeCardProps {
  stream: PendingStream;
  isSigning: boolean;
  onApprove: () => Promise<void>;
  onReject?: () => Promise<void>;
  signedCount: number;
  enableSwipe?: boolean;
}

export function SwipeCard({
  stream,
  isSigning,
  onApprove,
  onReject,
  signedCount,
  enableSwipe = true,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacityApprove = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const opacityReject = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const scaleApprove = useTransform(x, [0, SWIPE_THRESHOLD], [0.8, 1.2]);
  const scaleReject = useTransform(x, [-SWIPE_THRESHOLD, 0], [1.2, 0.8]);

  const [isDragging, setIsDragging] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [pendingAction, setPendingAction] = useState<"approve" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isHighValue = stream.amount >= HIGH_VALUE_THRESHOLD;
  const isFullySigned = signedCount >= stream.requiredSignatures;
  const expiresUrgent = stream.expiresAt.getTime() - Date.now() < 1000 * 60 * 60 * 6;

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!enableSwipe || isSigning) return;

      const offset = info.offset.x;

      if (offset > SWIPE_THRESHOLD) {
        // Swipe right - Approve
        triggerHaptic("heavy");
        animate(x, 300, { duration: 0.3 });

        if (isHighValue) {
          setPendingAction("approve");
          setTimeout(() => setShowBiometric(true), 400);
        } else {
          onApprove();
        }
      } else if (offset < -SWIPE_THRESHOLD && onReject) {
        // Swipe left - Reject
        triggerHaptic("error");
        animate(x, -300, { duration: 0.3 });

        setTimeout(() => {
          onReject();
        }, 300);
      } else {
        // Snap back
        triggerHaptic("light");
        animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
      }
    },
    [x, enableSwipe, isSigning, isHighValue, onApprove, onReject]
  );

  const handleBiometricConfirm = useCallback(async () => {
    setShowBiometric(false);
    setPendingAction(null);
    await onApprove();
  }, [onApprove]);

  const handleBiometricCancel = useCallback(() => {
    setShowBiometric(false);
    setPendingAction(null);
    animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
  }, [x]);

  const progress = (signedCount / stream.requiredSignatures) * 100;

  return (
    <>
      <motion.div
        ref={cardRef}
        style={{ x, rotate }}
        drag={enableSwipe && !isSigning && !isFullySigned ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragStart={() => {
          setIsDragging(true);
          triggerHaptic("light");
        }}
        onDragEnd={handleDragEnd}
        className="relative rounded-2xl border backdrop-blur-xl p-5 select-none cursor-grab active:cursor-grabbing"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Swipe Indicators */}
        {enableSwipe && !isFullySigned && (
          <>
            <motion.div
              style={{ opacity: opacityApprove, scale: scaleApprove }}
              className="absolute top-4 right-4 flex items-center gap-2 rounded-xl border-2 border-[#00f5ff]/60 bg-[#00f5ff]/20 px-4 py-2 z-10"
            >
              <CheckCircle2 size={20} className="text-[#00f5ff]" />
              <span className="font-bold text-[#00f5ff] text-sm">APPROVE</span>
            </motion.div>

            <motion.div
              style={{ opacity: opacityReject, scale: scaleReject }}
              className="absolute top-4 left-4 flex items-center gap-2 rounded-xl border-2 border-red-500/60 bg-red-500/20 px-4 py-2 z-10"
            >
              <XCircle size={20} className="text-red-400" />
              <span className="font-bold text-red-400 text-sm">REJECT</span>
            </motion.div>
          </>
        )}

        {/* Urgency indicator */}
        {expiresUrgent && !isFullySigned && (
          <div className="absolute -top-px left-4 right-4 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
        )}

        {/* Card Content */}
        <div className={`relative ${isFullySigned ? "opacity-75" : ""}`}>
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-[11px] text-white/40 bg-white/[0.04] border border-white/10 rounded px-1.5 py-0.5">
                  {stream.streamId}
                </span>
                {expiresUrgent && !isFullySigned && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-orange-400 border border-orange-500/30 bg-orange-500/10 rounded-full px-2 py-0.5">
                    <AlertTriangle size={9} />
                    Urgent
                  </span>
                )}
                {isFullySigned && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-[#00f5ff] border border-[#00f5ff]/30 bg-[#00f5ff]/10 rounded-full px-2 py-0.5">
                    <CheckCircle2 size={9} />
                    Ready
                  </span>
                )}
                {isHighValue && !isFullySigned && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-purple-400 border border-purple-500/30 bg-purple-500/10 rounded-full px-2 py-0.5">
                    High Value
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-xl text-white">
                  {fmt(stream.amount)} {stream.token}
                </span>
                <span className="font-body text-xs text-white/40">
                  → {shortenAddr(stream.recipient)}
                </span>
              </div>
              <p className="font-body text-xs text-white/35 mt-0.5">
                {fmt(stream.ratePerSecond, 5)} {stream.token}/sec · {stream.duration}d stream
              </p>
            </div>

            {/* Sign Now button (fallback for non-swipe) */}
            {!stream.hasCurrentUserSigned && !isFullySigned && (
              <button
                onClick={() => {
                  if (isHighValue) {
                    setPendingAction("approve");
                    setShowBiometric(true);
                  } else {
                    onApprove();
                  }
                }}
                disabled={isSigning}
                className="flex-shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 bg-[#00f5ff] text-black hover:bg-[#00e0e8] hover:shadow-[0_0_20px_rgba(0,245,255,0.4)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSigning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Signing…
                  </>
                ) : (
                  <>
                    <Pen size={14} />
                    Sign Now
                  </>
                )}
              </button>
            )}

            {stream.hasCurrentUserSigned && !isFullySigned && (
              <div className="flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 border border-[#00f5ff]/20 bg-[#00f5ff]/5 text-xs text-[#00f5ff]/70">
                <CheckCircle2 size={13} />
                Signed
              </div>
            )}
          </div>

          {/* Signature progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-xs text-white/50">
                Signatures:{" "}
                <span className="font-bold text-white/80">
                  {signedCount} of {stream.requiredSignatures}
                </span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: isFullySigned
                    ? "linear-gradient(90deg, #00f5ff, #8a00ff)"
                    : "linear-gradient(90deg, #00f5ff80, #00f5ff)",
                  boxShadow: isFullySigned ? "0 0 10px rgba(0,245,255,0.5)" : undefined,
                }}
              />
            </div>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between text-[11px] text-white/30">
            <span>Swipe → to approve, ← to reject</span>
            <span
              className={`flex items-center gap-1 ${expiresUrgent && !isFullySigned ? "text-orange-400/70" : ""}`}
            >
              <Clock size={10} />
              Expires in {timeUntil(stream.expiresAt)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Biometric Confirmation Modal */}
      <BiometricConfirmation
        isOpen={showBiometric}
        amount={stream.amount}
        token={stream.token}
        streamId={stream.streamId}
        onConfirm={handleBiometricConfirm}
        onCancel={handleBiometricCancel}
        walletAddress={stream.currentUserAddress}
      />
    </>
  );
}
