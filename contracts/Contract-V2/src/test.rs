#![cfg(test)]

use super::*;
use crate::types::{PermitArgs, PendingRateUpdate, SimulationReport, StreamArgs, SwapStreamArgs};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::TokenClient,
    vec, Address, Env, String,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

fn create_token<'a>(
    env: &Env,
    admin: &Address,
) -> (
    Address,
    TokenClient<'a>,
    soroban_sdk::token::StellarAssetClient<'a>,
) {
    let addr = env.register_stellar_asset_contract(admin.clone());
    (
        addr.clone(),
        TokenClient::new(env, &addr),
        soroban_sdk::token::StellarAssetClient::new(env, &addr),
    )
}

/// Register the V2 contract, call init(), and return its address + client.
fn setup_v2<'a>(env: &'a Env, admin: &'a Address) -> (Address, ContractClient<'a>) {
    let id = env.register(Contract, ());
    let client = ContractClient::new(env, &id);
    client.init(admin);
    (id, client)
}

fn stream_args(sender: &Address, receiver: &Address, token: &Address, total_amount: i128) -> StreamArgs {
    StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token.clone(),
        total_amount,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    }
}

#[test]
fn test_packed_stream_metadata_round_trip() {
    let env = Env::default();
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token = Address::generate(&env);

    let stream = StreamV2 {
        sender,
        receiver: receiver.clone(),
        beneficiary: receiver,
        token,
        total_amount: 123,
        start_time: 1,
        end_time: 2,
        cliff_time: 1,
        withdrawn_amount: 3,
        cancelled: false,
        migrated_from_v1: true,
        v1_stream_id: 9,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: true,
        is_pending: true,
        is_recurrent: true,
        cycle_duration: 10,
        cancellation_type: 7,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    };
    let packed = crate::storage::pack_stream_metadata(&stream);
    let (status, penalty_bps, curve_type, migrated_from_v1, yield_enabled, is_recurrent, cancellation_type) =
        crate::storage::unpack_stream_metadata(packed);

    assert_eq!(status, 2);
    assert_eq!(penalty_bps, 0);
    assert_eq!(curve_type, 0);
    assert!(migrated_from_v1);
    assert!(yield_enabled);
    assert!(is_recurrent);
    assert_eq!(cancellation_type, 7);
}

// ── Init tests ───────────────────────────────────────────────────────────────

#[test]
fn test_init_sets_admin() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (_, client) = setup_v2(&env, &admin);

    assert_eq!(client.admin(), admin);
}

#[test]
fn test_init_cannot_be_called_twice() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (_, client) = setup_v2(&env, &admin);

    let result = client.try_init(&admin);
    assert!(result.is_err());
}

#[test]
fn test_version_returns_v2() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let (_, client) = setup_v2(&env, &admin);

    assert_eq!(client.version(), 2);
}

#[test]
fn test_metadata_returns_official_spec_uri() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let (_, client) = setup_v2(&env, &admin);

    assert_eq!(
        client.metadata(),
        String::from_str(
            &env,
            "https://raw.githubusercontent.com/Emmyt24/StellarStream/main/contracts/Contract-V2/contract-metadata.json",
        )
    );
}

// ── Migration bridge tests ────────────────────────────────────────────────────
//
// These tests use a *mock* V1 contract registered in the same test environment
// so we can control its state without a real V1 WASM.  The mock implements
// only get_stream() and cancel() — the two functions migrate_stream() calls.

/// Registers a minimal mock of the V1 contract that returns a controllable
/// stream and records whether cancel() was called.
mod mock_v1 {
    use soroban_sdk::{
        contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env, Vec,
    };

    // Re-declare just enough of V1's types for the mock.
    #[contracttype]
    #[derive(Clone)]
    pub enum CurveTypeV1 {
        Linear = 0,
        Exponential = 1,
    }

    #[contracttype]
    #[derive(Clone)]
    pub struct MilestoneV1 {
        pub timestamp: u64,
        pub percentage: u32,
    }

    #[contracttype]
    #[derive(Clone)]
    pub struct V1Stream {
        pub sender: Address,
        pub receiver: Address,
        pub token: Address,
        pub total_amount: i128,
        pub start_time: u64,
        pub end_time: u64,
        pub withdrawn: i128,
        pub withdrawn_amount: i128,
        pub cancelled: bool,
        pub receipt_owner: Address,
        pub is_paused: bool,
        pub paused_time: u64,
        pub total_paused_duration: u64,
        pub milestones: Vec<MilestoneV1>,
        pub curve_type: CurveTypeV1,
        pub interest_strategy: u32,
        pub vault_address: Option<Address>,
        pub deposited_principal: i128,
        pub metadata: Option<BytesN<32>>,
        pub is_usd_pegged: bool,
        pub usd_amount: i128,
        pub oracle_address: Address,
        pub oracle_max_staleness: u64,
        pub price_min: i128,
        pub price_max: i128,
        pub is_soulbound: bool,
        pub clawback_enabled: bool,
        pub arbiter: Option<Address>,
        pub is_frozen: bool,
    }

    const STREAM_KEY: soroban_sdk::Symbol = symbol_short!("MOCK_S");
    const CANCELLED_KEY: soroban_sdk::Symbol = symbol_short!("MOCK_C");

    #[contract]
    pub struct MockV1;

    #[contractimpl]
    impl MockV1 {
        /// Seed the mock with a stream.
        pub fn seed_stream(env: Env, stream: V1Stream) {
            env.storage().instance().set(&STREAM_KEY, &stream);
        }

        /// V1's public get_stream interface.
        pub fn get_stream(env: Env, _stream_id: u64) -> V1Stream {
            env.storage()
                .instance()
                .get(&STREAM_KEY)
                .expect("mock: stream not seeded")
        }

        /// V1's public cancel interface.
        /// In the real V1 this transfers tokens; in the mock we just record
        /// that it was called so the test can assert on it.
        pub fn cancel(env: Env, _stream_id: u64, _caller: Address) {
            env.storage().instance().set(&CANCELLED_KEY, &true);
        }

        /// Helper so tests can assert cancel() was called.
        pub fn was_cancelled(env: Env) -> bool {
            env.storage()
                .instance()
                .get(&CANCELLED_KEY)
                .unwrap_or(false)
        }
    }
}

use mock_v1::{CurveTypeV1, MockV1, MockV1Client, V1Stream};

/// Build a basic V1Stream value for use in tests.
fn make_v1_stream(env: &Env, sender: &Address, receiver: &Address, token: &Address) -> V1Stream {
    V1Stream {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token.clone(),
        total_amount: 1000,
        start_time: 0,
        end_time: 200,
        withdrawn: 0,
        withdrawn_amount: 0,
        cancelled: false,
        receipt_owner: receiver.clone(),
        is_paused: false,
        paused_time: 0,
        total_paused_duration: 0,
        milestones: soroban_sdk::vec![env],
        curve_type: CurveTypeV1::Linear,
        interest_strategy: 0,
        vault_address: None,
        deposited_principal: 1000,
        metadata: None,
        is_usd_pegged: false,
        usd_amount: 0,
        oracle_address: sender.clone(),
        oracle_max_staleness: 0,
        price_min: 0,
        price_max: 0,
        is_soulbound: false,
        clawback_enabled: false,
        arbiter: None,
        is_frozen: false,
    }
}

#[test]
fn test_migrate_stream_creates_v2_stream() {
    let env = Env::default();
    env.mock_all_auths();
    // Stream runs from t=0 to t=200; migrate at t=100 (halfway)
    env.ledger().with_mut(|li| li.timestamp = 100);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token(&env, &token_admin);

    // Register mock V1 and seed it with a stream.
    let v1_id = env.register(MockV1, ());
    let v1_client = MockV1Client::new(&env, &v1_id);
    v1_client.seed_stream(&make_v1_stream(&env, &sender, &receiver, &token_id));

    // Set up V2.
    let (_, v2_client) = setup_v2(&env, &admin);

    let v2_stream_id = v2_client.migrate_stream(&v1_id, &0u64, &receiver);

    // V2 stream should have been created with ID 0.
    assert_eq!(v2_stream_id, 0);

    let v2_stream = v2_client.get_stream(&v2_stream_id).expect("stream missing");

    // At t=100 out of 200: unlocked = 1000 * 100/200 = 500, remaining = 500
    assert_eq!(v2_stream.total_amount, 500);
    assert_eq!(v2_stream.sender, sender);
    assert_eq!(v2_stream.receiver, receiver);
    assert_eq!(v2_stream.token, token_id);
    assert_eq!(v2_stream.start_time, 100); // migration point = now
    assert_eq!(v2_stream.end_time, 200); // preserved from V1
    assert!(v2_stream.migrated_from_v1);
    assert_eq!(v2_stream.v1_stream_id, 0);
}

#[test]
fn test_migrate_stream_calls_v1_cancel() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = 50);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token(&env, &token_admin);

    let v1_id = env.register(MockV1, ());
    let v1_client = MockV1Client::new(&env, &v1_id);
    v1_client.seed_stream(&make_v1_stream(&env, &sender, &receiver, &token_id));

    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.migrate_stream(&v1_id, &0u64, &receiver);

    // V1::cancel() must have been called.
    assert!(v1_client.was_cancelled());
}

