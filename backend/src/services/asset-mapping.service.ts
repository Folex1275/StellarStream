import { prisma } from "../lib/db.js";

export class AssetMappingService {
  /** Seed well-known mappings (idempotent) */
  async seed(): Promise<void> {
    const entries = [
      {
        stellarAssetId: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        symbol: "USDC",
        sourceChain: "stellar",
        sourceContract: null,
        label: "USDC (Circle/Stellar)",
        bridgeProtocol: null,
        decimals: 7,
        isNative: true,
      },
      {
        stellarAssetId: "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        symbol: "USDC",
        sourceChain: "ethereum",
        sourceContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        label: "USDC (Bridged/Ethereum)",
        bridgeProtocol: "wormhole",
        decimals: 6,
        isNative: false,
      },
      {
        stellarAssetId: "XLM:native",
        symbol: "XLM",
        sourceChain: "stellar",
        sourceContract: null,
        label: "XLM (Native/Stellar)",
        bridgeProtocol: null,
        decimals: 7,
        isNative: true,
      },
    ];

    for (const entry of entries) {
      await (prisma as any).assetMapping.upsert({
        where: { stellarAssetId: entry.stellarAssetId },
        create: entry,
        update: { label: entry.label, bridgeProtocol: entry.bridgeProtocol },
      });
    }
  }

  /** Return metadata for a single Stellar asset ID */
  async getByAssetId(stellarAssetId: string) {
    return (prisma as any).assetMapping.findUnique({ where: { stellarAssetId } });
  }

  /** Return all mappings, optionally filtered by symbol */
  async list(symbol?: string) {
    return (prisma as any).assetMapping.findMany({
      where: symbol ? { symbol: symbol.toUpperCase() } : undefined,
      orderBy: [{ symbol: "asc" }, { sourceChain: "asc" }],
    });
  }

  /** Upsert a custom mapping */
  async upsert(data: {
    stellarAssetId: string;
    symbol: string;
    sourceChain: string;
    sourceContract?: string;
    label: string;
    bridgeProtocol?: string;
    decimals?: number;
    isNative?: boolean;
  }) {
    return (prisma as any).assetMapping.upsert({
      where: { stellarAssetId: data.stellarAssetId },
      create: data,
      update: data,
    });
  }
}
