# Implementation Plan: Frontend Enterprise Features

## Overview

Implement four enterprise-grade frontend features on the StellarStream platform using the existing Next.js App Router + TypeScript stack, Tailwind CSS, and the Stellar Glass design system. The features are implemented in dependency order: shared utilities and hooks first, then UI components, then page-level wiring.

All implementation is in TypeScript/TSX. Property-based tests use `@fast-check/vitest`. Unit and integration tests use Vitest + React Testing Library.

---

## Tasks

- [-] 1. Set up shared utilities and pure functions for all four features
  - [x] 1.1 Implement `validateLogoFile` pure function in `frontend/lib/hooks/use-branding.ts`
    - Export `validateLogoFile(file: File): string | null`
    - Accept `image/png`, `image/jpeg`, `image/svg+xml`; reject all others with a descriptive error string
    - Reject files larger than 2,097,152 bytes (2 MB) with a descriptive error string
    - Return `null` for valid files
    - _Requirements: 1.3, 1.4_

  - [ ]* 1.2 Write property test for `validateLogoFile` (Property 1)
    - **Property 1: Logo file validation accepts valid files and rejects invalid ones**
    - **Validates: Requirements 1.3, 1.4**
    - Use `fc.record({ type: fc.constantFrom('image/png','image/jpeg','image/svg+xml','image/gif','application/pdf'), size: fc.integer({ min: 0, max: 4_000_000 }) })` to generate arbitrary File-like objects
    - Assert: returns `null` iff type is in the allowed set AND size ≤ 2,097,152
    - Tag: `// Feature: frontend-enterprise-features, Property 1: validateLogoFile`

  - [x] 1.3 Implement `formatSuccessRate` pure function in `frontend/components/dashboard/HealthCard.tsx`
    - Export `formatSuccessRate(rate: number): string`
    - Return `rate.toFixed(1) + '%'` (e.g., `"98.5%"`, `"100.0%"`, `"0.0%"`)
    - _Requirements: 3.6_

  - [ ]* 1.4 Write property test for `formatSuccessRate` (Property 5)
    - **Property 5: successRate is always formatted to exactly one decimal place**
    - **Validates: Requirements 3.6**
    - Use `fc.float({ min: 0, max: 100, noNaN: true })` to generate arbitrary rates
    - Assert: result ends with `%` and contains exactly one digit after the decimal point
    - Tag: `// Feature: frontend-enterprise-features, Property 5: formatSuccessRate`

  - [x] 1.5 Implement `formatFeedDescription` pure function in `frontend/components/dashboard/TransactionFeed.tsx`
    - Export `formatFeedDescription(item: TransactionFeedItem): string`
    - `type === 'recipient_added'` → `"${item.actor ?? 'Unknown'} added a recipient"`
    - `type === 'split_approved'` → `"${item.asset ?? 'Unknown'} Split Approved"`
    - All other types → `item.description`
    - _Requirements: 4.5, 4.6_

  - [x] 1.6 Implement `formatRelativeTime` pure function in `frontend/components/dashboard/TransactionFeed.tsx`
    - Export `formatRelativeTime(timestamp: string): string`
    - `< 60s` → `"Xs ago"`, `< 60m` → `"Xm ago"`, `≥ 60m` → `"Xh ago"`
    - Never return an empty string or throw for any valid past ISO 8601 timestamp
    - _Requirements: 4.12_

  - [ ]* 1.7 Write property tests for `formatFeedDescription` and `formatRelativeTime` (Properties 9, 12)
    - **Property 9: Feed description formatting matches the required pattern for all known event types**
    - **Validates: Requirements 4.5, 4.6**
    - **Property 12: Relative timestamp formatting always produces a valid relative time string**
    - **Validates: Requirements 4.12**
    - For P9: use `fc.record({ type: fc.constantFrom('recipient_added','split_approved'), actor: fc.string({ minLength: 1 }), asset: fc.string({ minLength: 1 }) })`
    - For P12: use `fc.date({ max: new Date() })` converted to ISO string; assert result matches `/^\d+(s|m|h) ago$/`
    - Tag: `// Feature: frontend-enterprise-features, Property 9` and `Property 12`

