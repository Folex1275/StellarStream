"use client";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Verify Stream Page
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A dedicated page where an auditor or employer can paste a Stream ID
 * and see a cryptographic "Proof of Validity" by reconstructing the
 * payment history from contract events.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, CheckCircle, AlertCircle, FileText, Hash, Calendar, DollarSign } from "lucide-react";

interface VerificationData {
  streamId: string;
  events: any[];
  proof: {
    contractId: string;
    totalEvents: number;
    lastLedger: number;
    hash: string;
  };
}

interface StreamEvent {
  ledger: number;
  txHash: string;
  timestamp: string;
  action: string;
  amount?: string;
  details: string;
}

export default function VerifyPage() {
  const [streamId, setStreamId] = useState("");
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!streamId.trim()) {
      setError("Please enter a Stream ID");
      return;
    }

    setLoading(true);
    setError("");
    setVerificationData(null);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_NEBULA_WARP_INDEXER_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3000/api/v1";
      const response = await fetch(`${apiUrl}/streams/verify/${streamId.trim()}`);
      const result = await response.json();

      if (result.success) {
        setVerificationData(result.data);
      } else {
        setError(result.error || "Verification failed");
      }
    } catch (err) {
      setError("Failed to verify stream. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!verificationData) return;

    // Create a simple PDF-like text export for now
    const content = generateAuditReport(verificationData);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stream-${verificationData.streamId}-audit-report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateAuditReport = (data: VerificationData): string => {
    const events = parseEvents(data.events);
    const report = `
STELLAR STREAM AUDIT REPORT
===========================

Stream ID: ${data.streamId}
Contract ID: ${data.proof.contractId}
Verification Hash: ${data.proof.hash}
Total Events: ${data.proof.totalEvents}
Last Ledger: ${data.proof.lastLedger}
Generated: ${new Date().toISOString()}

PAYMENT HISTORY
===============

${events.map(event => `
Event: ${event.action}
Ledger: ${event.ledger}
Transaction: ${event.txHash}
Timestamp: ${event.timestamp}
Amount: ${event.amount || 'N/A'}
Details: ${event.details}
`).join('\n')}

CRYPTOGRAPHIC PROOF
===================

This report proves the validity of Stream ID ${data.streamId} by reconstructing
the payment history from blockchain events. The verification hash ${data.proof.hash}
serves as a cryptographic proof that these events occurred on the Stellar network.

All events were fetched directly from the Stellar RPC and verified against
contract ${data.proof.contractId}.
`;

    return report;
  };

  const parseEvents = (events: any[]): StreamEvent[] => {
    // Events are already parsed in the backend
    return events.map(event => ({
      ledger: event.ledger,
      txHash: event.txHash,
      timestamp: event.timestamp,
      action: event.action,
      amount: event.amount,
      details: event.details,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold text-white mb-4"
            >
              Verify Stream
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-300 max-w-2xl mx-auto"
            >
              Enter a Stream ID to view its cryptographic proof of validity and payment history
            </motion.p>
          </div>

          {/* Verification Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8"
          >
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={streamId}
                  onChange={(e) => setStreamId(e.target.value)}
                  placeholder="Enter Stream ID (e.g., 12345)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                />
              </div>
              <button
                onClick={handleVerify}
                disabled={loading}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Verify
                  </>
                )}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </motion.div>

          {/* Verification Results */}
          {verificationData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Proof of Validity */}
              <div className="bg-green-500/10 backdrop-blur-lg rounded-2xl p-8 border border-green-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <h2 className="text-2xl font-bold text-white">Proof of Validity</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Stream ID:</span>
                      <span className="text-white font-mono">{verificationData.streamId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Contract:</span>
                      <span className="text-white font-mono text-sm">{verificationData.proof.contractId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Last Ledger:</span>
                      <span className="text-white">{verificationData.proof.lastLedger}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Total Events:</span>
                      <span className="text-white">{verificationData.proof.totalEvents}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Verification Hash:</span>
                      <span className="text-white font-mono text-sm">{verificationData.proof.hash.slice(0, 16)}...</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleDownloadPDF}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Audit PDF
                  </button>
                </div>
              </div>

              {/* Event History */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Payment History</h3>

                <div className="space-y-4">
                  {parseEvents(verificationData.events).map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-purple-400 font-semibold">{event.action}</span>
                        <span className="text-gray-400 text-sm">Ledger {event.ledger}</span>
                      </div>
                      <div className="text-sm text-gray-300 mb-2">
                        {event.timestamp}
                      </div>
                      {event.amount && (
                        <div className="text-green-400 font-mono">
                          {event.amount}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-2 font-mono">
                        TX: {event.txHash.slice(0, 16)}...
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}