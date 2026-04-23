use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum DataKey {
    Admin,
    QuorumAdmins,
    NextProposalId,
    Token,
    FeeBps,
    Treasury,
    StrictMode,
    VerifiedUsers(Address),
    Proposal(u64),
    NextSplitId,
    ScheduledSplit(u64),
    ClaimableBalance(Address, Address),
    CouncilKeys,
    // #919: affiliate revenue split
    AffiliateAddress,
    AffiliateBps,
    PendingWithdrawal(Address),
    // #920: chunked processing state
    SplitFundsNextIndex,
    // #922: circuit breaker
    ContractState,
}
