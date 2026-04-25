"use client";

// components/capital-flow-map.tsx
// Issue: Capital Flow Map [Frontend][Data-Viz][Hard]
// Interactive SVG map showing capital beams from sender wallet to global recipients
// during the Execute phase of a split.

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe } from "lucide-react";

// ─── Region mapping ───────────────────────────────────────────────────────────
// Maps a Stellar G-address to an approximate SVG coordinate on the world map.
// Uses the first 4 chars of the address as a deterministic seed.

const REGIONS: Array<{ name: string; x: number; y: number }> = [
  { name: "North America", x: 160, y: 130 },
  { name: "South America", x: 220, y: 230 },
  { name: "Western Europe", x: 390, y: 110 },
  { name: "Eastern Europe", x: 450, y: 100 },
  { name: "West Africa", x: 370, y: 190 },
  { name: "East Africa", x: 450, y: 200 },
  { name: "Middle East", x: 490, y: 140 },
  { name: "South Asia", x: 560, y: 160 },
  { name: "East Asia", x: 640, y: 130 },
  { name: "Southeast Asia", x: 630, y: 185 },
  { name: "Oceania", x: 680, y: 240 },
];

function addressToRegion(address: string): { name: string; x: number; y: number } {
  if (!address || address.length < 4) return REGIONS[0];
  const seed = address.charCodeAt(1) + address.charCodeAt(2) + address.charCodeAt(3);
  return REGIONS[seed % REGIONS.length];
}

function parseAsset(amount?: string): string | undefined {
  if (!amount) return undefined;
  const match = amount.trim().match(/([A-Z]{2,6})$/);
  return match ? match[1] : undefined;
}