- [ ] 2. Implement `use-branding` hook and branding persistence
  - [x] 2.1 Define `BrandingConfig` interface and implement `use-branding` hook skeleton in `frontend/lib/hooks/use-branding.ts`
    - Define `BrandingConfig { logoUrl: string | null; primaryColor: string }`
    - Implement `loadBrandingConfig(): BrandingConfig` — reads from `localStorage` key `stellar_branding`; returns defaults `{ logoUrl: null, primaryColor: '#00f5ff' }` if absent
    - Implement `saveBrandingConfig(config: BrandingConfig): void` — writes JSON to `localStorage`
    - Export both functions for testing
    - _Requirements: 1.8, 1.10, 1.11_

  - [x] 2.2 Implement `useBranding` hook with `updateColor`, `updateLogo`, and `saveConfig`
    - `updateColor(color: string)` — sets `document.documentElement.style.setProperty('--stellar-primary', color)` immediately and updates local state
    - `updateLogo(file: File)` — calls `validateLogoFile`; on error sets `logoError`; on success reads file as data URL and sets `config.logoUrl`
    - `saveConfig()` — persists current config via `saveBrandingConfig`; sets `saving` during operation; sets `saveError` on failure
    - On mount, call `loadBrandingConfig()` and apply `primaryColor` to CSS var
    - Return `{ config, saving, saveError, updateColor, updateLogo, saveConfig, logoError }`
    - _Requirements: 1.6, 1.7, 1.8, 1.9, 1.10, 1.11_

  - [ ]* 2.3 Write property test for branding config round-trip (Property 3)
    - **Property 3: Branding config round-trip through persistence layer**
    - **Validates: Requirements 1.8, 1.10**
    - Use `fc.record({ primaryColor: fc.hexaString({ minLength: 6, maxLength: 6 }).map(h => '#' + h), logoUrl: fc.option(fc.string(), { nil: null }) })`
    - Call `saveBrandingConfig(config)` then `loadBrandingConfig()` and assert deep equality
    - Mock `localStorage` in the test environment
    - Tag: `// Feature: frontend-enterprise-features, Property 3: branding round-trip`

  - [ ]* 2.4 Write unit test for `updateColor` CSS var propagation (Property 2)
    - **Property 2: Color picker update propagates to CSS custom property**
    - **Validates: Requirements 1.6**
    - Use `fc.hexaString({ minLength: 6, maxLength: 6 }).map(h => '#' + h)` to generate arbitrary hex colors
    - Call `updateColor(color)` and assert `document.documentElement.style.getPropertyValue('--stellar-primary') === color`
    - Tag: `// Feature: frontend-enterprise-features, Property 2: CSS var propagation`

- [ ] 3. Build `BrandingPage` component
  - [x] 3.1 Create `frontend/components/settings/BrandingPage.tsx` with page header and BentoCard layout
    - Match the visual pattern of `SecurityPrivacyPage.tsx` (BentoCard, DM Mono / Syne fonts, shimmer top border, fade-up animations)
    - Page header: title "Brand Identity", subtitle "Customize your organization's public-facing appearance"
    - Three BentoCard sections: LogoUploadCard, ColorPickerCard, LivePreviewCard
    - _Requirements: 1.2_

  - [x] 3.2 Implement `LogoUploadCard` section inside `BrandingPage`
    - `<input type="file" accept=".png,.jpg,.jpeg,.svg" />` styled to match the Stellar Glass design system
    - On file selection, call `updateLogo(file)` from `useBranding`
    - Display `logoError` inline below the upload control when non-null
    - Show a thumbnail preview of `config.logoUrl` when non-null; show a placeholder prompt when null
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 3.3 Implement `ColorPickerCard` section inside `BrandingPage`
    - `<input type="color" />` bound to `config.primaryColor`; call `updateColor` on every `change` event (not just `blur`)
    - Display the current hex value in DM Mono font below the picker
    - Show default `#00f5ff` when no saved config exists
    - _Requirements: 1.2, 1.6, 1.7, 1.11_

  - [x] 3.4 Implement `LivePreviewCard` section inside `BrandingPage`
    - Render a mock Split-Link card layout using `var(--stellar-primary)` for accent colors and `config.logoUrl` for the logo
    - The preview must update in real time as color and logo change (no page reload required — CSS var change is sufficient for color)
    - Show a placeholder logo area when `config.logoUrl` is null
    - _Requirements: 1.2, 1.5, 1.6, 1.7_

  - [x] 3.5 Implement Save button and toast notifications in `BrandingPage`
    - "Save Branding" button calls `saveConfig()` from `useBranding`
    - Show a success toast (using `sonner`) on successful save
    - Show an error toast and retain form values on save failure
    - Button shows a loading/saving state while `saving === true`
    - _Requirements: 1.8, 1.9_

  - [ ]* 3.6 Write unit tests for `BrandingPage` (`BrandingPage.test.tsx`)
    - Renders upload control, color picker, and live preview panel
    - Shows default `#00f5ff` when no saved config exists
    - Shows inline error for invalid file type
    - Shows inline error for oversized file (> 2 MB)
    - Shows success toast on save
    - Shows error toast on save failure (mock `saveBrandingConfig` to throw)
    - _Requirements: 1.2, 1.3, 1.4, 1.8, 1.9, 1.11_

