#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger as _};
use soroban_sdk::{token, Address, Env};

#[allow(dead_code)]
struct TestContext {
    env: Env,
    contract_id: Address,
    client: StellarStreamClient<'static>,
    token_admin: Address,
    token: token::StellarAssetClient<'static>,
    token_id: Address,
}

fn setup_test() -> TestContext {
    let env = Env::default();
    env.mock_all_auths();

    // v22 Change: register_contract -> register
    let contract_id = env.register(StellarStream, ());
    let client = StellarStreamClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);

    #[allow(deprecated)]
    let token_id = env.register_stellar_asset_contract(token_admin.clone());
    let token = token::StellarAssetClient::new(&env, &token_id);

    TestContext {
        env,
        contract_id,
        client,
        token_admin,
        token,
        token_id,
    }
}

#[test]
fn test_full_stream_cycle() {
    let ctx = setup_test();
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);

    let amount = 100_i128;
    let start_time = 1000;
    let cliff_time = 1025;
    let end_time = 1100;

    ctx.token.mint(&sender, &amount);

    let stream_id = ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &amount,
        &start_time,
        &cliff_time,
        &end_time,
        &2,
        &None,
        &None,
    );

    // v22 Change: ledger().with_mut() -> ledger().set()
    ctx.env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 1050,
        protocol_version: 22,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
        min_temp_entry_ttl: 0,
        min_persistent_entry_ttl: 0,
        max_entry_ttl: 1000000,
    });

    let withdrawn = ctx.client.withdraw(&stream_id, &receiver);
    assert_eq!(withdrawn, 50);

    let token_client = token::Client::new(&ctx.env, &ctx.token_id);
    assert_eq!(token_client.balance(&receiver), 50);
}

#[test]
#[should_panic(expected = "Unauthorized: You are not the receiver of this stream")]
fn test_unauthorized_withdrawal() {
    let ctx = setup_test();
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);
    let thief = Address::generate(&ctx.env);

    ctx.token.mint(&sender, &100);
    let stream_id = ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &100,
        &0,
        &50,
        &100,
        &2,
           &None,
           &None,
    );

    ctx.client.withdraw(&stream_id, &thief);
}

#[test]
fn test_cancellation_split() {
    let ctx = setup_test();
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);
    let amount = 1000_i128;

    ctx.token.mint(&sender, &amount);
    let stream_id = ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &amount,
        &0,
        &100,
        &1000,
        &2,
           &None,
           &None,
    );

    // Jump to 25% (250 seconds in)
    ctx.env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 250,
        protocol_version: 22,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
        min_temp_entry_ttl: 0,
        min_persistent_entry_ttl: 0,
        max_entry_ttl: 1000000,
    });

    ctx.client.cancel_stream(&stream_id);

    let token_client = token::Client::new(&ctx.env, &ctx.token_id);
    assert_eq!(token_client.balance(&receiver), 250);
    assert_eq!(token_client.balance(&sender), 750);
}

#[test]
fn test_protocol_fee() {
    let ctx = setup_test();
    let admin = Address::generate(&ctx.env);
    let treasury = Address::generate(&ctx.env);
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);

    // Initialize contract with admin (grants all roles)
    ctx.client.initialize(&admin);
    ctx.client.initialize_fee(&admin, &100, &treasury);

    ctx.token.mint(&sender, &1000);
    let stream_id = ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &1000,
        &0,
        &100,
        &1000,
        &2,
        &None,
        &None,
    );

    assert_eq!(stream_id, 1);

    let token_client = token::Client::new(&ctx.env, &ctx.token_id);
    assert_eq!(token_client.balance(&treasury), 10);
    assert_eq!(token_client.balance(&ctx.contract_id), 990);
}

#[test]
fn test_transfer_receiver() {
    let ctx = setup_test();
    let sender = Address::generate(&ctx.env);
    let old_receiver = Address::generate(&ctx.env);
    let new_receiver = Address::generate(&ctx.env);

    ctx.token.mint(&sender, &1000);
    let stream_id = ctx.client.create_stream(
        &sender,
        &old_receiver,
        &ctx.token_id,
        &1000,
        &0,
        &100,
        &1000,
        &2,
           &None,
           &None,
    );

    ctx.client.transfer_receiver(&stream_id, &new_receiver);

    ctx.env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 500,
        protocol_version: 22,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
        min_temp_entry_ttl: 0,
        min_persistent_entry_ttl: 0,
        max_entry_ttl: 1000000,
    });

    let withdrawn = ctx.client.withdraw(&stream_id, &new_receiver);
    assert_eq!(withdrawn, 500);

    let token_client = token::Client::new(&ctx.env, &ctx.token_id);
    assert_eq!(token_client.balance(&new_receiver), 500);
}

