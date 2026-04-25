# PR: Governance Proposal Bridge to Splitter (Closes #70)

## Title

`feat(frontend): governance proposal bridge to auto-populate splitter (closes #70)`

---

## Overview

This PR implements a bridge that fetches approved Governance Proposal data and automatically populates the Splitter recipient fields with approved recipients. It adds UI, hook, error handling, and integration logic. This addresses issue #70 and is intended to close it when merged.

---

## Changes

- New hook: `frontend/lib/hooks/use-governance-proposal-fetcher.ts`
- New component: `frontend/components/load-proposal-data-button.tsx`
- Splitter integration in `frontend/app/dashboard/create-stream/page.tsx`
- Added `closes #70` mention in branch and PR title

---

## Files created

- `frontend/lib/hooks/use-governance-proposal-fetcher.ts`
- `frontend/components/load-proposal-data-button.tsx`
- `GOVERNANCE_PROPOSAL_BRIDGE_PR.md`
- `PR_DESCRIPTION_CLOSES_70.md`

---

## Files modified

- `frontend/app/dashboard/create-stream/page.tsx`

---

## Summary

- Fetch approved proposals from Governance API: `/api/v3/governance/proposals?status=approved`
- Dropdown UI in Splitter header to select approved proposal
- Load proposal recipient list, validate addresses, convert share_bps to percent
- Auto-fill Splitter split settings
- Includes full frontend integration and user-facing workflow

---

## Labels

- `[Frontend] Integration Medium`

---

## Closes

- closes #70