- [ ] 4. Wire `BrandingPage` into the Settings page
  - [x] 4.1 Add `<BrandingPage />` section to `frontend/app/dashboard/settings/page.tsx`
    - Import `BrandingPage` from `@/components/settings/BrandingPage`
    - Place the section after `<GasManagementTile />` and before `<SecurityPrivacyPage />`
    - Add a section comment `{/* ── Brand Identity (#1006) ── */}`
    - _Requirements: 1.1_

- [x] 5. Checkpoint — Branding feature complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Enhance `scripts/generate-dummy-recipients.ts` for stress test
  - [x] 6.1 Add `lat` and `lng` fields to `DummyRecipient` interface and `generateDummyRecipient` function
    - `lat`: random float in range `[-90, 90]`
    - `lng`: random float in range `[-180, 180]`
    - _Requirements: 2.1_

  - [x] 6.2 Add `@faker-js/faker` import guard with `process.exit(1)` on failure
    - Wrap the `faker` import in a try/catch
    - On catch: `process.stderr.write('Error: @faker-js/faker is not installed. Run: npm install @faker-js/faker\n')` then `process.exit(1)`
    - _Requirements: 2.9_

  - [x] 6.3 Ensure console output logs record count and exact output file paths on success
    - Log: `✅ Generated ${data.length} dummy recipients saved to ${filePath}` for both JSON and CSV outputs
    - _Requirements: 2.8_

  - [ ]* 6.4 Write property test for `generateDummyRecipients` (Property 4)
    - **Property 4: Recipient record generation produces complete, well-shaped records**
    - **Validates: Requirements 2.1**
    - Use `fc.integer({ min: 500, max: 1000 })` as the count argument
    - Assert: array length equals N; every record has non-null/non-empty `id`, `address`, `label`, `amount`, `token`, `transactions`, `lastActive`; `taxId` is `undefined` or non-empty string; all `id` values are unique
    - Tag: `// Feature: frontend-enterprise-features, Property 4: generateDummyRecipients`

- [ ] 7. Build `RecipientGrid` component with virtualization
  - [-] 7.1 Create `frontend/components/dashboard/RecipientGrid.tsx` with `@tanstack/react-virtual` row virtualization
    - Define `Recipient` interface matching the design document (id, address, label, amount, token, taxId?, transactions, lastActive, lat?, lng?)
    - Implement `RecipientRow` as a `React.memo`-wrapped component rendering one table row with columns: address, label, amount, token, transactions, lastActive
    - Implement `RecipientGrid({ recipients: Recipient[] })` using `useVirtualizer` with `estimateSize: () => 48` and `overscan: 10`
    - Render virtualized rows inside a fixed-height (`600px`) scrollable container
    - _Requirements: 2.3, 2.4, 2.5_

  - [ ]* 7.2 Write unit tests for `RecipientGrid` (`RecipientGrid.test.tsx`)
    - Renders without crashing with 500 rows loaded from `dummy-recipients.json`
    - `React.memo` prevents re-render of `RecipientRow` when props are unchanged (use `jest.fn` / `vi.fn` render spy)
    - _Requirements: 2.3, 2.4, 2.5_

