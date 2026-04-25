"use client";

// components/proof-of-payment-button.tsx
// Issues #776 / #777 — Trigger client-side PDF generation

import { useState } from "react";
import { generateProofOfPaymentPDF, type ProofOfPaymentData } from "@/lib/proof-of-payment-pdf";

interface Props {
  data: ProofOfPaymentData;
  className?: string;
}

export function ProofOfPaymentButton({ data, className = "" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      await generateProofOfPaymentPDF(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/[0.08] px-4 py-2 text-xs font-bold text-cyan-300 transition-colors hover:bg-cyan-400/[0.15] disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      )}
      {loading ? "Generating…" : "Export PDF"}
    </button>
  );
}
