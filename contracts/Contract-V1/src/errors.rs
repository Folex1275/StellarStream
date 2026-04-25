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
    ReceiverRestricted = 20,
    AlreadyExecuted = 21,
    /// Stream is soulbound: receiver cannot be transferred
    StreamIsSoulbound = 22,
    /// Address is restricted by OFAC compliance
    AddressRestricted = 23,
    /// Stream has already ended (past end_time)
    StreamEnded = 24,
    /// Batch request exceeds the maximum allowed recipients per call
    BatchSizeExceeded = 25,
}