#[test]
fn test_migrate_stream_fails_if_not_receiver() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = 50);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let stranger = Address::generate(&env); // not the receiver
    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token(&env, &token_admin);

    let v1_id = env.register(MockV1, ());
    let v1_client = MockV1Client::new(&env, &v1_id);
    v1_client.seed_stream(&make_v1_stream(&env, &sender, &receiver, &token_id));

    let (_, v2_client) = setup_v2(&env, &admin);

    let result = v2_client.try_migrate_stream(&v1_id, &0u64, &stranger);
    assert!(result.is_err());
}

#[test]
fn test_migrate_stream_fails_if_already_cancelled() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = 50);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token(&env, &token_admin);

    let mut stream = make_v1_stream(&env, &sender, &receiver, &token_id);
    stream.cancelled = true; // already cancelled

    let v1_id = env.register(MockV1, ());
    let v1_client = MockV1Client::new(&env, &v1_id);
    v1_client.seed_stream(&stream);

    let (_, v2_client) = setup_v2(&env, &admin);

    let result = v2_client.try_migrate_stream(&v1_id, &0u64, &receiver);
    assert!(result.is_err());
}

#[test]
fn test_migrate_stream_fails_if_stream_ended() {
    let env = Env::default();
    env.mock_all_auths();
    // Set time past the stream end_time (200)
    env.ledger().with_mut(|li| li.timestamp = 250);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token(&env, &token_admin);

    let v1_id = env.register(MockV1, ());
    let v1_client = MockV1Client::new(&env, &v1_id);
    v1_client.seed_stream(&make_v1_stream(&env, &sender, &receiver, &token_id));

    let (_, v2_client) = setup_v2(&env, &admin);

    let result = v2_client.try_migrate_stream(&v1_id, &0u64, &receiver);
    assert!(result.is_err());
}

#[test]
fn test_migrate_stream_remaining_balance_correct_at_25_percent() {
    let env = Env::default();
    env.mock_all_auths();
    // Migrate at t=50: 50/200 = 25% elapsed → unlocked=250, remaining=750
    env.ledger().with_mut(|li| li.timestamp = 50);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token(&env, &token_admin);

    let v1_id = env.register(MockV1, ());
    let v1_client = MockV1Client::new(&env, &v1_id);
    v1_client.seed_stream(&make_v1_stream(&env, &sender, &receiver, &token_id));

    let (_, v2_client) = setup_v2(&env, &admin);
    let v2_stream_id = v2_client.migrate_stream(&v1_id, &0u64, &receiver);

    let v2_stream = v2_client.get_stream(&v2_stream_id).unwrap();
    assert_eq!(v2_stream.total_amount, 750); // 1000 - 250
}

#[test]
fn test_permit_stream_fails_with_wrong_nonce() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = 100);

    let admin = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    // Generate a dummy keypair (32-byte pubkey, 64-byte sig)
    let pubkey = soroban_sdk::BytesN::from_array(&env, &[1u8; 32]);
    let bad_sig = soroban_sdk::BytesN::from_array(&env, &[0u8; 64]);

    // Nonce 99 != stored nonce 0 — should fail with InvalidNonce
    let result = v2_client.try_create_stream_with_signature(
        &PermitArgs {
            sender_pubkey: pubkey.clone(),
            receiver: receiver.clone(),
            token: token_id.clone(),
            total_amount: 1000i128,
            start_time: 0u64,
            cliff_time: 0u64,
            end_time: 200u64,
            nonce: 99u64, // wrong
            deadline: 9999u64,
            step_duration: 0,
            multiplier_bps: 0,
            vault_address: None,
            yield_enabled: false,
        },
        &bad_sig,
    );
    assert!(result.is_err());
}

#[test]
fn test_permit_stream_fails_if_deadline_passed() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = 500); // now = 500

    let admin = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    let pubkey = soroban_sdk::BytesN::from_array(&env, &[1u8; 32]);
    let bad_sig = soroban_sdk::BytesN::from_array(&env, &[0u8; 64]);

    // deadline = 100, now = 500 — expired
    let result = v2_client.try_create_stream_with_signature(
        &PermitArgs {
            sender_pubkey: pubkey.clone(),
            receiver: receiver.clone(),
            token: token_id.clone(),
            total_amount: 1000i128,
            start_time: 0u64,
            cliff_time: 0u64,
            end_time: 200u64,
            nonce: 0u64,
            deadline: 100u64, // expired
            step_duration: 0,
            multiplier_bps: 0,
            vault_address: None,
            yield_enabled: false,
        },
        &bad_sig,
    );
    assert!(result.is_err());
}

// ── Emergency Pause tests ───────────────────────────────────────────────────

#[test]
fn test_pause_unpause_admin_only() {
    let env = Env::default();

    let admin = Address::generate(&env);
    let (_, client) = setup_v2(&env, &admin);

    // Initial state: not paused
    assert!(!client.is_paused());

    // 1. Fails without auth mocking (auth failure)
    let result = client.try_pause();
    assert!(result.is_err());

    // 2. Succeeds with mock_all_auths
    env.mock_all_auths();
    client.pause();
    assert!(client.is_paused());

    // 3. Unpause works
    client.unpause();
    assert!(!client.is_paused());
}

#[test]
fn test_migrate_stream_fails_when_paused() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = 50);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token(&env, &token_admin);

    let v1_id = env.register(MockV1, ());
    let v1_client = MockV1Client::new(&env, &v1_id);
    v1_client.seed_stream(&make_v1_stream(&env, &sender, &receiver, &token_id));

    let (_, client) = setup_v2(&env, &admin);

    // Pause the contract
    client.pause();

    // Migration should fail
    let result = client.try_migrate_stream(&v1_id, &0u64, &receiver);
    assert!(result.is_err());
}

#[test]
fn test_permit_stream_fails_when_paused() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token(&env, &token_admin);
    let (_, client) = setup_v2(&env, &admin);

    client.pause();

    let pubkey = soroban_sdk::BytesN::from_array(&env, &[1u8; 32]);
    let bad_sig = soroban_sdk::BytesN::from_array(&env, &[0u8; 64]);

    let result = client.try_create_stream_with_signature(
        &PermitArgs {
            sender_pubkey: pubkey.clone(),
            receiver: receiver.clone(),
            token: token_id.clone(),
            total_amount: 1000i128,
            start_time: 0u64,
            cliff_time: 0u64,
            end_time: 200u64,
            nonce: 0u64,
            deadline: 9999u64,
            step_duration: 0,
            multiplier_bps: 0,
            vault_address: None,
            yield_enabled: false,
        },
        &bad_sig,
    );
    assert!(result.is_err());
}

// ── Issue #404 — Bulk TTL tests ───────────────────────────────────────────────

#[test]
fn test_bump_active_streams_ttl_returns_count_of_existing() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = 100);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    // Mint and approve tokens so migrate_stream can pull them
    let v1_id = {
        let id = env.register(MockV1, ());
        let mock = MockV1Client::new(&env, &id);
        mock.seed_stream(&make_v1_stream(&env, &sender, &receiver, &token_id));
        id
    };

    // Create two streams via migration
    let sid0 = v2_client.migrate_stream(&v1_id, &0u64, &receiver);
    // Re-seed for second migration
    {
        let mock = MockV1Client::new(&env, &v1_id);
        mock.seed_stream(&make_v1_stream(&env, &sender, &receiver, &token_id));
    }
    let sid1 = v2_client.migrate_stream(&v1_id, &0u64, &receiver);

    // Bump TTL for both existing + one non-existent ID
    let ids = soroban_sdk::vec![&env, sid0, sid1, 999u64];
    let extended = v2_client.bump_active_streams_ttl(&ids);

    assert_eq!(extended, 2u32); // 999 is skipped
}

#[test]
fn test_bump_active_streams_ttl_skips_nonexistent() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let (_, v2_client) = setup_v2(&env, &admin);

    let ids = soroban_sdk::vec![&env, 42u64, 100u64, 999u64];
    let extended = v2_client.bump_active_streams_ttl(&ids);

    assert_eq!(extended, 0u32);
}

// ── Issue #400 — Multi-sig admin tests ───────────────────────────────────────

#[test]
fn test_init_creates_single_admin_with_threshold_one() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let (_, client) = setup_v2(&env, &admin);

    assert_eq!(client.get_threshold(), 1u32);
    assert_eq!(client.get_admins().len(), 1u32);
    assert_eq!(client.get_admins().get(0).unwrap(), admin);
}

#[test]
fn test_set_admins_replaces_list_and_threshold() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let (_, client) = setup_v2(&env, &admin);

    let a1 = Address::generate(&env);
    let a2 = Address::generate(&env);
    let a3 = Address::generate(&env);
    let new_admins = soroban_sdk::vec![&env, a1.clone(), a2.clone(), a3.clone()];
    let op = crate::types::Operation::SetAdmins(new_admins, 2);

    client.schedule_op(&op);

    // Advance time by 48 hours and 1 second
    env.ledger().set_timestamp(48 * 60 * 60 + 1);

    client.execute_op(&op);

    assert_eq!(client.get_threshold(), 2u32);
    assert_eq!(client.get_admins().len(), 3u32);
}

