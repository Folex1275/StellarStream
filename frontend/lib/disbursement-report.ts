export interface DisbursementReportRow {
  date: string;
  streamId: string;
  asset: string;
  recipient: string;
  amount: number;
  status: string;
  txHash: string;
}

export const DISBURSEMENT_REPORT_HEADERS = [
  "Date",
  "Stream ID",
  "Asset",
  "Recipient",
  "Amount",
  "Status",
  "Tx Hash",
] as const;

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildDisbursementReportCsv(rows: DisbursementReportRow[]): string {
  const lines = [DISBURSEMENT_REPORT_HEADERS.join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.date,
        row.streamId,
        row.asset,
        row.recipient,
        row.amount.toFixed(2),
        row.status,
        row.txHash,
      ]
        .map(escapeCsv)
        .join(","),
    );
  }

  return `${lines.join("\n")}\n`;
}

export function downloadDisbursementReportCsv(
  rows: DisbursementReportRow[],
  filename = `disbursement-report-${new Date().toISOString().slice(0, 10)}.csv`,
): void {
  const csv = buildDisbursementReportCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