- [ ] 8. Build `RecipientMap` component with marker clustering
  - [x] 8.1 Create `frontend/components/dashboard/RecipientMap.tsx` using `react-leaflet` and `react-leaflet-markercluster`
    - Render `MapContainer` + `TileLayer` + `MarkerClusterGroup`
    - Each recipient renders as a `<Marker>` inside the cluster group using `recipient.lat` / `recipient.lng`
    - Recipients without lat/lng receive random coordinates within `[-60, 60]` lat and `[-150, 150]` lng for demo purposes
    - Use dynamic import (`next/dynamic`) with `ssr: false` to avoid SSR issues with Leaflet
    - _Requirements: 2.6, 2.7_

  - [ ]* 8.2 Write unit tests for `RecipientMap` (`RecipientMap.test.tsx`)
    - Renders without crashing with 500 markers (mock `react-leaflet` and `react-leaflet-markercluster` in test environment)
    - _Requirements: 2.6, 2.7_

- [ ] 9. Build stress-test page and wire components
  - [x] 9.1 Create `frontend/app/dashboard/stress-test/page.tsx`
    - Load `dummy-recipients.json` from `/public/dummy-recipients.json` via `fetch` on mount
    - Show an error state with instructions to run `npx ts-node scripts/generate-dummy-recipients.ts` if the file is not found
    - Measure and log `RecipientGrid` TTI: capture `performance.now()` before render, log elapsed time in `useEffect` after first paint
    - Render both `<RecipientGrid recipients={recipients} />` and `<RecipientMap recipients={recipients} />` on the page
    - _Requirements: 2.3, 2.6_

- [x] 10. Checkpoint — Stress test feature complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Enhance `use-organization-health` hook
  - [x] 11.1 Update `UseOrganizationHealthReturn` interface in `frontend/lib/hooks/use-organization-health.ts`
    - Add `retry: () => void` — triggers a manual re-fetch
    - Add `lastFetchedAt: number | null` — `Date.now()` timestamp of last successful fetch
    - _Requirements: 3.3, 3.5, 3.13_

  - [x] 11.2 Implement real API fetch, error handling, and `retry` in `use-organization-health`
    - Replace mock data with `fetch(\`${process.env.NEXT_PUBLIC_API_URL}/analytics/organization-health\`)`
    - On error: set `error` string; keep existing `data` if available (do not clear on auto-refresh failure)
    - `retry()` clears `error` and triggers a new fetch
    - Set `lastFetchedAt = Date.now()` on every successful fetch
    - Validate response shape; default missing fields to `0`
    - _Requirements: 3.3, 3.5_

  - [x] 11.3 Implement auto-refresh every 5 minutes in `use-organization-health`
    - Use `setInterval` inside `useEffect` with 300,000 ms interval
    - Check `Date.now() - lastFetchedAt >= 300_000` before re-fetching (or simply let the interval fire)
    - Clear interval on unmount
    - _Requirements: 3.13_

  - [ ]* 11.4 Write property test for `useOrganizationHealth` data shape invariant (Property 6)
    - **Property 6: useOrganizationHealth always returns data matching the expected shape with successRate in bounds**
    - **Validates: Requirements 3.3, 3.8**
    - Use `fc.record({ successRate: fc.float({ min: 0, max: 100, noNaN: true }), totalVolume30d: fc.float({ min: 0, noNaN: true }), activeProposals: fc.nat() })` to generate mock API responses
    - Mock `fetch` to return the generated data; assert hook `data` conforms to `OrganizationHealthData` shape with `successRate` in `[0, 100]`, `totalVolume30d ≥ 0`, `activeProposals` is a non-negative integer
    - Tag: `// Feature: frontend-enterprise-features, Property 6: useOrganizationHealth shape`

