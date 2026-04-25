# Elastic Micro-interaction Library Specification

**Issue:** #520  
**Status:** Design Phase → Implementation Ready  
**Priority:** Hard  
**Category:** [Figma] Prototyping

---

## Overview

Define the tactile "feel" of the Nebula V2 interface through physics-based micro-interactions. This spec bridges Figma prototypes to production-ready Framer Motion implementations.

---

## 1. Long-Press Radial Menu (Stream Card)

### Interaction Flow
1. **Touch Start** - User presses and holds on a stream card
2. **Threshold** - After 400ms, radial menu begins to emerge
3. **Expansion** - Menu options bloom outward in a circular pattern
4. **Selection** - User drags to an option, releases to confirm
5. **Collapse** - Menu contracts back to origin point

### Figma Prototype Requirements
- **Trigger:** Long-press gesture (400ms threshold)
- **Animation:** Smart Animate with spring physics
- **Menu Items:** 4-6 radial options (Withdraw, Cancel, Top-up, Share, etc.)
- **Visual Feedback:** 
  - Haptic-style pulse on threshold
  - Glow intensity increases during hold
  - Selected option scales up 1.15x

### Implementation Parameters (Framer Motion)
```typescript
const radialMenuSpring = {
  type: "spring",
  stiffness: 300,
  damping: 25,
  mass: 0.8
};

const longPressThreshold = 400; // ms
const radialRadius = 120; // px from center
```

---

## 2. Stream Card "Bloom" Animation (Success State)

### Interaction Flow
1. **Creation Confirmed** - Transaction succeeds on-chain
2. **Spawn Point** - Card materializes from center of viewport
3. **Bloom** - Card scales from 0.3x to 1.0x with elastic overshoot
4. **Settle** - Gentle bounce as it settles into position
5. **Glow Pulse** - Success glow fades in/out once

### Figma Prototype Requirements
- **Trigger:** After transaction confirmation
- **Duration:** 800ms total (spawn → settle)
- **Easing:** Elastic out with 1.05x overshoot
- **Visual Elements:**
  - Scale: 0.3 → 1.05 → 1.0
  - Opacity: 0 → 1
  - Blur: 8px → 0px
  - Glow: 0 → 100% → 60% (cyan accent)

### Implementation Parameters (Framer Motion)
```typescript
const bloomAnimation = {
  initial: { scale: 0.3, opacity: 0, filter: "blur(8px)" },
  animate: { 
    scale: [0.3, 1.05, 1.0],
    opacity: 1,
    filter: "blur(0px)"
  },
  transition: {
    duration: 0.8,
    times: [0, 0.6, 1],
    ease: [0.34, 1.56, 0.64, 1] // Custom elastic curve
  }
};

const glowPulse = {
  initial: { opacity: 0 },
  animate: { opacity: [0, 1, 0.6] },
  transition: { duration: 1.2, times: [0, 0.5, 1] }
};
```

---

## 3. Real-Time Balance Counter Transitions

### Interaction Flow
1. **Initial Load** - Counter appears with staggered digit reveal
2. **Streaming** - Digits roll smoothly via requestAnimationFrame
3. **Block Update** - New data arrives, counter adjusts without jump
4. **Milestone** - Every 1000 units, subtle glow pulse
5. **Completion** - Final value locks with satisfying "snap"

### Figma Prototype Requirements
- **After Delay Transitions:**
  - Digit 1: 0ms delay
  - Digit 2: 50ms delay
  - Digit 3: 100ms delay
  - (Staggered reveal pattern)
- **Rolling Physics:** 
  - Spring stiffness: 180
  - Damping: 22
  - Mass: 0.6
- **Milestone Glow:** 
  - Trigger: Balance crosses 1000, 10000, 100000, etc.
  - Duration: 600ms
  - Glow: 0 → 80% → 0

### Implementation Parameters (Framer Motion)
```typescript
const digitSpring = {
  stiffness: 180,
  damping: 22,
  mass: 0.6
};

const staggerDelay = 50; // ms between digits

const milestoneGlow = {
  animate: { 
    boxShadow: [
      "0 0 0px rgba(0,245,255,0)",
      "0 0 40px rgba(0,245,255,0.8)",
      "0 0 0px rgba(0,245,255,0)"
    ]
  },
  transition: { duration: 0.6 }
};
```

