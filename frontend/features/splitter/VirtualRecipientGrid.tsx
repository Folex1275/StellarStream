"use client";

/**
 * VirtualRecipientGrid
 * Issue: Virtualized recipient data grid — handles 120+ rows without lag.
 *
 * Virtualization strategy: CSS `content-visibility: auto` + a fixed-height
 * scroll container with a sentinel-based approach. We render all rows but use
 * `content-visibility` so the browser skips layout/paint for off-screen rows.
 * This gives near-identical perf to react-window without the extra dependency.
 *
 * Keyboard shortcuts:
 *   Tab  — move to next cell (wraps to next row)
 *   Enter — add a new row at the end (when on last row)
 *   Shift+Enter — insert row below current
 */

import { useRef, useState, useCallback, useEffect, KeyboardEvent, useMemo } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { AddressFuzzyDropdown } from "@/components/AddressFuzzyDropdown";
import { findFuzzyAddressMatches, type DirectoryEntry } from "@/lib/fuzzy-address-match";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GridRow {
  id: string;
  address: string;
  amount: string;
  /** Validation errors per field */
  errors: { address?: string; amount?: string };
}

interface VirtualRecipientGridProps {
  rows: GridRow[];
  onChange: (rows: GridRow[]) => void;
  /** Organization directory for fuzzy address matching */
  directory?: DirectoryEntry[];
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateAddress(v: string): string | undefined {
  if (!v) return undefined; // empty is ok until submit
  if (!v.startsWith("G")) return "Must start with G";
  if (v.length !== 56) return `Length ${v.length}/56`;
  if (!/^[A-Z2-7]{56}$/.test(v)) return "Invalid base32 characters";
  return undefined;
}

function validateAmount(v: string): string | undefined {
  if (!v) return undefined;
  const n = Number(v);
  if (isNaN(n) || n <= 0) return "Must be > 0";
  return undefined;
}

function validate(row: Omit<GridRow, "errors">): GridRow["errors"] {
  return {
    address: validateAddress(row.address),
    amount: validateAmount(row.amount),
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let _uid = 0;
const uid = () => `r${++_uid}`;

export function emptyRow(): GridRow {
  return { id: uid(), address: "", amount: "", errors: {} };
}

const COLS = ["address", "amount"] as const;
type Col = (typeof COLS)[number];

// ── Component ─────────────────────────────────────────────────────────────────

export function VirtualRecipientGrid({ rows, onChange, directory }: VirtualRecipientGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Track which cell is focused: [rowIndex, colIndex]
  const [focused, setFocused] = useState<[number, number] | null>(null);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateCell = useCallback(
    (rowIdx: number, col: Col, value: string) => {
      onChange(
        rows.map((r, i) => {
          if (i !== rowIdx) return r;
          const updated = { ...r, [col]: value };
          return { ...updated, errors: validate(updated) };
        }),
      );
    },
    [rows, onChange],
  );

  const addRow = useCallback(() => {
    onChange([...rows, emptyRow()]);
  }, [rows, onChange]);

  const insertRowAfter = useCallback(
    (idx: number) => {
      const next = [...rows];
      next.splice(idx + 1, 0, emptyRow());
      onChange(next);
    },
    [rows, onChange],
  );

  const deleteRow = useCallback(
    (idx: number) => {
      if (rows.length === 1) return; // keep at least one row
      onChange(rows.filter((_, i) => i !== idx));
    },
    [rows, onChange],
  );

  // ── Keyboard navigation ────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const nextCol = colIdx + 1;
        if (nextCol < COLS.length) {
          setFocused([rowIdx, nextCol]);
        } else {
          const nextRow = rowIdx + 1;
          if (nextRow < rows.length) {
            setFocused([nextRow, 0]);
          } else {
            // Tab on last cell of last row → add new row
            addRow();
            setFocused([rows.length, 0]);
          }
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          insertRowAfter(rowIdx);
          setFocused([rowIdx + 1, colIdx]);
        } else if (rowIdx === rows.length - 1) {
          addRow();
          setFocused([rows.length, 0]);
        }
      }
    },
    [rows.length, addRow, insertRowAfter],
  );

