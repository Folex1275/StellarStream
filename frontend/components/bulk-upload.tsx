"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { parseBulkFile, type BulkParseResult, type ParseError } from "@/lib/bulk-parser";
import type { RecipientRow } from "@/components/recipient-grid";
import { ConflictResolver } from "@/components/conflict-resolver";

// ─── Props ────────────────────────────────────────────────────────────────────

interface BulkUploadProps {
  onImport: (rows: RecipientRow[]) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BulkUpload({ onImport }: BulkUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<BulkParseResult | null>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = e.target?.result as string;
      const parsed = parseBulkFile(raw, file.name);
      setResult(parsed);
      // If there are no errors, auto-import valid. If there are errors, wait for the user to resolve them or manually discard.
      if (parsed.valid.length && parsed.errors.length === 0) {
        onImport(parsed.valid);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <label
        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-8 text-center transition-colors hover:border-cyan-400/30 hover:bg-white/[0.04]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <Upload className="h-5 w-5 text-white/20" />
        <span className="font-body text-xs text-white/40">
          Drop a <span className="text-white/60">.csv</span> or{" "}
          <span className="text-white/60">.json</span> file, or{" "}
          <span className="text-cyan-400/70 underline underline-offset-2">browse</span>
        </span>
        <span className="font-body text-[10px] text-white/20">
          Required columns: Address (or Public Key), Amount
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </label>

      {/* Summary */}
      {result && (
        <div className="space-y-2">
          {/* Counts */}
          <div className="flex gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="font-body text-xs text-emerald-300">
                {result.valid.length} valid record{result.valid.length !== 1 ? "s" : ""}
              </span>
            </div>
            {result.errors.length > 0 && (
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/[0.05] px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                <span className="font-body text-xs text-red-300">
                  {result.errors.length} error{result.errors.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Conflict Resolver */}
          {result.errors.length > 0 && (
            <div className="mt-4">
              <ConflictResolver
                errors={result.errors}
                onResolve={(resolved, remaining) => {
                  const newValid = [...result.valid, ...resolved];
                  setResult({ valid: newValid, errors: remaining });
                  if (newValid.length > 0) {
                    onImport(newValid);
                  }
                }}
                onDiscardAll={() => {
                  setResult({ valid: result.valid, errors: [] });
                  if (result.valid.length > 0) {
                    onImport(result.valid);
                  }
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
