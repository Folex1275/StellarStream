"use client";

/**
 * useOfflineDraft — Issue #1018
 *
 * Persists split draft data to IndexedDB via idb-keyval so it survives
 * offline sessions. When the browser comes back online the draft is
 * automatically synced to the backend and cleared from local storage.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { get, set, del } from "idb-keyval";

const STORE_KEY = "offline_split_draft";

export type SyncStatus = "idle" | "offline" | "syncing" | "synced" | "error";

export interface SplitDraft {
  rows: { address: string; amount: string }[];
  asset: string;
  mode: "push" | "pull";
  savedAt: number;
}

async function pushDraftToBackend(draft: SplitDraft): Promise<void> {
  const res = await fetch("/api/v3/split/metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
}

export function useOfflineDraft() {
  const [draft, setDraftState] = useState<SplitDraft | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const syncedRef = useRef(false);

  // Load persisted draft on mount
  useEffect(() => {
    get<SplitDraft>(STORE_KEY).then((saved) => {
      if (saved) {
        setDraftState(saved);
        setSyncStatus(navigator.onLine ? "idle" : "offline");
      }
    });
  }, []);

  // Persist draft to IndexedDB whenever it changes
  const saveDraft = useCallback(async (data: SplitDraft) => {
    setDraftState(data);
    await set(STORE_KEY, data);
    setSyncStatus(navigator.onLine ? "idle" : "offline");
    syncedRef.current = false;
  }, []);

  const clearDraft = useCallback(async () => {
    setDraftState(null);
    await del(STORE_KEY);
    setSyncStatus("idle");
    syncedRef.current = false;
  }, []);

  // Sync when coming back online
  useEffect(() => {
    const sync = async () => {
      const saved = await get<SplitDraft>(STORE_KEY);
      if (!saved || syncedRef.current) return;

      setSyncStatus("syncing");
      try {
        await pushDraftToBackend(saved);
        await del(STORE_KEY);
        setDraftState(null);
        setSyncStatus("synced");
        syncedRef.current = true;
        // Reset to idle after 3 s
        setTimeout(() => setSyncStatus("idle"), 3000);
      } catch {
        setSyncStatus("error");
      }
    };

    const handleOffline = () => setSyncStatus("offline");
    const handleOnline = () => sync();

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return { draft, saveDraft, clearDraft, syncStatus };
}
