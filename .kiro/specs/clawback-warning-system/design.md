# Design Document: Clawback Warning System

## Overview

The Clawback Warning System adds compliance-aware UI to the StellarStream create-stream flow. When a user selects a Stellar regulated asset (one whose issuer has `AUTH_CLAWBACK_ENABLED_FLAG` set), the asset selector shows a "Regulated" badge and the wizard surfaces a prominent orange warning banner. The same badge is added to the reusable `TokenSelector` dropdown. No new pages or routes are needed — all changes are confined to existing components.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  create-stream/page.tsx  (Step 1 wizard)                    │
│                                                             │
│  ASSETS constant  ──►  enriched with clawbackEnabled        │
│       │                via useClawbackFlags() hook          │
│       ▼                                                     │
│  AssetGrid (Step1)  ──►  RegulatedAssetBadge per card       │
│       │                                                     │
│  ClawbackWarningBanner  (shown when regulated selected)     │
│       │                                                     │
│  Step3 review  ──►  ClawbackRiskNotice (if regulated)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  token-selector.tsx  (reusable dropdown)                    │
│                                                             │
│  Token type  ──►  + clawbackEnabled?: boolean               │
│  List items  ──►  RegulatedAssetBadge when enabled          │
│  Trigger btn ──►  small badge when selected token regulated │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  useClawbackFlags(assets)  hook                             │
│                                                             │
│  For each asset with an issuer:                             │
│    GET https://horizon.stellar.org/accounts/{issuer}        │
│    → flags.auth_clawback_enabled                            │
│  Returns map: { [symbol]: boolean }                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### `useClawbackFlags` hook

```typescript
// frontend/hooks/useClawbackFlags.ts
type ClawbackMap = Record<string, boolean>; // keyed by asset symbol

function useClawbackFlags(
  assets: Array<{ symbol: string; issuer?: string }>
): { flags: ClawbackMap; loading: boolean }
```

- Fetches issuer account data from Horizon in parallel for all assets that have an issuer.
- XLM (no issuer) is always `false`.
- On fetch error, defaults to `false` — never blocks rendering.
- Returns a stable `flags` map and a `loading` boolean.

### `RegulatedAssetBadge` component

```typescript
// frontend/components/regulated-asset-badge.tsx
interface RegulatedAssetBadgeProps {
  size?: "sm" | "md"; // "sm" for trigger button, "md" for list items
}
```

- Renders an amber pill: `⚠ Regulated`
- Includes `aria-label="Regulated asset — clawback enabled"` and a hover/focus tooltip.
- Tooltip text: *"The issuer of this asset can reclaim (claw back) tokens from your account at any time using the Stellar clawback operation."*
- Tooltip uses the existing glass-card style (`bg-[#030303]/95 backdrop-blur-xl border border-white/10`).
- Tooltip has `role="tooltip"` and the badge trigger has `aria-describedby` pointing to it.

### `ClawbackWarningBanner` component

```typescript
// frontend/components/clawback-warning-banner.tsx
interface ClawbackWarningBannerProps {
  assetSymbol: string;
  visible: boolean;
}
```

- Renders only when `visible` is `true`.
- Uses the existing orange warning style: `border-orange-400/20 bg-orange-400/[0.05]`.
- Contains `role="alert"` for screen reader announcement.
- Text: *"This is a regulated asset. The issuer can reclaim streamed funds from the recipient's account at any time using the Stellar clawback operation."*

### Changes to `create-stream/page.tsx`

- `ASSETS` constant gains an optional `issuer?: string` field per asset.
- `useClawbackFlags` is called at the top of `CreateStreamPage` (or `Step1`).
- `Step1` renders `RegulatedAssetBadge` on each asset card where `flags[a.symbol]` is `true`.
- `Step1` renders `ClawbackWarningBanner` below the asset grid when the selected asset is regulated.
- `Step3` renders a `ClawbackRiskNotice` inline block when the selected asset is regulated.

### Changes to `token-selector.tsx`

- `Token` type gains `clawbackEnabled?: boolean`.
- Each list item renders `<RegulatedAssetBadge size="sm" />` when `token.clawbackEnabled` is `true`.
- The trigger button renders `<RegulatedAssetBadge size="sm" />` next to the token code when the selected token is regulated.

---

## Data Models

### Extended `Token` type

```typescript
export type Token = {
  code: string;
  issuer?: string;
  name: string;
  balance: number;
  icon?: string;
  clawbackEnabled?: boolean; // NEW
};
```

