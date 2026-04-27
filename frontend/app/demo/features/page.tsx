"use client";

// demo page for the new SignatureProgress and RecipientGrid components
// This demonstrates the implemented features for issues #678 and #789

import React, { useState } from "react";
import { SignatureProgress } from "@/components/dashboard/SignatureProgress";
import { RecipientGrid, type RecipientRow } from "@/components/recipient-grid";

export default function DemoPage() {
  const [rows, setRows] = useState<RecipientRow[]>([
    {
      id: "1",
      address: "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ",
      amount: "100",
      asset: "XLM",
      memoType: "text",
      memo: "Payment for services",
    },
    {
      id: "2",
      address: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
      amount: "50",
      asset: "USDC",
      memoType: "id",
      memo: "12345",
    },
  ]);

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-cyan-400 mb-4">
            StellarStream Feature Demo
          </h1>
          <p className="text-lg text-white/60">
            Demonstrating Multi-Sig Transaction Status Tracker (#678) and Bulk-Action Grid Controls (#789)
          </p>
        </header>

        {/* Issue #678: Multi-Sig Transaction Status Tracker */}
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">
              🛡️ Multi-Sig Transaction Status Tracker (Issue #678)
            </h2>
            <p className="text-white/60 mb-6">
              Shows real-time approval progress for transactions requiring multiple signatures.
              Features visual progress ring, signature status, and waiting labels.
            </p>

            <div className="grid gap-8 md:grid-cols-2">
              {/* 2-of-3 Multi-sig Example */}
              <div>
                <h3 className="text-lg font-semibold mb-4">2-of-3 Multi-Sig Transaction</h3>
                <SignatureProgress
                  accountAddress="GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ"
                  requiredSignatures={2}
                  totalSigners={3}
                />
              </div>

              {/* 3-of-5 Multi-sig Example */}
              <div>
                <h3 className="text-lg font-semibold mb-4">3-of-5 Multi-Sig Transaction</h3>
                <SignatureProgress
                  accountAddress="GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H"
                  requiredSignatures={3}
                  totalSigners={5}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Issue #789: Bulk-Action Grid Controls */}
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-violet-400 mb-4">
              📋 Bulk-Action Grid Controls (Issue #789)
            </h2>
            <p className="text-white/60 mb-6">
              Enhanced recipient grid with multi-checkbox selection and bulk actions:
              Delete selected, Multiply Amount, and Change Asset.
            </p>

            <RecipientGrid rows={rows} onChange={setRows} />

            <div className="mt-6 p-4 bg-white/[0.02] rounded-xl">
              <h4 className="font-semibold mb-2">Features Implemented:</h4>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• ✅ Multi-checkbox selection with "select all" option</li>
                <li>• ✅ Bulk delete selected recipients</li>
                <li>• ✅ Bulk multiply amounts (×2)</li>
                <li>• ✅ Bulk change asset (to USDC)</li>
                <li>• ✅ Asset column added to grid</li>
                <li>• ✅ CSV import updated to handle asset field</li>
                <li>• ✅ Visual feedback for selected items</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="text-center text-white/40 text-sm">
          <p>Implementation completed for GitHub Issues #678 and #789</p>
        </footer>
      </div>
    </div>
  );
}