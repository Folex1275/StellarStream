import type { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      authenticated?: boolean;
      /** Set when authenticated; the ApiKey.id from the database. */
      authenticatedKeyId?: string;
      /** Per-key rate limit (requests/min) from the ApiKey table. */
      apiKeyRateLimit?: number;
      /** Set by requireWalletAuth after successful signature verification (Stellar G... address). */
      walletAddress?: string;
      /** Set by requireWalletAuth when request is authenticated via wallet signature. */
      walletAuthenticated?: boolean;
      /** Set by requireRole after resolving the member's OrgRole for the target org. */
      orgRole?: import('../services/org-member.service.js').OrgRole;
    }
  }
}

export {};
