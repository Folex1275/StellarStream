"use client";

import { motion } from "framer-motion";
import { Zap, Leaf, Rocket } from "lucide-react";
import {
  FEE_TIERS,
  type FeeTier,
  type PriorityTier,
} from "@/lib/use-transaction-priority";

// ─── Tier metadata ────────────────────────────────────────────────────────────

const TIER_META: Record<
  PriorityTier,
  {
    icon: React.ComponentType<{ className?: string }>;
    activeGlow: string;
    activeBorder: string;
    activeBg: string;
    activeText: string;
    activeTag: string;
  }
> = {
  eco: {
    icon: Leaf,
    activeGlow: "shadow-[0_0_20px_rgba(52,211,153,0.18)]",
    activeBorder: "border-emerald-400/40",
    activeBg: "bg-emerald-400/8",
    activeText: "text-emerald-300",
    activeTag: "bg-emerald-400/15 text-emerald-300 border-emerald-400/25",
  },
  fast: {
    icon: Zap,
    activeGlow: "shadow-[0_0_20px_rgba(251,191,36,0.18)]",
    activeBorder: "border-yellow-400/40",
    activeBg: "bg-yellow-400/8",
    activeText: "text-yellow-300",
    activeTag: "bg-yellow-400/15 text-yellow-300 border-yellow-400/25",
  },
  instant: {
    icon: Rocket,
    activeGlow: "shadow-[0_0_20px_rgba(0,245,255,0.18)]",
    activeBorder: "border-[#00f5ff]/40",
    activeBg: "bg-[#00f5ff]/8",
    activeText: "text-[#00f5ff]",
    activeTag: "bg-[#00f5ff]/15 text-[#00f5ff] border-[#00f5ff]/25",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TransactionPrioritySelectorProps {
  selected: PriorityTier;
  onChange: (id: PriorityTier) => void;
  /** Base resource fee in stroops from simulation (optional — shows "~" if absent) */
  baseResourceFeeStroops?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STROOPS_PER_XLM = 10_000_000;
const BASE_INCLUSION_STROOPS = 100;

function fmtFee(tier: FeeTier, base?: number): string {
  if (base === undefined) {
    return tier.surchargeXlm === 0 ? "~base fee" : `+${tier.surchargeXlm} XLM`;
  }
  const stroops = BASE_INCLUSION_STROOPS + base + tier.surchargeStroops;
  const xlm = stroops / STROOPS_PER_XLM;
  return `${xlm.toFixed(xlm < 0.001 ? 7 : 5)} XLM`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TransactionPrioritySelector({
  selected,
  onChange,
  baseResourceFeeStroops,
}: TransactionPrioritySelectorProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-body text-xs font-medium uppercase tracking-widest text-white/30">
          Network Fee
        </p>
        <p className="font-body text-[10px] text-white/20">
          Faster = higher priority during congestion
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {FEE_TIERS.map((tier) => {
          const meta = TIER_META[tier.id];
          const Icon = meta.icon;
          const isActive = selected === tier.id;

          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => onChange(tier.id)}
              aria-pressed={isActive}
              aria-label={`${tier.label} fee: ${fmtFee(tier, baseResourceFeeStroops)}, ETA ${tier.eta}`}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                isActive
                  ? `${meta.activeBorder} ${meta.activeBg} ${meta.activeGlow}`
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
              }`}
            >
              {/* Active indicator dot */}
              {isActive && (
                <motion.span
                  layoutId="priority-dot"
                  className={`absolute top-2 right-2 h-1.5 w-1.5 rounded-full ${meta.activeText.replace("text-", "bg-")}`}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              <Icon
                className={`h-4 w-4 transition-colors duration-200 ${
                  isActive ? meta.activeText : "text-white/30"
                }`}
              />

              <span
                className={`font-body text-sm font-semibold transition-colors duration-200 ${
                  isActive ? meta.activeText : "text-white/60"
                }`}
              >
                {tier.label}
              </span>

              {/* Fee amount */}
              <span
                className={`inline-flex items-center rounded-full border px-1.5 py-0.5 font-ticker text-[10px] transition-all duration-200 ${
                  isActive
                    ? meta.activeTag
                    : "border-white/8 bg-white/5 text-white/30"
                }`}
              >
                {fmtFee(tier, baseResourceFeeStroops)}
              </span>

              {/* ETA */}
              <span
                className={`font-body text-[10px] transition-colors duration-200 ${
                  isActive ? "text-white/50" : "text-white/20"
                }`}
              >
                {tier.eta}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
