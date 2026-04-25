"use client";

/**
 * SyncStatusIndicator — Issue #1018
 * Shows the current offline-draft sync state in the navigation bar.
 */

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import type { SyncStatus } from "@/lib/use-offline-draft";

interface SyncStatusIndicatorProps {
  status: SyncStatus;
}

const CONFIG: Record<
  SyncStatus,
  { icon: React.ReactNode; label: string; className: string } | null
> = {
  idle: null, // hidden when nothing to show
  offline: {
    icon: <WifiOff className="h-3.5 w-3.5" />,
    label: "Offline — draft saved",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  syncing: {
    icon: <RefreshCw className="h-3.5 w-3.5 animate-spin" />,
    label: "Syncing…",
    className: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  },
  synced: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: "Draft synced",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  error: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: "Sync failed",
    className: "border-red-400/30 bg-red-400/10 text-red-300",
  },
};

export function SyncStatusIndicator({ status }: SyncStatusIndicatorProps) {
  const config = CONFIG[status];
  if (!config) return null;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      {config.icon}
      <span className="hidden sm:inline">{config.label}</span>
    </div>
  );
}

/**
 * Self-contained version that manages its own online/offline state.
 * Drop this anywhere in the nav without needing to pass props.
 */
export function NavSyncIndicator() {
  const [status, setStatus] = useState<SyncStatus>("idle");

  useEffect(() => {
    if (!navigator.onLine) setStatus("offline");

    const handleOffline = () => setStatus("offline");
    const handleOnline = () => {
      // Check if there's a pending draft to sync
      import("idb-keyval").then(({ get }) =>
        get("offline_split_draft").then((draft) => {
          if (draft) {
            setStatus("syncing");
            // Delegate actual sync to the hook on the splitter page;
            // here we just reflect the transition back to idle after a beat.
            setTimeout(() => setStatus("idle"), 4000);
          } else {
            setStatus("idle");
          }
        })
      );
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return <SyncStatusIndicator status={status} />;
}
