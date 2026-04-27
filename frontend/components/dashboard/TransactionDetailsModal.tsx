"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import {
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Code,
  FileText,
} from "lucide-react";
import { getExplorerLink } from "@/lib/explorer";
import JsonView from "@uiw/react-json-view";

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    type: string;
    hash: string;
    timestamp: number;
    sender: string;
    receiver?: string;
    amount?: string;
    token?: string;
    streamId?: string;
    status: "pending" | "confirmed" | "failed";
    blockTime?: number;
    ledger?: number;
  } | null;
}

interface RawTransactionData {
  xdr: string;
  json: any;
  events: any[];
}

export function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailsModalProps) {
  const [showPowerUser, setShowPowerUser] = useState(false);
  const [rawData, setRawData] = useState<RawTransactionData | null>(null);
  const [isLoadingRaw, setIsLoadingRaw] = useState(false);
  const [copiedXdr, setCopiedXdr] = useState(false);

  // Fetch raw data when power user mode is enabled
  useEffect(() => {
    if (showPowerUser && transaction && !rawData) {
      fetchRawTransactionData();
    }
  }, [showPowerUser, transaction]);

  const fetchRawTransactionData = async () => {
    if (!transaction) return;

    setIsLoadingRaw(true);
    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch(`/api/v1/transaction/${transaction.hash}`);
      if (response.ok) {
        const data = await response.json();
        setRawData(data);
      } else {
        // Mock data for development
        setRawData({
          xdr: "AAAAAgAAAADWJbkKz...",
          json: {
            transaction: {
              source: transaction.sender,
              operations: [
                {
                  type: "invoke_contract",
                  contract: "CCV3...",
                  function: transaction.type,
                  args: [transaction.amount, transaction.token]
                }
              ]
            },
            events: [
              {
                type: "contract",
                contractId: "CCV3...",
                topics: ["SplitExecuted", transaction.streamId],
                data: {
                  sender: transaction.sender,
                  amount: transaction.amount,
                  token: transaction.token
                }
              }
            ]
          },
          events: []
        });
      }
    } catch (error) {
      console.error("Failed to fetch raw transaction data:", error);
      // Fallback to mock data
      setRawData({
        xdr: "AAAAAgAAAADWJbkKz...",
        json: { mock: true },
        events: []
      });
    } finally {
      setIsLoadingRaw(false);
    }
  };

  const handleCopyXdr = async () => {
    if (rawData?.xdr) {
      await navigator.clipboard.writeText(rawData.xdr);
      setCopiedXdr(true);
      setTimeout(() => setCopiedXdr(false), 2000);
    }
  };

  if (!transaction) return null;

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-4xl rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                  <DialogTitle className="text-xl font-semibold text-white">
                    Transaction Details
                  </DialogTitle>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Transaction Hash</p>
                      <p className="font-mono text-sm text-white break-all">
                        {transaction.hash}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === "confirmed"
                          ? "bg-green-400/20 text-green-400"
                          : transaction.status === "pending"
                          ? "bg-yellow-400/20 text-yellow-400"
                          : "bg-red-400/20 text-red-400"
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Type</p>
                      <p className="text-white capitalize">{transaction.type.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Timestamp</p>
                      <p className="text-white">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Amount & Token */}
                  {transaction.amount && transaction.token && (
                    <div className="p-4 rounded-lg bg-gray-800">
                      <p className="text-sm text-gray-500 mb-2">Amount</p>
                      <p className="text-xl font-semibold text-white">
                        {parseFloat(transaction.amount).toLocaleString()} {transaction.token}
                      </p>
                    </div>
                  )}

                  {/* Addresses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">From</p>
                      <a
                        href={getExplorerLink(transaction.hash, transaction.sender)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 font-mono text-sm break-all"
                      >
                        {transaction.sender}
                      </a>
                    </div>
                    {transaction.receiver && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">To</p>
                        <a
                          href={getExplorerLink(transaction.hash, transaction.receiver)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 font-mono text-sm break-all"
                        >
                          {transaction.receiver}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Stream ID */}
                  {transaction.streamId && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Stream ID</p>
                      <p className="font-mono text-white">{transaction.streamId}</p>
                    </div>
                  )}

                  {/* Ledger Info */}
                  {transaction.ledger && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Ledger #{transaction.ledger.toLocaleString()}</span>
                      <a
                        href={getExplorerLink(transaction.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                      >
                        View on StellarExpert
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )}

                  {/* Power User Toggle */}
                  <div className="border-t border-gray-700 pt-6">
                    <button
                      onClick={() => setShowPowerUser(!showPowerUser)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                    >
                      {showPowerUser ? <EyeOff size={16} /> : <Eye size={16} />}
                      <span className="text-sm font-medium">
                        {showPowerUser ? "Hide" : "Show"} Raw Data
                      </span>
                      <span className="text-xs text-gray-500">(Power User)</span>
                    </button>
                  </div>

                  {/* Raw Data Section */}
                  {showPowerUser && (
                    <div className="space-y-4">
                      {isLoadingRaw ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 size={24} className="animate-spin text-cyan-500" />
                          <span className="ml-2 text-gray-400">Loading raw data...</span>
                        </div>
                      ) : rawData ? (
                        <>
                          {/* XDR Section */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Code size={18} />
                                Raw XDR
                              </h3>
                              <button
                                onClick={handleCopyXdr}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors"
                              >
                                {copiedXdr ? <Check size={14} /> : <Copy size={14} />}
                                {copiedXdr ? "Copied!" : "Copy XDR"}
                              </button>
                            </div>
                            <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all overflow-x-auto">
                                {rawData.xdr}
                              </pre>
                            </div>
                          </div>

                          {/* JSON Section */}
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                              <FileText size={18} />
                              Transaction JSON
                            </h3>
                            <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 max-h-96 overflow-auto">
                              <JsonView 
                                value={rawData.json} 
                                style={{
                                  backgroundColor: 'transparent',
                                  fontSize: '12px',
                                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                                }}
                              />
                            </div>
                          </div>

                          {/* Events Section */}
                          {rawData.events && rawData.events.length > 0 && (
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FileText size={18} />
                                Contract Events
                              </h3>
                              <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 max-h-96 overflow-auto">
                                <JsonView 
                                  value={rawData.events} 
                                  style={{
                                    backgroundColor: 'transparent',
                                    fontSize: '12px',
                                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          Failed to load raw transaction data
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}