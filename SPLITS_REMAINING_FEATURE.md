# Gas Tank - Splits Remaining Feature

## Overview
A utility that calculates and displays the approximate number of splits that can be performed based on the current XLM balance in the contract's gas buffer.

## Implementation

### 📄 Files Created/Modified

1. **`frontend/lib/use-splits-remaining.ts`** (NEW)
   - Custom React hook that calculates remaining splits
   - Uses the `useGasAdvisor` hook to get average split cost
   - Formula: `approximateSplits = Floor(balanceXlm / averageCostXlm)`
   - Handles loading and error states

2. **`frontend/components/gas-tank.tsx`** (MODIFIED)
   - Integrated `useSplitsRemaining` hook
   - Added CSS styling for splits indicator
   - Added JSX display element in the Gas Tank UI

3. **`frontend/__tests__/use-splits-remaining.test.ts`** (NEW)
   - Unit tests for the utility hook
   - Integration examples
   - Real-world scenario tests

### 🧮 The Mathematics

The utility implements the simple formula specified in the task:

```
Approximate Splits = Current XLM Balance / Average Split Cost
```

**Example:**
- Balance: 3.42 XLM
- Average Split Cost: 0.245 XLM (derived from historical disbursement data)
- Result: `floor(3.42 / 0.245)` = **14 splits**

**Display:**
```
Approx. 14 splits
```

### 🎨 UI Integration

The splits remaining indicator is displayed in the Gas Tank component:

**Location:** Below the XLM balance display, above the warning badge

**Visual Design:**
- `.splits-remaining` class with cyan gradient background
- Monospace font for the numerical value (consistent with balance display)
- Small uppercase labels
- Full width of the Gas Tank container

**Example Display:**
```
3.42
XLM
─────────────────
Approx.  14 splits
─────────────────
⚠ Low Balance
```

### 🔄 Data Flow

1. **Gas Tank Component** fetches the user's XLM balance
2. **useSplitsRemaining Hook** is called with the balance
3. Hook uses **useGasAdvisor** to fetch disbursement history
4. Calculates: `balance / averageCostXlm`
5. Returns `approximateSplits` to Gas Tank component
6. Component displays: `"Approx. X splits remaining"`

### 👥 User Experience

**Sender's Perspective:**
- At a glance, see how many more payment splits they can perform
- Helps plan refills before running out of gas
- No need to do manual calculations

**Example Use Cases:**
- "I have enough gas for 14 more employee payouts"
- "I need 25 more splits, so I need to refill" (if currently showing 10)
- "Running low on gas" (when showing 0-2 splits)

### ⚙️ Technical Details

- **Hook:** `useSplitsRemaining(currentBalanceXlm: number): SplitsRemainingResult`
- **Returns:**
  - `approximateSplits`: number (calculated splits)
  - `averageCostXlm`: number (average cost per split)
  - `balanceXlm`: number (current balance)
  - `isLoading`: boolean (data fetching state)
  - `error`: string | null (error message if failed)

- **Dependencies:**
  - `useGasAdvisor` hook (for average cost calculation)
  - React hooks: `useMemo`

- **Memoization:** Results are memoized to prevent unnecessary recalculations

### 🧪 Testing

Unit tests cover:
- Basic calculations (zero balance, typical balance, high balance)
- Edge cases (negative prevention, rounding)
- Real-world scenarios (warning threshold, low balance)
- Display formatting
- Loading and error states

Run tests with:
```bash
npm test -- use-splits-remaining.test.ts
```

### 📦 Dependencies

- No new external dependencies added
- Leverages existing:
  - `useGasAdvisor` hook
  - React hooks (useState, useEffect, useMemo)
  - Framer Motion (for animations)

### 🚀 Performance

- **Calculation:** O(1) time complexity (simple division)
- **Memory:** Minimal overhead (single memoized value)
- **Updates:** Only when balance or advisor data changes
- **Renders:** Optimized with React.useMemo

### 📝 Labels
✅ [Frontend] - React component integration
✅ [UX-Logic] - User-facing utility calculation
✅ [Easy] - Simple mathematical formula with straightforward implementation

## Next Steps (Optional Enhancements)

1. **Tooltip:** Add hover tooltip showing average cost and time-to-depleted
2. **Warnings:** Different colors based on remaining splits threshold
   - Green: 50+ splits
   - Yellow: 10-50 splits
   - Red: 0-10 splits
3. **Historical Tracking:** Show trend in splits available over time
4. **Notifications:** Alert user when approaching zero splits
5. **Mobile Optimization:** Responsive display on smaller screens
