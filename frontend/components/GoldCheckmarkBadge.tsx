"use client";

/**
 * GoldCheckmarkBadge.tsx
 * 
 * Display component for the verified organization "Gold Checkmark" badge.
 * Shows different badge levels based on trust score.
 */

import { motion } from "framer-motion";
import { ShieldCheck, Award, Star, Gem } from "lucide-react";

export type BadgeLevel = "bronze" | "silver" | "gold" | "platinum";

interface GoldCheckmarkBadgeProps {
  badgeLevel?: BadgeLevel;
  trustScore?: number;
  organizationName?: string;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const BADGE_CONFIG: Record<BadgeLevel, { icon: any; color: string; bgColor: string; borderColor: string; label: string }> = {
  bronze: {
    icon: ShieldCheck,
    color: "text-amber-700",
    bgColor: "bg-amber-700/10",
    borderColor: "border-amber-700/30",
    label: "Verified",
  },
  silver: {
    icon: Award,
    color: "text-gray-300",
    bgColor: "bg-gray-300/10",
    borderColor: "border-gray-300/30",
    label: "Silver Verified",
  },
  gold: {
    icon: Star,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/30",
    label: "Gold Verified",
  },
  platinum: {
    icon: Gem,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    borderColor: "border-cyan-400/30",
    label: "Platinum Verified",
  },
};

const SIZE_CLASSES = {
  sm: { container: "gap-1.5 px-2 py-1", icon: "h-3.5 w-3.5", text: "text-[10px]" },
  md: { container: "gap-2 px-3 py-1.5", icon: "h-4 w-4", text: "text-xs" },
  lg: { container: "gap-3 px-4 py-2", icon: "h-5 w-5", text: "text-sm" },
};

export default function GoldCheckmarkBadge({
  badgeLevel = "gold",
  trustScore,
  organizationName,
  showTooltip = true,
  size = "md",
  onClick,
}: GoldCheckmarkBadgeProps) {
  const config = BADGE_CONFIG[badgeLevel];
  const sizeClasses = SIZE_CLASSES[size];
  const Icon = config.icon;

  const badge = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center ${sizeClasses.container} rounded-full border ${config.borderColor} ${config.bgColor} ${
        onClick ? "cursor-pointer hover:scale-105" : ""
      } transition-transform`}
      onClick={onClick}
      title={showTooltip ? `${config.label}${organizationName ? ` - ${organizationName}` : ""}${trustScore ? ` (Trust Score: ${trustScore})` : ""}` : undefined}
    >
      <Icon className={`${sizeClasses.icon} ${config.color}`} />
      <span className={`font-semibold ${sizeClasses.text} ${config.color}`}>
        {config.label}
      </span>
      {trustScore && size !== "sm" && (
        <span className={`text-white/40 ${sizeClasses.text}`}>
          • {trustScore}
        </span>
      )}
    </motion.div>
  );

  return badge;
}
