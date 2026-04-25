# Requirements Document

## Introduction

The Clawback Warning System adds compliance-aware UI to the StellarStream create-stream flow. When a user selects a Stellar regulated asset that has the `clawback_enabled` flag set by its issuer, the asset selector must display a "Regulated Asset" badge and the stream creation flow must surface a prominent warning explaining that the issuer retains the right to claw back (reclaim) streamed funds at any time. This protects users from unknowingly streaming assets under issuer-controlled revocation conditions.

## Glossary

- **Regulated_Asset**: A Stellar asset whose issuer account has the `AUTH_CLAWBACK_ENABLED_FLAG` set, meaning the issuer can invoke the `clawback` operation to reclaim tokens from any holder.
- **Clawback**: A Stellar protocol operation that allows an asset issuer to reclaim tokens from a holder's account, even after they have been transferred.
- **Asset_Selector**: The grid of asset buttons in Step 1 of the create-stream wizard (`frontend/app/dashboard/create-stream/page.tsx`), and the reusable `TokenSelector` dropdown component (`frontend/components/token-selector.tsx`).
- **Clawback_Warning_Banner**: A dismissible UI element displayed in the create-stream flow when a regulated asset is selected, explaining the clawback risk.
- **Regulated_Asset_Badge**: A small visual label ("Regulated" or "⚠ Regulated") rendered on an asset card or list item when the asset is a Regulated_Asset.
- **Horizon_API**: The Stellar Horizon REST API used to query on-chain asset and account data, including issuer flags.
- **Asset_Metadata**: A data structure combining an asset's code, issuer, name, icon, balance, and a boolean `clawbackEnabled` flag.

---

## Requirements

### Requirement 1: Asset Clawback Flag Detection

**User Story:** As a developer, I want the frontend to detect whether a Stellar asset has clawback enabled, so that the UI can surface appropriate warnings to users.

#### Acceptance Criteria

1. THE Asset_Metadata SHALL include a `clawbackEnabled` boolean field for every asset presented in the Asset_Selector.
2. WHEN an asset has an issuer account, THE System SHALL query the Horizon_API to determine whether the issuer's `AUTH_CLAWBACK_ENABLED_FLAG` is set.
3. WHEN the Horizon_API returns issuer account data with `flags.auth_clawback_enabled` equal to `true`, THE System SHALL set `clawbackEnabled` to `true` for that asset.
4. WHEN the Horizon_API request fails or times out, THE System SHALL set `clawbackEnabled` to `false` and continue rendering without blocking the UI.
5. THE System SHALL treat native XLM as having `clawbackEnabled` equal to `false` at all times, as XLM cannot have clawback enabled.

---

### Requirement 2: Regulated Asset Badge in the Asset Selector

**User Story:** As a user, I want to see a "Regulated Asset" badge on assets that have clawback enabled in the asset selector, so that I am aware of the asset's regulated status before selecting it.

#### Acceptance Criteria

1. WHEN an asset in the Asset_Selector has `clawbackEnabled` equal to `true`, THE Asset_Selector SHALL render a Regulated_Asset_Badge on that asset's card or list item.
2. THE Regulated_Asset_Badge SHALL be visually distinct from the asset name and balance, using an amber/orange color consistent with the existing warning palette (`border-orange-400`, `text-orange-300`).
3. WHEN an asset in the Asset_Selector has `clawbackEnabled` equal to `false`, THE Asset_Selector SHALL NOT render a Regulated_Asset_Badge for that asset.
4. THE Regulated_Asset_Badge SHALL be visible in both the grid-style asset selector on the create-stream page and the dropdown-style `TokenSelector` component.
5. WHEN the Regulated_Asset_Badge is rendered, THE Asset_Selector SHALL remain fully interactive and allow the user to select the regulated asset.

---

### Requirement 3: Clawback Risk Tooltip on the Regulated Asset Badge

