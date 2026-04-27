import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import validateRequest from "../middleware/validateRequest.js";
import stellarAddressSchema from "../validation/stellar.js";
import { VotingPowerService } from "../services/voting-power.service.js";
import { requireAuth } from "../middleware/requireAuth.js";

interface IndexedProposalRow {
  id: string;
  creator: string;
  description: string;
  quorum: number;
  votesFor: number;
  votesAgainst: number;
  txHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const router = Router();
const votingPowerService = new VotingPowerService();
const votingPowerParamsSchema = z.object({
  address: stellarAddressSchema,
});

/**
 * POST /api/v1/governance/proposals
 * Create a new governance proposal (for multi-sig transactions).
 */
router.post(
  "/governance/proposals",
  requireAuth,
  validateRequest({
    body: z.object({
      creator: stellarAddressSchema,
      description: z.string().min(1).max(1000),
      action: z.string().min(1).max(100),
      txData: z.string(), // Base64 encoded transaction XDR
      signers: z.array(stellarAddressSchema).min(1),
      requiredSignatures: z.number().int().min(1).max(20),
    }),
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { creator, description, action, txData, signers, requiredSignatures } = req.body;

    // Generate a unique proposal ID
    const proposalId = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Store proposal in database
    const proposal = await prisma.$queryRaw`
      INSERT INTO "Proposal" ("id", "creator", "description", "quorum", "votesFor", "votesAgainst", "txHash", "createdAt", "updatedAt")
      VALUES (${proposalId}, ${creator}, ${description}, ${requiredSignatures}, 0, 0, ${txData}, NOW(), NOW())
      ON CONFLICT ("id") DO NOTHING
      RETURNING *
    `;

    // TODO: Store signers separately in a related table for tracking

    res.json({
      success: true,
      proposal: {
        id: proposalId,
        creator,
        description,
        action,
        txData,
        signers,
        requiredSignatures,
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    });
  })
);

/**
 * GET /api/v1/governance/proposals
 * Returns DAO governance proposals indexed from contract events.
 */
router.get(
  "/governance/proposals",
  asyncHandler(async (_req: Request, res: Response) => {
    const proposals = await prisma.$queryRaw<IndexedProposalRow[]>`
      SELECT
        "id",
        "creator",
        "description",
        "quorum",
        "votesFor",
        "votesAgainst",
        "txHash",
        "createdAt",
        "updatedAt"
      FROM "Proposal"
      ORDER BY "createdAt" DESC
    `;

    res.json({
      success: true,
      count: proposals.length,
      proposals: proposals.map((proposal) => ({
        id: proposal.id,
        creator: proposal.creator,
        description: proposal.description,
        quorum: proposal.quorum,
        votesFor: proposal.votesFor,
        votesAgainst: proposal.votesAgainst,
        txHash: proposal.txHash,
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
      })),
    });
  })
);

/**
 * GET /api/v1/governance/voting-power/:address
 * Returns cached voting power derived from staked balance + active streaming volume.
 */
router.get(
  "/governance/voting-power/:address",
  validateRequest({
    params: votingPowerParamsSchema,
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.params;
    const votingPower = await votingPowerService.getVotingPower(address);

    res.json({
      success: true,
      votingPower,
    });
  })
);

export default router;
