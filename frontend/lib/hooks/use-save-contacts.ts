import { useCallback } from "react";

export interface ContactEntry {
  address: string;
  label?: string;
}

/**
 * Bulk-saves recipients to the address book after a successful split.
 * Silently no-ops on failure to avoid blocking the UI.
 */
export function useSaveContacts() {
  return useCallback(async (addresses: string[]) => {
    if (addresses.length === 0) return;
    const contacts: ContactEntry[] = addresses.map((address) => ({ address }));
    try {
      await fetch("/api/v3/contacts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      });
    } catch {
      // Non-critical — do not surface to user
    }
  }, []);
}
