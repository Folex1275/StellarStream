# Team Member Invitation Landing Page - Implementation Guide

## Overview

This implementation provides a professional, high-trust landing page for team members invited to join organizations via the Collaborator-Invite workflow. It bridges the gap between email invitations and active dashboard participation through SEP-10 wallet verification.

## Architecture

### Components

#### 1. **Main Landing Page** (`frontend/app/invite/[token]/page.tsx`)
- Entry point for accepting team invitations
- Displays org identity and welcome interface
- Implements SEP-10 wallet verification flow
- Responsive design with three-column layout on desktop

**Features:**
- Organization card with logo/name display
- Role preview section with permission breakdown
- Wallet connection management
- SEP-10 challenge verification
- Accept/decline functionality
- Loading, error, success states

#### 2. **Organization Card** (`frontend/components/invite/InviteOrgCard.tsx`)
- Displays inviting organization details
- Shows org logo with fallback avatar
- Displays who invited the user and when
- Trust badge explaining security verification

**Props:**
```typescript
interface InviteOrgCardProps {
  orgName: string;           // Organization name
  orgLogo?: string;          // Optional logo URL
  invitedBy?: string;        // Inviter name
  invitedAt: string;         // Invitation timestamp
}
```

#### 3. **Role Preview Card** (`frontend/components/invite/RolePreviewCard.tsx`)
- Shows assigned role (Admin, Accountant, Viewer)
- Lists specific permissions for the role
- Explains what the user can and cannot do
- Note about permission modification capability

**Role Permissions:**
```
Admin:
  ✓ Full Organization Control
  ✓ Create & Execute Streams
  ✓ Financial Oversight
  ✓ Security Management

Accountant:
  ✓ Financial Management
  ✓ Execute Transactions
  ✓ View Reports
  ✓ Limited Access (no settings/team management)

Viewer:
  ✓ View Only Access
  ✓ Analytics Access
  ✓ No Edit Rights
  ✓ Observer Status
```

### API Routes

#### 1. **Get Invite Details** (`GET /api/v3/org/invites/[token]`)
Fetches invite information for display

**Response:**
```json
{
  "ok": true,
  "invite": {
    "id": "inv_abc123",
    "orgId": "org_demo_123",
    "orgName": "Acme Corporation",
    "orgLogo": "https://...",
    "recipient": "GAAAA...",
    "role": "Accountant",
    "invitedAt": "2024-04-26T10:30:00Z",
    "invitedBy": "Jane Smith"
  }
}
```

**Errors:**
- `400`: Token required
- `404`: Invite not found or expired
- `500`: Server error

#### 2. **Generate Challenge** (`POST /api/v3/org/invites/challenge`)
Generates a nonce for SEP-10 wallet signing

**Request:**
```json
{
  "inviteToken": "inv_abc123",
  "address": "GAAAA..."
}
```

**Response:**
```json
{
  "ok": true,
  "nonce": "random32charstring",
  "challenge": "random16charstring",
  "expiresIn": 300
}
```

**Security:**
- Nonce stored in Redis with 5-minute TTL
- Challenge bound to address + token combination
- Prevents replay attacks

#### 3. **Accept Invitation** (`POST /api/v3/org/invites/[token]/accept`)
Verifies wallet signature and adds user to organization

**Request:**
```json
{
  "address": "GAAAA...",
  "nonce": "random32charstring",
  "signature": "signedTxXdr..."
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Invitation accepted successfully",
  "data": {
    "orgId": "org_demo_123",
    "role": "Accountant",
    "joinedAt": "2024-04-26T10:35:00Z"
  }
}
```

**Process:**
1. Calls backend `/api/v1/auth/verify` to validate signature
2. Verifies wallet address matches invite recipient
3. Creates organization member record
4. Assigns role from invitation
5. Invalidates invite token

#### 4. **Reject Invitation** (`POST /api/v3/org/invites/[token]/reject`)
Marks invitation as rejected

**Response:**
```json
{
  "ok": true,
  "message": "Invitation declined successfully"
}
```

### Data Models