  // Focus the correct input when `focused` changes
  useEffect(() => {
    if (!focused || !containerRef.current) return;
    const [r, c] = focused;
    const input = containerRef.current.querySelector<HTMLInputElement>(
      `[data-row="${r}"][data-col="${c}"]`,
    );
    input?.focus();
  }, [focused]);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const errorCount = rows.filter(
    (r) => r.errors.address || r.errors.amount,
  ).length;
  const totalAmount = rows.reduce((s, r) => {
    const n = parseFloat(r.amount);
    return s + (isNaN(n) ? 0 : n);
  }, 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">
      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        <span>{rows.length} row{rows.length !== 1 ? "s" : ""}</span>
        {totalAmount > 0 && (
          <span className="text-white/50">
            Total: <span className="text-cyan-400/80">{totalAmount.toLocaleString()}</span>
          </span>
        )}
        {errorCount > 0 && (
          <span className="flex items-center gap-1 text-amber-400/80">
            <AlertTriangle className="h-3 w-3" />
            {errorCount} validation error{errorCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Grid */}
      <div
        ref={containerRef}
        className="overflow-y-auto rounded-xl border border-white/[0.08]"
        style={{ maxHeight: "480px" }}
      >
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-[#0d1117]">
            <tr className="border-b border-white/[0.08]">
              <th className="w-8 px-2 py-2 text-center text-white/20 font-normal">#</th>
              <th className="px-3 py-2 text-left font-medium text-white/40">
                Address <span className="text-red-400/60">*</span>
              </th>
              <th className="w-36 px-3 py-2 text-left font-medium text-white/40">Amount</th>
              <th className="w-8 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <GridRowComponent
                key={row.id}
                row={row}
                rowIdx={rowIdx}
                onCellChange={updateCell}
                onKeyDown={handleKeyDown}
                onDelete={deleteRow}
                isFocused={focused?.[0] === rowIdx}
                directory={directory}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row button */}
      <button
        onClick={addRow}
        className="flex items-center gap-2 self-start rounded-lg border border-dashed border-white/[0.10] px-3 py-1.5 text-xs text-white/40 transition-colors hover:border-cyan-400/30 hover:text-cyan-400/70"
      >
        <Plus className="h-3.5 w-3.5" />
        Add row
      </button>
    </div>
  );
}

// ── Row sub-component ─────────────────────────────────────────────────────────

interface GridRowProps {
  row: GridRow;
  rowIdx: number;
  onCellChange: (rowIdx: number, col: Col, value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number) => void;
  onDelete: (rowIdx: number) => void;
  isFocused: boolean;
  directory?: DirectoryEntry[];
}

function GridRowComponent({ row, rowIdx, onCellChange, onKeyDown, onDelete, isFocused, directory }: GridRowProps) {
  const [showFuzzy, setShowFuzzy] = useState(false);

  const fuzzyMatches = useMemo(() => {
    if (!directory || !row.errors.address || !row.address) return [];
    return findFuzzyAddressMatches(row.address, directory, 3, 0.3);
  }, [directory, row.errors.address, row.address]);
  return (
    <tr
      className={`border-b border-white/[0.04] last:border-0 transition-colors ${isFocused ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
        }`}
      // content-visibility for virtualization without react-window
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 36px" } as React.CSSProperties}
    >
      {/* Row number */}
      <td className="px-2 py-1 text-center text-[10px] text-white/20 select-none">
        {rowIdx + 1}
      </td>

      {/* Address cell */}
      <td className="px-1 py-1">
        <div className="relative">
          <input
            data-row={rowIdx}
            data-col={0}
            value={row.address}
            onChange={(e) => {
              onCellChange(rowIdx, "address", e.target.value);
              setShowFuzzy(true);
            }}
            onFocus={() => setShowFuzzy(true)}
            onBlur={() => {
              // Delay hiding so the dropdown click can fire first
              setTimeout(() => setShowFuzzy(false), 150);
            }}
            onKeyDown={(e) => onKeyDown(e, rowIdx, 0)}
            placeholder="GABC…"
            spellCheck={false}
            className={`w-full rounded-md border bg-transparent px-2 py-1 font-mono text-[11px] text-white/70 placeholder-white/20 focus:outline-none focus:ring-1 transition-colors ${row.errors.address
              ? "border-amber-400/40 focus:ring-amber-400/30"
              : "border-white/[0.06] focus:border-cyan-400/40 focus:ring-cyan-400/20"
              }`}
          />
          {row.errors.address && fuzzyMatches.length === 0 && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-amber-400/80">
              {row.errors.address}
            </span>
          )}
          {showFuzzy && fuzzyMatches.length > 0 && (
            <AddressFuzzyDropdown
              matches={fuzzyMatches}
              onSelect={(addr) => {
                onCellChange(rowIdx, "address", addr);
                setShowFuzzy(false);
              }}
              onClose={() => setShowFuzzy(false)}
            />
          )}
        </div>
      </td>

      {/* Amount cell */}
      <td className="px-1 py-1">
        <input
          data-row={rowIdx}
          data-col={1}
          value={row.amount}
          onChange={(e) => onCellChange(rowIdx, "amount", e.target.value)}
          onKeyDown={(e) => onKeyDown(e, rowIdx, 1)}
          placeholder="0.00"
          inputMode="decimal"
          className={`w-full rounded-md border bg-transparent px-2 py-1 text-[11px] text-white/70 placeholder-white/20 focus:outline-none focus:ring-1 transition-colors ${row.errors.amount
            ? "border-amber-400/40 focus:ring-amber-400/30"
            : "border-white/[0.06] focus:border-cyan-400/40 focus:ring-cyan-400/20"
            }`}
        />
      </td>

      {/* Delete */}
      <td className="px-1 py-1">
        <button
          onClick={() => onDelete(rowIdx)}
          className="rounded p-1 text-white/20 transition-colors hover:text-red-400/70"
          tabIndex={-1}
          aria-label="Delete row"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}
