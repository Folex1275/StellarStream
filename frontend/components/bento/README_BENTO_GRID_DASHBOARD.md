# Bento Grid Dashboard Component

**Issue #522**: Modular Bento-Grid Dashboard (Desktop/Mobile)

## Overview

The Bento Grid Dashboard is a responsive layout system designed for the StellarStream frontend. It provides a modular, visually appealing dashboard that adapts seamlessly from desktop (4-column) to mobile (single-column) viewports.

## Design Features

### Grid System

The grid uses **Tailwind CSS responsive breakpoints** to achieve the following column configurations:

| Breakpoint | Viewport | Columns | Gap |
|------------|----------|---------|-----|
| Mobile (default) | < 640px | 1 column | 12px |
| Small Tablet (sm) | ≥ 640px | 2 columns | 12px |
| Tablet (md) | - | 2 columns | - |
| Desktop (lg) | ≥ 1024px | 3 columns | 16px |
| Large Desktop (xl) | ≥ 1280px | 4 columns | 20px |

**Pixel 7 Compatibility**: The default mobile breakpoint (1 column) is optimized for the Pixel 7's 412px viewport width.

### Tile Span System

Tiles can span multiple cells for varied layouts:

| Span | Mobile | Tablet/Desktop |
|------|--------|----------------|
| `1x1` | 1 col | 1 col (default) |
| `2x1` | 1 col | 2 cols (double width) |
| `1x2` | 1 col | 2 rows (double height) |
| `2x2` | 1 col | 2 cols × 2 rows |
| `full` | 1 col | Full width |

### Ghost Glass Effect

The "Ghost Glass" effect is used for **empty state tiles** and includes:

1. **Frosted Glass Appearance**:
   - `backdrop-blur-xl backdrop-saturate-150`
   - Semi-transparent gradient backgrounds
   - Dashed borders with subtle opacity

2. **Animated Shimmer**:
   - CSS animation `shimmer` that sweeps across the tile
   - Creates a "loading" or "awaiting content" visual cue

3. **Pulsing Icon Placeholder**:
   - Centered ghost icon with ping animation
   - Provides visual hierarchy for empty states

4. **Hover Grid Pattern**:
   - Dot grid pattern reveals on hover
   - Adds subtle depth and interactivity

## Component Architecture

```
BentoGrid (Container)
├── BentoTile (Tile Wrapper)
│   ├── span prop for sizing
│   ├── hover prop for interactions
│   └── animate prop for entrance animations
└── GhostGlassTile (Empty State)
    ├── icon prop for custom placeholder
    ├── title/subtitle for text content
    └── Fully animated ghost effect
```

## Usage Examples

### Basic Dashboard Layout

```tsx
import { BentoGrid, BentoTile, BentoDashboard } from "@/components/bento/bento-grid-dashboard";

export default function Dashboard() {
  return <BentoDashboard />;
}
```

### Custom Layout

```tsx
import { BentoGrid, BentoTile, GhostGlassTile } from "@/components/bento/bento-grid-dashboard";

export default function CustomDashboard() {
  return (
    <BentoGrid variant="spacious">
      {/* Large feature tile */}
      <BentoTile span="2x2" hover animate>
        <ChartComponent />
      </BentoTile>

      {/* Stats cards */}
      <BentoTile span="1x1" hover>
        <StatCard title="Total Volume" value="1,247.5 XLM" />
      </BentoTile>
      <BentoTile span="1x1" hover>
        <StatCard title="Active Streams" value="18" />
      </BentoTile>

      {/* Empty state with ghost glass */}
      <BentoTile span="2x1">
        <GhostGlassTile
          title="Gas Tank"
          subtitle="Configure your gas reserves"
        />
      </BentoTile>
    </BentoGrid>
  );
}
```

## Design Tokens

The component uses the **Stellar Glass Design System** tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `--stellar-primary` | `#00f5ff` | Cyan accent, primary actions |
| `--stellar-secondary` | `#8a00ff` | Violet accent, secondary elements |
| `--stellar-background` | `#030303` | Main background |
| `--stellar-foreground` | `#ffffff` | Primary text color |

### Tile Styling

- **Background**: Gradient from `rgba(255,255,255,0.06)` to `rgba(255,255,255,0.02)`
- **Border**: `1px solid rgba(255,255,255,0.08)`
- **Hover Border**: `1px solid rgba(255,255,255,0.15)`
- **Border Radius**: `1rem` (rounded-2xl)
- **Shadow on Hover**: `0 0 20px rgba(0,245,255,0.05)`

## Figma Auto-Layout 5.0 Configuration

In Figma, configure the Bento Grid frame with:

1. **Auto Layout Settings**:
   - Direction: Horizontal
   - Resizing: Hug contents
   - Spacing: 12px (mobile) → 20px (desktop)

2. **Responsive Frames**:
   - Create variants for each breakpoint
   - Use constraints for element positioning

3. **Component Properties**:
   - Tile span (1x1, 2x1, 2x2, etc.)
   - Ghost glass effect toggle
   - Animation presets

## Accessibility

- All interactive tiles have `hover` state styling
- Focus states are preserved from the base design system
- Color contrast ratios meet WCAG AA standards
- Animation respects `prefers-reduced-motion`

## Performance Considerations

- Uses CSS-based animations (GPU-accelerated)
- No JavaScript required for layout calculations
- Backdrop filter is applied sparingly for performance
- Entrance animations are optional via `animate` prop

## Browser Support

- Modern browsers with CSS Grid support
- Backdrop filter fallback for older browsers
- Mobile Safari optimizations for blur effects

## Files Created

- `components/bento/bento-grid-dashboard.tsx` - Main component
- `lib/utils.ts` - Utility functions (cn helper)
- `FIGMA UI DESIGN/StellarStream-Issue-522.txt` - Figma link
- `app/globals.css` - Animation keyframes

## Future Enhancements

- [ ] Drag-and-drop tile reordering
- [ ] Collapsible tile sections
- [ ] Persistent layout preferences
- [ ] Tile loading skeleton states