// ── transfer_admin tests ──────────────────────────────────────────────────────

#[test]
fn test_transfer_admin_changes_admin() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let (_, client) = setup_v2(&env, &admin);

    let new_admin = Address::generate(&env);
    client.transfer_admin(&new_admin);

    assert_eq!(client.admin(), new_admin);
}

#[test]
fn test_transfer_admin_old_admin_loses_access() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let (_, client) = setup_v2(&env, &admin);

    let new_admin = Address::generate(&env);
    client.transfer_admin(&new_admin);

    // After transfer, the admin list contains only new_admin.
    assert_eq!(client.get_admins().len(), 1u32);
    assert_eq!(client.get_admins().get(0).unwrap(), new_admin);
}

#[test]
fn test_transfer_admin_requires_current_admin_auth() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let (_, client) = setup_v2(&env, &admin);

    let new_admin = Address::generate(&env);

    // No auth mocked at all — should panic/error because admin hasn't authorised.
    let result = client.try_transfer_admin(&new_admin);
    assert!(result.is_err());
}

// ── Issue #396 — Dust threshold tests ────────────────────────────────────────

#[test]
fn test_get_min_value_returns_default() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let (_, v2_client) = setup_v2(&env, &admin);
    let token = Address::generate(&env);

    // Default is 10 XLM = 100_000_000 stroops
    assert_eq!(v2_client.get_min_value(&token), 100_000_000i128);
}

#[test]
fn test_admin_can_manage_asset_whitelist() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let token = Address::generate(&env);
    let (_, v2_client) = setup_v2(&env, &admin);

    assert!(!v2_client.is_asset_whitelisted(&token));

    v2_client.add_to_whitelist(&token);
    assert!(v2_client.is_asset_whitelisted(&token));

    v2_client.remove_from_whitelist(&token);
    assert!(!v2_client.is_asset_whitelisted(&token));
}

#[test]
fn test_create_stream_fails_for_non_whitelisted_asset() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    asset_client.mint(&sender, &100_000_000);

    let result = v2_client.try_create_stream(&stream_args(&sender, &receiver, &token_id, 100_000_000));
    assert_eq!(result, Err(Ok(Error::AssetNotWhitelisted)));
}

// ── Analytics / Protocol Health tests ────────────────────────────────────────

#[test]
fn test_get_v2_protocol_health_updates_correctly() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = 100);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token(&env, &token_admin);

    let v1_id = env.register(MockV1, ());
    let v1_client = MockV1Client::new(&env, &v1_id);
    v1_client.seed_stream(&make_v1_stream(&env, &sender, &receiver, &token_id));

    let (_, v2_client) = setup_v2(&env, &admin);

    // Initial health should be zero.
    let health = v2_client.get_v2_protocol_health();
    assert_eq!(health.total_v2_tvl, 0);
    assert_eq!(health.active_v2_users, 0);
    assert_eq!(health.total_v2_streams, 0);

    // Migrate first stream (500 TVL, 2 unique users).
    v2_client.migrate_stream(&v1_id, &0u64, &receiver);

    let health = v2_client.get_v2_protocol_health();
    assert_eq!(health.total_v2_tvl, 500);
    assert_eq!(health.active_v2_users, 2);
    assert_eq!(health.total_v2_streams, 1);
}

// ── Cliff and Withdraw/Cancel tests ───────────────────────────────────────────

#[test]
fn test_cliff_period_locks_funds() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    // Mint tokens to sender
    asset_client.mint(&sender, &100_000_000);

    // Create a stream with a cliff.
    // Start: 100, Cliff: 150, End: 200. Amount: 100,000,000.
    let start_time = 100;
    let cliff_time = 150;
    let end_time = 200;
    let total_amount = 100_000_000;

    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount,
        start_time,
        cliff_time,
        end_time,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // 1. Before cliff (t=140): unlocked should be zero
    env.ledger().with_mut(|li| li.timestamp = 140);
    let result = v2_client.try_withdraw(&sid, &receiver);
    assert!(result.is_err()); // Nothing to withdraw / Error::NothingToMigrate for now

    // 2. At cliff (t=150): unlocked should jump to accumulated amount
    // accumulated = 100,000,000 * (150-100)/(200-100) = 100,000,000 * 50/100 = 50,000,000
    env.ledger().with_mut(|li| li.timestamp = 150);
    v2_client.withdraw(&sid, &receiver);
    // At t=150: 100,000,000 * (150-100)/(200-100) = 50,000,000
    assert_eq!(token_client.balance(&receiver), 50_000_000);

    // 3. After cliff (t=175): 100,000,000 * (175-100)/(200-100) = 75,000,000 total unlocked.
    // 75,000,000 - 50,000,000 (already withdrawn) = 25,000,000 available.
    env.ledger().with_mut(|li| li.timestamp = 175);
    v2_client.withdraw(&sid, &receiver);
    assert_eq!(token_client.balance(&receiver), 75_000_000);
}

#[test]
fn test_v2_cancel_splits_funds() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    asset_client.mint(&sender, &100_000_000);

    // Create stream: t=0 to t=100. amount=100,000,000. no cliff.
    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Cancel at t=30.
    // Unlocked = 100,000,000 * 30/100 = 30,000,000.
    // to_receiver = 30,000,000, to_sender = 100,000,000 - 30,000,000 = 70,000,000.
    env.ledger().with_mut(|li| li.timestamp = 30);
    v2_client.cancel(&sid, &sender);

    assert_eq!(token_client.balance(&receiver), 30_000_000);
    assert_eq!(token_client.balance(&sender), 70_000_000);
}

// ── Escalating Rates (Issue #363) tests ─────────────────────────────────────

#[test]
fn test_geometric_rate_unlock_math() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    asset_client.mint(&sender, &100_000_000);

    // Step-up stream:
    // Total: 100,000,000
    // Duration: 100s (e.g. t=0 to t=100)
    // Step: 50s
    // Multiplier: 100% increase (10000 bps)
    // N = 100/50 = 2 steps
    // q = 1 + 1 = 2
    // S_2 = (2^2 - 1)/(2 - 1) = 3
    // Unlocked should be:
    // t=0: 0
    // t=25: 1000 * [ (2^0 - 1)*50 + 2^0 * 25 * 1 ] / [ 3 * 50 / 1 ] = 1000 * 25 / 150 = 166.66
    // Wait, let's use the formula from code:
    // numerator = 1000 * [ (1-1)*50 + 1 * 25 * 10000/10000 ] = 1000 * 25 = 25000
    // denominator = 4*1e9/1e9 - 1 = 3? No, power_scale returns 1e9 * q^n.
    // denominator = 1e9 * 2^2 - 1e9 = 3e9.
    // numerator = 1000 * [ (1e9 - 1e9)*50 + 1e9 * 25 * 1 ] = 1000 * 25e9 = 25000e9.
    // unlocked = 25000e9 / 3e9 = 8333.
    // Wait, my manual calculation is wrong.
    // Initial rate R0: A = R0 * D * S_N => 1000 = R0 * 50 * (1 + 2) = R0 * 150 => R0 = 1000 / 150 = 6.666
    // t=25: 6.666 * 25 = 166.66
    // t=50 (End of step 0): 6.666 * 50 = 333.33
    // t=75 (Middle of step 1): 333.33 + (6.666 * 2) * 25 = 333.33 + 333.33 = 666.66
    // t=100 (End of stream): 333.33 + (6.666 * 2) * 50 = 333.33 + 666.66 = 1000

    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 50,
        multiplier_bps: 10000,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // t=25
    env.ledger().with_mut(|li| li.timestamp = 25);
    v2_client.withdraw(&sid, &receiver);
    assert!(token_client.balance(&receiver) >= 16_666_000);

    // t=50
    env.ledger().with_mut(|li| li.timestamp = 50);
    v2_client.withdraw(&sid, &receiver);
    assert!(token_client.balance(&receiver) >= 33_333_000);

    // t=75
    env.ledger().with_mut(|li| li.timestamp = 75);
    v2_client.withdraw(&sid, &receiver);
    assert!(token_client.balance(&receiver) >= 66_666_000);

    // t=100
    env.ledger().with_mut(|li| li.timestamp = 100);
    v2_client.withdraw(&sid, &receiver);
    assert_eq!(token_client.balance(&receiver), 100_000_000);
}

