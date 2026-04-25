import { Router, Request, Response } from "express";
import { z } from "zod";
import asyncHandler from "../../utils/asyncHandler.js";
import { generateInvoicePDF } from "../../services/invoice-pdf.service.js";

const router = Router();

const recipientSchema = z.object({
  address: z.string().min(1),
  amount: z.string().min(1),
  label: z.string().optional(),
});

const bodySchema = z.object({
  orgName: z.string().min(1),
  logoBase64: z.string().optional(),
  invoiceNumber: z.string().min(1),
  issuedAt: z.string().min(1),
  asset: z.string().min(1),
  sender: z.string().min(1),
  recipients: z.array(recipientSchema).min(1),
  totalAmount: z.string().min(1),
  txHash: z.string().optional(),
  note: z.string().optional(),
});

/**
 * POST /api/v3/reports/invoice
 *
 * Generates a professional invoice-style PDF report for a disbursement.
 *
 * Body: InvoiceReportData (JSON)
 * Response: application/pdf binary stream
 */
router.post(
  "/reports/invoice",
  asyncHandler(async (req: Request, res: Response) => {
    const data = bodySchema.parse(req.body);
    const pdf = await generateInvoicePDF(data);

    const filename = `invoice-${data.invoiceNumber}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdf.length);
    res.send(pdf);
  }),
);

export default router;
