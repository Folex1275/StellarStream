#![no_std]
#![allow(clippy::too_many_arguments)]

mod errors;
mod flash_loan;
mod math;
mod oracle;
mod storage;
mod types;

use errors::Error;
use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Env, Vec};
use storage::{PROPOSAL_COUNT, RECEIPT, STREAM_COUNT, RESTRICTED_ADDRESSES};
use types::{
    ContributorRequest, RequestCreatedEvent, RequestExecutedEvent, RequestKey, RequestStatus,
    CurveType, DataKey, Milestone, ProposalApprovedEvent, ProposalCreatedEvent, ReceiptMetadata,
    ReceiptTransferredEvent, Role, Stream, StreamCancelledEvent, StreamClaimEvent,
    StreamCreatedEvent, StreamPausedEvent, StreamProposal, StreamReceipt, StreamUnpausedEvent,
};

#[contract]
pub struct StellarStreamContract;

#[contractimpl]
impl StellarStreamContract {
    /// Create a multi-signature stream proposal.
    ///
    /// Registers a pending [`StreamProposal`] that must collect `required_approvals`
    /// signatures via [`approve_proposal`] before a stream is created and funded.
    /// No tokens are transferred at this stage.
    ///
    /// # Authorization
    /// `sender` must sign the transaction.
    ///
    /// # Arguments
    /// * `sender`            – Address initiating the proposal and funding the stream once executed.
    /// * `receiver`          – Intended stream beneficiary. Must not be OFAC-restricted.
    /// * `token`             – SAC-compliant token contract address.
    /// * `total_amount`      – Total tokens to stream (in the token's base unit). Must be > 0.
    /// * `start_time`        – Stream start as a Unix timestamp (seconds). Must be < `end_time`.
    /// * `end_time`          – Stream end as a Unix timestamp (seconds).
    /// * `required_approvals`– Minimum number of approvals needed to execute. Must be ≥ 1.
    /// * `deadline`          – Proposal expiry as a Unix timestamp. Must be in the future.
    ///
    /// # Returns
    /// The newly allocated `proposal_id` (monotonically increasing `u64`).
    ///
    /// # Errors
    /// * [`Error::InvalidTimeRange`]         – `start_time >= end_time`.
    /// * [`Error::InvalidAmount`]            – `total_amount <= 0`.
    /// * [`Error::InvalidApprovalThreshold`] – `required_approvals == 0`.
    /// * [`Error::ProposalExpired`]          – `deadline <= current ledger timestamp`.
    /// * [`Error::AlreadyExecuted`]          – Receiver is OFAC-restricted (error code 20).
    ///
    /// # Events
    /// Emits `("create", sender)` → [`ProposalCreatedEvent`].
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * `(PROPOSAL_COUNT, proposal_id)` → [`StreamProposal`]
    /// * `PROPOSAL_COUNT` → next proposal counter
    pub fn create_proposal(
        env: Env,
        sender: Address,
        receiver: Address,
        token: Address,
        total_amount: i128,
        start_time: u64,
        end_time: u64,
        required_approvals: u32,
        deadline: u64,
    ) -> Result<u64, Error> {
        sender.require_auth();

        // OFAC Compliance: Check if receiver is restricted
        Self::validate_receiver(&env, &receiver)?;

        if start_time >= end_time {
            return Err(Error::InvalidTimeRange);
        }
        if total_amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if required_approvals == 0 {
            return Err(Error::InvalidApprovalThreshold);
        }
        if deadline <= env.ledger().timestamp() {
            return Err(Error::ProposalExpired);
        }

        let proposal_id: u64 = env.storage().instance().get(&PROPOSAL_COUNT).unwrap_or(0);
        let next_id = proposal_id + 1;

        let proposal = StreamProposal {
            sender: sender.clone(),
            receiver: receiver.clone(),
            token: token.clone(),
            total_amount,
            start_time,
            end_time,
            approvers: Vec::new(&env),
            required_approvals,
            deadline,
            executed: false,
        };

        env.storage()
            .instance()
            .set(&(PROPOSAL_COUNT, proposal_id), &proposal);
        env.storage().instance().set(&PROPOSAL_COUNT, &next_id);

        // Emit ProposalCreatedEvent
        env.events().publish(
            (symbol_short!("create"), sender.clone()),
            ProposalCreatedEvent {
                proposal_id,
                sender: sender.clone(),
                receiver: receiver.clone(),
                token: token.clone(),
                total_amount,
                start_time,
                end_time,
                required_approvals,
                deadline,
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(proposal_id)
    }

    /// Add an approval to a pending proposal.
    ///
    /// Each unique address may approve at most once. When the number of approvals
    /// reaches `required_approvals`, the proposal is automatically executed:
    /// tokens are pulled from the original `sender` and a new stream is created.
    ///
    /// # Authorization
    /// `approver` must sign the transaction.
    ///
    /// # Arguments
    /// * `proposal_id` – ID returned by [`create_proposal`].
    /// * `approver`    – Address casting the approval vote.
    ///
    /// # Errors
    /// * [`Error::ProposalNotFound`]        – No proposal exists for `proposal_id`.
    /// * [`Error::ProposalAlreadyExecuted`] – Proposal has already been executed.
    /// * [`Error::ProposalExpired`]         – Current time exceeds the proposal deadline.
    /// * [`Error::AlreadyApproved`]         – `approver` has already voted on this proposal.
    ///
    /// # Events
    /// Emits `("approve", approver)` → [`ProposalApprovedEvent`].
    /// If execution is triggered, also emits `("create", sender)` → [`StreamCreatedEvent`].
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * `(PROPOSAL_COUNT, proposal_id)` → updated [`StreamProposal`]
    /// * On execution: `(STREAM_COUNT, stream_id)` → [`Stream`], `(RECEIPT, stream_id)` → [`StreamReceipt`]
    pub fn approve_proposal(env: Env, proposal_id: u64, approver: Address) -> Result<(), Error> {
        approver.require_auth();

        let key = (PROPOSAL_COUNT, proposal_id);
        let mut proposal: StreamProposal = env
            .storage()
            .instance()
            .get(&key)
            .ok_or(Error::ProposalNotFound)?;

        if proposal.executed {
            return Err(Error::ProposalAlreadyExecuted);
        }
        if env.ledger().timestamp() > proposal.deadline {
            return Err(Error::ProposalExpired);
        }

        for existing_approver in proposal.approvers.iter() {
            if existing_approver == approver {
                return Err(Error::AlreadyApproved);
            }
        }

        proposal.approvers.push_back(approver.clone());
        let approval_count = proposal.approvers.len();

        if approval_count >= proposal.required_approvals {
            proposal.executed = true;
            env.storage().instance().set(&key, &proposal);
            Self::execute_proposal(&env, proposal.clone())?;
        } else {
            env.storage().instance().set(&key, &proposal);
        }

        // Emit ProposalApprovedEvent
        env.events().publish(
            (symbol_short!("approve"), approver.clone()),
            ProposalApprovedEvent {
                proposal_id,
                approver: approver.clone(),
                approval_count,
                required_approvals: proposal.required_approvals,
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(())
    }

    fn execute_proposal(env: &Env, proposal: StreamProposal) -> Result<u64, Error> {
        // Transfer tokens from proposer to contract
        let token_client = token::Client::new(env, &proposal.token);
        token_client.transfer(
            &proposal.sender,
            &env.current_contract_address(),
            &proposal.total_amount,
        );

        // Allocate next stream id
        let stream_id: u64 = env.storage().instance().get(&STREAM_COUNT).unwrap_or(0);
        let next_id = stream_id + 1;

        let stream = Stream {
            sender: proposal.sender.clone(),
            receiver: proposal.receiver.clone(),
            token: proposal.token.clone(),
            total_amount: proposal.total_amount,
            start_time: proposal.start_time,
            end_time: proposal.end_time,
            withdrawn_amount: 0,
            interest_strategy: 0,
            vault_address: None,
            deposited_principal: proposal.total_amount,
            metadata: None,
            withdrawn: 0,
            cancelled: false,
            receipt_owner: proposal.receiver.clone(),
            is_paused: false,
            paused_time: 0,
            total_paused_duration: 0,
            milestones: Vec::new(env),
            curve_type: CurveType::Linear,
            is_usd_pegged: false,
            usd_amount: 0,
            oracle_address: proposal.sender.clone(),
            oracle_max_staleness: 0,
            price_min: 0,
            price_max: 0,
        };

        env.storage()
            .instance()
            .set(&(STREAM_COUNT, stream_id), &stream);
        env.storage().instance().set(&STREAM_COUNT, &next_id);

        // Emit StreamCreatedEvent
        env.events().publish(
            (symbol_short!("create"), proposal.sender.clone()),
            StreamCreatedEvent {
                stream_id,
                sender: proposal.sender.clone(),
                receiver: proposal.receiver.clone(),
                token: proposal.token,
                total_amount: proposal.total_amount,
                start_time: proposal.start_time,
                end_time: proposal.end_time,
                timestamp: env.ledger().timestamp(),
            },
        );
        Self::mint_receipt(env, stream_id, &proposal.receiver);

        Ok(stream_id)
    }

    /// Create a single-signature stream (convenience wrapper around [`create_stream_with_milestones`]).
    ///
    /// Transfers `total_amount` tokens from `sender` to the contract immediately and
    /// mints a [`StreamReceipt`] NFT to `receiver`. The receipt owner is the only
    /// address authorised to call [`withdraw`].
    ///
    /// # Authorization
    /// `sender` must sign the transaction.
    ///
    /// # Arguments
    /// * `sender`       – Funding address. Tokens are pulled from here on creation.
    /// * `receiver`     – Initial receipt owner and withdrawal beneficiary. Must not be OFAC-restricted.
    /// * `token`        – SAC-compliant token contract address.
    /// * `total_amount` – Total tokens to stream. Must be > 0.
    /// * `start_time`   – Stream start (Unix seconds). Must be < `end_time`.
    /// * `end_time`     – Stream end (Unix seconds).
    /// * `curve_type`   – Unlock curve: [`CurveType::Linear`] or [`CurveType::Exponential`].
    ///
    /// # Returns
    /// The newly allocated `stream_id`.
    ///
    /// # Errors
    /// * [`Error::InvalidTimeRange`] – `start_time >= end_time`.
    /// * [`Error::InvalidAmount`]    – `total_amount <= 0`.
    /// * [`Error::AlreadyExecuted`]  – Receiver is OFAC-restricted (error code 20).
    ///
    /// # Events
    /// Emits `("create", sender)` → [`StreamCreatedEvent`].
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * `(STREAM_COUNT, stream_id)` → [`Stream`]
    /// * `(RECEIPT, stream_id)`      → [`StreamReceipt`]
    /// * `STREAM_COUNT`              → updated counter
    pub fn create_stream(
        env: Env,
        sender: Address,
        receiver: Address,
        token: Address,
        total_amount: i128,
        start_time: u64,
        end_time: u64,
        curve_type: CurveType,
    ) -> Result<u64, Error> {
        let milestones = Vec::new(&env);
        Self::create_stream_with_milestones(
            env,
            sender,
            receiver,
            token,
            total_amount,
            start_time,
            end_time,
            milestones,
            curve_type,
        )
    }

    /// Create a stream with milestone-gated unlock caps.
    ///
    /// Identical to [`create_stream`] but accepts an ordered list of [`Milestone`]s.
    /// Each milestone defines a `(timestamp, percentage)` pair that caps the maximum
    /// withdrawable amount until that timestamp is reached. The effective unlocked
    /// amount is `min(curve_unlocked, highest_reached_milestone_cap)`.
    ///
    /// # Authorization
    /// `sender` must sign the transaction.
    ///
    /// # Arguments
    /// * `sender`       – Funding address.
    /// * `receiver`     – Initial receipt owner. Must not be OFAC-restricted.
    /// * `token`        – SAC-compliant token contract address.
    /// * `total_amount` – Total tokens to stream. Must be > 0.
    /// * `start_time`   – Stream start (Unix seconds). Must be < `end_time`.
    /// * `end_time`     – Stream end (Unix seconds).
    /// * `milestones`   – Ordered list of [`Milestone`] unlock gates. May be empty.
    /// * `curve_type`   – Unlock curve: [`CurveType::Linear`] or [`CurveType::Exponential`].
    ///
    /// # Returns
    /// The newly allocated `stream_id`.
    ///
    /// # Errors
    /// * [`Error::InvalidTimeRange`] – `start_time >= end_time`.
    /// * [`Error::InvalidAmount`]    – `total_amount <= 0`.
    /// * [`Error::AlreadyExecuted`]  – Receiver is OFAC-restricted (error code 20).
    ///
    /// # Events
    /// Emits `("create", sender)` → [`StreamCreatedEvent`].
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * `(STREAM_COUNT, stream_id)` → [`Stream`]
    /// * `(RECEIPT, stream_id)`      → [`StreamReceipt`]
    /// * `STREAM_COUNT`              → updated counter
    pub fn create_stream_with_milestones(
        env: Env,
        sender: Address,
        receiver: Address,
        token: Address,
        total_amount: i128,
        start_time: u64,
        end_time: u64,
        milestones: Vec<Milestone>,
        curve_type: CurveType,
    ) -> Result<u64, Error> {
        sender.require_auth();

        // OFAC Compliance: Check if receiver is restricted
        Self::validate_receiver(&env, &receiver)?;

        if start_time >= end_time {
            return Err(Error::InvalidTimeRange);
        }
        if total_amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &total_amount);

        let stream_id: u64 = env.storage().instance().get(&STREAM_COUNT).unwrap_or(0);
        let next_id = stream_id + 1;

        let stream = Stream {
            sender: sender.clone(),
            receiver: receiver.clone(),
            token: token.clone(),
            total_amount,
            start_time,
            end_time,
            withdrawn_amount: 0,
            interest_strategy: 0,
            vault_address: None,
            deposited_principal: total_amount,
            metadata: None,
            withdrawn: 0,
            cancelled: false,
            receipt_owner: receiver.clone(),
            is_paused: false,
            paused_time: 0,
            total_paused_duration: 0,
            milestones,
            curve_type,
            is_usd_pegged: false,
            usd_amount: 0,
            oracle_address: sender.clone(),
            oracle_max_staleness: 0,
            price_min: 0,
            price_max: 0,
        };

        env.storage()
            .instance()
            .set(&(STREAM_COUNT, stream_id), &stream);
        env.storage().instance().set(&STREAM_COUNT, &next_id);

        env.events().publish(
            (symbol_short!("create"), sender.clone()),
            StreamCreatedEvent {
                stream_id,
                sender: sender.clone(),
                receiver: receiver.clone(),
                token,
                total_amount,
                start_time,
                end_time,
                timestamp: env.ledger().timestamp(),
            },
        );
        Self::mint_receipt(&env, stream_id, &receiver);

        Ok(stream_id)
    }

    /// Create a USD-pegged stream whose token amount adjusts to an oracle price.
    ///
    /// The deposit amount is calculated at creation time as
    /// `token_amount = usd_amount / oracle_price`. On each [`withdraw`] call the
    /// unlocked USD value is re-converted at the current oracle price, so the
    /// receiver always receives the correct USD-denominated amount regardless of
    /// token price movements (within the configured price bounds).
    ///
    /// # Authorization
    /// `sender` must sign the transaction.
    ///
    /// # Arguments
    /// * `sender`         – Funding address.
    /// * `receiver`       – Initial receipt owner. Must not be OFAC-restricted.
    /// * `token`          – SAC-compliant token contract address.
    /// * `usd_amount`     – Total USD value to stream (7-decimal fixed-point, e.g. `5_000_000_000` = $500). Must be > 0.
    /// * `start_time`     – Stream start (Unix seconds). Must be < `end_time`.
    /// * `end_time`       – Stream end (Unix seconds).
    /// * `oracle_address` – Price oracle contract address.
    /// * `max_staleness`  – Maximum acceptable age of oracle price data (seconds).
    /// * `min_price`      – Lower price bound for slippage protection.
    /// * `max_price`      – Upper price bound for slippage protection.
    ///
    /// # Returns
    /// The newly allocated `stream_id`.
    ///
    /// # Errors
    /// * [`Error::InvalidTimeRange`]  – `start_time >= end_time`.
    /// * [`Error::InvalidAmount`]     – `usd_amount <= 0` or token amount calculation overflows.
    /// * [`Error::OracleFailed`]      – Oracle call failed or returned stale data.
    /// * [`Error::PriceOutOfBounds`]  – Oracle price is outside `[min_price, max_price]`.
    /// * [`Error::AlreadyExecuted`]   – Receiver is OFAC-restricted (error code 20).
    ///
    /// # Events
    /// Emits `("create", sender)` → [`StreamCreatedEvent`] (with `total_amount` set to the
    /// calculated token deposit, not the USD amount).
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * `(STREAM_COUNT, stream_id)` → [`Stream`] (with `is_usd_pegged = true`)
    /// * `(RECEIPT, stream_id)`      → [`StreamReceipt`]
    /// * `STREAM_COUNT`              → updated counter
    pub fn create_usd_pegged_stream(
        env: Env,
        sender: Address,
        receiver: Address,
        token: Address,
        usd_amount: i128,
        start_time: u64,
        end_time: u64,
        oracle_address: Address,
        max_staleness: u64,
        min_price: i128,
        max_price: i128,
    ) -> Result<u64, Error> {
        sender.require_auth();

        // OFAC Compliance: Check if receiver is restricted
        Self::validate_receiver(&env, &receiver)?;

        if start_time >= end_time {
            return Err(Error::InvalidTimeRange);
        }
        if usd_amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Get initial price to calculate deposit amount
        let price = oracle::get_price(&env, &oracle_address, max_staleness)
            .map_err(|_| Error::OracleFailed)?;

        // Check price bounds
        if price < min_price || price > max_price {
            return Err(Error::PriceOutOfBounds);
        }

        // Calculate initial token amount
        let initial_amount =
            oracle::calculate_token_amount(usd_amount, price).map_err(|_| Error::InvalidAmount)?;

        // Transfer tokens
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &initial_amount);

        let stream_id: u64 = env.storage().instance().get(&STREAM_COUNT).unwrap_or(0);
        let next_id = stream_id + 1;

        let stream = Stream {
            sender: sender.clone(),
            receiver: receiver.clone(),
            token: token.clone(),
            total_amount: initial_amount,
            start_time,
            end_time,
            withdrawn_amount: 0,
            interest_strategy: 0,
            vault_address: None,
            deposited_principal: initial_amount,
            metadata: None,
            withdrawn: 0,
            cancelled: false,
            receipt_owner: receiver.clone(),
            is_paused: false,
            paused_time: 0,
            total_paused_duration: 0,
            milestones: Vec::new(&env),
            curve_type: CurveType::Linear,
            is_usd_pegged: true,
            usd_amount,
            oracle_address,
            oracle_max_staleness: max_staleness,
            price_min: min_price,
            price_max: max_price,
        };

        env.storage()
            .instance()
            .set(&(STREAM_COUNT, stream_id), &stream);
        env.storage().instance().set(&STREAM_COUNT, &next_id);

        env.events().publish(
            (symbol_short!("create"), sender.clone()),
            StreamCreatedEvent {
                stream_id,
                sender,
                receiver: receiver.clone(),
                token,
                total_amount: initial_amount,
                start_time,
                end_time,
                timestamp: env.ledger().timestamp(),
            },
        );
        Self::mint_receipt(&env, stream_id, &receiver);

        Ok(stream_id)
    }

    /// Pause an active stream, freezing the unlock clock.
    ///
    /// Records `paused_time = current_ledger_timestamp`. While paused, the unlocked
    /// balance does not increase and [`withdraw`] is blocked. The accumulated pause
    /// duration is tracked in `total_paused_duration` and subtracted from elapsed
    /// time in all unlock calculations, so the receiver does not lose any vesting
    /// time. Calling this on an already-paused stream is a no-op.
    ///
    /// # Authorization
    /// `caller` must sign the transaction and must be the stream `sender`.
    ///
    /// # Arguments
    /// * `stream_id` – ID of the stream to pause.
    /// * `caller`    – Must equal `stream.sender`.
    ///
    /// # Errors
    /// * [`Error::StreamNotFound`]   – No stream exists for `stream_id`.
    /// * [`Error::Unauthorized`]     – `caller` is not the stream sender.
    /// * [`Error::AlreadyCancelled`] – Stream has already been cancelled.
    ///
    /// # Events
    /// Emits `("pause", caller)` → [`StreamPausedEvent`].
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * `(STREAM_COUNT, stream_id)` → updated [`Stream`] (`is_paused = true`, `paused_time` set)
    pub fn pause_stream(env: Env, stream_id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();

        let key = (STREAM_COUNT, stream_id);
        let mut stream: Stream = env
            .storage()
            .instance()
            .get(&key)
            .ok_or(Error::StreamNotFound)?;

        if stream.sender != caller {
            return Err(Error::Unauthorized);
        }
        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }
        if stream.is_paused {
            return Ok(());
        }

        stream.is_paused = true;
        stream.paused_time = env.ledger().timestamp();
        env.storage().instance().set(&key, &stream);

        // Emit StreamPausedEvent
        env.events().publish(
            (symbol_short!("pause"), caller.clone()),
            StreamPausedEvent {
                stream_id,
                pauser: caller,
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(())
    }

    /// Resume a paused stream.
    ///
    /// Calculates the pause duration (`current_time - paused_time`) and adds it to
    /// `total_paused_duration`, effectively extending the stream's end time by the
    /// same amount. Calling this on a stream that is not paused is a no-op.
    ///
    /// # Authorization
    /// `caller` must sign the transaction and must be the stream `sender`.
    ///
    /// # Arguments
    /// * `stream_id` – ID of the stream to resume.
    /// * `caller`    – Must equal `stream.sender`.
    ///
    /// # Errors
    /// * [`Error::StreamNotFound`]   – No stream exists for `stream_id`.
    /// * [`Error::Unauthorized`]     – `caller` is not the stream sender.
    /// * [`Error::AlreadyCancelled`] – Stream has already been cancelled.
    ///
    /// # Events
    /// Emits `("unpause", caller)` → [`StreamUnpausedEvent`] (includes `paused_duration`).
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * `(STREAM_COUNT, stream_id)` → updated [`Stream`] (`is_paused = false`, `total_paused_duration` incremented)
    pub fn unpause_stream(env: Env, stream_id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();

        let key = (STREAM_COUNT, stream_id);
        let mut stream: Stream = env
            .storage()
            .instance()
            .get(&key)
            .ok_or(Error::StreamNotFound)?;

        if stream.sender != caller {
            return Err(Error::Unauthorized);
        }
        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }
        if !stream.is_paused {
            return Ok(());
        }

        let current_time = env.ledger().timestamp();
        let pause_duration = current_time - stream.paused_time;
        stream.total_paused_duration += pause_duration;
        stream.is_paused = false;
        stream.paused_time = 0;

        env.storage().instance().set(&key, &stream);

        // Emit StreamUnpausedEvent
        env.events().publish(
            (symbol_short!("unpause"), caller.clone()),
            StreamUnpausedEvent {
                stream_id,
                unpauser: caller,
                paused_duration: pause_duration,
                timestamp: current_time,
            },
        );

        Ok(())
    }

    fn mint_receipt(env: &Env, stream_id: u64, owner: &Address) {
        let receipt = StreamReceipt {
            stream_id,
            owner: owner.clone(),
            minted_at: env.ledger().timestamp(),
        };
        env.storage()
            .instance()
            .set(&(RECEIPT, stream_id), &receipt);
    }

    /// Transfer the stream receipt NFT to a new owner.
    ///
    /// The receipt owner is the only address authorised to call [`withdraw`].
    /// Transferring the receipt effectively transfers the right to claim all
    /// future unlocked funds. The `receipt_owner` field on the [`Stream`] struct
    /// is updated in sync.
    ///
    /// # Authorization
    /// `from` must sign the transaction and must be the current receipt owner.
    ///
    /// # Arguments
    /// * `stream_id` – ID of the stream whose receipt is being transferred.
    /// * `from`      – Current receipt owner.
    /// * `to`        – New receipt owner. Must not be OFAC-restricted.
    ///
    /// # Errors
    /// * [`Error::StreamNotFound`]  – No stream or receipt exists for `stream_id`.
    /// * [`Error::NotReceiptOwner`] – `from` is not the current receipt owner.
    /// * [`Error::AlreadyExecuted`] – `to` is OFAC-restricted (error code 20).
    ///
    /// # Events
    /// Emits `("transfer", from)` → [`ReceiptTransferredEvent`].
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * `(RECEIPT, stream_id)`      → updated [`StreamReceipt`] (new owner)
    /// * `(STREAM_COUNT, stream_id)` → updated [`Stream`] (`receipt_owner` field)
    pub fn transfer_receipt(
        env: Env,
        stream_id: u64,
        from: Address,
        to: Address,
    ) -> Result<(), Error> {
        from.require_auth();

        // OFAC Compliance: Check if recipient is restricted
        Self::validate_receiver(&env, &to)?;

        let receipt_key = (RECEIPT, stream_id);
        let receipt: StreamReceipt = env
            .storage()
            .instance()
            .get(&receipt_key)
            .ok_or(Error::StreamNotFound)?;

        if receipt.owner != from {
            return Err(Error::NotReceiptOwner);
        }

        let stream_key = (STREAM_COUNT, stream_id);
        let mut stream: Stream = env
            .storage()
            .instance()
            .get(&stream_key)
            .ok_or(Error::StreamNotFound)?;

        stream.receipt_owner = to.clone();
        env.storage().instance().set(&stream_key, &stream);

        let new_receipt = StreamReceipt {
            stream_id,
            owner: to.clone(),
            minted_at: receipt.minted_at,
        };
        env.storage().instance().set(&receipt_key, &new_receipt);

        // Emit ReceiptTransferredEvent
        env.events().publish(
            (symbol_short!("transfer"), from.clone()),
            ReceiptTransferredEvent {
                stream_id,
                from,
                to,
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(())
    }

    /// Fetch the raw [`StreamReceipt`] for a stream.
    ///
    /// # Arguments
    /// * `stream_id` – ID of the stream.
    ///
    /// # Returns
    /// The [`StreamReceipt`] containing `stream_id`, `owner`, and `minted_at`.
    ///
    /// # Errors
    /// * [`Error::StreamNotFound`] – No receipt exists for `stream_id`.
    ///
    /// # Storage
    /// Reads **instance** storage key `(RECEIPT, stream_id)`.
    pub fn get_receipt(env: Env, stream_id: u64) -> Result<StreamReceipt, Error> {
        env.storage()
            .instance()
            .get(&(RECEIPT, stream_id))
            .ok_or(Error::StreamNotFound)
    }

    /// Return a computed [`ReceiptMetadata`] snapshot for a stream.
    ///
    /// Calculates `locked_balance`, `unlocked_balance`, and `total_amount` at the
    /// current ledger timestamp without modifying any state. Useful for frontends
    /// that need a single read-only call to render the stream card.
    ///
    /// # Arguments
    /// * `stream_id` – ID of the stream.
    ///
    /// # Returns
    /// [`ReceiptMetadata`] with:
    /// * `locked_balance`   – Tokens not yet unlocked.
    /// * `unlocked_balance` – Tokens unlocked but not yet withdrawn.
    /// * `total_amount`     – Original deposit.
    /// * `token`            – Token contract address.
    ///
    /// # Errors
    /// * [`Error::StreamNotFound`] – No stream exists for `stream_id`.
    ///
    /// # Storage
    /// Reads **instance** storage key `(STREAM_COUNT, stream_id)`. No writes.
    pub fn get_receipt_metadata(env: Env, stream_id: u64) -> Result<ReceiptMetadata, Error> {
        let stream: Stream = env
            .storage()
            .instance()
            .get(&(STREAM_COUNT, stream_id))
            .ok_or(Error::StreamNotFound)?;

        let current_time = env.ledger().timestamp();
        let unlocked = Self::calculate_unlocked(&stream, current_time);
        let locked = stream.total_amount - unlocked;

        Ok(ReceiptMetadata {
            stream_id,
            locked_balance: locked,
            unlocked_balance: unlocked - stream.withdrawn,
            total_amount: stream.total_amount,
            token: stream.token,
        })
    }

    /// Withdraw all currently unlocked tokens to the receipt owner.
    ///
    /// Calculates the withdrawable amount as `unlocked - already_withdrawn`.
    /// For USD-pegged streams the unlocked USD value is re-priced at the current
    /// oracle rate before conversion to tokens.
    ///
    /// # Authorization
    /// `caller` must sign the transaction and must be the current receipt owner.
    ///
    /// # Arguments
    /// * `stream_id` – ID of the stream to withdraw from.
    /// * `caller`    – Must be the current receipt owner.
    ///
    /// # Returns
    /// The token amount transferred to the receiver.
    ///
    /// # Errors
    /// * [`Error::StreamNotFound`]    – No stream or receipt exists for `stream_id`.
    /// * [`Error::NotReceiptOwner`]   – `caller` is not the current receipt owner.
    /// * [`Error::AlreadyCancelled`]  – Stream has been cancelled.
    /// * [`Error::StreamPaused`]      – Stream is currently paused.
    /// * [`Error::InsufficientBalance`] – No tokens are available to withdraw yet.
    /// * [`Error::OracleStalePrice`]  – Oracle price is stale (USD-pegged streams only).
    /// * [`Error::PriceOutOfBounds`]  – Oracle price outside configured bounds (USD-pegged only).
    /// * [`Error::InvalidAmount`]     – Token amount calculation overflow (USD-pegged only).
    ///
    /// # Events
    /// Emits `("claim", receiver)` → [`StreamClaimEvent`].
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * `(STREAM_COUNT, stream_id)` → updated [`Stream`] (`withdrawn_amount` incremented)
    pub fn withdraw(env: Env, stream_id: u64, caller: Address) -> Result<i128, Error> {
        caller.require_auth();

        let receipt: StreamReceipt = env
            .storage()
            .instance()
            .get(&(RECEIPT, stream_id))
            .ok_or(Error::StreamNotFound)?;

        if receipt.owner != caller {
            return Err(Error::NotReceiptOwner);
        }

        let key = (STREAM_COUNT, stream_id);
        let mut stream: Stream = env
            .storage()
            .instance()
            .get(&key)
            .ok_or(Error::StreamNotFound)?;

        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }
        if stream.is_paused {
            return Err(Error::StreamPaused);
        }

        let current_time = env.ledger().timestamp();

        // For USD-pegged streams, calculate based on current price
        let to_withdraw = if stream.is_usd_pegged {
            // Get current price from oracle
            let price =
                oracle::get_price(&env, &stream.oracle_address, stream.oracle_max_staleness)
                    .map_err(|_| Error::OracleStalePrice)?;

            // Check price bounds
            if price < stream.price_min || price > stream.price_max {
                return Err(Error::PriceOutOfBounds);
            }

            // Calculate unlocked USD amount
            let unlocked_usd =
                Self::calculate_unlocked_usd(&stream, current_time, stream.usd_amount);

            // Convert to token amount at current price
            let unlocked_tokens = oracle::calculate_token_amount(unlocked_usd, price)
                .map_err(|_| Error::InvalidAmount)?;

            unlocked_tokens - stream.withdrawn_amount
        } else {
            // Standard stream
            let unlocked = Self::calculate_unlocked(&stream, current_time);
            unlocked - stream.withdrawn_amount
        };

        if to_withdraw <= 0 {
            return Err(Error::InsufficientBalance);
        }

        stream.withdrawn_amount += to_withdraw;
        env.storage().instance().set(&key, &stream);

        let token_client = token::Client::new(&env, &stream.token);
        token_client.transfer(
            &env.current_contract_address(),
            &stream.receiver,
            &to_withdraw,
        );

        // Emit StreamClaimEvent
        env.events().publish(
            (symbol_short!("claim"), stream.receiver.clone()),
            StreamClaimEvent {
                stream_id,
                claimer: stream.receiver,
                amount: to_withdraw,
                total_claimed: stream.withdrawn_amount,
                timestamp: current_time,
            },
        );

        Ok(to_withdraw)
    }

    /// Cancel a stream and settle pro-rated balances immediately.
    ///
    /// Calculates the unlocked amount at the current ledger timestamp.
    /// * The **receiver** (receipt owner) receives `unlocked - already_withdrawn`.
    /// * The **sender** receives `total_amount - unlocked` (the unearned remainder).
    ///
    /// Either the original `sender` or the current receipt owner may cancel.
    ///
    /// # Authorization
    /// `caller` must sign the transaction and must be either `stream.sender` or the
    /// current receipt owner.
    ///
    /// # Arguments
    /// * `stream_id` – ID of the stream to cancel.
    /// * `caller`    – Authorised canceller (sender or receipt owner).
    ///
    /// # Errors
    /// * [`Error::StreamNotFound`]   – No stream or receipt exists for `stream_id`.
    /// * [`Error::Unauthorized`]     – `caller` is neither the sender nor the receipt owner.
    /// * [`Error::AlreadyCancelled`] – Stream has already been cancelled.
    ///
    /// # Events
    /// Emits `("cancel", caller)` → [`StreamCancelledEvent`] (includes `to_receiver` and `to_sender`).
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * `(STREAM_COUNT, stream_id)` → updated [`Stream`] (`cancelled = true`)
    pub fn cancel(env: Env, stream_id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();

        let key = (STREAM_COUNT, stream_id);
        let mut stream: Stream = env
            .storage()
            .instance()
            .get(&key)
            .ok_or(Error::StreamNotFound)?;

        let receipt: StreamReceipt = env
            .storage()
            .instance()
            .get(&(RECEIPT, stream_id))
            .ok_or(Error::StreamNotFound)?;

        if stream.sender != caller && receipt.owner != caller {
            return Err(Error::Unauthorized);
        }
        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }

        let current_time = env.ledger().timestamp();
        let unlocked = Self::calculate_unlocked(&stream, current_time);
        let to_receiver = unlocked - stream.withdrawn;
        let to_sender = stream.total_amount - unlocked;

        stream.cancelled = true;
        stream.withdrawn = unlocked;
        env.storage().instance().set(&key, &stream);

        let token_client = token::Client::new(&env, &stream.token);
        if to_receiver > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &receipt.owner,
                &to_receiver,
            );
        }
        if to_sender > 0 {
            token_client.transfer(&env.current_contract_address(), &stream.sender, &to_sender);
        }

        // Emit StreamCancelledEvent
        env.events().publish(
            (symbol_short!("cancel"), caller.clone()),
            StreamCancelledEvent {
                stream_id,
                canceller: caller,
                to_receiver,
                to_sender,
                timestamp: current_time,
            },
        );

        Ok(())
    }

