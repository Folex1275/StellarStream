# Network Pulse Visualizer

A React component that visualizes parallel transaction processing in Protocol 23 (Whisk), showing animated "lanes" that light up as transactions are bundled into Whisk-optimized ledgers.

## Features

- **Parallel Lane Visualization**: Shows multiple horizontal lanes representing parallel execution paths
- **Animated Pulses**: Transaction "pulses" travel across lanes with smooth animations
- **Configurable**: Adjustable lane count, processing state, and size
- **Protocol 23 Integration**: Specifically designed for Whisk protocol parallel execution
- **Accessible**: Includes proper ARIA labels and semantic markup

## Usage

```tsx
import NetworkPulseVisualizer from "./components/network-pulse-visualizer";

function TransactionModal() {
  return (
    <div>
      <h3>Processing Transaction</h3>
      <NetworkPulseVisualizer
        laneCount={4}
        isProcessing={true}
        size={120}
      />
      <p>Your transaction is being processed in parallel lanes...</p>
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `laneCount` | `number` | `4` | Number of parallel lanes to display |
| `isProcessing` | `boolean` | `true` | Whether to show active transaction processing |
| `size` | `number` | `120` | Size of the visualizer in pixels |

## Technical Implementation

### Animation System
- Uses Framer Motion for smooth pulse animations
- Pulses travel across lanes at consistent speeds
- Automatic cleanup of completed animations
- 60fps animation updates for smooth motion

### Visual Design
- Gradient pulse trails with cyan-to-purple color scheme
- Subtle lane glow effects
- Protocol 23 (P23) indicator
- Glassmorphism styling with backdrop blur

### Performance
- Limited pulse count to prevent overcrowding
- Efficient animation cleanup
- Minimal re-renders with proper state management

## Integration Examples

### Transaction Confirmation
```tsx
<NetworkPulseVisualizer
  laneCount={6}
  isProcessing={transactionStatus === 'processing'}
/>
```

### Dashboard Widget
```tsx
<NetworkPulseVisualizer
  size={80}
  laneCount={3}
/>
```

### Stream Processing Indicator
```tsx
{isStreaming && (
  <NetworkPulseVisualizer
    laneCount={4}
    isProcessing={true}
  />
)}
```

## Accessibility

- Includes `role="img"` and descriptive `aria-label`
- Color contrast meets WCAG guidelines
- Animations respect `prefers-reduced-motion` (inherited from Framer Motion)

## Dependencies

- `framer-motion`: For smooth animations
- `react`: Core React functionality

## Files

- `network-pulse-visualizer.tsx`: Main component
- `network-pulse-visualizer-example.tsx`: Interactive demo and documentation
- `README_NETWORK_PULSE_VISUALIZER.md`: This documentation

## Related Components

- `live-pulse-map.tsx`: Global network activity visualization
- `networkstatusorb.tsx`: Simple network status indicator