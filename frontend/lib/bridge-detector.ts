// lib/bridge-detector.ts
// Issue #1014 – X-Ray Interoperability Bridge Icons
// Detects if a Stellar recipient address is a known cross-chain bridge
// and returns the destination chain metadata for UI display.

export interface ChainMeta {
  label: string;
  shortLabel: string;
  color: string;       // background
  textColor: string;   // foreground
  svgPath: string;     // inline SVG path data
}

// ── Known bridge destination chains ──────────────────────────────────────────
export const CHAIN_META: Record<string, ChainMeta> = {
  ethereum: {
    label: "Ethereum",
    shortLabel: "ETH",
    color: "#627EEA",
    textColor: "#ffffff",
    svgPath:
      "M12 2L6 12.5 12 15.5 18 12.5 12 2zm0 13.5L6 14l6 8 6-8-6 1.5z",
  },
  solana: {
    label: "Solana",
    shortLabel: "SOL",
    color: "#9945FF",
    textColor: "#ffffff",
    svgPath:
      "M6 16h13l-2.5 3H4L6 16zm0-4.5h13l-2.5 3H4l2-3zM8.5 7h10.5l-2.5 3H6L8.5 7z",
  },
  polygon: {
    label: "Polygon",
    shortLabel: "POL",
    color: "#8247E5",
    textColor: "#ffffff",
    svgPath:
      "M14.5 7.5l-4 2.3v4.6l4 2.3 4-2.3v-4.6l-4-2.3zm-8 0L2.5 9.8v4.6l4 2.3 4-2.3V9.8l-4-2.3z",
  },
  bsc: {
    label: "BNB Chain",
    shortLabel: "BNB",
    color: "#F3BA2F",
    textColor: "#000000",
    svgPath:
      "M12 2l2.5 2.5L12 7 9.5 4.5 12 2zm5 5l2.5 2.5-2.5 2.5L14.5 9.5 17 7zM7 7l2.5 2.5L7 12 4.5 9.5 7 7zm5 5l2.5 2.5L12 17l-2.5-2.5L12 12zm5 5l-2.5-2.5L17 12l2.5 2.5L17 17zM7 17l-2.5-2.5L7 12l2.5 2.5L7 17zm5 3l-2.5-2.5L12 15l2.5 2.5L12 20z",
  },
  avalanche: {
    label: "Avalanche",
    shortLabel: "AVAX",
    color: "#E84142",
    textColor: "#ffffff",
    svgPath:
      "M12 3L2 20h6.5l3.5-6 3.5 6H22L12 3zm0 4l4 7h-3l-1-2-1 2H8l4-7z",
  },
};

// ── Known bridge addresses on Stellar ─────────────────────────────────────────
// These are the Stellar-side deposit addresses for cross-chain bridges.
// Add real Wormhole / Allbridge / Debridge addresses here as they become known.
const BRIDGE_ADDRESS_MAP: Record<string, string> = {
  // Wormhole Ethereum bridge deposit account (example – replace with real)
  // "GBVDML4R3U3WDEQNASIFTH5OKNFLFPZQRCWF5RVZD4R3BMNFXWVBF4S": "ethereum",

  // Allbridge Solana bridge (example – replace with real)
  // "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37": "solana",

  // For testing – uncomment these demo addresses:
  // "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN": "ethereum",
  // "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5": "solana",
};

// ── Asset code prefixes that hint at bridge origin ────────────────────────────
// e.g. "ETH" or "WETH" asset codes suggest an Ethereum bridge
const ASSET_CODE_HINTS: Record<string, string> = {
  ETH: "ethereum",
  WETH: "ethereum",
  WBTC: "ethereum",
  USDT: "ethereum",
  SOL: "solana",
  WSOL: "solana",
  MATIC: "polygon",
  POL: "polygon",
  BNB: "bsc",
  WBNB: "bsc",
  AVAX: "avalanche",
  WAVAX: "avalanche",
};

/**
 * Detect destination chain for a recipient address.
 * Returns the chain key (e.g. "ethereum") or null if not a bridge address.
 */
export function detectBridgeChain(
  address: string,
  assetCode?: string,
): string | null {
  // 1. Direct address lookup
  if (address && BRIDGE_ADDRESS_MAP[address]) {
    return BRIDGE_ADDRESS_MAP[address];
  }

  // 2. Asset code hint
  if (assetCode) {
    const upper = assetCode.toUpperCase();
    if (ASSET_CODE_HINTS[upper]) {
      return ASSET_CODE_HINTS[upper];
    }
  }

  return null;
}

/**
 * Get full chain metadata for a detected chain key.
 */
export function getChainMeta(chainKey: string): ChainMeta | null {
  return CHAIN_META[chainKey] ?? null;
}