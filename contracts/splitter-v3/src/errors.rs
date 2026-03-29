// Error descriptions have been moved to ERROR_CODES.md (Issue #840).
// Numeric codes are the on-chain surface; human-readable text lives off-chain.
#[soroban_sdk::contracterror]
#[derive(Copy, Clone, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotAdmin = 2,
    RecipientNotVerified = 3,
    NoVerifiedRecipients = 4,
    InvalidSplit = 5,
    Overflow = 6,
    NotAuthorizedAdmin = 7,
    AlreadyApproved = 8,
    ProposalNotFound = 9,
    AlreadyExecuted = 10,
    QuorumNotReached = 11,
    SplitNotFound = 12,
    NotSplitSender = 13,
    SplitAlreadyCancelled = 14,
    SplitAlreadyExecuted = 15,
    SplitNotYetDue = 16,
    NothingToClaim = 17,
    CouncilNotSet = 18,
    InsufficientCouncilSignatures = 19,
    DuplicateCouncilSigner = 20,
    InvalidCouncilSigner = 21,
    EmptyRecipients = 23,
    NotYetReleased = 22,
    InvalidBpsSum = 24,
}