#[test]
#[should_panic(expected = "Unauthorized: You are not the receiver of this stream")]
fn test_old_receiver_cannot_withdraw_after_transfer() {
    let ctx = setup_test();
    let sender = Address::generate(&ctx.env);
    let old_receiver = Address::generate(&ctx.env);
    let new_receiver = Address::generate(&ctx.env);

    ctx.token.mint(&sender, &1000);
    let stream_id = ctx.client.create_stream(
        &sender,
        &old_receiver,
        &ctx.token_id,
        &1000,
        &0,
        &100,
        &1000,
        &2,
           &None,
           &None,
    );

    ctx.client.transfer_receiver(&stream_id, &new_receiver);

    ctx.env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 500,
        protocol_version: 22,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
        min_temp_entry_ttl: 0,
        min_persistent_entry_ttl: 0,
        max_entry_ttl: 1000000,
    });

    ctx.client.withdraw(&stream_id, &old_receiver);
}

#[test]
fn test_batch_stream_creation() {
    let ctx = setup_test();
    let sender = Address::generate(&ctx.env);
    let receiver1 = Address::generate(&ctx.env);
    let receiver2 = Address::generate(&ctx.env);
    let receiver3 = Address::generate(&ctx.env);

    let total_amount = 3000_i128;
    ctx.token.mint(&sender, &total_amount);

    let mut requests = soroban_sdk::Vec::new(&ctx.env);
    requests.push_back(StreamRequest {
        receiver: receiver1.clone(),
        amount: 1000,
        start_time: 0,
        cliff_time: 100,
        end_time: 1000,
        interest_strategy: 2,
        vault_address: None,
        metadata: None,
    });
    requests.push_back(StreamRequest {
        receiver: receiver2.clone(),
        amount: 1500,
        start_time: 0,
        cliff_time: 100,
        end_time: 1000,
        interest_strategy: 2,
        vault_address: None,
        metadata: None,
    });
    requests.push_back(StreamRequest {
        receiver: receiver3.clone(),
        amount: 500,
        start_time: 0,
        cliff_time: 100,
        end_time: 1000,
        interest_strategy: 2,
        vault_address: None,
        metadata: None,
    });

    let stream_ids = ctx
        .client
        .create_batch_streams(&sender, &ctx.token_id, &requests);

    assert_eq!(stream_ids.len(), 3);
    assert_eq!(stream_ids.get(0).unwrap(), 1);
    assert_eq!(stream_ids.get(1).unwrap(), 2);
    assert_eq!(stream_ids.get(2).unwrap(), 3);

    let token_client = token::Client::new(&ctx.env, &ctx.token_id);
    assert_eq!(token_client.balance(&ctx.contract_id), 3000);
}

#[test]
#[should_panic(expected = "Contract is paused")]
fn test_pause_blocks_create_stream() {
    let ctx = setup_test();
    let admin = Address::generate(&ctx.env);
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);

    ctx.client.initialize(&admin);
    ctx.client.set_pause(&admin, &true);

    ctx.token.mint(&sender, &1000);
    ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &1000,
        &0,
        &100,
        &1000,
        &2,
           &None,
           &None,
    );
}

#[test]
#[should_panic(expected = "Contract is paused")]
fn test_pause_blocks_withdraw() {
    let ctx = setup_test();
    let admin = Address::generate(&ctx.env);
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);

    ctx.client.initialize(&admin);
    ctx.token.mint(&sender, &1000);
    let stream_id = ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &1000,
        &0,
        &100,
        &1000,
        &2,
           &None,
           &None,
    );

    ctx.client.set_pause(&admin, &true);

    ctx.env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 500,
        protocol_version: 22,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
        min_temp_entry_ttl: 0,
        min_persistent_entry_ttl: 0,
        max_entry_ttl: 1000000,
    });

    ctx.client.withdraw(&stream_id, &receiver);
}

#[test]
#[should_panic(expected = "Fee cannot exceed 10%")]
fn test_fee_cap() {
    let ctx = setup_test();
    let admin = Address::generate(&ctx.env);
    let treasury = Address::generate(&ctx.env);

    // Initialize contract with admin (grants all roles)
    ctx.client.initialize(&admin);
    ctx.client.initialize_fee(&admin, &1001, &treasury);
}

#[test]
fn test_update_fee() {
    let ctx = setup_test();
    let admin = Address::generate(&ctx.env);
    let treasury = Address::generate(&ctx.env);

    // Initialize contract with admin (grants all roles)
    ctx.client.initialize(&admin);
    ctx.client.initialize_fee(&admin, &100, &treasury);
    ctx.client.update_fee(&admin, &200);
}

#[test]
#[should_panic(expected = "No funds available to withdraw at this time")]
fn test_cliff_blocks_withdrawal() {
    let ctx = setup_test();
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);

    ctx.token.mint(&sender, &1000);
    let stream_id = ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &1000,
        &0,
        &500,
        &1000,
        &2,
           &None,
           &None,
    );

    ctx.env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 250,
        protocol_version: 22,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
        min_temp_entry_ttl: 0,
        min_persistent_entry_ttl: 0,
        max_entry_ttl: 1000000,
    });

    ctx.client.withdraw(&stream_id, &receiver);
}

