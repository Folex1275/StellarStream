use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum DataKey {
    /// instance() — single owner (set at initialize, used by #633 guards)
    Admin,
    /// instance() — the 3 quorum admins (set at initialize)
    QuorumAdmins,
    /// instance() — next proposal id counter
    NextProposalId,
    /// instance() — token address
    Token,
    /// instance() — fee in basis points
    FeeBps,
    /// instance() — treasury / fee-collector address
    Treasury,
    /// instance() — strict verification mode flag
    StrictMode,
    /// persistent() — per-address verification status
    VerifiedUsers(Address),
    /// persistent() — proposals keyed by id
    Proposal(u64),
    /// instance() — next scheduled split id counter
    NextSplitId,
    /// persistent() — scheduled splits keyed by split_id
    ScheduledSplit(u64),
}
