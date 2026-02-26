use crate::types::{
    InterestDistribution, INTEREST_TO_PROTOCOL, INTEREST_TO_RECEIVER, INTEREST_TO_SENDER,
};

#[allow(dead_code)]
/// Calculate interest distribution based on strategy
///
/// Strategy bits:
/// - 0b001 (1): All to sender
/// - 0b010 (2): All to receiver  
/// - 0b100 (4): All to protocol
/// - 0b011 (3): 50/50 sender/receiver
/// - 0b111 (7): 33/33/33 split among all three
pub fn calculate_interest_distribution(
    total_interest: i128,
    strategy: u32,
) -> InterestDistribution {
    if total_interest <= 0 {
        return InterestDistribution {
            to_sender: 0,
            to_receiver: 0,
            to_protocol: 0,
            total_interest: 0,
        };
    }

    let (to_sender, to_receiver, to_protocol) = match strategy {
        // All to sender
        INTEREST_TO_SENDER => (total_interest, 0, 0),

        // All to receiver
        INTEREST_TO_RECEIVER => (0, total_interest, 0),

        // All to protocol
        INTEREST_TO_PROTOCOL => (0, 0, total_interest),

        // 50/50 sender and receiver
        3 => {
            let half = total_interest / 2;
            let remainder = total_interest - (half * 2);
            (half + remainder, half, 0) // Give remainder to sender
        }

        // Split among all three (33/33/33)
        7 => {
            let third = total_interest / 3;
            let remainder = total_interest - (third * 3);
            (third + remainder, third, third) // Give remainder to sender
        }

        // Custom split based on bits
        _ => {
            let sender_bit = strategy & INTEREST_TO_SENDER;
            let receiver_bit = strategy & INTEREST_TO_RECEIVER;
            let protocol_bit = strategy & INTEREST_TO_PROTOCOL;

            let total_bits = (if sender_bit > 0 { 1 } else { 0 })
                + (if receiver_bit > 0 { 1 } else { 0 })
                + (if protocol_bit > 0 { 1 } else { 0 });

            if total_bits == 0 {
                // Invalid strategy, default to receiver
                (0, total_interest, 0)
            } else {
                let share = total_interest / total_bits as i128;
                let remainder = total_interest - (share * total_bits as i128);

                let to_sender = if sender_bit > 0 { share } else { 0 };
                let to_receiver = if receiver_bit > 0 { share } else { 0 };
                let to_protocol = if protocol_bit > 0 { share } else { 0 };

                // Give remainder to first enabled party
                if sender_bit > 0 {
                    (to_sender + remainder, to_receiver, to_protocol)
                } else if receiver_bit > 0 {
                    (to_sender, to_receiver + remainder, to_protocol)
                } else {
                    (to_sender, to_receiver, to_protocol + remainder)
                }
            }
        }
    };

    InterestDistribution {
        to_sender,
        to_receiver,
        to_protocol,
        total_interest,
    }
}

/// Calculate the interest earned from a vault
/// This compares the current vault balance with the original principal
#[allow(dead_code)]
pub fn calculate_vault_interest(current_vault_value: i128, original_principal: i128) -> i128 {
    if current_vault_value > original_principal {
        current_vault_value - original_principal
    } else {
        0 // No interest if vault value decreased
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_all_to_sender() {
        let dist = calculate_interest_distribution(1000, INTEREST_TO_SENDER);
        assert_eq!(dist.to_sender, 1000);
        assert_eq!(dist.to_receiver, 0);
        assert_eq!(dist.to_protocol, 0);
        assert_eq!(dist.total_interest, 1000);
    }

    #[test]
    fn test_all_to_receiver() {
        let dist = calculate_interest_distribution(1000, INTEREST_TO_RECEIVER);
        assert_eq!(dist.to_sender, 0);
        assert_eq!(dist.to_receiver, 1000);
        assert_eq!(dist.to_protocol, 0);
    }

    #[test]
    fn test_all_to_protocol() {
        let dist = calculate_interest_distribution(1000, INTEREST_TO_PROTOCOL);
        assert_eq!(dist.to_sender, 0);
        assert_eq!(dist.to_receiver, 0);
        assert_eq!(dist.to_protocol, 1000);
    }

    #[test]
    fn test_split_sender_receiver() {
        let dist = calculate_interest_distribution(1000, 3);
        assert_eq!(dist.to_sender, 500);
        assert_eq!(dist.to_receiver, 500);
        assert_eq!(dist.to_protocol, 0);
    }

    #[test]
    fn test_split_all_three() {
        let dist = calculate_interest_distribution(1000, 7);
        assert_eq!(dist.to_sender, 334); // Gets remainder
        assert_eq!(dist.to_receiver, 333);
        assert_eq!(dist.to_protocol, 333);
    }

    #[test]
    fn test_zero_interest() {
        let dist = calculate_interest_distribution(0, INTEREST_TO_SENDER);
        assert_eq!(dist.to_sender, 0);
        assert_eq!(dist.to_receiver, 0);
        assert_eq!(dist.to_protocol, 0);
    }

    #[test]
    fn test_vault_interest_positive() {
        let interest = calculate_vault_interest(1100, 1000);
        assert_eq!(interest, 100);
    }

    #[test]
    fn test_vault_interest_zero() {
        let interest = calculate_vault_interest(1000, 1000);
        assert_eq!(interest, 0);
    }

    #[test]
    fn test_vault_interest_negative() {
        let interest = calculate_vault_interest(900, 1000);
        assert_eq!(interest, 0); // No negative interest
    }
}
