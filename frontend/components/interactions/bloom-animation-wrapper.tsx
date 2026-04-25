"use client";

import { motion } from "framer-motion";
import { ELASTIC_EASINGS, ANIMATION_DURATIONS, getAnimationDuration } from "./elastic-presets";

export interface BloomAnimationWrapperProps {
  /** Content to animate */
  children: React.ReactNode;
  /** Trigger the bloom animation */
  show: boolean;
  /** Animation duration in ms (default: 800) */
  duration?: number;
  /** Delay before animation starts in ms */
  delay?: number;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
  /** Custom glow color (default: cyan) */
  glowColor?: string;
}

/**
 * Bloom Animation Wrapper
 * 
 * Animates content with an elastic "bloom" effect - scales from small to full size
 * with overshoot, accompanied by blur and glow effects.
 * 
 * Based on Figma prototype from Issue #520 - "Success" state animation.
 * 
 * @example
 * ```tsx
 * <BloomAnimationWrapper show={streamCreated}>
 *   <StreamCard {...newStream} />
 * </BloomAnimationWrapper>
 * ```
 */
export default function BloomAnimationWrapper({
  children,
  show,
  duration = ANIMATION_DURATIONS.slow,
  delay = 0,
  onAnimationComplete,
  glowColor = "rgba(0, 245, 255, 0.6)",
}: BloomAnimationWrapperProps) {
  const animDuration = getAnimationDuration(duration) / 1000; // Convert to seconds

  return (
    <motion.div
      initial={false}
      animate={
        show
          ? {
              scale: [0.3, 1.05, 1.0],
              opacity: 1,
              filter: "blur(0px)",
            }
          : {
              scale: 0.3,
              opacity: 0,
              filter: "blur(8px)",
            }
      }
      transition={{
        duration: animDuration,
        delay: delay / 1000,
        times: [0, 0.6, 1],
        ease: ELASTIC_EASINGS.elasticOut,
      }}
      onAnimationComplete={onAnimationComplete}
      style={{
        transformOrigin: "center center",
      }}
    >
      {/* Glow pulse effect */}
      {show && (
        <motion.div
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: "inherit",
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            pointerEvents: "none",
            zIndex: -1,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.6] }}
          transition={{
            duration: animDuration * 1.5,
            times: [0, 0.5, 1],
            ease: "easeOut",
          }}
        />
      )}

      {children}
    </motion.div>
  );
}
