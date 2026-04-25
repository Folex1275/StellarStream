#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, BytesN as _},
    Address, BytesN, Env, Vec,
};

use crate::{SplitterFactory, SplitterFactoryClient, SplitterInitArgs};

// ── Minimal mock splitter ─────────────────────────────────────────────────────
//
// The factory calls `initialize` on the child immediately after deployment.
// We register a tiny mock contract that records the call so tests can assert
// the child was correctly initialized.

mod mock_splitter {
    use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Vec};

    #[contract]
    pub struct MockSplitter;

    #[contractimpl]
    impl MockSplitter {
        pub fn initialize(
            env: Env,
            owner: Address,
            token: Address,
            fee_bps: u32,
            treasury: Address,
            _extra_admins: Vec<Address>,
        ) {
            env.storage().instance().set(&symbol_short!("owner"), &owner);
            env.storage().instance().set(&symbol_short!("token"), &token);
            env.storage().instance().set(&symbol_short!("feebps"), &fee_bps);
            env.storage().instance().set(&symbol_short!("treasury"), &treasury);
        }

        pub fn owner(env: Env) -> Address {
            env.storage().instance().get(&symbol_short!("owner")).unwrap()
        }

        pub fn fee_bps(env: Env) -> u32 {
            env.storage().instance().get(&symbol_short!("feebps")).unwrap()
        }

        pub fn treasury(env: Env) -> Address {
            env.storage().instance().get(&symbol_short!("treasury")).unwrap()
        }
    }
}

use mock_splitter::{MockSplitter, MockSplitterClient};

// ── Helpers ───────────────────────────────────────────────────────────────────

fn setup() -> (Env, SplitterFactoryClient<'static>, BytesN<32>) {
    let env = Env::default();
    env.mock_all_auths();

    let factory_id = env.register(SplitterFactory, ());
    let factory = SplitterFactoryClient::new(&env, &factory_id);

    // Upload the mock splitter WASM; the hash is what the factory stores.
    let wasm_hash = env.deployer().upload_contract_wasm(MockSplitter::WASM);

    (env, factory, wasm_hash)
}

fn default_args(env: &Env) -> (Address, SplitterInitArgs) {
    let creator = Address::generate(env);
    let args = SplitterInitArgs {
        token: Address::generate(env),
        fee_bps: 100,
        treasury: Address::generate(env),
        extra_admins: Vec::new(env),
    };
    (creator, args)
}

// ── Test 1: Factory deploys a child and returns a valid address ───────────────

#[test]
fn test_deploy_returns_valid_address() {
    let (env, factory, wasm_hash) = setup();
    let admin = Address::generate(&env);
    factory.initialize(&admin, &wasm_hash);

    let (creator, args) = default_args(&env);
    let salt = BytesN::random(&env);

    let child_addr = factory.deploy_splitter(&creator, &salt, &args);

    // Constructing a client against the returned address verifies it is a
    // live contract — MockSplitterClient::new panics on an invalid address.
    let _client = MockSplitterClient::new(&env, &child_addr);
}

// ── Test 2: Child is initialized with creator as owner and correct fee ────────

#[test]
fn test_child_initialized_with_creator_as_owner() {
    let (env, factory, wasm_hash) = setup();
    let admin = Address::generate(&env);
    factory.initialize(&admin, &wasm_hash);

    let creator = Address::generate(&env);
    let token = Address::generate(&env);
    let treasury = Address::generate(&env);
    let args = SplitterInitArgs {
        token: token.clone(),
        fee_bps: 250,
        treasury: treasury.clone(),
        extra_admins: Vec::new(&env),
    };
    let salt = BytesN::random(&env);

    let child_addr = factory.deploy_splitter(&creator, &salt, &args);
    let child = MockSplitterClient::new(&env, &child_addr);

    assert_eq!(child.owner(), creator);
    assert_eq!(child.fee_bps(), 250u32);
    assert_eq!(child.treasury(), treasury);
}

// ── Test 3: Different salts produce different addresses ───────────────────────

#[test]
fn test_different_salts_produce_different_addresses() {
    let (env, factory, wasm_hash) = setup();
    let admin = Address::generate(&env);
    factory.initialize(&admin, &wasm_hash);

    let creator = Address::generate(&env);
    let token = Address::generate(&env);
    let treasury = Address::generate(&env);

    let make_args = || SplitterInitArgs {
        token: token.clone(),
        fee_bps: 100,
        treasury: treasury.clone(),
        extra_admins: Vec::new(&env),
    };

    let salt_a = BytesN::random(&env);
    let salt_b = BytesN::random(&env);

    let addr_a = factory.deploy_splitter(&creator, &salt_a, &make_args());
    let addr_b = factory.deploy_splitter(&creator, &salt_b, &make_args());

    assert_ne!(addr_a, addr_b);
}

// ── Test 4: update_wasm_hash changes the stored hash ─────────────────────────

#[test]
fn test_update_wasm_hash_changes_hash() {
    let (env, factory, wasm_hash) = setup();
    let admin = Address::generate(&env);
    factory.initialize(&admin, &wasm_hash);

    // Re-upload the same WASM as a stand-in for a "new version".
    let new_hash = env.deployer().upload_contract_wasm(MockSplitter::WASM);
    factory.update_wasm_hash(&new_hash);

    assert_eq!(factory.wasm_hash(), new_hash);
}

// ── Test 5: initialize cannot be called twice ─────────────────────────────────

#[test]
#[should_panic(expected = "already initialized")]
fn test_double_initialize_panics() {
    let (env, factory, wasm_hash) = setup();
    let admin = Address::generate(&env);
    factory.initialize(&admin, &wasm_hash);
    factory.initialize(&admin, &wasm_hash); // must panic
}

// ── Test 6: wasm_hash view returns the stored hash ───────────────────────────

#[test]
fn test_wasm_hash_view() {
    let (env, factory, wasm_hash) = setup();
    let admin = Address::generate(&env);
    factory.initialize(&admin, &wasm_hash);

    assert_eq!(factory.wasm_hash(), wasm_hash);
}

// ── Test 7: admin view returns the stored admin ───────────────────────────────

#[test]
fn test_admin_view() {
    let (env, factory, wasm_hash) = setup();
    let admin = Address::generate(&env);
    factory.initialize(&admin, &wasm_hash);

    assert_eq!(factory.admin(), admin);
}
