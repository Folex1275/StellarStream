"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fuel, Zap, Calculator, Loader2, X, CheckCircle } from "lucide-react";
import { useGasBuffer } from "@/lib/use-gas-buffer";

interface GasTankRefillWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GasTankRefillWizard({ isOpen, onClose }: GasTankRefillWizardProps) {
    const { status, deposit, pendingOp } = useGasBuffer();
    const [xlmAmount, setXlmAmount] = useState("");
    const [estimatedTransactions, setEstimatedTransactions] = useState<number | null>(null);
    const [isDepositing, setIsDepositing] = useState(false);
    const [depositComplete, setDepositComplete] = useState(false);

    // Calculate estimated transactions covered when XLM amount changes
    useEffect(() => {
        const amount = parseFloat(xlmAmount);
        if (amount > 0 && status?.burnRatePerDayXlm) {
            // Calculate how many days this XLM amount will cover
            const daysCovered = amount / status.burnRatePerDayXlm;

            // Estimate transactions per day (rough approximation)
            // Assuming ~10-20 ledger operations per day for active streams
            const transactionsPerDay = 15;

            const estimatedTx = Math.floor(daysCovered * transactionsPerDay);
            setEstimatedTransactions(estimatedTx);
        } else {
            setEstimatedTransactions(null);
        }
    }, [xlmAmount, status]);

    const handleDeposit = async () => {
        const amount = parseFloat(xlmAmount);
        if (!amount || amount <= 0) return;

        setIsDepositing(true);
        try {
            await deposit(amount);
            setDepositComplete(true);
            setTimeout(() => {
                onClose();
                setDepositComplete(false);
                setXlmAmount("");
            }, 2000);
        } catch (error) {
            console.error("Deposit failed:", error);
        } finally {
            setIsDepositing(false);
        }
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0f] p-6 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10">
                                <Fuel className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="font-heading text-lg text-white">Fuel Up Gas Tank</h3>
                                <p className="font-body text-xs text-white/40">Add XLM to cover Soroban storage rent</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/40 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {depositComplete ? (
                        /* Success State */
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-8"
                        >
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Deposit Successful!</h4>
                            <p className="text-sm text-white/60">
                                {xlmAmount} XLM added to your gas buffer
                            </p>
                        </motion.div>
                    ) : (
                        <>
                            {/* Current Status */}
                            <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-white/60">Current Balance</span>
                                    <span className="font-mono text-sm text-white">
                                        {status ? `${status.balanceXlm.toFixed(2)} XLM` : "Loading..."}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-white/60">Daily Burn Rate</span>
                                    <span className="font-mono text-sm text-white">
                                        {status ? `${status.burnRatePerDayXlm.toFixed(3)} XLM/day` : "Loading..."}
                                    </span>
                                </div>
                            </div>

                            {/* XLM Amount Input */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-white/80 mb-2">
                                    XLM Amount to Deposit
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={xlmAmount}
                                        onChange={(e) => setXlmAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-cyan-400/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40 font-mono">
                                        XLM
                                    </span>
                                </div>
                            </div>

                            {/* Estimated Coverage */}
                            {estimatedTransactions !== null && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05]"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calculator className="w-4 h-4 text-cyan-400" />
                                        <span className="text-sm font-medium text-cyan-300">Estimated Coverage</span>
                                    </div>
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {formatNumber(estimatedTransactions)}
                                    </div>
                                    <p className="text-xs text-cyan-300/70">
                                        ledger operations covered by this deposit
                                    </p>
                                </motion.div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isDepositing}
                                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm text-white/60 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeposit}
                                    disabled={!xlmAmount || parseFloat(xlmAmount) <= 0 || isDepositing || pendingOp !== null}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 text-sm font-bold text-black hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_16px_rgba(34,211,238,0.35)] active:scale-95"
                                >
                                    {isDepositing || pendingOp === "deposit" ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Depositing...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={16} />
                                            Fuel Up
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}