- [ ] 12. Enhance `HealthCard` component
  - [x] 12.1 Add loading skeleton state to `HealthCard` in `frontend/components/dashboard/HealthCard.tsx`
    - While `loading === true`, render 3 animated shimmer skeleton tiles in place of metric values
    - Skeleton tiles match the dimensions of the real metric tiles
    - _Requirements: 3.4_

  - [x] 12.2 Add per-tile error state with Retry button to `HealthCard`
    - When `error` is non-null, render an inline error message and a "Retry" button inside each metric tile area
    - "Retry" button calls `retry()` from `useOrganizationHealth`
    - _Requirements: 3.5_

  - [x] 12.3 Apply formatted values to all three metric tiles in `HealthCard`
    - Success Rate tile: display `formatSuccessRate(data.successRate)` (e.g., `"98.5%"`)
    - Total Volume tile: display `formatUsdValue(data.totalVolume30d)` (already imported)
    - Active Proposals tile: display `Math.floor(data.activeProposals).toString()`
    - Pass `retry` from `useOrganizationHealth` down to the component
    - _Requirements: 3.6, 3.7, 3.8_

  - [ ]* 12.4 Write unit tests for `HealthCard` (`HealthCard.test.tsx`)
    - Renders loading skeleton (3 shimmer tiles) while `loading === true`
    - Renders error state with "Retry" button when `error` is non-null
    - Clicking "Retry" calls `retry()`
    - Renders all three metric tiles with correctly formatted values when data is available
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 13. Build Organization-Health Command Center page
  - [x] 13.1 Create `frontend/app/dashboard/health/page.tsx`
    - Page header: title "Organization Health", subtitle "Disbursement pipeline status across all assets"
    - Render `<GlobalSearch />` component (import from `@/components/globalsearch`)
    - Render `<HealthCard />` below the search bar
    - _Requirements: 3.1, 3.2, 3.9_

  - [x] 13.2 Add "Health" nav item to `frontend/components/dashboard/sidebar.tsx`
    - Add `{ label: "Health", href: "/dashboard/health", icon: Activity }` (import `Activity` from `lucide-react`) to `navItems` array
    - Place it after the "Dashboard" item
    - _Requirements: 3.1_

  - [ ]* 13.3 Write integration tests for the health page (`health-page.test.tsx`)
    - Auto-refresh fires after 5 minutes (use `vi.useFakeTimers()` and advance by 300,000 ms)
    - Navigation link to `/dashboard/health` exists in the sidebar
    - `GlobalSearch` component is present in the health page render
    - _Requirements: 3.1, 3.9, 3.13_

- [x] 14. Checkpoint — Organization-Health Command Center complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Enhance `use-transaction-feed` hook with exponential back-off and new state
  - [x] 15.1 Update `TransactionFeedItem` interface and `UseTransactionFeedReturn` in `frontend/lib/hooks/use-transaction-feed.ts`
    - Export `TransactionFeedItem` interface with fields: `id`, `type` (union of known types + `string`), `description`, `timestamp`, `actor?`, `asset?`, `amount?`, `status?`
    - Add `reconnecting: boolean`, `reconnectAttempt: number`, `connectionLost: boolean` to the return type
    - _Requirements: 4.2, 4.9, 4.10_

  - [x] 15.2 Implement manual exponential back-off reconnection logic in `use-transaction-feed`
    - Initialize Socket.IO with `reconnection: false` to disable built-in reconnection
    - Define `BACKOFF_DELAYS_MS = [1000, 2000, 4000, 8000, 16000]`
    - On `disconnect`: set `reconnecting = true`, iterate through delays using `setTimeout`; on each attempt call `socket.connect()`
    - On successful reconnect: reset `reconnecting = false`, `reconnectAttempt = 0`, `connectionLost = false`
    - After all 5 attempts fail: set `reconnecting = false`, `connectionLost = true`
    - _Requirements: 4.9, 4.10_

  - [x] 15.3 Implement feed state management with 50-item cap in `use-transaction-feed`
    - `transaction-event` handler: `setFeed(prev => [newItem, ...prev].slice(0, 50))`
    - `ledger-confirmation` handler: find item by `id`; if found, update in place; if not found, prepend and slice to 50
    - _Requirements: 4.3, 4.4, 4.8_

  - [ ]* 15.4 Write property tests for feed state management (Properties 7, 8, 10, 11)
    - **Property 7: New feed events are always prepended to the top of the feed**
    - **Validates: Requirements 4.3**
    - **Property 8: Feed never exceeds 50 items regardless of event volume**
    - **Validates: Requirements 4.4**
    - **Property 10: In-place status update never duplicates feed items**
    - **Validates: Requirements 4.8**
    - **Property 11: Reconnection attempts are bounded at exactly 5**
    - **Validates: Requirements 4.9**
    - For P7: use `fc.array(feedItemArb)` as initial state + `fc.record(feedItemArb)` as new item; assert new item is at index 0
    - For P8: use `fc.array(feedItemArb, { minLength: 51, maxLength: 200 })`; simulate N prepend operations; assert `feed.length <= 50`
    - For P10: use `fc.array(feedItemArb, { minLength: 1 })` + a `ledger-confirmation` whose `id` matches an existing item; assert length unchanged and no duplicate ids
    - For P11: simulate up to 10 consecutive disconnect events; assert `reconnectAttempt <= 5` and `connectionLost === true` after exactly 5 failures
    - Tag: `// Feature: frontend-enterprise-features, Property 7`, `Property 8`, `Property 10`, `Property 11`