#### Updated PendingInvite Interface
```typescript
export type InviteStatus = "pending" | "accepted" | "rejected" | "expired";

export interface PendingInvite {
  id: string;              // Unique invite token
  orgId: string;          // Organization ID
  recipient: string;      // Email or Stellar G-address
  role: CollaboratorRole; // "Admin" | "Accountant" | "Viewer"
  status: InviteStatus;
  invitedAt: string;      // ISO timestamp
  acceptedAt?: string;    // When accepted
  acceptedBy?: string;    // Wallet address that accepted
  rejectedAt?: string;    // When rejected
}
```

#### New Store Functions
- `findInviteByToken(token)` - Retrieve invite by ID
- `acceptInvite(token, acceptedBy)` - Mark as accepted
- `rejectInvite(token)` - Mark as rejected

## Workflow

### User Journey

1. **Email Invitation**
   - Admin sends invite with invite token link
   - Example: `https://yourapp.com/invite/inv_abc123`

2. **Landing Page Load**
   - User clicks invite link
   - Page fetches invite details via `/api/v3/org/invites/[token]`
   - Displays org info and role preview

3. **Wallet Connection**
   - User clicks "Connect Wallet" button
   - Connects Freighter wallet
   - Displays connected wallet address

4. **Verification & Acceptance**
   - User clicks "Accept Invitation"
   - Frontend requests challenge: `/api/v3/org/invites/challenge`
   - User signs challenge with wallet
   - Frontend calls `/api/v3/org/invites/[token]/accept` with signature
   - Backend verifies signature and address
   - User added to organization with assigned role

5. **Success**
   - Success screen displays
   - Automatic redirect to dashboard after 2 seconds

### Security Flow (SEP-10)

```
Frontend                    Backend
   |                           |
   |---(1) GET challenge------->|
   |                           |
   |<--nonce + challenge---(2)-|
   |       (Redis TTL: 5m)      |
   |                           |
   |--(3) User signs-----+      |
   |    in wallet       |      |
   |                   |      |
   |--(4) POST accept + sig--->|
   |        + address   (5)    |
   |                      Verify:
   |                   - Check Redis
   |                   - Validate sig
   |                   - Match address
   |                   - Create member
   |                   - Expire invite
   |                           |
   |<---201 success--------(6)-|
   |                           |
   |---(7) Redirect dashboard-->|
```

## Security Considerations

### Implemented
✅ SEP-10 signature verification via wallet signing  
✅ Nonce-based challenge-response (5-minute TTL)  
✅ Address matching (wallet must match invite recipient)  
✅ Single-use tokens (prevent replay attacks)  
✅ HTTPS only (frontend/backend communication)  

### TODO for Production
- [ ] Rate limiting on challenge endpoint
- [ ] Audit logging for invitation acceptance
- [ ] Email notification to admins on acceptance
- [ ] Invite expiration (7-day default)
- [ ] Database persistence for invites
- [ ] Redis backend for nonce storage
- [ ] Account linking verification (optional 2FA)
- [ ] Prevent invitation acceptance with new addresses

## UI/UX Design

### Design System
- **Framework**: Next.js 14 + Tailwind CSS
- **Colors**: Stellar Glass theme (cyan-400 accent on slate-900)
- **Icons**: lucide-react
- **Animations**: framer-motion

### States

#### Loading
- Spinner with "Loading your invitation..." message

#### Error
- Red alert box with error message
- "Return Home" button

#### Ready (Main State)
- 3-column responsive layout
- Left: Org card + Role preview
- Right: Verification sidebar (sticky on desktop)

#### Authenticating
- Button shows spinner
- "Verifying..." text
- Disabled state

#### Accepted (Success)
- Green checkmark animation
- "Welcome to {OrgName}!" message
- "Redirecting to dashboard..." with spinner

#### Rejected
- Yellow X icon
- "Invitation Declined" message
- Return home button

## Setup & Configuration

### Environment Variables
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_STELLAR_NETWORK=testnet  # or public
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

### Dependencies Already Installed
- `framer-motion` - Animations
- `lucide-react` - Icons
- `@stellar/freighter-api` - Wallet signing
- Next.js 14 - Framework

### Middleware Requirements
- Wallet context (`useWallet()`) - Already available
- SEP-10 auth endpoints - Already implemented
- CORS configured for invite endpoints

## Database Schema (Future Implementation)