**User Story:** As a user, I want to read a brief explanation of clawback risk when I hover over the Regulated Asset badge, so that I understand what "regulated" means before I proceed.

#### Acceptance Criteria

1. WHEN a user hovers over or focuses the Regulated_Asset_Badge, THE System SHALL display a tooltip explaining that the asset issuer can reclaim tokens from any holder using the Stellar clawback operation.
2. THE tooltip SHALL include the text "The issuer of this asset can reclaim (claw back) tokens from your account at any time using the Stellar clawback operation."
3. WHEN the user moves focus or the pointer away from the Regulated_Asset_Badge, THE System SHALL hide the tooltip.
4. THE tooltip SHALL be rendered above or below the badge without overflowing the viewport, using the same glass-card visual style (`bg-[#030303]/95 backdrop-blur-xl border border-white/10`) as the existing `TokenSelector` dropdown.
5. THE tooltip SHALL be accessible via keyboard focus and SHALL include `role="tooltip"` and a matching `aria-describedby` attribute on the badge trigger.

---

### Requirement 4: Clawback Warning Banner in the Create-Stream Flow

**User Story:** As a user, I want to see a prominent warning when I have selected a regulated asset in the create-stream wizard, so that I can make an informed decision before signing the transaction.

#### Acceptance Criteria

1. WHEN a user selects a Regulated_Asset in Step 1 of the create-stream wizard, THE System SHALL display a Clawback_Warning_Banner in Step 1 below the asset grid.
2. THE Clawback_Warning_Banner SHALL use the existing orange warning visual style (`border-orange-400/20 bg-orange-400/[0.05]`) consistent with the immutability warning already present in Step 3.
3. THE Clawback_Warning_Banner SHALL contain the text: "This is a regulated asset. The issuer can reclaim streamed funds from the recipient's account at any time using the Stellar clawback operation."
4. WHEN a user deselects a Regulated_Asset or selects a non-regulated asset, THE System SHALL hide the Clawback_Warning_Banner.
5. WHEN the selected asset is a Regulated_Asset and the user reaches Step 3 (Review & Sign), THE System SHALL display an additional clawback risk notice alongside the existing immutability warning.
6. THE Step 3 clawback risk notice SHALL include the asset symbol and the text: "Clawback enabled — the issuer may reclaim [ASSET] from the recipient at any time."

---

### Requirement 5: Regulated Asset Badge in the TokenSelector Component

**User Story:** As a user, I want the reusable token selector dropdown to also show the Regulated Asset badge, so that the warning is consistent across all asset selection surfaces in the app.

#### Acceptance Criteria

1. THE `Token` type in `token-selector.tsx` SHALL be extended with an optional `clawbackEnabled` boolean field.
2. WHEN a `Token` with `clawbackEnabled` equal to `true` is rendered in the `TokenSelector` dropdown list, THE TokenSelector SHALL render a Regulated_Asset_Badge next to the token name.
3. WHEN a `Token` with `clawbackEnabled` equal to `true` is the selected token shown in the trigger button, THE TokenSelector SHALL render a small Regulated_Asset_Badge next to the token code in the trigger button.
4. WHEN a `Token` does not have `clawbackEnabled` set or it is `false`, THE TokenSelector SHALL render the token without any badge.

---

### Requirement 6: Accessibility and Non-Blocking Behavior

**User Story:** As a user with assistive technology, I want the clawback warnings to be accessible, so that I receive the same risk information as sighted users.

#### Acceptance Criteria

1. THE Regulated_Asset_Badge SHALL include an `aria-label` of "Regulated asset — clawback enabled" so screen readers announce the badge.
2. THE Clawback_Warning_Banner SHALL include `role="alert"` so screen readers announce it when it appears.
3. WHEN the Clawback_Warning_Banner is displayed, THE System SHALL NOT prevent the user from proceeding with stream creation.
4. WHEN the Clawback_Warning_Banner is displayed, THE System SHALL NOT require the user to explicitly dismiss or acknowledge it before advancing to the next step.
