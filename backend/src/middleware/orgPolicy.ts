import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PolicyEngine } from "../services/policy-engine.service.js";

const policyEngine = new PolicyEngine();

const splitBodySchema = z.object({
  orgAddress: z.string(),
  assetAddress: z.string(),
  amountUsd: z.number().positive(),
});

/**
 * Middleware: Organisation-Policy Validator (#844)
 *
 * Validates every V3 split transaction against the organisation's stored policies:
 *   - Daily spend limit
 *   - Authorized assets whitelist
 *
 * Expects req.body to contain { orgAddress, assetAddress, amountUsd }.
 * Rejects with 403 on policy violation, passes through on compliance.
 */
export async function orgPolicyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = splitBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Missing required fields: orgAddress, assetAddress, amountUsd",
    });
    return;
  }

  const { orgAddress, assetAddress, amountUsd } = parsed.data;
  const violations = await policyEngine.validate(orgAddress, assetAddress, amountUsd);

  if (violations.length > 0) {
    res.status(403).json({
      success: false,
      error: "Policy violation",
      violations,
    });
    return;
  }

  next();
}
