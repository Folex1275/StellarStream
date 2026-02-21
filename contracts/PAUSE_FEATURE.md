# Stream Pause/Unpause Feature

## Overview
Allows employers to pause streams during employee leave without canceling them. Paused time doesn't count toward vesting.

## Implementation

### Stream Fields
```rust
is_paused: bool              // Current pause state
paused_time: u64             // When pause started
total_paused_duration: u64   // Cumulative pause time
```

### Functions

**pause_stream(stream_id, caller)**
- Only sender can pause
- Stops fund accumulation
- Records pause timestamp

**unpause_stream(stream_id, caller)**
- Only sender can unpause
- Adds pause duration to total
- Resumes fund accumulation

### Time Calculation
Paused time is subtracted from elapsed time:
```rust
effective_elapsed = (current_time - start_time) - total_paused_duration
```

### Withdrawal Behavior
- Withdrawals blocked while paused (Error::StreamPaused)
- After unpause, stream continues from where it left off
- End time effectively shifts forward by pause duration

## Use Cases

**Employee Leave**: Pause salary stream during unpaid leave
**Contract Suspension**: Pause vendor payments during disputes
**Seasonal Work**: Pause streams during off-season

## Tests
- test_pause_unpause_stream - Basic pause/unpause
- test_withdraw_paused_fails - Withdrawal blocked when paused
- test_pause_adjusts_unlocked_balance - Time calculation accuracy
