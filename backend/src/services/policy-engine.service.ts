import { prisma } from "../lib/db.js";
import { logger } from "../logger.js";

export interface OrgPolicy {
  dailySpendLimitUsd: number | null;   // null = unlimited
  allowedAssets: string[] | null;      // null = all assets allowed
}

export interface PolicyViolation {
  code: "DAILY_SPEND_LIMIT_EXCEEDED" | "UNAUTHORIZED_ASSET";
  message: string;
}

/**
 * Fetches the stored policy for an organisation.
 * Falls back to permissive defaults when no policy row exists.
 */
async function getOrgPolicy(orgAddress: string): Promise<OrgPolicy> {
  // Policy is stored as JSON in a dedicated table (see migration).
  // Using $queryRaw for forward-compat until Prisma model is generated.
  const rows = await prisma.$queryRaw<
    { daily_spend_limit_usd: number | null; allowed_assets: string | null }[]
  >`
    SELECT daily_spend_limit_usd, allowed_assets
    FROM "OrganizationPolicy"
    WHERE org_address = ${orgAddress}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return { dailySpendLimitUsd: null, allowedAssets: null };
  }

  const row = rows[0];
  return {
    dailySpendLimitUsd: row.daily_spend_limit_usd,
    allowedAssets: row.allowed_assets ? JSON.parse(row.allowed_assets) : null,
  };
}

/**
 * Returns the total USD spend for an org in the current calendar day (UTC).
 * Reads from the Stream table; amount is in stroops (1e-7 XLM-equivalent).
 */
async function getDailySpendUsd(orgAddress: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<{ total: string }[]>`
    SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0)::text AS total
    FROM "Stream"
    WHERE sender = ${orgAddress}
      AND "createdAt" >= ${startOfDay}
  `;

  // Convert stroops to USD-equivalent (1 stroop = 1e-7 units; treat 1 unit = $1 for policy)
  const stroops = BigInt(rows[0]?.total ?? "0");
  return Number(stroops) / 1e7;
}

export class PolicyEngine {
  /**
   * Validates a proposed split transaction against the org's stored policies.
   * Returns an array of violations (empty = request is compliant).
   */
  async validate(
    orgAddress: string,
    assetAddress: string,
    amountUsd: number,
  ): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    let policy: OrgPolicy;
    try {
      policy = await getOrgPolicy(orgAddress);
    } catch (err) {
      logger.error("[PolicyEngine] Failed to fetch org policy", { orgAddress, err });
      // Fail open — don't block traffic on DB errors
      return [];
    }

    // 1. Unauthorized asset check
    if (policy.allowedAssets !== null && !policy.allowedAssets.includes(assetAddress)) {
      violations.push({
        code: "UNAUTHORIZED_ASSET",
        message: `Asset ${assetAddress} is not permitted for this organisation.`,
      });
    }

    // 2. Daily spend limit check
    if (policy.dailySpendLimitUsd !== null) {
      let spent = 0;
      try {
        spent = await getDailySpendUsd(orgAddress);
      } catch (err) {
        logger.error("[PolicyEngine] Failed to fetch daily spend", { orgAddress, err });
      }

      if (spent + amountUsd > policy.dailySpendLimitUsd) {
        violations.push({
          code: "DAILY_SPEND_LIMIT_EXCEEDED",
          message: `Daily spend limit of $${policy.dailySpendLimitUsd} would be exceeded (current: $${spent.toFixed(2)}, requested: $${amountUsd.toFixed(2)}).`,
        });
      }
    }

    return violations;
  }
}
