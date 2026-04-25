# Feature: Hardware Wallet Confirm on Device Modal

## Overview

Implemented UI state handling for signing large transactions on hardware wallets that require scrolling through the device's screen. This feature provides users with clear instructions and an extended transaction timeout when using hardware wallets.

---

## Technical Implementation

### 1. ConfirmOnDeviceModal Component

**File:** `frontend/components/confirm-on-device-modal.tsx`

A specialized modal component that displays:
- Hardware wallet detection with device icon
- Step-by-step instructions (Check Device → Review Details → Confirm)
- Visual indicators for large transactions with scrolling guidance
- Countdown timer with warning state at 25% remaining time
- Progress bar showing time remaining
- Animated scrolling chevron indicator for large transactions
- Automatic timeout handling with retry option

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `walletType?: "hardware" | "software"` - Wallet type for styling
- `deviceName?: string` - Display name of the hardware device
- `timeoutSeconds?: number` - Timeout duration in seconds (default: 120)
- `isLargeTransaction?: boolean` - Shows scrolling instructions if true
- `onTimeout?: () => void` - Called when timeout expires
- `onConfirmed?: () => void` - Called when user confirms on device

### 2. useHardwareWalletTimeout Hook

**File:** `frontend/lib/hooks/use-hardware-wallet-timeout.ts`

Custom React hook for managing hardware wallet transaction timeouts.

**Features:**
- Automatic hardware wallet type detection (Ledger, Trezor, Blockto, Lattice)
- Large transaction detection (>2KB by default, configurable)
- 120-second timeout for hardware wallets (vs. 30 seconds for software)
- Modal state management
- Transaction size tracking

**Configuration:**
```typescript
interface HardwareWalletConfig {
  standardTimeout: number;           // 30s (default)
  hardwareTimeout: number;           // 120s (default)
  largeTransactionThreshold: number; // 2KB (default)
}
```

**Returned Methods:**
- `getTimeout(): TransactionTimeout` - Get current timeout config
- `openConfirmModal(deviceName: string)` - Open the modal
- `closeConfirmModal()` - Close the modal
- `prepareForSigning(txnXdr: string)` - Analyze transaction and show modal if needed

### 3. Integration in Create Stream Page

**File:** `frontend/app/dashboard/create-stream/page.tsx`

The hook is integrated into the transaction signing flow:

```typescript
// Initialize hook
const {
  confirmModalOpen,
  activeDeviceName,
  closeConfirmModal,
  prepareForSigning,
  getTimeout,
} = useHardwareWalletTimeout();

// In handleSign:
const { timeoutMs, isHardwareWallet, isLargeTransaction } = getTimeout();
prepareForSigning(mockXdrTransaction);
```

---

## UI/UX Features

### Modal Appearance

- **Backdrop:** Semi-transparent black with blur effect
- **Card:** Rounded with glassmorphic styling (white/[0.08] gradient)
- **Color Scheme:** Cyan/blue accents for primary UI, yellow for large transaction warnings, red for expiration

### Visual Hierarchy

1. **Header Section:**
   - Hardware wallet icon in cyan (HardDrive icon)
   - Device name display
   - Clear title: "Confirm on Device"

2. **Instructions:**
   - Numbered steps with visual indicators
   - Specific guidance for large transactions
   - Animated scrolling chevron for large txns

3. **Timer:**
   - Digital countdown display (MM:SS)
   - Progress bar with color transition (cyan → red at 25%)
   - Warning state styling when time is running out

4. **Expired State:**
   - Alert icon in red
   - Clear message about timeout
   - Retry button to restart the process

### Animation

- Modal entrance: Spring animation (scale + opacity)
- Timer updates: Linear progress bar animation
- Scrolling indicator: Continuous subtle up-down animation
- All transitions: Smooth 200-300ms durations

---

## Security Considerations

1. **Extended Timeout:** 120 seconds accommodates:
   - Large transaction analysis on device
   - Scrolling through multiple screens
   - User deliberation time
   - Network latency

2. **Clear Instructions:** Users see exactly what to do:
   - What to look for on the device
   - When to approve/deny
   - How to handle large transactions

3. **Timeout Handling:** Sessions that exceed timeout:
   - Show clear expiration message
   - Offer retry option
   - Prevent hanging UI state

4. **Transaction Size Detection:** Helps identify:
   - Potentially complex transactions
   - Need for additional review time
   - When scrolling will likely be required

---

## Testing Checklist

- [x] Modal displays correctly when hardware wallet is detected
- [x] Timer counts down accurately
- [x] Progress bar updates smoothly
- [x] Color transitions at 25% threshold work
- [x] Large transaction detection triggers scrolling indicator
- [x] Timeout handler called when timer expires
- [x] Retry button works on expired state
- [x] Modal closes on successful confirmation
- [x] Modal closes on timeout
- [x] Device name displays correctly
- [x] Animation transitions are smooth

---

## Future Enhancements

- Device-specific instructions based on wallet type
- Multi-language support for instructions
- Display actual transaction details for review
- Blockchain network display
- Fee information in modal
- QR code generation for offline devices

---

## Labels

- `[Frontend] Security Medium`

---

## PR Details

**Related Issue:** Hardware wallet UI states for large transactions  
**Type:** Security Enhancement  
**Scope:** Frontend - Transaction Signing UX  
**Breaking Changes:** None
