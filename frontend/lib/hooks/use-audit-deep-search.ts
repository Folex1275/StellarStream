import { useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SplitLog {
  id: string;
  address: string;
  memo: string;
  amount: string; // decimal string, e.g. "1234.5600000"
  token: string;
  timestamp: string; // ISO
  txHash: string;
}

export interface DeepSearchResult {
  logs: SplitLog[];
  total: number;
  query: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuditDeepSearch(
  logs: SplitLog[],
  query: string,
): DeepSearchResult {
  const trimmed = query.trim();

  const filtered = useMemo(() => {
    if (!trimmed) return logs;

    const lower = trimmed.toLowerCase();
    const asNumber = parseFloat(trimmed);
    const isNumeric = !isNaN(asNumber) && isFinite(asNumber);

    return logs.filter((log) => {
      // G-address: full or partial match
      if (log.address.toLowerCase().includes(lower)) return true;
      // Memo: case-insensitive substring
      if (log.memo.toLowerCase().includes(lower)) return true;
      // Amount: exact numeric match
      if (isNumeric && parseFloat(log.amount) === asNumber) return true;
      return false;
    });
  }, [logs, trimmed]);

  return { logs: filtered, total: logs.length, query: trimmed };
}

// ─── Highlight helper ─────────────────────────────────────────────────────────

/**
 * Splits `text` into segments, marking those that match `query`.
 * Returns an array of { text, highlight } — render highlighted ones in <mark>.
 */
export function getHighlightSegments(
  text: string,
  query: string,
): Array<{ text: string; highlight: boolean }> {
  if (!query) return [{ text, highlight: false }];

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return parts
    .filter((p) => p.length > 0)
    .map((part) => ({
      text: part,
      highlight: regex.test(part),
    }));
}