- [ ] 16. Enhance `TransactionFeed` component
  - [x] 16.1 Update `frontend/components/dashboard/TransactionFeed.tsx` to use enhanced hook state and new pure functions
    - Import `formatFeedDescription` and `formatRelativeTime` (defined in task 1.5 / 1.6)
    - Use `reconnecting`, `connectionLost` from `useTransactionFeed`
    - Replace the existing `formatTimestamp` helper with `formatRelativeTime`
    - Replace the existing description rendering with `formatFeedDescription(item)`
    - _Requirements: 4.5, 4.6, 4.12_

  - [x] 16.2 Add `Pulsing_Icon` for `ledger_confirmation` items in `TransactionFeed`
    - When `item.status === 'ledger_confirmation'`, apply `animate-pulse-border` CSS class to the icon wrapper
    - _Requirements: 4.7_

  - [x] 16.3 Add "Reconnecting…" and "Connection lost" status indicators to `TransactionFeed`
    - When `reconnecting === true`: render a "Reconnecting…" banner with `reconnectAttempt` count (e.g., "Reconnecting… (attempt 2/5)")
    - When `connectionLost === true`: render a "Connection lost — refresh to retry" error banner
    - _Requirements: 4.9, 4.10_

  - [x] 16.4 Add ARIA roles and keyboard accessibility to `TransactionFeed`
    - Wrap the feed container in `<div role="feed" aria-label="Transaction activity feed" aria-busy={loading}>`
    - Wrap each feed item in `<article role="article" tabIndex={0} aria-label={formatFeedDescription(item)}>`
    - Ensure all feed items are reachable via Tab key
    - _Requirements: 4.13_

  - [ ]* 16.5 Write unit tests for `TransactionFeed` (`TransactionFeed.test.tsx`)
    - Renders "Reconnecting…" indicator when `reconnecting === true`
    - Renders "Connection lost — refresh to retry" when `connectionLost === true`
    - `animate-pulse-border` class is applied to items with `status === 'ledger_confirmation'`
    - ARIA: `role="feed"`, `aria-label`, `role="article"` on items, Tab-accessible
    - _Requirements: 4.7, 4.9, 4.10, 4.13_

- [ ] 17. Wire `TransactionFeed` visibility into sidebar collapse state
  - [x] 17.1 Update `frontend/components/dashboard/sidebar.tsx` to hide `TransactionFeed` when collapsed
    - Wrap the existing `<TransactionFeed />` render in `{!collapsed && ( <div className="mt-4"><TransactionFeed /></div> )}`
    - Remove the unconditional `<div className="mt-4"><TransactionFeed /></div>` that currently exists
    - _Requirements: 4.1, 4.11_

  - [ ]* 17.2 Write unit test for sidebar collapse behavior (`TransactionFeed.test.tsx` or `sidebar.test.tsx`)
    - Feed is hidden (not rendered) when sidebar `collapsed === true`
    - Feed is visible when sidebar `collapsed === false`
    - _Requirements: 4.11_

- [x] 18. Final checkpoint — All features complete
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 5, 10, 14, and 18 ensure incremental validation between features
- Property tests use `@fast-check/vitest` with a minimum of 100 iterations per property
- Each property test is tagged with `// Feature: frontend-enterprise-features, Property N: <description>`
- The implementation order (Branding → Stress Test → Health → Live Feed) minimizes cross-feature dependencies
- `react-leaflet` and `react-leaflet-markercluster` must be installed if not already present; use `next/dynamic` with `ssr: false` for the map component
- `@tanstack/react-virtual` must be installed if not already present for `RecipientGrid`
