/// V1 Data Interface — read-only cross-contract client for the V1 streaming contract.
///
/// This module defines the exact XDR layout of the V1 `Stream` struct so that
/// the V2 migration logic can deserialise V1 storage without any write access.
///
/// Constraint: `get_v1_stream` uses `env.invoke_contract` in read-only mode;
/// it never mutates V1 state.
use soroban_sdk::{
    contractclient, contracterror, contracttype, Address, BytesN, Env, IntoVal, Symbol, Vec,
};

// ---------------------------------------------------------------------------
// Supporting types — must match the V1 XDR discriminants exactly
// ---------------------------------------------------------------------------

/// Mirrors `CurveType` from `Contract-V1/src/types.rs`.
///
/// XDR discriminants: `Linear = 0`, `Exponential = 1`.
/// The integer values **must not** be changed; they are part of the on-chain
/// XDR encoding and altering them would break deserialisation of existing V1
/// ledger entries.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum V1CurveType {
    Linear = 0,
    Exponential = 1,
}

/// Mirrors `Milestone` from `Contract-V1/src/types.rs`.
#[contracttype]
#[derive(Clone, Debug)]
pub struct V1Milestone {
    /// Unix timestamp (seconds) at which this milestone unlocks.
    pub timestamp: u64,
    /// Percentage of total amount unlocked at this milestone (0–100).
    pub percentage: u32,
}

// ---------------------------------------------------------------------------
// V1Stream — exact XDR layout of the V1 `Stream` struct
// ---------------------------------------------------------------------------

/// The canonical V1 stream record.
///
/// Field order and types **must** match the `#[contracttype]` layout of
/// `Stream` in `Contract-V1/src/types.rs` so that XDR deserialisation
/// succeeds when reading from the V1 contract's ledger storage.
///
/// Fields are listed in the same order as the V1 definition to guarantee
/// identical XDR encoding.
#[contracttype]
#[derive(Clone, Debug)]
pub struct V1Stream {
    /// Address that created and funded the stream.
    pub sender: Address,
    /// Address entitled to withdraw streamed tokens.
    pub receiver: Address,
    /// The streamed asset (SEP-41 token contract).
    pub token: Address,
    /// Total tokens locked into the stream at creation.
    pub total_amount: i128,
    /// Unix timestamp (seconds) when streaming begins.
    pub start_time: u64,
    /// Unix timestamp (seconds) when streaming ends.
    pub end_time: u64,
    /// Legacy field — kept for XDR alignment; use `withdrawn_amount` for accounting.
    pub withdrawn: i128,
    /// Cumulative tokens already claimed by the receiver.
    pub withdrawn_amount: i128,
    /// `true` once the stream has been cancelled.
    pub cancelled: bool,
    /// Current holder of the stream receipt NFT.
    pub receipt_owner: Address,
    /// `true` while the stream is administratively paused.
    pub is_paused: bool,
    /// Ledger timestamp at which the stream was last paused.
    pub paused_time: u64,
    /// Accumulated seconds the stream has spent in a paused state.
    pub total_paused_duration: u64,
    /// Optional milestone schedule; empty `Vec` means linear vesting.
    pub milestones: Vec<V1Milestone>,
    /// Vesting curve shape.
    pub curve_type: V1CurveType,
    /// Bit-flags controlling interest distribution (see V1 constants).
    pub interest_strategy: u32,
    /// Optional yield-bearing vault address.
    pub vault_address: Option<Address>,
    /// Principal deposited into the vault (if any).
    pub deposited_principal: i128,
    /// Optional 32-byte metadata hash.
    pub metadata: Option<BytesN<32>>,
    /// `true` when the stream amount is denominated in USD.
    pub is_usd_pegged: bool,
    /// USD-denominated amount (7 decimals) when `is_usd_pegged` is `true`.
    pub usd_amount: i128,
    /// Price oracle contract address used for USD-pegged streams.
    pub oracle_address: Address,
    /// Maximum age (seconds) of oracle price data before it is considered stale.
    pub oracle_max_staleness: u64,
    /// Minimum acceptable oracle price (slippage protection).
    pub price_min: i128,
    /// Maximum acceptable oracle price (slippage protection).
    pub price_max: i128,
    /// If `true`, the receiver cannot be transferred — identity-locked stream.
    pub is_soulbound: bool,
    /// If `true`, the underlying asset has clawback enabled.
    pub clawback_enabled: bool,
    /// Optional arbiter address for dispute resolution.
    pub arbiter: Option<Address>,
    /// `true` while the stream is frozen pending dispute resolution.
    pub is_frozen: bool,
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

/// Errors that can be returned by V1 interface operations.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum V1Error {
    /// Catch-all for unexpected V1 errors.
    Unknown = 1,
    /// The requested stream ID does not exist in V1 storage.
    StreamNotFound = 2,
}

// ---------------------------------------------------------------------------
// Read-only cross-contract helper
// ---------------------------------------------------------------------------

/// Fetch a single stream from the V1 contract without mutating any state.
///
/// This is a **read-only** cross-contract call implemented via
/// [`env.invoke_contract`].  It invokes the V1 `get_stream` function, which
/// is a pure query that does not require any authorisation and does not alter
/// ledger state.
///
/// # Arguments
/// * `env`        — The current contract environment.
/// * `v1_address` — The deployed address of the V1 streaming contract.
/// * `stream_id`  — The numeric stream identifier stored in V1 as a `u64`.
///
/// # Returns
/// The [`V1Stream`] record on success.  Any runtime failure (e.g. the stream
/// does not exist) surfaces as a host-level trap that aborts the transaction,
/// which is the correct behaviour for an invalid migration attempt.
///
/// Callers that need graceful error handling should use the generated
/// [`Client::try_get_stream`] method instead, which wraps the call in a
/// `Result`.
pub fn get_v1_stream(env: &Env, v1_address: &Address, stream_id: u64) -> V1Stream {
    // `env.invoke_contract` performs a synchronous, read-only cross-contract
    // call.  We invoke the V1 `get_stream(stream_id: u64)` function.
    // No auth is required and no ledger entries are written.
    env.invoke_contract(
        v1_address,
        &Symbol::new(env, "get_stream"),
        soroban_sdk::vec![env, stream_id.into_val(env)],
    )
}

// ---------------------------------------------------------------------------
// #[contractclient] — generated typed client for V1 contract calls
// ---------------------------------------------------------------------------

/// Typed client for the V1 streaming contract.
///
/// `Client` is generated by `#[contractclient]` and provides both
/// `get_stream` (panics on error) and `try_get_stream` (returns `Result`).
///
/// The migration logic in `lib.rs` uses `try_get_stream` so that a missing
/// or cancelled stream surfaces as a recoverable `Error` rather than a
/// host-level trap.
#[contractclient(name = "Client")]
pub trait V1Contract {
    /// Read a stream record from V1 storage.
    ///
    /// This is a **read-only** query — it does not require authorisation and
    /// does not modify any ledger entries.
    fn get_stream(env: Env, stream_id: u64) -> V1Stream;

    /// Cancel a V1 stream.  Used during migration to atomically deactivate
    /// the V1 stream before activating it in V2.
    fn cancel(env: Env, stream_id: u64, caller: Address);

    /// Alternative cancel entry-point that returns the transferred amount.
    fn cancel_stream(env: Env, stream_id: u64, caller: Address) -> i128;
}
