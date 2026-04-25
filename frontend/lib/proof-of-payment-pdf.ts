// lib/proof-of-payment-pdf.ts
// Issues #776 / #777 — Proof-of-Payment PDF with Nebula-V3-Verified watermark

import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export interface ProofOfPaymentData {
  txHash: string;
  streamId: string;
  sender: string;
  receiver: string;
  asset: string;
  amount: string;
  timestamp: string;
  /** Stellar Expert or Horizon ledger URL */
  ledgerUrl?: string;
}

const STELLAR_EXPERT_BASE = "https://stellar.expert/explorer/public/tx/";

export async function generateProofOfPaymentPDF(data: ProofOfPaymentData): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const ledgerUrl = data.ledgerUrl ?? `${STELLAR_EXPERT_BASE}${data.txHash}`;

  // ── Background ──────────────────────────────────────────────────────────────
  doc.setFillColor(8, 8, 20);
  doc.rect(0, 0, 210, 297, "F");

  // ── Nebula-V3-Verified watermark (diagonal, centred) ────────────────────────
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(0, 245, 255);
  doc.text("NEBULA-V3-VERIFIED", 105, 148, {
    align: "center",
    angle: 45,
  });
  doc.restoreGraphicsState();

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(0, 245, 255);
  doc.rect(0, 0, 210, 2, "F");

  // ── Title ───────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 245, 255);
  doc.text("StellarStream", 20, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(160, 160, 200);
  doc.text("Proof of Payment", 20, 30);

  // ── Verified badge ──────────────────────────────────────────────────────────
  doc.setFillColor(0, 245, 255, 0.12);
  doc.roundedRect(148, 14, 46, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(0, 245, 255);
  doc.text("✦ NEBULA-V3-VERIFIED", 171, 20.5, { align: "center" });

  // ── Divider ─────────────────────────────────────────────────────────────────
  doc.setDrawColor(0, 245, 255, 0.2);
  doc.setLineWidth(0.3);
  doc.line(20, 36, 190, 36);

  // ── Payment details ─────────────────────────────────────────────────────────
  const fields: [string, string][] = [
    ["Stream ID",  data.streamId],
    ["Sender",     data.sender],
    ["Receiver",   data.receiver],
    ["Asset",      data.asset],
    ["Amount",     data.amount],
    ["Timestamp",  data.timestamp],
    ["Tx Hash",    data.txHash],
  ];

  let y = 48;
  doc.setFontSize(9);
  for (const [label, value] of fields) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 120, 160);
    doc.text(label.toUpperCase(), 20, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 220, 255);
    // Wrap long values (e.g. tx hash)
    const lines = doc.splitTextToSize(value, 120);
    doc.text(lines, 70, y);
    y += lines.length > 1 ? lines.length * 6 + 2 : 10;
  }

  // ── QR Code ─────────────────────────────────────────────────────────────────
  const qrDataUrl = await QRCode.toDataURL(ledgerUrl, {
    width: 200,
    margin: 1,
    color: { dark: "#00f5ff", light: "#080814" },
  });

  doc.addImage(qrDataUrl, "PNG", 148, 42, 42, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 140);
  doc.text("Scan to verify on ledger", 169, 88, { align: "center" });

  // ── Footer ──────────────────────────────────────────────────────────────────
  doc.setFillColor(0, 245, 255);
  doc.rect(0, 295, 210, 2, "F");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 120);
  doc.text(
    `Generated ${new Date().toISOString()} · StellarStream Nebula V3`,
    105,
    291,
    { align: "center" },
  );

  doc.save(`proof-of-payment-${data.txHash.slice(0, 10)}.pdf`);
}
