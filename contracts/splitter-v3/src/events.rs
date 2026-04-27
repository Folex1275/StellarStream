// #921: Standardized event emission for the V3 Splitter.
//
// Using #[contractevent] ensures events are ABI-typed and indexable by the
// Backend Indexer (Phase 3) — critical for tracking internal fund movements
// that don't appear as top-level transaction results.

use soroban_sdk::{contractevent, Address, Env};

/// Emitted once per successful `split_funds` / `split` call.
/// Topics: ["splitter", "executed", sender_address]
#[contractevent]
pub struct SplitExecutedEvent {
    /// Total amount disbursed in this split (after fees).
    pub amount: i128,
    /// Timestamp of the ledger at execution time.
    pub timestamp: u64,
}

/// Emitted once per individual recipient payment inside a split.
/// Topics: ["payment", recipient_address, asset_address]
#[contractevent]
pub struct IndividualPaymentEvent {
    /// Amount transferred to this recipient.
    pub amount: i128,
    /// Recipient's share in basis points (out of 10 000).
    pub bps: u32,
    /// Timestamp of the ledger at execution time.
    pub timestamp: u64,
}

// ── Publish helpers ───────────────────────────────────────────────────────────

/// Publish a SplitExecutedEvent.
/// Topics: ["splitter", "executed", sender]
pub fn emit_split_executed(env: &Env, sender: &Address, amount: i128) {
    SplitExecutedEvent {
        amount,
        timestamp: env.ledger().timestamp(),
    }
    .publish(
        env,
        (
            soroban_sdk::symbol_short!("splitter"),
            soroban_sdk::symbol_short!("executed"),
            sender.clone(),
        ),
    );
}

/// Publish an IndividualPaymentEvent.
/// Topics: ["payment", recipient, asset]
pub fn emit_individual_payment(
    env: &Env,
    recipient: &Address,
    asset: &Address,
    amount: i128,
    bps: u32,
) {
    IndividualPaymentEvent {
        amount,
        bps,
        timestamp: env.ledger().timestamp(),
    }
    .publish(
        env,
        (
            soroban_sdk::symbol_short!("payment"),
            recipient.clone(),
            asset.clone(),
        ),
    );
}
