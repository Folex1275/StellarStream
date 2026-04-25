import { logger } from "../logger.js";

export interface BridgedAsset {
  stellarAsset: string;
  stellarContractId?: string;
  chains: {
    [chainName: string]: {
      contractAddress: string;
      decimals: number;
      symbol: string;
    };
  };
}

export interface AssetMapping {
  [stellarAsset: string]: BridgedAsset;
}

export class AssetMapperService {
  private assetRegistry: AssetMapping = {
    // USDC - Stellar to other chains
    "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4IHTZMZMJRMW26RQAT25RIOJG4QA5U6": {
      stellarAsset: "USDC",
      stellarContractId: "CBBD47AB2EB00E041B0B8B0EA4C4D0534E3628C95A91B30D46B57F0B25F5F5F1",
      chains: {
        ethereum: {
          contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          decimals: 6,
          symbol: "USDC",
        },
        solana: {
          contractAddress: "EPjFWaLb3odcccccccccccccccccccccccccccccccc",
          decimals: 6,
          symbol: "USDC",
        },
        polygon: {
          contractAddress: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
          decimals: 6,
          symbol: "USDC",
        },
        arbitrum: {
          contractAddress: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5F86",
          decimals: 6,
          symbol: "USDC",
        },
      },
    },

    // USDT - Stellar to other chains
    "USDT:GBUQWP3BOUZX34ULNQG23RQ6F4YUSXHTQSXUSMIQSTBE2EURIDVXL6B": {
      stellarAsset: "USDT",
      stellarContractId: "CBBD47AB2EB00E041B0B8B0EA4C4D0534E3628C95A91B30D46B57F0B25F5F5F2",
      chains: {
        ethereum: {
          contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          decimals: 6,
          symbol: "USDT",
        },
        solana: {
          contractAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEsl",
          decimals: 6,
          symbol: "USDT",
        },
        polygon: {
          contractAddress: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
          decimals: 6,
          symbol: "USDT",
        },
        arbitrum: {
          contractAddress: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
          decimals: 6,
          symbol: "USDT",
        },
      },
    },

    // EURC - Stellar to other chains
    "EURC:GAKBPNKTSBGNBGXNFNXNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQ": {
      stellarAsset: "EURC",
      stellarContractId: "CBBD47AB2EB00E041B0B8B0EA4C4D0534E3628C95A91B30D46B57F0B25F5F5F3",
      chains: {
        ethereum: {
          contractAddress: "0x60a3E35Cc302bFA44Cb288Bc5a4F3f874aa1d682",
          decimals: 6,
          symbol: "EURC",
        },
        solana: {
          contractAddress: "A1z69A8BJ5YbCj7d4V5zV5zV5zV5zV5zV5zV5zV5zV5z",
          decimals: 6,
          symbol: "EURC",
        },
        polygon: {
          contractAddress: "0x60a3E35Cc302bFA44Cb288Bc5a4F3f874aa1d682",
          decimals: 6,
          symbol: "EURC",
        },
      },
    },

    // BRLG - Stellar to other chains
    "BRLG:GAKBPNKTSBGNBGXNFNXNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQ": {
      stellarAsset: "BRLG",
      stellarContractId: "CBBD47AB2EB00E041B0B8B0EA4C4D0534E3628C95A91B30D46B57F0B25F5F5F4",
      chains: {
        ethereum: {
          contractAddress: "0x7c8dDa80b6f8137c3985500e3d3a0a30b6c6440d",
          decimals: 2,
          symbol: "BRLG",
        },
        polygon: {
          contractAddress: "0x7c8dDa80b6f8137c3985500e3d3a0a30b6c6440d",
          decimals: 2,
          symbol: "BRLG",
        },
      },
    },

    // ARST - Stellar to other chains
    "ARST:GAKBPNKTSBGNBGXNFNXNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQNQ": {
      stellarAsset: "ARST",
      stellarContractId: "CBBD47AB2EB00E041B0B8B0EA4C4D0534E3628C95A91B30D46B57F0B25F5F5F5",
      chains: {
        ethereum: {
          contractAddress: "0xf8eb3b3cbf63fc935e670711e6e8b0be3f3fa842",
          decimals: 18,
          symbol: "ARST",
        },
      },
    },
  };

  /**
   * Get all asset mappings
   */
  getAssetMappings(): AssetMapping {
    return this.assetRegistry;
  }

  /**
   * Get mapping for a specific Stellar asset
   */
  getAssetMapping(stellarAsset: string): BridgedAsset | null {
    return this.assetRegistry[stellarAsset] || null;
  }

  /**
   * Get all chains where a Stellar asset is available
   */
  getAvailableChains(stellarAsset: string): string[] {
    const mapping = this.assetRegistry[stellarAsset];
    return mapping ? Object.keys(mapping.chains) : [];
  }

  /**
   * Get contract address for a Stellar asset on a specific chain
   */
  getContractAddress(stellarAsset: string, chain: string): string | null {
    const mapping = this.assetRegistry[stellarAsset];
    if (!mapping || !mapping.chains[chain]) {
      return null;
    }
    return mapping.chains[chain].contractAddress;
  }

  /**
   * Add or update an asset mapping
   */
  addAssetMapping(stellarAsset: string, mapping: BridgedAsset): void {
    this.assetRegistry[stellarAsset] = mapping;
    logger.info(`Asset mapping added/updated for ${stellarAsset}`);
  }

  /**
   * Search assets by symbol across all chains
   */
  searchBySymbol(symbol: string): BridgedAsset[] {
    return Object.values(this.assetRegistry).filter((asset) => asset.stellarAsset.toUpperCase() === symbol.toUpperCase());
  }

  /**
   * Get cross-chain flow information for an asset
   */
  getCrossChainFlowInfo(stellarAsset: string): {
    asset: string;
    sourceChain: string;
    destinationChains: Array<{
      chain: string;
      contractAddress: string;
      decimals: number;
    }>;
  } | null {
    const mapping = this.getAssetMapping(stellarAsset);
    if (!mapping) {
      return null;
    }

    return {
      asset: mapping.stellarAsset,
      sourceChain: "stellar",
      destinationChains: Object.entries(mapping.chains).map(([chain, info]) => ({
        chain,
        contractAddress: info.contractAddress,
        decimals: info.decimals,
      })),
    };
  }
}
