use crate::math;

#[test]
fn test_rounding_favors_contract_solvency() {
    // Test that rounding always rounds DOWN (favors contract)
    let amount = 1000_i128;
    let start = 0u64;
    let cliff = 0u64;
    let end = 3u64;

    // At time 1, should unlock 333 (not 334)
    // 1000 * 1 / 3 = 333.333... -> rounds down to 333
    let unlocked = math::calculate_unlocked(amount, start, cliff, end, 1);
    assert_eq!(unlocked, 333);

    // At time 2, should unlock 666 (not 667)
    // 1000 * 2 / 3 = 666.666... -> rounds down to 666
    let unlocked = math::calculate_unlocked(amount, start, cliff, end, 2);
    assert_eq!(unlocked, 666);

    // At time 3 (end), should unlock exactly 1000
    let unlocked = math::calculate_unlocked(amount, start, cliff, end, 3);
    assert_eq!(unlocked, 1000);
}

#[test]
fn test_final_withdrawal_clears_dust() {
    // Test that final withdrawal gets exact remaining balance
    let amount = 1000_i128;
    let start = 0u64;
    let cliff = 0u64;
    let end = 3u64;

    // Simulate withdrawals at time 1 and 2
    let withdrawn_at_1 = math::calculate_unlocked(amount, start, cliff, end, 1);
    assert_eq!(withdrawn_at_1, 333);

    let withdrawn_at_2 = math::calculate_unlocked(amount, start, cliff, end, 2) - withdrawn_at_1;
    assert_eq!(withdrawn_at_2, 333); // 666 - 333 = 333

    let total_withdrawn = withdrawn_at_1 + withdrawn_at_2;
    assert_eq!(total_withdrawn, 666);

    // Final withdrawal at end should get EXACT remaining balance
    let final_withdrawable = math::calculate_withdrawable(
        amount,
        total_withdrawn,
        start,
        cliff,
        end,
        end, // now >= end
    );

    // Should be exactly 334 (1000 - 666), not based on time calculation
    assert_eq!(final_withdrawable, 334);

    // Verify total adds up perfectly
    assert_eq!(total_withdrawn + final_withdrawable, amount);
}

#[test]
fn test_tiny_amount_over_long_period() {
    // Simulate streaming 1 token over 4 years (126144000 seconds)
    let amount = 1_i128;
    let start = 0u64;
    let cliff = 0u64;
    let end = 126144000u64; // ~4 years

    // Try to withdraw at various points
    // Most withdrawals will return 0 due to rounding down
    for i in 1..100 {
        let now = i * 1000000; // Every ~11.5 days
        let unlocked = math::calculate_unlocked(amount, start, cliff, end, now);
        // Should be 0 or 1, never more
        assert!(unlocked <= amount);
    }

    // Final withdrawal should get the full amount
    let final_unlocked = math::calculate_unlocked(amount, start, cliff, end, end);
    assert_eq!(final_unlocked, amount);
}

#[test]
fn test_1000_tiny_withdrawals_no_dust() {
    // Fuzz test: 1000 tiny withdrawals should never leave dust
    let amount = 1_000_000_i128;
    let start = 0u64;
    let cliff = 0u64;
    let end = 1000u64;

    let mut total_withdrawn = 0_i128;

    // Simulate 1000 withdrawals (one per time unit)
    for now in 1..=1000 {
        let unlocked = math::calculate_unlocked(amount, start, cliff, end, now);
        let withdrawable = unlocked - total_withdrawn;

        if withdrawable > 0 {
            total_withdrawn += withdrawable;
        }
    }

    // Should have withdrawn exactly the full amount
    assert_eq!(total_withdrawn, amount);

    // No dust left behind
    let remaining = amount - total_withdrawn;
    assert_eq!(remaining, 0);
}

#[test]
fn test_precision_with_prime_numbers() {
    // Use prime numbers to maximize rounding errors
    let amount = 999983_i128; // Prime number
    let start = 0u64;
    let cliff = 0u64;
    let end = 997u64; // Prime number

    let mut total_withdrawn = 0_i128;

    // Withdraw at every time point
    for now in 1..=end {
        let withdrawable =
            math::calculate_withdrawable(amount, total_withdrawn, start, cliff, end, now);

        if withdrawable > 0 {
            total_withdrawn += withdrawable;
        }
    }

    // Should have withdrawn exactly the full amount
    assert_eq!(total_withdrawn, amount);
}

#[test]
fn test_no_over_withdrawal() {
    // Ensure we can never withdraw more than the total amount
    let amount = 1000_i128;
    let start = 0u64;
    let cliff = 0u64;
    let end = 100u64;

    for now in 0..=200 {
        let unlocked = math::calculate_unlocked(amount, start, cliff, end, now);
        assert!(
            unlocked <= amount,
            "Unlocked {} exceeds amount {}",
            unlocked,
            amount
        );
    }
}

