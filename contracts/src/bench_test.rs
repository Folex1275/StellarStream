#![cfg(test)]

/// Benchmark tests for gas optimization
/// These tests verify that optimized functions work correctly
/// Actual gas profiling requires soroban-cli with --profile flag

#[test]
fn bench_math_operations() {
    use crate::math;

    // Benchmark: Math calculations (inlined functions)
    let total = 1_000_000_i128;
    let start = 0u64;
    let cliff = 500u64;
    let end = 1000u64;

    // Test at various points
    for now in [0, 250, 500, 750, 1000] {
        let unlocked = math::calculate_unlocked(total, start, cliff, end, now);
        assert!(unlocked >= 0 && unlocked <= total);
    }

    // Benchmark: Fee calculation
    for fee_bps in [0, 50, 100, 250, 500, 1000] {
        let fee = math::calculate_fee(total, fee_bps);
        assert!(fee >= 0 && fee <= total);
    }
}

#[test]
fn bench_inline_math_performance() {
    use crate::math;

    // Test that inlined functions work correctly
    // In release mode, these should have zero function call overhead

    let amount = 1_000_000_i128;
    let start = 0u64;
    let cliff = 100u64;
    let end = 1000u64;

    // Multiple calls to test inlining benefit
    for i in 0..100 {
        let now = i * 10;
        let unlocked = math::calculate_unlocked(amount, start, cliff, end, now);
        assert!(unlocked >= 0);
    }
}

#[test]
fn bench_fee_calculation_optimization() {
    use crate::math;

    let amount = 1_000_000_i128;

    // Test zero fee (should be optimized with early return)
    let fee = math::calculate_fee(amount, 0);
    assert_eq!(fee, 0);

    // Test various fee rates
    let fee_50 = math::calculate_fee(amount, 50); // 0.5%
    assert_eq!(fee_50, 5000);

    let fee_100 = math::calculate_fee(amount, 100); // 1%
    assert_eq!(fee_100, 10000);

    let fee_1000 = math::calculate_fee(amount, 1000); // 10%
    assert_eq!(fee_1000, 100000);
}

#[test]
fn bench_early_return_optimization() {
    use crate::math;

    let amount = 1_000_000_i128;
    let start = 1000u64;
    let cliff = 1500u64;
    let end = 2000u64;

    // Test early return for before cliff
    let unlocked_before = math::calculate_unlocked(amount, start, cliff, end, 1000);
    assert_eq!(unlocked_before, 0);

    // Test early return for after end
    let unlocked_after = math::calculate_unlocked(amount, start, cliff, end, 3000);
    assert_eq!(unlocked_after, amount);

    // Test main calculation path
    let unlocked_mid = math::calculate_unlocked(amount, start, cliff, end, 1750);
    assert!(unlocked_mid > 0 && unlocked_mid < amount);
}

#[test]
fn bench_power_of_two_check() {
    use crate::math;

    // Test power of 2 detection (useful for optimization)
    assert!(math::is_power_of_two(1));
    assert!(math::is_power_of_two(2));
    assert!(math::is_power_of_two(4));
    assert!(math::is_power_of_two(8));
    assert!(math::is_power_of_two(16));
    assert!(math::is_power_of_two(1024));

    assert!(!math::is_power_of_two(0));
    assert!(!math::is_power_of_two(3));
    assert!(!math::is_power_of_two(5));
    assert!(!math::is_power_of_two(100));
    assert!(!math::is_power_of_two(1000));
}

#[test]
fn bench_calculate_unlocked_edge_cases() {
    use crate::math;

    let amount = 1_000_000_i128;

    // Test with cliff at start
    let unlocked = math::calculate_unlocked(amount, 1000, 1000, 2000, 1500);
    assert_eq!(unlocked, 500_000);

    // Test with large amounts (but not overflow)
    let large_amount = 1_000_000_000_000_i128;
    let unlocked_large = math::calculate_unlocked(large_amount, 0, 0, 1000, 500);
    assert!(unlocked_large > 0);

    // Test with zero amount
    let unlocked_zero = math::calculate_unlocked(0, 0, 0, 1000, 500);
    assert_eq!(unlocked_zero, 0);
}

#[test]
fn bench_fee_calculation_edge_cases() {
    use crate::math;

    // Test with zero amount
    let fee = math::calculate_fee(0, 100);
    assert_eq!(fee, 0);

    // Test with maximum fee (10%)
    let fee_max = math::calculate_fee(1_000_000, 1000);
    assert_eq!(fee_max, 100_000);

    // Test with large amounts (but not overflow)
    let large_amount = 1_000_000_000_000_i128;
    let fee_large = math::calculate_fee(large_amount, 100);
    assert!(fee_large > 0);
}

#[test]
fn bench_math_precision() {
    use crate::math;

    // Test precision of calculations
    let amount = 1_000_000_i128;
    let start = 0u64;
    let cliff = 0u64;
    let end = 1000u64;

    // Test at 1% intervals
    for i in 0..=100 {
        let now = (i * 10) as u64;
        let unlocked = math::calculate_unlocked(amount, start, cliff, end, now);
        let expected_min = (amount * i) / 100 - 1; // Allow for rounding
        let expected_max = (amount * i) / 100 + 1;
        assert!(unlocked >= expected_min && unlocked <= expected_max);
    }
}
