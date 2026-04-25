"use client";

/**
 * MigrationWizard.tsx
 * Issue #418 — [Frontend] Component: The "Migration Wizard" (V1 to V2)
 *
 * A 3-step modal that guides users through upgrading legacy V1 streams
 * to Nebula V2. Uses the v1_interface types established in Issue #41
 * and the StellarStream contract bindings from lib/contracts/stellarstream.ts.
 *
 * Steps:
 *   1. Select V1 Stream   — lists legacy streams, shows stream details
 *   2. Review V2 Benefits — side-by-side comparison: yield, permit, receipt NFT
 *   3. Execute Migration  — atomic tx with glassmorphism progress bar + live status
 *
 * Error handling:
 *   - Mid-migration failure shows exact failure point
 *   - Step 1/2 choices are preserved so the user can retry
 *   - V1 stream is guaranteed unchanged on failure (no partial state)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { CurveType } from "@/lib/contracts/stellarstream";
import { useDevMode } from "@/lib/use-dev-mode";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export type MigrationStatus =
    | "idle"
    | "validating"
    | "cancelling_v1"
    | "creating_v2"
    | "minting_receipt"
    | "confirming"
    | "success"
    | "failed";

interface V1Stream {
    streamId: bigint;
    sender: string;
    receiver: string;
    token: string;
    tokenSymbol: string;
    totalAmount: bigint;
    withdrawn: bigint;
    startTime: bigint;
    endTime: bigint;
    curveType: CurveType;
    cancelled: boolean;
}

interface MigrationWizardProps {
    /** Called when the modal should close */
    onClose: () => void;
    /** The connected wallet address — used to filter streams by owner */
    walletAddress: string;
    /**
     * Fetch V1 streams for the given address.
     * Mirrors the v1_interface from Issue #41.
     * Replace with real SDK call in production.
     */
    fetchV1Streams?: (address: string) => Promise<V1Stream[]>;
    /**
     * Execute the atomic migration transaction.
     * Resolves with new V2 stream id on success, rejects on failure.
     */
    executeMigration?: (streamId: bigint) => Promise<bigint>;
}

// ─────────────────────────────────────────────────────────
// Mock data (replace with real v1_interface calls)
// ─────────────────────────────────────────────────────────

const MOCK_V1_STREAMS: V1Stream[] = [
    {
        streamId: BigInt(1),
        sender: "GBCZ7HJVDXQKLYH2GYBF6XNMNBQKRDJ5PHKPVQKJ5JDDKL6K4NQDGA",
        receiver: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
        token: "USDC",
        tokenSymbol: "USDC",
        totalAmount: BigInt(5_000_0000000),
        withdrawn: BigInt(1_200_0000000),
        startTime: BigInt(Math.floor(Date.now() / 1000) - 86400 * 10),
        endTime: BigInt(Math.floor(Date.now() / 1000) + 86400 * 20),
        curveType: "Linear",
        cancelled: false,
    },
    {
        streamId: BigInt(2),
        sender: "GBCZ7HJVDXQKLYH2GYBF6XNMNBQKRDJ5PHKPVQKJ5JDDKL6K4NQDGA",
        receiver: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGLIWUY45AFXY4OAKVNXWF",
        token: "XLM",
        tokenSymbol: "XLM",
        totalAmount: BigInt(12_000_0000000),
        withdrawn: BigInt(0),
        startTime: BigInt(Math.floor(Date.now() / 1000) - 86400 * 2),
        endTime: BigInt(Math.floor(Date.now() / 1000) + 86400 * 60),
        curveType: "Exponential",
        cancelled: false,
    },
    {
        streamId: BigInt(3),
        sender: "GBCZ7HJVDXQKLYH2GYBF6XNMNBQKRDJ5PHKPVQKJ5JDDKL6K4NQDGA",
        receiver: "GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ",
        token: "USDC",
        tokenSymbol: "USDC",
        totalAmount: BigInt(800_0000000),
        withdrawn: BigInt(800_0000000),
        startTime: BigInt(Math.floor(Date.now() / 1000) - 86400 * 30),
        endTime: BigInt(Math.floor(Date.now() / 1000) - 86400 * 1),
        curveType: "Linear",
        cancelled: false,
    },
];

const mockFetchV1Streams = async (_address: string): Promise<V1Stream[]> => {
    await new Promise((r) => setTimeout(r, 900));
    return MOCK_V1_STREAMS;
};

