# Hybrid Streaming with Milestone Vesting

## Overview
Combines linear per-second streaming with milestone-based vesting caps. Funds stream continuously but are capped at milestone percentages until specific dates.

## Implementation

### Milestone Type
```rust
struct Milestone {
    timestamp: u64,    // When milestone unlocks
    percentage: u32,   // % of total unlocked (0-100)
}
```

### Functions

**create_stream_with_milestones(..., milestones: Vec<Milestone>)**
- Creates stream with milestone caps
- Empty milestones = pure linear streaming

**create_stream(...)**
- Wrapper for backward compatibility
- Creates stream without milestones

### Logic
```rust
linear_unlocked = (total * elapsed) / duration
milestone_cap = highest_reached_milestone_percentage

actual_unlocked = min(linear_unlocked, milestone_cap)
```

## Use Cases

**Quarterly Vesting**: 25% every 3 months
```rust
milestones = [
    {timestamp: Q1_end, percentage: 25},
    {timestamp: Q2_end, percentage: 50},
    {timestamp: Q3_end, percentage: 75},
    {timestamp: Q4_end, percentage: 100},
]
```

**Cliff Vesting**: 0% until 1 year, then 100%
```rust
milestones = [{timestamp: year_1, percentage: 100}]
```

**Hybrid**: Stream daily, cap at quarterly milestones
- Funds accumulate second-by-second
- Withdrawals capped until milestone dates

## Tests
- test_quarterly_vesting - 25/50/75/100% milestones
- test_hybrid_streaming - Linear + milestone cap
