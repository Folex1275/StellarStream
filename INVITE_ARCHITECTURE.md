# Team Member Invitation Landing Page - Architecture Diagram

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SYSTEMS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  EMAIL SERVICE              FREIGHTER WALLET        STELLAR BLOCKCHAIN  │
│  ┌────────────┐            ┌──────────────┐        ┌─────────────────┐  │
│  │ Invitation │            │   Browser    │        │ SEP-10 Anchored │  │
│  │   Email    │            │  Extension   │        │  Token Network  │  │
│  │ Token Link │            │  (ES256)     │        │                 │  │
│  └────────────┘            └──────────────┘        └─────────────────┘  │
│         │                         │                        ▲             │
└─────────┼─────────────────────────┼────────────────────────┼─────────────┘
          │                         │                        │
          ▼                         ▼                        ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │                    FRONTEND LAYER (Next.js 14)                       │
    ├──────────────────────────────────────────────────────────────────────┤
    │                                                                        │
    │  URL: /invite/[token]                                               │
    │  ┌──────────────────────────────────────────────────────────────┐   │
    │  │  InviteLandingPage Component                                 │   │
    │  │  ┌────────────────────────────────────────────────────────┐  │   │
    │  │  │ 1. Load Invite Data                                    │  │   │
    │  │  │    GET /api/v3/org/invites/[token]                    │  │   │
    │  │  └────────────────────────────────────────────────────────┘  │   │
    │  │                                                               │   │
    │  │  ┌────────────────────────────────────────────────────────┐  │   │
    │  │  │ 2. Render Three-Column Layout                          │  │   │
    │  │  │    ├─ InviteOrgCard                                    │  │   │
    │  │  │    │  └─ Org name, logo, inviter, date               │  │   │
    │  │  │    ├─ RolePreviewCard                                 │  │   │
    │  │  │    │  └─ Admin/Accountant/Viewer permissions         │  │   │
    │  │  │    └─ VerificationCard (sticky)                       │  │   │
    │  │  │       └─ Connect wallet, Accept/Reject buttons       │  │   │
    │  │  └────────────────────────────────────────────────────────┘  │   │
    │  │                                                               │   │
    │  │  ┌────────────────────────────────────────────────────────┐  │   │
    │  │  │ 3. Wallet Context (useWallet)                         │  │   │
    │  │  │    ├─ address: Connected wallet address              │  │   │
    │  │  │    ├─ isConnected: Boolean                           │  │   │
    │  │  │    └─ connectFreighter(): Connect wallet             │  │   │
    │  │  └────────────────────────────────────────────────────────┘  │   │
    │  │                                                               │   │
    │  │  ┌────────────────────────────────────────────────────────┐  │   │
    │  │  │ 4. SEP-10 Verification Flow                           │  │   │
    │  │  │    a) POST /api/v3/org/invites/challenge            │  │   │
    │  │  │       └─ Response: { nonce, challenge, TTL }         │  │   │
    │  │  │                                                        │  │   │
    │  │  │    b) signTransaction(nonce) in Freighter           │  │   │
    │  │  │       └─ User signs with private key                │  │   │
    │  │  │                                                        │  │   │
    │  │  │    c) POST /api/v3/org/invites/[token]/accept      │  │   │
    │  │  │       ├─ Payload: { address, nonce, signature }    │  │   │
    │  │  │       └─ Response: { status, role, joinedAt }       │  │   │
    │  │  └────────────────────────────────────────────────────────┘  │   │
    │  │                                                               │   │
    │  │  ┌────────────────────────────────────────────────────────┐  │   │
    │  │  │ 5. Success → Redirect to Dashboard                    │  │   │
    │  │  │    setTimeout(() => router.push('/dashboard'), 2s)   │  │   │
    │  │  └────────────────────────────────────────────────────────┘  │   │
    │  │                                                               │   │
    │  └──────────────────────────────────────────────────────────────┘   │
    │                                                                      │
    │  State Management:                                                  │
    │  ├─ status: "loading" | "ready" | "authenticating" | ...          │
    │  ├─ inviteData: { orgName, role, ...}                             │
    │  ├─ error: String                                                  │
    │  └─ Animations: framer-motion                                      │
    │                                                                     │
    └──────────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
            [API ROUTES]     [DATABASE]       [REDIS CACHE]
                │                 │                 │
    ┌───────────┴─────────────────┴─────────────────┴──────────────┐
    │          BACKEND LAYER (Node.js/Express)                    │
    ├────────────────────────────────────────────────────────────┤
    │                                                             │
    │  API Routes (Next.js API Routes):                         │
    │                                                             │
    │  GET /api/v3/org/invites/[token]                          │
    │  ├─ Query: SELECT * FROM invites WHERE id = token         │
    │  └─ Response: { ok, invite: {...} }                       │
    │                                                             │
    │  POST /api/v3/org/invites/challenge                       │
    │  ├─ Input: { address, inviteToken }                       │
    │  ├─ Generate: nonce = randomBytes(32)                     │
    │  ├─ Store: redis.setex(`challenge:${address}`, 300, ...) │
    │  └─ Response: { nonce, challenge, expiresIn }             │
    │                                                             │
    │  POST /api/v3/org/invites/[token]/accept                  │
    │  ├─ Input: { address, nonce, signature }                  │
    │  ├─ Verify: Call /api/v1/auth/verify                      │
    │  ├─ Verify: address === invite.recipient                  │
    │  ├─ Create: INSERT into org_members (...)                 │
    │  ├─ Audit: INSERT into audit_log (...)                    │
    │  ├─ Notify: Send email to admin + user                    │
    │  └─ Response: { ok, message, data }                       │
    │                                                             │
    │  POST /api/v3/org/invites/[token]/reject                  │
    │  ├─ Update: invites.status = 'rejected'                   │
    │  ├─ Audit: audit_log.log('reject')                        │
    │  └─ Response: { ok, message }                             │
    │                                                             │
    │  Store (org-invite-store.ts):                             │
    │  ├─ findInviteByToken(token) → PendingInvite              │
    │  ├─ acceptInvite(token, address) → Updates status         │
    │  ├─ rejectInvite(token) → Updates status                  │
    │  └─ createInvite(orgId, recipient, role) → New invite     │
    │                                                             │
    └────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
                ▼                 ▼                 ▼
            [PostgreSQL]     [Redis]          [Email Service]
                │                 │                 │
    ┌───────────┴─────────────────┴─────────────────┴──────────────┐
    │          DATA LAYER & EXTERNAL SERVICES                     │
    ├────────────────────────────────────────────────────────────┤
    │                                                             │
    │  PostgreSQL Database:                                      │
    │  ├─ org_invites                                            │
    │  │  ├─ id (PK): "inv_abc123"                              │
    │  │  ├─ org_id (FK): "org_123"                             │
    │  │  ├─ recipient: "GAAAA..." or "user@email.com"         │
    │  │  ├─ role: "Admin" | "Accountant" | "Viewer"           │
    │  │  ├─ status: "pending" | "accepted" | "rejected"       │
    │  │  ├─ created_at: TIMESTAMP                             │
    │  │  ├─ accepted_at: TIMESTAMP NULL                       │
    │  │  ├─ accepted_by: VARCHAR NULL                         │
    │  │  └─ expires_at: TIMESTAMP                             │
    │  │                                                         │
    │  ├─ org_members                                           │
    │  │  ├─ id (PK)                                           │
    │  │  ├─ org_id (FK)                                       │
    │  │  ├─ address (UNIQUE): "GAAAA..."                     │
    │  │  ├─ role: "Admin" | "Accountant" | "Viewer"          │
    │  │  └─ joined_at: TIMESTAMP                             │
    │  │                                                        │
    │  └─ audit_log                                            │
    │     ├─ id (PK)                                           │
    │     ├─ invite_id (FK)                                    │
    │     ├─ action: "created" | "accepted" | "rejected"      │
    │     ├─ actor_address: VARCHAR                           │
    │     └─ created_at: TIMESTAMP                            │
    │                                                           │
    │  Redis Cache:                                             │
    │  ├─ invite:challenge:{address} → { nonce, TTL: 300 }   │
    │  └─ invite:token:{token} → Cached invite data          │
    │                                                           │
    │  Email Service (Sendgrid/Mailgun):                       │
    │  ├─ Send: Invite email with link                        │
    │  ├─ Send: Welcome email on acceptance                   │
    │  └─ Send: Admin notification                            │
    │                                                           │
    └────────────────────────────────────────────────────────────┘