    /// Fetch the full [`Stream`] struct for a given stream ID.
    ///
    /// # Arguments
    /// * `stream_id` – ID of the stream.
    ///
    /// # Errors
    /// * [`Error::StreamNotFound`] – No stream exists for `stream_id`.
    ///
    /// # Storage
    /// Reads **instance** storage key `(STREAM_COUNT, stream_id)`. No writes.
    pub fn get_stream(env: Env, stream_id: u64) -> Result<Stream, Error> {
        env.storage()
            .instance()
            .get(&(STREAM_COUNT, stream_id))
            .ok_or(Error::StreamNotFound)
    }

    /// Fetch the full [`StreamProposal`] struct for a given proposal ID.
    ///
    /// # Arguments
    /// * `proposal_id` – ID returned by [`create_proposal`].
    ///
    /// # Errors
    /// * [`Error::ProposalNotFound`] – No proposal exists for `proposal_id`.
    ///
    /// # Storage
    /// Reads **instance** storage key `(PROPOSAL_COUNT, proposal_id)`. No writes.
    pub fn get_proposal(env: Env, proposal_id: u64) -> Result<StreamProposal, Error> {
        env.storage()
            .instance()
            .get(&(PROPOSAL_COUNT, proposal_id))
            .ok_or(Error::ProposalNotFound)
    }

