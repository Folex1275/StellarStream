"use client";

/**
 * Haptic feedback utility for mobile devices.
 * Provides tactile feedback for swipe gestures using the Vibration API.
 * Falls back gracefully on devices without vibration support.
 */

export type HapticPattern = "light" | "medium" | "heavy" | "success" | "error" | "warning";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [30, 50, 30],
  error: [50, 30, 50],
  warning: [20, 30, 20],
};

/**
 * Trigger haptic feedback with a specific pattern.
 * @param pattern - The haptic pattern to use
 */
export function triggerHaptic(pattern: HapticPattern = "medium"): void {
  if (typeof window === "undefined") return;

  const vibrationPattern = PATTERNS[pattern];

  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(vibrationPattern);
    } catch {
      // Vibration API not supported or blocked by browser policy
      console.debug("Vibration API not available");
    }
  }
}

/**
 * Check if haptic feedback is available on the current device.
 */
export function isHapticAvailable(): boolean {
  return typeof window !== "undefined" && "vibrate" in navigator;
}
