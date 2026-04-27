# Quick Start: Swipe-to-Approve

## 🚀 Getting Started in 3 Steps

### Step 1: Components Are Already Integrated

The swipe feature is **automatically enabled** on mobile devices. No additional setup required!

The existing `PendingApprovalQueue` component now shows:
- **Mobile (< 768px)**: Swipeable cards with haptic feedback
- **Desktop (≥ 768px)**: Traditional button interface

### Step 2: Test on Mobile

```bash
# Start the dev server
cd frontend
npm run dev

# Open browser to http://localhost:3000

# Option 1: Physical mobile device
# - Access via your local network IP
# - Try swiping right to approve

# Option 2: Chrome DevTools
# - F12 → Toggle device toolbar (Ctrl+Shift+M)
# - Select iPhone 12 Pro or similar
# - Swipe with mouse/touch
```

### Step 3: Test Biometric Confirmation

1. Find a high-value transaction (≥ $10,000)
2. Swipe right on mobile
3. Biometric modal appears automatically
4. Authenticate with Face ID / Touch ID / Fingerprint
5. Approval submits automatically

## 📱 Usage Patterns

### For End Users

**Approve Transaction (Mobile)**:
1. Open Multi-Sig queue on mobile
2. Find pending transaction
3. Swipe card RIGHT → Transaction approved
4. If high-value → Complete biometric check

**Reject Transaction (Mobile)**:
1. Swipe card LEFT → Transaction rejected
2. *(Note: Can be disabled in code if needed)*

**Desktop Users**:
- Use traditional "Sign Now" button
- No swipe gestures on desktop

### For Developers

**Import Components**:
```tsx
import { SwipeCard } from "@/components/dashboard/SwipeCard";
import { SwipeApprovalQueue } from "@/components/dashboard/SwipeApprovalQueue";
import { BiometricConfirmation } from "@/components/dashboard/BiometricConfirmation";
```

**Use SwipeCard Directly**:
```tsx
<SwipeCard
  stream={pendingStream}
  isSigning={false}
  onApprove={async () => {
    await approveTransaction(stream.id);
  }}
  onReject={async () => {
    await rejectTransaction(stream.id);
  }}
  signedCount={2}
  enableSwipe={true}
/>
```

**Use Full Queue**:
```tsx
import SwipeApprovalQueue from "@/components/dashboard/SwipeApprovalQueue";

export default function ApprovalsPage() {
  return <SwipeApprovalQueue />;
}
```

## 🔧 Configuration

### Change High-Value Threshold

```typescript
// File: frontend/components/dashboard/SwipeCard.tsx
// Line: ~30

const HIGH_VALUE_THRESHOLD = 10000; // Change this value (USD)
```

### Adjust Swipe Sensitivity

```typescript
// File: frontend/components/dashboard/SwipeCard.tsx
// Line: ~29

const SWIPE_THRESHOLD = 120; // Lower = easier to trigger
```

### Disable Swipe Temporarily

```tsx
<SwipeCard
  enableSwipe={false} // Disables swipe, uses button only
  // ... other props
/>
```

## 🧪 Testing Checklist

### Mobile Testing
- [ ] Swipe right approves low-value transaction
- [ ] Swipe right triggers biometric for high-value
- [ ] Swipe left rejects transaction
- [ ] Incomplete swipe snaps back to center
- [ ] Haptic feedback fires on swipe
- [ ] APPROVE/REJECT badges appear during swipe
- [ ] Card animates out after approval
- [ ] Progress bar updates correctly

### Desktop Testing
- [ ] Traditional "Sign Now" button visible
- [ ] No swipe gestures on desktop
- [ ] All existing functionality works
- [ ] "Swipe Enabled" badge shows in header

### Biometric Testing
- [ ] Modal shows transaction details
- [ ] Face ID / Touch ID prompt appears
- [ ] Success auto-submits approval
- [ ] Failure shows error message
- [ ] Cancel returns to card

### Edge Cases
- [ ] Already signed cards show "Signed" badge
- [ ] Fully signed cards show "Ready" badge
- [ ] Expiring cards show "Urgent" badge
- [ ] High-value cards show "High Value" badge
- [ ] Conflict cards show restart option
- [ ] Empty queue shows empty state

## 🐛 Troubleshooting

### Swipe Not Working on Mobile

**Check**:
1. Browser supports touch events (all modern browsers do)
2. `enableSwipe` prop is `true`
3. Card is not already signed
4. No JavaScript errors in console

**Fix**:
```tsx
// Ensure enableSwipe is true
<SwipeCard enableSwipe={true} ... />
```

### Haptic Feedback Not Working

**Check**:
1. Device supports Vibration API (Android yes, iOS no)
2. Browser permission granted
3. Not in power-saving mode

**Note**: iOS Safari doesn't support Vibration API, but this is expected. The feature gracefully degrades.

### Biometric Modal Not Appearing

**Check**:
1. Transaction amount >= HIGH_VALUE_THRESHOLD
2. WebAuthn is available (check browser console)
3. User has biometric set up on device
4. Secure context (HTTPS or localhost)

**Debug**:
```typescript
import { isWebAuthnAvailable } from "@/lib/webauthn-quick-sign";

console.log("WebAuthn available:", isWebAuthnAvailable());
```

## 📖 More Documentation

- **Full Technical Docs**: `docs/SWIPE_TO_APPROVE_IMPLEMENTATION.md`
- **Implementation Summary**: `SWIPE_TO_APPROVE_SUMMARY.md`
- **WebAuthn Details**: `frontend/lib/webauthn-quick-sign.ts`
- **Haptic Feedback**: `frontend/lib/haptic-feedback.ts`

## ✨ That's It!

The swipe-to-approve feature is production-ready and requires **zero configuration** to start using. Just access the Multi-Sig queue on a mobile device and start swiping!

---

**Need Help?** Check the full documentation or contact the development team.
