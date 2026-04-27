"use client";

import { isTestnetLike } from "@/lib/network";

function readFlag(value: string | undefined, fallback = false): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export const featureFlags = {
  splitterV3: readFlag(process.env.NEXT_PUBLIC_ENABLE_SPLITTER_V3, false),
  splitterV3TestnetOnly: readFlag(process.env.NEXT_PUBLIC_ENABLE_SPLITTER_V3_TESTNET_ONLY, true),
};

export function isSplitterV3EnabledForNetwork(network: string | null | undefined): boolean {
  if (!featureFlags.splitterV3) {
    return false;
  }

  if (!featureFlags.splitterV3TestnetOnly) {
    return true;
  }

  return isTestnetLike(network);
}
