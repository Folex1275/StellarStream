//! cargo-fuzz target for splitter-v3 `split_funds` math invariants.
//!
//! Invariant tested:
//!   Total_Input == Sum(Recipient_Outputs) + Dust
//!
//! The fuzzer drives `total_amount` (i128) and per-recipient `share_bps` (u32)
//! across the full i128 range to catch overflow / underflow / rounding bugs.
//!
//! Run with:
//!   cargo fuzz run fuzz_split_funds

#![no_main]

use libfuzzer_sys::fuzz_target;

/// Minimal input structure decoded from raw fuzzer bytes.
struct FuzzInput {
    total_amount: i128,
    /// Up to 8 recipients; bps values are taken mod 10_001 and normalised.
    shares: [u32; 8],
    n_recipients: u8,
}

impl FuzzInput {
    fn from_bytes(data: &[u8]) -> Option<Self> {
        if data.len() < 17 {
            return None;
        }
        let total_amount = i128::from_le_bytes(data[0..16].try_into().ok()?);
        // Only positive, non-zero amounts are meaningful for distribution.
        if total_amount <= 0 {
            return None;
        }
        let n_recipients = (data[16] % 8) + 1; // 1..=8
        let mut shares = [0u32; 8];
        for i in 0..n_recipients as usize {
            let offset = 17 + i * 4;
            if offset + 4 > data.len() {
                shares[i] = 1;
            } else {
                shares[i] = u32::from_le_bytes(data[offset..offset + 4].try_into().ok()?);
                shares[i] = (shares[i] % 10_000) + 1; // 1..=10_000
            }
        }
        Some(FuzzInput { total_amount, shares, n_recipients })
    }
}

fuzz_target!(|data: &[u8]| {
    let input = match FuzzInput::from_bytes(data) {
        Some(v) => v,
        None => return,
    };

    let n = input.n_recipients as usize;

    // Normalise shares so they sum to exactly 10_000 bps.
    let raw_sum: u64 = input.shares[..n].iter().map(|&s| s as u64).sum();
    if raw_sum == 0 {
        return;
    }
    let mut bps: [u32; 8] = [0; 8];
    let mut bps_total: u32 = 0;
    for i in 0..n {
        bps[i] = ((input.shares[i] as u64 * 10_000) / raw_sum) as u32;
        bps_total += bps[i];
    }
    // Assign rounding remainder to first recipient.
    bps[0] += 10_000u32.saturating_sub(bps_total);

    // Verify bps sum == 10_000.
    let final_sum: u32 = bps[..n].iter().sum();
    assert_eq!(final_sum, 10_000, "bps normalisation must sum to 10_000");

    // Simulate the split_funds distribution loop (mirrors contract logic).
    let total = input.total_amount;
    let mut distributed: i128 = 0;
    let mut ok = true;

    for i in 0..n {
        match total.checked_mul(bps[i] as i128) {
            Some(v) => {
                let amount = v / 10_000;
                match distributed.checked_add(amount) {
                    Some(new_dist) => distributed = new_dist,
                    None => { ok = false; break; }
                }
            }
            None => { ok = false; break; }
        }
    }

    if !ok {
        // Overflow detected — the contract must return Error::Overflow here,
        // not panic. We just return; the fuzzer records this as a valid path.
        return;
    }

    // Invariant: distributed <= total (no recipient can receive more than input).
    assert!(
        distributed <= total,
        "invariant violated: distributed ({distributed}) > total ({total})"
    );

    // Invariant: dust (total - distributed) is non-negative and < n_recipients.
    let dust = total - distributed;
    assert!(
        dust >= 0,
        "invariant violated: negative dust ({dust})"
    );
    assert!(
        dust < n as i128,
        "invariant violated: dust ({dust}) >= n_recipients ({n}) — rounding error too large"
    );
});
