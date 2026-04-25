//! #841 — V3 Formal Verification: Invariant Definitions
//!
//! Defines the correctness invariants that must hold for every split
//! configuration. These are consumed by the fuzzer in `fuzz_invariants.rs`.
//!
//! Core invariant:
//!   Total_Sent == Sum(Received) + Fees
//!
//! Secondary invariants:
//!   - No recipient receives more than their allocated share
//!   - No funds are locked (sum of shares == 100%)
//!   - Fee cannot exceed 10% of total

/// A single split recipient allocation.
#[derive(Clone, Debug)]
pub struct Allocation {
    pub share_bps: u64,   // basis points (0–10_000)
    pub received:  u64,   // actual tokens received (stroops)
}

/// Result of a split execution.
#[derive(Clone, Debug)]
pub struct SplitResult {
    pub total_sent:   u64,
    pub allocations:  Vec<Allocation>,
    pub fee_bps:      u64,   // protocol fee in basis points
    pub fee_collected: u64,
}

/// INV-1: Total_Sent == Sum(Received) + Fee
pub fn inv_conservation(r: &SplitResult) -> bool {
    let sum_received: u64 = r.allocations.iter().map(|a| a.received).sum();
    r.total_sent == sum_received + r.fee_collected
}

/// INV-2: Each recipient receives exactly their share (within 1 stroop rounding)
pub fn inv_correct_shares(r: &SplitResult) -> bool {
    let distributable = r.total_sent.saturating_sub(r.fee_collected);
    r.allocations.iter().all(|a| {
        let expected = distributable * a.share_bps / 10_000;
        a.received.abs_diff(expected) <= 1
    })
}

/// INV-3: Sum of all share_bps == 10_000 (100%)
pub fn inv_shares_sum_to_100(r: &SplitResult) -> bool {
    r.allocations.iter().map(|a| a.share_bps).sum::<u64>() == 10_000
}

/// INV-4: Fee does not exceed 10% (1_000 bps)
pub fn inv_fee_cap(r: &SplitResult) -> bool {
    r.fee_bps <= 1_000
}

/// Run all invariants; returns list of violated invariant names.
pub fn check_all(r: &SplitResult) -> Vec<&'static str> {
    let mut violations = Vec::new();
    if !inv_conservation(r)       { violations.push("INV-1: conservation"); }
    if !inv_correct_shares(r)     { violations.push("INV-2: correct_shares"); }
    if !inv_shares_sum_to_100(r)  { violations.push("INV-3: shares_sum_100"); }
    if !inv_fee_cap(r)            { violations.push("INV-4: fee_cap"); }
    violations
}
