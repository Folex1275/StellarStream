import { jsPDF } from "jspdf";
import type { DisbursementReportRow } from "@/lib/disbursement-report";

export interface DisbursementReportPDFProps {
  title: string;
  generatedAt: string;
  startDate: string;
  endDate: string;
  assetFilter: string;
  statusFilter: string;
  rows: DisbursementReportRow[];
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function truncateText(value: string, maxLength = 24): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export async function generateDisbursementReportPDF(props: DisbursementReportPDFProps): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFillColor(7, 11, 23);
  doc.rect(0, 0, 210, 297, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(props.title, 20, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated: ${props.generatedAt}`, 20, 36);
  doc.text(`Range: ${props.startDate} → ${props.endDate}`, 20, 42);
  doc.text(`Asset: ${props.assetFilter}`, 20, 48);
  doc.text(`Status: ${props.statusFilter}`, 20, 54);

  const rowCount = Math.min(props.rows.length, 10);
  const tableStartY = 66;
  const rowHeight = 8;
  const headerY = tableStartY;
  const columns = [
    { label: "Date", width: 30 },
    { label: "Stream", width: 40 },
    { label: "Asset", width: 20 },
    { label: "Recipient", width: 55 },
    { label: "Amount", width: 25 },
    { label: "Status", width: 25 },
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  let cursorX = 20;

  for (const column of columns) {
    doc.text(column.label, cursorX, headerY);
    cursorX += column.width;
  }

  doc.setLineWidth(0.2);
  doc.setDrawColor(255, 255, 255);
  doc.line(20, headerY + 2, 190, headerY + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  for (let index = 0; index < rowCount; index += 1) {
    const row = props.rows[index];
    const y = headerY + 6 + index * rowHeight;
    let x = 20;

    doc.text(truncateText(row.date, 12), x, y);
    x += columns[0].width;
    doc.text(truncateText(row.streamId, 18), x, y);
    x += columns[1].width;
    doc.text(row.asset, x, y);
    x += columns[2].width;
    doc.text(truncateText(row.recipient, 22), x, y);
    x += columns[3].width;
    doc.text(formatAmount(row.amount), x, y, { align: "right" });
    x += columns[4].width;
    doc.text(truncateText(row.status, 16), x, y);
  }

  const summaryY = tableStartY + rowCount * rowHeight + 14;
  doc.setFont("helvetica", "bold");
  doc.text("Total rows included:", 20, summaryY);
  doc.setFont("helvetica", "normal");
  doc.text(`${props.rows.length}`, 64, summaryY);

  doc.text("Displayed preview:", 97, summaryY);
  doc.text(`${rowCount} rows`, 128, summaryY);

  const totalAmount = props.rows.reduce((acc, row) => acc + row.amount, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Total amount:", 20, summaryY + 8);
  doc.setFont("helvetica", "normal");
  doc.text(`$${formatAmount(totalAmount)}`, 52, summaryY + 8);

  const filename = `disbursement-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
