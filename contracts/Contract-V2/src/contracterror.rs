#[soroban_sdk::contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotStreamOwner = 2,
    StreamNotMigratable = 3,
    NothingToMigrate = 4,
    InvalidSignature = 5,
    ExpiredDeadline = 6,
    InvalidNonce = 7,
    InvalidThreshold = 8,
    NotEnoughSigners = 9,
    BelowDustThreshold = 10,
    ContractPaused = 11,
    InsufficientBalance = 12,
    StreamNotFound = 13,
    InvalidTimeRange = 14,
    AlreadyCancelled = 15,
    BatchTooLarge = 16,
    NothingToWithdraw = 17,
    UnauthorizedSender = 18,
    StreamAlreadyExists = 19,
    ContractNotInitialized = 20,
    AdminListNotSet = 21,
    NotExecutionTime = 22,
    OpNotScheduled = 23,
}
