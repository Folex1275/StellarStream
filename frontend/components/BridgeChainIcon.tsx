// components/BridgeChainIcon.tsx
// Issue #1014 – X-Ray Interoperability Bridge Icons
// Displays the destination chain icon next to a Stellar bridge address.

"use client";

import React from "react";
import { detectBridgeChain, getChainMeta } from "@/lib/bridge-detector";

interface BridgeChainIconProps {
  /** Stellar recipient address */
  address: string;
  /** Optional asset code for hint-based detection */
  assetCode?: string;
  /** Icon size in px (default: 18) */
  size?: number;
  /** Show text label next to icon (default: false) */
  showLabel?: boolean;
}

export function BridgeChainIcon({
  address,
  assetCode,
  size = 18,
  showLabel = false,
}: BridgeChainIconProps) {
  const chainKey = detectBridgeChain(address, assetCode);
  if (!chainKey) return null;

  const meta = getChainMeta(chainKey);
  if (!meta) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 ml-1.5"
      title={`Bridging to ${meta.label}`}
      aria-label={`Destination chain: ${meta.label}`}
    >
      {/* Chain icon circle */}
      <span
        className="inline-flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: size,
          height: size,
          backgroundColor: meta.color,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={size * 0.6}
          height={size * 0.6}
          fill={meta.textColor}
          aria-hidden="true"
        >
          <path d={meta.svgPath} />
        </svg>
      </span>

      {/* Optional text label */}
      {showLabel && (
        <span
          className="text-[10px] font-bold tracking-wider"
          style={{ color: meta.color }}
        >
          {meta.shortLabel}
        </span>
      )}
    </span>
  );
}