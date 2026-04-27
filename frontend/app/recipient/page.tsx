"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Recipient Portal Page
 * Issue #1001 - "Proof-of-Verification" Recipient Portal
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Secure portal for recipients to authenticate with their Stellar wallet
 * and view their private payment history from disbursements.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, Shield, FileText, AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";
import { useWallet } from "@/lib/wallet-context";
import { signTransaction } from "@stellar/freighter-api";

interface Disbursement {
    id: string;
    senderAddress: string;
    totalAmount: string;
    asset: string;
    txHash: string;
    createdAt: string;
    recipient: {
        amount: string;
        status: string;
    };
}

export default function RecipientPortal() {
    const { address, isConnected, connectFreighter } = useWallet();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Check if user is already authenticated (has valid JWT)
    useEffect(() => {
        const token = localStorage.getItem("recipient_token");
        if (token) {
            // TODO: Validate token with backend
            setIsAuthenticated(true);
            fetchDisbursements(token);
        }
    }, []);

    const handleLogin = async () => {
        if (!isConnected || !address) {
            await connectFreighter();
            return;
        }

        setIsAuthenticating(true);
        setError("");

        try {
            // Step 1: Get challenge from backend
            const challengeResponse = await fetch("/api/auth/challenge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address })
            });

            if (!challengeResponse.ok) {
                throw new Error("Failed to get challenge");
            }

            const { nonce } = await challengeResponse.json();

            // Step 2: Sign the challenge
            const message = `Login to StellarStream Recipient Portal\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;

            const signatureResult = await signTransaction(
                Buffer.from(message).toString("base64"),
                { address }
            );

            if (signatureResult.error) {
                throw new Error(signatureResult.error);
            }

            // Step 3: Verify signature and get JWT
            const verifyResponse = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address,
                    nonce,
                    signature: signatureResult.signedTxXdr
                })
            });

            if (!verifyResponse.ok) {
                throw new Error("Authentication failed");
            }

            const { token } = await verifyResponse.json();

            // Store token and mark as authenticated
            localStorage.setItem("recipient_token", token);
            setIsAuthenticated(true);

            // Fetch disbursements
            await fetchDisbursements(token);

        } catch (err) {
            console.error("Login failed:", err);
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setIsAuthenticating(false);
        }
    };

    const fetchDisbursements = async (token: string) => {
        setLoading(true);
        try {
            const response = await fetch("/api/recipient/disbursements", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch disbursements");
            }

            const data = await response.json();
            setDisbursements(data.disbursements);
        } catch (err) {
            console.error("Failed to fetch disbursements:", err);
            setError(err instanceof Error ? err.message : "Failed to load disbursements");
        } finally {
            setLoading(false);
        }
    };

    const handleReportDiscrepancy = async (disbursementId: string) => {
        const token = localStorage.getItem("recipient_token");
        if (!token) return;

        const issue = prompt("Please describe the discrepancy:");
        if (!issue) return;

        try {
            const response = await fetch("/api/recipient/report-discrepancy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    disbursementId,
                    issue,
                    description: issue
                })
            });

            if (!response.ok) {
                throw new Error("Failed to report discrepancy");
            }

            alert("Discrepancy reported successfully. The sending organization will be notified.");
        } catch (err) {
            console.error("Failed to report discrepancy:", err);
            alert("Failed to report discrepancy. Please try again.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("recipient_token");
        setIsAuthenticated(false);
        setDisbursements([]);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50"
                >
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Recipient Portal</h1>
                        <p className="text-slate-400">Secure access to your payment history</p>
                    </div>

                    {!isConnected ? (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-400 text-center">
                                Connect your Stellar wallet to access the recipient portal
                            </p>
                            <button
                                onClick={connectFreighter}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Wallet className="w-5 h-5" />
                                Connect Wallet
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-slate-700/50 rounded-lg p-4">
                                <p className="text-sm text-slate-400 mb-2">Connected Wallet</p>
                                <p className="font-mono text-sm text-white break-all">{address}</p>
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={isAuthenticating}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {isAuthenticating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-5 h-5" />
                                        Login with SEP-10 Challenge
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Recipient Portal</h1>
                        <p className="text-slate-400">Your private payment history</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Logout
                    </button>
                </div>

                {/* Disbursements Table */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Your Disbursements
                        </h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-400">Loading disbursements...</p>
                        </div>
                    ) : disbursements.length === 0 ? (
                        <div className="p-8 text-center">
                            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No disbursements found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-700/30">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Sender</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Asset</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/30">
                                    {disbursements.map((disbursement) => (
                                        <tr key={disbursement.id} className="hover:bg-slate-700/20">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                {new Date(disbursement.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-300">
                                                {disbursement.senderAddress.slice(0, 8)}...{disbursement.senderAddress.slice(-8)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                                                {disbursement.recipient.amount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                {disbursement.asset}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${disbursement.recipient.status === 'SENT'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {disbursement.recipient.status === 'SENT' ? (
                                                        <CheckCircle className="w-3 h-3" />
                                                    ) : (
                                                        <Clock className="w-3 h-3" />
                                                    )}
                                                    {disbursement.recipient.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <a
                                                    href={`https://stellar.expert/explorer/public/tx/${disbursement.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 font-mono"
                                                >
                                                    {disbursement.txHash.slice(0, 8)}...{disbursement.txHash.slice(-8)}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => handleReportDiscrepancy(disbursement.id)}
                                                    className="text-orange-400 hover:text-orange-300 flex items-center gap-1"
                                                >
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Report Issue
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}