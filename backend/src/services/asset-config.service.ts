import { prisma } from "../lib/db.js";

export interface CreateAssetDto {
  assetId: string;
  symbol: string;
  name: string;
  decimals?: number;
  isVerified?: boolean;
  isVisible?: boolean;
  yieldEnabled?: boolean;
  iconUrl?: string;
}

export interface UpdateAssetDto {
  symbol?: string;
  name?: string;
  decimals?: number;
  isVerified?: boolean;
  isVisible?: boolean;
  yieldEnabled?: boolean;
  iconUrl?: string | null;
}

export class AssetConfigService {
  /** List all assets, optionally filtering to visible/verified only. */
  listAssets(onlyVisible = false) {
    return prisma.assetConfig.findMany({
      where: onlyVisible ? { isVisible: true } : undefined,
      orderBy: { symbol: "asc" },
    });
  }

  /** Get a single asset by its assetId. */
  getAsset(assetId: string) {
    return prisma.assetConfig.findUnique({ where: { assetId } });
  }

  /** Create a new whitelisted asset. */
  createAsset(dto: CreateAssetDto) {
    return prisma.assetConfig.create({
      data: {
        assetId: dto.assetId,
        symbol: dto.symbol,
        name: dto.name,
        decimals: dto.decimals ?? 7,
        isVerified: dto.isVerified ?? false,
        isVisible: dto.isVisible ?? true,
        yieldEnabled: dto.yieldEnabled ?? false,
        iconUrl: dto.iconUrl,
      },
    });
  }

  /** Update an existing asset's configuration. */
  async updateAsset(assetId: string, dto: UpdateAssetDto) {
    const existing = await prisma.assetConfig.findUnique({ where: { assetId } });
    if (!existing) return null;
    return prisma.assetConfig.update({
      where: { assetId },
      data: dto,
    });
  }

  /** Delete an asset from the whitelist. */
  async deleteAsset(assetId: string) {
    const existing = await prisma.assetConfig.findUnique({ where: { assetId } });
    if (!existing) return null;
    return prisma.assetConfig.delete({ where: { assetId } });
  }
}
