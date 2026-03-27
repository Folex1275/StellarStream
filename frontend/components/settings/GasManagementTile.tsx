"use client";

import { useState } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Fuel, Loader2, RefreshCw } from "lucide-react";
import { useGasBuffer } from "@/lib/use-gas-buffer";
import { toast } from "@/lib/toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, d = 2) =>
    n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Low-gas threshold: < 7 days runway OR < 5 XLM absolute */
const LOW_GAS_DAYS = 7;
const LOW_GAS_XLM = 5;

// ─── AmountInput ──────────────────────────────────────────────────────────────

function AmountInput({
    value,
    onChange,
    max,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    max?: number;
    placeholder?: string;
}) {
    return (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 focus-within:border-white/20 transition-colors">
            <input
                type="number"
                min="0"
                step="0.01"
                max={max}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder ?? "0.00"}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs text-white/40 font-mono">XLM</span>
            {max !== undefined && (
                <button
                    type="button"
                    onClick={() => onChange(String(max))}
                    className="text-[10px] text-[#00f5ff]/60 hover:text-[#00f5ff] transition-colors"
                >
                    MAX
                </button>
            )}
        </div>
    );
}

// ─── GasManagementTile ────────────────────────────────────────────────────────

export default function GasManagementTile() {
    const { status, loading, error, pendingOp, deposit, withdraw, refresh } = useGasBuffer();
    const [depositAmt, setDepositAmt] = useState("");
    const [withdrawAmt, setWithdrawAmt] = useState("");

    const isLowGas =
        status !== null &&
        (status.isDepleted ||
            status.balanceXlm < LOW_GAS_XLM ||
            (status.daysRemaining !== null && status.daysRemaining < LOW_GAS_DAYS));

    const runwayPct =
        status && status.daysRemaining !== null
            ? Math.min((status.daysRemaining / 30) * 100, 100)
            : 0;

    const handleDeposit = async () => {
        const xlm = parseFloat(depositAmt);
        if (!xlm || xlm <= 0) return;
        try {
            const txHash = await deposit(xlm);
            toast.success({
                title: "Gas Deposited",
                description: `${fmt(xlm)} XLM added to the gas buffer.`,
                txHash,
                duration: 6000,
            });
            setDepositAmt("");
        } catch (e) {
            toast.error({
                title: "Deposit Failed",
                description: e instanceof Error ? e.message : "Unknown error",
                duration: 6000,
            });
        }
    };

    const handleWithdraw = async () => {
        const xlm = parseFloat(withdrawAmt);
        if (!xlm || xlm <= 0) return;
        if (status && xlm > status.balanceXlm) {
            toast.error({ title: "Insufficient Balance", description: "Amount exceeds buffer balance.", duration: 5000 });
            return;
        }
        try {
            const txHash = await withdraw(xlm);
            toast.success({
                title: "Gas Withdrawn",
                description: `${fmt(xlm)} XLM removed from the gas buffer.`,
                txHash,
                duration: 6000,
            });
            setWithdrawAmt("");
        } catch (e) {
            toast.error({
                title: "Withdrawal Failed",
                description: e instanceof Error ? e.message : "Unknown error",
                duration: 6000,
            });
        }
    };

    return (
        <div
            className={`rounded-2xl border backdrop-blur-xl transition-colors duration-300 ${
                isLowGas
                    ? "border-orange-500/40 bg-orange-500/[0.03]"
                    : "border-white/10 bg-white/[0.03]"
            }`}
        >
            {/* Low-gas top accent */}
            {isLowGas && (
                <div className="h-px w-full rounded-t-2xl bg-gradient-to-r from-transparent via-orange-500/70 to-transparent" />
            )}

            <div className="p-5 space-y-5">
                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                                isLowGas
                                    ? "border-orange-500/30 bg-orange-500/10"
                                    : "border-white/10 bg-white/[0.05]"
                            }`}
                        >
                            <Fuel
                                size={18}
                                className={isLowGas ? "text-orange-400" : "text-[#00f5ff]/70"}
                            />
                        </div>
                        <div>
                            <h3 className="font-heading text-base text-white">Gas Buffer</h3>
                            <p className="font-body text-xs text-white/40">
                                Organisation XLM reserve for Soroban rent
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[11px] text-white/40 hover:text-white transition-colors"
                    >
                        <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                {/* ── Low Gas Warning ── */}
                {isLowGas && !loading && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-orange-500/30 bg-orange-500/[0.06] px-3 py-2.5">
                        <AlertTriangle size={14} className="text-orange-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-body text-xs font-semibold text-orange-300">
                                Low Gas Warning
                            </p>
                            <p className="font-body text-[11px] text-orange-300/70 mt-0.5">
                                {status?.isDepleted
                                    ? "Gas buffer is empty. Streams may fail to renew storage rent."
                                    : `Only ${fmt(status?.daysRemaining ?? 0, 1)} days of runway remaining. Deposit XLM to avoid stream interruptions.`}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Status Stats ── */}
                {loading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 size={22} className="animate-spin text-white/30" />
                    </div>
                ) : error ? (
                    <p className="text-center text-xs text-red-400 py-4">{error}</p>
                ) : status ? (
                    <div className="space-y-3">
                        {/* Balance + burn rate row */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: "Balance", value: `${fmt(status.balanceXlm)} XLM` },
                                { label: "Burn / Day", value: `${fmt(status.burnRatePerDayXlm, 3)} XLM` },
                                {
                                    label: "Runway",
                                    value: status.daysRemaining !== null ? `${fmt(status.daysRemaining, 1)}d` : "∞",
                                    accent: isLowGas,
                                },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-center"
                                >
                                    <p
                                        className={`font-heading text-sm leading-tight ${
                                            s.accent ? "text-orange-400" : "text-white"
                                        }`}
                                    >
                                        {s.value}
                                    </p>
                                    <p className="font-body text-[10px] tracking-widest uppercase text-white/35 mt-0.5">
                                        {s.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Runway progress bar */}
                        <div>
                            <div className="flex justify-between text-[10px] text-white/30 mb-1">
                                <span>Runway</span>
                                <span>30-day target</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${runwayPct}%`,
                                        background: isLowGas
                                            ? "linear-gradient(90deg, #f97316, #fb923c)"
                                            : "linear-gradient(90deg, #00f5ff80, #00f5ff)",
                                        boxShadow: isLowGas
                                            ? "0 0 8px rgba(249,115,22,0.5)"
                                            : "0 0 8px rgba(0,245,255,0.3)",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* ── Actions ── */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Deposit */}
                    <div className="space-y-2">
                        <p className="font-body text-[11px] tracking-widest uppercase text-white/40">
                            Deposit
                        </p>
                        <AmountInput
                            value={depositAmt}
                            onChange={setDepositAmt}
                            placeholder="Amount"
                        />
                        <button
                            onClick={handleDeposit}
                            disabled={!depositAmt || parseFloat(depositAmt) <= 0 || pendingOp !== null}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00f5ff] py-2 text-xs font-bold text-black hover:bg-[#00e0e8] hover:shadow-[0_0_16px_rgba(0,245,255,0.35)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                        >
                            {pendingOp === "deposit" ? (
                                <><Loader2 size={13} className="animate-spin" /> Depositing…</>
                            ) : (
                                <><ArrowDownToLine size={13} /> Deposit</>
                            )}
                        </button>
                    </div>

                    {/* Withdraw */}
                    <div className="space-y-2">
                        <p className="font-body text-[11px] tracking-widest uppercase text-white/40">
                            Withdraw
                        </p>
                        <AmountInput
                            value={withdrawAmt}
                            onChange={setWithdrawAmt}
                            max={status?.balanceXlm}
                            placeholder="Amount"
                        />
                        <button
                            onClick={handleWithdraw}
                            disabled={!withdrawAmt || parseFloat(withdrawAmt) <= 0 || pendingOp !== null}
                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-xs font-bold text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                        >
                            {pendingOp === "withdraw" ? (
                                <><Loader2 size={13} className="animate-spin" /> Withdrawing…</>
                            ) : (
                                <><ArrowUpFromLine size={13} /> Withdraw</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
