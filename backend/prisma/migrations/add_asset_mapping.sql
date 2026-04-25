-- AssetMapping: unified registry mapping Stellar Asset IDs to source-chain equivalents
CREATE TABLE "AssetMapping" (
  "id"              TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "stellarAssetId"  TEXT NOT NULL UNIQUE,   -- e.g. "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
  "symbol"          TEXT NOT NULL,           -- e.g. "USDC"
  "sourceChain"     TEXT NOT NULL,           -- e.g. "stellar", "ethereum", "polygon"
  "sourceContract"  TEXT,                    -- e.g. ERC-20 contract address on origin chain
  "label"           TEXT NOT NULL,           -- e.g. "USDC (Circle/Stellar)"
  "bridgeProtocol"  TEXT,                    -- e.g. "wormhole", "squid", null for native
  "decimals"        INTEGER NOT NULL DEFAULT 7,
  "isNative"        BOOLEAN NOT NULL DEFAULT false,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX "AssetMapping_symbol_idx" ON "AssetMapping"("symbol");
CREATE INDEX "AssetMapping_sourceChain_idx" ON "AssetMapping"("sourceChain");
