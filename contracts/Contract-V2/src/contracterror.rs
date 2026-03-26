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
    NotBeneficiary = 24,
    VaultPaused = 25,
    /// refill_stream called before the current cycle has ended
    StreamNotExpired = 26,
    /// refill_stream called on a non-recurrent stream
    NotRecurrent = 27,
    /// No treasury address configured; admin must call set_treasury first
    NoTreasury = 28,
    /// Token is not approved for V2 stream creation
    AssetNotWhitelisted = 29,
    /// penalty_bps exceeds 10000 (100%)
    InvalidPenalty = 30,
    /// migrate_stream is blocked; standard V2 streams remain active.
    MigrationPaused = 31,
    /// Relayer fee exceeds the available withdrawal amount
    InvalidRelayerFee = 32,
    /// Stream request not found
    StreamRequestNotFound = 33,
    /// Stream request already approved by this admin
    AlreadyApproved = 34,
    /// Stream request has already been executed
    StreamRequestAlreadyExecuted = 35,
    /// Overflow in arithmetic operation
    Overflow = 36,
    /// Invalid metadata format for bridge-in
    InvalidBridgeMetadata = 37,
    /// No receiver address in bridge metadata
    MissingReceiverAddress = 38,
    /// No duration in bridge metadata
    MissingDuration = 39,
    /// Invalid duration value in bridge metadata
    InvalidDuration = 40,
}
