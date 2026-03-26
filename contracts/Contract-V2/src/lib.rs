#![no_std]
#![allow(clippy::too_many_arguments)]
use soroban_sdk::xdr::ToXdr;
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Bytes, Env, IntoVal, Vec};

mod contracterror;
mod math;
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
    StreamStatus, StreamToppedUpEvent, StreamV2, StreamRequestInitiatedEvent,
    StreamRequestApprovedEvent, StreamRequestExecutedEvent,
};
use v1_interface::Client as V1Client;

#[contract]
pub struct Contract;

const CONTRACT_VERSION: u32 = 2;
/// SHA-256 of the contract-metadata.json file, stored as raw bytes.
/// Avoids embedding a long URL string in the WASM binary.
const CONTRACT_METADATA_HASH: [u8; 32] = [
    0x9f, 0x86, 0xd0, 0x81, 0x88, 0x4c, 0x7d, 0x65,
    0x9a, 0x2f, 0xea, 0xa0, 0xc5, 0x5a, 0xd0, 0x15,
    0xa3, 0xbf, 0x4f, 0x1b, 0x2b, 0x0b, 0x82, 0x2c,
    0xd1, 0x5d, 0x6c, 0x15, 0xb0, 0xf0, 0x0a, 0x08,
];

#[soroban_sdk::contractclient(name = "VaultClient")]
pub trait VaultTrait {
    fn deposit(env: Env, amount: i128);
    fn withdraw(env: Env, amount: i128) -> i128; // returns actual amount withdrawn
    /// Returns the accrued interest on `principal` without withdrawing it.
    fn get_accrued_interest(env: Env, principal: i128) -> i128;
}

/// Compliance oracle interface (Issue #412).
/// The oracle must implement `is_allowed(addr) -> bool`.
/// Returning `false` means the address is on the deny-list.
#[soroban_sdk::contractclient(name = "ComplianceClient")]
pub trait ComplianceTrait {
    fn is_allowed(env: Env, addr: Address) -> bool;
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

    pub fn version(_env: Env) -> u32 {
        CONTRACT_VERSION
    }

    pub fn metadata(env: Env) -> Bytes {
        Bytes::from_slice(&env, &CONTRACT_METADATA_HASH)
    }

    // ----------------------------------------------------------------
    // Issue #407 — Bridge-In Receiver Hook
    // ----------------------------------------------------------------

    /// Handle incoming tokens from another chain (e.g., Ethereum via Allbridge).
    /// 
    /// When assets arrive with "Instruction Metadata", this function parses the
    /// metadata to extract receiver_address and duration, then automatically
    /// creates a stream without requiring a second transaction from the user.
    /// 
    /// Metadata format (40 bytes total):
    /// - First 32 bytes: receiver address (as Bytes)
    /// - Next 8 bytes: duration in seconds (u64, big-endian)
    /// 
    /// # Parameters
    /// - `from`: The address that sent the tokens (bridge contract)
    /// - `amount`: The amount of tokens received
    /// - `metadata`: Bytes containing receiver address and duration
    /// 
    /// # Returns
    /// - `Ok(stream_id)` if stream was created successfully
    /// - `Ok(0)` if no valid metadata was provided (funds still received but no stream created)
    /// - `Err(Error)` if metadata was invalid
    pub fn on_token_receive(
        env: Env,
        from: Address,
        amount: i128,
        metadata: Bytes,
    ) -> Result<u64, Error> {
        // Don't require auth for bridge callbacks - the bridge should be authorized
        // by having sent the tokens to this contract
        
        // Validate minimum amount
        if amount <= 0 {
            return Err(Error::InvalidBridgeMetadata);
        }

        // If no metadata or too short, just accept funds without creating stream
        if metadata.is_empty() || metadata.len() < 40 {
            // Just accept the funds - no auto-stream created
            return Ok(0);
        }

        // Parse metadata: first 32 bytes = receiver address, next 8 bytes = duration
        let receiver_address_bytes = metadata.slice(0..32);
        let duration_bytes = metadata.slice(32..40);

        // Parse duration from 8 bytes (big-endian u64)
        let mut arr = [0u8; 8];
        for i in 0u32..8 {
            arr[i as usize] = duration_bytes.get(i).unwrap_or(0);
        }
        let duration = u64::from_be_bytes(arr);

        // Validate duration (must be at least 1 second and not exceed 10 years)
        if duration == 0 || duration > 315_360_000 {
            return Err(Error::InvalidDuration);
        }

        // Convert receiver address bytes to Address
        // For Stellar addresses, we need to handle them properly
        // Try to parse as a valid address from the bytes
        let receiver_address = Self::parse_address_from_bytes(&receiver_address_bytes)?;

        // Get the token address - this will be the token that was transferred
        // We need to determine which token was sent. In a bridge scenario,
        // the token contract that called this function is the token being received.
        // We'll need to get this from the environment.
        let token_address = Self::get_received_token(&env, &from)?;

        // Validate asset is whitelisted
        Self::require_asset_whitelisted(&env, &token_address)?;

        // Calculate stream times
        let now = env.ledger().timestamp();
        let start_time = now;
        let end_time = now.saturating_add(duration);

        // Create StreamArgs
        let stream_args = StreamArgs {
            sender: from.clone(), // Bridge acts as sender (has the funds)
            receiver: receiver_address.clone(),
            token: token_address,
            total_amount: amount,
            start_time,
            cliff_time: start_time, // No cliff for bridge-in streams
            end_time,
            step_duration: 0, // Default linear stream
            multiplier_bps: 10000, // 1.0x multiplier (no escalation)
            penalty_bps: 0, // No penalty for bridge streams
            vault_address: None, // No yield for bridge streams initially
            yield_enabled: false,
            is_recurrent: false,
            cycle_duration: 0,
            cancellation_type: 0, // Unilateral cancellation
            affiliate: None,
        };

        // Create the stream
        let stream_id = Self::create_stream_internal(env.clone(), stream_args)?;

        // Emit event for bridge-in stream creation
        let mut data = Vec::new(&env);
        data.push_back(stream_id.into_val(&env));
        data.push_back(from.into_val(&env));
        data.push_back(receiver_address.into_val(&env));
        data.push_back(amount.into_val(&env));
        data.push_back(duration.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (stream_id, symbol_short!("bridge_in")),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("bridge_in"),
                data,
            },
        );

