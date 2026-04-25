"use client";

import { useEffect } from "react";

/** Registers the service worker once on the client. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);
  return null;
}