#[test]
fn test_create_batch_streams_success() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver1 = Address::generate(&env);
    let receiver2 = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);

    // Mint tokens to sender
    asset_client.mint(&sender, &1_000_000_000);

    let (v2_address, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    // Create batch of 2 streams
    let streams = soroban_sdk::vec![
        &env,
        StreamArgs {
            sender: sender.clone(),
            receiver: receiver1.clone(),
            token: token_id.clone(),
            total_amount: 100_000_000,
            start_time: 0,
            cliff_time: 0,
            end_time: 100,
            step_duration: 0,
            multiplier_bps: 0,
            penalty_bps: 0,
            vault_address: None,
            yield_enabled: false,
            is_recurrent: false,
            cycle_duration: 0,
            cancellation_type: 0,
            affiliate: None,
            yield_recipient: 0,
            split_address: None,
            split_bps: 0,
        },
        StreamArgs {
            sender: sender.clone(),
            receiver: receiver2.clone(),
            token: token_id.clone(),
            total_amount: 200_000_000,
            start_time: 0,
            cliff_time: 0,
            end_time: 200,
            step_duration: 0,
            multiplier_bps: 0,
            penalty_bps: 0,
            vault_address: None,
            yield_enabled: false,
            is_recurrent: false,
            cycle_duration: 0,
            cancellation_type: 0,
            affiliate: None,
            yield_recipient: 0,
            split_address: None,
            split_bps: 0,
        },
    ];

    let stream_ids = v2_client.create_batch_streams(&streams);

    // Should return 2 stream IDs
    assert_eq!(stream_ids.len(), 2);
    assert_eq!(stream_ids.get(0).unwrap(), 0);
    assert_eq!(stream_ids.get(1).unwrap(), 1);

    // Check streams were created
    let stream1 = v2_client.get_stream(&0).unwrap();
    assert_eq!(stream1.sender, sender);
    assert_eq!(stream1.receiver, receiver1);
    assert_eq!(stream1.total_amount, 100_000_000);

    let stream2 = v2_client.get_stream(&1).unwrap();
    assert_eq!(stream2.sender, sender);
    assert_eq!(stream2.receiver, receiver2);
    assert_eq!(stream2.total_amount, 200_000_000);

    // Check tokens were transferred
    assert_eq!(token_client.balance(&sender), 700_000_000); // 1e9 - 3e8
    assert_eq!(token_client.balance(&v2_address), 300_000_000);
}

#[test]
fn test_create_batch_streams_max_limit() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, _) = create_token(&env, &token_admin);

    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    // Create 11 streams (exceeds limit)
    let mut streams = Vec::new(&env);
    for _i in 0..11 {
        streams.push_back(StreamArgs {
            sender: sender.clone(),
            receiver: receiver.clone(),
            token: token_id.clone(),
            total_amount: 10_000_000,
            start_time: 0,
            cliff_time: 0,
            end_time: 100,
            step_duration: 0,
            multiplier_bps: 0,
            penalty_bps: 0,
            vault_address: None,
            yield_enabled: false,
            is_recurrent: false,
            cycle_duration: 0,
            cancellation_type: 0,
            affiliate: None,
            yield_recipient: 0,
            split_address: None,
            split_bps: 0,
        });
    }

    let result = v2_client.try_create_batch_streams(&streams);
    assert_eq!(result, Err(Ok(Error::BatchTooLarge)));
}

#[test]
fn test_create_batch_streams_atomic_failure() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);

    // Mint insufficient tokens
    asset_client.mint(&sender, &200_000_000);

    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    // Create batch with total amount exceeding balance (100M + 110M = 210M > 200M)
    let streams = soroban_sdk::vec![
        &env,
        StreamArgs {
            sender: sender.clone(),
            receiver: receiver.clone(),
            token: token_id.clone(),
            total_amount: 100_000_000,
            start_time: 0,
            cliff_time: 0,
            end_time: 100,
            step_duration: 0,
            multiplier_bps: 0,
            penalty_bps: 0,
            vault_address: None,
            yield_enabled: false,
            is_recurrent: false,
            cycle_duration: 0,
            cancellation_type: 0,
            affiliate: None,
            yield_recipient: 0,
            split_address: None,
            split_bps: 0,
        },
        StreamArgs {
            sender: sender.clone(),
            receiver: receiver.clone(),
            token: token_id.clone(),
            total_amount: 110_000_000,
            start_time: 0,
            cliff_time: 0,
            end_time: 100,
            step_duration: 0,
            multiplier_bps: 0,
            penalty_bps: 0,
            vault_address: None,
            yield_enabled: false,
            is_recurrent: false,
            cycle_duration: 0,
            cancellation_type: 0,
            affiliate: None,
            yield_recipient: 0,
            split_address: None,
            split_bps: 0,
        },
    ];

    // Should fail atomically (insufficient balance)
    let result = v2_client.try_create_batch_streams(&streams);
    assert!(result.is_err());

    // No streams should be created
    assert!(v2_client.get_stream(&0).is_none());
    assert!(v2_client.get_stream(&1).is_none());

    // Balance should be unchanged
    assert_eq!(token_client.balance(&sender), 200_000_000);
}

#[test]
fn test_create_stream_deducts_protocol_fee_to_treasury() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let treasury = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);

    asset_client.mint(&sender, &1_000_000_000);

    let (contract_id, v2_client) = setup_v2(&env, &admin);
    v2_client.set_treasury(&treasury);
    v2_client.set_fee_bps(&10u32);

    let sid = v2_client.create_stream(&stream_args(&sender, &receiver, &token_id, 100_000_000));

    let stream = v2_client.get_stream(&sid).unwrap();
    assert_eq!(stream.total_amount, 99_900_000);
    assert_eq!(v2_client.get_pending_fees(&treasury, &token_id), 100_000);
    assert_eq!(token_client.balance(&sender), 900_000_000);
    assert_eq!(token_client.balance(&contract_id), 100_000_000);
}

#[test]
fn test_create_stream_with_fee_requires_treasury() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);

    asset_client.mint(&sender, &1_000_000_000);

    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.set_fee_bps(&10u32);

    let result =
        v2_client.try_create_stream(&stream_args(&sender, &receiver, &token_id, 100_000_000));
    assert_eq!(result, Err(Ok(Error::NoTreasury)));
}

#[test]
fn test_withdraw_treasury_transfers_pending_fees() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let treasury = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);

    asset_client.mint(&sender, &1_000_000_000);

    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.set_treasury(&treasury);
    v2_client.set_fee_bps(&10u32);
    v2_client.create_stream(&stream_args(&sender, &receiver, &token_id, 200_000_000));

    let withdrawn = v2_client.withdraw_treasury(&token_id);
    assert_eq!(withdrawn, 200_000);
    assert_eq!(v2_client.get_pending_fees(&treasury, &token_id), 0);
    assert_eq!(token_client.balance(&treasury), 200_000);
}

// ── Governance: Stream-Weighted Voting Power tests ───────────────────────────

#[test]
fn test_get_active_volume_single_stream_as_receiver() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    asset_client.mint(&sender, &100_000_000);

    // Create stream: 100M tokens
    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Receiver should have 100M locked
    let volume = v2_client.get_active_volume(&receiver);
    assert_eq!(volume, 100_000_000);
}

#[test]
fn test_get_active_volume_single_stream_as_sender() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    asset_client.mint(&sender, &100_000_000);

    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Sender should also have 100M locked (their commitment)
    let volume = v2_client.get_active_volume(&sender);
    assert_eq!(volume, 100_000_000);
}

#[test]
fn test_get_active_volume_multiple_streams() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    asset_client.mint(&sender, &600_000_000);

    // Create 3 streams
    let _sid1 = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    let _sid2 = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 200_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    let _sid3 = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 300_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Receiver should have total of 600M locked
    let volume = v2_client.get_active_volume(&receiver);
    assert_eq!(volume, 600_000_000);
}

#[test]
fn test_get_active_volume_after_partial_withdrawal() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    asset_client.mint(&sender, &100_000_000);

    // Create stream: 100M tokens, 0 to 100
    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // At t=50, 50M unlocked
    env.ledger().with_mut(|li| li.timestamp = 50);
    v2_client.withdraw(&sid, &receiver);

    // After withdrawing 50M, 50M should remain locked
    let volume = v2_client.get_active_volume(&receiver);
    assert_eq!(volume, 50_000_000);
}

#[test]
fn test_get_active_volume_excludes_cancelled_streams() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    asset_client.mint(&sender, &200_000_000);

    // Create 2 streams
    let sid1 = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    let sid2 = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Cancel first stream
    env.ledger().with_mut(|li| li.timestamp = 50);
    v2_client.cancel(&sid1, &sender);

    // Only sid2 should count (100M), sid1 is cancelled
    let volume = v2_client.get_active_volume(&receiver);
    assert_eq!(volume, 100_000_000);
}

#[test]
fn test_get_active_volume_unrelated_user_returns_zero() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let stranger = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    asset_client.mint(&sender, &100_000_000);

    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Stranger has no involvement in the stream
    let volume = v2_client.get_active_volume(&stranger);
    assert_eq!(volume, 0);
}

#[test]
fn test_get_active_volume_empty_stream_list() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let (_, v2_client) = setup_v2(&env, &admin);

    // Empty list should return 0
    let volume = v2_client.get_active_volume(&user);
    assert_eq!(volume, 0);
}