#[test]
fn test_cliff_unlocks_at_cliff_time() {
    let ctx = setup_test();
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);

    ctx.token.mint(&sender, &1000);
    let stream_id = ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &1000,
        &0,
        &500,
        &1000,
        &2,
           &None,
           &None,
    );

    ctx.env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 500,
        protocol_version: 22,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
        min_temp_entry_ttl: 0,
        min_persistent_entry_ttl: 0,
        max_entry_ttl: 1000000,
    });

    ctx.client.withdraw(&stream_id, &receiver);
}

#[test]
fn test_unpause_allows_operations() {
    let ctx = setup_test();
    let admin = Address::generate(&ctx.env);
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);

    ctx.client.initialize(&admin);
    ctx.client.set_pause(&admin, &true);
    ctx.client.set_pause(&admin, &false);

    ctx.token.mint(&sender, &1000);
    let stream_id = ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &1000,
        &0,
        &100,
        &1000,
        &2,
        &None,
        &None,
    );

    ctx.env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 500,
        protocol_version: 22,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
        min_temp_entry_ttl: 0,
        min_persistent_entry_ttl: 0,
        max_entry_ttl: 1000000,
    });

    assert_eq!(stream_id, 1);
    let withdrawn = ctx.client.withdraw(&stream_id, &receiver);
    assert_eq!(withdrawn, 500);
}

#[test]
#[should_panic(expected = "Cliff time must be between start and end time")]
fn test_invalid_cliff_time() {
    let ctx = setup_test();
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);

    ctx.token.mint(&sender, &1000);
    ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &1000,
        &100,
        &50,
        &200,
        &2,
           &None,
           &None,
    );
}

// ─── close_and_archive tests ─────────────────────────────────────────────────

#[test]
fn test_close_and_archive_fully_withdrawn_stream() {
    let ctx = setup_test();
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);

    let amount = 1_000_i128;
    ctx.token.mint(&sender, &amount);

    let stream_id = ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &amount,
        &0,
        &1000,
        &CurveType::Linear,
    );

    // Advance time past end so the full amount is unlocked
    ctx.env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 2000,
        protocol_version: 22,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
        min_temp_entry_ttl: 0,
        min_persistent_entry_ttl: 0,
        max_entry_ttl: 1_000_000,
    });

    ctx.client.withdraw(&stream_id, &receiver);

    // Sender closes the slot and recovers storage deposit
    ctx.client.close_and_archive(&stream_id, &sender);

    // Stream entry must no longer exist
    let result = ctx.client.try_get_stream(&stream_id);
    assert!(result.is_err());
}

#[test]
fn test_close_and_archive_fails_if_not_fully_withdrawn() {
    let ctx = setup_test();
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);

    let amount = 1_000_i128;
    ctx.token.mint(&sender, &amount);

    let stream_id = ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &amount,
        &0,
        &1000,
        &CurveType::Linear,
    );

    // Only half the stream has elapsed — receiver withdraws partial amount
    ctx.env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 500,
        protocol_version: 22,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
        min_temp_entry_ttl: 0,
        min_persistent_entry_ttl: 0,
        max_entry_ttl: 1_000_000,
    });

    ctx.client.withdraw(&stream_id, &receiver);

    // Attempt to archive before fully withdrawn — must fail
    let result = ctx.client.try_close_and_archive(&stream_id, &sender);
    assert!(result.is_err());
}

#[test]
fn test_close_and_archive_fails_for_non_sender() {
    let ctx = setup_test();
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);
    let stranger = Address::generate(&ctx.env);

    let amount = 500_i128;
    ctx.token.mint(&sender, &amount);

    let stream_id = ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &amount,
        &0,
        &1000,
        &CurveType::Linear,
    );

    ctx.env.ledger().set(soroban_sdk::testutils::LedgerInfo {
        timestamp: 2000,
        protocol_version: 22,
        sequence_number: 1,
        network_id: [0u8; 32],
        base_reserve: 0,
        min_temp_entry_ttl: 0,
        min_persistent_entry_ttl: 0,
        max_entry_ttl: 1_000_000,
    });

    ctx.client.withdraw(&stream_id, &receiver);

    // A stranger cannot archive someone else's stream
    let result = ctx.client.try_close_and_archive(&stream_id, &stranger);
    assert!(result.is_err());
}

#[test]
fn test_close_and_archive_fails_for_cancelled_stream() {
    let ctx = setup_test();
    let sender = Address::generate(&ctx.env);
    let receiver = Address::generate(&ctx.env);

    let amount = 500_i128;
    ctx.token.mint(&sender, &amount);

    let stream_id = ctx.client.create_stream(
        &sender,
        &receiver,
        &ctx.token_id,
        &amount,
        &0,
        &1000,
        &CurveType::Linear,
    );

    ctx.client.cancel(&stream_id, &sender);

    // Cancelled streams are already settled — archive must be rejected
    let result = ctx.client.try_close_and_archive(&stream_id, &sender);
    assert!(result.is_err());
}