### Extended `ASSETS` entry (create-stream page)

```typescript
type AssetEntry = {
  symbol: string;
  name: string;
  icon: string;
  color: string;
  issuer?: string; // NEW — Stellar issuer G-address
};
```

### Horizon API response (relevant subset)

```typescript
// GET https://horizon.stellar.org/accounts/{issuer}
type HorizonAccountFlags = {
  auth_required: boolean;
  auth_revocable: boolean;
  auth_immutable: boolean;
  auth_clawback_enabled: boolean; // the flag we care about
};
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Clawback flag mapping round-trip

*For any* asset whose mocked Horizon response has `auth_clawback_enabled: true`, the `useClawbackFlags` hook SHALL return `true` for that asset's symbol; and for any asset whose response has `auth_clawback_enabled: false`, the hook SHALL return `false`.

**Validates: Requirements 1.3**

---

### Property 2: Badge visibility matches clawbackEnabled flag

*For any* asset rendered in the Asset_Selector (both the grid in `create-stream/page.tsx` and the `TokenSelector` dropdown), the presence of a `RegulatedAssetBadge` SHALL be exactly equal to whether that asset's `clawbackEnabled` is `true`. No badge for `false`; always a badge for `true`.

**Validates: Requirements 2.1, 2.3, 5.2, 5.4**

---

### Property 3: Warning banner visibility matches selected asset's clawback status

*For any* asset selection in the create-stream wizard, the `ClawbackWarningBanner` SHALL be visible if and only if the currently selected asset has `clawbackEnabled: true`.

**Validates: Requirements 4.1, 4.4**

---

### Property 4: Step 3 clawback notice presence matches selected asset's clawback status

*For any* regulated asset selected when the user reaches Step 3, the rendered Step 3 panel SHALL contain a clawback risk notice that includes the asset's symbol. For any non-regulated asset, no such notice SHALL appear.

**Validates: Requirements 4.5, 4.6**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Horizon API returns 404 for issuer | `clawbackEnabled` defaults to `false`; no badge or banner shown |
| Horizon API times out (>5 s) | Same as 404 — default to `false` |
| Network offline | Same — default to `false` |
| Asset has no issuer (XLM) | `clawbackEnabled` is always `false`; no API call made |
| Partial failure (some issuers fail) | Successfully fetched assets use real data; failed ones default to `false` |

All errors are caught silently — no error toast is shown to the user for clawback flag fetch failures, as this is a non-critical enrichment.

---

## Testing Strategy

### Unit tests

- `useClawbackFlags` with mocked `fetch`: verify correct Horizon URL is called per issuer, verify XLM is skipped, verify error defaults to `false`.
- `RegulatedAssetBadge`: verify tooltip text content, verify ARIA attributes (`aria-label`, `role="tooltip"`, `aria-describedby`).
- `ClawbackWarningBanner`: verify `role="alert"` is present, verify text content, verify it renders only when `visible=true`.
- Step 3 notice: verify it renders with asset symbol when regulated, absent when not.

### Property-based tests (using [fast-check](https://github.com/dubzzz/fast-check))

Each property test runs a minimum of 100 iterations.

**Property 1 — Clawback flag mapping round-trip**
Tag: `Feature: clawback-warning-system, Property 1: clawback flag mapping round-trip`
Generate random arrays of assets with random `auth_clawback_enabled` values in mocked Horizon responses. Assert `useClawbackFlags` output matches the mocked flag for every asset.

**Property 2 — Badge visibility matches clawbackEnabled flag**
Tag: `Feature: clawback-warning-system, Property 2: badge visibility matches clawbackEnabled flag`
Generate random lists of `Token` objects with random `clawbackEnabled` values. Render `TokenSelector` and assert badge presence equals `clawbackEnabled` for every item.

**Property 3 — Warning banner visibility matches selected asset**
Tag: `Feature: clawback-warning-system, Property 3: warning banner visibility matches selected asset`
Generate random asset selections (regulated and non-regulated). Render Step 1 and assert banner visibility equals `clawbackEnabled` of the selected asset.

**Property 4 — Step 3 clawback notice presence**
Tag: `Feature: clawback-warning-system, Property 4: Step 3 clawback notice presence`
Generate random regulated and non-regulated asset selections. Render Step 3 and assert notice presence and symbol inclusion match the asset's `clawbackEnabled` status.