---

## 4. Global Spring Physics Constants

### Recommended Presets
```typescript
export const ELASTIC_PRESETS = {
  // Gentle, fluid motion (default UI elements)
  gentle: { stiffness: 120, damping: 20, mass: 1.0 },
  
  // Snappy, responsive (buttons, toggles)
  snappy: { stiffness: 300, damping: 25, mass: 0.8 },
  
  // Bouncy, playful (success states, celebrations)
  bouncy: { stiffness: 200, damping: 15, mass: 1.2 },
  
  // Precise, controlled (counters, data displays)
  precise: { stiffness: 180, damping: 22, mass: 0.6 },
  
  // Dramatic, attention-grabbing (errors, warnings)
  dramatic: { stiffness: 250, damping: 18, mass: 1.5 }
};
```

---

## 5. Figma → Code Handoff Checklist

### For Designers
- [ ] Export Smart Animate timings as JSON
- [ ] Document spring parameters (stiffness, damping, mass)
- [ ] Provide easing curve values for custom beziers
- [ ] Record interaction thresholds (long-press duration, etc.)
- [ ] Capture color values for glow effects (with alpha)

### For Developers
- [ ] Map Figma spring values to Framer Motion config
- [ ] Implement requestAnimationFrame for sub-frame precision
- [ ] Add performance monitoring (target: 60fps)
- [ ] Test on low-end devices (throttle CPU 4x)
- [ ] Verify accessibility (respects prefers-reduced-motion)

---

## 6. Implementation Files

### New Components to Create
```
frontend/components/interactions/
├── long-press-radial-menu.tsx
├── bloom-animation-wrapper.tsx
├── milestone-glow-effect.tsx
└── elastic-presets.ts
```

### Existing Components to Enhance
- `frontend/components/streamingbalance/streamingbalance.tsx` - Add milestone glow
- `frontend/components/dashboard/StreamCard.tsx` - Add long-press menu
- `frontend/components/stream-card-with-liquid-ring.tsx` - Add bloom animation

---

## 7. Performance Targets

- **Frame Rate:** Maintain 60fps during all animations
- **Interaction Latency:** < 16ms response to touch/click
- **Animation Budget:** < 100ms total for critical path interactions
- **Memory:** No animation frame leaks (proper cleanup)

---

## 8. Accessibility Considerations

```typescript
// Respect user motion preferences
const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const springConfig = shouldReduceMotion 
  ? { stiffness: 500, damping: 50, mass: 0.5 } // Instant
  : ELASTIC_PRESETS.gentle; // Animated
```

---

## 9. Testing Strategy

### Visual Regression Tests
- Capture animation keyframes at 0%, 25%, 50%, 75%, 100%
- Compare against Figma export screenshots
- Verify spring physics match design intent

### Performance Tests
- Monitor FPS during concurrent animations
- Test on throttled CPU (4x slowdown)
- Verify no jank on mobile devices

### Interaction Tests
- Long-press threshold accuracy (±10ms tolerance)
- Touch target sizes (min 44x44px)
- Gesture conflict resolution (scroll vs long-press)

---

## 10. Next Steps

1. **Figma Phase** (Current)
   - Create interactive prototypes for all three interactions
   - Export animation parameters and timing values
   - Share prototype links for stakeholder review

2. **Implementation Phase**
   - Create elastic-presets.ts with global spring constants
   - Build long-press-radial-menu component
   - Integrate bloom animation into stream creation flow
   - Add milestone glow to streaming balance counter

3. **Polish Phase**
   - Fine-tune spring physics based on user testing
   - Add haptic feedback for mobile (if supported)
   - Optimize animation performance
   - Document interaction patterns for design system

---

## References

- [Framer Motion Spring Animations](https://www.framer.com/motion/transition/#spring)
- [Figma Smart Animate Guide](https://help.figma.com/hc/en-us/articles/360039818874-Create-advanced-animations-with-Smart-Animate)
- [Web Animations Performance](https://web.dev/animations-guide/)
- [Reduced Motion Best Practices](https://web.dev/prefers-reduced-motion/)
