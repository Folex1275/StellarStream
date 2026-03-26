use soroban_sdk::{contracttype, Address, BytesN, Symbol, Val, Vec};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct StreamV2 {
    pub sender: Address,
    pub receiver: Address,
    pub beneficiary: Address,
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
    pub vault_address: Option<Address>,
    pub yield_enabled: bool,
    pub is_pending: bool,
    /// Whether this stream auto-renews each cycle (Issue: Recurrent Streams)
    pub is_recurrent: bool,
    /// Duration of each recurrence cycle in seconds (Issue: Recurrent Streams)
    pub cycle_duration: u64,
    /// 0 = Unilateral cancellation, 1 = Mutual (both parties required) (Issue: Joint Signature)
    pub cancellation_type: u32,
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
    pub vault_address: Option<Address>,
    pub yield_enabled: bool,
    /// Enable monthly auto-renewal via transfer_from allowance
    pub is_recurrent: bool,
    /// Cycle length in seconds (e.g. 2_592_000 for ~30 days)
    pub cycle_duration: u64,
    /// 0 = Unilateral, 1 = Mutual cancellation
    pub cancellation_type: u32,
    /// Reserved for future routing extensions; protocol fees currently go to treasury only.
    pub affiliate: Option<Address>,
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
    pub vault_address: Option<Address>,
    pub yield_enabled: bool,
}

// ----------------------------------------------------------------
// Batch Read Helper Types
// ----------------------------------------------------------------

/// The lifecycle status of a stream at a given point in time.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum StreamStatus {
    /// Not found — the stream ID does not exist.
    NotFound,
    /// Active — funds are still streaming.
    Active,
    /// Completed — the stream end_time has passed and all funds can be claimed.
    Completed,
    /// Cancelled — the stream was manually cancelled.
    Cancelled,
}

/// A compact summary of a stream returned by `get_streams_batch`.
/// Includes the stream's full data, the currently unlocked amount, and its status.
#[contracttype]
#[derive(Clone, Debug)]
pub struct StreamBatchEntry {
    pub stream_id: u64,
    pub unlocked_amount: i128,
    pub status: StreamStatus,
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

// ----------------------------------------------------------------
// Time-locked operations
// ----------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum Operation {
    SetAdmins(Vec<Address>, u32),
    TransferAdmin(Address),
    SetMinValue(Address, i128),
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct OperationScheduledEvent {
    pub op: Operation,
    pub execution_time: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct OperationExecutedEvent {
    pub op: Operation,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct BeneficiaryTransferredV2Event {
    pub stream_id: u64,
    pub previous_beneficiary: Address,
    pub new_beneficiary: Address,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ClawbackRebalanceEvent {
    pub token: Address,
    pub total_remaining: i128,
    pub contract_balance: i128,
    pub reduction_factor_bps: i128,
    pub timestamp: u64,
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

// ----------------------------------------------------------------
// Issue: Standardized V2 Events (NebulaEvent)
// ----------------------------------------------------------------

/// Standardized event wrapper for all V2 contract actions.
/// The Indexer uses `version` to distinguish V1 vs V2 data.
/// For stream-related events, `stream_id` is always the first topic.
#[contracttype]
#[derive(Clone, Debug)]
pub struct NebulaEvent {
    pub version: u32,
    pub timestamp: u64,
    pub action: Symbol,
    pub data: Vec<Val>,
}

// ----------------------------------------------------------------
// Issue: Recurrent Streams Events
// ----------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug)]
pub struct StreamRefilledEvent {
    pub stream_id: u64,
    pub sender: Address,
    pub amount: i128,
    pub new_start_time: u64,
    pub new_end_time: u64,
    pub timestamp: u64,
}

// ----------------------------------------------------------------
// Issue: Protocol Fee Events
// ----------------------------------------------------------------

#[contracttype]
#[derive(Clone, Debug)]
pub struct FeesWithdrawnEvent {
    pub recipient: Address,
    pub token: Address,
    pub amount: i128,
    pub timestamp: u64,
}
