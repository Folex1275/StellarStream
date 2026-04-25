"use client";

/**
 * Audit Trail Page
 * Issue #1004 — Dedicated page for the hash-chained audit-log visualizer.
 */

import { AuditTrailVisualizer } from "@/components/dashboard/AuditTrailVisualizer";
import { ShieldCheck, Info } from "lucide-react";

export default function AuditTrailPage() {
    return (
        <div className="mx-auto max-w-3xl px-6 py-8">
            {/* Page header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                    <h1 className="font-heading text-2xl font-bold text-white/90">
                        Audit Trail
                    </h1>
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400/60" />
                    <p className="text-sm text-white/50 leading-relaxed">
                        This page visualizes the protocol&apos;s hash-chained audit log. Each entry
                        is cryptographically linked to the previous one via SHA-256. The
                        verification is performed <strong className="text-white/70">locally in your browser</strong> — no server
                        round-trip is required. A <span className="text-emerald-400">green shield</span> means the link hash
                        matches its recomputed value; a <span className="text-rose-400">red cross</span> indicates the chain
                        has been tampered with at that point.
                    </p>
                </div>
            </div>

            {/* Visualizer */}
            <AuditTrailVisualizer />
        </div>
    );
}