const STATUS_LABELS: Record<string, string> = {
  delivered: "Delivered",
  in_transit: "In Transit",
  pending: "Pending",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlowRecipient {
  address: string;
  amount?: string;
  label?: string;
  asset?: string;
  deliveryStatus?: "delivered" | "in_transit" | "pending" | string;
  /** If set, this recipient is a bridge address routing to another chain */
  bridgeDestination?: {
    chain: "Polygon" | "Ethereum" | "Arbitrum" | "Base" | "Solana" | string;
    address?: string;
  };
}

interface Props {
  /** Sender's wallet address (origin of all beams) */
  senderAddress?: string;
  /** List of recipients to draw beams to */
  recipients: FlowRecipient[];
  /** When true, beams animate (Execute phase is active) */
  isExecuting: boolean;
  className?: string;
}

// ─── SVG world map paths (simplified continents) ──────────────────────────────

const CONTINENT_PATHS = [
  // North America
  "M 100 80 L 130 70 L 200 75 L 230 100 L 240 130 L 220 160 L 190 170 L 160 160 L 130 140 L 110 120 Z",
  // South America
  "M 190 175 L 220 170 L 250 185 L 260 220 L 255 260 L 235 280 L 210 275 L 195 250 L 185 220 Z",
  // Europe
  "M 360 70 L 410 65 L 440 75 L 450 95 L 430 110 L 400 115 L 370 105 L 355 90 Z",
  // Africa
  "M 360 120 L 400 115 L 430 125 L 440 160 L 435 210 L 415 240 L 390 245 L 365 230 L 350 195 L 348 160 Z",
  // Asia
  "M 450 70 L 560 60 L 660 75 L 700 100 L 690 140 L 650 160 L 580 170 L 510 155 L 460 130 L 445 100 Z",
  // Oceania
  "M 630 210 L 680 205 L 710 220 L 705 250 L 670 255 L 635 245 Z",
];

// ─── Bridge chain metadata ────────────────────────────────────────────────────

const CHAIN_COLORS: Record<string, string> = {
  Polygon: "#8247e5",
  Ethereum: "#627eea",
  Arbitrum: "#28a0f0",
  Base: "#0052ff",
  Solana: "#9945ff",
};

function chainColor(chain: string): string {
  return CHAIN_COLORS[chain] ?? "#a0a0a0";
}

/** Holographic breadcrumb: Sender → Stellar → Bridge → Destination Chain */
function BridgeBreadcrumb({ chain, address }: { chain: string; address?: string }) {
  const color = chainColor(chain);
  const steps = ["Sender", "Stellar", "Bridge", chain];
  return (
    <div
      className="mt-2 flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-mono"
      style={{
        background: `linear-gradient(90deg, ${color}18, ${color}08)`,
        border: `1px solid ${color}40`,
      }}
    >
      {steps.map((step, i) => (
        <span key={step} className="flex items-center gap-1">
          <span style={{ color: i === steps.length - 1 ? color : "rgba(255,255,255,0.45)" }}>
            {step}
          </span>
          {i < steps.length - 1 && (
            <span style={{ color: `${color}60` }}>›</span>
          )}
        </span>
      ))}
      {address && (
        <span className="ml-1 opacity-50">
          ({address.slice(0, 6)}…)
        </span>
      )}
    </div>
  );
}

// ─── Beam component ───────────────────────────────────────────────────────────

function CapitalBeam({
  x1, y1, x2, y2, delay, amount, fade = false,
}: {
  x1: number; y1: number; x2: number; y2: number;
  delay: number; amount?: string; fade?: boolean;
}) {
  // Cubic bezier control point — arc upward
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - 60;
  const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  const strokeOpacity = fade ? 0.15 : 1;
  const dotOpacity = fade ? 0.35 : 1;

  return (
    <g opacity={fade ? 0.35 : 1}>
      {/* Static dim path */}
      <path d={d} fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="1" opacity={strokeOpacity} />

      {/* Animated travelling dot */}
      <motion.circle
        r={3}
        fill="#22d3ee"
        filter="url(#beam-glow)"
        initial={{ offsetDistance: "0%", opacity: dotOpacity }}
        animate={{ offsetDistance: "100%", opacity: dotOpacity }}
        transition={{
          duration: 1.6,
          delay,
          repeat: Infinity,
          repeatDelay: 0.8,
          ease: "easeInOut",
        }}
        style={{ offsetPath: `path('${d}')` } as React.CSSProperties}
      />

      {/* Destination pulse */}
      <motion.circle
        cx={x2}
        cy={y2}
        r={5}
        fill="none"
        stroke="#22d3ee"
        strokeWidth="1.5"
        initial={{ scale: 0.5, opacity: 0.8 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 1.4, delay, repeat: Infinity, repeatDelay: 1 }}
      />

      {/* Amount label */}
      {amount && (
        <text
          x={x2 + 7}
          y={y2 + 4}
          fontSize="8"
          fill="rgba(34,211,238,0.7)"
          fontFamily="monospace"
        >
          {amount}
        </text>
      )}
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CapitalFlowMap({
  senderAddress,
  recipients,
  isExecuting,
  className = "",
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Sender node — fixed centre-left
  const SENDER = { x: 80, y: 160 };

  const recipientNodes = useMemo(
    () =>
      recipients.map((r) => ({
        ...r,
        asset: r.asset ?? parseAsset(r.amount),
        region: addressToRegion(r.address),
      })),
    [recipients],
  );

  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(recipientNodes
        .map((r) => r.deliveryStatus)
        .filter(Boolean) as string[]),
    ).sort();
  }, [recipientNodes]);

  const [showUSDCOnly, setShowUSDCOnly] = useState(false);
  const [activeStatuses, setActiveStatuses] = useState<string[]>(statusOptions);
  const [replayCount, setReplayCount] = useState(0);

  useEffect(() => {
    if (statusOptions.length > 0) {
      setActiveStatuses(statusOptions);
    }
  }, [statusOptions.join(",")]);

  const filteredRecipients = useMemo(
    () =>
      recipientNodes.map((r) => {
        const isNonUSDC = showUSDCOnly && r.asset !== "USDC";
        const isStatusFiltered =
          statusOptions.length > 0 &&
          r.deliveryStatus &&
          !activeStatuses.includes(r.deliveryStatus);

        return {
          ...r,
          isFaded: isNonUSDC || isStatusFiltered,
        };
      }),
    [recipientNodes, showUSDCOnly, activeStatuses, statusOptions.length],
  );

  const toggleStatus = (status: string) => {
    setActiveStatuses((current) =>
      current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status],
    );
  };

  const replayAnimation = () => setReplayCount((count) => count + 1);

  const assetCount = recipientNodes.filter((r) => r.asset === "USDC").length;
  const visibleCount = filteredRecipients.length;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold tracking-widest text-white/60 uppercase">
            Capital Flow Map
          </span>
        </div>
        <AnimatePresence>
          {isExecuting && (
            <motion.span
              key="executing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Executing
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* SVG canvas */}
      <svg
        ref={svgRef}
        viewBox="0 0 780 300"
        className="w-full"
        aria-label="Capital flow map"
      >
        <defs>
          <filter id="beam-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Continent outlines */}
        {CONTINENT_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.8"
          />
        ))}

        {/* Beams — only animate during Execute phase */}
        {isExecuting && (
          <g key={`replay-${replayCount}`}>
            {filteredRecipients.map((r, i) => (
              <CapitalBeam
                key={`${r.address}-${replayCount}`}
                x1={SENDER.x}
                y1={SENDER.y}
                x2={r.region.x}
                y2={r.region.y}
                delay={i * 0.25}
                amount={r.amount}
                fade={Boolean(r.isFaded)}
              />
            ))}
          </g>
        )}

        {/* Static dim lines when not executing */}
        {!isExecuting &&
          filteredRecipients.map((r) => {
            const cx = (SENDER.x + r.region.x) / 2;
            const cy = Math.min(SENDER.y, r.region.y) - 60;
            return (
              <path
                key={r.address}
                d={`M ${SENDER.x} ${SENDER.y} Q ${cx} ${cy} ${r.region.x} ${r.region.y}`}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="0.8"
                strokeDasharray="3 4"
                opacity={r.isFaded ? 0.15 : 1}
              />
            );
          })}

        {/* Sender node */}
        <circle
          cx={SENDER.x}
          cy={SENDER.y}
          r={7}
          fill="#22d3ee"
          filter="url(#node-glow)"
        />
        <text
          x={SENDER.x}
          y={SENDER.y + 16}
          textAnchor="middle"
          fontSize="7"
          fill="rgba(34,211,238,0.8)"
          fontFamily="monospace"
        >
          {senderAddress ? `${senderAddress.slice(0, 6)}…` : "Sender"}
        </text>

        {/* Recipient nodes */}
        {filteredRecipients.map((r) => {
          const isBridge = Boolean(r.bridgeDestination);
          const nodeColor = isBridge
            ? chainColor(r.bridgeDestination!.chain)
            : isExecuting && !r.isFaded
            ? "#22d3ee"
            : "rgba(255,255,255,0.2)";
          return (
            <g key={r.address} opacity={r.isFaded ? 0.35 : 1}>
              <circle
                cx={r.region.x}
                cy={r.region.y}
                r={isBridge ? 5.5 : 4}
                fill={r.isFaded ? "rgba(34,211,238,0.25)" : nodeColor}
                filter={isExecuting && !r.isFaded ? "url(#node-glow)" : undefined}
                strokeWidth={isBridge ? 1.5 : 0}
                stroke={isBridge ? chainColor(r.bridgeDestination!.chain) : "none"}
              />
              {isBridge && (
                <text
                  x={r.region.x}
                  y={r.region.y - 9}
                  textAnchor="middle"
                  fontSize="7"
                  fill={chainColor(r.bridgeDestination!.chain)}
                  fontFamily="monospace"
                  opacity={r.isFaded ? 0.3 : 0.9}
                >
                  ⬡ {r.bridgeDestination!.chain}
                </text>
              )}
              <text
                x={r.region.x}
                y={r.region.y + 12}
                textAnchor="middle"
                fontSize="6.5"
                fill={r.isFaded ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)"}
                fontFamily="monospace"
              >
                {r.label ?? `${r.address.slice(0, 5)}…`}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute right-4 top-4 z-20 w-[220px] rounded-3xl border border-white/10 bg-[#06070f]/95 p-3 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Flow filter</p>
            <p className="text-sm font-semibold text-white">Interactive legend</p>
          </div>
          <button
            type="button"
            onClick={replayAnimation}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-white/80 hover:bg-white/10 transition"
          >
            Replay
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => setShowUSDCOnly((current) => !current)}
            className={`w-full rounded-2xl px-3 py-2 text-left text-sm font-medium transition ${showUSDCOnly ? "bg-cyan-500/15 text-cyan-200 border border-cyan-500/30" : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"}`}
          >
            USDC Only
          </button>

          {statusOptions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Delivery status</p>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((status) => {
                  const active = activeStatuses.includes(status);
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => toggleStatus(status)}
                      className={`rounded-2xl px-2.5 py-2 text-[11px] font-semibold transition ${active ? "bg-white/10 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
                    >
                      {STATUS_LABELS[status] ?? status}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-white/40">No delivery status metadata available.</p>
          )}
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] text-white/50">
          Showing {visibleCount} of {recipientNodes.length} flows
          {showUSDCOnly ? ` · USDC only (${assetCount})` : ""}
        </div>

        {/* Bridge destinations */}
        {recipientNodes.some((r) => r.bridgeDestination) && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Bridge Routes</p>
            {recipientNodes
              .filter((r) => r.bridgeDestination)
              .map((r) => (
                <BridgeBreadcrumb
                  key={r.address}
                  chain={r.bridgeDestination!.chain}
                  address={r.bridgeDestination!.address}
                />
              ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span className="text-[10px] text-white/30">Sender</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="text-[10px] text-white/30">Recipient</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "#8247e5" }} />
          <span className="text-[10px] text-white/30">Bridge</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-px w-4 bg-cyan-400/40" />
          <span className="text-[10px] text-white/30">Capital beam</span>
        </div>
        <span className="ml-auto text-[10px] text-white/20">
          {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