#[test]
fn test_withdrawal_sequence_reconciliation() {
    // Test that multiple withdrawals reconcile perfectly
    let amount = 10000_i128;
    let start = 0u64;
    let cliff = 0u64;
    let end = 100u64;

    let mut withdrawn = 0_i128;
    let withdrawal_times = [10, 25, 50, 75, 100];

    for &now in &withdrawal_times {
        let withdrawable = math::calculate_withdrawable(amount, withdrawn, start, cliff, end, now);

        withdrawn += withdrawable;
    }

    // Should have withdrawn exactly the full amount
    assert_eq!(withdrawn, amount);
}

#[test]
fn test_cliff_with_precision() {
    // Test precision with cliff period
    let amount = 999_i128;
    let start = 0u64;
    let cliff = 333u64;
    let end = 999u64;

    // Before cliff: nothing
    let before_cliff = math::calculate_unlocked(amount, start, cliff, end, 100);
    assert_eq!(before_cliff, 0);

    // At cliff: should unlock proportional amount
    let at_cliff = math::calculate_unlocked(amount, start, cliff, end, cliff);
    assert_eq!(at_cliff, 333); // 999 * 333 / 999 = 333

    // At end: should unlock everything
    let at_end = math::calculate_unlocked(amount, start, cliff, end, end);
    assert_eq!(at_end, amount);
}

#[test]
fn test_very_small_amounts() {
    // Test with amounts as small as 1 stroops
    for amount in 1..=10 {
        let start = 0u64;
        let cliff = 0u64;
        let end = 1000u64;

        let mut withdrawn = 0_i128;

        // Withdraw at various points
        for now in [100, 500, 1000] {
            let withdrawable =
                math::calculate_withdrawable(amount, withdrawn, start, cliff, end, now);

            withdrawn += withdrawable;
        }

        // Should have withdrawn exactly the full amount
        assert_eq!(withdrawn, amount, "Failed for amount {}", amount);
    }
}

#[test]
fn test_large_amounts_no_overflow() {
    // Test with very large amounts (near i128 limits)
    let amount = 1_000_000_000_000_000_i128; // 1 quadrillion
    let start = 0u64;
    let cliff = 0u64;
    let end = 1000u64;

    // Should not overflow
    let unlocked_mid = math::calculate_unlocked(amount, start, cliff, end, 500);
    assert!(unlocked_mid > 0);
    assert!(unlocked_mid <= amount);

    let unlocked_end = math::calculate_unlocked(amount, start, cliff, end, end);
    assert_eq!(unlocked_end, amount);
}

#[test]
fn test_rounding_accumulation() {
    // Test that rounding errors don't accumulate
    let amount = 1000_i128;
    let start = 0u64;
    let cliff = 0u64;
    let end = 7u64; // Prime number to maximize rounding

    let mut withdrawn = 0_i128;

    // Withdraw at each time point
    for now in 1..=end {
        let withdrawable = math::calculate_withdrawable(amount, withdrawn, start, cliff, end, now);

        withdrawn += withdrawable;

        // At any point, withdrawn should never exceed what's unlocked
        let unlocked = math::calculate_unlocked(amount, start, cliff, end, now);
        assert_eq!(withdrawn, unlocked);
    }

    // Final check: everything withdrawn
    assert_eq!(withdrawn, amount);
}

#[test]
fn test_calculate_withdrawable_vs_manual() {
    // Compare calculate_withdrawable with manual calculation
    let amount = 1000_i128;
    let withdrawn = 300_i128;
    let start = 0u64;
    let cliff = 0u64;
    let end = 100u64;
    let now = 50u64;

    // Using helper function
    let withdrawable = math::calculate_withdrawable(amount, withdrawn, start, cliff, end, now);

    // Manual calculation
    let unlocked = math::calculate_unlocked(amount, start, cliff, end, now);
    let manual_withdrawable = unlocked - withdrawn;

    assert_eq!(withdrawable, manual_withdrawable);
}

#[test]
fn test_final_withdrawal_uses_exact_balance() {
    // Verify that final withdrawal uses exact balance, not time calculation
    let amount = 1000_i128;
    let withdrawn = 666_i128; // Some amount already withdrawn
    let start = 0u64;
    let cliff = 0u64;
    let end = 100u64;
    let now = 100u64; // At end

    let withdrawable = math::calculate_withdrawable(amount, withdrawn, start, cliff, end, now);

    // Should be exactly remaining balance
    assert_eq!(withdrawable, amount - withdrawn);
    assert_eq!(withdrawable, 334);
}
