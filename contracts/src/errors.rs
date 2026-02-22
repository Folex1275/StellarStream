use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Error {
    AlreadyInitialized = 1,
    InvalidTimeRange = 2,
    InvalidAmount = 3,
    StreamNotFound = 4,
    Unauthorized = 5,
    AlreadyCancelled = 6,
    InsufficientBalance = 7,
    ProposalNotFound = 8,
    ProposalExpired = 9,
    AlreadyApproved = 10,
    ProposalAlreadyExecuted = 11,
    InvalidApprovalThreshold = 12,
    NotReceiptOwner = 13,
    StreamPaused = 14,
    OracleStalePrice = 15,
    OracleFailed = 16,
    PriceOutOfBounds = 17,
    FlashLoanNotRepaid = 18,
    FlashLoanInProgress = 19,
}
