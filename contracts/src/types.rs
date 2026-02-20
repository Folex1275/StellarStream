use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Stream {
    pub sender: Address,
    pub receiver: Address,
    pub token: Address,
    pub amount: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub withdrawn_amount: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Stream(u64),
    StreamId, // Add this to track the sequence of IDs
    Admin,
}
