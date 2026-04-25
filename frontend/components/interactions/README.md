# Elastic Micro-interaction Library

**Issue:** #520  
**Status:** Implementation Ready (Awaiting Figma Prototypes)

Physics-based micro-interactions for Nebula V2, implementing spring animations and tactile feedback patterns.

---

## Components

### 1. `<LongPressRadialMenu>`
Circular menu that appears on long-press, with spring-based expansion.

```tsx
import LongPressRadialMenu from "@/components/interactions/long-press-radial-menu";

<LongPressRadialMenu
  items={[
    { id: 'withdraw', label: 'Withdraw', onSelect: handleWithdraw },
    { id: 'cancel', label: 'Cancel', onSelect: handleCancel },
    { id: 'topup', label: 'Top Up', onSelect: handleTopUp },
    { id: 'share', label: 'Share', onSelect: handleShare },
  ]}
  radius={120}
  longPressThreshold={400}
>
  <StreamCard {...streamData} />
</LongPressRadialMenu>
```

**Features:**
- 400ms long-press threshold (configurable)
- Radial item positioning with spring physics
- Touch/mouse drag selection
- Haptic feedback on supported devices
- Automatic cleanup and accessibility support

---

### 2. `<BloomAnimationWrapper>`
Elastic "bloom" effect for success states and new content.

```tsx
import BloomAnimationWrapper from "@/components/interactions/bloom-animation-wrapper";

<BloomAnimationWrapper 
  show={streamCreated}
  duration={800}
  onAnimationComplete={() => console.log('Bloomed!')}
>
  <StreamCard {...newStream} />
</BloomAnimationWrapper>
```

**Features:**
- Scale: 0.3 → 1.05 → 1.0 (elastic overshoot)
- Blur fade-in effect
- Glow pulse animation
- Customizable colors and timing

---

### 3. `<MilestoneGlowEffect>`
Subtle glow when numeric values cross milestone thresholds.

```tsx
import MilestoneGlowEffect from "@/components/interactions/milestone-glow-effect";

<MilestoneGlowEffect 
  value={balance}
  milestones={[1000, 10000, 100000]}
  glowColor="rgba(0, 245, 255, 0.8)"
>
  <StreamingBalanceCard {...props} />
</MilestoneGlowEffect>
```

**Features:**
- Automatic milestone detection
- Prevents duplicate triggers
- Haptic feedback on mobile
- Respects reduced motion preferences

---

## Spring Presets

Import pre-configured spring physics for consistent motion:

```tsx
import { ELASTIC_PRESETS, getSpringConfig } from "@/components/interactions/elastic-presets";

// Use directly with Framer Motion
<motion.div
  animate={{ scale: 1.1 }}
  transition={{ type: "spring", ...ELASTIC_PRESETS.snappy }}
/>

// Or with reduced motion support
const springConfig = getSpringConfig("bouncy");
```

**Available Presets:**
- `gentle` - Fluid motion for cards, panels (stiffness: 120)
- `snappy` - Responsive buttons, toggles (stiffness: 300)
- `bouncy` - Playful success states (stiffness: 200)
- `precise` - Controlled counters, data (stiffness: 180)
- `dramatic` - Attention-grabbing alerts (stiffness: 250)

---

## Accessibility

All components automatically respect `prefers-reduced-motion`:

```tsx
// Animations are instant for users who prefer reduced motion
const duration = getAnimationDuration(800); // Returns 0 if reduced motion
const spring = getSpringConfig("gentle"); // Returns instant config if reduced motion
```

---

## Performance

- **Target:** 60fps during all animations
- **Budget:** < 100ms for critical interactions
- **Optimization:** Uses `will-change` and GPU acceleration
- **Cleanup:** Automatic timer and listener cleanup

---

## Testing

Run visual regression tests:
```bash
npm run test:interactions
```

Test on throttled CPU:
```bash
# Chrome DevTools: Performance tab → CPU: 4x slowdown
```

---

## Next Steps

1. **Figma Phase** (In Progress)
   - Create interactive prototypes
   - Export animation parameters
   - Share for stakeholder review

2. **Integration Phase**
   - Add to existing StreamCard components
   - Integrate with streaming balance counter
   - Test on mobile devices

3. **Polish Phase**
   - Fine-tune spring values based on user feedback
   - Add more interaction patterns
   - Document in design system

---

## References

- [Figma Prototype](https://figma.com/...) - TBD
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Spring Physics Guide](https://www.framer.com/motion/transition/#spring)