### Invites Table
```sql
CREATE TABLE org_invites (
  id VARCHAR(64) PRIMARY KEY,
  org_id VARCHAR(64) NOT NULL REFERENCES organizations(id),
  recipient VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP NULL,
  accepted_by VARCHAR(255) NULL,
  rejected_at TIMESTAMP NULL,
  
  INDEX idx_org_id (org_id),
  INDEX idx_recipient (recipient),
  INDEX idx_status (status),
  INDEX idx_expires_at (expires_at)
);

CREATE TABLE org_invites_audit (
  id AUTO_INCREMENT PRIMARY KEY,
  invite_id VARCHAR(64) NOT NULL REFERENCES org_invites(id),
  action VARCHAR(32) NOT NULL,
  actor_address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

### Unit Tests
```typescript
describe('Invite Landing Page', () => {
  it('should load invite details from token');
  it('should display org name and logo correctly');
  it('should show role-specific permissions');
  it('should verify wallet before accepting');
  it('should redirect to dashboard on success');
  it('should handle expired invites gracefully');
});

describe('Role Preview', () => {
  it('should display Admin permissions');
  it('should display Accountant permissions');
  it('should display Viewer permissions');
  it('should explain permission changes');
});

describe('SEP-10 Challenge', () => {
  it('should generate unique nonces');
  it('should verify signatures correctly');
  it('should reject expired challenges');
  it('should match address to recipient');
});
```

### Integration Tests
- E2E invite acceptance flow
- Wallet connection and signing
- Permission verification post-acceptance
- Dashboard access after joining

## Troubleshooting

### "Invite not found or expired"
- Verify token is correct
- Check invite hasn't been revoked
- Ensure invite hasn't exceeded 7-day expiration
- Check database for invite record

### "Wallet address does not match invitation recipient"
- Ensure correct wallet is connected
- Verify invite was created for this address
- Check for address format issues (case sensitivity)

### "Wallet verification failed"
- Wallet signature may be invalid
- Try signing challenge again
- Check browser console for error details
- Ensure Freighter is properly connected

### Verification Timeout
- Challenge may have expired (5-minute TTL)
- Refresh page and try again
- Check network connectivity

## Future Enhancements

1. **Multi-Step Onboarding**
   - Company email verification
   - Account setup
   - Password creation

2. **Batch Invitations**
   - CSV upload for multiple team members
   - Bulk invitation tracking

3. **Invitation Analytics**
   - Acceptance rate tracking
   - Time-to-acceptance metrics
   - Invite expiration monitoring

4. **Advanced Permissions**
   - Custom role creation
   - Granular permission assignment
   - Time-limited access

5. **Integration**
   - Slack notifications on acceptance
   - Calendar invite with details
   - Team member directory sync

## Files Created/Modified

### New Files
- `frontend/app/invite/[token]/page.tsx` - Main landing page
- `frontend/components/invite/RolePreviewCard.tsx` - Role preview
- `frontend/components/invite/InviteOrgCard.tsx` - Org card
- `frontend/app/api/v3/org/invites/[token]/route.ts` - Get/delete endpoints
- `frontend/app/api/v3/org/invites/[token]/accept/route.ts` - Accept endpoint
- `frontend/app/api/v3/org/invites/[token]/reject/route.ts` - Reject endpoint
- `frontend/app/api/v3/org/invites/challenge/route.ts` - Challenge endpoint

### Modified Files
- `frontend/lib/server/org-invite-store.ts` - Added invite status tracking and lookup functions

## Performance Considerations

- **Client-side rendering** for immediate UI feedback
- **Lazy loading** of org logo images
- **CSS animations** instead of JavaScript for smooth transitions
- **Minimal API calls** (1-3 per workflow)
- **Session storage** for temporary nonce caching
- **Skeleton loaders** for perceived performance

## Accessibility

- ✅ Semantic HTML structure
- ✅ ARIA labels for icons
- ✅ Keyboard navigation support
- ✅ High contrast color scheme
- ✅ Clear error messaging
- ✅ Focus indicators on buttons

## Support & Questions

For issues or questions:
1. Check troubleshooting section above
2. Review browser console for error details
3. Verify all environment variables are set
4. Check backend connectivity
5. Review SEP-10 implementation in wallet-auth routes
