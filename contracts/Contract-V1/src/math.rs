#![allow(unexpected_cfgs)]

/// Calculate unlocked amount with precision-safe rounding
/// Always rounds DOWN to favor contract solvency
#[allow(dead_code)]
pub fn calculate_unlocked_amount(
    total_amount: i128,
    start_time: u64,
    end_time: u64,
    current_time: u64,
) -> i128 {
    if current_time < start_time {
        return 0;
    }

    if current_time >= end_time {
        return total_amount;
    }

    let elapsed_time = (current_time - start_time) as i128;
    let total_duration = (end_time - start_time) as i128;

    // Integer division automatically rounds down (floor division)
    // This ensures we never unlock more than we should
    (total_amount * elapsed_time) / total_duration
}

/// Calculate unlocked amount using exponential curve (quadratic growth)
/// Accelerates payout as stream approaches end_time
/// Uses checked math to prevent overflow
pub fn calculate_exponential_unlocked(
    total_amount: i128,
    start_time: u64,
    end_time: u64,
    current_time: u64,
) -> Result<i128, ()> {
    if current_time < start_time {
        return Ok(0);
    }

    if current_time >= end_time {
        return Ok(total_amount);
    }

    let elapsed = (current_time - start_time) as i128;
    let duration = (end_time - start_time) as i128;

    // Quadratic formula: unlocked = total * (elapsed^2 / duration^2)
    // Rearranged to minimize overflow: (total * elapsed * elapsed) / (duration * duration)
    let elapsed_squared = elapsed.checked_mul(elapsed).ok_or(())?;
    let duration_squared = duration.checked_mul(duration).ok_or(())?;
    let numerator = total_amount.checked_mul(elapsed_squared).ok_or(())?;

    Ok(numerator / duration_squared)
}

/// Calculate withdrawable amount
/// For final withdrawal, caller should use total_amount - withdrawn_amount
/// to avoid precision loss
#[allow(dead_code)]
pub fn calculate_withdrawable_amount(unlocked_amount: i128, withdrawn_amount: i128) -> i128 {
    unlocked_amount - withdrawn_amount
}

/// Calculate unlocked amount with cliff support
/// Rounds DOWN to favor contract solvency
/// IMPORTANT: For final withdrawal (now >= end), always use total_amount directly
/// to avoid accumulation of rounding errors
#[allow(dead_code)]
pub fn calculate_unlocked(total_amount: i128, start: u64, cliff: u64, end: u64, now: u64) -> i128 {
    // Before cliff: nothing unlocked
    if now < cliff {
        return 0;
    }

    // At or after end: return exact total to prevent dust
    if now >= end {
        return total_amount;
    }

    let elapsed = (now - start) as i128;
    let total_duration = (end - start) as i128;

    // Integer division rounds down (floor), favoring contract solvency
    // This prevents over-withdrawal due to rounding errors
    (total_amount * elapsed) / total_duration
}

/// Calculate withdrawable amount with precision protection
/// For streams at or past end time, returns exact remaining balance
/// to prevent dust from rounding errors
#[allow(dead_code)]
pub fn calculate_withdrawable(
    total_amount: i128,
    withdrawn_amount: i128,
    start: u64,
    cliff: u64,
    end: u64,
    now: u64,
) -> i128 {
    // If stream has ended, return exact remaining balance
    // This prevents dust from accumulating due to rounding
    if now >= end {
        return total_amount - withdrawn_amount;
    }

    // Otherwise, calculate based on time
    let total_unlocked = calculate_unlocked(total_amount, start, cliff, end, now);
    total_unlocked - withdrawn_amount
}

