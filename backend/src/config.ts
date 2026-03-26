/**
 * Configuration loader with validation
 */

import { config as loadEnv } from "dotenv";
import { EventWatcherConfig } from "./types";

// Load environment variables
loadEnv();

/**
 * Validates required environment variables
 */
function validateEnv(): void {
  const required = ["STELLAR_RPC_URL", "CONTRACT_ID"];
  const missing = required.filter((key) => process.env[key] === undefined || process.env[key] === "");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
      "Please copy .env.example to .env and configure it."
    );
  }

  // Validate CONTRACT_ID format (should be 56 character hex string starting with C)
  const contractId = process.env.CONTRACT_ID!;
  if (!/^C[A-Z0-9]{55}$/.test(contractId)) {
    console.warn(
      `Warning: CONTRACT_ID format looks unusual: ${contractId}\n` +
      "Expected format: C followed by 55 alphanumeric characters"
    );
  }
}

/**
 * Load and validate configuration
 */
export function loadConfig(): EventWatcherConfig {
  validateEnv();

  return {
    rpcUrl: process.env.STELLAR_RPC_URL!,
    horizonUrl:
      process.env.STELLAR_HORIZON_URL ??
      "https://horizon-testnet.stellar.org",
    networkPassphrase:
      process.env.STELLAR_NETWORK_PASSPHRASE ??
      "Test SDF Network ; September 2015",
    contractId: process.env.CONTRACT_ID!,
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS ?? "5000", 10),
    maxRetries: parseInt(process.env.MAX_RETRIES ?? "3", 10),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS ?? "2000", 10),
  };
}

/**
 * Get configuration singleton
 */
let cachedConfig: EventWatcherConfig | null = null;

export function getConfig(): EventWatcherConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

/** Singleton config object for direct import as `{ config }`. */
export const config = {
  get rpcUrl() { return process.env.STELLAR_RPC_URL ?? ""; },
  get horizonUrl() { return process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org"; },
  get networkPassphrase() { return process.env.STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015"; },
  get contractId() { return process.env.CONTRACT_ID ?? ""; },
  get contractAddress() { return process.env.CONTRACT_ID ?? ""; },
  get sorobanRpcUrl() { return process.env.STELLAR_RPC_URL ?? ""; },
  get pollIntervalMs() { return parseInt(process.env.POLL_INTERVAL_MS ?? "5000", 10); },
  get maxRetries() { return parseInt(process.env.MAX_RETRIES ?? "3", 10); },
  get retryDelayMs() { return parseInt(process.env.RETRY_DELAY_MS ?? "2000", 10); },
  get apiPort() { return parseInt(process.env.PORT ?? "3001", 10); },
  get defaultPageSize() { return parseInt(process.env.DEFAULT_PAGE_SIZE ?? "20", 10); },
  get maxPageSize() { return parseInt(process.env.MAX_PAGE_SIZE ?? "100", 10); },
  get discordWebhookUrl() { return process.env.DISCORD_WEBHOOK_URL ?? ""; },
  get megaStreamThreshold() { return BigInt(process.env.MEGA_STREAM_THRESHOLD ?? "1000000000000"); },
  get minValueUsd() { return parseFloat(process.env.MIN_VALUE_USD ?? "0.10"); },
  get redisUrl() { return process.env.REDIS_URL ?? "redis://localhost:6379"; },
};
