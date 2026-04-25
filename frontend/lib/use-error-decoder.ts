"use client";

import { useMemo } from "react";

export interface DecodedError {
  raw: string | number;
  title: string;
  description: string;
  severity: "fatal" | "error" | "warning";
  docsUrl?: string;
}

const CONTRACT_ERROR_MAP: Record<number, Omit<DecodedError, "raw">> = {
  1: { title: "Unauthorized", description: "The caller does not have permission to perform this action.", severity: "fatal" },
  2: { title: "Stream Not Found", description: "No stream exists with the provided ID on this contract.", severity: "error", docsUrl: "https://docs.stellarstream.io/errors/stream-not-found" },
  3: { title: "Stream Already Exists", description: "A stream with this ID has already been created.", severity: "error" },
  4: { title: "Stream Not Active", description: "The stream is not in an active state. It may be paused, cancelled, or completed.", severity: "error" },
  5: { title: "Insufficient Balance", description: "The sender's balance is too low to fund this stream or withdrawal.", severity: "error", docsUrl: "https://docs.stellarstream.io/errors/insufficient-balance" },
  6: { title: "Invalid Amount", description: "The specified amount is zero, negative, or exceeds the allowed maximum.", severity: "error" },
  7: { title: "Invalid Duration", description: "The stream duration is outside the permitted range (min 60s, max 10 years).", severity: "error" },
  8: { title: "Invalid Recipient", description: "The recipient address is malformed or is the same as the sender.", severity: "error" },
  9: { title: "Protocol Paused", description: "The protocol is currently in Emergency Mode. No new operations are permitted.", severity: "fatal", docsUrl: "https://docs.stellarstream.io/errors/emergency-mode" },
  10: { title: "Migration Paused", description: "The V1→V2 migration pipeline is temporarily halted.", severity: "warning" },
  11: { title: "Overflow", description: "An arithmetic overflow occurred during rate or balance calculation.", severity: "fatal" },
  12: { title: "Nothing to Withdraw", description: "No streamed funds are available to withdraw at this time.", severity: "warning" },
  13: { title: "Vault Locked", description: "The vault is locked and cannot accept deposits or withdrawals right now.", severity: "error" },
  14: { title: "Deadline Exceeded", description: "The transaction deadline passed before it could be included in a ledger.", severity: "error" },
  403: { title: "Forbidden", description: "You are not authorised to access or modify this resource.", severity: "fatal" },
  404: { title: "Stream Not Found", description: "No stream exists with the provided ID on this contract.", severity: "error", docsUrl: "https://docs.stellarstream.io/errors/stream-not-found" },
  429: { title: "Rate Limited", description: "Too many requests. Please wait before retrying.", severity: "warning" },
  500: { title: "Internal Contract Error", description: "An unexpected error occurred inside the contract. Please report this.", severity: "fatal" },
};

const STRING_ERROR_MAP: Record<string, Omit<DecodedError, "raw">> = {
  ERR_INVALID_ADDRESS_FORMAT: { title: "Invalid Address Format", description: "The Stellar address provided is not correctly formatted.", severity: "error" },
  INVALID_ADDRESS: { title: "Invalid Stellar Address", description: "The address is not a valid Stellar public key.", severity: "error" },
  INVALID_SIGNATURE: { title: "Invalid Signature", description: "The wallet signature could not be verified. Please try signing again.", severity: "fatal" },
  INVALID_NONCE: { title: "Expired Nonce", description: "The authentication nonce has expired. Please reconnect your wallet.", severity: "error" },
  MISSING_WALLET_AUTH: { title: "Wallet Auth Missing", description: "No wallet authentication was provided with this request.", severity: "error" },
  ERR_INTERNAL_SERVER_ERROR: { title: "Internal Server Error", description: "An unexpected server-side error occurred. Please try again later.", severity: "fatal" },
  ERR_TOO_MANY_REQUESTS: { title: "Rate Limited", description: "You have sent too many requests. Please wait a moment before retrying.", severity: "warning" },
  ERR_NOT_IMPLEMENTED: { title: "Not Implemented", description: "This feature is not yet available on the current network.", severity: "warning" },
  USER_REJECTED: { title: "Transaction Rejected", description: "You declined the transaction in your wallet.", severity: "warning" },
  NETWORK_ERROR: { title: "Network Error", description: "Could not reach the Soroban RPC endpoint. Check your connection.", severity: "error" },
  INSUFFICIENT_GAS: { title: "Insufficient XLM for Fees", description: "Your account does not have enough XLM to cover the transaction fee.", severity: "error", docsUrl: "https://docs.stellarstream.io/errors/insufficient-gas" },
};

const FALLBACK_DECODED: Omit<DecodedError, "raw"> = {
  title: "Unknown Error",
  description: "An unrecognised error was returned by the contract. Copy the details below and contact support.",
  severity: "fatal",
};

function extractCodeFromXdr(xdrOrMessage: string): string | number {
  const contractMatch = xdrOrMessage.match(/Error\s*\(\s*Contract\s*,\s*#(\d+)\s*\)/i);
  if (contractMatch) return parseInt(contractMatch[1], 10);

  const trimmed = xdrOrMessage.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);

  for (const key of Object.keys(STRING_ERROR_MAP)) {
    if (xdrOrMessage.includes(key)) return key;
  }

  return xdrOrMessage;
}

export interface UseErrorDecoderResult {
  decode: (raw: unknown) => DecodedError;
}

export function useErrorDecoder(): UseErrorDecoderResult {
  const decode = useMemo(
    () =>
      (raw: unknown): DecodedError => {
        let rawValue: string | number;

        if (raw instanceof Error) rawValue = raw.message;
        else if (typeof raw === "number") rawValue = raw;
        else if (typeof raw === "string") rawValue = raw;
        else rawValue = String(raw);

        const code = typeof rawValue === "number" ? rawValue : extractCodeFromXdr(String(rawValue));

        if (typeof code === "number") {
          const entry = CONTRACT_ERROR_MAP[code];
          if (entry) return { raw: rawValue, ...entry };
        } else {
          const entry = STRING_ERROR_MAP[code];
          if (entry) return { raw: rawValue, ...entry };
        }

        return { raw: rawValue, ...FALLBACK_DECODED };
      },
    []
  );

  return { decode };
}
