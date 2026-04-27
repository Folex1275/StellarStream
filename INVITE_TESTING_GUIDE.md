# Team Member Invitation Landing Page - Testing & Usage Guide

## 🧪 Testing the Implementation

### Prerequisites
- Node.js 18+
- Stellar testnet wallet (Freighter)
- Local dev server running
- Backend API accessible

### Quick Test Scenario

#### 1. Create an Invite (Backend)
```typescript
// Using the invite store
import { createInvite } from "@/lib/server/org-invite-store";

const invite = createInvite(
  "org_acme_123",
  "user@example.com",
  "Accountant"
);

console.log(`Invite token: ${invite.id}`);
// Output: Invite token: inv_a8f7e2b1
```

#### 2. Access Landing Page
```
Open in browser:
http://localhost:3000/invite/inv_a8f7e2b1
```

#### 3. Expected Behavior

**Page Load:**
- ✅ Invite details load (org name, role, inviter)
- ✅ Role preview shows "Accountant" permissions
- ✅ Wallet connection button visible
- ✅ Accept/Decline buttons ready

**Connect Wallet:**
- ✅ Click "Connect Wallet"
- ✅ Freighter popup appears
- ✅ Approve connection
- ✅ Address displays with copy button

**Accept Invitation:**
- ✅ Click "Accept Invitation"
- ✅ Button shows "Verifying..."
- ✅ Freighter popup for signing
- ✅ Approve signature
- ✅ Success screen displays
- ✅ Auto-redirect to dashboard

### Manual API Testing

#### Test: Get Invite Details
```bash
curl -X GET http://localhost:3000/api/v3/org/invites/inv_a8f7e2b1
```

**Expected Response:**
```json
{
  "ok": true,
  "invite": {
    "id": "inv_a8f7e2b1",
    "orgId": "org_acme_123",
    "orgName": "Acme Corporation",
    "orgLogo": "https://...",
    "recipient": "GAAAA...",
    "role": "Accountant",
    "invitedAt": "2024-04-26T10:30:00Z",
    "invitedBy": "Jane Smith"
  }
}
```

#### Test: Generate Challenge
```bash
curl -X POST http://localhost:3000/api/v3/org/invites/challenge \
  -H "Content-Type: application/json" \
  -d '{
    "inviteToken": "inv_a8f7e2b1",
    "address": "GAAAA..."
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "nonce": "a7f3b2e9c1d4f6h8j9k0l1m2n3o4p5q6",
  "challenge": "x1y2z3a4b5c6d7e8",
  "expiresIn": 300
}
```

#### Test: Accept Invitation
```bash
curl -X POST http://localhost:3000/api/v3/org/invites/inv_a8f7e2b1/accept \
  -H "Content-Type: application/json" \
  -d '{
    "address": "GAAAA...",
    "nonce": "a7f3b2e9c1d4f6h8j9k0l1m2n3o4p5q6",
    "signature": "signedTxXdr..."
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "message": "Invitation accepted successfully",
  "data": {
    "orgId": "org_acme_123",
    "role": "Accountant",
    "joinedAt": "2024-04-26T10:35:00Z"
  }
}
```

#### Test: Reject Invitation
```bash
curl -X POST http://localhost:3000/api/v3/org/invites/inv_a8f7e2b1/reject
```

**Expected Response:**
```json
{
  "ok": true,
  "message": "Invitation declined successfully"
}
```

## 🎬 Complete User Journey Test

### Setup
1. Create two test wallets with Freighter
2. Create organization in your app
3. Get a Stellar testnet address for invitee

### Test Steps

**Step 1: Admin Creates Invite**
```typescript
const invite = createInvite(
  "org_test_123",
  "GBTST3LVLZGZ2HYDJQAQBWHW2S4GVWSMJ6LXHDVLMKP67ZCBLPPWKCV",
  "Admin"
);
// invite.id = "inv_xyz789"
```

