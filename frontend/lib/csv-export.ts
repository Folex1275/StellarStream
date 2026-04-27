// lib/csv-export.ts
// Issue #691 — CSV Export for Tax Compliance

import type { Recipient } from "./bulk-splitter/types";

export interface DisbursementRecord {
  /** Unique identifier for the transaction */
  transactionId: string;
  /** Timestamp of the transaction in ISO 8601 format */
  timestamp: string;
  /** Stellar address of the recipient */
  recipient: string;
  /** Amount transferred (in stroops or raw units) */
  amount: number;
  /** Asset code (e.g., XLM, USDC) */
  asset: string;
  /** Decimal places for the asset */
  assetDecimals: number;
  /** Transaction hash on Stellar network */
  txHash: string;
  /** Stream ID if this is part of a streaming payment */
  streamId?: string;
  /** Status of the transaction */
  status: "success" | "pending" | "failed";
  /** Optional memo/note attached to the transaction */
  memo?: string;
}

export interface TaxCsvOptions {
  /** Whether to include the header row */
  includeHeader?: boolean;
  /** Date format for timestamps */
  dateFormat?: "ISO" | "US" | "EU";
  /** Whether to format amounts with decimals */
  formatAmounts?: boolean;
  /** Custom filename prefix */
  filenamePrefix?: string;
}

// Standard accounting headers for tax compliance
const TAX_HEADERS = [
  "Date",
  "Time",
  "Transaction_ID",
  "Recipient_Address",
  "Amount",
  "Asset",
  "Asset_Decimals",
  "Transaction_Hash",
  "Stream_ID",
  "Status",
  "Memo",
] as const;

/**
 * Format a timestamp according to options
 */
function formatTimestamp(timestamp: string, format: TaxCsvOptions["dateFormat"] = "ISO"): string {
  const date = new Date(timestamp);
  
  if (format === "ISO") {
    return date.toISOString();
  }
  
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  if (format === "US") {
    // MM/DD/YYYY HH:MM:SS
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  }
  
  // EU format: DD/MM/YYYY HH:MM:SS
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Format amount based on asset decimals
 */
function formatAmount(amount: number, decimals: number, format: boolean): string {
  if (!format) {
    return String(amount);
  }
  
  const divisor = Math.pow(10, decimals);
  const formatted = amount / divisor;
  
  // Format with appropriate decimal places
  return formatted.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

/**
 * Escape a value for CSV (handle quotes, commas, newlines)
 */
function escapeCsvValue(value: string | undefined): string {
  if (value === undefined || value === null) {
    return "";
  }
  
  const stringValue = String(value);
  
  // If the value contains special characters, wrap in quotes and escape internal quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Convert a single disbursement record to a CSV row
 */
function recordToCsvRow(
  record: DisbursementRecord,
  options: TaxCsvOptions
): string {
  const { dateFormat = "ISO", formatAmounts = true } = options;
  
  const dateTime = formatTimestamp(record.timestamp, dateFormat);
  const [date, time] = dateTime.split("T");
  const formattedDate = dateFormat === "ISO" ? date : dateTime.split(" ")[0];
  const formattedTime = dateFormat === "ISO" ? dateTime.split("T")[1]?.replace(".", ":") || "" : dateTime.split(" ")[1] || "";
  
  const values = [
    formattedDate,
    formattedTime,
    escapeCsvValue(record.transactionId),
    escapeCsvValue(record.recipient),
    formatAmount(record.amount, record.assetDecimals, formatAmounts),
    escapeCsvValue(record.asset),
    String(record.assetDecimals),
    escapeCsvValue(record.txHash),
    escapeCsvValue(record.streamId),
    record.status,
    escapeCsvValue(record.memo),
  ];
  
  return values.join(",");
}

/**
 * Convert disbursement records to CSV format
 */
export function toTaxCsv(
  records: DisbursementRecord[],
  options: TaxCsvOptions = {}
): string {
  const { includeHeader = true } = options;
  
  const lines: string[] = [];
  
  // Add header row
  if (includeHeader) {
    lines.push(TAX_HEADERS.join(","));
  }
  
  // Add data rows
  for (const record of records) {
    lines.push(recordToCsvRow(record, options));
  }
  
  return lines.join("\n");
}

/**
 * Download disbursement data as a CSV file
 */
export function downloadTaxCsv(
  records: DisbursementRecord[],
  options: TaxCsvOptions = {}
): void {
  const { filenamePrefix = "disbursement" } = options;
  
  const csv = toTaxCsv(records, options);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${timestamp}.csv`;
  
  // Create download link
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = "none";
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(link.href);
}

/**
 * Create DisbursementRecord from Recipient data and transaction metadata
 */
export function createDisbursementRecord(
  recipient: Recipient,
  metadata: {
    transactionId: string;
    timestamp: string;
    asset: string;
    assetDecimals: number;
    txHash: string;
    streamId?: string;
    status: "success" | "pending" | "failed";
    memo?: string;
  }
): DisbursementRecord {
  return {
    transactionId: metadata.transactionId,
    timestamp: metadata.timestamp,
    recipient: recipient.address,
    amount: Number(recipient.amount),
    asset: metadata.asset,
    assetDecimals: metadata.assetDecimals,
    txHash: metadata.txHash,
    streamId: metadata.streamId,
    status: metadata.status,
    memo: metadata.memo,
  };
}

/**
 * Convert BigInt amount to number (for CSV output)
 */
export function bigintToNumber(amount: bigint, decimals: number = 7): number {
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  // Combine whole and fractional parts as a floating-point number
  return Number(wholePart) + Number(fractionalPart) / Number(divisor);
}
