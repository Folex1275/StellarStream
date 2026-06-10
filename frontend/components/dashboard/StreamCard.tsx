"use client";

import { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";

interface StreamCardProps {
  streamId: string;
  name: string;
  sender: { address: string; label?: string };
  receiver: { address: string; label?: string };
  token: string;
  amountStreamed: number;
  totalAmount: number;
  startTime: Date;
  endTime: Date;
  status: "active" | "paused" | "ended";
  ratePerSecond: number;
  onWithdraw?: () => void;
  onTopUp?: () => void;
  onViewDetails?: () => void;
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function StreamCard({
  streamId,
  name,
  sender,
  receiver,
  token,
  amountStreamed,
  totalAmount,
  startTime,
  endTime,
  status,
  ratePerSecond,
  onWithdraw,
  onTopUp,
  onViewDetails,
}: StreamCardProps) {
  const [liveStreamed, setLiveStreamed] = useState(amountStreamed);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0.6, 1, 0.6]);

  // Live counter update
  useEffect(() => {
    if (status !== "active") return;
    const interval = setInterval(() => {
      setLiveStreamed((prev) => Math.min(prev + ratePerSecond * 0.1, totalAmount));
    }, 100);
    return () => clearInterval(interval);
  }, [status, ratePerSecond, totalAmount]);

  const progress = (liveStreamed / totalAmount) * 100;
  const remaining = totalAmount - liveStreamed;

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -80 && onWithdraw) {
      onWithdraw();
    } else if (info.offset.x > 80 && onTopUp) {
      onTopUp();
    }
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl"
      style={{ x, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      {/* Swipe action hints */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-start pl-6 opacity-0 transition-opacity duration-200" style={{ opacity: x.get() > 50 ? 1 : 0 }}>
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-emerald-400">
          <Plus className="h-4 w-4" />
          <span className="text-xs font-semibold">Top-up</span>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-end pr-6 opacity-0 transition-opacity duration-200" style={{ opacity: x.get() < -50 ? 1 : 0 }}>
        <div className="flex items-center gap-2 rounded-full bg-violet-500/20 px-4 py-2 text-violet-400">
          <ArrowUpRight className="h-4 w-4" />
          <span className="text-xs font-semibold">Withdraw</span>
        </div>
      </div>

      {/* Card content */}
      <div className="relative p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-base text-white truncate mb-1">{name}</h3>
            <p className="font-body text-xs text-white/40">ID: {truncateAddress(streamId)}</p>
          </div>
          <div className={`ml-3 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
            status === "paused" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
            "bg-white/5 text-white/40 border border-white/10"
          }`}>
            {status}
          </div>
        </div>

        {/* Progress ring */}
        <div className="mb-4 flex items-center justify-center">
          <svg width={120} height={120} className="transform -rotate-90">
            <defs>
              <linearGradient id={`grad-${streamId}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <circle cx={60} cy={60} r={52} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
            <circle
              cx={60}
              cy={60}
              r={52}
              fill="none"
              stroke={`url(#grad-${streamId})`}
              strokeWidth={8}
              strokeDasharray={`${(progress / 100) * 326.73} 326.73`}
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 8px rgba(52,211,153,0.6))" }}
            />
            <text x={60} y={55} textAnchor="middle" fill="white" fontSize={18} fontWeight={700} className="transform rotate-90" style={{ transformOrigin: "60px 60px" }}>
              {Math.round(progress)}%
            </text>
            <text x={60} y={70} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={9} letterSpacing="0.1em" className="transform rotate-90" style={{ transformOrigin: "60px 60px" }}>
              DONE
            </text>
          </svg>
        </div>

        {/* Live counter */}
        <div className="mb-4 rounded-xl border border-white/10 bg-white/2 p-4 text-center">
          <p className="font-body text-[10px] uppercase tracking-wider text-white/40 mb-1">Streamed</p>
          <p className="font-heading text-2xl text-white tabular-nums">
            {liveStreamed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="font-body text-xs text-white/60 mt-1">{token}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-white/10 bg-white/2 p-3">
            <p className="font-body text-[9px] uppercase tracking-wider text-white/40 mb-1">Total</p>
            <p className="font-heading text-sm text-white">{totalAmount.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/2 p-3">
            <p className="font-body text-[9px] uppercase tracking-wider text-white/40 mb-1">Remaining</p>
            <p className="font-heading text-sm text-white">{remaining.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Participants */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">From</span>
            <span className="text-white/70 font-mono">{sender.label || truncateAddress(sender.address)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">To</span>
            <span className="text-white/70 font-mono">{receiver.label || truncateAddress(receiver.address)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {onWithdraw && (
            <button
              onClick={onWithdraw}
              className="flex-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-400 transition hover:bg-violet-500/20"
            >
              Withdraw
            </button>
          )}
          {onTopUp && (
            <button
              onClick={onTopUp}
              className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
            >
              Top-up
            </button>
          )}
        </div>

        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/2 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.05]"
          >
            View Details
          </button>
        )}
      </div>
    </motion.div>
  );
}
