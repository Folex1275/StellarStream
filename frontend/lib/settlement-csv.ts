export interface SettlementCsvRecipient {
  address?: string;
  payee?: string;
  amount?: number | string;
  memo?: string;
  operationId?: string;
}

export interface SettlementCsvInput {
  txHash: string;
  sender: string;
  asset: string;
  totalAmount: number | string;
  timestamp?: string;
  streamId?: string;
  memo?: string;
  currency?: string;
  fallbackRecipientCount?: number;
  recipients?: SettlementCsvRecipient[];
}

const SETTLEMENT_HEADERS = [
  "Date",
  "Amount",
  "Payee",
  "Description",
  "Reference",
  "Currency",
  "Debit",
  "Credit",
  "Tx_Hash",
  "Operation_ID",
  "Stream_ID",
  "Sender_Address",
  "Recipient_Address",
  "Asset",
  "Memo",
  "Status",
] as const;

function escapeCsvValue(value: string | number | undefined): string {
  if (value === undefined || value === null) {
    return "";
  }

  const stringValue = String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function parseAmount(value: number | string): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: number): string {
  const normalized = Object.is(value, -0) ? 0 : value;
  return normalized
    .toFixed(7)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}

function toDateValue(timestamp: string): string {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}

function expandRecipients(input: SettlementCsvInput): SettlementCsvRecipient[] {
  const provided = input.recipients?.filter(Boolean) ?? [];
  if (provided.length > 0) {
    return provided;
  }

  const fallbackCount = Math.max(1, input.fallbackRecipientCount ?? 1);
  const totalAmount = parseAmount(input.totalAmount);
  const perRecipient =
    fallbackCount > 0 ? totalAmount / fallbackCount : totalAmount;

  return Array.from({ length: fallbackCount }, (_, index) => ({
    payee: `Recipient ${index + 1}`,
    amount: perRecipient,
    operationId: `${input.txHash.slice(0, 16)}-op${index}`,
  }));
}

export function buildSettlementCsv(input: SettlementCsvInput): string {
  const rows: string[] = [SETTLEMENT_HEADERS.join(",")];
  const date = toDateValue(input.timestamp ?? new Date().toISOString());
  const recipients = expandRecipients(input);
  const reference = `SETTLEMENT-${input.txHash.slice(0, 12)}`;
  const description = `StellarStream split settlement (${input.asset})`;
  const currency = input.currency ?? input.asset;

  recipients.forEach((recipient, index) => {
    const absoluteAmount = Math.abs(parseAmount(recipient.amount ?? 0));
    const amount = -absoluteAmount;
    const operationId =
      recipient.operationId ?? `${input.txHash.slice(0, 16)}-op${index}`;

    const values = [
      date,
      formatAmount(amount),
      escapeCsvValue(recipient.payee ?? `Recipient ${index + 1}`),
      escapeCsvValue(description),
      reference,
      escapeCsvValue(currency),
      formatAmount(absoluteAmount),
      "0",
      input.txHash,
      escapeCsvValue(operationId),
      escapeCsvValue(input.streamId),
      escapeCsvValue(input.sender),
      escapeCsvValue(recipient.address),
      escapeCsvValue(input.asset),
      escapeCsvValue(recipient.memo ?? input.memo),
      "Settled",
    ];

    rows.push(values.join(","));
  });

  return `${rows.join("\n")}\n`;
}

export function downloadSettlementCsv(input: SettlementCsvInput): void {
  const csv = buildSettlementCsv(input);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const filenameDate = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `settlement_${filenameDate}.csv`);
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