**Step 2: Send Invite Link**
- Share: `https://yourapp.com/invite/inv_xyz789`

**Step 3: User Clicks Link**
- Browser loads landing page
- Page displays:
  - ✅ Organization name: "Test Org"
  - ✅ Role: "Admin"
  - ✅ Permissions list
  - ✅ Connect Wallet button

**Step 4: User Connects Wallet**
- Click "Connect Wallet"
- Select correct wallet from Freighter
- Approve connection
- Address appears in verification card

**Step 5: User Signs Challenge**
- Click "Accept Invitation"
- Backend generates challenge
- Freighter shows signature request
- User approves signature
- Frontend sends signature to backend

**Step 6: Backend Verification**
- Verifies signature validity
- Confirms address matches recipient
- Creates org membership record
- Assigns "Admin" role
- Returns success

**Step 7: Success & Redirect**
- Success screen shows "Welcome to Test Org"
- Page waits 2 seconds
- Redirects to `/dashboard`

## 🔍 Browser DevTools Testing

### Console Logs Expected
```javascript
// Step 1: Load invite
Invite loaded: { id: "inv_xyz789", role: "Admin", ... }

// Step 2: Connect wallet
Wallet connected: GBTST3LVLZGZ2HYDJQAQBWHW2S4GVWSMJ6LXHDVLMKP67ZCBLPPWKCV

// Step 3: Request challenge
Challenge received: { nonce: "...", expiresIn: 300 }

// Step 4: Sign and send
Signature: AAAAAgAAACo...
Sending accept request...

// Step 5: Success
Accept response: { ok: true, role: "Admin", ... }
Redirecting to dashboard in 2 seconds...
```

### Network Tab Expected Requests
```
GET  /api/v3/org/invites/inv_xyz789         200 OK
POST /api/v3/org/invites/challenge          200 OK
POST /api/v3/org/invites/inv_xyz789/accept  200 OK
GET  /dashboard                             200 OK (redirect)
```

## ✅ Test Cases Checklist

### UI Rendering
- [ ] Page loads without errors
- [ ] Org card displays logo/name
- [ ] Role preview shows correct permissions
- [ ] All buttons are clickable
- [ ] Mobile responsive layout works
- [ ] Animations play smoothly

### Wallet Connection
- [ ] Connect Wallet button works
- [ ] Freighter popup appears
- [ ] Address displays after connection
- [ ] Copy address button works
- [ ] Wallet status indicator updates

### Verification Flow
- [ ] Challenge API returns nonce
- [ ] Signature request sent to wallet
- [ ] Accept button disabled until signed
- [ ] Success state shows after verification
- [ ] Redirect happens automatically

### Error Handling
- [ ] Invalid token shows error
- [ ] Bad signature shows error
- [ ] Address mismatch shows error
- [ ] Network errors handled gracefully
- [ ] Error messages are helpful

### State Management
- [ ] Loading state shows spinner
- [ ] Authenticating state shows progress
- [ ] Success state shows correct message
- [ ] Rejected state shows confirmation
- [ ] Back buttons work from error states

## 🐛 Debugging Tips

### Check Invite Store
```typescript
import { findInviteByToken, listPendingInvites } from "@/lib/server/org-invite-store";

// Find specific invite
const invite = findInviteByToken("inv_xyz789");
console.log("Invite:", invite);

// List all pending
const all = listPendingInvites("org_test_123");
console.log("All invites:", all);
```

### Monitor Network Calls
Open DevTools → Network tab and filter:
```
/api/v3/org/invites
```

### Check Component Props
Add React DevTools browser extension to inspect:
- `InviteLandingPage` state
- `InviteOrgCard` props
- `RolePreviewCard` role value

### Verify Wallet Context
```typescript
const { address, isConnected } = useWallet();
console.log("Connected:", isConnected);
console.log("Address:", address);
```

## 📊 Performance Testing

### Page Load Time
```bash
# Use Lighthouse
npx lighthouse http://localhost:3000/invite/inv_test --view
```

