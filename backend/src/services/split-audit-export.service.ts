import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

export interface AuditRecipientRow {
  recipientAddress: string;
  amount: string;
  status: string;
}

export interface SplitAuditData {
  txHash: string;
  senderAddress: string;
  asset: string;
  totalAmount: string;
  createdAt: Date;
  recipients: AuditRecipientRow[];
}

// ── Brand tokens (matches invoice-pdf.service.ts) ────────────────────────────
const BRAND_CYAN  = "#00f5ff";
const DARK_BG     = "#080814";
const TEXT_PRIMARY = "#e0e0ff";
const TEXT_MUTED  = "#7878a0";
const ROW_ALT     = "#0f0f28";

/**
 * Generates a PDF split-audit report for a single disbursement event.
 * Includes TX hash, timestamp, sender, asset, and a per-recipient table.
 */
export function generateSplitAuditPDF(data: SplitAuditData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const M = 50;

    // ── Background ────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, doc.page.height).fill(DARK_BG);

    // ── Top accent bar ────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 4).fill(BRAND_CYAN);

    // ── Header ────────────────────────────────────────────────────────────────
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(BRAND_CYAN)
      .text("StellarStream", M, 24);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(TEXT_PRIMARY)
      .text("SPLIT AUDIT REPORT", W - M - 180, 28, { width: 180, align: "right" });

    // ── Divider ───────────────────────────────────────────────────────────────
    const divY = 72;
    doc.moveTo(M, divY).lineTo(W - M, divY).strokeColor(BRAND_CYAN).lineWidth(0.5).stroke();

    // ── Metadata block ────────────────────────────────────────────────────────
    let y = divY + 14;

    const meta = (label: string, value: string, x: number, labelY: number) => {
      doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT_MUTED).text(label, x, labelY);
      doc.font("Helvetica").fontSize(9).fillColor(TEXT_PRIMARY).text(value, x, labelY + 12, { width: (W - M * 2) / 2 - 10 });
    };

    meta("SENDER", data.senderAddress, M, y);
    meta("ASSET", data.asset, W / 2, y);
    y += 38;

    meta("TIMESTAMP", data.createdAt.toISOString(), M, y);
    meta("TOTAL AMOUNT", data.totalAmount, W / 2, y);
    y += 38;

    doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT_MUTED).text("TX HASH", M, y);
    doc
      .font("Courier")
      .fontSize(7.5)
      .fillColor(TEXT_PRIMARY)
      .text(data.txHash, M, y + 12, { width: W - M * 2 });
    y += 30;

    // ── Divider ───────────────────────────────────────────────────────────────
    doc.moveTo(M, y).lineTo(W - M, y).strokeColor(TEXT_MUTED).opacity(0.2).lineWidth(0.3).stroke().opacity(1);
    y += 12;

    // ── Recipients table header ───────────────────────────────────────────────
    const colAddress = M;
    const colStatus  = M + 310;
    const colAmount  = W - M - 80;

    doc.rect(M, y, W - M * 2, 18).fill("#0a0a22");
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(TEXT_MUTED)
      .text("RECIPIENT ADDRESS", colAddress + 6, y + 5)
      .text("STATUS", colStatus + 6, y + 5)
      .text("AMOUNT", colAmount, y + 5, { width: 80, align: "right" });
    y += 18;

    // ── Recipient rows ────────────────────────────────────────────────────────
    for (let i = 0; i < data.recipients.length; i++) {
      const r = data.recipients[i];
      const rowH = 20;

      if (i % 2 === 1) doc.rect(M, y, W - M * 2, rowH).fill(ROW_ALT);

      doc.font("Courier").fontSize(7.5).fillColor(TEXT_PRIMARY)
        .text(r.recipientAddress, colAddress + 6, y + 6, { width: 300 });

      const statusColor = r.status === "SENT" ? "#00c853" : r.status === "FAILED" ? "#ff1744" : TEXT_MUTED;
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(statusColor)
        .text(r.status, colStatus + 6, y + 6, { width: 70 });

      doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND_CYAN)
        .text(`${r.amount} ${data.asset}`, colAmount, y + 6, { width: 80, align: "right" });

      y += rowH;
    }

    // ── Total row ─────────────────────────────────────────────────────────────
    y += 4;
    doc.moveTo(M, y).lineTo(W - M, y).strokeColor(BRAND_CYAN).opacity(0.4).lineWidth(0.4).stroke().opacity(1);
    y += 8;

    doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT_PRIMARY)
      .text("TOTAL", colAmount - 60, y, { width: 60, align: "right" });
    doc.font("Helvetica-Bold").fontSize(10).fillColor(BRAND_CYAN)
      .text(`${data.totalAmount} ${data.asset}`, colAmount, y, { width: 80, align: "right" });

    // ── Footer ────────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 30;
    doc.rect(0, footerY - 4, W, 4).fill(BRAND_CYAN);
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(TEXT_MUTED)
      .text(
        `Generated ${new Date().toISOString()} · StellarStream · Powered by Soroban`,
        M,
        footerY + 6,
        { width: W - M * 2, align: "center" },
      );

    doc.end();
  });
}

