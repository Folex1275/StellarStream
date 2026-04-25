/**
 * Recipient Portal API Routes
 * Issue #1001 - "Proof-of-Verification" Recipient Portal
 *
 * Provides authenticated endpoints for recipients to view their private payment history
 * using SEP-10 style challenge-response authentication.
 */

import { Router, Request, Response } from "express";
import { prisma } from "../lib/db.js";
import { requireWalletAuth } from "../middleware/requireWalletAuth.js";

const router = Router();

/**
 * GET /api/v1/recipient/disbursements
 * Protected route: requires wallet authentication
 * Returns all disbursements where the authenticated wallet is a recipient
 */
router.get("/disbursements", requireWalletAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const recipientAddress = req.walletAddress;

        if (!recipientAddress) {
            res.status(401).json({ error: "Wallet authentication required" });
            return;
        }

        // Fetch disbursements where the user is a recipient
        const disbursements = await prisma.disbursement.findMany({
            where: {
                recipients: {
                    some: {
                        recipientAddress: recipientAddress
                    }
                }
            },
            include: {
                recipients: {
                    where: {
                        recipientAddress: recipientAddress
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Format the response
        const formattedDisbursements = disbursements.map(disbursement => ({
            id: disbursement.id,
            senderAddress: disbursement.senderAddress,
            totalAmount: disbursement.totalAmount,
            asset: disbursement.asset,
            txHash: disbursement.txHash,
            createdAt: disbursement.createdAt.toISOString(),
            recipient: disbursement.recipients[0] // Should only be one since we filtered
        }));

        res.json({
            success: true,
            disbursements: formattedDisbursements
        });
    } catch (error) {
        console.error("Failed to fetch recipient disbursements:", error);
        res.status(500).json({
            error: "Internal server error",
            message: "Failed to fetch disbursements"
        });
    }
});

/**
 * POST /api/v1/recipient/report-discrepancy
 * Protected route: requires wallet authentication
 * Allows recipients to report discrepancies in their payments
 */
router.post("/report-discrepancy", requireWalletAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const recipientAddress = req.walletAddress;
        const { disbursementId, issue, description } = req.body;

        if (!recipientAddress) {
            res.status(401).json({ error: "Wallet authentication required" });
            return;
        }

        if (!disbursementId || !issue) {
            res.status(400).json({
                error: "Missing required fields",
                message: "disbursementId and issue are required"
            });
            return;
        }

        // Verify the disbursement exists and user is a recipient
        const disbursement = await prisma.disbursement.findFirst({
            where: {
                id: disbursementId,
                recipients: {
                    some: {
                        recipientAddress: recipientAddress
                    }
                }
            }
        });

        if (!disbursement) {
            res.status(404).json({
                error: "Disbursement not found",
                message: "No disbursement found for this recipient"
            });
            return;
        }

        // TODO: Implement discrepancy reporting logic
        // This could involve:
        // 1. Creating a discrepancy report record
        // 2. Notifying the sending organization
        // 3. Logging the report for audit purposes

        // For now, just log it
        console.log("Discrepancy reported:", {
            recipientAddress,
            disbursementId,
            issue,
            description,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: "Discrepancy report submitted successfully"
        });
    } catch (error) {
        console.error("Failed to report discrepancy:", error);
        res.status(500).json({
            error: "Internal server error",
            message: "Failed to submit discrepancy report"
        });
    }
});

export default router; </content>
    < parameter name = "filePath" > /Users/devsol / Documents / github repos / StellarStream / backend / src / api / recipient.routes.ts