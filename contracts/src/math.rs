pub fn calculate_unlocked_amount(
    total_amount: i128,
    start_time: u64,
    end_time: u64,
    current_time: u64,
) -> i128 {
    // 1. Before the stream starts
    if current_time < start_time {
        return 0;
    }

    // 2. After the stream ends
    if current_time >= end_time {
        return total_amount;
    }

    // 3. During the stream (Linear calculation)
    // Formula: total * (elapsed_time) / (total_duration)
    // We multiply first to maintain precision.
    let elapsed_time = (current_time - start_time) as i128;
    let total_duration = (end_time - start_time) as i128;

    // Note: total_duration will not be zero because if current_time >= end_time
    // was handled above, and here current_time is between start and end.
    (total_amount * elapsed_time) / total_duration
}

pub fn calculate_withdrawable_amount(unlocked_amount: i128, withdrawn_amount: i128) -> i128 {
    unlocked_amount - withdrawn_amount
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_math_logic() {
        let total = 1000_i128;
        let start = 100;
        let end = 200;

        // Case 1: Before start
        assert_eq!(calculate_unlocked_amount(total, start, end, 50), 0);

        // Case 2: Exactly at start
        assert_eq!(calculate_unlocked_amount(total, start, end, 100), 0);

        // Case 3: Halfway through
        assert_eq!(calculate_unlocked_amount(total, start, end, 150), 500);

        // Case 4: Exactly at end
        assert_eq!(calculate_unlocked_amount(total, start, end, 200), 1000);

        // Case 5: After end
        assert_eq!(calculate_unlocked_amount(total, start, end, 250), 1000);
    }
}
