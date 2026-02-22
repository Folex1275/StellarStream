use soroban_sdk::{Address, Bytes, Env};

/// Flash loan receiver interface
/// Contracts receiving flash loans must implement this
#[allow(dead_code)]
pub trait FlashLoanReceiver {
    /// Called by the lending contract during flash loan execution
    ///
    /// # Parameters
    /// - `initiator`: Address that initiated the flash loan
    /// - `token`: Token being borrowed
    /// - `amount`: Amount borrowed
    /// - `fee`: Fee to be paid
    /// - `params`: Additional parameters passed by initiator
    ///
    /// # Returns
    /// Must return true if loan is accepted and will be repaid
    fn execute_operation(
        env: Env,
        initiator: Address,
        token: Address,
        amount: i128,
        fee: i128,
        params: Bytes,
    ) -> bool;
}
