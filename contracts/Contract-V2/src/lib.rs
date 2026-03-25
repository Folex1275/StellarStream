#![no_std]
#![allow(clippy::too_many_arguments)]
use soroban_sdk::xdr::ToXdr;
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol, Vec};

mod contracterror;
mod storage;
mod types;
mod v1_interface;

use contracterror::Error;
pub use types::{
    AdminTransferredEvent, BatchStreamsCreatedEvent, ContractPausedEvent, ContractUnpausedEvent, MigrationEvent, PermitArgs, PermitStreamCreatedEvent, StreamArgs,
    StreamCancelledV2Event, StreamClaimV2Event, StreamCreatedV2Event, StreamMigratedEvent,
    StreamV2, Operation, OperationScheduledEvent, OperationExecutedEvent,
};
use v1_interface::Client as V1Client;

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    // ----------------------------------------------------------------
    // Init
    // ----------------------------------------------------------------

    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if storage::has_admin(&env) {
            return Err(Error::AlreadyInitialized);
        }
        storage::set_admin(&env, &admin);
        Ok(())
    }

    pub fn admin(env: Env) -> Address {
        storage::get_admin(&env)
    }

    // ----------------------------------------------------------------
    // Issue #400 — Multi-sig Admin Handover
    // ----------------------------------------------------------------

    /// Replace the admin set and threshold.
    ///
    /// `signers` must contain at least the current threshold of existing
    /// admins so the handover itself is multi-sig protected.
    /// Internal helper for set_admins.
    fn set_admins_internal(
        env: Env,
        new_admins: Vec<Address>,
        new_threshold: u32,
    ) -> Result<(), Error> {
        // Validate new config before touching state.
        if new_threshold == 0 || new_threshold > new_admins.len() {
            return Err(Error::InvalidThreshold);
        }

        storage::set_admin_list_raw(&env, &new_admins, new_threshold);
        Ok(())
    }

    /// Return the current admin list.
    pub fn get_admins(env: Env) -> Vec<Address> {
        storage::get_admin_list(&env)
    }

    /// Return the current approval threshold.
    pub fn get_threshold(env: Env) -> u32 {
        storage::get_threshold(&env)
    }

    /// Transfer admin rights to a new address (e.g. a multisig or DAO contract).
    ///
    /// The current admin must authorise this call. The new admin becomes the
    /// sole admin with threshold = 1, ready to be promoted to a full multisig
    /// via `set_admins` if desired.
    /// Internal helper for transfer_admin.
    fn transfer_admin_internal(env: Env, new_admin: Address) -> Result<(), Error> {
        let previous_admin = storage::try_get_admin(&env)?;
        // Auth handled in execute_op
    pub fn transfer_admin(env: Env, new_admin: Address) -> Result<(), Error> {
        let previous_admin = storage::try_get_admin(&env)?;
        previous_admin.require_auth();

        storage::set_admin(&env, &new_admin);

        env.events().publish(
            (symbol_short!("adm_xfer"), new_admin.clone()),
            AdminTransferredEvent {
                previous_admin,
                new_admin,
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(())
    }

    // ----------------------------------------------------------------
    // Issue #396 — Dust Threshold
    // ----------------------------------------------------------------

    /// Return the minimum stream amount for `asset` (default: 10 XLM).
    pub fn get_min_value(env: Env, asset: Address) -> i128 {
        storage::get_min_value(&env, &asset)
    }

    /// Override the minimum for a specific asset. Admin-only.
    /// Internal helper for set_min_value.
    fn set_min_value_internal(env: Env, asset: Address, min: i128) -> Result<(), Error> {
    pub fn set_min_value(env: Env, asset: Address, min: i128) -> Result<(), Error> {
        storage::try_get_admin(&env)?.require_auth();
        storage::set_min_value(&env, &asset, min);
        Ok(())
    }

    // ----------------------------------------------------------------
    // Issue #359 — Migration Bridge
    // ----------------------------------------------------------------

    pub fn migrate_stream(
        env: Env,
        v1_contract: Address,
        v1_stream_id: u64,
        caller: Address,
    ) -> Result<u64, Error> {
        Self::require_not_paused(&env)?;
        caller.require_auth();

        let v1_client = V1Client::new(&env, &v1_contract);

        let v1_stream = v1_client
            .try_get_stream(&v1_stream_id)
            .map_err(|_| Error::NotStreamOwner)?
            .map_err(|_| Error::NotStreamOwner)?;

        if v1_stream.receiver != caller {
            return Err(Error::NotStreamOwner);
        }

        if v1_stream.cancelled || v1_stream.is_frozen || v1_stream.is_paused {
            return Err(Error::StreamNotMigratable);
        }

        let now = env.ledger().timestamp();
        if now >= v1_stream.end_time {
            return Err(Error::StreamNotMigratable);
        }

        let elapsed = {
            let effective_now = now.saturating_sub(v1_stream.total_paused_duration);
            if effective_now <= v1_stream.start_time {
                0i128
            } else {
                (effective_now - v1_stream.start_time) as i128
            }
        };
        let duration = (v1_stream.end_time - v1_stream.start_time) as i128;
        let unlocked = (v1_stream.total_amount * elapsed) / duration;
        let remaining = v1_stream.total_amount - unlocked;

        if remaining <= 0 {
            return Err(Error::NothingToMigrate);
        }

        v1_client
            .try_cancel(&v1_stream_id, &caller)
            .map_err(|_| Error::StreamNotMigratable)?
            .map_err(|_| Error::StreamNotMigratable)?;

        let v2_stream_id = storage::next_stream_id(&env);

        let v2_stream = StreamV2 {
            sender: v1_stream.sender.clone(),
            receiver: caller.clone(),
            token: v1_stream.token.clone(),
            total_amount: remaining,
            start_time: now,
            end_time: v1_stream.end_time,
            cliff_time: now, // migrated streams have no cliff in V2
            withdrawn_amount: 0,
            cancelled: false,
            migrated_from_v1: true,
            v1_stream_id,
            step_duration: 0,
            multiplier_bps: 0,
        };

        storage::set_stream(&env, v2_stream_id, &v2_stream);
        storage::update_stats(&env, remaining, &v1_stream.sender, &caller);

        env.events().publish(
            (symbol_short!("migrated"), caller.clone()),
            StreamMigratedEvent {
                v2_stream_id,
                v1_stream_id,
                caller: caller.clone(),
                migrated_amount: remaining,
                timestamp: now,
            },
        );

        // Emit migration event for indexer
        env.events().publish(
            (Symbol::new(&env, "migrate"),),
            (v1_stream_id, v2_stream_id, caller.clone(), remaining),
        );

        Ok(v2_stream_id)
    }

    pub fn get_stream(env: Env, stream_id: u64) -> Option<StreamV2> {
        storage::get_stream(&env, stream_id)
    }

    pub fn get_v2_protocol_health(env: Env) -> types::ProtocolHealthV2 {
        storage::get_health(&env)
    }

    // ----------------------------------------------------------------
    // Stream Operations (Issue #363 — Escalating Rates)
    // ----------------------------------------------------------------

    pub fn withdraw(env: Env, stream_id: u64, receiver: Address) -> Result<i128, Error> {
        Self::require_not_paused(&env)?;
        receiver.require_auth();

        let mut stream =
            storage::get_stream(&env, stream_id).ok_or(Error::StreamNotFound)?;

        if stream.receiver != receiver {
            return Err(Error::NotStreamOwner);
        }

        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }

        let now = env.ledger().timestamp();
        let unlocked = Self::calculate_unlocked_internal(&stream, now);
        let to_withdraw = unlocked.saturating_sub(stream.withdrawn_amount);

        if to_withdraw <= 0 {
            return Err(Error::NothingToWithdraw);
        }

        // Perform transfer
        let token_client = soroban_sdk::token::TokenClient::new(&env, &stream.token);
        token_client.transfer(
            &env.current_contract_address(),
            &stream.receiver,
            &to_withdraw,
        );

        // Update state
        stream.withdrawn_amount += to_withdraw;
        storage::set_stream(&env, stream_id, &stream);

        // Update analytics (TVL decreased)
        storage::update_stats(&env, -to_withdraw, &stream.sender, &stream.receiver);

        env.events().publish(
            (symbol_short!("claim"), receiver.clone()),
            StreamClaimV2Event {
                stream_id,
                receiver: receiver.clone(),
                amount: to_withdraw,
                total_claimed: stream.withdrawn_amount,
                timestamp: now,
            },
        );

        Ok(to_withdraw)
    }

    pub fn cancel(env: Env, stream_id: u64, caller: Address) -> Result<(), Error> {
        Self::require_not_paused(&env)?;
        caller.require_auth();

        let mut stream =
            storage::get_stream(&env, stream_id).ok_or(Error::StreamNotFound)?;

        if stream.sender != caller && stream.receiver != caller {
            return Err(Error::NotStreamOwner);
        }

        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }

        let now = env.ledger().timestamp();
        let unlocked = Self::calculate_unlocked_internal(&stream, now);
        let to_receiver = unlocked.saturating_sub(stream.withdrawn_amount);
        let to_sender = stream.total_amount.saturating_sub(unlocked);

        stream.withdrawn_amount = unlocked;
        stream.cancelled = true;
        storage::set_stream(&env, stream_id, &stream);

        let token_client = soroban_sdk::token::TokenClient::new(&env, &stream.token);
        if to_receiver > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &stream.receiver,
                &to_receiver,
            );
        }
        if to_sender > 0 {
            token_client.transfer(&env.current_contract_address(), &stream.sender, &to_sender);
        }

        env.events().publish(
            (symbol_short!("cancel"), caller.clone()),
            StreamCancelledV2Event {
                stream_id,
                canceller: caller,
                to_receiver,
                to_sender,
                timestamp: now,
            },
        );

        Ok(())
    }

    fn calculate_unlocked_internal(stream: &StreamV2, now: u64) -> i128 {
        if now < stream.cliff_time || now <= stream.start_time {
            return 0;
        }
        if now < stream.cliff_time || now <= stream.start_time {
            return 0;
        }
        if now >= stream.end_time {
            return stream.total_amount;
        }
        if stream.cancelled {
            return stream.total_amount;
        }

        if stream.step_duration > 0 {
            let elapsed = (now - stream.start_time) as i128;
            let duration = (stream.end_time - stream.start_time) as i128;
            let step_duration = stream.step_duration;
            let n_steps = (elapsed / step_duration) as u32;
            let delta_t = elapsed % step_duration;

            let m_bps = stream.multiplier_bps;
            let q_bps = 10000 + m_bps;

            let total_steps = (duration / step_duration) as u32;

            let q_pow_total = Self::power_scale(q_bps, total_steps);
            let q_pow_n = Self::power_scale(q_bps, n_steps);

            let scale = 1_000_000_000_i128;

            let term1 = (q_pow_n - scale) * step_duration;
            let term2 = (q_pow_n * delta_t * m_bps) / 10000;

            let numerator = stream.total_amount * (term1 + term2);
            let denominator = (q_pow_total - scale) * step_duration;

            if denominator <= 0 {
                return (stream.total_amount * elapsed) / duration;
            }

            numerator / denominator
        } else {
            let elapsed = (now - stream.start_time) as i128;
            let duration = (stream.end_time - stream.start_time) as i128;
            (stream.total_amount * elapsed) / duration
        }
    }

    fn power_scale(q_bps: i128, n: u32) -> i128 {
        let mut res = 1_000_000_000_i128;
        let mut base = q_bps;
        let mut exp = n;
        while exp > 0 {
            if exp % 2 == 1 {
                res = (res * base) / 10000;
            }
            base = (base * base) / 10000;
            exp /= 2;
        }
        res
    }

    pub fn top_up(env: Env, stream_id: u64, sender: Address, extra_amount: i128) -> Result<(), ContractError> {
        Self::require_not_paused(&env)?;
        sender.require_auth();

        if extra_amount <= 0 {
            return Err(ContractError::BelowDustThreshold);
        }

        let mut stream =
            storage::get_stream(&env, stream_id).ok_or(ContractError::StreamNotFound)?;

        if stream.sender != sender {
            return Err(ContractError::NotStreamOwner);
        }

        if stream.cancelled {
            return Err(ContractError::AlreadyCancelled);
        }

        let now = env.ledger().timestamp();

        // Checkpoint: calculate what's already unlocked so the rate stays consistent.
        let unlocked_at_now = Self::calculate_unlocked_internal(&stream, now);
        let remaining = stream.total_amount.saturating_sub(unlocked_at_now);

        // Pull the new funds into the contract.
        let token_client = soroban_sdk::token::TokenClient::new(&env, &stream.token);
        token_client.transfer(
            &sender,
            &env.current_contract_address(),
            &extra_amount,
        );

        // Extend end_time proportionally: keep the same rate over the new remaining balance.
        let duration = (stream.end_time - stream.start_time) as i128;
        let new_remaining = remaining + extra_amount;
        let rate = stream.total_amount; // tokens per `duration` seconds
        // new_end_time = now + (new_remaining * duration / rate)
        let extra_seconds = (new_remaining * duration) / rate;
        let new_end_time = now + extra_seconds as u64;

        stream.total_amount += extra_amount;
        stream.end_time = new_end_time;
        storage::set_stream(&env, stream_id, &stream);

        // Update TVL.
        storage::update_stats(&env, extra_amount, &stream.sender, &stream.receiver);

        env.events().publish(
            (symbol_short!("top_up"), sender.clone()),
            StreamToppedUpEvent {
                stream_id,
                sender,
                extra_amount,
                new_total_amount: stream.total_amount,
                new_end_time,
                timestamp: now,
            },
        );

        Ok(())
    }

    pub fn bump_active_streams_ttl(env: Env, ids: Vec<u64>) -> u32 {
        storage::bump_streams_ttl(&env, &ids)
    }

    pub fn pause(env: Env) -> Result<(), Error> {
        let admin = storage::try_get_admin(&env)?;
        admin.require_auth();
        storage::set_paused(&env, true);
        env.events().publish(
            (symbol_short!("pause"), admin.clone()),
            ContractPausedEvent {
                admin,
                timestamp: env.ledger().timestamp(),
            },
        );
        Ok(())
    }

    pub fn unpause(env: Env) -> Result<(), Error> {
        let admin = storage::try_get_admin(&env)?;
        admin.require_auth();
        storage::set_paused(&env, false);
        env.events().publish(
            (symbol_short!("unpause"), admin.clone()),
            ContractUnpausedEvent {
                admin,
                timestamp: env.ledger().timestamp(),
            },
        );
        Ok(())
    }

    pub fn is_paused(env: Env) -> bool {
        storage::is_paused(&env)
    }

    fn require_not_paused(env: &Env) -> Result<(), Error> {
        if storage::is_paused(env) {
            return Err(Error::ContractPaused);
        }
        Ok(())
    }

    pub fn create_stream(env: Env, args: StreamArgs) -> Result<u64, Error> {
        Self::require_not_paused(&env)?;
        args.sender.require_auth();

        if args.start_time >= args.end_time
            || args.cliff_time < args.start_time
            || args.cliff_time > args.end_time
        {
            return Err(Error::InvalidTimeRange);
        }

        if args.total_amount < storage::get_min_value(&env, &args.token) {
            return Err(Error::BelowDustThreshold);
        }

        let token_client = soroban_sdk::token::TokenClient::new(&env, &args.token);
        token_client.transfer(
            &args.sender,
            &env.current_contract_address(),
            &args.total_amount,
        );

        let stream_id = storage::next_stream_id(&env);

        let stream = StreamV2 {
            sender: args.sender.clone(),
            receiver: args.receiver.clone(),
            token: args.token.clone(),
            total_amount: args.total_amount,
            start_time: args.start_time,
            end_time: args.end_time,
            cliff_time: args.cliff_time,
            withdrawn_amount: 0,
            cancelled: false,
            migrated_from_v1: false,
            v1_stream_id: 0,
            step_duration: args.step_duration,
            multiplier_bps: args.multiplier_bps,
        };

        storage::set_stream(&env, stream_id, &stream);
        storage::update_stats(&env, args.total_amount, &args.sender, &args.receiver);

        env.events().publish(
            (symbol_short!("create_v2"), args.sender.clone()),
            StreamCreatedV2Event {
                stream_id,
                sender: args.sender,
                receiver: args.receiver,
                token: args.token,
                total_amount: args.total_amount,
                start_time: args.start_time,
                cliff_time: args.cliff_time,
                end_time: args.end_time,
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(stream_id)
    }

    pub fn create_stream_with_signature(
        env: Env,
        args: PermitArgs,
        signature: soroban_sdk::BytesN<64>,
    ) -> Result<u64, Error> {
        Self::require_not_paused(&env)?;
        let now = env.ledger().timestamp();

        if now > args.deadline {
            return Err(Error::ExpiredDeadline);
        }

        if args.total_amount < storage::get_min_value(&env, &args.token) {
            return Err(Error::BelowDustThreshold);
        }

        let nonce_key = (symbol_short!("NONCE"), args.sender_pubkey.clone());
        let stored_nonce: u64 = env.storage().instance().get(&nonce_key).unwrap_or(0u64);

        if args.nonce != stored_nonce {
            return Err(Error::InvalidNonce);
        }

        let mut msg = soroban_sdk::Bytes::new(&env);
        msg.extend_from_slice(b"STELLARSTREAM_PERMIT_V2");
        msg.append(&env.current_contract_address().to_xdr(&env));
        msg.append(&args.sender_pubkey.clone().into());
        msg.append(&args.receiver.clone().to_xdr(&env));
        msg.append(&args.token.clone().to_xdr(&env));

        msg.extend_from_slice(&args.total_amount.to_be_bytes());
        msg.extend_from_slice(&args.start_time.to_be_bytes());
        msg.extend_from_slice(&args.cliff_time.to_be_bytes());
        msg.extend_from_slice(&args.end_time.to_be_bytes());
        msg.extend_from_slice(&args.nonce.to_be_bytes());
        msg.extend_from_slice(&args.deadline.to_be_bytes());

        if args.step_duration > 0 {
            msg.extend_from_slice(&args.step_duration.to_be_bytes());
            msg.extend_from_slice(&args.multiplier_bps.to_be_bytes());
        }

        let msg_hash: soroban_sdk::BytesN<32> = env.crypto().sha256(&msg).into();
        env.crypto()
            .ed25519_verify(&args.sender_pubkey, &msg_hash.into(), &signature);

        env.storage()
            .instance()
            .set(&nonce_key, &(stored_nonce + 1));

        let token_client = soroban_sdk::token::TokenClient::new(&env, &args.token);
        let sender_addr = Address::from_string_bytes(&args.sender_pubkey.clone().into());

        token_client.transfer_from(
            &env.current_contract_address(),
            &sender_addr,
            &env.current_contract_address(),
            &args.total_amount,
        );

        let stream_id = storage::next_stream_id(&env);

        let stream = StreamV2 {
            sender: sender_addr.clone(),
            receiver: args.receiver.clone(),
            token: args.token.clone(),
            total_amount: args.total_amount,
            start_time: args.start_time,
            end_time: args.end_time,
            cliff_time: args.cliff_time,
            withdrawn_amount: 0,
            cancelled: false,
            migrated_from_v1: false,
            v1_stream_id: 0,
            step_duration: args.step_duration,
            multiplier_bps: args.multiplier_bps,
        };

        storage::set_stream(&env, stream_id, &stream);
        storage::update_stats(&env, args.total_amount, &sender_addr, &args.receiver);

        env.events().publish(
            (symbol_short!("permit"), args.receiver.clone()),
            PermitStreamCreatedEvent {
                stream_id,
                sender_pubkey: args.sender_pubkey,
                receiver: args.receiver,
                token: args.token,
                total_amount: args.total_amount,
                cliff_time: args.cliff_time,
                nonce: args.nonce,
                timestamp: now,
            },
        );

        Ok(stream_id)
    }

    // ----------------------------------------------------------------
    // Issue #367 — Batch Stream Creation
    // ----------------------------------------------------------------

    pub fn create_batch_streams(env: Env, streams: Vec<StreamArgs>) -> Result<Vec<u64>, Error> {
        Self::require_not_paused(&env)?;

        // Validate batch size limit (max 10 streams)
        if streams.len() > 10 {
            return Err(Error::BatchTooLarge);
        }

        if streams.is_empty() {
            return Err(Error::InvalidTimeRange); // Reuse error for empty batch
        }

        // Validate all streams upfront to ensure atomicity
        let mut total_amount: i128 = 0;
        let sender = streams.get(0).unwrap().sender.clone();

        for args in streams.iter() {
            // All streams must have the same sender
            if args.sender != sender {
                return Err(Error::UnauthorizedSender); 
            }

            // Validate time ranges
            if args.start_time >= args.end_time
                || args.cliff_time < args.start_time
                || args.cliff_time > args.end_time
            {
                return Err(Error::InvalidTimeRange);
            }

            // Validate dust threshold
            if args.total_amount < storage::get_min_value(&env, &args.token) {
                return Err(Error::BelowDustThreshold);
            }

            total_amount = total_amount.checked_add(args.total_amount)
                .ok_or(Error::InvalidTimeRange)?; // Overflow protection
        }

        // Require auth from the sender
        sender.require_auth();

        // Calculate total amount needed and transfer all tokens at once
        let token_client = soroban_sdk::token::TokenClient::new(&env, &streams.get(0).unwrap().token);
        token_client.transfer(
            &sender,
            &env.current_contract_address(),
            &total_amount,
        );

        // Create all streams
        let mut stream_ids = Vec::new(&env);
        let mut total_created_amount: i128 = 0;

        for args in streams.iter() {
            let stream_id = storage::next_stream_id(&env);

            let stream = StreamV2 {
                sender: args.sender.clone(),
                receiver: args.receiver.clone(),
                token: args.token.clone(),
                total_amount: args.total_amount,
                start_time: args.start_time,
                end_time: args.end_time,
                cliff_time: args.cliff_time,
                withdrawn_amount: 0,
                cancelled: false,
                migrated_from_v1: false,
                v1_stream_id: 0,
                step_duration: args.step_duration,
                multiplier_bps: args.multiplier_bps,
            };

            storage::set_stream(&env, stream_id, &stream);
            storage::update_stats(&env, args.total_amount, &args.sender, &args.receiver);

            // Emit individual stream creation event
            env.events().publish(
                (symbol_short!("create_v2"), args.sender.clone()),
                StreamCreatedV2Event {
                    stream_id,
                    sender: args.sender.clone(),
                    receiver: args.receiver.clone(),
                    token: args.token.clone(),
                    total_amount: args.total_amount,
                    start_time: args.start_time,
                    cliff_time: args.cliff_time,
                    end_time: args.end_time,
                    timestamp: env.ledger().timestamp(),
                },
            );

            stream_ids.push_back(stream_id);
            total_created_amount = total_created_amount.checked_add(args.total_amount).unwrap();
        }

        // Emit batch creation summary event
        env.events().publish(
            (Symbol::new(&env, "batch_create"), sender.clone()),
            BatchStreamsCreatedEvent {
                stream_ids: stream_ids.clone(),
                sender: sender.clone(),
                total_streams: stream_ids.len() as u32,
                total_amount: total_created_amount,
                timestamp: env.ledger().timestamp(),
            },
        );

        Ok(stream_ids)
    }

    // ----------------------------------------------------------------
    // Time-locked Admin Operations
    // ----------------------------------------------------------------

    pub fn schedule_op(env: Env, op: Operation) -> Result<(), Error> {
        let admin = storage::try_get_admin(&env)?;
        admin.require_auth();

        let execution_time = env.ledger().timestamp() + storage::ADMIN_DELAY;
        storage::schedule_op(&env, &op, execution_time);

        env.events().publish(
            (symbol_short!("schedule"),),
            OperationScheduledEvent {
                op,
                execution_time,
            },
        );

        Ok(())
    }

    pub fn execute_op(env: Env, op: Operation) -> Result<(), Error> {
        let admin = storage::try_get_admin(&env)?;
        admin.require_auth();

        let execution_time = storage::get_scheduled_op_time(&env, &op).ok_or(Error::OpNotScheduled)?;

        if env.ledger().timestamp() < execution_time {
            return Err(Error::NotExecutionTime);
        }

        // Execute the actual operation
        match &op {
            Operation::SetAdmins(new_admins, new_threshold) => {
                Self::set_admins_internal(env.clone(), new_admins.clone(), *new_threshold)?;
            }
            Operation::TransferAdmin(new_admin) => {
                Self::transfer_admin_internal(env.clone(), new_admin.clone())?;
            }
            Operation::SetMinValue(asset, min) => {
                Self::set_min_value_internal(env.clone(), asset.clone(), *min)?;
            }
        }

        storage::clear_op(&env, &op);

        env.events().publish(
            (symbol_short!("executed"),),
            OperationExecutedEvent {
                op,
            },
        );

        Ok(())
    }
}

mod test;
