"use client";

import { useState, useMemo } from "react";
import { 
  ArrowRightLeft, 
  Download,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react";
import { BulkUpload } from "@/components/bulk-upload";
import type { RecipientRow } from "@/components/recipient-grid";
import { computeSplitDiff, exportDiffToCSV, type SplitDiffRow } from "@/lib/split-diff";
import { motion, AnimatePresence } from "framer-motion";

export default function SplitComparisonPage() {
  const [baseRows, setBaseRows] = useState<RecipientRow[] | null>(null);
  const [currRows, setCurrRows] = useState<RecipientRow[] | null>(null);

  const diffResult = useMemo(() => {
    if (!baseRows || !currRows) return null;
    return computeSplitDiff(baseRows, currRows);
  }, [baseRows, currRows]);

  const handleExport = () => {
    if (!diffResult) return;
    const csvContent = exportDiffToCSV(diffResult);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `split_diff_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: SplitDiffRow["status"]) => {
    switch (status) {
      case "New": return <PlusCircle className="h-4 w-4 text-emerald-400" />;
      case "Removed": return <MinusCircle className="h-4 w-4 text-red-400" />;
      case "Changed": return <RefreshCw className="h-4 w-4 text-amber-400" />;
      case "Unchanged": return <CheckCircle2 className="h-4 w-4 text-white/20" />;
    }
  };

  const getStatusBadge = (status: SplitDiffRow["status"]) => {
    switch (status) {
      case "New":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-400/20">{getStatusIcon(status)} New</span>;
      case "Removed":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-400/10 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-400/20">{getStatusIcon(status)} Removed</span>;
      case "Changed":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 border border-amber-400/20">{getStatusIcon(status)} Changed</span>;
      case "Unchanged":
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/40 border border-white/10">{getStatusIcon(status)} Unchanged</span>;
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <ArrowRightLeft className="h-8 w-8 text-cyan-400" />
          Split Comparison
        </h2>
        <p className="font-body text-sm text-white/50">
          Upload two past splits (CSV) to analyze changes in payroll addresses and amounts.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Baseline Upload */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex justify-between items-center">
            <span>1. Baseline Split (Old)</span>
            {baseRows && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          </h3>
          {baseRows ? (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-emerald-300">Baseline Loaded</p>
                  <p className="text-xs text-white/40">{baseRows.length} valid recipient{baseRows.length !== 1 && "s"}</p>
                </div>
              </div>
              <button onClick={() => setBaseRows(null)} className="text-xs text-white/30 hover:text-white transition-colors underline">Change</button>
            </div>
          ) : (
            <BulkUpload onImport={setBaseRows} />
          )}
        </div>

        {/* Current Upload */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex justify-between items-center">
            <span>2. Current Split (New)</span>
            {currRows && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          </h3>
          {currRows ? (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-6 w-6 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium text-cyan-300">Current Loaded</p>
                  <p className="text-xs text-white/40">{currRows.length} valid recipient{currRows.length !== 1 && "s"}</p>
                </div>
              </div>
              <button onClick={() => setCurrRows(null)} className="text-xs text-white/30 hover:text-white transition-colors underline">Change</button>
            </div>
          ) : (
            <BulkUpload onImport={setCurrRows} />
          )}
        </div>
      </div>

      {/* Diff Results */}
      <AnimatePresence>
        {diffResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-white/10 bg-white/[0.02] p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-heading text-xl text-white">Comparison Analysis</h3>
                <p className="text-xs text-white/40 mt-1">Comparing Baseline against Current split.</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span className="flex items-center gap-1"><PlusCircle className="h-3 w-3 text-emerald-400" /> New: {diffResult.filter(d => d.status === "New").length}</span>
                  <span className="flex items-center gap-1"><MinusCircle className="h-3 w-3 text-red-400" /> Removed: {diffResult.filter(d => d.status === "Removed").length}</span>
                  <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3 text-amber-400" /> Changed: {diffResult.filter(d => d.status === "Changed").length}</span>
                </div>
                
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/40">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-4 py-3 font-medium text-white/40">Status</th>
                    <th className="px-4 py-3 font-medium text-white/40">Recipient Address (Public Key)</th>
                    <th className="px-4 py-3 font-medium text-white/40 text-right">Baseline Amount</th>
                    <th className="px-4 py-3 font-medium text-white/40 text-right">Current Amount</th>
                    <th className="px-4 py-3 font-medium text-white/40 text-right">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {diffResult.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-white/40">
                        No recipients found in either file.
                      </td>
                    </tr>
                  )}
                  {diffResult.map((row) => (
                    <tr 
                      key={row.address} 
                      className={`
                        transition-colors hover:bg-white/[0.02]
                        ${row.status === "Removed" ? "bg-red-950/20" : ""}
                        ${row.status === "New" ? "bg-emerald-950/20" : ""}
                      `}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(row.status)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-white/80">
                        {row.address}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono text-xs ${!row.baseAmount ? "text-white/20" : "text-white/60"}`}>
                        {row.baseAmount ?? "—"}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono text-xs ${!row.currAmount ? "text-white/20" : "text-white"}`}>
                        {row.currAmount ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {row.deltaAmount === 0 || row.deltaAmount === null ? (
                          <span className="text-white/20 text-xs">—</span>
                        ) : row.deltaAmount > 0 ? (
                          <span className="text-emerald-400 font-bold text-xs">+{row.deltaAmount}</span>
                        ) : (
                          <span className="text-red-400 font-bold text-xs">{row.deltaAmount}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
