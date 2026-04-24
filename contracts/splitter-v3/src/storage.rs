use soroban_sdk::{contracttype, Address, BytesN};

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
    ContractState,
    AffiliateAddress,
    AffiliateBps,
    PendingWithdrawal(Address),
    ProcessedHash(BytesN<32>),
    SplitFundsNextIndex,
    // #924: migration version to prevent re-running migration logic
    MigrationVersion,
    // #927: whitelist map and flag
    Whitelisted(Address),
    WhitelistOnly,
    // #918: external identity validator contract address
    IdentityValidator,
}