/**
 * Generates an XLSX split-audit workbook for a single disbursement event.
 * Sheet 1 — Summary: TX hash, sender, asset, timestamp, total amount.
 * Sheet 2 — Recipients: one row per recipient with address, amount, status.
 */
export async function generateSplitAuditXLSX(data: SplitAuditData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "StellarStream";
  wb.created = new Date();

  // ── Styles ────────────────────────────────────────────────────────────────
  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF080814" },
  };
  const headerFont: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: "FF00F5FF" },
    size: 11,
  };
  const labelFont: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: "FF7878A0" },
    size: 10,
  };
  const valueFont: Partial<ExcelJS.Font> = {
    color: { argb: "FFE0E0FF" },
    size: 10,
  };
  const darkBg: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF080814" },
  };
  const altBg: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F0F28" },
  };

  // ── Sheet 1: Summary ─────────────────────────────────────────────────────
  const summary = wb.addWorksheet("Summary");
  summary.columns = [
    { key: "label", width: 20 },
    { key: "value", width: 80 },
  ];

  const summaryRows: [string, string][] = [
    ["TX Hash",      data.txHash],
    ["Sender",       data.senderAddress],
    ["Asset",        data.asset],
    ["Total Amount", data.totalAmount],
    ["Timestamp",    data.createdAt.toISOString()],
    ["Recipients",   String(data.recipients.length)],
  ];

  summary.addRow(["Split Audit Report"]).font = headerFont;
  summary.addRow([]);

  for (const [label, value] of summaryRows) {
    const row = summary.addRow([label, value]);
    row.getCell(1).font = labelFont;
    row.getCell(1).fill = darkBg;
    row.getCell(2).font = valueFont;
    row.getCell(2).fill = darkBg;
  }

  // ── Sheet 2: Recipients ───────────────────────────────────────────────────
  const sheet = wb.addWorksheet("Recipients");
  sheet.columns = [
    { header: "Recipient Address", key: "address",  width: 60 },
    { header: "Amount",            key: "amount",   width: 25 },
    { header: "Asset",             key: "asset",    width: 15 },
    { header: "Status",            key: "status",   width: 12 },
  ];

  // Style the header row
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = headerFont;
    cell.fill = headerFill;
  });
  headerRow.commit();

  // Add recipient rows
  data.recipients.forEach((r, i) => {
    const row = sheet.addRow({
      address: r.recipientAddress,
      amount:  r.amount,
      asset:   data.asset,
      status:  r.status,
    });

    const bg = i % 2 === 0 ? darkBg : altBg;
    row.eachCell((cell) => {
      cell.font = valueFont;
      cell.fill = bg;
    });

    // Color-code status
    const statusCell = row.getCell("status");
    if (r.status === "SENT") {
      statusCell.font = { ...valueFont, color: { argb: "FF00C853" } };
    } else if (r.status === "FAILED") {
      statusCell.font = { ...valueFont, color: { argb: "FFFF1744" } };
    }

    row.commit();
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
