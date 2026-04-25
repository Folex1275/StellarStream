"use client";

// components/recipient-grid.tsx
// Issue #779 — Memo-Batcher for Exchanges
// Adds a Memo column (type + value) to the recipient grid with validation.

import { useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import type { MemoType } from "@/lib/bulk-splitter/types";

export interface RecipientRow {
  id: string;
  address: string;
  amount: string;
  asset?: string; // Asset field for bulk change asset action
  memoType: MemoType;
  memo: string;
  /** Validation error for the memo field */
  memoError?: string;
}

// ── Validation ───────────────────────────────────────────────────────────────

function validateMemo(type: MemoType, value: string): string | undefined {
  if (type === "none" || !value) return undefined;
  if (type === "text") {
    // Stellar text memo: max 28 bytes
    if (new TextEncoder().encode(value).length > 28)
      return "Text memo must be ≤ 28 bytes";
    return undefined;
  }
  if (type === "id") {
    // Stellar ID memo: unsigned 64-bit integer
    if (!/^\d+$/.test(value)) return "ID memo must be a positive integer";
    if (BigInt(value) > 18446744073709551615n) return "ID memo exceeds u64 max";
    return undefined;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyRow(id: string): RecipientRow {
  return { id, address: "", amount: "", asset: "XLM", memoType: "none", memo: "" };
}

let _id = 0;
const nextId = () => String(++_id);

// ── Sub-components ───────────────────────────────────────────────────────────

function MemoTypeSelect({
  value,
  onChange,
}: {
  value: MemoType;
  onChange: (v: MemoType) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as MemoType)}
      className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-white/80 focus:border-cyan-400/50 focus:outline-none"
    >
      <option value="none">None</option>
      <option value="text">Text</option>
      <option value="id">ID</option>
    </select>
  );
}

// ── RecipientGrid ─────────────────────────────────────────────────────────────

interface Props {
  /** Controlled rows — pass [] to start empty */
  rows: RecipientRow[];
  onChange: (rows: RecipientRow[]) => void;
  /** Addresses flagged by the trustline preflight check */
  invalidTrustlineAddresses?: Set<string>;
}

export function RecipientGrid({ rows, onChange, invalidTrustlineAddresses }: Props) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkActionMode, setBulkActionMode] = useState<boolean>(false);

  const update = useCallback(
    (id: string, patch: Partial<RecipientRow>) => {
      onChange(
        rows.map((r) => {
          if (r.id !== id) return r;
          const updated = { ...r, ...patch };
          // Re-validate memo whenever type or value changes
          if ("memoType" in patch || "memo" in patch) {
            updated.memoError = validateMemo(updated.memoType, updated.memo);
          }
          return updated;
        }),
      );
    },
    [rows, onChange],
  );

  const addRow = () => onChange([...rows, emptyRow(nextId())]);
  const removeRow = (id: string) => onChange(rows.filter((r) => r.id !== id));

  // Bulk selection handlers
  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map(r => r.id)));
    }
  };

  // Bulk action handlers
  const handleBulkDelete = () => {
    onChange(rows.filter(r => !selectedRows.has(r.id)));
    setSelectedRows(new Set());
  };

  const handleBulkMultiplyAmount = () => {
    const multiplier = 2; // Default multiplier
    onChange(
      rows.map(r => {
        if (selectedRows.has(r.id)) {
          const currentAmount = parseFloat(r.amount) || 0;
          return { ...r, amount: (currentAmount * multiplier).toString() };
        }
        return r;
      })
    );
    setSelectedRows(new Set());
  };

  const handleBulkChangeAsset = () => {
    const newAsset = "USDC"; // Default new asset
    onChange(
      rows.map(r => {
        if (selectedRows.has(r.id)) {
          return { ...r, asset: newAsset };
        }
        return r;
      })
    );
    setSelectedRows(new Set());
  };

  // ── CSV import ─────────────────────────────────────────────────────────────
  function handleCSVImport(raw: string) {
    const lines = raw.trim().split(/\r?\n/).filter(Boolean);
    const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const addrIdx = header.indexOf("address");
    const amtIdx = header.indexOf("amount");
    const assetIdx = header.indexOf("asset");
    const memoIdx = header.indexOf("memo");
    const memoTypeIdx = header.indexOf("memo_type");
    const dataLines = addrIdx >= 0 ? lines.slice(1) : lines;

    const parsed: RecipientRow[] = dataLines.map((line) => {
      const cols = line.split(",");
      const memoType = (memoTypeIdx >= 0 ? cols[memoTypeIdx]?.trim() : "none") as MemoType;
      const memo = memoIdx >= 0 ? (cols[memoIdx]?.trim() ?? "") : "";
      const row: RecipientRow = {
        id: nextId(),
        address: addrIdx >= 0 ? (cols[addrIdx]?.trim() ?? "") : (cols[0]?.trim() ?? ""),
        amount: amtIdx >= 0 ? (cols[amtIdx]?.trim() ?? "") : (cols[1]?.trim() ?? ""),
        asset: assetIdx >= 0 ? (cols[assetIdx]?.trim() ?? "XLM") : "XLM",
        memoType: ["none", "text", "id"].includes(memoType) ? memoType : "none",
        memo,
      };
      row.memoError = validateMemo(row.memoType, row.memo);
      return row;
    });
    onChange(parsed);
  }

  const hasErrors = rows.some((r) => r.memoError);

  return (
    <div className="space-y-3">
      {/* CSV import */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-widest text-white/30 uppercase">Recipients</p>
        <label className="cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/50 hover:text-white/80 transition-colors">
          Import CSV
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => handleCSVImport(ev.target?.result as string);
              reader.readAsText(file);
            }}
          />
        </label>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[24px_1fr_80px_80px_90px_120px_24px] gap-2 px-1 items-center">
        <input
          type="checkbox"
          checked={selectedRows.size === rows.length && rows.length > 0}
          onChange={toggleSelectAll}
          className="h-3 w-3 rounded border-white/20 bg-black/20 accent-cyan-400"
        />
        {["Address", "Asset", "Amount", "Memo Type", "Memo Value", ""].map((h) => (
          <span key={h} className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="space-y-1">
            <div className="grid grid-cols-[24px_1fr_80px_80px_90px_120px_24px] gap-2 items-center">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedRows.has(row.id)}
                onChange={() => toggleRowSelection(row.id)}
                className="h-3 w-3 rounded border-white/20 bg-black/20 accent-cyan-400"
              />
              {/* Address */}
              <div className="relative">
                <input
                  value={row.address}
                  onChange={(e) => update(row.id, { address: e.target.value })}
                  placeholder="G… or *stellar.org"
                  className={`w-full rounded-lg border px-3 py-1.5 text-xs text-white/80 placeholder-white/20 focus:outline-none font-mono transition-colors ${invalidTrustlineAddresses?.has(row.address)
                      ? "border-amber-400/50 bg-amber-400/[0.05] focus:border-amber-400"
                      : "border-white/[0.08] bg-white/[0.04] focus:border-cyan-400/50"
                    }`}
                />
                {invalidTrustlineAddresses?.has(row.address) && (
                  <AlertTriangle
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-amber-400"
                    aria-label="Missing trustline"
                  />
                )}
              </div>
              <input
                value={row.address}
                onChange={(e) => update(row.id, { address: e.target.value })}
                placeholder="G… or *stellar.org"
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 placeholder-white/20 focus:border-cyan-400/50 focus:outline-none font-mono"
              />
              {/* Asset */}
              <select
                value={row.asset || "XLM"}
                onChange={(e) => update(row.id, { asset: e.target.value })}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-xs text-white/80 focus:border-cyan-400/50 focus:outline-none"
              >
                <option value="XLM">XLM</option>
                <option value="USDC">USDC</option>
                <option value="EURC">EURC</option>
                <option value="SRT">SRT</option>
              </select>
              {/* Amount */}
              <input
                value={row.amount}
                onChange={(e) => update(row.id, { amount: e.target.value })}
                placeholder="0.00"
                type="number"
                min="0"
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 placeholder-white/20 focus:border-cyan-400/50 focus:outline-none"
              />
              {/* Memo type */}
              <MemoTypeSelect
                value={row.memoType}
                onChange={(v) => update(row.id, { memoType: v, memo: "" })}
              />
              {/* Memo value */}
              <input
                value={row.memo}
                onChange={(e) => update(row.id, { memo: e.target.value })}
                disabled={row.memoType === "none"}
                placeholder={
                  row.memoType === "id"
                    ? "e.g. 123456789"
                    : row.memoType === "text"
                      ? "e.g. invoice-42"
                      : "—"
                }
                className={`rounded-lg border px-3 py-1.5 text-xs text-white/80 placeholder-white/20 focus:outline-none transition-colors ${row.memoError
                    ? "border-red-400/50 bg-red-400/[0.05] focus:border-red-400"
                    : "border-white/[0.08] bg-white/[0.04] focus:border-cyan-400/50"
                  } disabled:opacity-30`}
              />
              {/* Remove */}
              <button
                onClick={() => removeRow(row.id)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-white/20 hover:text-red-400/70 transition-colors"
              >
                ✕
              </button>
            </div>
            {/* Inline memo error */}
            {row.memoError && (
              <p className="pl-[calc(24px+1fr+80px+80px+90px+8px)] text-[10px] text-red-400/80 col-start-5">
                ⚠ {row.memoError}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Add row */}
      <button
        onClick={addRow}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.1] py-2.5 text-xs text-white/30 hover:border-cyan-400/30 hover:text-cyan-400/60 transition-colors"
      >
        + Add Recipient
      </button>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              {selectedRows.size} recipient{selectedRows.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedRows(new Set())}
              className="text-xs text-white/50 hover:text-white/80 underline"
            >
              Clear selection
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-400/20 transition-colors"
            >
              🗑️ Delete Selected
            </button>

            <button
              onClick={handleBulkMultiplyAmount}
              className="flex items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-400 hover:bg-violet-400/20 transition-colors"
            >
              ×2 Multiply Amount
            </button>

            <button
              onClick={handleBulkChangeAsset}
              className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-400/20 transition-colors"
            >
              🔄 Change to USDC
            </button>
          </div>
        </div>
      )}

      {/* Validation summary */}
      {hasErrors && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-2.5">
          <p className="text-[11px] text-red-400/80">
            ⚠ Some memo values are invalid. Please fix them before dispatching.
          </p>
        </div>
      )}
    </div>
  );
}