```

## 🔄 Detailed Request/Response Flow

### 1. Load Invite Details
```
┌─────────────────────────────────────────────────────────────┐
│ Browser: GET /api/v3/org/invites/inv_abc123              │
├─────────────────────────────────────────────────────────────┤
│ Server: Query Database                                      │
│   SELECT * FROM org_invites WHERE id = 'inv_abc123'       │
├─────────────────────────────────────────────────────────────┤
│ Response:                                                    │
│ {                                                           │
│   "ok": true,                                              │
│   "invite": {                                              │
│     "id": "inv_abc123",                                    │
│     "orgId": "org_123",                                    │
│     "orgName": "Acme Corp",                                │
│     "orgLogo": "https://...",                              │
│     "recipient": "GAAAA...",                               │
│     "role": "Accountant",                                  │
│     "invitedAt": "2024-04-26T10:30:00Z",                  │
│     "invitedBy": "Jane Smith"                              │
│   }                                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### 2. Generate Challenge (SEP-10)
```
┌─────────────────────────────────────────────────────────────┐
│ Browser: POST /api/v3/org/invites/challenge               │
│ Body:                                                       │
│ {                                                           │
│   "inviteToken": "inv_abc123",                             │
│   "address": "GBTST3LVLZGZ2..."                            │
│ }                                                           │
├─────────────────────────────────────────────────────────────┤
│ Server:                                                     │
│   1. Generate nonce = randomBytes(32)                      │
│   2. Generate challenge = randomBytes(16)                  │
│   3. redis.setex(`challenge:${address}`, 300, {nonce})   │
├─────────────────────────────────────────────────────────────┤
│ Response:                                                   │
│ {                                                           │
│   "ok": true,                                              │
│   "nonce": "a7f3b2e9c1d4f6...",                            │
│   "challenge": "x1y2z3a4b5c6...",                          │
│   "expiresIn": 300                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Freighter Wallet:                                           │
│   1. Display signature request                             │
│   2. User approves                                         │
│   3. Sign message with private key                         │
│   4. Return signature (XDR)                                │
└─────────────────────────────────────────────────────────────┘
```

### 3. Accept Invitation
```
┌─────────────────────────────────────────────────────────────┐
│ Browser: POST /api/v3/org/invites/inv_abc123/accept      │
│ Body:                                                       │
│ {                                                           │
│   "address": "GBTST3LVLZGZ2...",                           │
│   "nonce": "a7f3b2e9c1d4f6...",                            │
│   "signature": "AAAA...XDR..."                             │
│ }                                                           │
├─────────────────────────────────────────────────────────────┤
│ Server:                                                     │
│   1. Call /api/v1/auth/verify                             │
│      └─ Validates signature against nonce                │
│      └─ Returns verified address                         │
│                                                             │
│   2. Verify address matches invite recipient              │
│      └─ IF NOT MATCH: Return 403 Forbidden               │
│                                                             │
│   3. Query: SELECT * FROM org_invites WHERE id = token   │
│      └─ IF NOT EXISTS: Return 404                        │
│      └─ IF ALREADY USED: Return 409 Conflict             │
│                                                             │
│   4. Create org membership:                               │
│      INSERT into org_members (                            │
│        org_id, address, role, joined_at                  │
│      ) VALUES (...)                                       │
│                                                             │
│   5. Update invite:                                       │
│      UPDATE org_invites SET                               │
│        status = 'accepted',                              │
│        accepted_at = NOW(),                              │
│        accepted_by = address                             │
│      WHERE id = token                                     │
│                                                             │
│   6. Log action:                                          │
│      INSERT into audit_log (...)                          │
│                                                             │
│   7. Send emails:                                         │
│      - Welcome email to user                             │
│      - Notification to admin                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Response:                                                   │
│ {                                                           │
│   "ok": true,                                              │
│   "message": "Invitation accepted successfully",           │
│   "data": {                                                │
│     "orgId": "org_123",                                    │
│     "role": "Accountant",                                  │
│     "joinedAt": "2024-04-26T10:35:00Z"                    │
│   }                                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Success Screen + Auto-Redirect                    │
│   1. Show: "Welcome to Acme Corp!"                         │
│   2. Wait: 2 seconds                                       │
│   3. Redirect: router.push('/dashboard')                   │
└─────────────────────────────────────────────────────────────┘
```

## 🛡️ Security Checkpoints

```
Entry Point: Email Link
     ▼
✓ Validate Token Exists & Not Expired
     ▼
✓ Display Org Info (Build Trust)
     ▼
✓ User Connects Wallet
     ▼
✓ Generate Unique Challenge (Nonce)
     ▼
✓ User Signs Challenge in Wallet
     ▼
✓ Verify Signature Matches Nonce
     ▼
✓ Verify Address Matches Recipient
     ▼
✓ Create Membership & Mark Invite Used
     ▼
✓ Audit Log Entry
     ▼
Success: User Added to Organization
```

## 📊 Data Model Relationships

```
organizations (1) ──────────────────── (N) org_invites
     │                                      │
     │                                      ├─ id
     │                                      ├─ org_id (FK)
     │                                      ├─ recipient
     │                                      ├─ role
     │                                      ├─ status
     │                                      └─ timestamps
     │
     └──────────────────────────── (N) org_members
                                       │
                                       ├─ id
                                       ├─ org_id (FK)
                                       ├─ address (UNIQUE)
                                       ├─ role
                                       └─ joined_at

audit_log (N) ────────────────────── (1) org_invites
     │
     ├─ id
     ├─ invite_id (FK)
     ├─ action
     ├─ actor_address
     └─ created_at
```

## 🔐 Verification Pipeline

```
Input: { address, nonce, signature }
  │
  ├─ Step 1: Redis Lookup
  │  └─ redis.get(`challenge:${address}`) → stored_nonce
  │     └─ IF NULL: Expired or not found → ERROR 401
  │     └─ IF EXPIRED: TTL exceeded → ERROR 401
  │
  ├─ Step 2: Signature Verification (ED25519)
  │  └─ ed25519.verify(publicKey, message, signature)
  │     └─ IF INVALID: Bad signature → ERROR 401
  │
  ├─ Step 3: Invite Lookup
  │  └─ db.query(`SELECT * FROM org_invites WHERE id = ?`)
  │     └─ IF NULL: Not found → ERROR 404
  │     └─ IF status !== 'pending': Already used → ERROR 409
  │
  ├─ Step 4: Address Matching
  │  └─ IF address !== invite.recipient → ERROR 403
  │
  ├─ Step 5: Create Membership
  │  └─ db.insert(org_members) with { org_id, address, role }
  │     └─ IF UNIQUE CONSTRAINT FAIL: Already member → ERROR 409
  │
  ├─ Step 6: Mark Invite Used
  │  └─ db.update(org_invites) status = 'accepted'
  │
  ├─ Step 7: Audit Log
  │  └─ db.insert(audit_log) { action: 'accepted', ... }
  │
  └─ Result: { ok: true, data: {...} } → 200 OK
```

## 🎯 Component Tree

```
<html>
  <body>
    <WalletProvider>
      <StellarProvider>
        <ProtocolStatusProvider>
          <Nav />
          <main>
            <InviteLandingPage>
              ├─ <motion.div> (Header: "You're Invited")
              │
              ├─ <motion.div> (3-column layout)
              │  │
              │  ├─ <motion.div> (Left column)
              │  │  ├─ <InviteOrgCard>
              │  │  │  ├─ Org logo (Image)
              │  │  │  ├─ Org name heading
              │  │  │  ├─ Invited by info
              │  │  │  └─ Trust badge
              │  │  │
              │  │  └─ <RolePreviewCard>
              │  │     ├─ Role badge
              │  │     ├─ Permissions grid
              │  │     └─ Footer note
              │  │
              │  └─ <motion.div> (Right column - sticky)
              │     ├─ Wallet status indicator
              │     ├─ Connected address (copyable)
              │     ├─ Connect wallet button
              │     ├─ Accept button
              │     ├─ Decline button
              │     └─ Error message (conditional)
              │
              └─ <motion.div> (Footer: Expiration info)
          </main>
          <Footer />
          <ToastProvider />
        </ProtocolStatusProvider>
      </StellarProvider>
    </WalletProvider>
  </body>
</html>
```

## 📱 Responsive Breakpoints

```
MOBILE (< 768px)        TABLET (768px - 1024px)    DESKTOP (> 1024px)
┌─────────────────┐    ┌──────────────────────┐   ┌──────────────────────┐
│ Header          │    │ Header               │   │ Header               │
├─────────────────┤    ├──────────────────────┤   ├──────────────────────┤
│ OrgCard         │    │ OrgCard | Verification│   │ OrgCard | Verification
├─────────────────┤    ├──────────────────────┤   │         |            │
│ RoleCard        │    │ RoleCard            │   │ RoleCard|            │
├─────────────────┤    ├──────────────────────┤   │         | (sticky)   │
│ Verification    │    │                      │   │         |            │
│                 │    │                      │   │         |            │
└─────────────────┘    └──────────────────────┘   └──────────────────────┘
  Full width           2 columns                    3 columns (1:2:1 ratio)
  Stacked             Responsive grid               Sidebar navigation
```

---

**Diagram Status**: Complete Architecture Overview  
**Last Updated**: April 26, 2026