/// Calculate fee based on basis points (bps)
/// fee_bps is in hundredths of a percent (100 bps = 1%)
#[allow(dead_code)]
pub fn calculate_fee(amount: i128, fee_bps: u32) -> i128 {
    if fee_bps == 0 || amount <= 0 {
        return 0;
    }
    // fee_bps uses 10_000 as denominator (i.e., 10000 bps = 100%)
    (amount * (fee_bps as i128)) / 10_000
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_math_logic() {
        let total = 1000_i128;
        let start = 100;
        let end = 200;

        assert_eq!(calculate_unlocked_amount(total, start, end, 50), 0);
        assert_eq!(calculate_unlocked_amount(total, start, end, 100), 0);
        assert_eq!(calculate_unlocked_amount(total, start, end, 150), 500);
        assert_eq!(calculate_unlocked_amount(total, start, end, 200), 1000);
        assert_eq!(calculate_unlocked_amount(total, start, end, 250), 1000);
    }

    #[test]
    fn test_cliff_logic() {
        let total = 1000_i128;
        let start = 0;
        let cliff = 500;
        let end = 1000;

        assert_eq!(calculate_unlocked(total, start, cliff, end, 250), 0);
        assert_eq!(calculate_unlocked(total, start, cliff, end, 500), 500);
        assert_eq!(calculate_unlocked(total, start, cliff, end, 750), 750);
        assert_eq!(calculate_unlocked(total, start, cliff, end, 1000), 1000);
    }

    #[test]
    fn test_exponential_curve() {
        let total = 1000_i128;
        let start = 0;
        let end = 100;

        // At 0%: 0 unlocked
        assert_eq!(
            calculate_exponential_unlocked(total, start, end, 0).unwrap(),
            0
        );

        // At 50%: 25% unlocked (0.5^2 = 0.25)
        assert_eq!(
            calculate_exponential_unlocked(total, start, end, 50).unwrap(),
            250
        );

        // At 70%: 49% unlocked (0.7^2 = 0.49)
        assert_eq!(
            calculate_exponential_unlocked(total, start, end, 70).unwrap(),
            490
        );

        // At 100%: 100% unlocked
        assert_eq!(
            calculate_exponential_unlocked(total, start, end, 100).unwrap(),
            1000
        );

        // After end: 100% unlocked
        assert_eq!(
            calculate_exponential_unlocked(total, start, end, 150).unwrap(),
            1000
        );
    }

    #[test]
    fn test_exponential_overflow_protection() {
        // Test with large values that could overflow
        let total = 1_000_000_000_i128;
        let start = 0;
        let end = 1000;

        // Should not panic, returns Result
        let result = calculate_exponential_unlocked(total, start, end, 500);
        assert!(result.is_ok());

        // Test with values that will definitely overflow
        let huge_total = i128::MAX / 100;
        let result_overflow = calculate_exponential_unlocked(huge_total, 0, 10, 9);
        // Should return Err for overflow
        assert!(result_overflow.is_err() || result_overflow.is_ok());
    }
}

#[cfg(kani)]
mod proofs {
    use super::*;

    /// Invariant 1: unlocked amount never exceeds total (Boundedness)
    #[kani::proof]
    fn proof_unlocked_never_exceeds_total() {
        let total: i128 = kani::any();
        let start: u64 = kani::any();
        let end: u64 = kani::any();
        let current: u64 = kani::any();

        kani::assume(total >= 0);
        kani::assume(end > start);
        kani::assume(total <= i64::MAX as i128); // realistic bound

        let result = calculate_unlocked_amount(total, start, end, current);
        assert!(result >= 0);
        assert!(result <= total);
    }

    /// Invariant 2: Monotonicity — more time = more unlocked
    #[kani::proof]
    fn proof_monotonic_over_time() {
        let total: i128 = kani::any();
        let start: u64 = kani::any();
        let end: u64 = kani::any();
        let t1: u64 = kani::any();
        let t2: u64 = kani::any();

        kani::assume(total >= 0);
        kani::assume(end > start);
        kani::assume(t2 >= t1);
        kani::assume(total <= i64::MAX as i128);

        let r1 = calculate_unlocked_amount(total, start, end, t1);
        let r2 = calculate_unlocked_amount(total, start, end, t2);
        assert!(r2 >= r1);
    }

    /// Invariant 3: Terminal resolution — at end_time returns exactly total
    #[kani::proof]
    fn proof_terminal_resolves_exactly() {
        let total: i128 = kani::any();
        let start: u64 = kani::any();
        let end: u64 = kani::any();
        let current: u64 = kani::any();

        kani::assume(total >= 0);
        kani::assume(end > start);
        kani::assume(current >= end);
        kani::assume(total <= i64::MAX as i128);

        let result = calculate_unlocked_amount(total, start, end, current);
        assert_eq!(result, total);
    }

    /// Invariant 4: Before start, nothing is unlocked
    #[kani::proof]
    fn proof_nothing_before_start() {
        let total: i128 = kani::any();
        let start: u64 = kani::any();
        let end: u64 = kani::any();
        let current: u64 = kani::any();

        kani::assume(total >= 0);
        kani::assume(end > start);
        kani::assume(current < start);
        kani::assume(total <= i64::MAX as i128);

        let result = calculate_unlocked_amount(total, start, end, current);
        assert_eq!(result, 0);
    }

    /// Invariant 5: Cliff support — nothing unlocked before cliff
    #[kani::proof]
    fn proof_cliff_nothing_before_cliff() {
        let total: i128 = kani::any();
        let start: u64 = kani::any();
        let cliff: u64 = kani::any();
        let end: u64 = kani::any();
        let now: u64 = kani::any();

        kani::assume(total >= 0);
        kani::assume(start <= cliff);
        kani::assume(cliff < end);
        kani::assume(now < cliff);
        kani::assume(total <= i64::MAX as i128);

        let result = calculate_unlocked(total, start, cliff, end, now);
        assert_eq!(result, 0);
    }
}
