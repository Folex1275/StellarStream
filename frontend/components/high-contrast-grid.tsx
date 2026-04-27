"use client";

import type { ReactNode } from "react";

interface HighContrastGridColumn<T> {
  key: keyof T | string;
  header: string;
  render: (row: T, rowIndex: number) => ReactNode;
  className?: string;
}

interface HighContrastGridProps<T> {
  rows: T[];
  columns: HighContrastGridColumn<T>[];
  rowKey: (row: T, rowIndex: number) => string;
  emptyState?: ReactNode;
}

/**
 * HighContrastGrid
 * Specialized variant for data-heavy sessions where readability is prioritized.
 * - Tighter row spacing for scanning dense lists
 * - Stronger font weights and tabular numerals for large numeric values
 * - Higher-contrast row chrome for rapid visual differentiation
 */
export function HighContrastGrid<T>({
  rows,
  columns,
  rowKey,
  emptyState,
}: HighContrastGridProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/15 bg-black/30 p-4">
        {emptyState ?? <p className="text-sm font-semibold text-white/60">No rows</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_110px_72px] items-center gap-3 rounded-lg bg-white/[0.02] px-3 py-2">
        {columns.map((column) => (
          <p
            key={String(column.key)}
            className={`text-[10px] font-extrabold tracking-[0.12em] text-white/70 uppercase ${column.className ?? ""}`}
          >
            {column.header}
          </p>
        ))}
      </div>

      <div className="space-y-1.5">
        {rows.map((row, rowIndex) => (
          <div
            key={rowKey(row, rowIndex)}
            className="grid grid-cols-[1fr_110px_72px] items-center gap-3 rounded-lg border border-white/20 bg-black/45 px-3 py-2.5"
          >
            {columns.map((column) => (
              <div key={String(column.key)} className={column.className}>
                {column.render(row, rowIndex)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