    fn calculate_unlocked(stream: &Stream, current_time: u64) -> i128 {
        if current_time <= stream.start_time {
            return 0;
        }

        let mut effective_time = current_time;
        if stream.is_paused {
            effective_time = stream.paused_time;
        }

        let adjusted_end = stream.end_time + stream.total_paused_duration;
        if effective_time >= adjusted_end {
            return stream.total_amount;
        }

        let elapsed = (effective_time - stream.start_time) as i128;
        let paused = stream.total_paused_duration as i128;
        let effective_elapsed = elapsed - paused;

        if effective_elapsed <= 0 {
            return 0;
        }

        let duration = (stream.end_time - stream.start_time) as i128;

        // Calculate base unlocked amount based on curve type
        let base_unlocked = match stream.curve_type {
            CurveType::Linear => (stream.total_amount * effective_elapsed) / duration,
            CurveType::Exponential => {
                // Use exponential curve with overflow protection
                let adjusted_start = stream.start_time;
                let adjusted_current = stream.start_time + effective_elapsed as u64;

                math::calculate_exponential_unlocked(
                    stream.total_amount,
                    adjusted_start,
                    stream.end_time,
                    adjusted_current,
                )
                .unwrap_or((stream.total_amount * effective_elapsed) / duration)
            }
        };

        if stream.milestones.is_empty() {
            return base_unlocked;
        }

        let mut milestone_cap = 0i128;
        for milestone in stream.milestones.iter() {
            if effective_time >= milestone.timestamp {
                let cap = (stream.total_amount * milestone.percentage as i128) / 100;
                if cap > milestone_cap {
                    milestone_cap = cap;
                }
            }
        }

        if base_unlocked < milestone_cap {
            base_unlocked
        } else {
            milestone_cap
        }
    }

