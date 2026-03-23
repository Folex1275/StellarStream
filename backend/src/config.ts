/**
 * Configuration loader with validation
 */

import dotenv from "dotenv";
import { EventWatcherConfig } from "./types";

// Load environment variables
dotenv.config();

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
    networkPassphrase:
      process.env.STELLAR_NETWORK_PASSPHRASE !== undefined && process.env.STELLAR_NETWORK_PASSPHRASE !== ""
        ? process.env.STELLAR_NETWORK_PASSPHRASE
        : "Test SDF Network ; September 2015",
    contractId: process.env.CONTRACT_ID!,
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS !== undefined && process.env.POLL_INTERVAL_MS !== "" ? process.env.POLL_INTERVAL_MS : "5000", 10),
    maxRetries: parseInt(process.env.MAX_RETRIES !== undefined && process.env.MAX_RETRIES !== "" ? process.env.MAX_RETRIES : "3", 10),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS !== undefined && process.env.RETRY_DELAY_MS !== "" ? process.env.RETRY_DELAY_MS : "2000", 10),
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