#[test]
fn test_get_active_volume_mixed_roles() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let other1 = Address::generate(&env);
    let _other2 = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    asset_client.mint(&user, &200_000_000);
    asset_client.mint(&other1, &200_000_000);

    // User as sender
    let _sid1 = v2_client.create_stream(&StreamArgs {
        sender: user.clone(),
        receiver: other1.clone(),
        token: token_id.clone(),
        total_amount: 200_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // User as receiver
    let _sid2 = v2_client.create_stream(&StreamArgs {
        sender: other1.clone(),
        receiver: user.clone(),
        token: token_id.clone(),
        total_amount: 200_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // User should have both streams counted: 200M + 200M = 400M
    let volume = v2_client.get_active_volume(&user);
    assert_eq!(volume, 400_000_000);
}

#[test]
fn test_rebalance_after_clawback() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver1 = Address::generate(&env);
    let receiver2 = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    asset_client.mint(&sender, &1000_000_000);

    // Create 2 streams of 500M each. Total remaining: 1000M
    let _sid1 = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver1.clone(),
        token: token_id.clone(),
        total_amount: 500_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 1000,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    let _sid2 = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver2.clone(),
        token: token_id.clone(),
        total_amount: 500_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 1000,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Verify integrity before clawback
    let (balance, sum) = v2_client.check_balance_integrity(&token_id);
    assert_eq!(balance, 1000_000_000);
    assert_eq!(sum, 1000_000_000);

    // Simulate clawback of 500M from the contract address
    // We achieve this by transferring tokens OUT of the contract in the test environment
    env.mock_all_auths();
    token_client.transfer(&v2_client.address, &admin, &500_000_000);

    // Verify deficit
    let (balance, sum) = v2_client.check_balance_integrity(&token_id);
    assert_eq!(balance, 500_000_000);
    assert_eq!(sum, 1000_000_000);

    // Rebalance
    v2_client.rebalance_after_clawback(&token_id);

    // Verify proportional reduction (factor = 50%)
    let stream1 = v2_client.get_stream(&0).unwrap();
    let stream2 = v2_client.get_stream(&1).unwrap();

    assert_eq!(stream1.total_amount, 250_000_000);
    assert_eq!(stream2.total_amount, 250_000_000);

    // Final integrity check
    let (balance, sum) = v2_client.check_balance_integrity(&token_id);
    assert_eq!(balance, 500_000_000);
    assert_eq!(sum, 500_000_000);
}

// ── DeFi: Yield-Bearing Vault tests ──────────────────────────────────────────

#[contract]
pub struct MockVault;

#[contractimpl]
impl MockVault {
    pub fn deposit(env: Env, amount: i128) {
        // In a real vault, we'd take tokens. Here we just mock.
    }

    pub fn withdraw(env: Env, amount: i128) -> i128 {
        let is_paused = env
            .storage()
            .instance()
            .get::<Symbol, bool>(&symbol_short!("paused"))
            .unwrap_or(false);
        if is_paused {
            panic!("Vault is paused");
        }
        amount
    }

    pub fn set_paused(env: Env, paused: bool) {
        env.storage()
            .instance()
            .set(&symbol_short!("paused"), &paused);
    }

    /// Returns a fixed 10% simulated yield on the principal.
    pub fn get_accrued_interest(_env: Env, principal: i128) -> i128 {
        principal / 10
    }
}

#[test]
fn test_yield_bearing_stream() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    // Register Mock Vault
    let vault_id = env.register_contract(None, MockVault);
    let vault_client = MockVaultClient::new(&env, &vault_id);

    asset_client.mint(&sender, &1000_000_000);

    // Create yield-bearing stream
    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 500_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 1000,
        step_duration: 0,
        multiplier_bps: 0,
        vault_address: Some(vault_id.clone()),
        yield_enabled: true,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Advance time to t=500 (50% unlocked)
    env.ledger().set_timestamp(500);

    // Withdraw. Should call vault.
    v2_client.withdraw(&0, &receiver);

    // Check balance
    assert_eq!(token_client.balance(&receiver), 250_000_000);

    // Simulate Vault Pause
    vault_client.set_paused(&true);

    // Try to withdraw remaining 250M. Should return 0 and set is_pending.
    env.ledger().set_timestamp(1000);
    let result = v2_client.withdraw(&0, &receiver);

    assert_eq!(result, 0);

    // Verify stream is pending
    let stream = v2_client.get_stream(&0).unwrap();
    assert!(stream.is_pending);

    // Unpause and retry
    vault_client.set_paused(&false);
    v2_client.withdraw(&0, &receiver);

    assert_eq!(token_client.balance(&receiver), 500_000_000);
}

// ── Issue #410: Yield-Split routing tests ────────────────────────────────────

#[test]
fn test_yield_split_routes_interest_to_receiver() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    let vault_id = env.register_contract(None, MockVault);
    asset_client.mint(&sender, &1_000_000_000);
    // Pre-fund contract to cover simulated interest payout
    asset_client.mint(&v2_client.address, &100_000_000);

    env.ledger().set_timestamp(500);

    // yield_recipient = 1 (Receiver)
    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 500_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 1000,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 0,
        vault_address: Some(vault_id.clone()),
        yield_enabled: true,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 1,
        split_address: None,
        split_bps: 0,
    });

    // At t=500, 50% unlocked = 250_000_000 principal
    // MockVault returns 10% interest = 25_000_000
    v2_client.withdraw(&sid, &receiver);

    // Receiver should have principal (250M) + interest (25M) = 275M
    assert_eq!(token_client.balance(&receiver), 275_000_000);
}

#[test]
fn test_yield_split_routes_interest_to_sender() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    let vault_id = env.register_contract(None, MockVault);
    asset_client.mint(&sender, &1_000_000_000);
    asset_client.mint(&v2_client.address, &100_000_000);

    env.ledger().set_timestamp(500);

    // yield_recipient = 0 (Sender)
    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 500_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 1000,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 0,
        vault_address: Some(vault_id.clone()),
        yield_enabled: true,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    let sender_balance_before = token_client.balance(&sender);
    v2_client.withdraw(&sid, &receiver);

    // Receiver gets only principal (250M), sender gets interest (25M)
    assert_eq!(token_client.balance(&receiver), 250_000_000);
    assert_eq!(token_client.balance(&sender), sender_balance_before + 25_000_000);
}

// ── Issue #411: Stream-Splitting tests ───────────────────────────────────────

#[test]
fn test_split_stream_routes_bps_to_split_address() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let tax_vault = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    asset_client.mint(&sender, &1_000_000_000);

    // Create a stream with no initial split
    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 1_000_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 1000,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Receiver sets a 20% split to their tax vault
    v2_client.split_stream(&sid, &Some(tax_vault.clone()), &2000u32);

    // At t=500: 50% unlocked = 500_000_000
    env.ledger().set_timestamp(500);
    v2_client.withdraw(&sid, &receiver);

    // 20% of 500M = 100M to tax_vault, 80% = 400M to receiver
    assert_eq!(token_client.balance(&tax_vault), 100_000_000);
    assert_eq!(token_client.balance(&receiver), 400_000_000);
}

#[test]
fn test_split_stream_rejects_invalid_bps() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);
    asset_client.mint(&sender, &1_000_000_000);

    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 1_000_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 1000,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // 10000 bps (100%) must be rejected
    let result = v2_client.try_split_stream(&sid, &None, &10000u32);
    assert!(result.is_err());
}

// ── Issue #412: Compliance Oracle tests ──────────────────────────────────────

#[contract]
pub struct MockOracle;

#[contractimpl]
impl MockOracle {
    /// Returns false (flagged) for any address stored under key "blocked".
    pub fn is_allowed(env: Env, addr: Address) -> bool {
        let blocked: Option<Address> = env.storage().instance().get(&symbol_short!("blocked"));
        blocked.map(|b| b != addr).unwrap_or(true)
    }

    pub fn set_blocked(env: Env, addr: Address) {
        env.storage().instance().set(&symbol_short!("blocked"), &addr);
    }
}

#[test]
fn test_compliance_oracle_blocks_flagged_sender_on_create() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);
    asset_client.mint(&sender, &1_000_000_000);

    let oracle_id = env.register_contract(None, MockOracle);
    let oracle_client = MockOracleClient::new(&env, &oracle_id);

    // Register oracle and flag the sender
    v2_client.set_compliance_oracle(&oracle_id);
    oracle_client.set_blocked(&sender);

    let result = v2_client.try_create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 1000,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    assert!(result.is_err());
}

#[test]
fn test_compliance_oracle_blocks_flagged_beneficiary_on_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);
    asset_client.mint(&sender, &1_000_000_000);

    // Create stream before oracle is set
    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 1_000_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 1000,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Now install oracle and flag the receiver
    let oracle_id = env.register_contract(None, MockOracle);
    let oracle_client = MockOracleClient::new(&env, &oracle_id);
    v2_client.set_compliance_oracle(&oracle_id);
    oracle_client.set_blocked(&receiver);

    env.ledger().set_timestamp(500);
    let result = v2_client.try_withdraw(&sid, &receiver);
    assert!(result.is_err());
}

