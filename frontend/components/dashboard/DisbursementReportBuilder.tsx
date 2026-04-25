"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { CalendarDays, FileText, Download, Filter } from "lucide-react";
import {
  downloadDisbursementReportCsv,
  type DisbursementReportRow,
} from "@/lib/disbursement-report";
import { generateDisbursementReportPDF } from "@/lib/disbursement-report-pdf";

const DEFAULT_START = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
const DEFAULT_END = new Date();

const MOCK_DISBURSEMENTS: DisbursementReportRow[] = [
  { date: "2026-03-11", streamId: "STRM-4123", asset: "USDC", recipient: "GDB...92AF", amount: 32_500.0, status: "Completed", txHash: "7c9f1a2b3d4e5f6a7b8c9d0e" },
  { date: "2026-03-18", streamId: "STRM-4271", asset: "BRLG", recipient: "GCD...14F2", amount: 18_250.5, status: "Completed", txHash: "8b0a9c7d6e5f4a3b2c1d0e9f" },
  { date: "2026-03-22", streamId: "STRM-4390", asset: "ARST", recipient: "GDE...77BC", amount: 9_900.0, status: "Pending", txHash: "2f1e0d9c8b7a6f5e4d3c2b1a" },
  { date: "2026-03-27", streamId: "STRM-4512", asset: "USDC", recipient: "GQC...3D21", amount: 43_100.75, status: "Completed", txHash: "3c2b1a0f9e8d7c6b5a4f3e2d" },
  { date: "2026-03-30", streamId: "STRM-4624", asset: "XLM", recipient: "GBZ...C5A9", amount: 12_000.0, status: "Cancelled", txHash: "1d2c3b4a5e6f7d8c9b0a1f2e" },
  { date: "2026-04-02", streamId: "STRM-4728", asset: "USDC", recipient: "GCE...4B6D", amount: 22_700.0, status: "Completed", txHash: "9f8e7d6c5b4a3f2e1d0c9b8a" },
  { date: "2026-04-05", streamId: "STRM-4831", asset: "BRLG", recipient: "GCY...1F3E", amount: 6_400.25, status: "Completed", txHash: "0a1b2c3d4e5f6a7b8c9d0e1f" },
  { date: "2026-04-08", streamId: "STRM-4937", asset: "USDC", recipient: "GDF...6A8F", amount: 28_900.0, status: "Pending", txHash: "5f4e3d2c1b0a9e8d7c6b5a4f" },
  { date: "2026-04-10", streamId: "STRM-5040", asset: "ARST", recipient: "GCB...DA12", amount: 11_100.0, status: "Completed", txHash: "c1d2e3f4a5b6c7d8e9f0a1b2" },
  { date: "2026-04-12", streamId: "STRM-5155", asset: "USDC", recipient: "GCE...55AF", amount: 39_800.5, status: "Completed", txHash: "e2d3c4b5a6f7e8d9c0b1a2f3" },
  { date: "2026-04-14", streamId: "STRM-5268", asset: "BRLG", recipient: "GDA...19CF", amount: 15_600.0, status: "Completed", txHash: "f3e4d5c6b7a8f9e0d1c2b3a4" },
  { date: "2026-04-16", streamId: "STRM-5382", asset: "XLM", recipient: "GBR...7F2D", amount: 4_500.0, status: "Completed", txHash: "a4b5c6d7e8f9a0b1c2d3e4f5" },
  { date: "2026-04-17", streamId: "STRM-5497", asset: "USDC", recipient: "GDE...1B7A", amount: 27_400.0, status: "Completed", txHash: "b5c6d7e8f9a0b1c2d3e4f5a6" },
  { date: "2026-04-18", streamId: "STRM-5603", asset: "ARST", recipient: "GDF...5C3B", amount: 8_250.0, status: "Completed", txHash: "d6e7f8a9b0c1d2e3f4a5b6c7" },
  { date: "2026-04-19", streamId: "STRM-5719", asset: "USDC", recipient: "GCB...2F8E", amount: 31_800.75, status: "Pending", txHash: "c7d8e9f0a1b2c3d4e5f6a7b8" },
];

