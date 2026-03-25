"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Download } from "lucide-react";
import { StreamCard } from "./StreamCard";

interface Stream {
  id: string;
  name: string;
  sender: { address: string; label?: string };
  receiver: { address: string; label?: string };
  token: string;
  amountStreamed: number;
  totalAmount: number;
  startTime: Date;
  endTime: Date;
  status: "active" | "paused" | "ended";
  ratePerSecond: number;
}

interface ResponsiveStreamViewProps {
  streams: Stream[];
  onWithdraw?: (streamId: string) => void;
  onBatchWithdraw?: (streamIds: string[]) => void;
  onTopUp?: (streamId: string) => void;
  onViewDetails?: (streamId: string) => void;
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ResponsiveStreamView({
  streams,
  onWithdraw,
  onBatchWithdraw,
  onTopUp,
  onViewDetails,
}: ResponsiveStreamViewProps) {
  const [sortKey, setSortKey] = useState<"name" | "progress" | "amount">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedStreams = [...streams].sort((a, b) => {
    let comparison = 0;
    if (sortKey === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortKey === "progress") {
      const progressA = (a.amountStreamed / a.totalAmount) * 100;
      const progressB = (b.amountStreamed / b.totalAmount) * 100;
      comparison = progressA - progressB;
    } else if (sortKey === "amount") {
      comparison = a.totalAmount - b.totalAmount;
    }
    return sortDir === "asc" ? comparison : -comparison;
  });

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === streams.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(streams.map(s => s.id)));
    }
  };

  const handleBatchWithdraw = () => {
    if (onBatchWithdraw && selectedIds.size > 0) {
      onBatchWithdraw(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const totalSelectedAmount = streams
    .filter(s => selectedIds.has(s.id))
    .reduce((sum, s) => sum + s.amountStreamed, 0);

  return (
    <div className="w-full">
      {/* Mobile Card View (default, hidden on md+) */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg text-white">Active Streams</h2>
          <p className="font-body text-sm text-white/40">{streams.length} total</p>
        </div>

        {/* Mobile: Selection mode toggle */}
        {streams.length > 1 && (
          <button
            onClick={toggleSelectAll}
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.05] mb-4"
          >
            {selectedIds.size === streams.length ? "Deselect All" : "Select All"}
          </button>
        )}

        {sortedStreams.map((stream) => (
          <div key={stream.id} className="relative">
            {/* Selection checkbox overlay for mobile */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => toggleSelection(stream.id)}
                className={`flex h-6 w-6 items-center justify-center rounded-md border transition ${
                  selectedIds.has(stream.id)
                    ? "border-cyan-500 bg-cyan-500"
                    : "border-white/20 bg-white/5"
                }`}
              >
                {selectedIds.has(stream.id) && <Check className="h-4 w-4 text-black" />}
              </button>
            </div>
            <StreamCard
              streamId={stream.id}
              name={stream.name}
              sender={stream.sender}
              receiver={stream.receiver}
              token={stream.token}
              amountStreamed={stream.amountStreamed}
              totalAmount={stream.totalAmount}
              startTime={stream.startTime}
              endTime={stream.endTime}
              status={stream.status}
              ratePerSecond={stream.ratePerSecond}
              onWithdraw={onWithdraw ? () => onWithdraw(stream.id) : undefined}
              onTopUp={onTopUp ? () => onTopUp(stream.id) : undefined}
              onViewDetails={onViewDetails ? () => onViewDetails(stream.id) : undefined}
            />
          </div>
        ))}
      </div>

      {/* Desktop Table View (hidden on mobile, shown on md+) */}
      <div className="hidden md:block rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                      selectedIds.size === streams.length
                        ? "border-cyan-500 bg-cyan-500"
                        : "border-white/20 bg-white/5 hover:border-white/40"
                    }`}
                  >
                    {selectedIds.size === streams.length && <Check className="h-3.5 w-3.5 text-black" />}
                  </button>
                </th>
                <th
                  onClick={() => handleSort("name")}
                  className="cursor-pointer px-6 py-4 text-left font-body text-[10px] uppercase tracking-wider text-white/40 hover:text-white/60 transition"
                >
                  Stream {sortKey === "name" && (sortDir === "asc" ? "▲" : "▼")}
                </th>
                <th className="px-6 py-4 text-left font-body text-[10px] uppercase tracking-wider text-white/40">
                  From → To
                </th>
                <th
                  onClick={() => handleSort("progress")}
                  className="cursor-pointer px-6 py-4 text-left font-body text-[10px] uppercase tracking-wider text-white/40 hover:text-white/60 transition"
                >
                  Progress {sortKey === "progress" && (sortDir === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("amount")}
                  className="cursor-pointer px-6 py-4 text-right font-body text-[10px] uppercase tracking-wider text-white/40 hover:text-white/60 transition"
                >
                  Amount {sortKey === "amount" && (sortDir === "asc" ? "▲" : "▼")}
                </th>
                <th className="px-6 py-4 text-center font-body text-[10px] uppercase tracking-wider text-white/40">
                  Status
                </th>
                <th className="px-6 py-4 text-right font-body text-[10px] uppercase tracking-wider text-white/40">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStreams.map((stream, idx) => {
                const progress = (stream.amountStreamed / stream.totalAmount) * 100;
                const isSelected = selectedIds.has(stream.id);
                return (
                  <tr
                    key={stream.id}
                    className={`border-b border-white/5 transition ${
                      isSelected ? "bg-cyan-500/5" : "hover:bg-white/[0.02]"
                    }`}
                    style={{ animation: `fadeIn 0.3s ease ${idx * 50}ms both` }}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSelection(stream.id)}
                        className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-500"
                            : "border-white/20 bg-white/5 hover:border-white/40"
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 text-black" />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-heading text-sm text-white mb-1">{stream.name}</p>
                        <p className="font-body text-xs text-white/40 font-mono">{truncateAddress(stream.id)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-white/60 font-mono">
                        <span>{stream.sender.label || truncateAddress(stream.sender.address)}</span>
                        <span className="text-white/30">→</span>
                        <span>{stream.receiver.label || truncateAddress(stream.receiver.address)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-violet-400"
                            style={{ width: `${progress}%`, transition: "width 0.3s ease" }}
                          />
                        </div>
                        <span className="font-heading text-sm text-white tabular-nums w-12 text-right">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-heading text-sm text-white tabular-nums">
                        {stream.amountStreamed.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </p>
                      <p className="font-body text-xs text-white/40">
                        of {stream.totalAmount.toLocaleString()} {stream.token}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                        stream.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        stream.status === "paused" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-white/5 text-white/40 border border-white/10"
                      }`}>
                        {stream.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {onWithdraw && (
                          <button
                            onClick={() => onWithdraw(stream.id)}
                            className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-400 transition hover:bg-violet-500/20"
                          >
                            Withdraw
                          </button>
                        )}
                        {onTopUp && (
                          <button
                            onClick={() => onTopUp(stream.id)}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                          >
                            Top-up
                          </button>
                        )}
                        {onViewDetails && (
                          <button
                            onClick={() => onViewDetails(stream.id)}
                            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.05]"
                          >
                            Details
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Batch Withdraw Button */}
      <AnimatePresence>
        {selectedIds.size > 0 && onBatchWithdraw && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="rounded-2xl border border-cyan-500/30 bg-black/90 backdrop-blur-xl shadow-2xl shadow-cyan-500/20 p-4">
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="font-body text-xs text-white/60 mb-1">
                    {selectedIds.size} stream{selectedIds.size > 1 ? "s" : ""} selected
                  </p>
                  <p className="font-heading text-lg text-white tabular-nums">
                    {totalSelectedAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <button
                  onClick={handleBatchWithdraw}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-105"
                >
                  <Download className="h-5 w-5" />
                  <span>Batch Withdraw</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
