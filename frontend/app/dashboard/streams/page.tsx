"use client";

import { useState, useMemo, useEffect } from "react";
import StreamingBalanceCard from "@/components/streamingbalance/streamingbalance";
import { ArrowUpRight, ArrowDownLeft, ChevronDown } from "lucide-react";
import { useScrollBlur } from "@/lib/use-scroll-blur";
import MigrationWizard from "@/components/migration-wizard";
import StreamRowSkeleton from "@/components/stream-row-skeleton";

type Stream = {
  id: string;
  recipient: string;
  amount: number;
  rate: number;
  startDate: Date;
  endDate: Date;
  status: "active" | "paused" | "completed";
};

type SortOption = "endDate" | "value";

const mockOutgoingStreams: Stream[] = [
  {
    id: "out-1",
    recipient: "GDZX...4KLM",
    amount: 15000,
    rate: 0.00001,
    startDate: new Date("2026-02-15"),
    endDate: new Date("2026-03-15"),
    status: "active",
  },
  {
    id: "out-2",
    recipient: "GBTY...8NOP",
    amount: 8500,
    rate: 0.000008,
    startDate: new Date("2026-02-10"),
    endDate: new Date("2026-02-28"),
    status: "active",
  },
  {
    id: "out-3",
    recipient: "GCQR...2STU",
    amount: 3200,
    rate: 0.000005,
    startDate: new Date("2026-01-20"),
    endDate: new Date("2026-02-25"),
    status: "paused",
  },
];

const mockIncomingStreams: Stream[] = [
  {
    id: "in-1",
    recipient: "GABC...7XYZ",
    amount: 22000,
    rate: 0.000015,
    startDate: new Date("2026-02-12"),
    endDate: new Date("2026-03-20"),
    status: "active",
  },
  {
    id: "in-2",
    recipient: "GDEF...3QRS",
    amount: 12500,
    rate: 0.00001,
    startDate: new Date("2026-02-18"),
    endDate: new Date("2026-03-10"),
    status: "active",
  },
];

