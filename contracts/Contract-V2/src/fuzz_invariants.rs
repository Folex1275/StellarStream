//! #841 — V3 Formal Verification: Property-Based Fuzzer
//!
//! Runs 10,000 iterations of random split configurations and asserts
//! all invariants defined in `invariants.rs` hold for every case.
//!
//! Run with:
//!   cargo test fuzz_split_invariants -- --nocapture

#[cfg(test)]
mod fuzz_tests {
    use super::super::invariants::*;

    /// Simple LCG pseudo-random generator (no external deps needed).
    struct Lcg(u64);
    impl Lcg {
        fn next(&mut self) -> u64 {
            self.0 = self.0.wrapping_mul(6_364_136_223_846_793_005)
                .wrapping_add(1_442_695_040_888_963_407);
            self.0
        }
        fn range(&mut self, lo: u64, hi: u64) -> u64 {
            lo + self.next() % (hi - lo + 1)
        }
    }

    /// Simulate a split execution given inputs.
    fn simulate(total_sent: u64, shares_bps: &[u64], fee_bps: u64) -> SplitResult {
        let fee_collected = total_sent * fee_bps / 10_000;
        let distributable = total_sent - fee_collected;
        let mut allocations: Vec<Allocation> = shares_bps.iter().map(|&s| Allocation {
            share_bps: s,
            received:  distributable * s / 10_000,
        }).collect();

        // Distribute rounding dust to first recipient
        let sum_received: u64 = allocations.iter().map(|a| a.received).sum();
        let dust = distributable.saturating_sub(sum_received);
        if let Some(first) = allocations.first_mut() {
            first.received += dust;
        }

        SplitResult { total_sent, allocations, fee_bps, fee_collected }
    }

    #[test]
    fn fuzz_split_invariants() {
        let mut rng = Lcg(0xDEAD_BEEF_CAFE_1234);
        let iterations = 10_000;
        let mut violations = 0usize;

        for i in 0..iterations {
            // Random total: 1 stroop to 1 billion XLM in stroops
            let total_sent = rng.range(1, 10_000_000_000_000);

            // Random fee: 0–500 bps (0–5%)
            let fee_bps = rng.range(0, 500);

            // Random 2–8 recipients whose shares sum to 10_000
            let n_recipients = rng.range(2, 8) as usize;
            let mut shares: Vec<u64> = Vec::with_capacity(n_recipients);
            let mut remaining = 10_000u64;
            for j in 0..n_recipients {
                let share = if j == n_recipients - 1 {
                    remaining
                } else {
                    rng.range(1, remaining - (n_recipients - j - 1) as u64)
                };
                shares.push(share);
                remaining -= share;
            }

            let result = simulate(total_sent, &shares, fee_bps);
            let failed = check_all(&result);

            if !failed.is_empty() {
                eprintln!("Iteration {i}: VIOLATION(S): {:?}", failed);
                eprintln!("  total_sent={total_sent}, fee_bps={fee_bps}, shares={shares:?}");
                violations += 1;
            }
        }

        assert_eq!(violations, 0,
            "{violations}/{iterations} iterations violated invariants — see stderr for details");

        println!("✓ All {iterations} fuzz iterations passed all invariants.");
    }
}
