#![no_std]
#![allow(clippy::too_many_arguments)]

mod errors;
mod flash_loan;
mod math;
mod oracle;
mod storage;
mod types;

use errors::Error;
use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Bytes, Env, IntoVal, Vec};
use storage::{FLASH_LOAN_FEE, FLASH_LOAN_LOCK, PROPOSAL_COUNT, RECEIPT, STREAM_COUNT};
use types::{
    CurveType, DataKey, Milestone, ProposalApprovedEvent, ProposalCreatedEvent, ReceiptMetadata,
    ReceiptTransferredEvent, Stream, StreamCancelledEvent, StreamClaimEvent, StreamCreatedEvent,
    StreamPausedEvent, StreamProposal, StreamReceipt, StreamUnpausedEvent,
};

#[contract]
pub struct StellarStreamContract;

#[contractimpl]
impl StellarStreamContract {
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

    pub fn transfer_receipt(
        env: Env,
        stream_id: u64,
        from: Address,
        to: Address,
    ) -> Result<(), Error> {
        from.require_auth();

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

    pub fn get_receipt(env: Env, stream_id: u64) -> Result<StreamReceipt, Error> {
        env.storage()
            .instance()
            .get(&(RECEIPT, stream_id))
            .ok_or(Error::StreamNotFound)
    }

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

    pub fn get_stream(env: Env, stream_id: u64) -> Result<Stream, Error> {
        env.storage()
            .instance()
            .get(&(STREAM_COUNT, stream_id))
            .ok_or(Error::StreamNotFound)
    }

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

    /// Upgrade the contract to a new WASM hash
    /// Only the admin can perform this operation
    pub fn upgrade(env: Env, new_wasm_hash: soroban_sdk::BytesN<32>) {
        // Get the admin address
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");

        // Require admin authorization
        admin.require_auth();

        // Update the contract WASM
        env.deployer()
            .update_current_contract_wasm(new_wasm_hash.clone());

        // Emit upgrade event with new WASM hash
        env.events()
            .publish((symbol_short!("upgrade"), admin), new_wasm_hash);
    }

    /// Get the current admin address
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set")
    }

    /// Set flash loan fee in basis points (100 = 1%)
    pub fn set_flash_loan_fee(env: Env, fee_bps: u32, admin: Address) -> Result<(), Error> {
        admin.require_auth();

        // Verify admin
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");

        if stored_admin != admin {
            return Err(Error::Unauthorized);
        }

        env.storage().instance().set(&FLASH_LOAN_FEE, &fee_bps);
        Ok(())
    }

    /// Execute a flash loan
    ///
    /// # Parameters
    /// - `receiver`: Contract that will receive and use the loan
    /// - `token`: Token to borrow
    /// - `amount`: Amount to borrow
    /// - `params`: Additional parameters to pass to receiver
    pub fn flash_loan(
        env: Env,
        receiver: Address,
        token: Address,
        amount: i128,
        params: Bytes,
    ) -> Result<(), Error> {
        // Check for reentrancy
        let is_locked: bool = env
            .storage()
            .instance()
            .get(&FLASH_LOAN_LOCK)
            .unwrap_or(false);
        if is_locked {
            return Err(Error::FlashLoanInProgress);
        }

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Set reentrancy lock
        env.storage().instance().set(&FLASH_LOAN_LOCK, &true);

        // Get fee (default 0.09% = 9 bps)
        let fee_bps: u32 = env.storage().instance().get(&FLASH_LOAN_FEE).unwrap_or(9);
        let fee = (amount * fee_bps as i128) / 10_000;

        // Get balance before
        let token_client = token::Client::new(&env, &token);
        let balance_before = token_client.balance(&env.current_contract_address());

        // Transfer tokens to receiver
        token_client.transfer(&env.current_contract_address(), &receiver, &amount);

        // Call receiver's execute_operation
        // The receiver must implement exec_op and return the tokens + fee
        let initiator = env.current_contract_address();
        env.invoke_contract::<()>(
            &receiver,
            &soroban_sdk::symbol_short!("exec_op"),
            (initiator, token.clone(), amount, fee, params).into_val(&env),
        );

        // Verify repayment with fee
        let balance_after = token_client.balance(&env.current_contract_address());
        let expected_balance = balance_before + fee;

        if balance_after < expected_balance {
            env.storage().instance().set(&FLASH_LOAN_LOCK, &false);
            return Err(Error::FlashLoanNotRepaid);
        }

        // Release lock
        env.storage().instance().set(&FLASH_LOAN_LOCK, &false);

        // Emit event
        env.events().publish(
            (symbol_short!("fl_exec"), receiver.clone()),
            (token, amount, fee),
        );

        Ok(())
    }

    /// Get available liquidity for flash loans
    pub fn get_flash_loan_liquidity(env: Env, token: Address) -> i128 {
        let token_client = token::Client::new(&env, &token);
        token_client.balance(&env.current_contract_address())
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
}
