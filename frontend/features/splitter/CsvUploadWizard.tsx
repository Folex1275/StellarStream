"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import Papa from "papaparse";
import { Upload, AlertTriangle, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { findFuzzyAddressMatches, truncateAddress, type DirectoryEntry } from "@/lib/fuzzy-address-match";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MappedRow {
  address: string;
  amount: string;
}

interface CsvUploadWizardProps {
  onComplete: (rows: MappedRow[]) => void;
  /** Organization directory for fuzzy address matching */
  directory?: DirectoryEntry[];
}

type WizardStep = "upload" | "map" | "preview";

const REQUIRED_FIELD = "address" as const;
const OPTIONAL_FIELD = "amount" as const;

// Common header aliases → canonical field
const ALIASES: Record<string, "address" | "amount"> = {
  address: "address",
  wallet: "address",
  "public key": "address",
  publickey: "address",
  recipient: "address",
  to: "address",
  amount: "amount",
  value: "amount",
  quantity: "amount",
  qty: "amount",
};

function guessMapping(headers: string[]): Record<string, "address" | "amount" | ""> {
  const result: Record<string, "address" | "amount" | ""> = {};
  for (const h of headers) {
    result[h] = ALIASES[h.toLowerCase().trim()] ?? "";
  }
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CsvUploadWizard({ onComplete, directory }: CsvUploadWizardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<WizardStep>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, "address" | "amount" | "">>({});
  const [error, setError] = useState<string | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Only .csv files are supported.");
      return;
    }
    setError(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (!result.data.length) {
          setError("CSV is empty or could not be parsed.");
          return;
        }
        const cols = result.meta.fields ?? [];
        if (!cols.length) {
          setError("No headers found in CSV.");
          return;
        }
        const first5 = result.data.slice(0, 5);
        setHeaders(cols);
        setRawRows(result.data);
        setPreview(first5.map((row) => cols.map((c) => row[c] ?? "")));
        setMapping(guessMapping(cols));
        setStep("map");
      },
      error: () => setError("Failed to parse CSV. Ensure it is valid UTF-8."),
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const mappedAddressCol = Object.entries(mapping).find(([, v]) => v === "address")?.[0];
  const mappedAmountCol = Object.entries(mapping).find(([, v]) => v === "amount")?.[0];

  function applyMapping(): void {
    if (!mappedAddressCol) {
      setError("You must map a column to Address.");
      return;
    }
    setError(null);
    setStep("preview");
  }

  function buildRows(): MappedRow[] {
    return rawRows
      .map((row) => ({
        address: (row[mappedAddressCol!] ?? "").trim(),
        amount: mappedAmountCol ? (row[mappedAmountCol] ?? "").trim() : "",
      }))
      .filter((r) => r.address.length > 0);
  }

  const mappedRows = step === "preview" ? buildRows() : [];
  const invalidCount = mappedRows.filter((r) => !r.address.startsWith("G") || r.address.length !== 56).length;

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs text-white/30">
        {(["upload", "map", "preview"] as WizardStep[]).map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <span className={step === s ? "text-cyan-400 font-semibold" : step > s ? "text-white/50" : ""}>
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            {i < 2 && <ArrowRight className="h-3 w-3" />}
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <label
              className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors ${isDragging
                ? "border-cyan-400/60 bg-cyan-400/[0.06]"
                : "border-white/[0.12] bg-white/[0.02] hover:border-cyan-400/30 hover:bg-white/[0.04]"
                }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-6 w-6 text-white/20" />
              <div>
                <p className="text-sm text-white/50">
                  Drop a <span className="text-white/70">.csv</span> file or{" "}
                  <span className="text-cyan-400/80 underline underline-offset-2">browse</span>
                </p>
                <p className="mt-1 text-[11px] text-white/25">
                  Expected columns: Address / Wallet / Public Key, Amount
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) processFile(f);
                  e.target.value = "";
                }}
              />
            </label>
            {error && <ErrorBanner message={error} />}
          </motion.div>
        )}

        {/* ── Step 2: Map columns ── */}
        {step === "map" && (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <p className="text-xs text-white/40">
              Map your CSV columns to the required protocol fields.
            </p>

            {/* Column mapping selectors */}
            <div className="space-y-2">
              {headers.map((h) => (
                <div key={h} className="flex items-center gap-3">
                  <span className="w-40 truncate rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/60">
                    {h}
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-white/20" />
                  <select
                    value={mapping[h] ?? ""}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, [h]: e.target.value as "address" | "amount" | "" }))
                    }
                    className="flex-1 rounded-lg border border-white/[0.08] bg-[#0d1117] px-3 py-1.5 text-xs text-white/70 focus:border-cyan-400/40 focus:outline-none"
                  >
                    <option value="">— ignore —</option>
                    <option value="address">Address (required)</option>
                    <option value="amount">Amount</option>
                  </select>
                </div>
              ))}
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-white/40">
                        {h}
                        {mapping[h] && (
                          <span className="ml-1 text-cyan-400/70">→ {mapping[h]}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04] last:border-0">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-1.5 text-white/50 font-mono">
                          {cell || <span className="text-white/20">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <ErrorBanner message={error} />}

            <div className="flex gap-2">
              <button
                onClick={() => { setStep("upload"); setError(null); }}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-white/50 hover:text-white/70 transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Re-upload
              </button>
              <button
                onClick={applyMapping}
                disabled={!mappedAddressCol}
                className="flex-1 rounded-lg bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Preview & confirm ── */}
        {step === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Summary badges */}
            <div className="flex gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-300">
                  {mappedRows.length - invalidCount} valid
                </span>
              </div>
              {invalidCount > 0 && (
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs text-amber-300">{invalidCount} invalid address</span>
                </div>
              )}
            </div>

            {/* Row preview */}
            <div className="max-h-48 overflow-y-auto rounded-xl border border-white/[0.08]">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-[#0d1117]">
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-3 py-2 text-left text-white/40">Address</th>
                    <th className="px-3 py-2 text-left text-white/40">Amount</th>
                    <th className="px-3 py-2 text-left text-white/40">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedRows.map((r, i) => {
                    const valid = r.address.startsWith("G") && r.address.length === 56;
                    const fuzzyMatches = !valid && directory
                      ? findFuzzyAddressMatches(r.address, directory, 2, 0.25)
                      : [];
                    return (
                      <tr key={i} className="border-b border-white/[0.04] last:border-0">
                        <td className="px-3 py-1.5 font-mono text-white/60 max-w-[180px] truncate">{r.address}</td>
                        <td className="px-3 py-1.5 text-white/50">{r.amount || "—"}</td>
                        <td className="px-3 py-1.5">
                          {valid ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 text-amber-400" />
                                <span className="text-[10px] text-amber-400/80">Invalid</span>
                              </div>
                              {fuzzyMatches.length > 0 && (
                                <div className="flex flex-col gap-0.5">
                                  {fuzzyMatches.map((m, idx) => (
                                    <span key={idx} className="text-[10px] text-cyan-400/80">
                                      Did you mean{" "}
                                      <span className="font-medium text-cyan-300">
                                        {m.name || truncateAddress(m.address)}
                                      </span>
                                      ?
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep("map")}
                className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs text-white/50 hover:text-white/70 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => onComplete(mappedRows.filter((r) => r.address.startsWith("G") && r.address.length === 56))}
                disabled={mappedRows.length - invalidCount === 0}
                className="flex-1 rounded-lg bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Import {mappedRows.length - invalidCount} recipients
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/[0.05] px-3 py-2">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
      <span className="text-xs text-red-300">{message}</span>
    </div>
  );
}
