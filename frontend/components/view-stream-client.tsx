"use client";

/**
 * Client-only interactive parts of the public stream preview page.
 * Kept separate so the parent page.tsx can be a Server Component with ISR.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, ShieldCheck } from "lucide-react";
import { VerifiedNebulaBadge } from "@/components/VerifiedNebulaBadge";
import { OrganizationAvatar } from "@/components/organization-avatar";

// ─── Types (duplicated here to avoid importing from the server page) ──────────

export interface StreamData {
  id: string;
  name: string;
  token: string;
  status: "active" | "paused" | "ended";
  totalAmount: number;
  streamed: number;
  ratePerSecond: number;
  sender: string;
  receiver: string;
  startTime: string; // ISO string — serialisable across server→client boundary
  endTime: string;
  apy?: number;
  organization?: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

// ─── Live counter ─────────────────────────────────────────────────────────────

function LiveCounter({ base, rate }: { base: number; rate: number }) {
  const [val, setVal] = useState(base);

  useEffect(() => {
    if (rate === 0) return;
    const id = setInterval(() => setVal((v) => v + rate * 0.1), 100);
    return () => clearInterval(id);
  }, [rate]);

  return (
    <>
      {val.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </>
  );
}

// ─── Main client shell ────────────────────────────────────────────────────────

export function ViewStreamClient({ stream }: { stream: StreamData }) {
  const isActive = stream.status === "active";
  const percentComplete = (stream.streamed / stream.totalAmount) * 100;
  const endTime = new Date(stream.endTime);
  const daysLeft = Math.ceil((endTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card max-w-lg w-full mx-auto p-8 space-y-6"
    >
      {/* Verified Badge Header */}
      <div className="flex flex-col items-center justify-center -mt-12 mb-8 gap-3">
        {stream.organization && (
          <OrganizationAvatar
            logoUrl={stream.organization.logo_url}
            stellarAddress={stream.organization.id}
            size={56}
            className="rounded-2xl border border-white/20 shadow-[0_0_24px_rgba(0,245,255,0.2)]"
            altText={`${stream.organization.name} logo`}
          />
        )}
        <VerifiedNebulaBadge />
      </div>

      {/* Internal Header */}
      <div className="flex items-center justify-between">
        <span className="font-ticker text-[10px] uppercase tracking-widest text-[#00f5ff]/40">
          TX_REF: {stream.id.slice(0, 16)}...
        </span>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
            isActive
              ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
              : stream.status === "paused"
              ? "border-orange-400/30 bg-orange-400/10 text-orange-400"
              : "border-white/15 bg-white/5 text-white/40"
          }`}
        >
          {isActive && (
            <span className="h-1.5 w-2 bg-current animate-pulse rounded-sm" />
          )}
          {stream.status}
        </span>
      </div>

      {/* Title */}
      <h1 className="font-heading text-2xl font-bold text-white">{stream.name}</h1>

      {/* Live flow counter */}
      <div className="text-center space-y-2">
        <p className="font-body text-[10px] uppercase tracking-widest text-white/35">
          Total Streamed
        </p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="font-ticker text-5xl font-bold text-[#00f5ff]">
            <LiveCounter
              base={stream.streamed}
              rate={isActive ? stream.ratePerSecond : 0}
            />
          </span>
          <span className="font-body text-lg text-[#00f5ff]/60">{stream.token}</span>
        </div>
        {isActive && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-white/50">
            <TrendingUp className="h-4 w-4" />
            +{stream.ratePerSecond.toFixed(5)} {stream.token}/sec
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-white/40">
          <span>{percentComplete.toFixed(1)}% complete</span>
          <span>
            {stream.totalAmount.toLocaleString()} {stream.token}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentComplete}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #00f5ff, #8a00ff)",
            }}
          />
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 border-t border-white/8 pt-5">
        {[
          { label: "Sender", value: stream.sender, mono: true },
          { label: "Receiver", value: stream.receiver, mono: true },
          {
            label: "Time Remaining",
            value: daysLeft > 0 ? `${daysLeft} days` : "Ended",
          },
          {
            label: "Rate",
            value: `${(stream.ratePerSecond * 86400).toFixed(2)} ${stream.token}/day`,
          },
        ].map(({ label, value, mono }) => (
          <div key={label} className="space-y-1">
            <p className="font-body text-[10px] uppercase tracking-wider text-white/30">
              {label}
            </p>
            <p
              className={`text-sm font-semibold text-white ${
                mono ? "font-ticker" : "font-body"
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Brand footer */}
      <p className="text-center font-body text-xs text-white/20">
        Powered by{" "}
        <a
          href="https://stellarstream.app"
          className="text-[#00f5ff]/60 hover:text-[#00f5ff] transition-colors"
        >
          StellarStream
        </a>
      </p>
    </motion.div>
  );
}
