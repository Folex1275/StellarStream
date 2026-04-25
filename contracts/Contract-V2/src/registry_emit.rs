//! #935 — Stellar-Expert Registry Emit
//!
//! Emits a `ContractInfo` event during `init` that complies with Horizon's
//! indexing requirements for "Smart Contract Protocols", enabling automatic
//! verification and categorisation on Stellar.Expert.
//!
//! Event structure follows the SEP-0049 draft standard:
//!   topics: ["ContractInfo", version_string]
//!   data:   { name, version, protocol, home_domain, description }

use soroban_sdk::{contracttype, symbol_short, vec, Env, String, Symbol};

/// Metadata emitted once during contract initialisation.
#[contracttype]
#[derive(Clone, Debug)]
pub struct ContractInfoEvent {
    /// Human-readable contract name, e.g. "StellarStream V2"
    pub name: String,
    /// Semantic version string, e.g. "2.0.0"
    pub version: String,
    /// Protocol category for Stellar.Expert indexing
    pub protocol: String,
    /// Home domain for verification, e.g. "stellarstream.app"
    pub home_domain: String,
    /// Short description shown on explorer
    pub description: String,
}

/// Emit the ContractInfo registry event.
///
/// Call this exactly once from the contract's `init` / `initialize` function.
/// Stellar.Expert and Horizon indexers will pick up the `ContractInfo` topic
/// and use the data payload to populate the contract's profile page.
///
/// # Example
/// ```rust
/// pub fn initialize(env: Env, admin: Address) {
///     // ... existing init logic ...
///     emit_contract_info(&env);
/// }
/// ```
pub fn emit_contract_info(env: &Env) {
    let event = ContractInfoEvent {
        name:        String::from_str(env, "StellarStream"),
        version:     String::from_str(env, "2.0.0"),
        protocol:    String::from_str(env, "payment-streaming"),
        home_domain: String::from_str(env, "stellarstream.app"),
        description: String::from_str(env, "Non-custodial second-by-second asset streaming on Soroban"),
    };

    // Topics: ["ContractInfo", "2.0.0"]
    // Horizon indexes on the first topic symbol; Stellar.Expert reads the second as version.
    env.events().publish(
        (symbol_short!("CtrInfo"), String::from_str(env, "2.0.0")),
        event,
    );
}