Expected metrics:
- First Paint: < 1s
- Largest Contentful Paint: < 2s
- Time to Interactive: < 3s

### Bundle Size
```bash
npm run build
# Check .next/static/chunks/app/invite...
```

Expected: < 100KB for invite page

## 🔒 Security Testing

### Test 1: Address Mismatch
```bash
# Invite for address A
# Connect with wallet B
# Should see: "Address does not match"
```

### Test 2: Replay Attack
```bash
# Sign challenge once
# Try to use same signature again
# Should fail: "Nonce expired"
```

### Test 3: Expired Challenge
```bash
# Get challenge
# Wait 5+ minutes
# Try to verify
# Should fail: "Challenge expired"
```

### Test 4: Invalid Token
```
Visit: http://localhost:3000/invite/invalid_token
Should show: "Invite not found or expired"
```

### Test 5: Already Accepted
```bash
# Accept invite once
# Try to accept again with same token
# Should fail: "Invite already used"
```

## 📈 User Acceptance Testing

### Scenario 1: Happy Path
- ✅ Create invite
- ✅ Send to user
- ✅ User accepts on first try
- ✅ Added to org successfully

### Scenario 2: Wrong Wallet
- ✅ User tries with wrong wallet
- ✅ See address mismatch error
- ✅ Connect correct wallet
- ✅ Accept works second time

### Scenario 3: Mobile User
- ✅ Open link on mobile
- ✅ Page responsive and readable
- ✅ Wallet connection works
- ✅ Accept flow completes

### Scenario 4: Slow Network
- ✅ Show loading states
- ✅ Handle timeouts gracefully
- ✅ Allow retries
- ✅ Clear error messages

## 🚀 Production Readiness

Before deploying to production:

- [ ] Database persistence implemented
- [ ] Redis nonce storage configured
- [ ] Email notifications set up
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] Error monitoring (Sentry) enabled
- [ ] Performance optimizations done
- [ ] Security audit completed
- [ ] Accessibility audit passed
- [ ] Load testing completed (>1000 concurrent)

## 📋 Test Report Template

```markdown
# Invitation Landing Page Test Report

Date: [Date]
Tester: [Name]
Environment: [Dev/Staging/Production]

## Results Summary
- Tests Passed: X/Y
- Critical Issues: 0
- Minor Issues: 0

## Test Cases
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Load invite | Data displays | ✓ | ✓ |
| Connect wallet | Address shows | ✓ | ✓ |
| Accept invite | Success screen | ✓ | ✓ |

## Issues Found
(List any issues)

## Performance Metrics
- Page Load: XXms
- Interaction: XXms
- Redirect Time: XXms

## Approved for Deployment: ✓ YES
```

## 🎓 Test Data

### Sample Invite
```json
{
  "id": "inv_test_001",
  "orgId": "org_acme_123",
  "orgName": "Acme Corporation",
  "orgLogo": "https://api.dicebear.com/7.x/initials/svg?seed=AC",
  "recipient": "GBTST3LVLZGZ2HYDJQAQBWHW2S4GVWSMJ6LXHDVLMKP67ZCBLPPWKCV",
  "role": "Accountant",
  "invitedAt": "2024-04-26T10:30:00Z",
  "invitedBy": "Jane Smith"
}
```

### Sample Testnet Addresses
```
Inviter: GCKYABNFN7J34GZXYHHQFJ3LPKBWYKWYW22JFMLTLVN4N6QXRJZCEGKX
Invitee: GBTST3LVLZGZ2HYDJQAQBWHW2S4GVWSMJ6LXHDVLMKP67ZCBLPPWKCV
Viewer:  GBRPYHIL2CI3WHZDTOOQFC6EB4CGQOFSNQB4HVMPL67YLMRGAVRJQF5
```

---

**Testing Status**: Ready for QA  
**Last Updated**: April 26, 2026
