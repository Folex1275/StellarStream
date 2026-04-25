"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { getExplorerLink } from "@/lib/explorer";
import { 
  X, 
  History, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownLeft, 
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Copy,
  Check,
  Loader2,
  Download,
} from "lucide-react";

/**
 * Transaction event types
 */
export type TransactionEventType = 
  | "migration"
  | "withdrawal"
  | "cancellation"
  | "stream_created"
  | "stream_paused"
  | "stream_resumed"
  | "approval"
  | "transfer";

/**
 * Transaction event from the Global Audit Log
 */
export interface TransactionEvent {
  id: string;
  type: TransactionEventType;
  hash: string;
  timestamp: number;
  sender: string;
  receiver?: string;
  amount?: string;
  token?: string;
  streamId?: string;
  metadata?: Record<string, unknown>;
  status: "pending" | "confirmed" | "failed";
  blockTime?: number;
  ledger?: number;
}

/**
 * Props for TransactionHistorySidebar
 */
export interface TransactionHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** API endpoint for fetching audit log */
  apiEndpoint?: string;
  /** User address to filter events (optional) */
  userAddress?: string;
}

/**
 * Event type configuration
 */
const EVENT_CONFIG: Record<TransactionEventType, { 
  label: string; 
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  migration: {
    label: "Migration",
    icon: <RefreshCw size={16} />,
    color: "text-amber-400",
    bgColor: "bg-amber-400/20",
  },
  withdrawal: {
    label: "Withdrawal",
    icon: <ArrowDownLeft size={16} />,
    color: "text-green-400",
    bgColor: "bg-green-400/20",
  },
  cancellation: {
    label: "Cancellation",
    icon: <XCircle size={16} />,
    color: "text-red-400",
    bgColor: "bg-red-400/20",
  },
  stream_created: {
    label: "Stream Created",
    icon: <ArrowUpRight size={16} />,
    color: "text-blue-400",
    bgColor: "bg-blue-400/20",
  },
  stream_paused: {
    label: "Paused",
    icon: <History size={16} />,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/20",
  },
  stream_resumed: {
    label: "Resumed",
    icon: <History size={16} />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/20",
  },
  approval: {
    label: "Approval",
    icon: <Check size={16} />,
    color: "text-purple-400",
    bgColor: "bg-purple-400/20",
  },
  transfer: {
    label: "Transfer",
    icon: <ArrowUpRight size={16} />,
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/20",
  },
};

/**
 * Mock audit log data for development
 */
const MOCK_AUDIT_LOG: TransactionEvent[] = [
  {
    id: "1",
    type: "migration",
    hash: "a1b2c3d4e5f6789012345678901234567890abcd",
    timestamp: Date.now() - 1000 * 60 * 5,
    sender: "GABC...1234",
    receiver: "GXYZ...5678",
    amount: "1000",
    token: "XLM",
    streamId: "stream_001",
    status: "confirmed",
    blockTime: Date.now() - 1000 * 60 * 5,
    ledger: 12345678,
  },
  {
    id: "2",
    type: "withdrawal",
    hash: "b2c3d4e5f67890123456789012345678901abcde",
    timestamp: Date.now() - 1000 * 60 * 30,
    sender: "GABC...1234",
    amount: "250.50",
    token: "USDC",
    streamId: "stream_002",
    status: "confirmed",
    blockTime: Date.now() - 1000 * 60 * 30,
    ledger: 12345670,
  },
  {
    id: "3",
    type: "cancellation",
    hash: "c3d4e5f678901234567890123456789012abcdef",
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    sender: "GXYZ...5678",
    receiver: "GABC...1234",
    amount: "500",
    token: "XLM",
    streamId: "stream_003",
    status: "confirmed",
    blockTime: Date.now() - 1000 * 60 * 60 * 2,
    ledger: 12345650,
  },
  {
    id: "4",
    type: "stream_created",
    hash: "d4e5f6789012345678901234567890123abcdef0",
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    sender: "GABC...1234",
    receiver: "GMNO...9012",
    amount: "10000",
    token: "EURT",
    streamId: "stream_004",
    status: "confirmed",
    blockTime: Date.now() - 1000 * 60 * 60 * 24,
    ledger: 12345500,
  },
  {
    id: "5",
    type: "withdrawal",
    hash: "e5f67890123456789012345678901234abcdef01",
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    sender: "GABC...1234",
    amount: "125.75",
    token: "USDC",
    streamId: "stream_001",
    status: "confirmed",
    blockTime: Date.now() - 1000 * 60 * 60 * 48,
    ledger: 12345300,
  },
];

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format timestamp to full date/time
 */