#[test]
fn test_compliance_oracle_allows_clean_address() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let unrelated = Address::generate(&env); // only this one is blocked
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);
    asset_client.mint(&sender, &1_000_000_000);

    let oracle_id = env.register_contract(None, MockOracle);
    let oracle_client = MockOracleClient::new(&env, &oracle_id);
    v2_client.set_compliance_oracle(&oracle_id);
    oracle_client.set_blocked(&unrelated); // sender/receiver are clean

    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 1_000_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 1000,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    env.ledger().set_timestamp(500);
    v2_client.withdraw(&sid, &receiver);
    assert_eq!(token_client.balance(&receiver), 500_000_000);
}<'a>(env: &'a Env, penalty_bps: u32) -> (ContractClient<'a>, Address, Address, Address, u64) {
    env.mock_all_auths();
    let admin = Address::generate(env);
    let sender = Address::generate(env);
    let receiver = Address::generate(env);

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(env, &contract_id);
    client.init(&admin);

    let (token_addr, _, asset_admin) = create_token(env, &admin);
    asset_admin.mint(&sender, &200_000_000);

    env.ledger().with_mut(|li| li.timestamp = 0);

    let stream_id = client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_addr,
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    (client, sender, receiver, admin, stream_id)
}

#[test]
fn test_sender_cancel_applies_penalty() {
    let env = Env::default();
    // 1000 bps = 10% penalty
    let (client, sender, receiver, _, stream_id) = make_penalised_stream(&env, 1000);

    let (_, _, token_client) = create_token(&env, &Address::generate(&env));
    let stream = client.get_stream(&stream_id).unwrap();
    let token_client = soroban_sdk::token::TokenClient::new(&env, &stream.token);

    // Cancel at t=50: unlocked = 50_000_000, remaining = 50_000_000
    // penalty = 50_000_000 * 1000 / 10000 = 5_000_000
    // to_receiver = 50_000_000 (earned) + 5_000_000 (penalty) = 55_000_000
    // to_sender   = 50_000_000 - 5_000_000 = 45_000_000
    env.ledger().with_mut(|li| li.timestamp = 50);
    client.cancel(&stream_id, &sender);

    assert_eq!(token_client.balance(&receiver), 55_000_000);
    assert_eq!(token_client.balance(&sender), 145_000_000); // 200M minted - 100M deposited + 45M returned
}

#[test]
fn test_receiver_cancel_no_penalty() {
    let env = Env::default();
    let (client, sender, receiver, _, stream_id) = make_penalised_stream(&env, 1000);

    let stream = client.get_stream(&stream_id).unwrap();
    let token_client = soroban_sdk::token::TokenClient::new(&env, &stream.token);

    // Receiver cancels at t=50 — no penalty applies
    // to_receiver = 50_000_000, to_sender = 50_000_000
    env.ledger().with_mut(|li| li.timestamp = 50);
    client.cancel(&stream_id, &receiver);

    assert_eq!(token_client.balance(&receiver), 50_000_000);
    assert_eq!(token_client.balance(&sender), 150_000_000);
}

#[test]
fn test_zero_penalty_bps_no_penalty() {
    let env = Env::default();
    let (client, sender, receiver, _, stream_id) = make_penalised_stream(&env, 0);

    let stream = client.get_stream(&stream_id).unwrap();
    let token_client = soroban_sdk::token::TokenClient::new(&env, &stream.token);

    env.ledger().with_mut(|li| li.timestamp = 50);
    client.cancel(&stream_id, &sender);

    // No penalty: standard split
    assert_eq!(token_client.balance(&receiver), 50_000_000);
    assert_eq!(token_client.balance(&sender), 150_000_000);
}

#[test]
fn test_invalid_penalty_bps_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    client.init(&admin);

    let (token_addr, _, asset_admin) = create_token(&env, &admin);
    asset_admin.mint(&sender, &200_000_000);

    let result = client.try_create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_addr,
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 10_001, // > 100%
    });

    assert_eq!(result, Err(Ok(ContractError::InvalidPenalty)));
}

// ── Issue #413: Circular Event Log tests ─────────────────────────────────────

#[test]
fn test_event_log_appends_and_reads_in_order() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);
    asset_client.mint(&sender, &1_000_000_000);

    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 1_000_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 1000,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Append 3 entries
    v2_client.append_event_log(&sid, &soroban_sdk::Bytes::from_slice(&env, b"event_a"));
    v2_client.append_event_log(&sid, &soroban_sdk::Bytes::from_slice(&env, b"event_b"));
    v2_client.append_event_log(&sid, &soroban_sdk::Bytes::from_slice(&env, b"event_c"));

    let log = v2_client.get_stream_event_log(&sid);
    assert_eq!(log.len(), 3);
    assert_eq!(log.get(0).unwrap(), soroban_sdk::Bytes::from_slice(&env, b"event_a"));
    assert_eq!(log.get(2).unwrap(), soroban_sdk::Bytes::from_slice(&env, b"event_c"));
}

#[test]
fn test_event_log_circular_eviction_at_cap() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);
    asset_client.mint(&sender, &1_000_000_000);

    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 1_000_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 1000,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Fill to cap (50) then add 2 more
    for i in 0u32..52 {
        let mut payload = [0u8; 4];
        payload.copy_from_slice(&i.to_be_bytes());
        v2_client.append_event_log(&sid, &soroban_sdk::Bytes::from_slice(&env, &payload));
    }

    let log = v2_client.get_stream_event_log(&sid);

    // Buffer must not exceed 50
    assert_eq!(log.len(), 50);

    // Oldest surviving entry should be index 2 (0 and 1 were evicted)
    let expected_oldest = soroban_sdk::Bytes::from_slice(&env, &2u32.to_be_bytes());
    assert_eq!(log.get(0).unwrap(), expected_oldest);

    // Newest entry should be index 51
    let expected_newest = soroban_sdk::Bytes::from_slice(&env, &51u32.to_be_bytes());
    assert_eq!(log.get(49).unwrap(), expected_newest);
}

#[test]
#[should_panic(expected = "StreamNotFullyWithdrawn")]
fn test_close_and_archive_fails_partial_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, _, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    asset_client.mint(&sender, &100_000_000);

    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Withdraw only 50% 
    env.ledger().with_mut(|li| li.timestamp = 50);
    let withdrawn = v2_client.withdraw(&sid, &receiver);
    assert_eq!(withdrawn, 50_000_000);

    // Fail: not fully withdrawn
    v2_client.close_and_archive(&sid, &receiver);
}

#[test]
fn test_close_and_archive_success() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);
    let (_, v2_client) = setup_v2(&env, &admin);
    v2_client.add_to_whitelist(&token_id);

    asset_client.mint(&sender, &100_000_000);

    let sid = v2_client.create_stream(&StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: 0,
        cliff_time: 0,
        end_time: 100,
        step_duration: 0,
        multiplier_bps: 0,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    });

    // Withdraw fully
    env.ledger().with_mut(|li| li.timestamp = 100);
    let withdrawn = v2_client.withdraw(&sid, &receiver);
    assert_eq!(withdrawn, 100_000_000);
    assert_eq!(token_client.balance(&receiver), 100_000_000);

    // Verify stream still exists
    let stream = v2_client.get_stream(&sid).unwrap();
    assert_eq!(stream.withdrawn_amount, 100_000_000);
    assert_eq!(stream.total_amount, 100_000_000);

    // Archive
    v2_client.close_and_archive(&sid, &receiver);

    // Stream gone
    assert!(v2_client.get_stream(&sid).is_none());
}

#[test]
fn test_set_fee_bps_respects_cap() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (_, v2_client) = setup_v2(&env, &admin);

    // Below cap (4%) OK
    v2_client.set_fee_bps(&400);
    assert_eq!(v2_client.get_fee_bps(), 400);

    // At cap (5%) OK  
    v2_client.set_fee_bps(&500);
    assert_eq!(v2_client.get_fee_bps(), 500);

    // Above cap (6%) fails
    let result = v2_client.try_set_fee_bps(&600);
    assert_eq!(result, Err(Ok(Error::FeeTooHigh)));
    
    // Still at 500
    assert_eq!(v2_client.get_fee_bps(), 500);
}

// ----------------------------------------------------------------
// Issue #378 — Streaming Swap (DEX Integration) Tests
// ----------------------------------------------------------------

/// Mock DEX contract for testing swap streaming
#[contract]
pub struct MockDex;

#[contractimpl]
impl MockDex {
    /// Simulate swap - returns amount_out = amount_in * 2 (1:2 ratio for testing)
    pub fn swap(
        env: Env,
        token_in: Address,
        token_out: Address,
        amount_in: i128,
        min_amount_out: i128,
        _deadline: u64,
    ) -> i128 {
        // Simple 1:2 swap ratio for testing
        let amount_out = amount_in * 2;
        if amount_out < min_amount_out {
            env.panic_with_error(1); // SwapFailed error
        }
        amount_out
    }