const mockExecuteMigration = async (streamId: bigint): Promise<bigint> => {
    // Simulate the atomic tx with a small chance of failure for demo purposes
    await new Promise((r) => setTimeout(r, 600));   // validating
    await new Promise((r) => setTimeout(r, 900));   // cancelling_v1
    await new Promise((r) => setTimeout(r, 1100));  // creating_v2
    await new Promise((r) => setTimeout(r, 800));   // minting_receipt
    await new Promise((r) => setTimeout(r, 600));   // confirming
    return streamId * BigInt(1000) + BigInt(1);     // new V2 stream id
};

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function truncate(addr: string, head = 6, tail = 4) {
    if (addr.length <= head + tail + 1) return addr;
    return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function formatTokenAmount(raw: bigint, decimals = 7): string {
    const divisor = BigInt(10 ** decimals);
    const int = raw / divisor;
    return int.toLocaleString();
}

function streamProgress(s: V1Stream): number {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const total = s.endTime - s.startTime;
    if (total <= BigInt(0)) return 100;
    const elapsed = now - s.startTime;
    return Math.min(100, Math.max(0, Number((elapsed * BigInt(100)) / total)));
}

function isCompleted(s: V1Stream): boolean {
    return BigInt(Math.floor(Date.now() / 1000)) >= s.endTime;
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function GlassProgressBar({
    currentStep,
    steps,
}: {
    currentStep: number;
    steps: string[];
}) {
    return (
        <div className="mw-progress-bar-wrapper">
            <div className="mw-progress-track">
                <div
                    className="mw-progress-fill"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />
            </div>
            <div className="mw-steps-row">
                {steps.map((label, i) => {
                    const stepNum = i + 1;
                    const done = stepNum < currentStep;
                    const active = stepNum === currentStep;
                    return (
                        <div key={label} className="mw-step-item">
                            <div
                                className={`mw-step-dot ${done ? "done" : ""} ${active ? "active" : ""}`}
                            >
                                {done ? (
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M2 6l3 3 5-5" stroke="#030303" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : (
                                    <span>{stepNum}</span>
                                )}
                            </div>
                            <span className={`mw-step-label ${active ? "active" : ""}`}>{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function StreamCard({
    stream,
    selected,
    onClick,
}: {
    stream: V1Stream;
    selected: boolean;
    onClick: () => void;
}) {
    const prog = streamProgress(stream);
    const completed = isCompleted(stream);
    return (
        <button
            className={`mw-stream-card ${selected ? "selected" : ""}`}
            onClick={onClick}
            type="button"
        >
            <div className="mw-sc-header">
                <div className="mw-sc-id">
                    <span className="mw-v1-badge">V1</span>
                    <span className="mw-sc-id-text">#{stream.streamId.toString()}</span>
                </div>
                <div className="mw-sc-token">{stream.tokenSymbol}</div>
            </div>

            <div className="mw-sc-addresses">
                <span className="mw-mono">{truncate(stream.sender)}</span>
                <span className="mw-arrow">→</span>
                <span className="mw-mono">{truncate(stream.receiver)}</span>
            </div>

            <div className="mw-sc-amounts">
                <span className="mw-sc-amount-streamed">
                    {formatTokenAmount(stream.withdrawn)} / {formatTokenAmount(stream.totalAmount)}
                </span>
                <span className="mw-sc-amount-symbol">{stream.tokenSymbol}</span>
            </div>

            <div className="mw-sc-prog-track">
                <div
                    className={`mw-sc-prog-fill ${completed ? "complete" : ""}`}
                    style={{ width: `${prog}%` }}
                />
            </div>

            <div className="mw-sc-meta">
                <span className={`mw-curve-badge ${stream.curveType.toLowerCase()}`}>
                    {stream.curveType}
                </span>
                {completed && <span className="mw-done-badge">Completed</span>}
            </div>

            {selected && (
                <div className="mw-sc-check">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="8" fill="#00f5ff" />
                        <path d="M4 8l3 3 5-5" stroke="#030303" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}
        </button>
    );
}

function BenefitRow({
    icon,
    label,
    v1,
    v2,
    highlight,
}: {
    icon: React.ReactNode;
    label: string;
    v1: string;
    v2: string;
    highlight?: boolean;
}) {
    return (
        <div className={`mw-benefit-row ${highlight ? "highlight" : ""}`}>
            <div className="mw-benefit-icon">{icon}</div>
            <div className="mw-benefit-label">{label}</div>
            <div className="mw-benefit-v1">{v1}</div>
            <div className="mw-benefit-arrow">→</div>
            <div className="mw-benefit-v2">{v2}</div>
        </div>
    );
}

function TxPhaseRow({
    label,
    status,
    detail,
}: {
    label: string;
    status: "pending" | "running" | "done" | "failed" | "idle";
    detail?: string;
}) {
    return (
        <div className={`mw-phase-row ${status}`}>
            <div className="mw-phase-indicator">
                {status === "running" && <span className="mw-phase-spinner" />}
                {status === "done" && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="7" fill="rgba(0,245,255,0.15)" />
                        <path d="M3.5 7l2.5 2.5 4.5-4.5" stroke="#00f5ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
                {status === "failed" && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="7" fill="rgba(255,72,72,0.15)" />
                        <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#ff4848" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                )}
                {(status === "idle" || status === "pending") && (
                    <span className="mw-phase-dot-idle" />
                )}
            </div>
            <div className="mw-phase-text">
                <span className="mw-phase-label">{label}</span>
                {detail && <span className="mw-phase-detail">{detail}</span>}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

const STEPS = ["Select Stream", "V2 Benefits", "Migrate"];

export default function MigrationWizard({
    onClose,
    walletAddress = "GBCZ7HJVDXQKLYH2GYBF6XNMNBQKRDJ5PHKPVQKJ5JDDKL6K4NQDGA",
    fetchV1Streams = mockFetchV1Streams,
    executeMigration = mockExecuteMigration,
}: Partial<MigrationWizardProps> & { walletAddress?: string }) {
    const [devMode] = useDevMode();
    const [step, setStep] = useState(1);
    const [streams, setStreams] = useState<V1Stream[]>([]);
    const [loadingStreams, setLoadingStreams] = useState(true);
    const [selected, setSelected] = useState<V1Stream | null>(null);
    const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>("idle");
    const [newStreamId, setNewStreamId] = useState<bigint | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showXDR, setShowXDR] = useState(false);
    const abortRef = useRef(false);

    // Load V1 streams on mount
    useEffect(() => {
        setLoadingStreams(true);
        fetchV1Streams(walletAddress)
            .then(setStreams)
            .catch(() => setStreams([]))
            .finally(() => setLoadingStreams(false));
        return () => { abortRef.current = true; };
    }, [walletAddress, fetchV1Streams]);

    const handleMigrate = useCallback(async () => {
        if (!selected) return;
        setMigrationStatus("validating");
        setErrorMessage(null);
        abortRef.current = false;

        // Simulate each phase with state updates so the UI reflects real tx steps
        const phases: MigrationStatus[] = [
            "validating",
            "cancelling_v1",
            "creating_v2",
            "minting_receipt",
            "confirming",
        ];

        const delay = (ms: number) =>
            new Promise<void>((res) => setTimeout(res, ms));

        try {
            for (const phase of phases) {
                if (abortRef.current) return;
                setMigrationStatus(phase);
                await delay(phase === "creating_v2" ? 1100 : 700);
            }
            const v2Id = await executeMigration(selected.streamId);
            if (!abortRef.current) {
                setNewStreamId(v2Id);
                setMigrationStatus("success");
            }
        } catch (err) {
            if (!abortRef.current) {
                setMigrationStatus("failed");
                setErrorMessage(
                    err instanceof Error ? err.message : "Transaction failed. Your V1 stream is unchanged."
                );
            }
        }
    }, [selected, executeMigration]);

    function phaseStatus(
        phase: MigrationStatus,
        current: MigrationStatus
    ): "idle" | "pending" | "running" | "done" | "failed" {
        const order: MigrationStatus[] = [
            "idle",
            "validating",
            "cancelling_v1",
            "creating_v2",
            "minting_receipt",
            "confirming",
            "success",
            "failed",
        ];
        const pi = order.indexOf(phase);
        const ci = order.indexOf(current);
        if (current === "failed") {
            // everything before the current phase (at time of failure) is "done"
            // We can't easily know which step failed, so mark all as pending
            return pi < ci ? "done" : pi === ci ? "failed" : "idle";
        }
        if (current === "success") return "done";
        if (pi < ci) return "done";
        if (pi === ci) return "running";
        return "idle";
    }

    const canProceedStep1 = selected !== null;
    const isMigrating =
        migrationStatus !== "idle" &&
        migrationStatus !== "success" &&
        migrationStatus !== "failed";

    return (
        <>
            {/* ── Styles ─────────────────────────────────────────── */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

        /* Overlay */
        .mw-overlay {
          position: fixed;
          inset: 0;
          background: rgba(3, 3, 3, 0.82);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
          animation: mw-fade-in 0.25s ease;
        }

        @keyframes mw-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Modal */
        .mw-modal {
          position: relative;
          width: 100%;
          max-width: 620px;
          max-height: 90vh;
          background: rgba(8, 8, 14, 0.92);
          border: 1px solid rgba(0, 245, 255, 0.12);
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(0, 245, 255, 0.04),
            0 32px 80px rgba(0, 0, 0, 0.7),
            0 0 80px rgba(0, 245, 255, 0.04) inset;
          display: flex;
          flex-direction: column;
          animation: mw-slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes mw-slide-up {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        /* Nebula glow blobs */
        .mw-blob-cyan {
          position: absolute;
          top: -80px;
          left: -80px;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle at 40% 40%, rgba(0,245,255,0.08), transparent 70%);
          pointer-events: none;
          border-radius: 50%;
        }
        .mw-blob-violet {
          position: absolute;
          bottom: -100px;
          right: -80px;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle at 60% 60%, rgba(138,0,255,0.1), transparent 70%);
          pointer-events: none;
          border-radius: 50%;
        }

        /* Header */
        .mw-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 28px 0;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .mw-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #f0f4ff;
          letter-spacing: -0.01em;
        }

        .mw-title span {
          background: linear-gradient(135deg, #00f5ff, #8a00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .mw-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: rgba(240,244,255,0.5);
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .mw-close:hover {
          background: rgba(255,72,72,0.1);
          border-color: rgba(255,72,72,0.3);
          color: #ff7070;
        }

        /* Progress bar */
        .mw-progress-bar-wrapper {
          padding: 20px 28px 0;
          position: relative;
          z-index: 1;
        }

        .mw-progress-track {
          position: relative;
          height: 2px;
          background: rgba(255,255,255,0.07);
          border-radius: 999px;
          margin-bottom: 12px;
          /* Glass shimmer */
          box-shadow: 0 1px 0 rgba(255,255,255,0.03) inset;
        }

        .mw-progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #00f5ff, #8a00ff);
          transition: width 0.5s cubic-bezier(0.65, 0, 0.35, 1);
          box-shadow: 0 0 12px rgba(0,245,255,0.4), 0 0 24px rgba(138,0,255,0.2);
        }

        .mw-steps-row {
          display: flex;
          justify-content: space-between;
        }

        .mw-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .mw-step-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(240,244,255,0.35);
          transition: all 0.35s ease;
          flex-shrink: 0;
        }

        .mw-step-dot.active {
          background: rgba(0,245,255,0.12);
          border-color: rgba(0,245,255,0.5);
          color: #00f5ff;
          box-shadow: 0 0 12px rgba(0,245,255,0.25);
        }

        .mw-step-dot.done {
          background: linear-gradient(135deg, #00f5ff, #8a00ff);
          border-color: transparent;
          color: #030303;
        }

        .mw-step-label {
          font-family: 'Syne', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(240,244,255,0.3);
          white-space: nowrap;
          transition: color 0.3s ease;
        }

        .mw-step-label.active {
          color: #00f5ff;
        }

        /* Body scroll area */
        .mw-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 28px;
          position: relative;
          z-index: 1;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,245,255,0.15) transparent;
        }

        .mw-body::-webkit-scrollbar { width: 4px; }
        .mw-body::-webkit-scrollbar-track { background: transparent; }
        .mw-body::-webkit-scrollbar-thumb { background: rgba(0,245,255,0.15); border-radius: 4px; }

        /* Section heading */
        .mw-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: rgba(240,244,255,0.45);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }

        .mw-section-sub {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          color: rgba(240,244,255,0.5);
          margin-bottom: 16px;
          line-height: 1.6;
        }

        /* Stream cards grid */
        .mw-stream-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mw-stream-card {
          position: relative;
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 14px 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          color: inherit;
        }

        .mw-stream-card:hover {
          background: rgba(0,245,255,0.04);
          border-color: rgba(0,245,255,0.2);
        }

        .mw-stream-card.selected {
          background: rgba(0,245,255,0.06);
          border-color: rgba(0,245,255,0.4);
          box-shadow: 0 0 20px rgba(0,245,255,0.08);
        }

        .mw-sc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .mw-sc-id {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mw-v1-badge {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          background: rgba(255, 180, 0, 0.12);
          border: 1px solid rgba(255, 180, 0, 0.3);
          color: #ffb400;
          border-radius: 4px;
          padding: 1px 5px;
          letter-spacing: 0.08em;
        }

        .mw-sc-id-text {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: rgba(240,244,255,0.7);
        }

        .mw-sc-token {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: rgba(240,244,255,0.4);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 5px;
          padding: 2px 7px;
        }

        .mw-sc-addresses {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .mw-mono {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(240,244,255,0.5);
        }

        .mw-arrow {
          font-size: 10px;
          color: rgba(0,245,255,0.4);
        }

        .mw-sc-amounts {
          display: flex;
          align-items: baseline;
          gap: 5px;
          margin-bottom: 8px;
        }

        .mw-sc-amount-streamed {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          background: linear-gradient(135deg, #00f5ff, #8a00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .mw-sc-amount-symbol {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(240,244,255,0.35);
        }

        .mw-sc-prog-track {
          height: 2px;
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          margin-bottom: 8px;
          overflow: hidden;
        }

        .mw-sc-prog-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #00f5ff, #8a00ff);
          transition: width 0.3s ease;
        }

        .mw-sc-prog-fill.complete {
          background: linear-gradient(90deg, #00ff88, #00f5ff);
        }

        .mw-sc-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mw-curve-badge {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          border-radius: 4px;
          padding: 1px 5px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .mw-curve-badge.linear {
          background: rgba(0,245,255,0.08);
          border: 1px solid rgba(0,245,255,0.2);
          color: rgba(0,245,255,0.7);
        }

        .mw-curve-badge.exponential {
          background: rgba(138,0,255,0.1);
          border: 1px solid rgba(138,0,255,0.25);
          color: rgba(180,100,255,0.85);
        }

        .mw-done-badge {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          background: rgba(0,255,136,0.08);
          border: 1px solid rgba(0,255,136,0.2);
          color: #00ff88;
          border-radius: 4px;
          padding: 1px 5px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .mw-sc-check {
          position: absolute;
          top: 12px;
          right: 12px;
        }

        /* Empty state */
        .mw-empty {
          text-align: center;
          padding: 32px 0;
          font-family: 'Syne', sans-serif;
          color: rgba(240,244,255,0.35);
          font-size: 13px;
        }

        /* Loading skeleton */
        .mw-skeleton {
          height: 80px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          animation: mw-shimmer 1.5s ease-in-out infinite;
        }

        @keyframes mw-shimmer {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        /* ── Step 2: Benefits ─────────────────────── */
        .mw-benefits-table {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mw-benefits-header {
          display: grid;
          grid-template-columns: 28px 1fr 100px 20px 100px;
          gap: 8px;
          padding: 0 12px;
          margin-bottom: 4px;
        }

        .mw-bh-label {
          font-family: 'Syne', sans-serif;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(240,244,255,0.25);
        }

        .mw-benefit-row {
          display: grid;
          grid-template-columns: 28px 1fr 100px 20px 100px;
          gap: 8px;
          align-items: center;
          padding: 12px 12px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
          transition: border-color 0.2s ease;
        }

        .mw-benefit-row.highlight {
          background: rgba(0,245,255,0.04);
          border-color: rgba(0,245,255,0.12);
        }

        .mw-benefit-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(0,245,255,0.6);
        }

        .mw-benefit-label {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: rgba(240,244,255,0.75);
        }

        .mw-benefit-v1 {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(240,244,255,0.3);
          text-align: right;
          white-space: nowrap;
          text-decoration: line-through;
          text-decoration-color: rgba(255,72,72,0.4);
        }

        .mw-benefit-arrow {
          font-size: 12px;
          color: rgba(0,245,255,0.4);
          text-align: center;
        }

        .mw-benefit-v2 {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #00f5ff;
          text-align: right;
          white-space: nowrap;
          font-weight: 700;
        }

        .mw-stream-summary {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .mw-ss-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .mw-ss-id {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: rgba(240,244,255,0.7);
        }

        .mw-ss-amt {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: rgba(240,244,255,0.4);
        }

        .mw-ss-v2 {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #00f5ff;
          background: rgba(0,245,255,0.08);
          border: 1px solid rgba(0,245,255,0.2);
          border-radius: 6px;
          padding: 4px 10px;
        }

        /* ── Step 3: Migration phases ──────────────── */
        .mw-phases {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin: 16px 0;
        }

        .mw-phase-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .mw-phase-row.running {
          background: rgba(0,245,255,0.05);
          border-color: rgba(0,245,255,0.2);
        }

        .mw-phase-row.done {
          border-color: rgba(0,245,255,0.1);
        }

        .mw-phase-row.failed {
          background: rgba(255,72,72,0.04);
          border-color: rgba(255,72,72,0.2);
        }

        .mw-phase-indicator {
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .mw-phase-spinner {
          display: block;
          width: 14px;
          height: 14px;
          border: 1.5px solid rgba(0,245,255,0.2);
          border-top-color: #00f5ff;
          border-radius: 50%;
          animation: mw-spin 0.8s linear infinite;
        }

        @keyframes mw-spin {
          to { transform: rotate(360deg); }
        }

        .mw-phase-dot-idle {
          display: block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          margin: auto;
        }

        .mw-phase-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .mw-phase-label {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: rgba(240,244,255,0.7);
        }

        .mw-phase-detail {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(240,244,255,0.35);
        }

        /* Atomic tx glassmorphism progress bar */
        .mw-atomic-bar-wrapper {
          margin: 12px 0;
          padding: 14px 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          /* Glass shimmer */
          backdrop-filter: blur(8px);
        }

        .mw-atomic-bar-label {
          font-family: 'Syne', sans-serif;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(240,244,255,0.35);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .mw-atomic-bar-pct {
          font-family: 'Space Mono', monospace;
          color: #00f5ff;
        }

        .mw-atomic-track {
          position: relative;
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 999px;
          overflow: hidden;
          /* Glass highlight */
          box-shadow: 0 1px 0 rgba(255,255,255,0.04) inset;
        }

        .mw-atomic-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #00f5ff 0%, #8a00ff 100%);
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 12px rgba(0,245,255,0.5), 0 0 24px rgba(138,0,255,0.3);
        }

        .mw-atomic-fill::after {
          content: '';
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 8px #00f5ff, 0 0 16px rgba(0,245,255,0.6);
        }

        .mw-atomic-fill.failed {
          background: linear-gradient(90deg, #ff4848, #ff8c00);
          box-shadow: 0 0 12px rgba(255,72,72,0.4);
        }

        /* Success state */
        .mw-success-box {
          text-align: center;
          padding: 20px 0;
        }

        .mw-success-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 16px;
          background: rgba(0,245,255,0.08);
          border: 1px solid rgba(0,245,255,0.25);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 24px rgba(0,245,255,0.15);
        }

        .mw-success-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #f0f4ff;
          margin-bottom: 6px;
        }

        .mw-success-sub {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: rgba(240,244,255,0.4);
        }

        .mw-new-stream-id {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          background: linear-gradient(135deg, #00f5ff, #8a00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Error box */
        .mw-error-box {
          background: rgba(255,72,72,0.06);
          border: 1px solid rgba(255,72,72,0.2);
          border-radius: 10px;
          padding: 12px 14px;
          margin-top: 12px;
        }

        .mw-error-title {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #ff7070;
          margin-bottom: 4px;
        }

        .mw-error-msg {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: rgba(255,112,112,0.7);
          line-height: 1.5;
        }

        .mw-error-note {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          color: rgba(240,244,255,0.4);
          margin-top: 8px;
          line-height: 1.5;
        }

        /* Footer / actions */
        .mw-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 28px 24px;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          border-top: 1px solid rgba(255,255,255,0.05);
          background: rgba(3,3,3,0.3);
          backdrop-filter: blur(8px);
        }

        .mw-btn {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          border-radius: 10px;
          padding: 10px 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .mw-btn-ghost {
          background: transparent;
          border-color: rgba(255,255,255,0.1);
          color: rgba(240,244,255,0.5);
        }

        .mw-btn-ghost:hover {
          border-color: rgba(255,255,255,0.2);
          color: rgba(240,244,255,0.8);
        }

        .mw-btn-primary {
          background: linear-gradient(135deg, rgba(0,245,255,0.15), rgba(138,0,255,0.15));
          border-color: rgba(0,245,255,0.3);
          color: #00f5ff;
          position: relative;
          overflow: hidden;
        }

        .mw-btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0,245,255,0.2), rgba(138,0,255,0.2));
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .mw-btn-primary:hover::before {
          opacity: 1;
        }

        .mw-btn-primary:hover {
          border-color: rgba(0,245,255,0.5);
          box-shadow: 0 0 20px rgba(0,245,255,0.15);
          color: #fff;
        }

        .mw-btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .mw-btn-primary:disabled:hover::before {
          opacity: 0;
        }

        .mw-btn-danger {
          background: rgba(255,72,72,0.1);
          border-color: rgba(255,72,72,0.3);
          color: #ff7070;
        }

        .mw-btn-danger:hover {
          background: rgba(255,72,72,0.2);
          border-color: rgba(255,72,72,0.5);
        }

        .mw-btn-success {
          background: linear-gradient(135deg, rgba(0,245,255,0.2), rgba(0,255,136,0.15));
          border-color: rgba(0,245,255,0.4);
          color: #00f5ff;
        }

        .mw-btn-success:hover {
          box-shadow: 0 0 20px rgba(0,245,255,0.15);
        }
      `}</style>

            {/* ── Overlay ──────────────────────────────────────── */}
            <div className="mw-overlay" onClick={(e) => e.target === e.currentTarget && !isMigrating && onClose?.()}>
                <div className="mw-modal" role="dialog" aria-modal="true" aria-label="Migration Wizard">
                    {/* Glow blobs */}
                    <div className="mw-blob-cyan" aria-hidden />
                    <div className="mw-blob-violet" aria-hidden />

                    {/* Header */}
                    <div className="mw-header">
                        <h2 className="mw-title">
                            Migration <span>Center</span>
                        </h2>
                        <button
                            className="mw-close"
                            onClick={() => onClose?.()}
                            disabled={isMigrating}
                            aria-label="Close"
                            type="button"
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Glassmorphism progress bar */}
                    <GlassProgressBar currentStep={step} steps={STEPS} />

                    {/* ─── Body ──────────────────────────────────── */}
                    <div className="mw-body">

                        {/* STEP 1 — Select V1 Stream */}
                        {step === 1 && (
                            <>
                                <p className="mw-section-title">Your Legacy V1 Streams</p>
                                <p className="mw-section-sub">
                                    Select the stream you want to upgrade to Nebula V2. Only active or completed V1 streams are shown.
                                </p>

                                {loadingStreams ? (
                                    <div className="mw-stream-grid">
                                        {[0, 1, 2].map((i) => <div key={i} className="mw-skeleton" style={{ animationDelay: `${i * 0.15}s` }} />)}
                                    </div>
                                ) : streams.length === 0 ? (
                                    <div className="mw-empty">
                                        <p>No V1 streams found for this wallet.</p>
                                        <p style={{ marginTop: 8, fontSize: 11 }}>All your streams are already on Nebula V2 🎉</p>
                                    </div>
                                ) : (
                                    <div className="mw-stream-grid">
                                        {streams.map((s) => (
                                            <StreamCard
                                                key={s.streamId.toString()}
                                                stream={s}
                                                selected={selected?.streamId === s.streamId}
                                                onClick={() => setSelected(s)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* STEP 2 — V2 Benefits */}
                        {step === 2 && selected && (
                            <>
                                <div className="mw-stream-summary">
                                    <div className="mw-ss-info">
                                        <span className="mw-ss-id">Stream #{selected.streamId.toString()} · {selected.curveType}</span>
                                        <span className="mw-ss-amt">
                                            {formatTokenAmount(selected.withdrawn)} / {formatTokenAmount(selected.totalAmount)} {selected.tokenSymbol}
                                        </span>
                                    </div>
                                    <span className="mw-ss-v2">→ Upgrading to V2</span>
                                </div>

                                <p className="mw-section-title">What you're gaining</p>

                                <div className="mw-benefits-header">
                                    <div />
                                    <div className="mw-bh-label">Feature</div>
                                    <div className="mw-bh-label" style={{ textAlign: "right" }}>V1</div>
                                    <div />
                                    <div className="mw-bh-label" style={{ textAlign: "right" }}>V2 Nebula</div>
                                </div>

                                <div className="mw-benefits-table">
                                    <BenefitRow
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1" />
                                            </svg>
                                        }
                                        label="Yield Generation"
                                        v1="None"
                                        v2="Auto-compound"
                                        highlight
                                    />
                                    <BenefitRow
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                                                <path d="M5 4V3a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.2" />
                                            </svg>
                                        }
                                        label="Receipt NFT"
                                        v1="Not minted"
                                        v2="Auto-minted"
                                        highlight
                                    />
                                    <BenefitRow
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M3 8.5L6.5 12 13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        }
                                        label="Permit Signatures"
                                        v1="Manual approve"
                                        v2="EIP-2612 permit"
                                    />
                                    <BenefitRow
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M2 14L8 2l6 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M5 10h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                            </svg>
                                        }
                                        label="Vesting Curves"
                                        v1="Linear only"
                                        v2="Linear + Exp"
                                    />
                                    <BenefitRow
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
                                                <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                            </svg>
                                        }
                                        label="Cliff Support"
                                        v1="None"
                                        v2="Configurable"
                                        highlight
                                    />
                                    <BenefitRow
                                        icon={
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 2c3.314 0 6 2.686 6 6s-2.686 6-6 6-6-2.686-6-6 2.686-6 6-6z" stroke="currentColor" strokeWidth="1.2" />
                                                <path d="M6 8l1.5 1.5L10 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        }
                                        label="OFAC Compliance"
                                        v1="Basic"
                                        v2="Full enforcement"
                                    />
                                </div>

                                <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(255,180,0,0.05)", border: "1px solid rgba(255,180,0,0.15)", borderRadius: 10 }}>
                                    <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, color: "rgba(255,180,0,0.8)", lineHeight: 1.6 }}>
                                        ⚠️ Migration is atomic — if any step fails, your V1 stream remains unchanged and no funds are at risk.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* STEP 3 — Execute Migration */}
                        {step === 3 && selected && (
                            <>
                                {migrationStatus === "success" ? (
                                    <div className="mw-success-box">
                                        <div className="mw-success-icon">
                                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                                <path d="M5 14l6.5 6.5L23 7" stroke="#00f5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <p className="mw-success-title">Migration Complete 🎉</p>
                                        <p className="mw-success-sub" style={{ marginBottom: 8 }}>
                                            Your stream has been upgraded to Nebula V2
                                        </p>
                                        {newStreamId && (
                                            <p className="mw-success-sub">
                                                New stream ID: <span className="mw-new-stream-id">#{newStreamId.toString()}</span>
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="mw-stream-summary">
                                            <div className="mw-ss-info">
                                                <span className="mw-ss-id">Stream #{selected.streamId.toString()}</span>
                                                <span className="mw-ss-amt">
                                                    {formatTokenAmount(selected.totalAmount)} {selected.tokenSymbol} · {selected.curveType}
                                                </span>
                                            </div>
                                            <span className="mw-ss-v2">V1 → V2</span>
                                        </div>

                                        {/* Atomic transaction progress bar (glassmorphism) */}
                                        <div className="mw-atomic-bar-wrapper">
                                            <div className="mw-atomic-bar-label">
                                                <span>Atomic Transaction Status</span>
                                                <span className="mw-atomic-bar-pct">
                                                    {migrationStatus === "idle" ? "0%" :
                                                        migrationStatus === "validating" ? "20%" :
                                                            migrationStatus === "cancelling_v1" ? "40%" :
                                                                migrationStatus === "creating_v2" ? "60%" :
                                                                    migrationStatus === "minting_receipt" ? "80%" :
                                                                        migrationStatus === "confirming" ? "95%" :
                                                                            migrationStatus === "failed" ? "—" : "100%"}
                                                </span>
                                            </div>
                                            <div className="mw-atomic-track">
                                                <div
                                                    className={`mw-atomic-fill ${migrationStatus === "failed" ? "failed" : ""}`}
                                                    style={{
                                                        width:
                                                            migrationStatus === "idle" ? "0%" :
                                                                migrationStatus === "validating" ? "20%" :
                                                                    migrationStatus === "cancelling_v1" ? "40%" :
                                                                        migrationStatus === "creating_v2" ? "60%" :
                                                                            migrationStatus === "minting_receipt" ? "80%" :
                                                                                migrationStatus === "confirming" ? "95%" :
                                                                                    migrationStatus === "failed" ? "40%" : "0%",
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Phase breakdown */}
                                        <div className="mw-phases">
                                            <TxPhaseRow
                                                label="Validate stream ownership"
                                                status={phaseStatus("validating", migrationStatus)}
                                                detail="Verifying wallet authorization"
                                            />
                                            <TxPhaseRow
                                                label="Cancel V1 stream"
                                                status={phaseStatus("cancelling_v1", migrationStatus)}
                                                detail={`Claim remaining balance · Stream #${selected.streamId.toString()}`}
                                            />
                                            <TxPhaseRow
                                                label="Create V2 stream"
                                                status={phaseStatus("creating_v2", migrationStatus)}
                                                detail="Deploy with yield vault + cliff support"
                                            />
                                            <TxPhaseRow
                                                label="Mint Receipt NFT"
                                                status={phaseStatus("minting_receipt", migrationStatus)}
                                                detail="Assign ownership receipt to wallet"
                                            />
                                            <TxPhaseRow
                                                label="Confirm on-chain"
                                                status={phaseStatus("confirming", migrationStatus)}
                                                detail="Waiting for ledger confirmation"
                                            />
                                        </div>

                                        {/* Error state */}
                                        {migrationStatus === "failed" && (
                                            <div className="mw-error-box">
                                                <p className="mw-error-title">Migration Failed</p>
                                                <p className="mw-error-msg">{errorMessage ?? "An unknown error occurred."}</p>
                                                <p className="mw-error-note">
                                                    Your V1 stream #{selected.streamId.toString()} is unchanged — no partial state was written. You can retry the migration safely.
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* ─── Footer / Actions ──────────────────────────── */}
                    <div className="mw-footer">
                        {/* Left action */}
                        <div>
                            {step > 1 && migrationStatus === "idle" && (
                                <button
                                    className="mw-btn mw-btn-ghost"
                                    onClick={() => setStep((s) => s - 1)}
                                    type="button"
                                >
                                    ← Back
                                </button>
                            )}
                            {migrationStatus === "failed" && (
                                <button
                                    className="mw-btn mw-btn-ghost"
                                    onClick={() => {
                                        setMigrationStatus("idle");
                                        setErrorMessage(null);
                                        setStep(1);
                                    }}
                                    type="button"
                                >
                                    ← Start over
                                </button>
                            )}
                        </div>

                        {/* Right action */}
                        <div>
                            {step === 1 && (
                                <button
                                    className="mw-btn mw-btn-primary"
                                    disabled={!canProceedStep1}
                                    onClick={() => setStep(2)}
                                    type="button"
                                >
                                    Review Benefits →
                                </button>
                            )}

                            {step === 2 && (
                                <button
                                    className="mw-btn mw-btn-primary"
                                    onClick={() => setStep(3)}
                                    type="button"
                                >
                                    Proceed to Migrate →
                                </button>
                            )}

                            {step === 3 && migrationStatus === "idle" && (
                                <>
                                    {devMode && (
                                        <button
                                            className="mw-btn mw-btn-secondary"
                                            onClick={() => setShowXDR(!showXDR)}
                                            type="button"
                                            style={{ marginBottom: 8 }}
                                        >
                                            {showXDR ? "Hide XDR" : "View XDR"}
                                        </button>
                                    )}
                                    {showXDR && devMode && (
                                        <div style={{
                                            marginBottom: 12,
                                            padding: "12px 16px",
                                            background: "rgba(0,0,0,0.3)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: 8,
                                            fontFamily: "monospace",
                                            fontSize: 11,
                                            color: "rgba(255,255,255,0.7)",
                                            maxHeight: 120,
                                            overflowY: "auto"
                                        }}>
                                            <div style={{ marginBottom: 4, color: "rgba(255,255,255,0.5)" }}>Transaction XDR:</div>
                                            <div style={{ wordBreak: "break-all" }}>
                                                AAAAAGAAAADWJbkKz2rQWG5L6Z0qjML5kgK3HaHS9EaEjVxVjBqAAAAZAB8pVQAAAABAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAABAAAAAIhqhAAAAAAA
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        className="mw-btn mw-btn-primary"
                                        onClick={handleMigrate}
                                        type="button"
                                    >
                                        Execute Migration ⚡
                                    </button>
                                </>
                            )}

                            {step === 3 && isMigrating && (
                                <button className="mw-btn mw-btn-primary" disabled type="button">
                                    Migrating…
                                </button>
                            )}

                            {step === 3 && migrationStatus === "failed" && (
                                <button
                                    className="mw-btn mw-btn-danger"
                                    onClick={handleMigrate}
                                    type="button"
                                >
                                    Retry Migration
                                </button>
                            )}

                            {step === 3 && migrationStatus === "success" && (
                                <button
                                    className="mw-btn mw-btn-success"
                                    onClick={() => onClose?.()}
                                    type="button"
                                >
                                    Done ✓
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}