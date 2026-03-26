#![no_std]
#![allow(clippy::too_many_arguments)]
use soroban_sdk::xdr::ToXdr;
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, IntoVal, Symbol, Vec};

mod contracterror;
mod storage;
mod types;
mod v1_interface;

use contracterror::Error;
pub use types::{
    AdminTransferredEvent, BatchStreamsCreatedEvent, BeneficiaryTransferredV2Event,
    ClawbackRebalanceEvent, ContractPausedEvent, ContractUnpausedEvent, FeesWithdrawnEvent,
    MigrationEvent, NebulaEvent, Operation, OperationExecutedEvent, OperationScheduledEvent,
    PermitArgs, PermitStreamCreatedEvent, StreamArgs, StreamBatchEntry, StreamCancelledV2Event,
    StreamClaimV2Event, StreamCreatedV2Event, StreamMigratedEvent, StreamRefilledEvent,
    StreamStatus, StreamToppedUpEvent, StreamV2,
};
use v1_interface::Client as V1Client;

#[contract]
pub struct Contract;

#[soroban_sdk::contractclient(name = "VaultClient")]
pub trait VaultTrait {
    fn deposit(env: Env, amount: i128);
    fn withdraw(env: Env, amount: i128) -> i128; // returns actual amount withdrawn
}

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
        storage::set_admin(&env, &new_admin);

        let now = env.ledger().timestamp();
        let mut data = Vec::new(&env);
        data.push_back(previous_admin.into_val(&env));
        data.push_back(new_admin.clone().into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (symbol_short!("adm_xfer"), new_admin.clone()),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("adm_xfer"),
                data,
            },
        );
        Ok(())
    }

    pub fn transfer_admin(env: Env, new_admin: Address) -> Result<(), Error> {
        let admin = storage::try_get_admin(&env)?;
        admin.require_auth();
        Self::transfer_admin_internal(env, new_admin)
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
        storage::set_min_value(&env, &asset, min);
        Ok(())
    }

    pub fn set_min_value(env: Env, asset: Address, min: i128) -> Result<(), Error> {
        storage::try_get_admin(&env)?.require_auth();
        Self::set_min_value_internal(env, asset, min)
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
            beneficiary: caller.clone(), // Initial beneficiary is the receiver
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
            vault_address: None,
            yield_enabled: false,
            is_pending: false,
            is_recurrent: false,
            cycle_duration: 0,
            cancellation_type: 0,
        };

        storage::set_stream(&env, v2_stream_id, &v2_stream);
        storage::update_stats(&env, remaining, &v1_stream.sender, &caller);

        let mut data = Vec::new(&env);
        data.push_back(v2_stream_id.into_val(&env));
        data.push_back(v1_stream_id.into_val(&env));
        data.push_back(caller.clone().into_val(&env));
        data.push_back(remaining.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (v2_stream_id, symbol_short!("migrated")),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("migrated"),
                data,
            },
        );

        Ok(v2_stream_id)
    }

    pub fn get_stream(env: Env, stream_id: u64) -> Option<StreamV2> {
        storage::get_stream(&env, stream_id)
    }

    pub fn get_streams_batch(env: Env, ids: Vec<u64>) -> Result<Vec<StreamBatchEntry>, Error> {
        if ids.len() > 25 {
            return Err(Error::BatchTooLarge);
        }

        let mut results = Vec::new(&env);
        let now = env.ledger().timestamp();

        for id in ids.iter() {
            if let Some(stream) = storage::get_stream(&env, id) {
                let unlocked = Self::calculate_unlocked_internal(&stream, now);
                let remaining_unlocked = unlocked.saturating_sub(stream.withdrawn_amount);

                let status = if stream.cancelled {
                    StreamStatus::Cancelled
                } else if now >= stream.end_time {
                    StreamStatus::Completed
                } else {
                    StreamStatus::Active
                };

                results.push_back(StreamBatchEntry {
                    stream_id: id,
                    unlocked_amount: remaining_unlocked,
                    status,
                });
            } else {
                results.push_back(StreamBatchEntry {
                    stream_id: id,
                    unlocked_amount: 0,
                    status: StreamStatus::NotFound,
                });
            }
        }

        Ok(results)
    }

    pub fn get_v2_protocol_health(env: Env) -> types::ProtocolHealthV2 {
        storage::get_health(&env)
    }

    // ----------------------------------------------------------------
    // Stream Operations (Issue #363 — Escalating Rates)
    // ----------------------------------------------------------------

    pub fn withdraw(env: Env, stream_id: u64, beneficiary: Address) -> Result<i128, Error> {
        Self::require_not_paused(&env)?;
        beneficiary.require_auth();

        let mut stream = storage::get_stream(&env, stream_id).ok_or(Error::StreamNotFound)?;

        if stream.beneficiary != beneficiary {
            return Err(Error::NotBeneficiary);
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

        // If Yield-Bearing, withdraw principal from Vault
        if stream.yield_enabled {
            if let Some(vault_addr) = &stream.vault_address {
                let vault_client = VaultClient::new(&env, vault_addr);
                // Attempt to withdraw from vault, catching if it's paused/fails
                let result = vault_client.try_withdraw(&to_withdraw);

                if result.is_err() {
                    stream.is_pending = true;
                    storage::set_stream(&env, stream_id, &stream);
                    // Return Ok(0) to persist the 'is_pending' state change.
                    // Returning Err automatically rolls back state in Soroban.
                    return Ok(0);
                }
            }
        }

        // Perform transfer
        let token_client = soroban_sdk::token::TokenClient::new(&env, &stream.token);
        token_client.transfer(
            &env.current_contract_address(),
            &stream.beneficiary,
            &to_withdraw,
        );

        // Update state
        stream.withdrawn_amount += to_withdraw;
        stream.is_pending = false; // Successfully withdrawn, any previous pending status cleared
        storage::set_stream(&env, stream_id, &stream);

        // Update analytics (TVL decreased)
        storage::update_stats(&env, -to_withdraw, &stream.sender, &stream.receiver);

        let mut data = Vec::new(&env);
        data.push_back(stream_id.into_val(&env));
        data.push_back(stream.beneficiary.clone().into_val(&env));
        data.push_back(to_withdraw.into_val(&env));
        data.push_back(stream.withdrawn_amount.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (stream_id, symbol_short!("claim")),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("claim"),
                data,
            },
        );

        Ok(to_withdraw)
    }

    pub fn cancel(env: Env, stream_id: u64, caller: Address) -> Result<(), Error> {
        Self::require_not_paused(&env)?;

        let mut stream = storage::get_stream(&env, stream_id).ok_or(Error::StreamNotFound)?;

        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }

        // Authorization: mutual (type=1) requires both sender AND receiver to sign;
        // unilateral (type=0, default) only requires the initiating party.
        if stream.cancellation_type == 1 {
            stream.sender.require_auth();
            stream.receiver.require_auth();
        } else {
            if stream.sender != caller && stream.beneficiary != caller {
                return Err(Error::NotStreamOwner);
            }
            caller.require_auth();
        }

        let now = env.ledger().timestamp();
        let unlocked = Self::calculate_unlocked_internal(&stream, now);
        let to_receiver = unlocked.saturating_sub(stream.withdrawn_amount);
        let to_sender = stream.total_amount.saturating_sub(unlocked);
        let total_remaining = to_receiver + to_sender;

        // If Yield-Bearing, withdraw total remaining from Vault
        if stream.yield_enabled {
            if let Some(vault_addr) = &stream.vault_address {
                let vault_client = VaultClient::new(&env, vault_addr);
                let result = vault_client.try_withdraw(&total_remaining);

                if result.is_err() {
                    stream.is_pending = true;
                    storage::set_stream(&env, stream_id, &stream);
                    return Err(Error::VaultPaused);
                }
            }
        }

        stream.withdrawn_amount = unlocked;
        stream.cancelled = true;
        storage::set_stream(&env, stream_id, &stream);

        let token_client = soroban_sdk::token::TokenClient::new(&env, &stream.token);
        if to_receiver > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &stream.beneficiary,
                &to_receiver,
            );
        }
        if to_sender > 0 {
            token_client.transfer(&env.current_contract_address(), &stream.sender, &to_sender);
        }

        let mut data = Vec::new(&env);
        data.push_back(stream_id.into_val(&env));
        data.push_back(caller.clone().into_val(&env));
        data.push_back(to_receiver.into_val(&env));
        data.push_back(to_sender.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (stream_id, symbol_short!("cancel")),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("cancel"),
                data,
            },
        );

        Ok(())
    }

    pub fn transfer_beneficiary(
        env: Env,
        stream_id: u64,
        new_beneficiary: Address,
    ) -> Result<(), Error> {
        Self::require_not_paused(&env)?;

        let mut stream = storage::get_stream(&env, stream_id).ok_or(Error::StreamNotFound)?;

        stream.beneficiary.require_auth();

        let previous_beneficiary = stream.beneficiary.clone();
        stream.beneficiary = new_beneficiary.clone();

        storage::set_stream(&env, stream_id, &stream);

        let now = env.ledger().timestamp();
        let mut data = Vec::new(&env);
        data.push_back(stream_id.into_val(&env));
        data.push_back(previous_beneficiary.into_val(&env));
        data.push_back(new_beneficiary.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (stream_id, symbol_short!("benefic")),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("benefic"),
                data,
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

    pub fn top_up(
        env: Env,
        stream_id: u64,
        sender: Address,
        extra_amount: i128,
    ) -> Result<(), Error> {
        Self::require_not_paused(&env)?;
        sender.require_auth();

        if extra_amount <= 0 {
            return Err(Error::BelowDustThreshold);
        }

        let mut stream = storage::get_stream(&env, stream_id).ok_or(Error::StreamNotFound)?;

        if stream.sender != sender {
            return Err(Error::NotStreamOwner);
        }

        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }

        let now = env.ledger().timestamp();

        // Checkpoint: calculate what's already unlocked so the rate stays consistent.
        let unlocked_at_now = Self::calculate_unlocked_internal(&stream, now);
        let remaining = stream.total_amount.saturating_sub(unlocked_at_now);

        // Pull the new funds into the contract.
        let token_client = soroban_sdk::token::TokenClient::new(&env, &stream.token);
        token_client.transfer(&sender, &env.current_contract_address(), &extra_amount);

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

        let mut data = Vec::new(&env);
        data.push_back(stream_id.into_val(&env));
        data.push_back(sender.clone().into_val(&env));
        data.push_back(extra_amount.into_val(&env));
        data.push_back(stream.total_amount.into_val(&env));
        data.push_back(new_end_time.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (stream_id, symbol_short!("top_up")),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("top_up"),
                data,
            },
        );

        Ok(())
    }

    pub fn bump_active_streams_ttl(env: Env, ids: Vec<u64>) -> u32 {
        storage::bump_streams_ttl(&env, &ids)
    }

    // ----------------------------------------------------------------
    // Governance: Stream-Weighted Voting Power
    // ----------------------------------------------------------------

    /// Calculate the total value currently locked in active streams for a user.
    /// This represents the user's "skin in the game" for governance purposes.
    pub fn get_active_volume(env: Env, user: Address) -> i128 {
        let total_streams = storage::get_health(&env).total_v2_streams;
        let mut total_locked: i128 = 0;

        for i in 0..total_streams {
            if let Some(stream) = storage::get_stream(&env, i) {
                if !stream.cancelled {
                    if stream.sender == user || stream.receiver == user {
                        let locked = stream.total_amount.saturating_sub(stream.withdrawn_amount);
                        total_locked = total_locked.saturating_add(locked);
                    }
                }
            }
        }
        total_locked
    }

    pub fn pause(env: Env) -> Result<(), Error> {
        let admin = storage::try_get_admin(&env)?;
        admin.require_auth();
        storage::set_paused(&env, true);
        let now = env.ledger().timestamp();
        let mut data = Vec::new(&env);
        data.push_back(admin.clone().into_val(&env));
        data.push_back(now.into_val(&env));
        env.events().publish(
            (symbol_short!("pause"), admin.clone()),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("pause"),
                data,
            },
        );
        Ok(())
    }

    pub fn unpause(env: Env) -> Result<(), Error> {
        let admin = storage::try_get_admin(&env)?;
        admin.require_auth();
        storage::set_paused(&env, false);
        let now = env.ledger().timestamp();
        let mut data = Vec::new(&env);
        data.push_back(admin.clone().into_val(&env));
        data.push_back(now.into_val(&env));
        env.events().publish(
            (symbol_short!("unpause"), admin.clone()),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("unpause"),
                data,
            },
        );
        Ok(())
    }

    pub fn is_paused(env: Env) -> bool {
        storage::is_paused(&env)
    }

    // ----------------------------------------------------------------
    // Compliance: Asset "Clawback" Support Logic
    // ----------------------------------------------------------------

    /// Compare the actual token balance in the contract with the sum of all
    /// active stream remaining balances.
    pub fn check_balance_integrity(env: Env, token: Address) -> (i128, i128) {
        let total_streams = storage::get_health(&env).total_v2_streams;
        let mut sum_remaining: i128 = 0;

        for i in 0..total_streams {
            if let Some(stream) = storage::get_stream(&env, i) {
                if !stream.cancelled && stream.token == token {
                    let remaining = stream.total_amount.saturating_sub(stream.withdrawn_amount);
                    sum_remaining = sum_remaining.saturating_add(remaining);
                }
            }
        }

        let token_client = soroban_sdk::token::TokenClient::new(&env, &token);
        let contract_balance = token_client.balance(&env.current_contract_address());
        (contract_balance, sum_remaining)
    }

    /// Proportionally reduce all active streams for a token if the contract
    /// balance is less than the total committed amount.
    pub fn rebalance_after_clawback(env: Env, token: Address) -> Result<(), Error> {
        let admin = storage::try_get_admin(&env)?;
        admin.require_auth();

        let (balance, sum_remaining) = Self::check_balance_integrity(env.clone(), token.clone());
        if balance >= sum_remaining || sum_remaining == 0 {
            return Ok(());
        }

        let reduction_factor_bps = (balance * 10000) / sum_remaining;
        let total_streams = storage::get_health(&env).total_v2_streams;
        for i in 0..total_streams {
            if let Some(mut stream) = storage::get_stream(&env, i) {
                if !stream.cancelled && stream.token == token {
                    let old_remaining = stream.total_amount.saturating_sub(stream.withdrawn_amount);
                    let new_remaining = (old_remaining * reduction_factor_bps) / 10000;
                    stream.total_amount = stream.withdrawn_amount + new_remaining;
                    storage::set_stream(&env, i, &stream);
                }
            }
        }

        let now = env.ledger().timestamp();
        let mut data = Vec::new(&env);
        data.push_back(token.clone().into_val(&env));
        data.push_back(sum_remaining.into_val(&env));
        data.push_back(balance.into_val(&env));
        data.push_back(reduction_factor_bps.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (symbol_short!("rebalance"), token.clone()),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("rebalance"),
                data,
            },
        );

        Ok(())
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

        // ---- Affiliate Fee Split (Issue: Tokenomics) ----
        // If a protocol fee is configured AND a treasury is set, deduct the fee
        // from total_amount: 70% goes to MainTreasury, 30% to AffiliateAddress.
        // Fees are stored in PendingFees for batch withdrawal.
        let fee_bps = storage::get_fee_bps(&env);
        let stream_amount = if fee_bps > 0 {
            if let Some(treasury) = storage::get_treasury(&env) {
                let fee = (args.total_amount * fee_bps as i128) / 10_000;
                if fee > 0 {
                    let treasury_share = (fee * 70) / 100;
                    let affiliate_share = fee - treasury_share;

                    storage::add_pending_fees(&env, &treasury, &args.token, treasury_share);

                    if let Some(ref affiliate) = args.affiliate {
                        storage::add_pending_fees(&env, affiliate, &args.token, affiliate_share);
                    } else {
                        // No affiliate — remainder also goes to treasury
                        storage::add_pending_fees(&env, &treasury, &args.token, affiliate_share);
                    }

                    args.total_amount - fee
                } else {
                    args.total_amount
                }
            } else {
                args.total_amount
            }
        } else {
            args.total_amount
        };

        let stream_id = storage::next_stream_id(&env);

        let mut vault_used = None;
        if args.yield_enabled {
            if let Some(vault_addr) = &args.vault_address {
                let vault_client = VaultClient::new(&env, vault_addr);
                vault_client.deposit(&stream_amount);
                vault_used = Some(vault_addr.clone());
            }
        }

        let stream = StreamV2 {
            sender: args.sender.clone(),
            receiver: args.receiver.clone(),
            beneficiary: args.receiver.clone(),
            token: args.token.clone(),
            total_amount: stream_amount,
            start_time: args.start_time,
            end_time: args.end_time,
            cliff_time: args.cliff_time,
            withdrawn_amount: 0,
            cancelled: false,
            migrated_from_v1: false,
            v1_stream_id: 0,
            step_duration: args.step_duration,
            multiplier_bps: args.multiplier_bps,
            vault_address: vault_used,
            yield_enabled: args.yield_enabled,
            is_pending: false,
            is_recurrent: args.is_recurrent,
            cycle_duration: args.cycle_duration,
            cancellation_type: args.cancellation_type,
        };

        storage::set_stream(&env, stream_id, &stream);
        storage::update_stats(&env, stream_amount, &args.sender, &args.receiver);

        let now = env.ledger().timestamp();
        let mut data = Vec::new(&env);
        data.push_back(stream_id.into_val(&env));
        data.push_back(args.sender.clone().into_val(&env));
        data.push_back(args.receiver.clone().into_val(&env));
        data.push_back(args.token.clone().into_val(&env));
        data.push_back(stream_amount.into_val(&env));
        data.push_back(args.start_time.into_val(&env));
        data.push_back(args.cliff_time.into_val(&env));
        data.push_back(args.end_time.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (stream_id, symbol_short!("create_v2")),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("create_v2"),
                data,
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
            beneficiary: args.receiver.clone(),
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
            vault_address: None, // No vault support by permit yet
            yield_enabled: false,
            is_pending: false,
            is_recurrent: false,
            cycle_duration: 0,
            cancellation_type: 0,
        };

        storage::set_stream(&env, stream_id, &stream);
        storage::update_stats(&env, args.total_amount, &sender_addr, &args.receiver);

        let mut data = Vec::new(&env);
        data.push_back(stream_id.into_val(&env));
        data.push_back(args.receiver.clone().into_val(&env));
        data.push_back(args.token.clone().into_val(&env));
        data.push_back(args.total_amount.into_val(&env));
        data.push_back(args.cliff_time.into_val(&env));
        data.push_back(args.nonce.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (stream_id, symbol_short!("permit")),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("permit"),
                data,
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

            total_amount = total_amount
                .checked_add(args.total_amount)
                .ok_or(Error::InvalidTimeRange)?; // Overflow protection
        }

        // Require auth from the sender
        sender.require_auth();

        // Calculate total amount needed and transfer all tokens at once
        let token_client =
            soroban_sdk::token::TokenClient::new(&env, &streams.get(0).unwrap().token);
        token_client.transfer(&sender, &env.current_contract_address(), &total_amount);

        // Create all streams
        let mut stream_ids = Vec::new(&env);
        let mut total_created_amount: i128 = 0;

        for args in streams.iter() {
            let stream_id = storage::next_stream_id(&env);

            let stream = StreamV2 {
                sender: args.sender.clone(),
                receiver: args.receiver.clone(),
                beneficiary: args.receiver.clone(),
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
                vault_address: None, // Batch creation defaults to no vault
                yield_enabled: false,
                is_pending: false,
                is_recurrent: args.is_recurrent,
                cycle_duration: args.cycle_duration,
                cancellation_type: args.cancellation_type,
            };

            storage::set_stream(&env, stream_id, &stream);
            storage::update_stats(&env, args.total_amount, &args.sender, &args.receiver);

            let now = env.ledger().timestamp();
            let mut data = Vec::new(&env);
            data.push_back(stream_id.into_val(&env));
            data.push_back(args.sender.clone().into_val(&env));
            data.push_back(args.receiver.clone().into_val(&env));
            data.push_back(args.token.clone().into_val(&env));
            data.push_back(args.total_amount.into_val(&env));
            data.push_back(args.start_time.into_val(&env));
            data.push_back(args.cliff_time.into_val(&env));
            data.push_back(args.end_time.into_val(&env));
            data.push_back(now.into_val(&env));

            env.events().publish(
                (stream_id, symbol_short!("create_v2")),
                NebulaEvent {
                    version: 2,
                    timestamp: now,
                    action: symbol_short!("create_v2"),
                    data,
                },
            );

            stream_ids.push_back(stream_id);
            total_created_amount = total_created_amount.checked_add(args.total_amount).unwrap();
        }

        // Emit batch creation summary event
        let now = env.ledger().timestamp();
        let mut batch_data = Vec::new(&env);
        batch_data.push_back(sender.clone().into_val(&env));
        batch_data.push_back((stream_ids.len() as u32).into_val(&env));
        batch_data.push_back(total_created_amount.into_val(&env));
        batch_data.push_back(now.into_val(&env));

        env.events().publish(
            (Symbol::new(&env, "batch_create"), sender.clone()),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: Symbol::new(&env, "batch_create"),
                data: batch_data,
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

        let now = env.ledger().timestamp();
        let mut data = Vec::new(&env);
        data.push_back(execution_time.into_val(&env));

        env.events().publish(
            (symbol_short!("schedule"),),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("schedule"),
                data,
            },
        );

        Ok(())
    }

    pub fn execute_op(env: Env, op: Operation) -> Result<(), Error> {
        let admin = storage::try_get_admin(&env)?;
        admin.require_auth();

        let execution_time =
            storage::get_scheduled_op_time(&env, &op).ok_or(Error::OpNotScheduled)?;

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

        let now = env.ledger().timestamp();
        let mut data = Vec::new(&env);
        data.push_back(now.into_val(&env));

        env.events().publish(
            (symbol_short!("executed"),),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("executed"),
                data,
            },
        );

        Ok(())
    }

    // ----------------------------------------------------------------
    // Issue: Recurrent Streams — refill_stream
    // ----------------------------------------------------------------

    /// Attempt to auto-renew a recurrent stream after its cycle has ended.
    ///
    /// The contract uses `transfer_from` to pull `total_amount` tokens from
    /// the sender — the sender must have pre-approved the contract as spender
    /// via the token's `approve` function before calling this.
    ///
    /// - If the transfer succeeds: a new cycle begins immediately.
    /// - If the transfer fails (insufficient allowance / balance):
    ///   `is_recurrent` is set to `false` and the stream stays completed.
    ///
    /// This function is permissionless and can be triggered by keeper bots.
    pub fn refill_stream(env: Env, stream_id: u64) -> Result<(), Error> {
        Self::require_not_paused(&env)?;

        let mut stream = storage::get_stream(&env, stream_id).ok_or(Error::StreamNotFound)?;

        if !stream.is_recurrent {
            return Err(Error::NotRecurrent);
        }
        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }

        let now = env.ledger().timestamp();
        if now < stream.end_time {
            return Err(Error::StreamNotExpired);
        }

        let original_amount = stream.total_amount;
        let token_client = soroban_sdk::token::TokenClient::new(&env, &stream.token);

        // Contract is the approved spender; sender must have set allowance beforehand.
        let result = token_client.try_transfer_from(
            &env.current_contract_address(),
            &stream.sender,
            &env.current_contract_address(),
            &original_amount,
        );

        if result.is_err() {
            // Allowance exhausted or transfer failed — disable recurrence.
            stream.is_recurrent = false;
            storage::set_stream(&env, stream_id, &stream);
            return Ok(());
        }

        let old_end_time = stream.end_time;
        let new_end_time = old_end_time + stream.cycle_duration;

        stream.start_time = old_end_time;
        stream.end_time = new_end_time;
        stream.withdrawn_amount = 0; // Reset for the new cycle

        storage::set_stream(&env, stream_id, &stream);
        storage::update_stats(&env, original_amount, &stream.sender, &stream.receiver);

        let mut data = Vec::new(&env);
        data.push_back(stream_id.into_val(&env));
        data.push_back(stream.sender.clone().into_val(&env));
        data.push_back(original_amount.into_val(&env));
        data.push_back(old_end_time.into_val(&env));
        data.push_back(new_end_time.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (stream_id, symbol_short!("refill")),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("refill"),
                data,
            },
        );

        Ok(())
    }

    // ----------------------------------------------------------------
    // Issue: Affiliate Fee Split — admin helpers + fee withdrawal
    // ----------------------------------------------------------------

    /// Set the protocol treasury address. Admin-only.
    pub fn set_treasury(env: Env, treasury: Address) -> Result<(), Error> {
        storage::try_get_admin(&env)?.require_auth();
        storage::set_treasury(&env, &treasury);
        Ok(())
    }

    /// Get the current treasury address.
    pub fn get_treasury(env: Env) -> Option<Address> {
        storage::get_treasury(&env)
    }

    /// Set the protocol fee in basis points (e.g. 100 = 1%). Admin-only.
    pub fn set_fee_bps(env: Env, bps: u32) -> Result<(), Error> {
        storage::try_get_admin(&env)?.require_auth();
        storage::set_fee_bps(&env, bps);
        Ok(())
    }

    /// Get the current protocol fee in basis points.
    pub fn get_fee_bps(env: Env) -> u32 {
        storage::get_fee_bps(&env)
    }

    /// Withdraw accumulated protocol fees for `(recipient, token)`.
    /// The recipient must authorise this call.
    pub fn withdraw_fees(env: Env, recipient: Address, token: Address) -> Result<i128, Error> {
        recipient.require_auth();

        let amount = storage::get_pending_fees(&env, &recipient, &token);
        if amount <= 0 {
            return Err(Error::NothingToWithdraw);
        }

        storage::clear_pending_fees(&env, &recipient, &token);

        let token_client = soroban_sdk::token::TokenClient::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &recipient, &amount);

        let now = env.ledger().timestamp();
        let mut data = Vec::new(&env);
        data.push_back(recipient.clone().into_val(&env));
        data.push_back(token.clone().into_val(&env));
        data.push_back(amount.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (symbol_short!("fee_out"), recipient.clone()),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("fee_out"),
                data,
            },
        );

        Ok(amount)
    }

    /// Query pending fee balance for a `(recipient, token)` pair.
    pub fn get_pending_fees(env: Env, recipient: Address, token: Address) -> i128 {
        storage::get_pending_fees(&env, &recipient, &token)
    }
}

mod test;
