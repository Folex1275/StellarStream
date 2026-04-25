"use client";

import { useEffect, useMemo, useState } from "react";

type InvoiceStatus = "DRAFT" | "SIGNED" | "COMPLETED" | "EXPIRED";

interface InvoiceLink {
  id: string;
  slug: string;
  sender: string;
  receiver: string;
  amount: string;
  tokenAddress: string;
  duration: number;
  description?: string;
  pdfUrl?: string;
  xdrParams: string;
  status: InvoiceStatus;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProcessDisbursementResponse {
  success: boolean;
  data: {
    valid: { address: string; amountStroops: string }[];
    errors: { row: number; address: string; reason: string }[];
    totalRows: number;
  };
}

const UNPAID_STATUSES: InvoiceStatus[] = ["DRAFT", "SIGNED"];

export default function InvoiceLinksPage() {
  const [invoices, setInvoices] = useState<InvoiceLink[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundleStatus, setBundleStatus] = useState<"idle" | "pending" | "complete" | "error">("idle");
  const [bundleMessage, setBundleMessage] = useState<string>("");
  const [bundleResult, setBundleResult] = useState<ProcessDisbursementResponse["data"] | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch("/api/v1/invoice-links");
        if (!resp.ok) {
          throw new Error(`Failed to load invoices: ${resp.status}`);
        }
        const data = (await resp.json()) as InvoiceLink[];
        setInvoices(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);

  const unpaidInvoices = useMemo(
    () => invoices.filter((invoice) => UNPAID_STATUSES.includes(invoice.status)),
    [invoices],
  );

  const selectedInvoices = useMemo(
    () => unpaidInvoices.filter((invoice) => selectedIds.has(invoice.id)),
    [unpaidInvoices, selectedIds],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const addToSplitter = (invoice: InvoiceLink) => {
    toggleSelect(invoice.id);
  };

  const bundleToSplitter = async () => {
    if (selectedInvoices.length === 0) {
      setBundleMessage("Select at least one invoice to bundle into a splitter disbursement.");
      return;
    }

    setBundleStatus("pending");
    setBundleMessage("Processing bundle to splitter...");
    setBundleResult(null);

    try {
      const payload = selectedInvoices.map((invoice) => ({
        address: invoice.receiver,
        amount: invoice.amount,
      }));

      const resp = await fetch("/api/v3/process-disbursement-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        throw new Error(`Disbursement preprocessing failed: ${resp.status}`);
      }

      const body = (await resp.json()) as ProcessDisbursementResponse;
      if (!body.success) {
        throw new Error("Disbursement preprocessing returned success=false");
      }

      setBundleResult(body.data);
      setBundleStatus("complete");
      setBundleMessage("Splitter bundle prepared successfully.");
    } catch (err) {
      setBundleStatus("error");
      setBundleMessage(err instanceof Error ? err.message : "Unknown error during bundling.");
    }
  };

  return (
    <main className="space-y-6 p-6 text-white">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-heading">Nebula-Pay Invoice Dashboard</h1>
          <p className="text-sm text-slate-300">Select unpaid invoices and bundle them into a single Splitter disbursement.</p>
        </div>

        <button
          onClick={bundleToSplitter}
          disabled={bundleStatus === "pending" || selectedInvoices.length === 0}
          className="rounded-xl bg-cyan-400 px-4 py-2 font-bold text-black transition hover:bg-cyan-300 disabled:opacity-50"
          data-testid="bundle-button"
        >
          Bundle Selected ({selectedInvoices.length}) to Splitter
        </button>
      </header>

      {loading && <p>Loading invoices…</p>}
      {error && <p className="text-red-200">{error}</p>}

      {!loading && !error && unpaidInvoices.length === 0 && (
        <p>No unpaid invoices found.</p>
      )}

      {!loading && !error && unpaidInvoices.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/70">
              <tr>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {unpaidInvoices.map((invoice) => {
                const isSelected = selectedIds.has(invoice.id);
                return (
                  <tr key={invoice.id} className={isSelected ? "bg-cyan-500/10" : ""}>
                    <td className="px-4 py-3 font-mono text-xs text-white/85">{invoice.receiver}</td>
                    <td className="px-4 py-3 text-sm font-medium">{invoice.amount}</td>
                    <td className="px-4 py-3 text-sm">{invoice.tokenAddress ?? "--"}</td>
                    <td className="px-4 py-3 text-sm">{invoice.slug}</td>
                    <td className="px-4 py-3 text-sm">{invoice.status}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => addToSplitter(invoice)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                          isSelected
                            ? "bg-emerald-400 text-black"
                            : "bg-slate-700/70 text-white hover:bg-slate-600"
                        }`}
                        data-testid={`add-to-splitter-${invoice.id}`}
                      >
                        {isSelected ? "Remove from Splitter" : "Add to Splitter"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {bundleMessage && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/50 p-4">
          <p className={bundleStatus === "error" ? "text-red-300" : "text-green-200"}>{bundleMessage}</p>
          {bundleResult && (
            <div className="text-xs text-slate-200">
              <p>Total rows: {bundleResult.totalRows}</p>
              <p>Valid recipients: {bundleResult.valid.length}</p>
              <p>Errors: {bundleResult.errors.length}</p>
            </div>
          )}
        </div>
      )}

      {selectedInvoices.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
          <p className="font-semibold">Splitter payload preview</p>
          <ul className="mt-2 space-y-1 max-h-44 overflow-y-auto">
            {selectedInvoices.map((invoice) => (
              <li key={invoice.id} className="flex justify-between text-xs">
                <span>{invoice.receiver}</span>
                <span>{invoice.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
