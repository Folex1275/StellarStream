"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to track page visibility state.
 * Returns true when the page is visible, false when hidden.
 * Useful for pausing expensive operations like polling when the tab is not active.
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set initial state
    setIsVisible(!document.hidden);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
}