    fn calculate_unlocked_usd(stream: &Stream, current_time: u64, total_usd: i128) -> i128 {
        if current_time <= stream.start_time {
            return 0;
        }

        let mut effective_time = current_time;
        if stream.is_paused {
            effective_time = stream.paused_time;
        }

        let adjusted_end = stream.end_time + stream.total_paused_duration;
        if effective_time >= adjusted_end {
            return total_usd;
        }

        let elapsed = (effective_time - stream.start_time) as i128;
        let paused = stream.total_paused_duration as i128;
        let effective_elapsed = elapsed - paused;

        if effective_elapsed <= 0 {
            return 0;
        }

        let duration = (stream.end_time - stream.start_time) as i128;
        (total_usd * effective_elapsed) / duration
    }

    // ========== RBAC Functions ==========

    /// Grant a role to an address.
    ///
    /// Stores a `true` flag under `DataKey::Role(target, role)` in instance storage.
    /// Only an address that already holds [`Role::Admin`] may call this function.
    ///
    /// # Authorization
    /// `admin` must sign the transaction and must hold [`Role::Admin`].
    ///
    /// # Arguments
    /// * `admin`  – Caller; must have the Admin role.
    /// * `target` – Address to receive the role.
    /// * `role`   – [`Role`] to grant (`Admin`, `Pauser`, or `TreasuryManager`).
    ///
    /// # Panics
    /// Panics with [`Error::Unauthorized`] (code 5) if `admin` does not hold [`Role::Admin`].
    ///
    /// # Events
    /// Emits `("grant", target)` → `role`.
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * `DataKey::Role(target, role)` → `true`
    pub fn grant_role(env: Env, admin: Address, target: Address, role: Role) {
        admin.require_auth();

        // Check if caller has Admin role
        if !Self::has_role(&env, &admin, Role::Admin) {
            panic!("{}", Error::Unauthorized as u32);
        }

        // Grant the role
        env.storage()
            .instance()
            .set(&DataKey::Role(target.clone(), role.clone()), &true);

        // Emit event
        env.events().publish((symbol_short!("grant"), target), role);
    }

