"use client";

export type SupportedNetwork = "testnet" | "mainnet" | "futurenet" | "unknown";

export function normalizeNetworkName(network: string | null | undefined): SupportedNetwork {
  const value = network?.trim().toLowerCase();

  if (!value) {
    return "unknown";
  }

  if (value.includes("testnet") || value === "test") {
    return "testnet";
  }

  if (value.includes("public") || value.includes("mainnet") || value === "main") {
    return "mainnet";
  }

  if (value.includes("future")) {
    return "futurenet";
  }

  return "unknown";
}

export function isTestnetLike(network: string | null | undefined): boolean {
  const normalized = normalizeNetworkName(network);
  return normalized === "testnet" || normalized === "futurenet";
}
