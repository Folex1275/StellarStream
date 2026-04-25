"use client";

import { useEffect } from "react";
import { initErrorTracking } from "@/lib/error-tracking";

export default function ErrorTracker() {
  useEffect(() => {
    initErrorTracking();
  }, []);

  return null;
}
