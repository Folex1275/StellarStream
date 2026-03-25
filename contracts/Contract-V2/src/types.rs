use soroban_sdk::{contracttype, Address, BytesN, Vec};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct StreamV2 {
    pub sender: Address,
    pub receiver: Address,
    pub token: Address,
    pub total_amount: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub cliff_time: u64,
    pub withdrawn_amount: i128,
    pub cancelled: bool,
    pub migrated_from_v1: bool,
    pub v1_stream_id: u64,
    pub step_duration: i128,
    pub multiplier_bps: i128,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct StreamArgs {
    pub sender: Address,
    pub receiver: Address,
    pub token: Address,
    pub total_amount: i128,
    pub start_time: u64,
    pub cliff_time: u64,
    pub end_time: u64,
    pub step_duration: i128,
    pub multiplier_bps: i128,
}

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct PermitArgs {
    pub sender_pubkey: BytesN<32>,
    pub receiver: Address,
    pub token: Address,
    pub total_amount: i128,
    pub start_time: u64,
    pub cliff_time: u64,
    pub end_time: u64,
    pub nonce: u64,
    pub deadline: u64,
    pub step_duration: i128,
    pub multiplier_bps: i128,
}

// ----------------------------------------------------------------
// Events
// ----------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug)]
pub struct StreamMigratedEvent {
    pub v2_stream_id: u64,
    pub v1_stream_id: u64,
    pub caller: Address,
    pub migrated_amount: i128,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub enum MigrationEvent {
    Migrated(u64, u64, Address, i128),
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct StreamCreatedV2Event {
    pub stream_id: u64,
    pub sender: Address,
    pub receiver: Address,
    pub token: Address,
    pub total_amount: i128,
    pub start_time: u64,
    pub cliff_time: u64,
    pub end_time: u64,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct BatchStreamsCreatedEvent {
    pub stream_ids: Vec<u64>,
    pub sender: Address,
    pub total_streams: u32,
    pub total_amount: i128,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct PermitPayload {
    pub contract: Address,
    pub sender_pubkey: soroban_sdk::BytesN<32>,
    pub receiver: Address,
    pub token: Address,
    pub total_amount: i128,
    pub start_time: u64,
    pub cliff_time: u64,
    pub end_time: u64,
    pub nonce: u64,
    pub deadline: u64,
    pub step_duration: i128,
    pub multiplier_bps: i128,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct PermitStreamCreatedEvent {
    pub stream_id: u64,
    pub sender_pubkey: soroban_sdk::BytesN<32>,
    pub receiver: Address,
    pub token: Address,
    pub total_amount: i128,
    pub cliff_time: u64,
    pub nonce: u64,
    pub timestamp: u64,
}

/// Emitted when the admin is transferred to a new address.
#[contracttype]
#[derive(Clone, Debug)]
pub struct AdminTransferredEvent {
    pub previous_admin: Address,
    pub new_admin: Address,
    pub timestamp: u64,
}

/// Emitted when the contract is paused by the admin.
#[contracttype]
#[derive(Clone, Debug)]
pub struct ContractPausedEvent {
    pub admin: Address,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ContractUnpausedEvent {
    pub admin: Address,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct StreamClaimV2Event {
    pub stream_id: u64,
    pub receiver: Address,
    pub amount: i128,
    pub total_claimed: i128,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct StreamCancelledV2Event {
    pub stream_id: u64,
    pub canceller: Address,
    pub to_receiver: i128,
    pub to_sender: i128,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ProtocolHealthV2 {
    pub total_v2_tvl: i128,
    pub active_v2_users: u32,
    pub total_v2_streams: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct StreamToppedUpEvent {
    pub stream_id: u64,
    pub sender: Address,
    pub extra_amount: i128,
    pub new_total_amount: i128,
    pub new_end_time: u64,
    pub timestamp: u64,
}
