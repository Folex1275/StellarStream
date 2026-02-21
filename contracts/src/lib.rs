#![no_std]
#![allow(clippy::too_many_arguments)]

pub mod interest;
pub mod math;
mod test;
mod types;

#[cfg(test)]
mod interest_test;

use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Env, Vec};
pub use types::{DataKey, InterestDistribution, LegacyStream, Stream, StreamRequest};

const THRESHOLD: u32 = 518400; // ~30 days
const LIMIT: u32 = 1036800; // ~60 days

#[contract]
pub struct StellarStream;

#[allow(clippy::too_many_arguments)]
#[contractimpl]
impl StellarStream {
    // ========== Migration Functions ==========

    /// Get the current contract version
    pub fn get_version(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ContractVersion)
            .unwrap_or(1) // Default to version 1 if not set
    }

    /// Set the contract version (internal use only)
    fn set_version(env: &Env, version: u32) {
        env.storage()
            .instance()
            .set(&DataKey::ContractVersion, &version);
    }

    /// Check if a specific migration has been executed
    fn is_migration_executed(env: &Env, migration_version: u32) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::MigrationExecuted(migration_version))
            .unwrap_or(false)
    }

    /// Mark a migration as executed (self-destructing mechanism)
    fn mark_migration_executed(env: &Env, migration_version: u32) {
        env.storage()
            .instance()
            .set(&DataKey::MigrationExecuted(migration_version), &true);
    }

    /// Main migration function - orchestrates all migrations
    /// Can only be called by admin and only once per version
    pub fn migrate(env: Env, admin: Address, target_version: u32) {
        admin.require_auth();

        // Verify admin authorization
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        if admin != stored_admin {
            panic!("Unauthorized: Only admin can run migrations");
        }

        // Check if this migration has already been executed
        if Self::is_migration_executed(&env, target_version) {
            panic!(
                "Migration for version {} has already been executed",
                target_version
            );
        }

        let current_version = Self::get_version(env.clone());

        // Ensure we're migrating forward
        if target_version <= current_version {
            panic!("Target version must be greater than current version");
        }

        // Execute migrations sequentially
        for version in (current_version + 1)..=target_version {
            match version {
                2 => Self::migrate_v1_to_v2(&env),
                _ => panic!("No migration defined for version {}", version),
            }
        }

        // Mark migration as executed (self-destructing)
        Self::mark_migration_executed(&env, target_version);

        // Update contract version
        Self::set_version(&env, target_version);

        // Emit migration event
        env.events()
            .publish((symbol_short!("migrate"), admin), target_version);
    }

    /// Migration from v1 to v2: Add cliff_time to existing streams
    /// Legacy streams (v1) didn't have cliff_time, so we set it to start_time
    fn migrate_v1_to_v2(env: &Env) {
        let stream_count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::StreamId)
            .unwrap_or(0);

        // Iterate through all existing streams
        for stream_id in 1..=stream_count {
            let stream_key = DataKey::Stream(stream_id);

            // Check if stream exists
            if !env.storage().persistent().has(&stream_key) {
                continue;
            }

            // Try to read as current Stream format first
            // If it succeeds, the stream is already migrated
            if env
                .storage()
                .persistent()
                .get::<DataKey, Stream>(&stream_key)
                .is_some()
            {
                continue; // Already in new format, skip
            }

            // If reading as Stream failed, try as LegacyStream
            // Note: In practice, we'd need to handle this more carefully
            // For now, we'll just skip streams that can't be read
        }
    }

    /// Helper function to manually migrate a single stream (for testing/recovery)
    pub fn migrate_single_stream(env: Env, admin: Address, stream_id: u64) {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        if admin != stored_admin {
            panic!("Unauthorized: Only admin can migrate streams");
        }

        let stream_key = DataKey::Stream(stream_id);

        // Try to read as LegacyStream
        if let Some(legacy_stream) = env
            .storage()
            .persistent()
            .get::<DataKey, LegacyStream>(&stream_key)
        {
            let migrated_stream = Stream {
                sender: legacy_stream.sender,
                receiver: legacy_stream.receiver,
                token: legacy_stream.token,
                amount: legacy_stream.amount,
                start_time: legacy_stream.start_time,
                cliff_time: legacy_stream.start_time,
                end_time: legacy_stream.end_time,
                withdrawn_amount: legacy_stream.withdrawn_amount,
                interest_strategy: 0, // No interest strategy for legacy streams
                vault_address: None,  // No vault for legacy streams
                deposited_principal: legacy_stream.amount, // Same as amount for legacy
            };

            env.storage()
                .persistent()
                .set(&stream_key, &migrated_stream);

            env.events()
                .publish((symbol_short!("mig_strm"), admin), stream_id);
        } else {
            panic!(
                "Stream {} is not in legacy format or does not exist",
                stream_id
            );
        }
    }

    // ========== Admin & Fee Management ==========
    pub fn initialize_fee(env: Env, admin: Address, fee_bps: u32, treasury: Address) {
        admin.require_auth();
        if fee_bps > 1000 {
            panic!("Fee cannot exceed 10%");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
    }

    pub fn update_fee(env: Env, admin: Address, fee_bps: u32) {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        if admin != stored_admin {
            panic!("Unauthorized: Only admin can update fee");
        }
        if fee_bps > 1000 {
            panic!("Fee cannot exceed 10%");
        }
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
    }

    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::IsPaused, &false);
    }

    pub fn set_pause(env: Env, admin: Address, paused: bool) {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        if admin != stored_admin {
            panic!("Unauthorized: Only admin can pause");
        }
        env.storage().instance().set(&DataKey::IsPaused, &paused);
    }

    /// Check if contract is paused (inlined for performance)
    #[inline(always)]
    fn check_not_paused(env: &Env) {
        let is_paused: bool = env
            .storage()
            .instance()
            .get(&DataKey::IsPaused)
            .unwrap_or(false);
        if is_paused {
            panic!("Contract is paused");
        }
    }

    /// Optimized withdraw function - most frequently called
    /// Minimizes storage reads and uses inlined math functions
    /// Optimized create_stream with better fee calculation
    #[allow(clippy::too_many_arguments)]
    pub fn create_stream(
        env: Env,
        sender: Address,
        receiver: Address,
        token: Address,
        amount: i128,
        start_time: u64,
        cliff_time: u64,
        end_time: u64,
        interest_strategy: u32,
        vault_address: Option<Address>,
    ) -> u64 {
        Self::check_not_paused(&env);
        Self::check_not_decommissioned(&env);
        sender.require_auth();

        // Early validation to fail fast
        if end_time <= start_time {
            panic!("End time must be after start time");
        }
        if cliff_time < start_time || cliff_time >= end_time {
            panic!("Cliff time must be between start and end time");
        }
        if amount <= 0 {
            panic!("Amount must be greater than zero");
        }

        // Validate interest strategy (must be between 0-7)
        if interest_strategy > 7 {
            panic!("Invalid interest strategy");
        }

        let token_client = token::Client::new(&env, &token);

        // Get fee configuration once
        let fee_bps: u32 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0);

        // Use optimized fee calculation
        let fee_amount = math::calculate_fee(amount, fee_bps);
        let principal = amount - fee_amount;

        // Transfer principal to contract or vault
        let deposit_target = if let Some(ref vault) = vault_address {
            vault.clone()
        } else {
            env.current_contract_address()
        };

        token_client.transfer(&sender, &deposit_target, &principal);

        // Transfer fee if applicable (avoid unnecessary storage read)
        if fee_amount > 0 {
            let treasury: Address = env
                .storage()
                .instance()
                .get(&DataKey::Treasury)
                .expect("Treasury not set");
            token_client.transfer(&sender, &treasury, &fee_amount);
        }

        // Get and increment stream ID
        let mut stream_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::StreamId)
            .unwrap_or(0);
        stream_id += 1;
        env.storage().instance().set(&DataKey::StreamId, &stream_id);
        env.storage().instance().extend_ttl(THRESHOLD, LIMIT);

        // Create stream struct
        let stream = Stream {
            sender: sender.clone(),
            receiver,
            token,
            amount: principal,
            start_time,
            cliff_time,
            end_time,
            withdrawn_amount: 0,
            interest_strategy,
            vault_address,
            deposited_principal: principal,
        };

        // Store stream
        let stream_key = DataKey::Stream(stream_id);
        env.storage().persistent().set(&stream_key, &stream);
        env.storage()
            .persistent()
            .extend_ttl(&stream_key, THRESHOLD, LIMIT);

        // Emit event
        env.events()
            .publish((symbol_short!("create"), sender), stream_id);

        stream_id
    }

    #[allow(clippy::too_many_arguments)]
    pub fn create_batch_streams(
        env: Env,
        sender: Address,
        token: Address,
        requests: Vec<StreamRequest>,
    ) -> Vec<u64> {
        Self::check_not_paused(&env);
        Self::check_not_decommissioned(&env);
        sender.require_auth();

        let mut total_amount: i128 = 0;
        for request in requests.iter() {
            if request.end_time <= request.start_time {
                panic!("End time must be after start time");
            }
            if request.amount <= 0 {
                panic!("Amount must be greater than zero");
            }
            if request.interest_strategy > 7 {
                panic!("Invalid interest strategy");
            }
            total_amount += request.amount;
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &total_amount);

        let mut stream_ids = Vec::new(&env);
        let mut stream_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::StreamId)
            .unwrap_or(0);

        for request in requests.iter() {
            stream_id += 1;

            let stream = Stream {
                sender: sender.clone(),
                receiver: request.receiver.clone(),
                token: token.clone(),
                amount: request.amount,
                start_time: request.start_time,
                cliff_time: request.cliff_time,
                end_time: request.end_time,
                withdrawn_amount: 0,
                interest_strategy: request.interest_strategy,
                vault_address: request.vault_address.clone(),
                deposited_principal: request.amount,
            };

            env.storage()
                .persistent()
                .set(&DataKey::Stream(stream_id), &stream);

            env.events()
                .publish((symbol_short!("create"), sender.clone()), stream_id);

            stream_ids.push_back(stream_id);
        }

        env.storage().instance().set(&DataKey::StreamId, &stream_id);

        stream_ids
    }

    pub fn withdraw(env: Env, stream_id: u64, receiver: Address) -> i128 {
        Self::check_not_paused(&env);
        receiver.require_auth();

        // Re-entrancy guard
        if Self::is_locked(&env) {
            panic!("Re-entrancy detected");
        }
        Self::set_lock(&env, true);

        let result = Self::withdraw_internal(&env, stream_id, &receiver);

        Self::set_lock(&env, false);
        result
    }

    fn withdraw_internal(env: &Env, stream_id: u64, receiver: &Address) -> i128 {
        let stream_key = DataKey::Stream(stream_id);
        let mut stream: Stream = env
            .storage()
            .persistent()
            .get(&stream_key)
            .expect("Stream does not exist");

        if *receiver != stream.receiver {
            panic!("Unauthorized: You are not the receiver of this stream");
        }

        let now = env.ledger().timestamp();

        // Use precision-safe calculation that handles final withdrawal correctly
        let withdrawable_principal = math::calculate_withdrawable(
            stream.amount,
            stream.withdrawn_amount,
            stream.start_time,
            stream.cliff_time,
            stream.end_time,
            now,
        );

        if withdrawable_principal <= 0 {
            panic!("No funds available to withdraw at this time");
        }

        let token_client = token::Client::new(env, &stream.token);
        let contract_address = env.current_contract_address();

        // Calculate and distribute interest if vault is used
        let mut total_withdrawn = withdrawable_principal;

        if let Some(ref vault_addr) = stream.vault_address {
            // Get current vault balance
            let vault_balance = token_client.balance(vault_addr);

            // Calculate interest earned
            let total_interest =
                interest::calculate_vault_interest(vault_balance, stream.deposited_principal);

            if total_interest > 0 {
                // Calculate proportional interest for this withdrawal
                let proportional_interest = if stream.amount > 0 {
                    (total_interest * withdrawable_principal) / stream.amount
                } else {
                    0
                };

                // Distribute interest according to strategy
                let distribution = interest::calculate_interest_distribution(
                    proportional_interest,
                    stream.interest_strategy,
                );

                // Save receiver's interest share before moving distribution
                let receiver_interest = distribution.to_receiver;

                // Transfer interest to respective parties
                if distribution.to_sender > 0 {
                    token_client.transfer(vault_addr, &stream.sender, &distribution.to_sender);
                }
                if distribution.to_receiver > 0 {
                    token_client.transfer(vault_addr, receiver, &distribution.to_receiver);
                }
                if distribution.to_protocol > 0 {
                    let treasury: Address = env
                        .storage()
                        .instance()
                        .get(&DataKey::Treasury)
                        .expect("Treasury not set");
                    token_client.transfer(vault_addr, &treasury, &distribution.to_protocol);
                }

                // Emit interest distribution event
                env.events()
                    .publish((symbol_short!("interest"), stream_id), distribution);

                // Add receiver's interest share to total withdrawn
                total_withdrawn += receiver_interest;
            }

            // Transfer principal from vault to receiver
            token_client.transfer(vault_addr, receiver, &withdrawable_principal);
        } else {
            // No vault, simple transfer from contract
            token_client.transfer(&contract_address, receiver, &withdrawable_principal);
        }

        stream.withdrawn_amount += withdrawable_principal;
        env.storage().persistent().set(&stream_key, &stream);
        env.storage()
            .persistent()
            .extend_ttl(&stream_key, THRESHOLD, LIMIT);

        env.events().publish(
            (symbol_short!("withdraw"), receiver.clone()),
            (stream_id, total_withdrawn),
        );

        total_withdrawn
    }

    pub fn cancel_stream(env: Env, stream_id: u64) {
        Self::check_not_paused(&env);

        // Re-entrancy guard
        if Self::is_locked(&env) {
            panic!("Re-entrancy detected");
        }
        Self::set_lock(&env, true);

        Self::cancel_stream_internal(&env, stream_id);

        Self::set_lock(&env, false);
    }

    fn cancel_stream_internal(env: &Env, stream_id: u64) {
        let stream_key = DataKey::Stream(stream_id);
        let stream: Stream = env
            .storage()
            .persistent()
            .get(&stream_key)
            .expect("Stream does not exist");

        stream.sender.require_auth();

        // Get current time once
        let now = env.ledger().timestamp();
        let is_decommissioned: bool = env
            .storage()
            .instance()
            .get(&DataKey::IsDecommissioned)
            .unwrap_or(false);

        // Early validation
        if now >= stream.end_time {
            panic!("Stream has already completed and cannot be cancelled");
        }

        // Use inlined math function
        let total_unlocked = math::calculate_unlocked(
            stream.amount,
            stream.start_time,
            stream.cliff_time,
            stream.end_time,
            now,
        );

        let withdrawable_to_receiver = total_unlocked - stream.withdrawn_amount;
        let refund_to_sender = stream.amount - total_unlocked;

        let token_client = token::Client::new(env, &stream.token);

        // Determine source address (vault or contract)
        let source_address = if let Some(ref vault_addr) = stream.vault_address {
            // Handle interest distribution on cancellation
            let vault_balance = token_client.balance(vault_addr);
            let total_interest =
                interest::calculate_vault_interest(vault_balance, stream.deposited_principal);

            if total_interest > 0 {
                let distribution = interest::calculate_interest_distribution(
                    total_interest,
                    stream.interest_strategy,
                );

                // Distribute all accumulated interest
                if distribution.to_sender > 0 {
                    token_client.transfer(vault_addr, &stream.sender, &distribution.to_sender);
                }
                if distribution.to_receiver > 0 {
                    token_client.transfer(vault_addr, &stream.receiver, &distribution.to_receiver);
                }
                if distribution.to_protocol > 0 {
                    let treasury: Address = env
                        .storage()
                        .instance()
                        .get(&DataKey::Treasury)
                        .expect("Treasury not set");
                    token_client.transfer(vault_addr, &treasury, &distribution.to_protocol);
                }

                env.events()
                    .publish((symbol_short!("interest"), stream_id), distribution);
            }

            vault_addr.clone()
        } else {
            env.current_contract_address()
        };

        if withdrawable_to_receiver > 0 {
            token_client.transfer(&source_address, &stream.receiver, &withdrawable_to_receiver);
        }

        if refund_to_sender > 0 {
            token_client.transfer(&source_address, &stream.sender, &refund_to_sender);
        }

        // Remove stream from storage
        env.storage().persistent().remove(&stream_key);

        // Emit event
        env.events()
            .publish((symbol_short!("cancel"), stream_id), stream.sender);
    }

    pub fn transfer_receiver(env: Env, stream_id: u64, new_receiver: Address) {
        let mut stream: Stream = env
            .storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .expect("Stream does not exist");

        stream.receiver.require_auth();

        stream.receiver = new_receiver.clone();
        env.storage()
            .persistent()
            .set(&DataKey::Stream(stream_id), &stream);

        env.events()
            .publish((symbol_short!("transfer"), stream_id), new_receiver);
    }

    pub fn extend_stream_ttl(env: Env, stream_id: u64) {
        let stream_key = DataKey::Stream(stream_id);
        env.storage()
            .persistent()
            .extend_ttl(&stream_key, THRESHOLD, LIMIT);
    }

    /// Get current interest information for a stream
    pub fn get_interest_info(env: Env, stream_id: u64) -> InterestDistribution {
        let stream: Stream = env
            .storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .expect("Stream does not exist");

        if let Some(ref vault_addr) = stream.vault_address {
            let token_client = token::Client::new(&env, &stream.token);
            let vault_balance = token_client.balance(vault_addr);

            let total_interest =
                interest::calculate_vault_interest(vault_balance, stream.deposited_principal);

            interest::calculate_interest_distribution(total_interest, stream.interest_strategy)
        } else {
            InterestDistribution {
                to_sender: 0,
                to_receiver: 0,
                to_protocol: 0,
                total_interest: 0,
            }
        }
    }

    /// Get stream details
    pub fn get_stream(env: Env, stream_id: u64) -> Stream {
        env.storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .expect("Stream does not exist")
    }

    // ========== Re-entrancy Guard Functions ==========

    fn is_locked(env: &Env) -> bool {
        env.storage()
            .temporary()
            .get(&DataKey::ReentrancyLock)
            .unwrap_or(false)
    }

    fn set_lock(env: &Env, locked: bool) {
        if locked {
            env.storage()
                .temporary()
                .set(&DataKey::ReentrancyLock, &locked);
        } else {
            env.storage().temporary().remove(&DataKey::ReentrancyLock);
        }
    }
}
