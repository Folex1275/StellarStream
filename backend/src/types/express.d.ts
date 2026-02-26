declare global {
  namespace Express {
    interface Request {
      authenticated?: boolean;
      /** Set when authenticated; used by rate limiter for keying (hash of API key). */
      authenticatedKeyId?: string;
      /** Set by requireWalletAuth after successful signature verification (Stellar G... address). */
      walletAddress?: string;
      /** Set by requireWalletAuth when request is authenticated via wallet signature. */
      walletAuthenticated?: boolean;
    }
  }
}

export {};
