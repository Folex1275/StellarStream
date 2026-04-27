"use client";

import { useEffect, useState } from "react";
import { Drawer } from "../Drawer";
import { ExternalLink, ArrowUpRight, ArrowDownRight, History as HistoryIcon, ShieldCheck, Shield } from "lucide-react";
import Link from "next/link";

interface AuditLogItem {
  id: string;
  eventType: string; // 'create' | 'withdraw' | 'cancel'
  streamId: string;
  txHash: string;
  ledger: number;
  ledgerClosedAt: string;
  sender: string | null;
  receiver: string | null;
  amount: string | null;
  metadata: any | null;
  createdAt: string;
}

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogDrawer({ isOpen, onClose }: AuditLogDrawerProps) {
  const [events, setEvents] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAuditLog();
    }
  }, [isOpen]);

  const fetchAuditLog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Assuming the API is accessible at /api/audit-log
      // Depending on Next.js setup, might need full URL or relative
      const response = await fetch("/api/audit-log");
      if (!response.ok) throw new Error("Failed to fetch audit log");
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Audit Log fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "create":
        return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
      case "withdraw":
        return <ArrowUpRight className="h-4 w-4 text-orange-400" />;
      case "cancel":
        return <ArrowDownRight className="h-4 w-4 text-rose-400" />;
      default:
        return <HistoryIcon className="h-4 w-4 text-white/40" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "create":
        return "Migration Created";
      case "withdraw":
        return "Withdrawal";
      case "cancel":
        return "Cancellation";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const formatAddress = (address: string | null) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Global Protocol Events">
      <div className="space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
            {error}
            <button
              onClick={fetchAuditLog}
              className="ml-2 underline hover:text-rose-300"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && events.length === 0 && (
          <div className="py-10 text-center text-white/30">
            No events found.
          </div>
        )}

        {!isLoading && events.length > 0 && (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
                      {getEventIcon(event.eventType)}
                    </div>
                    <div>
                      <p className="font-heading text-sm text-white/90">
                        {getEventLabel(event.eventType)}
                      </p>
                      <p className="text-[10px] text-white/40 tabular-nums">
                        {new Date(event.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://stellar.expert/explorer/public/tx/${event.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Explorer
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-2">
                    <p className="text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Sender</p>
                    <p className="text-xs font-mono text-white/60">{formatAddress(event.sender)}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.01] p-2">
                    <p className="text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Recipient</p>
                    <p className="text-xs font-mono text-white/60">{formatAddress(event.receiver)}</p>
                  </div>
                </div>

                {event.amount && (
                  <div className="mt-3 flex items-center justify-between px-1">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Amount</span>
                    <span className="text-sm font-bold text-white/80 tabular-nums">
                      {(Number(event.amount) / 10000000).toLocaleString()} <span className="text-white/30 font-normal text-[10px]">XLM</span>
                    </span>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] text-white/20 font-mono">ID: {event.streamId.slice(0, 12)}...</span>
                  <span className="text-[9px] text-white/20">Ledger: {event.ledger}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Link to full audit-trail visualizer */}
        {!isLoading && (
          <Link
            href="/dashboard/audit-trail"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] px-4 py-3 text-xs text-cyan-400 hover:bg-cyan-400/10 transition-colors"
          >
            <Shield className="h-4 w-4" />
            Open Audit-Trail Visualizer →
          </Link>
        )}
      </div>
    </Drawer>
  );
}