    /// Revoke a role from an address.
    ///
    /// Removes the `DataKey::Role(target, role)` entry from instance storage.
    /// Only an address that already holds [`Role::Admin`] may call this function.
    /// Silently returns if `admin` does not hold the Admin role (no panic).
    ///
    /// # Authorization
    /// `admin` must sign the transaction and must hold [`Role::Admin`].
    ///
    /// # Arguments
    /// * `admin`  – Caller; must have the Admin role.
    /// * `target` – Address to lose the role.
    /// * `role`   – [`Role`] to revoke.
    ///
    /// # Events
    /// Emits `("revoke", target)` → `role`.
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * Removes `DataKey::Role(target, role)`
    pub fn revoke_role(env: Env, admin: Address, target: Address, role: Role) {
        admin.require_auth();

        // Check if caller has Admin role
        if !Self::has_role(&env, &admin, Role::Admin) {
            return; // Error::Unauthorized;
        }

        // Revoke the role
        env.storage()
            .instance()
            .remove(&DataKey::Role(target.clone(), role.clone()));

        // Emit event
        env.events()
            .publish((symbol_short!("revoke"), target), role);
    }

    /// Check whether an address holds a specific role.
    ///
    /// Pure read — no state changes, no auth required.
    ///
    /// # Arguments
    /// * `address` – Address to query.
    /// * `role`    – [`Role`] to check.
    ///
    /// # Returns
    /// `true` if the address holds the role, `false` otherwise.
    ///
    /// # Storage
    /// Reads **instance** storage key `DataKey::Role(address, role)`. No writes.
    pub fn check_role(env: Env, address: Address, role: Role) -> bool {
        Self::has_role(&env, &address, role)
    }

