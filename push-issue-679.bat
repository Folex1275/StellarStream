# Push Script for Issue #679 Implementation
# Run this in a terminal with git installed

# Navigate to the project directory
cd "c:/github repo/StellarStream"

# Add all new files
git add frontend/lib/hooks/use-quorum-check.ts
git add frontend/lib/hooks/index.ts
git add frontend/components/governance/ProposeTransactionButton.tsx
git add frontend/components/dashboard/QuorumBulkDispatchPanel.tsx
git add backend/src/api/governance.routes.ts

# Commit the changes
git commit -m "feat(frontend): Implement Quorum-Check Pre-Submission Logic (Issue #679)

- Add useQuorumCheck hook to fetch account signers and threshold from Stellar RPC
- Add ProposeTransactionButton component for multi-sig transactions
- Add QuorumBulkDispatchPanel with integrated quorum check
- Add POST /governance/proposals endpoint to backend API"

# Push to origin
git push origin main

# Or if you're on a different branch:
# git push origin develop
