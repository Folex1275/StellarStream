"use client";

import { useEffect, useRef } from "react";

/**
 * Custom hook for setting up an interval that calls a callback function at specified intervals.
 * Automatically cleans up the interval on unmount.
 *
 * @param callback - Function to call at each interval
 * @param delay - Delay in milliseconds between calls (null to pause)
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (delay === null) {
      return;
    }

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}