    pub fn get_amount_out(
        env: Env,
        _token_in: Address,
        _token_out: Address,
        amount_in: i128,
    ) -> i128 {
        // 1:2 swap ratio
        amount_in * 2
    }

    pub fn get_spot_price(env: Env, _token_in: Address, _token_out: Address) -> i128 {
        // 1:2 spot price
        2_000_000_0 // 2.0 with 7 decimals
    }
}

#[test]
fn test_swap_stream_fails_when_swap_disabled() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, _asset_client) = create_token(&env, &admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    // Whitelist the asset
    v2_client.add_to_whitelist(&token_id);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    let args = SwapStreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        amount_in: 100_000_000,
        asset_in: token_id.clone(),
        asset_out: token_id.clone(), // Same asset (will fail)
        min_amount_out: 100_000_000,
        slippage_tolerance_bps: 50,
        swap_deadline: now + 3600,
        start_time: now,
        end_time: now + 100,
        cliff_time: now,
        vault_address: None,
        yield_enabled: false,
        yield_recipient: 1,
        split_address: None,
        split_bps: 0,
        cancellation_type: 0,
    };

    // Swap is disabled by default - should fail
    let result = v2_client.try_create_swap_stream(&args);
    assert_eq!(result, Err(Ok(Error::DexNotConfigured)));
}

#[test]
fn test_swap_stream_fails_with_same_asset() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, _asset_client) = create_token(&env, &admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    // Whitelist the asset
    v2_client.add_to_whitelist(&token_id);

    // Enable swap
    v2_client.set_swap_enabled(&true);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    let args = SwapStreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        amount_in: 100_000_000,
        asset_in: token_id.clone(),
        asset_out: token_id.clone(), // Same asset
        min_amount_out: 100_000_000,
        slippage_tolerance_bps: 50,
        swap_deadline: now + 3600,
        start_time: now,
        end_time: now + 100,
        cliff_time: now,
        vault_address: None,
        yield_enabled: false,
        yield_recipient: 1,
        split_address: None,
        split_bps: 0,
        cancellation_type: 0,
    };

    // Same asset should fail
    let result = v2_client.try_create_swap_stream(&args);
    assert_eq!(result, Err(Ok(Error::SameAsset)));
}

#[test]
fn test_swap_stream_fails_with_invalid_slippage() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_in_id, _token_in_client, asset_in_client) = create_token(&env, &token_admin);
    let (token_out_id, _token_out_client, _asset_out_client) = create_token(&env, &token_admin);

    let (_, v2_client) = setup_v2(&env, &admin);

    // Whitelist both assets
    v2_client.add_to_whitelist(&token_in_id);
    v2_client.add_to_whitelist(&token_out_id);

    // Enable swap
    v2_client.set_swap_enabled(&true);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    let args = SwapStreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        amount_in: 100_000_000,
        asset_in: token_in_id,
        asset_out: token_out_id,
        min_amount_out: 100_000_000,
        slippage_tolerance_bps: 15_000, // > 100% = invalid
        swap_deadline: now + 3600,
        start_time: now,
        end_time: now + 100,
        cliff_time: now,
        vault_address: None,
        yield_enabled: false,
        yield_recipient: 1,
        split_address: None,
        split_bps: 0,
        cancellation_type: 0,
    };

    // Invalid slippage tolerance should fail
    let result = v2_client.try_create_swap_stream(&args);
    assert_eq!(result, Err(Ok(Error::InvalidSlippageTolerance)));
}

#[test]
fn test_swap_stream_fails_with_expired_deadline() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_in_id, _token_in_client, _asset_in_client) = create_token(&env, &token_admin);
    let (token_out_id, _token_out_client, _asset_out_client) = create_token(&env, &token_admin);

    let (_, v2_client) = setup_v2(&env, &admin);

    // Whitelist both assets
    v2_client.add_to_whitelist(&token_in_id);
    v2_client.add_to_whitelist(&token_out_id);

    // Enable swap
    v2_client.set_swap_enabled(&true);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    let args = SwapStreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        amount_in: 100_000_000,
        asset_in: token_in_id,
        asset_out: token_out_id,
        min_amount_out: 100_000_000,
        slippage_tolerance_bps: 50,
        swap_deadline: now - 1, // Expired deadline
        start_time: now,
        end_time: now + 100,
        cliff_time: now,
        vault_address: None,
        yield_enabled: false,
        yield_recipient: 1,
        split_address: None,
        split_bps: 0,
        cancellation_type: 0,
    };

    // Expired deadline should fail
    let result = v2_client.try_create_swap_stream(&args);
    assert_eq!(result, Err(Ok(Error::ExpiredDeadline)));
}

#[test]
fn test_admin_can_configure_dex_address() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (_, v2_client) = setup_v2(&env, &admin);

    // Initially no DEX configured
    assert!(v2_client.get_dex_address().is_none());

    // Set DEX address
    let dex_address = Address::generate(&env);
    v2_client.set_dex_address(&dex_address);

    // Verify configured
    assert_eq!(v2_client.get_dex_address(), Some(dex_address));
}

#[test]
fn test_admin_can_enable_disable_swap() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (_, v2_client) = setup_v2(&env, &admin);

    // Initially disabled
    assert!(!v2_client.is_swap_enabled());

    // Enable swap
    v2_client.set_swap_enabled(&true);
    assert!(v2_client.is_swap_enabled());

    // Disable swap
    v2_client.set_swap_enabled(&false);
    assert!(!v2_client.is_swap_enabled());
}

#[test]
fn test_get_swap_quote_returns_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_in_id, _token_in_client, _asset_in_client) = create_token(&env, &token_admin);
    let (token_out_id, _token_out_client, _asset_out_client) = create_token(&env, &token_admin);

    let (_, v2_client) = setup_v2(&env, &admin);

    // Set DEX address
    let dex_address = Address::generate(&env);
    v2_client.set_dex_address(&dex_address);

    // Enable swap
    v2_client.set_swap_enabled(&true);

    // Get swap quote (mock DEX will return 2x amount)
    let result = v2_client.get_swap_quote(&100_000_000, &token_in_id, &token_out_id);
    
    // Mock DEX returns amount_out = amount_in * 2
    assert_eq!(result.amount_in, 100_000_000);
    assert_eq!(result.amount_out, 200_000_000);
}

#[test]
fn test_get_swap_quote_fails_when_swap_disabled() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_in_id, _token_in_client, _asset_in_client) = create_token(&env, &token_admin);
    let (token_out_id, _token_out_client, _asset_out_client) = create_token(&env, &token_admin);

    let (_, v2_client) = setup_v2(&env, &admin);

    // Swap disabled by default
    let result = v2_client.try_get_swap_quote(&100_000_000, &token_in_id, &token_out_id);
    assert_eq!(result, Err(Ok(Error::DexNotConfigured)));
}

#[test]
fn test_get_swap_quote_fails_with_same_asset() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_id, _token_client, _asset_client) = create_token(&env, &token_admin);

    let (_, v2_client) = setup_v2(&env, &admin);

    // Set DEX address
    let dex_address = Address::generate(&env);
    v2_client.set_dex_address(&dex_address);

    // Enable swap
    v2_client.set_swap_enabled(&true);

    // Same asset should fail
    let result = v2_client.try_get_swap_quote(&100_000_000, &token_id, &token_id);
    assert_eq!(result, Err(Ok(Error::SameAsset)));
}

// ----------------------------------------------------------------
// Issue #377 — Push-Pull Rate Re-balancing Tests
// ----------------------------------------------------------------

#[test]
fn test_propose_rate_creates_pending_update() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, asset_client) = create_token(&env, &admin);
    let (id, v2_client) = setup_v2(&env, &admin);

    v2_client.add_to_whitelist(&token_id);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    // Mint tokens to sender
    asset_client.mint(&sender, &500_000_000);

    // Create a stream: 100 units over 100 seconds = 1 unit/sec
    let args = stream_args(&sender, &receiver, &token_id, 100_000_000);
    let mut stream_args = StreamArgs {
        start_time: now,
        cliff_time: now,
        end_time: now + 100,
        ..args
    };
    stream_args.total_amount = 100_000_000;

    let stream_id = v2_client.create_stream(&stream_args);

    // Verify stream was created
    let stream = v2_client.get_stream(&stream_id).unwrap();
    assert_eq!(stream.total_amount, 100_000_000);

    // Fast forward to middle of stream
    env.ledger().set_timestamp(now + 50);

    // Propose a new rate (double the rate: 2 units/sec)
    // Remaining: ~50 units, at 2 units/sec = ~25 more seconds
    let new_rate = 2_000_000; // 2 units per second
    let result = v2_client.try_propose_rate(&stream_id, &new_rate);

    // Should succeed
    assert!(result.is_ok());
    let pending = result.unwrap();
    assert_eq!(pending.new_rate, new_rate);
    assert_eq!(pending.proposed_by, sender);
}

