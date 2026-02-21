use soroban_sdk::{contracttype, Address, Vec};

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
    pub cancelled: bool,
    pub receipt_owner: Address,
    pub is_paused: bool,
    pub paused_time: u64,
    pub total_paused_duration: u64,
    pub milestones: Vec<Milestone>,
}

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
