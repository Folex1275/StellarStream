use soroban_sdk::{contracttype, Address, BytesN, Vec};

// Interest distribution strategies
// Bits can be combined: e.g., 0b011 = 50% sender, 50% receiver
pub const INTEREST_TO_SENDER: u32 = 0b001; // 1: All interest to sender
pub const INTEREST_TO_RECEIVER: u32 = 0b010; // 2: All interest to receiver
pub const INTEREST_TO_PROTOCOL: u32 = 0b100; // 4: All interest to protocol

// Common strategy combinations (exported for convenience)
#[allow(dead_code)]
pub const INTEREST_SPLIT_SENDER_RECEIVER: u32 = 0b011; // 3: 50/50 sender/receiver
#[allow(dead_code)]
pub const INTEREST_SPLIT_ALL: u32 = 0b111; // 7: 33/33/33 split

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub timestamp: u64,
    pub percentage: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct Stream {
    pub sender: Address,
    pub receiver: Address,
    pub token: Address,
    pub total_amount: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub withdrawn: i128,
    pub withdrawn_amount: i128,
    pub cancelled: bool,
    pub receipt_owner: Address,
    pub is_paused: bool,
    pub paused_time: u64,
    pub total_paused_duration: u64,
    pub milestones: Vec<Milestone>,
    pub interest_strategy: u32, // Strategy for interest distribution
    pub vault_address: Option<Address>, // Optional vault for yield generation
    pub deposited_principal: i128, // Amount deposited in vault (for tracking)
    pub metadata: Option<BytesN<32>>, // Optional fixed-size off-chain reference
}

// Legacy Stream struct (v1) - for migration example
// This represents an older version without cliff_time
#[contracttype]
#[derive(Clone)]
pub struct StreamProposal {
    pub sender: Address,
    pub receiver: Address,
    pub token: Address,
    pub total_amount: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub approvers: Vec<Address>,
    pub required_approvals: u32,
    pub deadline: u64,
    pub executed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreamRequest {
    pub receiver: Address,
    pub amount: i128,
    pub start_time: u64,
    pub cliff_time: u64,
    pub end_time: u64,
    pub interest_strategy: u32,
    pub vault_address: Option<Address>,
    pub metadata: Option<BytesN<32>>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InterestDistribution {
    pub to_sender: i128,
    pub to_receiver: i128,
    pub to_protocol: i128,
    pub total_interest: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Stream(u64),
    StreamId,
    Admin,
    FeeBps,
    Treasury,
    IsPaused,
    ReentrancyLock,
    ContractVersion,        // Tracks current contract version
    MigrationExecuted(u32), // Tracks which migrations have been executed
}

#[contracttype]
#[derive(Clone)]
pub struct StreamReceipt {
    pub stream_id: u64,
    pub owner: Address,
    pub minted_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct ReceiptMetadata {
    pub stream_id: u64,
    pub locked_balance: i128,
    pub unlocked_balance: i128,
    pub total_amount: i128,
    pub token: Address,
}
