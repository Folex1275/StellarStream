## feat: Asset Mapping Registry — Cross-Chain Asset Identity

### Description
Provides a unified registry that maps Stellar Asset IDs to their source-chain equivalents for cross-chain splits, enabling the protocol to distinguish between native and bridged versions of the same asset (e.g. "USDC (Circle/Stellar)" vs. "USDC (Bridged/Ethereum)").

### Changes

**Database**
- New `AssetMapping` table (`add_asset_mapping.sql` + Prisma model) with fields: `stellarAssetId`, `symbol`, `sourceChain`, `sourceContract`, `label`, `bridgeProtocol`, `decimals`, `isNative`

**Backend**
- `AssetMappingService` — `list()`, `getByAssetId()`, `upsert()`, and `seed()` with well-known defaults (native USDC, bridged USDC via Wormhole, native XLM)
- `GET /api/v2/asset-mapping` — list all mappings, filterable by `?symbol=`
- `GET /api/v2/asset-mapping/:stellarAssetId` — single asset lookup
- Route registered in API index

### Labels
`[Backend]` `Data` `Easy`
