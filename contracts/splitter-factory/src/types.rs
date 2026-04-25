use soroban_sdk::{contracttype, Address, BytesN, Vec};

/// Arguments passed to the child splitter's `initialize` function.
#[contracttype]
#[derive(Clone, Debug)]
pub struct SplitterInitArgs {
    /// Token to be split/streamed.
    pub token: Address,
    /// Protocol fee in basis points (e.g. 100 = 1%).
    pub fee_bps: u32,
    /// Treasury address that collects protocol fees.
    pub treasury: Address,
    /// Additional admins for the child instance (beyond the creator).
    pub extra_admins: Vec<Address>,
}

/// Emitted after each successful child deployment.
#[contracttype]
#[derive(Clone, Debug)]
pub struct SplitterDeployedEvent {
    pub child_address: Address,
    pub creator: Address,
    pub salt: BytesN<32>,
}
