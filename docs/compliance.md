# Compliance Guide — Identity-Gated Splits (Issue #633)

The V3 Splitter enforces a **verification gate** on every fund distribution.
Only addresses on the `VerifiedUsers` whitelist can receive funds.

---

## How It Works

### VerifiedUsers Whitelist

Each address has a boolean status stored in **persistent storage**
(`DataKey::VerifiedUsers(Address)`). Persistent storage survives ledger TTL
expiry, ensuring the whitelist is never silently lost.

```
DataKey::VerifiedUsers(Address)  →  bool   (persistent)
DataKey::StrictMode              →  bool   (instance)
```

The contract admin manages the list via:

```rust
set_verification_status(env, user: Address, status: bool)
set_strict_mode(env, strict: bool)
```

Both functions require the admin's auth signature.

---

## strict_mode Behaviour

### strict_mode = true

Every recipient in the `split()` call is checked before any token transfer
occurs. If **any single recipient** is unverified, the entire transaction
reverts with `Error::RecipientNotVerified`. No funds move.

```
recipients: [Alice ✅, Bob ❌, Carol ✅]
strict_mode: true
→ PANIC — Error::RecipientNotVerified
→ Alice and Carol receive nothing
```

Use this mode when regulatory compliance requires a hard guarantee that funds
never touch an unverified address.

### strict_mode = false (default)

Unverified recipients are silently skipped. Their shares are **redistributed
proportionally** among the verified recipients so the full distributable amount
is always paid out.

```
recipients: [Alice 40% ✅, Bob 20% ❌, Carol 40% ✅]
strict_mode: false
→ verified_bps = 8000
→ Alice new_share = 40% * 10000/8000 = 50%
→ Carol new_share = 40% * 10000/8000 = 50%
→ Alice receives 50% of distributable
→ Carol receives 50% of distributable
→ Bob receives nothing
```

If **no** recipients are verified, the transaction reverts with
`Error::NoVerifiedRecipients` regardless of mode.

---

## Managing the VerifiedUsers List

### Add a verified user

```typescript
await splitter.set_verification_status({
  user: "GABC...",
  status: true,
});
```

### Remove a verified user

```typescript
await splitter.set_verification_status({
  user: "GABC...",
  status: false,
});
```

### Check status

```typescript
const verified = await splitter.is_verified({ address: "GABC..." });
```

### Toggle strict mode

```typescript
await splitter.set_strict_mode({ strict: true });
```

---

## Protocol Fee Interaction

The protocol fee is deducted **before** the verification check distributes
funds. The fee always goes to the treasury regardless of verification status.

```
total_amount = 1,000,000
fee_bps      = 100  (1%)
fee          = 10,000  → treasury
distributable = 990,000  → split among verified recipients
```

---

## Error Reference

| Error | Code | Cause |
|---|---|---|
| `RecipientNotVerified` | 3 | strict_mode=true and at least one recipient is unverified |
| `NoVerifiedRecipients` | 4 | Non-strict mode but zero recipients are verified |
| `InvalidSplit` | 5 | `share_bps` values don't sum to exactly 10000 |

---

## Security Notes

- Only the **instance admin** (set at `initialize`) can modify verification
  statuses or toggle strict mode.
- The owner and any `extra_admins` passed at initialization are **automatically
  verified** — they can always receive funds.
- Persistent storage ensures the whitelist survives ledger archival. Operators
  should still monitor TTL and bump entries as needed for very long-lived
  deployments.
