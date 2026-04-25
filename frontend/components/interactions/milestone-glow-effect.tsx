"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAnimationDuration } from "./elastic-presets";

export interface MilestoneGlowEffectProps {
  /** Current value to monitor for milestones */
  value: number;
  /** Milestone thresholds (e.g., [1000, 10000, 100000]) */
  milestones?: number[];
  /** Glow color */
  glowColor?: string;
  /** Animation duration in ms */
  duration?: number;
  /** Children to wrap with glow effect */
  children: React.ReactNode;
}

/**
 * Milestone Glow Effect
 * 
 * Triggers a subtle glow animation when a numeric value crosses milestone thresholds.
 * Perfect for streaming balance counters that hit round numbers.
 * 
 * Based on Figma prototype from Issue #520 - Real-time balance counter transitions.
 * 
 * @example
 * ```tsx
 * <MilestoneGlowEffect value={balance} milestones={[1000, 10000, 100000]}>
 *   <StreamingBalanceCard {...props} />
 * </MilestoneGlowEffect>
 * ```
 */
export default function MilestoneGlowEffect({
  value,
  milestones = [1000, 10000, 100000, 1000000],
  glowColor = "rgba(0, 245, 255, 0.8)",
  duration = 600,
  children,
}: MilestoneGlowEffectProps) {
  const [showGlow, setShowGlow] = useState(false);
  const [lastMilestone, setLastMilestone] = useState<number | null>(null);

  const animDuration = getAnimationDuration(duration) / 1000;

  useEffect(() => {
    // Check if we've crossed a new milestone
    const currentMilestone = milestones
      .filter((m) => value >= m)
      .sort((a, b) => b - a)[0]; // Get highest crossed milestone

    if (currentMilestone && currentMilestone !== lastMilestone) {
      setShowGlow(true);
      setLastMilestone(currentMilestone);

      // Haptic feedback (if supported)
      if ("vibrate" in navigator) {
        navigator.vibrate(30);
      }

      // Auto-hide after animation
      const timer = setTimeout(() => {
        setShowGlow(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [value, milestones, lastMilestone, duration]);

  return (
    <div style={{ position: "relative" }}>
      <AnimatePresence>
        {showGlow && (
          <motion.div
            style={{
              position: "absolute",
              inset: -10,
              borderRadius: "inherit",
              pointerEvents: "none",
              zIndex: -1,
            }}
            initial={{ opacity: 0 }}
            animate={{
              boxShadow: [
                `0 0 0px ${glowColor.replace("0.8", "0")}`,
                `0 0 40px ${glowColor}`,
                `0 0 0px ${glowColor.replace("0.8", "0")}`,
              ],
              opacity: [0, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: animDuration,
              times: [0, 0.5, 1],
              ease: "easeInOut",
            }}
          />
        )}
      </AnimatePresence>

      {children}
    </div>
  );
}