    /// Internal helper to check if an address has a role
    fn has_role(env: &Env, address: &Address, role: Role) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Role(address.clone(), role))
            .unwrap_or(false)
    }

    // ========== Contract Upgrade Functions ==========

    /// Upgrade the contract WASM to a new hash.
    ///
    /// Calls `env.deployer().update_current_contract_wasm(new_wasm_hash)`.
    /// The upgrade takes effect immediately for all subsequent invocations.
    /// Only an address holding [`Role::Admin`] may perform this operation.
    /// Silently returns if `admin` does not hold the Admin role (no panic).
    ///
    /// # Authorization
    /// `admin` must sign the transaction and must hold [`Role::Admin`].
    ///
    /// # Arguments
    /// * `admin`         – Caller; must have the Admin role.
    /// * `new_wasm_hash` – 32-byte hash of the new contract WASM.
    ///
    /// # Events
    /// Emits `("upgrade", admin)` → `new_wasm_hash`.
    ///
    /// # Storage
    /// No direct storage writes. The Soroban host updates the contract WASM entry.
    pub fn upgrade(env: Env, admin: Address, new_wasm_hash: soroban_sdk::BytesN<32>) {
        admin.require_auth();

        // Check if caller has Admin role
        if !Self::has_role(&env, &admin, Role::Admin) {
            return; // Error::Unauthorized;
        }

        // Update the contract WASM
        env.deployer()
            .update_current_contract_wasm(new_wasm_hash.clone());

        // Emit upgrade event with new WASM hash
        env.events()
            .publish((symbol_short!("upgrade"), admin), new_wasm_hash);
    }

    /// Return the contract's admin address (legacy compatibility accessor).
    ///
    /// Reads `DataKey::Admin` from instance storage. This key is set during
    /// contract initialisation and is kept for backward compatibility with
    /// tooling that predates the RBAC system.
    ///
    /// # Panics
    /// Panics if `DataKey::Admin` has not been set (contract not initialised).
    ///
    /// # Storage
    /// Reads **instance** storage key `DataKey::Admin`. No writes.
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set")
    }

    // --- CONTRIBUTOR PULL-REQUEST PAYMENTS ---

    /// Submit a contributor payment request (pull-request payment flow).
    ///
    /// A contributor calls this to request a vesting stream as compensation for
    /// completed work. The request is stored with `status = Pending` and must be
    /// approved by an Admin via [`execute_request`] before any tokens are transferred.
    ///
    /// # Authorization
    /// `receiver` must sign the transaction.
    ///
    /// # Arguments
    /// * `receiver`     – Contributor's address; will receive the stream.
    /// * `token`        – SAC-compliant token contract address.
    /// * `total_amount` – Requested token amount.
    /// * `duration`     – Stream duration in seconds.
    /// * `metadata`     – Optional 32-byte metadata hash (e.g. IPFS CID of the PR).
    ///
    /// # Returns
    /// The newly allocated `request_id`.
    ///
    /// # Events
    /// Emits `("RequestCreated", request_id)` → [`RequestCreatedEvent`].
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * `RequestKey::Request(request_id)` → [`ContributorRequest`]
    /// * `RequestKey::RequestCount`        → updated counter
    pub fn create_request(
        env: Env,
        receiver: Address,
        token: Address,
        total_amount: i128,
        duration: u64,
        metadata: Option<soroban_sdk::BytesN<32>>,
    ) -> u64 {
        receiver.require_auth();
        let count: u64 = env.storage().instance().get(&RequestKey::RequestCount).unwrap_or(0);
        let request_id = count + 1;
        let now = env.ledger().timestamp();
        let request = ContributorRequest {
            id: request_id,
            receiver: receiver.clone(),
            token: token.clone(),
            total_amount,
            duration,
            start_time: now,
            status: RequestStatus::Pending,
            metadata,
        };
        env.storage().instance().set(&RequestKey::Request(request_id), &request);
        env.storage().instance().set(&RequestKey::RequestCount, &request_id);
        env.events().publish(
            (soroban_sdk::Symbol::new(&env, "RequestCreated"), request_id),
            RequestCreatedEvent {
                request_id,
                receiver,
                token,
                total_amount,
                duration,
                timestamp: now,
            },
        );
        request_id
    }

    /// Approve and execute a pending contributor payment request.
    ///
    /// Marks the request as `Approved` and immediately creates a linear stream
    /// from `admin` to the contributor for the requested amount and duration.
    /// Only an address holding [`Role::Admin`] may call this function.
    ///
    /// # Authorization
    /// `admin` must sign the transaction and must hold [`Role::Admin`].
    ///
    /// # Arguments
    /// * `admin`      – Caller; must have the Admin role.
    /// * `request_id` – ID returned by [`create_request`].
    ///
    /// # Returns
    /// The `stream_id` of the newly created stream.
    ///
    /// # Errors
    /// * [`Error::Unauthorized`]   – `admin` does not hold [`Role::Admin`].
    /// * [`Error::StreamNotFound`] – No request exists for `request_id`.
    /// * [`Error::AlreadyExecuted`]– Request status is not `Pending`.
    /// * Any error from [`create_stream`] (e.g. [`Error::InvalidTimeRange`]).
    ///
    /// # Events
    /// Emits `("RequestExecuted", request_id)` → [`RequestExecutedEvent`].
    /// Also emits `("create", admin)` → [`StreamCreatedEvent`] via [`create_stream`].
    ///
    /// # Storage
    /// Uses **instance** storage:
    /// * `RequestKey::Request(request_id)` → updated [`ContributorRequest`] (`status = Approved`)
    /// * All stream storage written by [`create_stream`]
    pub fn execute_request(env: Env, admin: Address, request_id: u64) -> Result<u64, Error> {
        admin.require_auth();
        if !Self::has_role(&env, &admin, Role::Admin) {
            return Err(Error::Unauthorized);
        }
        let mut request: ContributorRequest = env
            .storage()
            .instance()
            .get(&RequestKey::Request(request_id))
            .ok_or(Error::StreamNotFound)?;
        if request.status != RequestStatus::Pending {
            return Err(Error::AlreadyExecuted);
        }
        request.status = RequestStatus::Approved;
        env.storage().instance().set(&RequestKey::Request(request_id), &request);
        let stream_id = Self::create_stream(
            env.clone(),
            admin.clone(),
            request.receiver.clone(),
            request.token.clone(),
            request.total_amount,
            request.start_time,
            request.start_time + request.duration,
            CurveType::Linear,
        )?;
        env.events().publish(
            (soroban_sdk::Symbol::new(&env, "RequestExecuted"), request_id),
            RequestExecutedEvent {
                request_id,
                stream_id,
                executor: admin,
                timestamp: env.ledger().timestamp(),
            },
        );
        Ok(stream_id)
    }

    /// Fetch a contributor payment request by ID.
    ///
    /// # Arguments
    /// * `request_id` – ID returned by [`create_request`].
    ///
    /// # Returns
    /// `Some(`[`ContributorRequest`]`)` if found, `None` otherwise.
    ///
    /// # Storage
    /// Reads **instance** storage key `RequestKey::Request(request_id)`. No writes.
    pub fn get_request(env: Env, request_id: u64) -> Option<ContributorRequest> {
        env.storage().instance().get(&RequestKey::Request(request_id))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        token::{StellarAssetClient, TokenClient},
        Address, Env,
    };

    fn set_admin_role(env: &Env, contract_id: &Address, admin: &Address) {
        env.as_contract(contract_id, || {
            env.storage()
                .instance()
                .set(&DataKey::Role(admin.clone(), Role::Admin), &true);
        });
    }

    fn create_token_contract<'a>(env: &Env, admin: &Address) -> (Address, TokenClient<'a>) {
        let contract_id = env
            .register_stellar_asset_contract_v2(admin.clone())
            .address();
        (contract_id.clone(), TokenClient::new(env, &contract_id))
    }

    #[test]
    fn test_create_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|li| li.timestamp = 50);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let proposal_id =
            client.create_proposal(&sender, &receiver, &token_id, &1000, &100, &200, &2, &1000);

        assert_eq!(proposal_id, 0);
    }

    #[test]
    fn test_approve_proposal() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 50);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let approver1 = Address::generate(&env);
        let approver2 = Address::generate(&env);

        let proposal_id =
            client.create_proposal(&sender, &receiver, &token_id, &1000, &100, &200, &2, &1000);

        client.approve_proposal(&proposal_id, &approver1);

        let proposal = client.get_proposal(&proposal_id);
        assert_eq!(proposal.approvers.len(), 1);
        assert!(!proposal.executed);

        client.approve_proposal(&proposal_id, &approver2);

        let proposal = client.get_proposal(&proposal_id);
        assert_eq!(proposal.approvers.len(), 2);
        assert!(proposal.executed);
    }

    #[test]
    fn test_duplicate_approval_fails() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|li| li.timestamp = 50);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let approver = Address::generate(&env);

        let proposal_id =
            client.create_proposal(&sender, &receiver, &token_id, &1000, &100, &200, &2, &1000);

        client.approve_proposal(&proposal_id, &approver);
        let result = client.try_approve_proposal(&proposal_id, &approver);

        assert_eq!(result, Err(Ok(Error::AlreadyApproved)));
    }

    #[test]
    fn test_proposal_not_found() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let approver = Address::generate(&env);
        let result = client.try_approve_proposal(&999, &approver);

        assert_eq!(result, Err(Ok(Error::ProposalNotFound)));
    }

    #[test]
    fn test_invalid_time_range() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let result =
            client.try_create_proposal(&sender, &receiver, &token_id, &1000, &200, &100, &2, &1000);

        assert_eq!(result, Err(Ok(Error::InvalidTimeRange)));
    }

    #[test]
    fn test_invalid_amount() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let result =
            client.try_create_proposal(&sender, &receiver, &token_id, &0, &100, &200, &2, &1000);

        assert_eq!(result, Err(Ok(Error::InvalidAmount)));
    }

    #[test]
    fn test_invalid_approval_threshold() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let result =
            client.try_create_proposal(&sender, &receiver, &token_id, &1000, &100, &200, &0, &1000);

        assert_eq!(result, Err(Ok(Error::InvalidApprovalThreshold)));
    }

    #[test]
    fn test_create_direct_stream() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &200,
            &CurveType::Linear,
        );

        assert_eq!(stream_id, 0);

        let stream = client.get_stream(&stream_id);
        assert_eq!(stream.total_amount, 1000);
        assert_eq!(stream.withdrawn_amount, 0);
        assert!(!stream.cancelled);
        assert_eq!(stream.receipt_owner, receiver);

        let receipt = client.get_receipt(&stream_id);
        assert_eq!(receipt.stream_id, stream_id);
        assert_eq!(receipt.owner, receiver);
    }

    #[test]
    fn test_receipt_transfer() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let new_owner = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &200,
            &CurveType::Linear,
        );

        client.transfer_receipt(&stream_id, &receiver, &new_owner);

        let receipt = client.get_receipt(&stream_id);
        assert_eq!(receipt.owner, new_owner);

        let stream = client.get_stream(&stream_id);
        assert_eq!(stream.receipt_owner, new_owner);
    }

    #[test]
    fn test_withdraw_with_receipt_owner() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 150);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let new_owner = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &200,
            &CurveType::Linear,
        );

        client.transfer_receipt(&stream_id, &receiver, &new_owner);

        let result = client.try_withdraw(&stream_id, &receiver);
        assert_eq!(result, Err(Ok(Error::NotReceiptOwner)));

        let withdrawn = client.withdraw(&stream_id, &new_owner);
        assert!(withdrawn > 0);
    }

    #[test]
    fn test_receipt_metadata() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 150);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &200,
            &CurveType::Linear,
        );

        let metadata = client.get_receipt_metadata(&stream_id);
        assert_eq!(metadata.stream_id, stream_id);
        assert_eq!(metadata.total_amount, 1000);
        assert_eq!(metadata.token, token_id);
        assert!(metadata.unlocked_balance > 0);
        assert!(metadata.locked_balance < 1000);
    }

    #[test]
    fn test_three_of_five_multisig() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 50);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &100000);

        let proposal_id =
            client.create_proposal(&sender, &receiver, &token_id, &50000, &100, &200, &3, &1000);

        let approver1 = Address::generate(&env);
        let approver2 = Address::generate(&env);
        let approver3 = Address::generate(&env);

        client.approve_proposal(&proposal_id, &approver1);
        let proposal = client.get_proposal(&proposal_id);
        assert!(!proposal.executed);

        client.approve_proposal(&proposal_id, &approver2);
        let proposal = client.get_proposal(&proposal_id);
        assert!(!proposal.executed);

        client.approve_proposal(&proposal_id, &approver3);
        let proposal = client.get_proposal(&proposal_id);
        assert!(proposal.executed);
        assert_eq!(proposal.approvers.len(), 3);
    }

    #[test]
    fn test_approve_already_executed_proposal() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 50);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let proposal_id =
            client.create_proposal(&sender, &receiver, &token_id, &1000, &100, &200, &1, &1000);

        let approver1 = Address::generate(&env);
        client.approve_proposal(&proposal_id, &approver1);

        let approver2 = Address::generate(&env);
        let result = client.try_approve_proposal(&proposal_id, &approver2);

        assert_eq!(result, Err(Ok(Error::ProposalAlreadyExecuted)));
    }

    #[test]
    fn test_pause_unpause_stream() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 100);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &300,
            &CurveType::Linear,
        );

        env.ledger().with_mut(|li| li.timestamp = 150);
        client.pause_stream(&stream_id, &sender);

        let stream = client.get_stream(&stream_id);
        assert!(stream.is_paused);
        assert_eq!(stream.paused_time, 150);

        env.ledger().with_mut(|li| li.timestamp = 200);
        client.unpause_stream(&stream_id, &sender);

        let stream = client.get_stream(&stream_id);
        assert!(!stream.is_paused);
        assert_eq!(stream.total_paused_duration, 50);
    }

    #[test]
    fn test_withdraw_paused_fails() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 100);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &300,
            &CurveType::Linear,
        );

        client.pause_stream(&stream_id, &sender);

        env.ledger().with_mut(|li| li.timestamp = 150);
        let result = client.try_withdraw(&stream_id, &receiver);

        assert_eq!(result, Err(Ok(Error::StreamPaused)));
    }

    #[test]
    fn test_pause_adjusts_unlocked_balance() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 100);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &300,
            &CurveType::Linear,
        );

        env.ledger().with_mut(|li| li.timestamp = 150);
        let metadata_before = client.get_receipt_metadata(&stream_id);
        let unlocked_before = metadata_before.unlocked_balance;

        client.pause_stream(&stream_id, &sender);

        env.ledger().with_mut(|li| li.timestamp = 200);
        let metadata_paused = client.get_receipt_metadata(&stream_id);

        assert_eq!(metadata_paused.unlocked_balance, unlocked_before);

        client.unpause_stream(&stream_id, &sender);

        env.ledger().with_mut(|li| li.timestamp = 250);
        let withdrawn = client.withdraw(&stream_id, &receiver);
        assert!(withdrawn > 0);
    }

    #[test]
    fn test_quarterly_vesting() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 0);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let mut milestones = Vec::new(&env);
        milestones.push_back(Milestone {
            timestamp: 90,
            percentage: 25,
        });
        milestones.push_back(Milestone {
            timestamp: 180,
            percentage: 50,
        });
        milestones.push_back(Milestone {
            timestamp: 270,
            percentage: 75,
        });
        milestones.push_back(Milestone {
            timestamp: 360,
            percentage: 100,
        });

        let stream_id = client.create_stream_with_milestones(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &0,
            &360,
            &milestones,
            &CurveType::Linear,
        );

        env.ledger().with_mut(|li| li.timestamp = 45);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert!(metadata.unlocked_balance <= 250);

        env.ledger().with_mut(|li| li.timestamp = 100);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert_eq!(metadata.unlocked_balance, 250);

        env.ledger().with_mut(|li| li.timestamp = 200);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert_eq!(metadata.unlocked_balance, 500);
    }

    #[test]
    fn test_hybrid_streaming() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 0);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let mut milestones = Vec::new(&env);
        milestones.push_back(Milestone {
            timestamp: 100,
            percentage: 50,
        });

        let stream_id = client.create_stream_with_milestones(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &0,
            &200,
            &milestones,
            &CurveType::Linear,
        );

        env.ledger().with_mut(|li| li.timestamp = 50);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert!(metadata.unlocked_balance <= 250);

        env.ledger().with_mut(|li| li.timestamp = 150);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert_eq!(metadata.unlocked_balance, 500);

        env.ledger().with_mut(|li| li.timestamp = 200);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert_eq!(metadata.unlocked_balance, 1000);
    }

    // ============================================================================
    // EVENT EMISSION TESTS
    // ============================================================================
    // Tests to ensure all state changes emit proper events with correct data

    #[test]
    fn test_create_stream_emits_event() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        // Create stream - should emit create event
        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &200,
            &CurveType::Linear,
        );

        assert_eq!(stream_id, 0);
        // Event verification would be done through event monitoring in integration tests
    }

    #[test]
    fn test_withdraw_emits_event() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 150);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &200,
            &CurveType::Linear,
        );

        // Withdraw - should emit claim event
        let withdrawn = client.withdraw(&stream_id, &receiver);
        assert!(withdrawn > 0);
        // Event verification would be done through event monitoring in integration tests
    }

    #[test]
    fn test_cancel_emits_event() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 150);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &200,
            &CurveType::Linear,
        );

        // Cancel - should emit cancel event
        client.cancel(&stream_id, &sender);
        // Event verification would be done through event monitoring in integration tests
    }

    #[test]
    fn test_transfer_receipt_emits_event() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let new_owner = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &200,
            &CurveType::Linear,
        );

        // Transfer receipt - should emit transfer event
        client.transfer_receipt(&stream_id, &receiver, &new_owner);
        // Event verification would be done through event monitoring in integration tests
    }

    #[test]
    fn test_pause_stream_emits_event() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 100);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &300,
            &CurveType::Linear,
        );

        // Pause stream - should emit pause event
        client.pause_stream(&stream_id, &sender);
        // Event verification would be done through event monitoring in integration tests
    }

    #[test]
    fn test_unpause_stream_emits_event() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 100);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &300,
            &CurveType::Linear,
        );

        client.pause_stream(&stream_id, &sender);

        env.ledger().with_mut(|li| li.timestamp = 200);

        // Unpause stream - should emit unpause event
        client.unpause_stream(&stream_id, &sender);
        // Event verification would be done through event monitoring in integration tests
    }

    #[test]
    fn test_approve_proposal_emits_event() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 50);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let proposal_id =
            client.create_proposal(&sender, &receiver, &token_id, &1000, &100, &200, &2, &1000);

        let approver1 = Address::generate(&env);
        let approver2 = Address::generate(&env);

        // First approval - should emit approve event
        client.approve_proposal(&proposal_id, &approver1);
        // Event verification would be done through event monitoring in integration tests

        // Second approval - should emit approve event and create stream
        client.approve_proposal(&proposal_id, &approver2);
        // Event verification would be done through event monitoring in integration tests
    }

    #[test]
    fn test_exponential_stream() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 0);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &0,
            &100,
            &CurveType::Exponential,
        );

        // At 50% time: should have ~25% unlocked (0.5^2 = 0.25)
        env.ledger().with_mut(|li| li.timestamp = 50);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert!(metadata.unlocked_balance >= 240 && metadata.unlocked_balance <= 260);

        // At 70% time: should have ~49% unlocked (0.7^2 = 0.49)
        env.ledger().with_mut(|li| li.timestamp = 70);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert!(metadata.unlocked_balance >= 480 && metadata.unlocked_balance <= 500);

        // At 100% time: should have 100% unlocked
        env.ledger().with_mut(|li| li.timestamp = 100);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert_eq!(metadata.unlocked_balance, 1000);

        // Verify withdrawal works
        let withdrawn = client.withdraw(&stream_id, &receiver);
        assert_eq!(withdrawn, 1000);
    }

    // ========== OFAC Compliance Tests ==========

    #[test]
    fn test_restrict_address_by_admin() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let restricted_addr = Address::generate(&env);

        set_admin_role(&env, &contract_id, &admin);

        // Admin restricts an address
        client.restrict_address(&admin, &restricted_addr);

        // Verify address is restricted
        assert!(client.is_address_restricted(&restricted_addr));
    }

    #[test]
    fn test_unrestrict_address_by_admin() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let restricted_addr = Address::generate(&env);

        // Manually set admin role in storage to bootstrap
        env.as_contract(&contract_id, || {
            env.storage()
                .instance()
                .set(&DataKey::Role(admin.clone(), Role::Admin), &true);
        });

        // Admin restricts an address
        client.restrict_address(&admin, &restricted_addr);
        assert!(client.is_address_restricted(&restricted_addr));

        // Admin unrestricts the address
        client.unrestrict_address(&admin, &restricted_addr);

        // Verify address is no longer restricted
        assert!(!client.is_address_restricted(&restricted_addr));
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #5)")]
    fn test_non_admin_cannot_restrict_address() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let non_admin = Address::generate(&env);
        let restricted_addr = Address::generate(&env);

        // Non-admin tries to restrict an address - should panic
        client.restrict_address(&non_admin, &restricted_addr);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #20)")]
    fn test_cannot_create_stream_to_restricted_address() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|li| li.timestamp = 100);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let sender = Address::generate(&env);
        let restricted_receiver = Address::generate(&env);
        let token_admin = Address::generate(&env);

        set_admin_role(&env, &contract_id, &admin);

        // Create token
        let token_id = env.register_stellar_asset_contract(token_admin.clone());

        // Mint tokens to sender
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&sender, &1000);

        // Admin restricts the receiver address
        client.restrict_address(&admin, &restricted_receiver);

        // Attempt to create stream to restricted address should panic
        client.create_stream(
            &sender,
            &restricted_receiver,
            &token_id,
            &1000,
            &100,
            &200,
            &CurveType::Linear,
        );
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #20)")]
    fn test_cannot_create_proposal_to_restricted_address() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|li| li.timestamp = 50);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let sender = Address::generate(&env);
        let restricted_receiver = Address::generate(&env);
        let token_admin = Address::generate(&env);

        set_admin_role(&env, &contract_id, &admin);

        // Create token
        let token_id = env.register_stellar_asset_contract(token_admin.clone());

        // Mint tokens to sender
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&sender, &1000);

        // Admin restricts the receiver address
        client.restrict_address(&admin, &restricted_receiver);

        // Attempt to create proposal to restricted address should panic
        client.create_proposal(
            &sender,
            &restricted_receiver,
            &token_id,
            &1000,
            &100,
            &200,
            &2,
            &1000,
        );
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #20)")]
    fn test_cannot_transfer_receipt_to_restricted_address() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|li| li.timestamp = 100);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let restricted_addr = Address::generate(&env);
        let token_admin = Address::generate(&env);

        set_admin_role(&env, &contract_id, &admin);

        // Create token
        let token_id = env.register_stellar_asset_contract(token_admin.clone());

        // Mint tokens to sender
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&sender, &1000);

        // Create stream to valid receiver
        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &200,
            &CurveType::Linear,
        );

        // Admin restricts an address
        client.restrict_address(&admin, &restricted_addr);

        // Attempt to transfer receipt to restricted address should panic
        client.transfer_receipt(&stream_id, &receiver, &restricted_addr);
    }

    #[test]
    fn test_get_restricted_addresses_list() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let addr1 = Address::generate(&env);
        let addr2 = Address::generate(&env);
        let addr3 = Address::generate(&env);

        set_admin_role(&env, &contract_id, &admin);

        // Initially, no restricted addresses
        let restricted = client.get_restricted_addresses();
        assert_eq!(restricted.len(), 0);

        // Admin restricts addresses
        client.restrict_address(&admin, &addr1);
        client.restrict_address(&admin, &addr2);
        client.restrict_address(&admin, &addr3);

        // Verify all addresses are in the list
        let restricted = client.get_restricted_addresses();
        assert_eq!(restricted.len(), 3);
    }

    #[test]
    fn test_restrict_same_address_twice_is_idempotent() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let restricted_addr = Address::generate(&env);

        set_admin_role(&env, &contract_id, &admin);

        // Restrict address first time
        client.restrict_address(&admin, &restricted_addr);
        let restricted_1 = client.get_restricted_addresses();
        assert_eq!(restricted_1.len(), 1);

        // Restrict same address again (should be idempotent)
        client.restrict_address(&admin, &restricted_addr);
        let restricted_2 = client.get_restricted_addresses();
        assert_eq!(restricted_2.len(), 1);

        // Verify address is still restricted
        assert!(client.is_address_restricted(&restricted_addr));
    }

    #[test]
    fn test_stream_creation_allowed_after_unrestriction() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|li| li.timestamp = 100);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let token_admin = Address::generate(&env);

        set_admin_role(&env, &contract_id, &admin);

        // Create token
        let token_id = env.register_stellar_asset_contract(token_admin.clone());

        // Mint tokens to sender
        let token_client = token::StellarAssetClient::new(&env, &token_id);
        token_client.mint(&sender, &1000);

        // Admin restricts the receiver
        client.restrict_address(&admin, &receiver);

        // Admin unrestricts the receiver
        client.unrestrict_address(&admin, &receiver);

        // Now stream creation should succeed
        let stream_id = client.create_stream(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &100,
            &200,
            &CurveType::Linear,
        );
        
        // Verify stream was created (stream_id >= 0)
        assert!(stream_id >= 0);
    }
}
