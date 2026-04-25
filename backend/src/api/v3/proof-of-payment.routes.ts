import { Router, Request, Response } from "express";
import { z } from "zod";
import { ProofOfPaymentPDFService } from "../../services/proof-of-payment-pdf.service.js";
import { prisma } from "../../lib/db.js";
import validateRequest from "../../middleware/validateRequest.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { logger } from "../../logger.js";

const router = Router();
const pdfService = new ProofOfPaymentPDFService();

const generatePDFSchema = z.object({
  splitId: z.string().min(1, "splitId is required"),
});

/**
 * GET /api/v3/splits/:splitId/proof-of-payment
 *
 * Generates a cryptographically verifiable PDF receipt for a completed split.
 * Returns the PDF as a stream with appropriate headers.
 */
router.get(
  "/splits/:splitId/proof-of-payment",
  validateRequest({ params: generatePDFSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { splitId } = req.params;

    // Fetch split details from database
    const split = await prisma.stream.findUnique({
      where: { streamId: splitId },
    });

    if (!split) {
      return res.status(404).json({
        success: false,
        error: "Split not found",
      });
    }

    // Prepare PDF data
    const pdfData = {
      splitId: split.streamId || split.id,
      txHash: split.txHash,
      timestamp: split.createdAt.toISOString(),
      sender: split.sender,
      recipients: [
        {
          address: split.receiver,
          amount: split.amount,
        },
      ],
      asset: split.tokenAddress || "XLM",
      totalAmount: split.amount,
      note: `Stream Status: ${split.status}`,
    };

    try {
      const pdfBuffer = await pdfService.generatePDF(pdfData);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="proof-of-payment-${splitId}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);

      return res.send(pdfBuffer);
    } catch (error) {
      logger.error("Failed to generate PDF:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to generate PDF",
      });
    }
  })
);

export default router;
