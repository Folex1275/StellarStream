import PDFDocument from "pdfkit";

export interface InvoiceRecipient {
  address: string;
  amount: string;
  label?: string;
}

export interface InvoiceReportData {
  /** Organization name shown in the header */
  orgName: string;
  /** Base64-encoded PNG/JPEG logo, or undefined to use text fallback */
  logoBase64?: string;
  invoiceNumber: string;
  issuedAt: string;
  asset: string;
  sender: string;
  recipients: InvoiceRecipient[];
  totalAmount: string;
  txHash?: string;
  note?: string;
}

const BRAND_CYAN = "#00f5ff";
const DARK_BG = "#080814";
const TEXT_PRIMARY = "#e0e0ff";
const TEXT_MUTED = "#7878a0";
const ROW_ALT = "#0f0f28";

export function generateInvoicePDF(data: InvoiceReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

  const W = doc.page.width;   // 595
  const M = 50;               // margin

  // ── Background ──────────────────────────────────────────────────────────────
  doc.rect(0, 0, W, doc.page.height).fill(DARK_BG);

  // ── Top accent bar ──────────────────────────────────────────────────────────
  doc.rect(0, 0, W, 4).fill(BRAND_CYAN);

  // ── Logo / Org name ─────────────────────────────────────────────────────────
  let headerY = 24;
  if (data.logoBase64) {
    const imgBuf = Buffer.from(data.logoBase64, "base64");
    doc.image(imgBuf, M, headerY, { height: 40, fit: [120, 40] });
  } else {
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(BRAND_CYAN)
      .text(data.orgName, M, headerY + 8);
  }

  // ── Invoice label (top-right) ────────────────────────────────────────────────
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(TEXT_PRIMARY)
    .text("INVOICE", W - M - 120, headerY + 4, { width: 120, align: "right" });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(TEXT_MUTED)
    .text(`#${data.invoiceNumber}`, W - M - 120, headerY + 30, { width: 120, align: "right" })
    .text(`Issued: ${data.issuedAt}`, W - M - 120, headerY + 42, { width: 120, align: "right" });

  // ── Divider ──────────────────────────────────────────────────────────────────
  const divY = 80;
  doc.moveTo(M, divY).lineTo(W - M, divY).strokeColor(BRAND_CYAN).lineWidth(0.5).stroke();

  // ── From / Asset meta ────────────────────────────────────────────────────────
  let y = divY + 14;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT_MUTED).text("FROM", M, y);
  doc.font("Helvetica").fontSize(9).fillColor(TEXT_PRIMARY).text(data.sender, M, y + 12, { width: 260 });

  doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT_MUTED).text("ASSET", W / 2, y);
  doc.font("Helvetica").fontSize(9).fillColor(TEXT_PRIMARY).text(data.asset, W / 2, y + 12);

  y += 44;
  doc.moveTo(M, y).lineTo(W - M, y).strokeColor(TEXT_MUTED).opacity(0.2).lineWidth(0.3).stroke().opacity(1);

  // ── Recipients table header ──────────────────────────────────────────────────
  y += 12;
  const colAddress = M;
  const colLabel   = M + 240;
  const colAmount  = W - M - 80;

  doc.rect(M, y, W - M * 2, 18).fill("#0a0a22");
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(TEXT_MUTED)
    .text("RECIPIENT ADDRESS", colAddress + 6, y + 5)
    .text("LABEL", colLabel + 6, y + 5)
    .text("AMOUNT", colAmount, y + 5, { width: 80, align: "right" });

  y += 18;

  // ── Recipient rows ───────────────────────────────────────────────────────────
  data.recipients.forEach((r, i) => {
    const rowH = 20;
    if (i % 2 === 1) doc.rect(M, y, W - M * 2, rowH).fill(ROW_ALT);

    doc
      .font("Courier")
      .fontSize(7.5)
      .fillColor(TEXT_PRIMARY)
      .text(r.address, colAddress + 6, y + 6, { width: 230 });

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(TEXT_MUTED)
      .text(r.label ?? "—", colLabel + 6, y + 6, { width: 80 });

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(BRAND_CYAN)
      .text(`${r.amount} ${data.asset}`, colAmount, y + 6, { width: 80, align: "right" });

    y += rowH;
  });

  // ── Total row ────────────────────────────────────────────────────────────────
  y += 4;
  doc.moveTo(M, y).lineTo(W - M, y).strokeColor(BRAND_CYAN).opacity(0.4).lineWidth(0.4).stroke().opacity(1);
  y += 8;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(TEXT_PRIMARY)
    .text("TOTAL", colAmount - 60, y, { width: 60, align: "right" });

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(BRAND_CYAN)
    .text(`${data.totalAmount} ${data.asset}`, colAmount, y, { width: 80, align: "right" });

  // ── Tx hash ──────────────────────────────────────────────────────────────────
  if (data.txHash) {
    y += 28;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT_MUTED).text("TX HASH", M, y);
    doc.font("Courier").fontSize(7.5).fillColor(TEXT_PRIMARY).text(data.txHash, M, y + 12, { width: W - M * 2 });
    y += 24;
  }

  // ── Note ─────────────────────────────────────────────────────────────────────
  if (data.note) {
    y += 10;
    doc.font("Helvetica").fontSize(8).fillColor(TEXT_MUTED).text(data.note, M, y, { width: W - M * 2 });
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
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
  }); // end Promise
}