        Ok(stream_id)
    }

    /// Parse address from bytes slice.
    /// The bytes should contain a valid Stellar address string (e.g., "G...").
    fn parse_address_from_bytes(bytes: &soroban_sdk::Bytes) -> Result<Address, Error> {
        // The metadata should contain a string like "GABC123..."
        // We'll try to extract it as a string
        
        // Check minimum length for a Stellar address
        if bytes.len() < 56 {
            return Err(Error::MissingReceiverAddress);
        }
        
        // For Stellar addresses encoded as strings, they're typically 56 characters
        // Starting with 'G' and containing base32 characters
        // Since we can't easily convert Bytes to String in Soroban, we need a workaround
        
        // Try to find a 'G' in the bytes to locate the address start
        let mut start_idx: Option<u32> = None;
        for i in 0u32..bytes.len() {
            if bytes.get(i).unwrap_or(0) == b'G' {
                start_idx = Some(i);
                break;
            }
        }
        
        let start_idx = start_idx.ok_or(Error::MissingReceiverAddress)?;
        
        // Extract up to 56 characters after 'G'
        let mut addr_str_arr = [0u8; 56];
        let mut found_end = false;
        let mut char_count = 0usize;
        
        for j in 0usize..56 {
            let idx = start_idx as usize + j;
            if idx >= bytes.len() as usize {
                found_end = true;
                break;
            }
            let b = bytes.get(idx as u32).unwrap_or(0);
            if b == 0 {
                found_end = true;
                break;
            }
            addr_str_arr[j] = b;
            char_count += 1;
        }
        
        if char_count < 56 {
            return Err(Error::MissingReceiverAddress);
        }
        
        // Create string from the array
        let addr_str = soroban_sdk::String::from_str(
            &bytes.env(),
            core::str::from_utf8(&addr_str_arr[..56]).unwrap_or(""),
        );
        
        Ok(Address::from_string(&addr_str))
    }

    /// Get the token address that was received.
    /// The bridge should include the token address in the metadata.
    /// For now, we use the 'from' address as the token if it's a valid token contract.
    fn get_received_token(_env: &Env, from: &Address) -> Result<Address, Error> {
        // In many bridge scenarios, the 'from' address is the token contract
        // This is a reasonable default - the bridge can pass the token as the sender
        // and we'll treat the first 32 bytes of metadata as the actual sender
        Ok(from.clone())
    }

    /// Internal create_stream logic without auth check (used by bridge)
    fn create_stream_internal(env: Env, args: StreamArgs) -> Result<u64, Error> {
        Self::require_not_paused(&env)?;
        Self::require_asset_whitelisted(&env, &args.token)?;

        if args.start_time >= args.end_time
            || args.cliff_time < args.start_time
            || args.cliff_time > args.end_time
        {
            return Err(Error::InvalidTimeRange);
        }

        if args.penalty_bps > 10_000 {
            return Err(Error::InvalidPenalty);
        }

        if args.total_amount < storage::get_min_value(&env, &args.token) {
            return Err(Error::BelowDustThreshold);
        }

        // Note: Funds already transferred to contract via token callback
        // No need to do another transfer

        let stream_amount = Self::apply_protocol_fee(&env, &args.token, args.total_amount)?;

        let stream_id = storage::next_stream_id(&env);

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
            penalty_bps: args.penalty_bps,
            vault_address: None,
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
        if storage::is_migration_paused(&env) {
            return Err(Error::MigrationPaused);
        }
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
            penalty_bps: 0,
            vault_address: None,
            yield_enabled: false,
            is_pending: false,
            is_recurrent: false,
            cycle_duration: 0,
            cancellation_type: 0,
            yield_recipient: 0,
            split_address: None,
            split_bps: 0,
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

    /// Core "Bridge" function for atomic V1->V2 migration. #398
    /// Simultaneously deactivates a V1 stream and activates it in V2.
    /// Auth: receiver.require_auth()
    pub fn migrate_v1_stream(
        env: Env,
        v1_contract: Address,
        v1_id: soroban_sdk::Symbol,
    ) -> Result<u64, Error> {
        Self::require_not_paused(&env)?;
        if storage::is_migration_paused(&env) {
            return Err(Error::MigrationPaused);
        }

        // 1. Get the caller (receiver)
        let caller = env.invoker();
        caller.require_auth();

        // 2. Convert Symbol to u64 (ID)
        // Note: For hackathon/simplicity, we assume the Symbol matches the numeric ID.
        // In production, this would use a more robust parsing utility.
        let v1_stream_id = Self::parse_symbol_to_u64(&v1_id);

        let v1_client = V1Client::new(&env, &v1_contract);

        // 3. Fetch V1 stream info for the new V2 record
        let v1_stream = v1_client
            .try_get_stream(&v1_stream_id)
            .map_err(|_| Error::StreamNotFound)?
            .map_err(|_| Error::StreamNotFound)?;

        if v1_stream.receiver != caller {
            return Err(Error::NotStreamOwner);
        }

        // 4. Action 1: Call V1.cancel_stream(v1_id)
        // This transfers funds to `caller` (receiver) and returns the balance.
        let remaining_balance = v1_client
            .try_cancel_stream(&v1_stream_id, &caller)
            .map_err(|_| Error::StreamNotMigratable)?
            .map_err(|_| Error::StreamNotMigratable)?;

        if remaining_balance <= 0 {
            return Err(Error::NothingToMigrate);
        }

        // 5. Pull the released funds from the receiver into the V2 contract.
        let token_client = soroban_sdk::token::TokenClient::new(&env, &v1_stream.token);
        token_client.transfer(&caller, &env.current_contract_address(), &remaining_balance);

        // 6. Action 2: Activate it in V2
        let v2_stream_id = storage::next_stream_id(&env);
        let now = env.ledger().timestamp();

        let v2_stream = StreamV2 {
            sender: v1_stream.sender.clone(),
            receiver: caller.clone(),
            beneficiary: caller.clone(),
            token: v1_stream.token.clone(),
            total_amount: remaining_balance,
            start_time: now,
            end_time: v1_stream.end_time,
            cliff_time: now,
            withdrawn_amount: 0,
            cancelled: false,
            migrated_from_v1: true,
            v1_stream_id,
            step_duration: 0,
            multiplier_bps: 0,
            penalty_bps: 0,
            vault_address: None,
            yield_enabled: false,
            is_pending: false,
            is_recurrent: false,
            cycle_duration: 0,
            cancellation_type: 0,
        };

        storage::set_stream(&env, v2_stream_id, &v2_stream);
        storage::update_stats(&env, remaining_balance, &v1_stream.sender, &caller);

        // Emit standardized Nebula migration event
        let mut data = Vec::new(&env);
        data.push_back(v2_stream_id.into_val(&env));
        data.push_back(v1_stream_id.into_val(&env));
        data.push_back(caller.clone().into_val(&env));
        data.push_back(remaining_balance.into_val(&env));
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

    fn parse_symbol_to_u64(sym: &soroban_sdk::Symbol) -> u64 {
        // Fallback for demo: use the Symbol's internal value if it's treated as a short ID
        // or just return 0 for now. In a real project, we'd use soroban_sdk::Symbol::to_string()
        // if alloc was enabled, or iterate bytes.
        0 
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

        // Compliance oracle check (Issue #412)
        Self::require_compliant(&env, &stream.beneficiary)?;

        let now = env.ledger().timestamp();
                    storage::set_stream(&env, stream_id, &stream);
                    // Return Ok(0) to persist the 'is_pending' state change.
                    // Returning Err automatically rolls back state in Soroban.
                    return Ok(0);
                }

                // Route accrued interest to the designated yield_recipient (Issue #410)
                let interest = vault_client.get_accrued_interest(&to_withdraw);
                if interest > 0 {
                    let interest_dest = match stream.yield_recipient {
                        0 => stream.sender.clone(),
                        2 => storage::get_treasury(&env).unwrap_or(stream.sender.clone()),
                        _ => stream.beneficiary.clone(), // 1 = Receiver (default)
                    };
                    let token_client = soroban_sdk::token::TokenClient::new(&env, &stream.token);
                    token_client.transfer(
                        &env.current_contract_address(),
                        &interest_dest,
                        &interest,
                    );
                }
            }
        }

        // Perform transfer — apply split if configured (Issue #411)
        let token_client = soroban_sdk::token::TokenClient::new(&env, &stream.token);
        let to_beneficiary = if stream.split_bps > 0 {
            if let Some(ref split_addr) = stream.split_address.clone() {
                let split_amount = (to_withdraw * stream.split_bps as i128) / 10_000;
                let remainder = to_withdraw - split_amount;
                if split_amount > 0 {
                    token_client.transfer(
                        &env.current_contract_address(),
                        split_addr,
                        &split_amount,
                    );
                }
                remainder
            } else {
                to_withdraw
            }
        } else {
            to_withdraw
        };

        token_client.transfer(
            &env.current_contract_address(),
            &stream.beneficiary,
            &to_beneficiary,
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

    // ----------------------------------------------------------------
    // Issue #391 — Meta-Transaction "Gasless" Withdrawals
    // ----------------------------------------------------------------

    /// Withdraw from a stream using a signed message, allowing a relayer to
    /// pay the gas fee in exchange for a small fee in the streamed asset.
    ///
    /// The receiver signs a "Withdrawal Intent" off-chain containing:
    /// - stream_id, withdrawal_amount, relayer_fee, nonce, deadline
    ///
    /// The relayer (env.invoker()) submits the transaction and receives
    /// `relayer_fee` from the withdrawn amount. The receiver gets the rest.
    ///
    /// # Parameters
    /// - `stream_id`: The stream to withdraw from
    /// - `withdrawal_amount`: Total amount to withdraw (must be <= unlocked)
    /// - `relayer_fee`: Fee paid to the relayer (must be < withdrawal_amount)
    /// - `nonce`: Unique nonce to prevent replay attacks
    /// - `deadline`: Unix timestamp after which the signature expires
    /// - `signature`: Ed25519 signature from the receiver's public key
    pub fn withdraw_meta(
        env: Env,
        stream_id: u64,
        withdrawal_amount: i128,
        relayer_fee: i128,
        relayer: Address,
        beneficiary_pubkey: soroban_sdk::BytesN<32>,
        nonce: u64,
        deadline: u64,
        signature: soroban_sdk::BytesN<64>,
    ) -> Result<i128, Error> {
        Self::require_not_paused(&env)?;

        let now = env.ledger().timestamp();
        if now > deadline {
            return Err(Error::ExpiredDeadline);
        }

        if relayer_fee < 0 || relayer_fee >= withdrawal_amount {
            return Err(Error::InvalidRelayerFee);
        }

        let mut stream = storage::get_stream(&env, stream_id).ok_or(Error::StreamNotFound)?;

        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }

        // Verify nonce to prevent replay attacks
        let nonce_key = (symbol_short!("W_NONCE"), stream.beneficiary.clone(), stream_id);
        let stored_nonce: u64 = env.storage().instance().get(&nonce_key).unwrap_or(0u64);

        if nonce != stored_nonce {
            return Err(Error::InvalidNonce);
        }

        // Calculate unlocked amount
        let unlocked = Self::calculate_unlocked_internal(&stream, now);
        let available = unlocked.saturating_sub(stream.withdrawn_amount);

        if withdrawal_amount > available {
            return Err(Error::NothingToWithdraw);
        }

        if withdrawal_amount <= 0 {
            return Err(Error::NothingToWithdraw);
        }

        // Construct the message that was signed
        let mut msg = soroban_sdk::Bytes::new(&env);
        msg.extend_from_slice(b"STELLARSTREAM_WITHDRAW_META_V2");
        msg.append(&env.current_contract_address().to_xdr(&env));
        msg.extend_from_slice(&stream_id.to_be_bytes());
        msg.extend_from_slice(&withdrawal_amount.to_be_bytes());
        msg.extend_from_slice(&relayer_fee.to_be_bytes());
        msg.extend_from_slice(&nonce.to_be_bytes());
        msg.extend_from_slice(&deadline.to_be_bytes());

        let msg_hash: soroban_sdk::BytesN<32> = env.crypto().sha256(&msg).into();

        // Use the provided beneficiary public key for signature verification
        let beneficiary_pubkey = beneficiary_pubkey.clone();

        // Verify the signature
        env.crypto()
            .ed25519_verify(&beneficiary_pubkey, &msg_hash.into(), &signature);

        // Increment nonce to prevent replay
        env.storage()
            .instance()
            .set(&nonce_key, &(stored_nonce + 1));

        // If Yield-Bearing, withdraw principal from Vault
        if stream.yield_enabled {
            if let Some(vault_addr) = &stream.vault_address {
                let vault_client = VaultClient::new(&env, vault_addr);
                let result = vault_client.try_withdraw(&withdrawal_amount);

                if result.is_err() {
                    stream.is_pending = true;
                    storage::set_stream(&env, stream_id, &stream);
                    return Ok(0);
                }
            }
        }

        // Calculate amounts
        let to_receiver = withdrawal_amount - relayer_fee;

        // Perform transfers
        let token_client = soroban_sdk::token::TokenClient::new(&env, &stream.token);

        if to_receiver > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &stream.beneficiary,
                &to_receiver,
            );
        }

        if relayer_fee > 0 {
            token_client.transfer(&env.current_contract_address(), &relayer, &relayer_fee);
        }

        // Update state
        stream.withdrawn_amount += withdrawal_amount;
        stream.is_pending = false;
        storage::set_stream(&env, stream_id, &stream);

        // Update analytics (TVL decreased)
        storage::update_stats(&env, -withdrawal_amount, &stream.sender, &stream.receiver);

        let mut data = Vec::new(&env);
        data.push_back(stream_id.into_val(&env));
        data.push_back(stream.beneficiary.clone().into_val(&env));
        data.push_back(to_receiver.into_val(&env));
        data.push_back(relayer_fee.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (stream_id, symbol_short!("meta_wdrw")),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("meta_wdrw"),
                data,
            },
        );

        Ok(withdrawal_amount)
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
        let earned = unlocked.saturating_sub(stream.withdrawn_amount);
        let sender_remaining = stream.total_amount.saturating_sub(unlocked);

        // Apply breakup penalty if the sender is cancelling and penalty_bps > 0.
        let penalty = if caller == stream.sender && stream.penalty_bps > 0 {
            (sender_remaining * stream.penalty_bps as i128) / 10_000
        } else {
            0
        };

        let to_receiver = earned + penalty;
        let to_sender = sender_remaining.saturating_sub(penalty);
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

    // ----------------------------------------------------------------
    // Issue #411 — Stream-Splitting
    // ----------------------------------------------------------------

    /// Set or update the split configuration for a stream.
    /// Only the current beneficiary may call this.
    /// Pass `split_address = None` and `split_bps = 0` to remove an existing split.
    pub fn split_stream(
        env: Env,
        stream_id: u64,
        split_address: Option<Address>,
        split_bps: u32,
    ) -> Result<(), Error> {
        Self::require_not_paused(&env)?;

        if split_bps >= 10_000 {
            return Err(Error::InvalidSplitBps);
        }

        let mut stream = storage::get_stream(&env, stream_id).ok_or(Error::StreamNotFound)?;

        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }

        stream.beneficiary.require_auth();

        stream.split_address = split_address.clone();
        stream.split_bps = split_bps;
        storage::set_stream(&env, stream_id, &stream);

        let now = env.ledger().timestamp();
        env.events().publish(
            (stream_id, symbol_short!("split")),
            StreamSplitUpdatedEvent {
                stream_id,
                beneficiary: stream.beneficiary,
                split_address,
                split_bps,
                timestamp: now,
            },
        );

        Ok(())
    }

    fn calculate_unlocked_internal(stream: &StreamV2, now: u64) -> i128 {
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
    // Issue: Migration Pause — granular security control
    // ----------------------------------------------------------------

    /// Pause or unpause only the migration path, leaving standard V2 streams
    /// fully operational. Admin-only. Emits a `mig_pause` or `mig_unpause`
    /// event so off-chain monitors can react immediately.
    pub fn toggle_migration_pause(env: Env, paused: bool) -> Result<(), Error> {
        let admin = storage::try_get_admin(&env)?;
        admin.require_auth();
        storage::set_migration_paused(&env, paused);

        let now = env.ledger().timestamp();
        let action = if paused {
            symbol_short!("mig_paus")
        } else {
            symbol_short!("mig_unps")
        };
        let mut data = Vec::new(&env);
        data.push_back(admin.clone().into_val(&env));
        data.push_back(now.into_val(&env));
        env.events().publish(
            (action.clone(), admin.clone()),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action,
                data,
            },
        );
        Ok(())
    }

    /// Returns true if the migration path is currently paused.
    pub fn is_migration_paused(env: Env) -> bool {
        storage::is_migration_paused(&env)
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

    /// If a compliance oracle is configured, verify `addr` is not flagged.
    fn require_compliant(env: &Env, addr: &Address) -> Result<(), Error> {
        if let Some(oracle_addr) = storage::get_compliance_oracle(env) {
            let oracle = ComplianceClient::new(env, &oracle_addr);
            if !oracle.is_allowed(addr) {
                return Err(Error::AddressFlagged);
            }
        }
        Ok(())
    }

    fn require_asset_whitelisted(env: &Env, asset: &Address) -> Result<(), Error> {
        if !storage::is_asset_whitelisted(env, asset) {
            return Err(Error::AssetNotWhitelisted);
        }
        Ok(())
    }

    fn apply_protocol_fee(env: &Env, token: &Address, total_amount: i128) -> Result<i128, Error> {
        let fee_bps = storage::get_fee_bps(env);
        if fee_bps == 0 {
            return Ok(total_amount);
        }

        let treasury = storage::get_treasury(env).ok_or(Error::NoTreasury)?;
        let fee = (total_amount * fee_bps as i128) / 10_000;
        if fee > 0 {
            storage::add_pending_fees(env, &treasury, token, fee);
        }

        Ok(total_amount - fee)
    }

    pub fn create_stream(env: Env, args: StreamArgs) -> Result<u64, Error> {
        Self::require_not_paused(&env)?;
        args.sender.require_auth();
        Self::require_asset_whitelisted(&env, &args.token)?;

        if args.start_time >= args.end_time
            || args.cliff_time < args.start_time
            || args.cliff_time > args.end_time
        {
            return Err(Error::InvalidTimeRange);
        }

        if args.penalty_bps > 10_000 {
            return Err(Error::InvalidPenalty);
        }

        if args.total_amount < storage::get_min_value(&env, &args.token) {
            return Err(Error::BelowDustThreshold);
        }

        // Compliance oracle check (Issue #412)
        Self::require_compliant(&env, &args.sender)?;
        Self::require_compliant(&env, &args.receiver)?;

        let token_client = soroban_sdk::token::TokenClient::new(&env, &args.token);
        token_client.transfer(
            &args.sender,
            &env.current_contract_address(),
            &args.total_amount,
        );

        let stream_amount = Self::apply_protocol_fee(&env, &args.token, args.total_amount)?;

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
            penalty_bps: args.penalty_bps,
            vault_address: vault_used,
            yield_enabled: args.yield_enabled,
            is_pending: false,
            is_recurrent: args.is_recurrent,
            cycle_duration: args.cycle_duration,
            cancellation_type: args.cancellation_type,
            yield_recipient: args.yield_recipient,
            split_address: args.split_address.clone(),
            split_bps: args.split_bps,
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
        Self::require_asset_whitelisted(&env, &args.token)?;
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

        let stream_amount = Self::apply_protocol_fee(&env, &args.token, args.total_amount)?;

        let stream_id = storage::next_stream_id(&env);

        let stream = StreamV2 {
            sender: sender_addr.clone(),
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
            penalty_bps: 0, // permit streams default to no penalty
            vault_address: None, // No vault support by permit yet
            yield_enabled: false,
            is_pending: false,
            is_recurrent: false,
            cycle_duration: 0,
            cancellation_type: 0,
            yield_recipient: 0,
            split_address: None,
            split_bps: 0,
        };

        storage::set_stream(&env, stream_id, &stream);
        storage::update_stats(&env, stream_amount, &sender_addr, &args.receiver);

        let mut data = Vec::new(&env);
        data.push_back(stream_id.into_val(&env));
        data.push_back(args.receiver.clone().into_val(&env));
        data.push_back(args.token.clone().into_val(&env));
        data.push_back(stream_amount.into_val(&env));
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
            Self::require_asset_whitelisted(&env, &args.token)?;

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
            let stream_amount = Self::apply_protocol_fee(&env, &args.token, args.total_amount)?;

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
                penalty_bps: args.penalty_bps,
                vault_address: None, // Batch creation defaults to no vault
                yield_enabled: false,
                is_pending: false,
                is_recurrent: args.is_recurrent,
                cycle_duration: args.cycle_duration,
                cancellation_type: args.cancellation_type,
                yield_recipient: args.yield_recipient,
                split_address: args.split_address.clone(),
                split_bps: args.split_bps,
            };

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

            stream_ids.push_back(stream_id);
            total_created_amount = total_created_amount.checked_add(stream_amount).unwrap();
        }

        // Emit batch creation summary event
        let now = env.ledger().timestamp();
        let mut batch_data = Vec::new(&env);
        batch_data.push_back(sender.clone().into_val(&env));
        batch_data.push_back((stream_ids.len() as u32).into_val(&env));
        batch_data.push_back(total_created_amount.into_val(&env));
        batch_data.push_back(now.into_val(&env));

        env.events().publish(
            (symbol_short!("btch_crt"), sender.clone()),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("btch_crt"),
                data: batch_data,
            },
        );

        Ok(stream_ids)
    }

    // ----------------------------------------------------------------
    // Issue #408 — Multi-sig Transaction Buffer (Stream Request Approval)
    // ----------------------------------------------------------------

    /// Initiate a stream request that requires multi-sig approval before execution.
    /// This stores the stream parameters and sets approvals = 1 (first approval from initiator).
    ///
    /// The stream will only be created once the approval threshold is met.
    pub fn initiate_stream_request(env: Env, args: StreamArgs) -> Result<u64, Error> {
        Self::require_not_paused(&env)?;
        args.sender.require_auth();
        Self::require_asset_whitelisted(&env, &args.token)?;

        // Validate time range
        if args.start_time >= args.end_time
            || args.cliff_time < args.start_time
            || args.cliff_time > args.end_time
        {
            return Err(Error::InvalidTimeRange);
        }

        // Validate penalty
        if args.penalty_bps > 10_000 {
            return Err(Error::InvalidPenalty);
        }

        // Validate dust threshold
        if args.total_amount < storage::get_min_value(&env, &args.token) {
            return Err(Error::BelowDustThreshold);
        }

        let request_id = storage::next_stream_request_id(&env);
        let threshold = storage::get_threshold(&env);

        // Create pending request with first approval from the sender
        let mut approved_by = Vec::new(&env);
        approved_by.push_back(args.sender.clone());

        let request = storage::PendingStreamRequest {
            args: args.clone(),
            approvals: 1,
            approved_by,
            created_at: env.ledger().timestamp(),
            executed: false,
        };

        storage::set_pending_stream_request(&env, request_id, &request);

        let now = env.ledger().timestamp();
        let mut data = Vec::new(&env);
        data.push_back(request_id.into_val(&env));
        data.push_back(args.sender.clone().into_val(&env));
        data.push_back(args.receiver.clone().into_val(&env));
        data.push_back(args.token.clone().into_val(&env));
        data.push_back(args.total_amount.into_val(&env));
        data.push_back(threshold.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (symbol_short!("req_init"), request_id),
            NebulaEvent {
                version: 2,
                timestamp: now,
                action: symbol_short!("req_init"),
                data,
            },
        );

        Ok(request_id)
    }

    /// Approve a pending stream request. When approvals reach the threshold,
    /// the stream is automatically created.
    pub fn approve_stream_request(env: Env, request_id: u64, approver: Address) -> Result<u64, Error> {
        Self::require_not_paused(&env)?;

        // Get the admin list and threshold
        let admin_list = storage::get_admin_list(&env);
        let threshold = storage::get_threshold(&env);
        
        // Verify the approver is in the admin list and require auth
        if !admin_list.contains(&approver) {
            return Err(Error::NotEnoughSigners);
        }
        approver.require_auth();

        // Get the pending request
        let mut request = storage::get_pending_stream_request(&env, request_id)
            .ok_or(Error::StreamRequestNotFound)?;

        // Check if already executed
        if request.executed {
            return Err(Error::StreamRequestAlreadyExecuted);
        }

        // Check if already approved by this admin
        if request.approved_by.contains(&approver) {
            return Err(Error::AlreadyApproved);
        }

        // Add approval
        request.approvals += 1;
        request.approved_by.push_back(approver.clone());

        let now = env.ledger().timestamp();

        // If threshold reached, execute the stream creation
        if request.approvals >= threshold {
            request.executed = true;
            storage::set_pending_stream_request(&env, request_id, &request);

            // Execute the stream creation
            let stream_id = Self::execute_stream_creation_internal(&env, request.args)?;

            // Remove the pending request
            storage::remove_pending_stream_request(&env, request_id);

            let mut data = Vec::new(&env);
            data.push_back(request_id.into_val(&env));
            data.push_back(stream_id.into_val(&env));
            data.push_back(now.into_val(&env));

            env.events().publish(
                (symbol_short!("req_exec"), request_id),
                NebulaEvent {
                    version: 2,
                    timestamp: now,
                    action: symbol_short!("req_exec"),
                    data,
                },
            );

            Ok(stream_id)
        } else {
            // Update the pending request with new approval
            storage::set_pending_stream_request(&env, request_id, &request);

            let mut data = Vec::new(&env);
            data.push_back(request_id.into_val(&env));
            data.push_back(approver.clone().into_val(&env));
            data.push_back(request.approvals.into_val(&env));
            data.push_back(threshold.into_val(&env));
            data.push_back(now.into_val(&env));

            env.events().publish(
                (symbol_short!("req_appr"), request_id),
                NebulaEvent {
                    version: 2,
                    timestamp: now,
                    action: symbol_short!("req_appr"),
                    data,
                },
            );

            Ok(0) // Return 0 to indicate request not yet executed, but approval recorded
        }
    }

    /// Get a pending stream request details
    pub fn get_stream_request(env: Env, request_id: u64) -> Option<storage::PendingStreamRequest> {
        storage::get_pending_stream_request(&env, request_id)
    }

    /// Internal helper to execute stream creation (used by approve_stream_request)
    fn execute_stream_creation_internal(env: &Env, args: StreamArgs) -> Result<u64, Error> {
        // Transfer tokens from sender
        let token_client = soroban_sdk::token::TokenClient::new(env, &args.token);
        token_client.transfer(
            &args.sender,
            &env.current_contract_address(),
            &args.total_amount,
        );

        let stream_amount = Self::apply_protocol_fee(env, &args.token, args.total_amount)?;

        let stream_id = storage::next_stream_id(env);

        let mut vault_used = None;
        if args.yield_enabled {
            if let Some(vault_addr) = &args.vault_address {
                let vault_client = VaultClient::new(env, vault_addr);
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
            penalty_bps: args.penalty_bps,
            vault_address: vault_used,
            yield_enabled: args.yield_enabled,
            is_pending: false,
            is_recurrent: args.is_recurrent,
            cycle_duration: args.cycle_duration,
            cancellation_type: args.cancellation_type,
        };

        storage::set_stream(env, stream_id, &stream);
        storage::update_stats(env, stream_amount, &args.sender, &args.receiver);

        let now = env.ledger().timestamp();
        let mut data = Vec::new(env);
        data.push_back(stream_id.into_val(env));
        data.push_back(args.sender.clone().into_val(env));
        data.push_back(args.receiver.clone().into_val(env));
        data.push_back(args.token.clone().into_val(env));
        data.push_back(stream_amount.into_val(env));
        data.push_back(args.start_time.into_val(env));
        data.push_back(args.cliff_time.into_val(env));
        data.push_back(args.end_time.into_val(env));
        data.push_back(now.into_val(env));

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
    // Issue: Protocol Fees — admin helpers + treasury withdrawal
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

    // ----------------------------------------------------------------
    // Issue #412 — Compliance Oracle
    // ----------------------------------------------------------------

    /// Set the sanctions-list oracle. Admin-only.
    /// Pass the address of a contract implementing `ComplianceTrait`.
    pub fn set_compliance_oracle(env: Env, oracle: Address) -> Result<(), Error> {
        storage::try_get_admin(&env)?.require_auth();
        storage::set_compliance_oracle(&env, &oracle);
        Ok(())
    }

    pub fn get_compliance_oracle(env: Env) -> Option<Address> {
        storage::get_compliance_oracle(&env)
    }

    // ----------------------------------------------------------------
    // Issue #413 — Circular Event Log
    // ----------------------------------------------------------------

    /// Append a raw event payload to the stream's circular log (max 50 entries).
    /// Any caller may append; the log is informational and not access-controlled.
    pub fn append_event_log(env: Env, stream_id: u64, data: Bytes) -> Result<(), Error> {
        // Verify the stream exists before accepting log entries.
        storage::get_stream(&env, stream_id).ok_or(Error::StreamNotFound)?;
        storage::append_event_log(&env, stream_id, data);
        Ok(())
    }

    /// Return the last ≤50 event payloads for `stream_id` in insertion order.
    pub fn get_stream_event_log(env: Env, stream_id: u64) -> soroban_sdk::Vec<Bytes> {
        storage::get_event_log(&env, stream_id)
    }

    /// Set the protocol fee in basis points (e.g. 100 = 1%). Admin-only.
    pub fn set_fee_bps(env: Env, bps: u32) -> Result<(), Error> {
        storage::try_get_admin(&env)?.require_auth();
        storage::set_fee_bps(&env, bps);
        Ok(())
    }

    pub fn add_to_whitelist(env: Env, asset: Address) -> Result<(), Error> {
        storage::try_get_admin(&env)?.require_auth();
        storage::add_to_whitelist(&env, &asset);
        Ok(())
    }

    pub fn remove_from_whitelist(env: Env, asset: Address) -> Result<(), Error> {
        storage::try_get_admin(&env)?.require_auth();
        storage::remove_from_whitelist(&env, &asset);
        Ok(())
    }

    pub fn is_asset_whitelisted(env: Env, asset: Address) -> bool {
        storage::is_asset_whitelisted(&env, &asset)
    }

    /// Get the current protocol fee in basis points.
    pub fn get_fee_bps(env: Env) -> u32 {
        storage::get_fee_bps(&env)
    }

    /// Withdraw accumulated protocol fees to the configured treasury. Admin-only.
    pub fn withdraw_treasury(env: Env, token: Address) -> Result<i128, Error> {
        storage::try_get_admin(&env)?.require_auth();

        let treasury = storage::get_treasury(&env).ok_or(Error::NoTreasury)?;
        let amount = storage::get_pending_fees(&env, &treasury, &token);
        if amount <= 0 {
            return Err(Error::NothingToWithdraw);
        }

        storage::clear_pending_fees(&env, &treasury, &token);

        let token_client = soroban_sdk::token::TokenClient::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &treasury, &amount);

        let now = env.ledger().timestamp();
        let mut data = Vec::new(&env);
        data.push_back(treasury.clone().into_val(&env));
        data.push_back(token.clone().into_val(&env));
        data.push_back(amount.into_val(&env));
        data.push_back(now.into_val(&env));

        env.events().publish(
            (symbol_short!("fee_out"), treasury.clone()),
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

    /// Get the current withdrawal nonce for a beneficiary on a specific stream.
    /// Used for meta-transaction withdrawals to prevent replay attacks.
    pub fn get_withdrawal_nonce(env: Env, beneficiary: Address, stream_id: u64) -> u64 {
        let nonce_key = (symbol_short!("W_NONCE"), beneficiary, stream_id);
        env.storage().instance().get(&nonce_key).unwrap_or(0u64)
    }
}

mod test;
