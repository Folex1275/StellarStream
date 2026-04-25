"use client";

import React from "react";
import { TreasuryTransparencyDashboard } from "@/components/dashboard/TreasuryTransparencyDashboard";
import { ShieldCheck, Info } from "lucide-react";

export default function TransparencyPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
            <h2 className="font-heading text-3xl font-bold tracking-tight text-white">Community Transparency</h2>
          </div>
          <p className="font-body text-sm text-white/50">
            Real-time audit of DAO Treasury inflows and disbursements via the Splitter.
          </p>
        </div>
        
        <div className="flex items-center gap-3 rounded-2xl border border-blue-400/20 bg-blue-400/5 px-4 py-3">
          <Info className="h-4 w-4 text-blue-400" />
          <p className="font-body text-[10px] text-blue-300/80 leading-relaxed max-w-[240px]">
            This dashboard is public and verifiable on the Stellar Ledger. All data points synchronized with Soroban events.
          </p>
        </div>
      </div>

      <TreasuryTransparencyDashboard />
    </div>
  );
}
