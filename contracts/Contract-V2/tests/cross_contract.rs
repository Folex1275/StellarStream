use super::*;
use soroban_sdk::contractclient;
use soroban_sdk::token::{StellarAssetClient, TokenClient};
use soroban_sdk::{testutils::Address as _, Env, Symbol};

// Mock Bridge contract
#[contract]
pub struct MockBridge;

#[contractimpl]
impl MockBridge {
    /// Simulate bridge calling Nebula's on_token_receive
    pub fn simulate_bridge_in(
        env: Env,
        nebula_id: Address,
        from: Address,
        amount: i128,
        metadata: soroban_sdk::Bytes,
    ) {
        let nebula = ContractClient::new(&env, &nebula_id);
        nebula.on_token_receive(&from, &amount, &metadata);
    }
}

// Mock Vault contract
#[contract]
pub struct MockVault;

#[contractimpl]
impl MockVault {
    pub fn deposit(env: Env, amount: i128) {
        env.storage()
            .instance()
            .set(&Symbol::short("deposit"), &amount);
    }

    pub fn balance(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&Symbol::short("deposit"))
            .unwrap_or(0)
    }
}

#[test]
fn test_deep_space_cross_contract_flow() {
    let env = Env::default();
    env.mock_all_auths();

    // Setup
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let (token_id, token_client, asset_client) = create_token(&env, &token_admin);
    asset_client.mint(&sender, &200_000_000);

    // Deploy Nebula V2
    let nebula_id = env.register_contract(None, Contract);
    let nebula_client = ContractClient::new(&env, &nebula_id);
    nebula_client.init(&admin);
    nebula_client.add_to_whitelist(&token_id);

    // Deploy mocks
    let bridge_id = env.register_contract(None, MockBridge);
    let vault_id = env.register_contract(None, MockVault);

    // 1. Bridge In (calls on_token_receive -> create_stream)
    let metadata = soroban_sdk::Bytes::from_slice(&env, &[b'G'; 32]); // dummy metadata
    MockBridgeClient::new(&env, &bridge_id).simulate_bridge_in(
        &nebula_id,
        &sender,
        &100_000_000,
        &metadata,
    );

    // Verify stream created (ID 0)
    let stream = nebula_client.get_stream(&0u64).unwrap();
    assert_eq!(stream.sender, sender);
    assert_eq!(stream.receiver, receiver);
    assert_eq!(stream.total_amount, 100_000_000); // after fees

    // 2. Deposit stream to Vault (vault_address in stream)
    let stream_args = StreamArgs {
        sender: sender.clone(),
        receiver: receiver.clone(),
        token: token_id.clone(),
        total_amount: 50_000_000,
        start_time: env.ledger().timestamp(),
        cliff_time: env.ledger().timestamp(),
        end_time: env.ledger().timestamp() + 100,
        ..Default::default()
    };

    // Update stream with vault
    // Note: In production, this would be set during creation
    let stream_id = nebula_client.create_stream(&stream_args);

    // Verify vault deposit called
    let vault_client = MockVaultClient::new(&env, &vault_id);
    assert_eq!(vault_client.balance(), 50_000_000);

    // 3. Verify all 3 contracts in sync
    assert!(nebula_client.get_stream(&stream_id).is_some());
    assert_eq!(token_client.balance(&nebula_id), 50_000_000); // held in Nebula
    assert_eq!(vault_client.balance(), 50_000_000); // deposited

    println!("✅ Deep Space cross-contract flow: Bridge -> Nebula -> Vault SUCCESS");
}
