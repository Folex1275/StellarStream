#![no_std]

use soroban_sdk::{contract, contractimpl, contractclient, symbol_short, Address, BytesN, Env, Vec};

mod types;
pub use types::{SplitterDeployedEvent, SplitterInitArgs};

#[cfg(test)]
mod test;

// ── Child contract interface ──────────────────────────────────────────────────

/// Minimal interface of the stellar_stream_v3 splitter contract.
/// The factory calls `initialize` immediately after deployment.
#[contractclient(name = "SplitterClient")]
pub trait SplitterTrait {
    fn initialize(
        env: Env,
        owner: Address,
        token: Address,
        fee_bps: u32,
        treasury: Address,
        extra_admins: Vec<Address>,
    ) -> Result<(), soroban_sdk::Error>;
}

// ── Factory contract ──────────────────────────────────────────────────────────

#[contract]
pub struct SplitterFactory;

#[contractimpl]
impl SplitterFactory {
    // ── One-time setup ────────────────────────────────────────────────────────

    /// Initialize the factory. Must be called once before any deployment.
    pub fn initialize(env: Env, admin: Address, wasm_hash: BytesN<32>) {
        if env.storage().instance().has(&symbol_short!("Admin")) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&symbol_short!("Admin"), &admin);
        env.storage().instance().set(&symbol_short!("WasmHash"), &wasm_hash);
    }

    // ── Admin: upgrade wasm hash ──────────────────────────────────────────────

    /// Allow the factory admin to point to a new version of the splitter WASM.
    /// All future deployments will use the updated hash.
    pub fn update_wasm_hash(env: Env, new_hash: BytesN<32>) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&symbol_short!("Admin"))
            .expect("not initialized");
        admin.require_auth();
        env.storage().instance().set(&symbol_short!("WasmHash"), &new_hash);
    }

    // ── Core factory function ─────────────────────────────────────────────────

    /// Deploy a new splitter instance and initialize it.
    ///
    /// * `creator`   – becomes the sub-admin / owner of the child contract.
    /// * `salt`      – deterministic salt; different salts → different addresses.
    /// * `init_args` – fee, treasury, and extra admin configuration.
    ///
    /// Returns the address of the newly deployed child contract.
    pub fn deploy_splitter(
        env: Env,
        creator: Address,
        salt: BytesN<32>,
        init_args: SplitterInitArgs,
    ) -> Address {
        creator.require_auth();

        let wasm_hash: BytesN<32> = env
            .storage()
            .instance()
            .get(&symbol_short!("WasmHash"))
            .expect("not initialized");

        // Deterministic deployment: address is a function of (creator, salt).
        let child_address = env
            .deployer()
            .with_address(creator.clone(), salt.clone())
            .deploy_v2(wasm_hash, ());

        // Immediately initialize the child, passing `creator` as the owner.
        let client = SplitterClient::new(&env, &child_address);
        client.initialize(
            &creator,
            &init_args.token,
            &init_args.fee_bps,
            &init_args.treasury,
            &init_args.extra_admins,
        );

        // Emit an indexable event for off-chain tracking.
        env.events().publish(
            (symbol_short!("deployed"), creator.clone()),
            SplitterDeployedEvent {
                child_address: child_address.clone(),
                creator,
                salt,
            },
        );

        child_address
    }

    // ── View helpers ──────────────────────────────────────────────────────────

    pub fn admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&symbol_short!("Admin"))
            .expect("not initialized")
    }

    pub fn wasm_hash(env: Env) -> BytesN<32> {
        env.storage()
            .instance()
            .get(&symbol_short!("WasmHash"))
            .expect("not initialized")
    }
}