const ASSET_OPTIONS = ["All", "USDC", "BRLG", "ARST", "XLM"];
const STATUS_OPTIONS = ["All", "Completed", "Pending", "Cancelled"];

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toReadableAmount(amount: number): string {
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function DisbursementReportBuilder() {
  const [startDate, setStartDate] = useState(formatIsoDate(DEFAULT_START));
  const [endDate, setEndDate] = useState(formatIsoDate(DEFAULT_END));
  const [assetFilter, setAssetFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const filteredRows = useMemo(() => {
    return MOCK_DISBURSEMENTS.filter((row) => {
      const insideRange = row.date >= startDate && row.date <= endDate;
      const matchesAsset = assetFilter === "All" || row.asset === assetFilter;
      const matchesStatus = statusFilter === "All" || row.status === statusFilter;
      return insideRange && matchesAsset && matchesStatus;
    });
  }, [startDate, endDate, assetFilter, statusFilter]);

  const previewRows = filteredRows.slice(0, 10);
  const totalAmount = filteredRows.reduce(
    (sum: number, row: DisbursementReportRow) => sum + row.amount,
    0,
  );

  const handleDownloadCsv = () => {
    if (filteredRows.length === 0) return;
    downloadDisbursementReportCsv(filteredRows);
  };

  const handleExportPdf = async () => {
    if (filteredRows.length === 0) return;
    setIsGeneratingPdf(true);
    try {
      await generateDisbursementReportPDF({
        title: "Disbursement Report",
        generatedAt: new Date().toLocaleString("en-US", { hour12: false }),
        startDate,
        endDate,
        assetFilter,
        statusFilter,
        rows: filteredRows,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
              <CalendarDays className="h-4 w-4" />
              Disbursement Reports
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Institutional Disbursement Builder</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Configure date ranges, filter by asset, and preview the first 10 rows of a compliance-ready disbursement report.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={filteredRows.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Download CSV
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={filteredRows.length === 0 || isGeneratingPdf}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileText className="h-4 w-4" />
              {isGeneratingPdf ? "Generating PDF…" : "Export PDF"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="rounded-3xl border border-white/10 bg-black/40 p-4">
            <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Start Date</span>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setStartDate(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label className="rounded-3xl border border-white/10 bg-black/40 p-4">
            <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-white/40">End Date</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setEndDate(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label className="rounded-3xl border border-white/10 bg-black/40 p-4">
            <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Asset Filter</span>
            <select
              value={assetFilter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setAssetFilter(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            >
              {ASSET_OPTIONS.map((asset) => (
                <option key={asset} value={asset} className="bg-black text-white">
                  {asset}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="rounded-3xl border border-white/10 bg-black/40 p-4">
            <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Status Filter</span>
            <select
              value={statusFilter}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatusFilter(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status} className="bg-black text-white">
                  {status}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Matching Disbursements</p>
            <p className="mt-3 text-3xl font-bold text-white">{filteredRows.length}</p>
            <p className="mt-1 text-sm text-white/50">Rows within the selected filters.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/40">Total Amount</p>
            <p className="mt-3 text-3xl font-bold text-cyan-300">${toReadableAmount(totalAmount)}</p>
            <p className="mt-1 text-sm text-white/50">Report total for the current filter.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/40">Preview Mode</p>
            <h2 className="mt-2 text-2xl font-bold text-white">First 10 rows</h2>
            <p className="mt-1 text-sm text-white/50">This preview demonstrates the data that will be included in the final export.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Filter className="h-4 w-4" />
            <span>{assetFilter === "All" ? "All assets" : assetFilter} · {statusFilter === "All" ? "All statuses" : statusFilter}</span>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-black/40">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-white/50">Date</th>
                <th className="px-4 py-3 text-white/50">Stream</th>
                <th className="px-4 py-3 text-white/50">Recipient</th>
                <th className="px-4 py-3 text-right text-white/50">Amount</th>
                <th className="px-4 py-3 text-white/50">Asset</th>
                <th className="px-4 py-3 text-white/50">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {previewRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-white/40">
                    No disbursements match the current filters.
                  </td>
                </tr>
              ) : (
                previewRows.map((row) => (
                  <tr key={row.txHash} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 text-white/70">{row.date}</td>
                    <td className="px-4 py-3 font-mono text-white/70">{row.streamId}</td>
                    <td className="px-4 py-3 text-white/70">{row.recipient}</td>
                    <td className="px-4 py-3 text-right font-semibold text-white">${toReadableAmount(row.amount)}</td>
                    <td className="px-4 py-3 text-white/70">{row.asset}</td>
                    <td className="px-4 py-3 text-white/70">{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredRows.length > previewRows.length && (
          <p className="mt-4 text-sm text-white/40">
            Showing the first 10 rows. Export will include all {filteredRows.length} matching rows.
          </p>
        )}
      </section>
    </div>
  );
}
