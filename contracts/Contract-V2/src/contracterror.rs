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
    /// Contract is in emergency (withdraw-only) mode; new capital cannot enter
    EmergencyMode = 41,
    /// V1 stream has already been migrated; replay attack prevented
    AlreadyMigrated = 42,
    /// Caller's DAO voting power is below the required threshold
    InsufficientVotingPower = 43,
    /// DAO token contract address not configured
    DaoTokenNotSet = 44,
    /// Treasury split is still within the 48-hour timelock window
    TreasurySplitTimelocked = 45,
    /// No pending treasury split found for this ID
    PendingTreasurySplitNotFound = 46,
    /// Treasury split has already been executed
    TreasurySplitAlreadyExecuted = 47,
    /// Reentrancy detected: contract is already executing a multi-transfer
    Reentrant = 48,
    /// Stream not fully withdrawn: cannot archive until withdrawn_amount == total_amount
    StreamNotFullyWithdrawn = 49,
    /// Fee exceeds protocol maximum (protects users from excessive admin-set fees)
    FeeTooHigh = 50,
    /// DEX contract address not configured for swap operations
    DexNotConfigured = 51,
    /// Swap failed - output amount below minimum slippage tolerance
    SwapSlippageExceeded = 52,
    /// Invalid swap parameters (e.g., zero amount or invalid deadline)
    InvalidSwapParams = 53,
    /// Swap execution failed in DEX
    SwapFailed = 54,
    /// Source and destination assets are the same
    SameAsset = 55,
    /// Invalid slippage tolerance (must be between 0 and 10000 bps = 100%)
    InvalidSlippageTolerance = 56,
    // Issue #377 — Push-Pull Rate Re-balancing
    /// No pending rate update exists for this stream
    NoPendingUpdate = 57,
    /// A rate update proposal already exists for this stream
    PendingUpdateExists = 58,
    /// Rate update proposal has expired (7-day TTL exceeded)
    UpdateExpired = 59,
    /// New rate must be greater than zero
    InvalidNewRate = 60,
    /// Sender has insufficient balance for the rate change
    InsufficientBalanceForNewRate = 61,
    /// Only the stream receiver can accept a rate update
    NotReceiver = 62,
    /// Stream is not active (already completed or cancelled)
    StreamNotActive = 63,
    // Issue #409 — Pre-Flight Simulation Helper
    /// Simulation: Sender has insufficient balance for the stream
    SimulationInsufficientBalance = 64,
    /// Simulation: Stream creation would exceed storage limits
    SimulationStorageLimitExceeded = 65,
    /// Simulation: Invalid parameters for stream creation
    SimulationInvalidParams = 66,
}