function StreamCard({
  stream,
  type,
}: {
  stream: Stream;
  type: "outgoing" | "incoming";
}) {
  const Icon = type === "outgoing" ? ArrowUpRight : ArrowDownLeft;
  const iconColor = type === "outgoing" ? "text-red-400" : "text-green-400";

  const progress = useMemo(() => {
    const now = Date.now();
    const start = stream.startDate.getTime();
    const end = stream.endDate.getTime();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  }, [stream.startDate, stream.endDate]);

  return (
    <div
      className={`relative rounded-xl border backdrop-blur-xl p-4 transition-all duration-300 hover:bg-white/[0.06] ${
        stream.status === "active"
          ? "border-[#00f5ff]/40 bg-white/[0.04] animate-pulse-border"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-white/5 ${iconColor}`}>
            <Icon size={16} />
          </div>
          <span className="font-mono text-sm text-white/90">
            {stream.recipient}
          </span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            stream.status === "active"
              ? "bg-[#00f5ff]/20 text-[#00f5ff]"
              : stream.status === "paused"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-white/10 text-white/60"
          }`}
        >
          {stream.status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-white/50">Total Amount</span>
          <span className="text-lg font-semibold text-white">
            ${stream.amount.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-xs text-white/50">Rate</span>
          <span className="text-sm text-white/70">
            ${stream.rate.toFixed(8)}/ms
          </span>
        </div>

        <div className="pt-2">
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00f5ff] to-[#8a00ff] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs text-white/40 pt-1">
          <span>Ends: {stream.endDate.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function StreamsPage() {
  const [migrationOpen, setMigrationOpen] = useState(false);
  const [outgoingSort, setOutgoingSort] = useState<SortOption>("endDate");
  const [incomingSort, setIncomingSort] = useState<SortOption>("endDate");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetch — replace with real fetch when ready
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Scroll blur hooks for adaptive lucency
  const [outgoingScrollState, outgoingScrollRef] = useScrollBlur({
    threshold: 10,
    maxScroll: 200,
  });
  const [incomingScrollState, incomingScrollRef] = useScrollBlur({
    threshold: 10,
    maxScroll: 200,
  });

  const sortStreams = (streams: Stream[], sortBy: SortOption) => {
    return [...streams].sort((a, b) => {
      if (sortBy === "endDate") {
        return a.endDate.getTime() - b.endDate.getTime();
      }
      return b.amount - a.amount;
    });
  };

  const sortedOutgoing = useMemo(
    () => sortStreams(mockOutgoingStreams, outgoingSort),
    [outgoingSort],
  );

  const sortedIncoming = useMemo(
    () => sortStreams(mockIncomingStreams, incomingSort),
    [incomingSort],
  );

  const totalStreaming = useMemo(() => {
    const outgoing = mockOutgoingStreams
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + s.amount, 0);
    const incoming = mockIncomingStreams
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + s.amount, 0);
    return incoming - outgoing;
  }, []);

  const totalRate = useMemo(() => {
    const outgoingRate = mockOutgoingStreams
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + s.rate, 0);
    const incomingRate = mockIncomingStreams
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + s.rate, 0);
    return incomingRate - outgoingRate;
  }, []);

  return (
    <>
      {/* Migration Center Banner */}
      <div className="col-span-full flex items-center justify-between rounded-2xl border border-[#ffb400]/20 bg-[#ffb400]/5 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="rounded-md border border-[#ffb400]/30 bg-[#ffb400]/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#ffb400]">
            V1
          </span>
          <p className="font-body text-sm text-white/70">
            You have legacy V1 streams — upgrade to Nebula V2 to unlock yield,
            Receipt NFTs, and more.
          </p>
        </div>
        <button
          onClick={() => setMigrationOpen(true)}
          className="ml-4 shrink-0 rounded-xl border border-[#00f5ff]/30 bg-[#00f5ff]/8 px-4 py-2 font-body text-xs font-bold text-[#00f5ff] transition-all hover:border-[#00f5ff]/50 hover:bg-[#00f5ff]/12 hover:shadow-[0_0_16px_rgba(0,245,255,0.12)]"
        >
          Open Migration Center →
        </button>
      </div>

      {/* Column 1: Total Streaming Odometer */}
      <section className="col-span-full lg:col-span-4 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[320px]">
        <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase mb-2">
          Net Streaming Balance
        </p>
        <div className="my-6">
          <StreamingBalanceCard
            initialValue={totalStreaming}
            rate={totalRate}
            prefix="$"
            decimals={7}
            color="#00f5ff"
          />
        </div>
        <p className="font-body text-sm text-white/50 text-center max-w-md">
          Real-time balance across all active incoming and outgoing streams
        </p>
      </section>

      {/* Column 2: Outgoing Streams */}
      <section className="col-span-full lg:col-span-4 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        {/* Dynamic Blur Header with Adaptive Lucency */}
        <div
          className="sticky top-0 z-10 px-6 md:px-8 pt-6 md:pt-8 pb-6 transition-all duration-300"
          style={{
            backdropFilter: `blur(${outgoingScrollState.blurIntensity === "md" ? "12px" : outgoingScrollState.blurIntensity === "lg" ? "16px" : outgoingScrollState.blurIntensity === "xl" ? "20px" : "24px"})`,
            backgroundColor: `rgba(255, 255, 255, ${outgoingScrollState.bgOpacity})`,
            borderBottom: outgoingScrollState.isScrolled
              ? "1px solid #8a00ff"
              : "1px solid transparent",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">
                Outgoing
              </p>
              <h2 className="font-heading text-2xl mt-1">Sending Streams</h2>
            </div>
            <div className="relative">
              <select
                value={outgoingSort}
                onChange={(e) => setOutgoingSort(e.target.value as SortOption)}
                className="appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-8 text-sm text-white/90 cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00f5ff]/50"
              >
                <option value="endDate">Sort by: End Date</option>
                <option value="value">Sort by: Value</option>
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/50"
                size={16}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Stream List */}
        <div
          ref={outgoingScrollRef}
          className="space-y-3 max-h-[600px] overflow-y-auto px-6 md:px-8 pb-6 md:pb-8 stream-list-scroll"
        >
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <StreamRowSkeleton key={`out-skeleton-${i}`} />
              ))
            : sortedOutgoing.map((stream) => (
                <StreamCard key={stream.id} stream={stream} type="outgoing" />
              ))}
        </div>
      </section>

      {/* Column 3: Incoming Streams */}
      <section className="col-span-full lg:col-span-4 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        {/* Dynamic Blur Header with Adaptive Lucency */}
        <div
          className="sticky top-0 z-10 px-6 md:px-8 pt-6 md:pt-8 pb-6 transition-all duration-300"
          style={{
            backdropFilter: `blur(${incomingScrollState.blurIntensity === "md" ? "12px" : incomingScrollState.blurIntensity === "lg" ? "16px" : incomingScrollState.blurIntensity === "xl" ? "20px" : "24px"})`,
            backgroundColor: `rgba(255, 255, 255, ${incomingScrollState.bgOpacity})`,
            borderBottom: incomingScrollState.isScrolled
              ? "1px solid #8a00ff"
              : "1px solid transparent",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-xs tracking-[0.12em] text-white/60 uppercase">
                Incoming
              </p>
              <h2 className="font-heading text-2xl mt-1">Receiving Streams</h2>
            </div>
            <div className="relative">
              <select
                value={incomingSort}
                onChange={(e) => setIncomingSort(e.target.value as SortOption)}
                className="appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-8 text-sm text-white/90 cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00f5ff]/50"
              >
                <option value="endDate">Sort by: End Date</option>
                <option value="value">Sort by: Value</option>
              </select>
              <ChevronDown
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/50"
                size={16}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Stream List */}
        <div
          ref={incomingScrollRef}
          className="space-y-3 max-h-[600px] overflow-y-auto px-6 md:px-8 pb-6 md:pb-8 stream-list-scroll"
        >
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <StreamRowSkeleton key={`in-skeleton-${i}`} />
              ))
            : sortedIncoming.map((stream) => (
                <StreamCard key={stream.id} stream={stream} type="incoming" />
              ))}
        </div>
      </section>

      {/* Migration Wizard Modal */}
      {migrationOpen && (
        <MigrationWizard
          walletAddress="GBCZ7HJVDXQKLYH2GYBF6XNMNBQKRDJ5PHKPVQKJ5JDDKL6K4NQDGA"
          onClose={() => setMigrationOpen(false)}
        />
      )}
    </>
  );
}
