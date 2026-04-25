/**
 * Elastic Micro-interaction Library
 * 
 * Global spring physics presets for consistent motion design across Nebula V2.
 * Based on Figma prototypes from Issue #520.
 */

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

/**
 * Pre-configured spring physics for common interaction patterns.
 * Use these to maintain consistent "feel" across the application.
 */
export const ELASTIC_PRESETS = {
  /**
   * Gentle, fluid motion for default UI elements.
   * Use for: Cards, panels, modals
   */
  gentle: { stiffness: 120, damping: 20, mass: 1.0 } as SpringConfig,

  /**
   * Snappy, responsive motion for interactive elements.
   * Use for: Buttons, toggles, switches
   */
  snappy: { stiffness: 300, damping: 25, mass: 0.8 } as SpringConfig,

  /**
   * Bouncy, playful motion for success states.
   * Use for: Confirmations, celebrations, achievements
   */
  bouncy: { stiffness: 200, damping: 15, mass: 1.2 } as SpringConfig,

  /**
   * Precise, controlled motion for data displays.
   * Use for: Counters, charts, numerical displays
   */
  precise: { stiffness: 180, damping: 22, mass: 0.6 } as SpringConfig,

  /**
   * Dramatic, attention-grabbing motion for alerts.
   * Use for: Errors, warnings, critical notifications
   */
  dramatic: { stiffness: 250, damping: 18, mass: 1.5 } as SpringConfig,
} as const;

/**
 * Custom easing curves for non-spring animations.
 * Values are cubic-bezier control points [x1, y1, x2, y2].
 */
export const ELASTIC_EASINGS = {
  /** Elastic overshoot for "bloom" animations */
  elasticOut: [0.34, 1.56, 0.64, 1] as const,

  /** Smooth deceleration with slight bounce */
  smoothBounce: [0.25, 0.46, 0.45, 0.94] as const,

  /** Sharp acceleration, gentle landing */
  sharpGentle: [0.4, 0.0, 0.2, 1] as const,
} as const;

/**
 * Timing constants for interaction thresholds.
 */
export const INTERACTION_TIMINGS = {
  /** Long-press threshold in milliseconds */
  longPressThreshold: 400,

  /** Debounce delay for rapid interactions */
  debounceDelay: 150,

  /** Tooltip appearance delay */
  tooltipDelay: 600,

  /** Success state display duration */
  successStateDuration: 2000,
} as const;

/**
 * Animation duration presets in milliseconds.
 */
export const ANIMATION_DURATIONS = {
  /** Quick micro-interactions */
  fast: 200,

  /** Standard UI transitions */
  normal: 400,

  /** Emphasis animations */
  slow: 800,

  /** Dramatic reveals */
  dramatic: 1200,
} as const;

/**
 * Get spring config with reduced motion support.
 * Automatically adjusts physics for users who prefer reduced motion.
 */
export function getSpringConfig(
  preset: keyof typeof ELASTIC_PRESETS,
  respectReducedMotion = true
): SpringConfig {
  const shouldReduceMotion =
    respectReducedMotion &&
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (shouldReduceMotion) {
    // Instant transitions for reduced motion
    return { stiffness: 500, damping: 50, mass: 0.5 };
  }

  return ELASTIC_PRESETS[preset];
}

/**
 * Get animation duration with reduced motion support.
 * Returns 0 for users who prefer reduced motion.
 */
export function getAnimationDuration(
  duration: number,
  respectReducedMotion = true
): number {
  const shouldReduceMotion =
    respectReducedMotion &&
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return shouldReduceMotion ? 0 : duration;
}
