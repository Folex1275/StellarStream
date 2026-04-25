"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSplitFeed } from "@/lib/hooks/use-split-feed";

export function SplitLiveTicker() {
  const { events, connected } = useSplitFeed();

  return (
    <div className="w-full rounded-2xl border border-[#00F5FF]/30 bg-white/[0.03] backdrop-blur-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-[#4ADE80] shadow-[0_0_6px_#4ADE80]" : "bg-white/30"
            }`}
          />
          <span className="text-xs font-medium tracking-widest text-white/60 uppercase">
            Live Splits
          </span>
        </div>
        <span className="text-xs text-white/30">V3 Protocol</span>
      </div>

      {/* Feed */}
      <ul className="divide-y divide-white/5 max-h-72 overflow-y-auto">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-white/30">
              Waiting for splits…
            </li>
          ) : (
            events.map((ev) => (
              <motion.li
                key={`${ev.splitId}-${ev.timestamp}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Sender badge */}
                  <span className="font-mono text-xs text-[#00F5FF] shrink-0">
                    {ev.sender}
                  </span>
                  <span className="text-white/40 text-xs truncate">
                    split to {ev.recipientCount} recipient{ev.recipientCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-white tabular-nums">
                    {ev.amount}
                  </span>
                  <span className="text-xs text-white/50">{ev.token}</span>
                </div>
              </motion.li>
            ))
          )}
        </AnimatePresence>
      </ul>
    </div>
  );
}
