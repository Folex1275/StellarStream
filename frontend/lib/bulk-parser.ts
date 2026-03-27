import Papa from "papaparse";
import { StrKey } from "@stellar/stellar-sdk";
import type { MemoType } from "@/lib/bulk-splitter/types";
import type { RecipientRow } from "@/components/recipient-grid";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParseError {
  row: number;
  reason: string;
}

export interface BulkParseResult {
  valid: RecipientRow[];
  errors: ParseError[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _id = 0;
const nextId = () => `bulk-${++_id}`;

/** Resolve address/amount column names case-insensitively, including aliases */
function resolveHeaders(headers: string[]): { addrIdx: number; amtIdx: number } {
  const lower = headers.map((h) => h.trim().toLowerCase());
  const addrIdx = lower.findIndex((h) => h === "address" || h === "public key" || h === "public_key");
  const amtIdx = lower.findIndex((h) => h === "amount");
  return { addrIdx, amtIdx };
}

function validateRow(
  rowNum: number,
  address: string,
  amount: string,
  errors: ParseError[],
): boolean {
  let ok = true;
  if (!StrKey.isValidEd25519PublicKey(address)) {
    errors.push({ row: rowNum, reason: `Row ${rowNum}: Invalid Stellar address "${address}"` });
    ok = false;
  }
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0 || !/^\d+(\.\d+)?$/.test(amount.trim())) {
    errors.push({ row: rowNum, reason: `Row ${rowNum}: Invalid amount "${amount}" — must be a positive decimal` });
    ok = false;
  }
  return ok;
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

export function parseCSV(raw: string): BulkParseResult {
  const valid: RecipientRow[] = [];
  const errors: ParseError[] = [];

  const { data, errors: parseErrors } = Papa.parse<Record<string, string>>(raw.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parseErrors.length) {
    errors.push({ row: 0, reason: `CSV parse error: ${parseErrors[0].message}` });
    return { valid, errors };
  }

  if (!data.length) return { valid, errors };

  const { addrIdx, amtIdx } = resolveHeaders(Object.keys(data[0]));

  if (addrIdx === -1 || amtIdx === -1) {
    errors.push({ row: 0, reason: 'Missing required columns: "Address" (or "Public Key") and "Amount"' });
    return { valid, errors };
  }

  const headers = Object.keys(data[0]);
  const addrKey = headers[addrIdx];
  const amtKey = headers[amtIdx];
  const memoTypeKey = headers.find((h) => h.toLowerCase() === "memo_type");
  const memoKey = headers.find((h) => h.toLowerCase() === "memo");

  data.forEach((row, i) => {
    const rowNum = i + 2; // 1-based + header row
    const address = (row[addrKey] ?? "").trim();
    const amount = (row[amtKey] ?? "").trim();

    if (validateRow(rowNum, address, amount, errors)) {
      const memoType = (memoTypeKey ? row[memoTypeKey]?.trim() : "none") as MemoType;
      valid.push({
        id: nextId(),
        address,
        amount,
        memoType: ["none", "text", "id"].includes(memoType) ? memoType : "none",
        memo: memoKey ? (row[memoKey]?.trim() ?? "") : "",
      });
    }
  });

  return { valid, errors };
}

// ─── JSON parser ──────────────────────────────────────────────────────────────

export function parseJSON(raw: string): BulkParseResult {
  const valid: RecipientRow[] = [];
  const errors: ParseError[] = [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    errors.push({ row: 0, reason: "Invalid JSON — could not parse file" });
    return { valid, errors };
  }

  if (!Array.isArray(data)) {
    errors.push({ row: 0, reason: "JSON must be an array of recipient objects" });
    return { valid, errors };
  }

  data.forEach((item: unknown, i) => {
    const rowNum = i + 1;
    if (typeof item !== "object" || item === null) {
      errors.push({ row: rowNum, reason: `Row ${rowNum}: Entry is not an object` });
      return;
    }

    const obj = item as Record<string, unknown>;
    // Case-insensitive key lookup
    const find = (keys: string[]) => {
      const entry = Object.entries(obj).find(([k]) => keys.includes(k.toLowerCase()));
      return entry ? String(entry[1] ?? "").trim() : "";
    };

    const address = find(["address", "public key", "public_key"]);
    const amount = find(["amount"]);

    if (validateRow(rowNum, address, amount, errors)) {
      const memoType = find(["memo_type"]) as MemoType;
      valid.push({
        id: nextId(),
        address,
        amount,
        memoType: ["none", "text", "id"].includes(memoType) ? memoType : "none",
        memo: find(["memo"]),
      });
    }
  });

  return { valid, errors };
}

// ─── Unified entry point ──────────────────────────────────────────────────────

export function parseBulkFile(raw: string, filename: string): BulkParseResult {
  return filename.toLowerCase().endsWith(".json") ? parseJSON(raw) : parseCSV(raw);
}