function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Truncate hash for display
 */
function truncateHash(hash: string, startChars = 6, endChars = 4): string {
  if (hash.length <= startChars + endChars) return hash;
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
}

/**
 * Copy to clipboard helper
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get StellarExpert URL for transaction
 */
function getStellarExpertUrl(hash: string, network: "public" | "testnet" = "public"): string {
  const baseUrl = network === "testnet" 
    ? "https://testnet.stellar.expert/explorer" 
    : "https://stellar.expert/explorer";
  return `${baseUrl}/tx/${hash}`;
}

/**
 * Get StellarExpert URL for account
 */
function getStellarExpertAccountUrl(address: string, network: "public" | "testnet" = "public"): string {
  const baseUrl = network === "testnet" 
    ? "https://testnet.stellar.expert/explorer" 
    : "https://stellar.expert/explorer";
  return `${baseUrl}/account/${address}`;
}

/**
 * Export transaction events to a CSV file and trigger browser download.
 * Fields: Date, StreamID, Asset, Amount, Recipient, TX_Hash
 */
function exportEventsToCSV(events: TransactionEvent[], filename = "stream-history.csv"): void {
  const headers = ["Date", "StreamID", "Asset", "Amount", "Recipient", "TX_Hash"];

  const rows = events.map((e) => [
    new Date(e.timestamp).toISOString(),
    e.streamId ?? "",
    e.token ?? "",
    e.amount ?? "",
    e.receiver ?? e.sender,
    e.hash,
  ]);

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Transaction History Sidebar Component
 * 
 * A slide-out drawer showing past transactions from the Global Audit Log.
 * Features:
 * - Headless UI Dialog-based drawer
 * - Fetches events from backend audit log
 * - View on StellarExpert links for each transaction
 * - Event type filtering
 * - Copy transaction hash functionality
 * 
 * @example
 * ```tsx
 * <TransactionHistorySidebar
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   userAddress="GABC...1234"
 * />
 * ```
 */
export function TransactionHistorySidebar({
  isOpen,
  onClose,
  apiEndpoint,
  userAddress,
}: TransactionHistorySidebarProps) {
  const [events, setEvents] = useState<TransactionEvent[]>(MOCK_AUDIT_LOG);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<TransactionEventType | "all">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Fetch audit log from backend
   */
  const fetchAuditLog = useCallback(async () => {
    if (!apiEndpoint) {
      // Use mock data if no API endpoint
      setEvents(MOCK_AUDIT_LOG);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(apiEndpoint, window.location.origin);
      if (userAddress) {
        url.searchParams.append("address", userAddress);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch audit log");
      
      const data = await response.json();
      setEvents(data.events || data);
    } catch (err) {
      console.error("Error fetching audit log:", err);
      setError("Failed to load transaction history");
      // Fall back to mock data
      setEvents(MOCK_AUDIT_LOG);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, userAddress]);

  // Fetch audit log when sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchAuditLog();
    }
  }, [isOpen, fetchAuditLog]);

  // Filter and sort events
  const filteredEvents = events
    .filter((event) => {
      if (selectedType !== "all" && event.type !== selectedType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          event.hash.toLowerCase().includes(query) ||
          event.sender.toLowerCase().includes(query) ||
          event.receiver?.toLowerCase().includes(query) ||
          event.streamId?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const diff = b.timestamp - a.timestamp;
      return sortOrder === "desc" ? diff : -diff;
    });

  // Handle copy to clipboard
  const handleCopy = async (hash: string, id: string) => {
    const success = await copyToClipboard(hash);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <Transition show={isOpen}>
      {/* Backdrop */}
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>

        {/* Drawer */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <TransitionChild
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-gradient-to-b from-gray-900 to-gray-950 border-l border-white/10 shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                          <History size={20} className="text-white" />
                        </div>
                        <div>
                          <DialogTitle className="text-lg font-bold text-white">
                            Transaction History
                          </DialogTitle>
                          <p className="text-sm text-gray-400">
                            {filteredEvents.length} events
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <X size={20} className="text-gray-400" />
                      </button>
                    </div>

                    {/* Filters */}
                    <div className="px-6 py-4 border-b border-white/10 space-y-4">
                      {/* Search */}
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by hash, address..."
                          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                      </div>

                      {/* Event Type Filter */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <Filter size={14} className="text-gray-400 flex-shrink-0" />
                        <button
                          onClick={() => setSelectedType("all")}
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                            selectedType === "all"
                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                              : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10"
                          }`}
                        >
                          All
                        </button>
                        {Object.entries(EVENT_CONFIG).map(([type, config]) => (
                          <button
                            key={type}
                            onClick={() => setSelectedType(type as TransactionEventType)}
                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                              selectedType === type
                                ? `${config.bgColor} ${config.color} border ${config.color.replace("text-", "border-")}/30`
                                : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10"
                            }`}
                          >
                            {config.label}
                          </button>
                        ))}
                      </div>

                      {/* Sort */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Sort by newest first
                        </span>
                        <button
                          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          {sortOrder === "desc" ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronUp size={14} />
                          )}
                          {sortOrder === "desc" ? "Newest" : "Oldest"}
                        </button>
                      </div>
                    </div>

                    {/* Event List */}
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 size={32} className="animate-spin text-cyan-500" />
                        </div>
                      ) : error ? (
                        <div className="text-center py-8">
                          <p className="text-red-400 mb-2">{error}</p>
                          <button
                            onClick={fetchAuditLog}
                            className="text-sm text-cyan-400 hover:text-cyan-300"
                          >
                            Try again
                          </button>
                        </div>
                      ) : filteredEvents.length > 0 ? (
                        <div className="space-y-3">
                          {filteredEvents.map((event) => {
                            const config = EVENT_CONFIG[event.type];
                            const isCopied = copiedId === event.id;
                            
                            return (
                              <div
                                key={event.id}
                                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                              >
                                {/* Header Row */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                                      <span className={config.color}>{config.icon}</span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-white">
                                        {config.label}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {formatRelativeTime(event.timestamp)}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Status Badge */}
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    event.status === "confirmed"
                                      ? "bg-green-400/20 text-green-400"
                                      : event.status === "pending"
                                      ? "bg-yellow-400/20 text-yellow-400"
                                      : "bg-red-400/20 text-red-400"
                                  }`}>
                                    {event.status}
                                  </span>
                                </div>

                                {/* Amount (if present) */}
                                {event.amount && event.token && (
                                  <div className="mb-3 px-3 py-2 rounded-lg bg-white/5">
                                    <p className="text-xs text-gray-500 mb-0.5">Amount</p>
                                    <p className="font-mono text-white">
                                      {parseFloat(event.amount).toLocaleString()} {event.token}
                                    </p>
                                  </div>
                                )}

                                {/* Addresses */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div>
                                    <p className="text-xs text-gray-500 mb-0.5">From</p>
                                    <a
                                      href={getExplorerLink(event.hash, event.sender)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-cyan-400 hover:text-cyan-300 font-mono truncate block"
                                      title={`View ${event.sender} on Stellar.Expert`}
                                    >
                                      {event.sender}
                                    </a>
                                  </div>
                                  {event.receiver && (
                                    <div>
                                      <p className="text-xs text-gray-500 mb-0.5">To</p>
                                      <a
                                        href={getExplorerLink(event.hash, event.receiver)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-cyan-400 hover:text-cyan-300 font-mono truncate block"
                                        title={`View ${event.receiver} on Stellar.Expert`}
                                      >
                                        {event.receiver}
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {/* Transaction Hash */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-500">Tx:</p>
                                    <p className="text-xs text-gray-400 font-mono">
                                      {truncateHash(event.hash)}
                                    </p>
                                    <button
                                      onClick={() => handleCopy(event.hash, event.id)}
                                      className="p-1 rounded hover:bg-white/10 transition-colors"
                                    >
                                      {isCopied ? (
                                        <Check size={12} className="text-green-400" />
                                      ) : (
                                        <Copy size={12} className="text-gray-400" />
                                      )}
                                    </button>
                                  </div>
                                  
                                  <a
                                    href={getExplorerLink(event.hash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                                  >
                                    View on StellarExpert
                                    <ExternalLink size={12} />
                                  </a>
                                </div>

                                {/* Ledger & Time */}
                                {event.ledger && (
                                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                                    <span>Ledger #{event.ledger.toLocaleString()}</span>
                                    <span>{formatDateTime(event.timestamp)}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <History size={48} className="mx-auto text-gray-600 mb-4" />
                          <p className="text-gray-400">No transactions found</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchQuery ? "Try a different search" : "Your transactions will appear here"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/10 bg-black/20 flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-500">
                        Data from Global Audit Log • Updates automatically
                      </p>
                      <button
                        onClick={() => exportEventsToCSV(filteredEvents)}
                        disabled={filteredEvents.length === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Download history as CSV"
                      >
                        <Download size={13} />
                        Download CSV
                      </button>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default TransactionHistorySidebar;
