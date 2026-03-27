"use client";

import { useState, useEffect, useCallback } from "react";

export interface GasBufferStatus {
    /** Current balance in XLM */
    balanceXlm: number;
    /** Daily burn rate in XLM */
    burnRatePerDayXlm: number;
    /** Estimated days of runway remaining (null if depleted) */
    daysRemaining: number | null;
    /** True when < 7 days of runway */
    isCritical: boolean;
    /** True when balance is zero */
    isDepleted: boolean;
}

// ─── Mock backend fetch ───────────────────────────────────────────────────────
// Replace with: fetch(`${BACKEND_URL}/api/v3/gas-buffer/status`)

async function fetchGasBufferStatus(): Promise<GasBufferStatus> {
    await new Promise((r) => setTimeout(r, 600));
    const balanceXlm = 4.2; // mock — triggers "Low Gas" warning
    const burnRatePerDayXlm = 0.8;
    const daysRemaining = burnRatePerDayXlm > 0 ? balanceXlm / burnRatePerDayXlm : null;
    return {
        balanceXlm,
        burnRatePerDayXlm,
        daysRemaining,
        isCritical: daysRemaining !== null && daysRemaining < 7,
        isDepleted: balanceXlm === 0,
    };
}

// ─── Mock contract calls ──────────────────────────────────────────────────────
// Replace with real Soroban SDK invocations:
//   contract.depositGasBuffer({ amount: parseAmount(xlm), from: address })
//   contract.withdrawGasBuffer({ amount: parseAmount(xlm), to: address })

async function callDepositGasBuffer(xlm: number): Promise<string> {
    await new Promise((r) => setTimeout(r, 1800 + Math.random() * 600));
    if (Math.random() < 0.05) throw new Error("Transaction simulation failed");
    return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
}

async function callWithdrawGasBuffer(xlm: number): Promise<string> {
    await new Promise((r) => setTimeout(r, 1800 + Math.random() * 600));
    if (Math.random() < 0.05) throw new Error("Transaction simulation failed");
    return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type GasBufferOp = "deposit" | "withdraw";

export function useGasBuffer() {
    const [status, setStatus] = useState<GasBufferStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pendingOp, setPendingOp] = useState<GasBufferOp | null>(null);

    const refresh = useCallback(async () => {
        try {
            const data = await fetchGasBufferStatus();
            setStatus(data);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load gas buffer");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const deposit = useCallback(async (xlm: number): Promise<string> => {
        setPendingOp("deposit");
        try {
            const txHash = await callDepositGasBuffer(xlm);
            setStatus((prev) =>
                prev ? { ...prev, balanceXlm: prev.balanceXlm + xlm } : prev
            );
            return txHash;
        } finally {
            setPendingOp(null);
        }
    }, []);

    const withdraw = useCallback(async (xlm: number): Promise<string> => {
        setPendingOp("withdraw");
        try {
            const txHash = await callWithdrawGasBuffer(xlm);
            setStatus((prev) =>
                prev ? { ...prev, balanceXlm: Math.max(0, prev.balanceXlm - xlm) } : prev
            );
            return txHash;
        } finally {
            setPendingOp(null);
        }
    }, []);

    return { status, loading, error, pendingOp, deposit, withdraw, refresh };
}
