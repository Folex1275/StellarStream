"use client";

import { useTransactionFeed } from "@/lib/hooks/use-transaction-feed";
import { 
  ArrowRightFromArc, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Users, 
  Zap 
} from "lucide-react";
import { type TransactionFeedItem } from "@/lib/hooks/use-transaction-feed";

/**
 * Formats a transaction feed item description based on its type.
 * Requirements: 4.5, 4.6
 */
export function formatFeedDescription(item: TransactionFeedItem): string {
  switch (item.type) {
    case 'recipient_added':
      return `${item.actor ?? 'Unknown'} added a recipient`;
    case 'split_approved':
      return `${item.asset ?? 'Unknown'} Split Approved`;
    default:
      return item.description;
  }
}

/**
 * Formats an ISO 8601 timestamp as a relative time string (e.g., "2m ago").
 * Requirements: 4.12
 */
export function formatRelativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

export function TransactionFeed() {
  const { feed, loading, error, reconnecting, reconnectAttempt, connectionLost } = useTransactionFeed();

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="font-heading text-xs text-white/60 uppercase tracking-wider">
          Transaction Feed
        </h3>
        <div className="text-center py-4 text-white/50">Loading transaction feed...</div>
      </div>
    );
  }

  if (error && !feed.length) {
    return (
      <div className="space-y-2">
        <h3 className="font-heading text-xs text-white/60 uppercase tracking-wider">
          Transaction Feed
        </h3>
        <div className="text-center text-red-500 py-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-heading text-xs text-white/60 uppercase tracking-wider">
        Transaction Feed
      </h3>

      {/* Reconnecting indicator */}
      {reconnecting && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-400">
          Reconnecting… (attempt {reconnectAttempt}/5)
        </div>
      )}

      {/* Connection lost indicator */}
      {connectionLost && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          Connection lost — refresh to retry
        </div>
      )}

      {feed.length === 0 ? (
        <div className="text-center text-white/50 py-4">No recent activity</div>
      ) : (
        <div
          role="feed"
          aria-label="Transaction activity feed"
          aria-busy={loading}
          className="space-y-1"
        >
          {feed.map((item) => (
            <article
              key={item.id}
              role="article"
              tabIndex={0}
              aria-label={formatFeedDescription(item)}
              className="flex items-start gap-2 rounded-lg p-2 hover:bg-white/[0.02] transition-colors focus:outline-none focus:ring-2 focus:ring-stellar-primary"
            >
              {/* Icon based on type */}
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 ${
                  item.status === 'confirmed' ? 'bg-[#00f5ff]/20 text-[#00f5ff]' : ''
                } ${
                  item.status === 'ledger_confirmation' ? 'animate-pulse-border' : ''
                }`}
              >
                {getIconForType(item.type)}
              </div>
              <div className="flex-1 flex-col space-y-0.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-body text-xs text-white/70 truncate">
                    {formatFeedDescription(item)}
                  </p>
                  <p className="font-body text-xs text-white/50 flex-shrink-0">
                    {formatRelativeTime(item.timestamp)}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  {item.actor && (
                    <span className="flex items-center gap-1 text-white/60">
                      <Users className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{item.actor}</span>
                    </span>
                  )}
                  {item.asset && item.amount && (
                    <span className="flex items-center gap-1 text-white/60">
                      <DollarSign className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">
                        {item.amount} {item.asset}
                      </span>
                    </span>
                  )}
                  {item.status && (
                    <span
                      className={`flex items-center gap-1 text-white/60 ${
                        item.status === 'confirmed' ? 'text-[#00f5ff]' : ''
                      }`}
                    >
                      <CheckCircle className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{item.status}</span>
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to get icon based on transaction type
function getIconForType(type: string) {
  switch (type) {
    case 'stream_created':
      return <ArrowRightFromArc className="h-4 w-4" />;
    case 'recipient_added':
      return <Users className="h-4 w-4" />;
    case 'split_approved':
      return <CheckCircle className="h-4 w-4" />;
    case 'ledger_confirmation':
      return <Zap className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}