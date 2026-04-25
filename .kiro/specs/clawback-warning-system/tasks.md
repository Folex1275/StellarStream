# Implementation Plan: Clawback Warning System

## Overview

Implement compliance-aware UI for regulated Stellar assets in the create-stream wizard and the reusable `TokenSelector` component. Changes are confined to existing frontend files plus two new components and one new hook.

## Tasks

- [ ] 1. Extend data types and add Horizon flag-fetching hook
  - [ ] 1.1 Extend the `Token` type in `frontend/components/token-selector.tsx` with `clawbackEnabled?: boolean`
    - Add the optional field to the exported `Token` type
    - _Requirements: 5.1_
  - [ ] 1.2 Add `issuer?: string` to the `AssetEntry` type and `ASSETS` constant in `frontend/app/dashboard/create-stream/page.tsx`
    - Populate known issuers for USDC, USDT, DAI (leave ETH/WBTC/STRK without issuers for now)
    - _Requirements: 1.1, 1.2_
  - [ ] 1.3 Create `frontend/hooks/useClawbackFlags.ts`
    - Accepts `Array<{ symbol: string; issuer?: string }>`
    - Fetches `https://horizon.stellar.org/accounts/{issuer}` in parallel for each asset with an issuer
    - Skips XLM / assets without an issuer (always `false`)
    - On any fetch error or timeout (5 s), defaults to `false`
    - Returns `{ flags: Record<string, boolean>, loading: boolean }`
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  - [ ]* 1.4 Write property test for `useClawbackFlags` flag mapping
    - **Property 1: Clawback flag mapping round-trip**
    - **Validates: Requirements 1.3**
    - Use `fast-check` to generate random asset arrays with mocked Horizon responses; assert output flags match mocked `auth_clawback_enabled` values
  - [ ]* 1.5 Write unit tests for `useClawbackFlags` error handling
    - Test: Horizon 404 → `clawbackEnabled` defaults to `false`
    - Test: fetch timeout → defaults to `false`
    - Test: XLM (no issuer) → no fetch, always `false`
    - _Requirements: 1.4, 1.5_

- [ ] 2. Build the `RegulatedAssetBadge` component
  - [ ] 2.1 Create `frontend/components/regulated-asset-badge.tsx`
    - Renders an amber pill: `⚠ Regulated`
    - Accepts `size?: "sm" | "md"` prop
    - Includes `aria-label="Regulated asset — clawback enabled"`
    - Includes a hover/focus tooltip with `role="tooltip"` and matching `aria-describedby` on the trigger
    - Tooltip text: "The issuer of this asset can reclaim (claw back) tokens from your account at any time using the Stellar clawback operation."
    - Tooltip uses glass-card style: `bg-[#030303]/95 backdrop-blur-xl border border-white/10`
    - _Requirements: 2.2, 3.1, 3.2, 3.4, 3.5, 6.1_
  - [ ]* 2.2 Write unit tests for `RegulatedAssetBadge`
    - Test: tooltip text content is present in DOM
    - Test: `aria-label` equals "Regulated asset — clawback enabled"
    - Test: tooltip has `role="tooltip"`
    - Test: trigger has `aria-describedby` pointing to tooltip id
    - _Requirements: 3.2, 3.5, 6.1_

- [ ] 3. Build the `ClawbackWarningBanner` component
  - [ ] 3.1 Create `frontend/components/clawback-warning-banner.tsx`
    - Accepts `assetSymbol: string` and `visible: boolean` props
    - Renders only when `visible` is `true`
    - Uses orange warning style: `border-orange-400/20 bg-orange-400/[0.05]`
    - Includes `role="alert"`
    - Text: "This is a regulated asset. The issuer can reclaim streamed funds from the recipient's account at any time using the Stellar clawback operation."
    - _Requirements: 4.2, 4.3, 6.2_
  - [ ]* 3.2 Write unit tests for `ClawbackWarningBanner`
    - Test: renders when `visible=true`, absent when `visible=false`
    - Test: `role="alert"` is present
    - Test: warning text content is present
    - _Requirements: 4.3, 6.2_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Integrate badge and banner into the create-stream wizard
  - [ ] 5.1 Call `useClawbackFlags` in `CreateStreamPage` and pass `flags` down to `Step1` and `Step3`
    - _Requirements: 1.1, 1.2_
  - [ ] 5.2 Render `RegulatedAssetBadge` on each asset card in `Step1` when `flags[a.symbol]` is `true`
    - Position the badge as an overlay or sub-label on the asset grid button
    - _Requirements: 2.1, 2.3, 2.4, 2.5_
  - [ ] 5.3 Render `ClawbackWarningBanner` below the asset grid in `Step1` when the selected asset is regulated
    - Show/hide reactively as the user changes asset selection
    - _Requirements: 4.1, 4.4_
  - [ ] 5.4 Render a clawback risk notice in `Step3` when the selected asset is regulated
    - Inline block using the same orange warning style as the existing immutability warning
    - Text: "Clawback enabled — the issuer may reclaim [ASSET] from the recipient at any time."
    - _Requirements: 4.5, 4.6_
  - [ ]* 5.5 Write property test for banner visibility
    - **Property 3: Warning banner visibility matches selected asset**
    - **Validates: Requirements 4.1, 4.4**
    - Use `fast-check` to generate random asset selections; render Step 1 and assert banner visibility equals `clawbackEnabled` of selected asset
  - [ ]* 5.6 Write property test for Step 3 clawback notice
    - **Property 4: Step 3 clawback notice presence**
    - **Validates: Requirements 4.5, 4.6**
    - Use `fast-check` to generate random regulated/non-regulated asset selections; render Step 3 and assert notice presence and symbol match

- [ ] 6. Integrate badge into the `TokenSelector` component
  - [ ] 6.1 Import and render `RegulatedAssetBadge` in the dropdown list items of `token-selector.tsx` when `token.clawbackEnabled` is `true`
    - _Requirements: 5.2, 5.4_
  - [ ] 6.2 Render a small `RegulatedAssetBadge` (`size="sm"`) in the trigger button when the selected token has `clawbackEnabled: true`
    - _Requirements: 5.3_
  - [ ]* 6.3 Write property test for badge visibility in `TokenSelector`
    - **Property 2: Badge visibility matches clawbackEnabled flag**
    - **Validates: Requirements 2.1, 2.3, 5.2, 5.4**
    - Use `fast-check` to generate random `Token` arrays with random `clawbackEnabled` values; render `TokenSelector` and assert badge presence equals `clawbackEnabled` for every item

- [ ] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `fast-check` must be added as a dev dependency: `npm install --save-dev fast-check`
- All Horizon API calls use the public endpoint `https://horizon.stellar.org/accounts/{issuer}`; no API key required
- The `useClawbackFlags` hook fires on mount and when the assets list changes; results are cached for the component lifetime
- No new routes or pages are introduced — all changes are in existing files plus the three new files: `hooks/useClawbackFlags.ts`, `components/regulated-asset-badge.tsx`, `components/clawback-warning-banner.tsx`