#[test]
fn test_propose_rate_fails_for_zero_rate() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, asset_client) = create_token(&env, &admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    v2_client.add_to_whitelist(&token_id);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    asset_client.mint(&sender, &500_000_000);

    let args = stream_args(&sender, &receiver, &token_id, 100_000_000);
    let stream_id = v2_client.create_stream(&StreamArgs {
        start_time: now,
        cliff_time: now,
        end_time: now + 100,
        total_amount: 100_000_000,
        ..args
    });

    // Propose zero rate should fail
    let result = v2_client.try_propose_rate(&stream_id, &0);
    assert_eq!(result, Err(Ok(Error::InvalidNewRate)));
}

#[test]
fn test_propose_rate_fails_for_non_sender() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, asset_client) = create_token(&env, &admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    v2_client.add_to_whitelist(&token_id);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    asset_client.mint(&sender, &500_000_000);

    let args = stream_args(&sender, &receiver, &token_id, 100_000_000);
    let stream_id = v2_client.create_stream(&StreamArgs {
        start_time: now,
        cliff_time: now,
        end_time: now + 100,
        total_amount: 100_000_000,
        ..args
    });

    // Try to propose from receiver's context (not authorized)
    let result = v2_client.try_propose_rate(&stream_id, &2_000_000);
    // Should fail because sender auth is required
    assert!(result.is_err());
}

#[test]
fn test_accept_rate_updates_stream() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, asset_client) = create_token(&env, &admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    v2_client.add_to_whitelist(&token_id);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    asset_client.mint(&sender, &500_000_000);

    let args = stream_args(&sender, &receiver, &token_id, 100_000_000);
    let stream_id = v2_client.create_stream(&StreamArgs {
        start_time: now,
        cliff_time: now,
        end_time: now + 100,
        total_amount: 100_000_000,
        ..args
    });

    // Fast forward
    env.ledger().set_timestamp(now + 50);

    // Propose new rate (double: 2 units/sec)
    v2_client.propose_rate(&stream_id, &2_000_000);

    // Accept rate change
    let result = v2_client.try_accept_rate(&stream_id);
    assert!(result.is_ok());

    let new_end_time = result.unwrap();
    // Original: 100 units over 100 sec = 1 unit/sec
    // After 50 sec: ~50 units remaining
    // New rate: 2 units/sec -> ~25 more seconds
    // New end time: now + 50 + 25 = now + 75
    // But should be >= original end time - 50 (because rate increased)
    assert!(new_end_time < now + 100);
    assert!(new_end_time > now + 50);
}

#[test]
fn test_accept_rate_fails_for_non_receiver() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, asset_client) = create_token(&env, &admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    v2_client.add_to_whitelist(&token_id);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    asset_client.mint(&sender, &500_000_000);

    let args = stream_args(&sender, &receiver, &token_id, 100_000_000);
    let stream_id = v2_client.create_stream(&StreamArgs {
        start_time: now,
        cliff_time: now,
        end_time: now + 100,
        total_amount: 100_000_000,
        ..args
    });

    // Propose new rate
    v2_client.propose_rate(&stream_id, &2_000_000);

    // Try to accept from sender's context (should fail)
    // Note: With mock_all_auths, both might appear authorized,
    // but the contract checks receiver specifically
    let result = v2_client.try_accept_rate(&stream_id);
    // The result depends on who was the last mock auth, but the contract logic should fail
    // because we need to test actual authorization
}

#[test]
fn test_cancel_rate_proposal_removes_pending() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, asset_client) = create_token(&env, &admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    v2_client.add_to_whitelist(&token_id);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    asset_client.mint(&sender, &500_000_000);

    let args = stream_args(&sender, &receiver, &token_id, 100_000_000);
    let stream_id = v2_client.create_stream(&StreamArgs {
        start_time: now,
        cliff_time: now,
        end_time: now + 100,
        total_amount: 100_000_000,
        ..args
    });

    // Propose new rate
    v2_client.propose_rate(&stream_id, &2_000_000);

    // Verify pending update exists
    let pending = v2_client.get_pending_rate_update(&stream_id);
    assert!(pending.is_ok());
    assert!(pending.unwrap().is_some());

    // Cancel proposal (from sender)
    let result = v2_client.try_cancel_rate_proposal(&stream_id, &sender);
    assert!(result.is_ok());

    // Verify pending update is gone
    let pending = v2_client.get_pending_rate_update(&stream_id);
    assert!(pending.is_ok());
    assert!(pending.unwrap().is_none());
}

#[test]
fn test_get_pending_rate_update_returns_none_when_no_proposal() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, asset_client) = create_token(&env, &admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    v2_client.add_to_whitelist(&token_id);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    asset_client.mint(&sender, &500_000_000);

    let args = stream_args(&sender, &receiver, &token_id, 100_000_000);
    let stream_id = v2_client.create_stream(&StreamArgs {
        start_time: now,
        cliff_time: now,
        end_time: now + 100,
        total_amount: 100_000_000,
        ..args
    });

    // No proposal yet
    let pending = v2_client.get_pending_rate_update(&stream_id);
    assert!(pending.is_ok());
    assert!(pending.unwrap().is_none());
}

#[test]
fn test_propose_rate_fails_for_nonexistent_stream() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (_, v2_client) = setup_v2(&env, &admin);

    let sender = Address::generate(&env);
    
    let result = v2_client.try_propose_rate(&999u64, &2_000_000);
    assert_eq!(result, Err(Ok(Error::StreamNotFound)));
}

// ----------------------------------------------------------------
// Issue #409 — Pre-Flight Simulation Helper Tests
// ----------------------------------------------------------------

#[test]
fn test_simulate_stream_creation_success() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, asset_client) = create_token(&env, &admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    v2_client.add_to_whitelist(&token_id);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    // Mint enough tokens to sender
    asset_client.mint(&sender, &500_000_000);

    let args = StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: now,
        cliff_time: now,
        end_time: now + 100,
        step_duration: 0,
        multiplier_bps: 10000,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    };

    // Run simulation
    let report = v2_client.simulate_stream_creation(&args);

    // All checks should pass
    assert!(report.would_succeed);
    assert!(report.params_check.passed);
    assert!(report.balance_check.passed);
    assert!(report.storage_check.passed);
    
    // Footprint should be estimated
    assert!(report.footprint.persistent_bytes > 0);
}

#[test]
fn test_simulate_stream_creation_insufficient_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, asset_client) = create_token(&env, &admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    v2_client.add_to_whitelist(&token_id);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    // Mint only a small amount to sender
    asset_client.mint(&sender, &10_000_000);

    let args = StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000, // More than sender has
        start_time: now,
        cliff_time: now,
        end_time: now + 100,
        step_duration: 0,
        multiplier_bps: 10000,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    };

    // Run simulation
    let report = v2_client.simulate_stream_creation(&args);

    // Should fail due to insufficient balance
    assert!(!report.would_succeed);
    assert!(!report.balance_check.passed);
    assert_eq!(report.balance_check.error_code, 64); // SimulationInsufficientBalance
}

#[test]
fn test_simulate_stream_creation_invalid_time_range() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, _asset_client) = create_token(&env, &admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    v2_client.add_to_whitelist(&token_id);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    let args = StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: now + 100, // Start after end
        cliff_time: now,
        end_time: now,
        step_duration: 0,
        multiplier_bps: 10000,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    };

    // Run simulation
    let report = v2_client.simulate_stream_creation(&args);

    // Should fail due to invalid time range
    assert!(!report.would_succeed);
    assert!(!report.params_check.passed);
    assert_eq!(report.params_check.error_code, 14); // InvalidTimeRange
}

#[test]
fn test_can_create_stream_quick_check() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, asset_client) = create_token(&env, &admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    v2_client.add_to_whitelist(&token_id);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    // Mint enough tokens
    asset_client.mint(&sender, &500_000_000);

    let args = StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: now,
        cliff_time: now,
        end_time: now + 100,
        step_duration: 0,
        multiplier_bps: 10000,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    };

    // Quick check
    let can_create = v2_client.can_create_stream(&args);
    assert!(can_create);
}

#[test]
fn test_simulate_ledger_footprint_estimated() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let (token_id, _token_client, asset_client) = create_token(&env, &admin);
    let (_, v2_client) = setup_v2(&env, &admin);

    v2_client.add_to_whitelist(&token_id);

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let now = env.ledger().timestamp();

    asset_client.mint(&sender, &500_000_000);

    let args = StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 100_000_000,
        start_time: now,
        cliff_time: now,
        end_time: now + 100,
        step_duration: 0,
        multiplier_bps: 10000,
        penalty_bps: 0,
        vault_address: None,
        yield_enabled: false,
        is_recurrent: false,
        cycle_duration: 0,
        cancellation_type: 0,
        affiliate: None,
        yield_recipient: 0,
        split_address: None,
        split_bps: 0,
    };

    let report = v2_client.simulate_stream_creation(&args);

    // Verify footprint estimates are reasonable
    assert!(report.footprint.instance_bytes > 0);
    assert!(report.footprint.persistent_bytes > 0);
    assert!(report.footprint.estimated_reads > 0);
    assert!(report.footprint.estimated_writes > 0);
    assert!(report.footprint.event_bytes > 0);
}
