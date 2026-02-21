# Stream Receipt NFT System

## Overview
The Stream Receipt NFT system makes streams tradable and usable as collateral in DeFi protocols. Each stream automatically mints a unique receipt NFT that represents ownership and withdrawal rights.

## Features

### 1. Automatic Receipt Minting
When a stream is created (via `create_stream()` or approved proposal), a unique receipt NFT is automatically minted to the receiver.

```rust
pub struct StreamReceipt {
    pub stream_id: u64,
    pub owner: Address,
    pub minted_at: u64,
}
```

### 2. Transferable Ownership
Receipt owners can transfer their receipt to another address, automatically updating stream withdrawal rights.

```rust
transfer_receipt(stream_id, from, to) -> Result<(), Error>
```

**Effects:**
- Updates `receipt.owner` to new address
- Updates `stream.receipt_owner` to new address
- New owner gains withdrawal rights
- Previous owner loses withdrawal rights

### 3. Receipt-Based Withdrawals
Only the current receipt owner can withdraw from the stream.

```rust
withdraw(stream_id, caller) -> Result<i128, Error>
```

**Validation:**
- Caller must be current receipt owner
- Returns `Error::NotReceiptOwner` if unauthorized

### 4. Receipt Metadata
Query detailed information about a stream via its receipt.

```rust
pub struct ReceiptMetadata {
    pub stream_id: u64,
    pub locked_balance: i128,
    pub unlocked_balance: i128,
    pub total_amount: i128,
    pub token: Address,
}
```

## API Functions

### Create Stream (Mints Receipt)
```rust
create_stream(
    sender: Address,
    receiver: Address,
    token: Address,
    total_amount: i128,
    start_time: u64,
    end_time: u64
) -> Result<u64, Error>
```
**Returns:** stream_id  
**Side Effect:** Mints receipt to receiver

### Transfer Receipt
```rust
transfer_receipt(
    stream_id: u64,
    from: Address,
    to: Address
) -> Result<(), Error>
```
**Authorization:** `from` must authenticate  
**Validation:** `from` must be current owner

### Get Receipt
```rust
get_receipt(stream_id: u64) -> Result<StreamReceipt, Error>
```
**Returns:** Receipt with current owner and mint timestamp

### Get Receipt Metadata
```rust
get_receipt_metadata(stream_id: u64) -> Result<ReceiptMetadata, Error>
```
**Returns:** Real-time stream data including locked/unlocked balances

### Withdraw (Receipt-Based)
```rust
withdraw(stream_id: u64, caller: Address) -> Result<i128, Error>
```
**Authorization:** Caller must be receipt owner  
**Returns:** Amount withdrawn

## Use Cases

### 1. Trading Streams
```rust
// Alice receives a salary stream
let stream_id = create_stream(company, alice, usdc, 100_000, start, end);

// Alice sells the stream to Bob for immediate liquidity
transfer_receipt(stream_id, alice, bob);

// Bob can now withdraw from the stream
withdraw(stream_id, bob);
```

### 2. Collateral in Lending
```rust
// User has a vesting stream
let stream_id = create_stream(dao, user, token, 1_000_000, start, end);

// User transfers receipt to lending protocol as collateral
transfer_receipt(stream_id, user, lending_protocol);

// Protocol can liquidate by withdrawing if loan defaults
withdraw(stream_id, lending_protocol);
```

### 3. Stream Marketplace
```rust
// Query stream value before purchase
let metadata = get_receipt_metadata(stream_id);
let value = metadata.unlocked_balance + metadata.locked_balance;

// Verify ownership
let receipt = get_receipt(stream_id);
assert_eq!(receipt.owner, seller);

// Purchase stream
transfer_receipt(stream_id, seller, buyer);
```

## Security Features

### 1. Ownership Verification
All withdrawal and transfer operations verify receipt ownership.

### 2. Atomic Updates
Receipt transfer atomically updates both receipt and stream state.

### 3. Immutable Stream ID
Receipt is permanently linked to its stream via `stream_id`.

### 4. Cancellation Rights
Both sender and receipt owner can cancel streams:
```rust
cancel(stream_id, caller) -> Result<(), Error>
```
- Sender can cancel to reclaim unvested funds
- Receipt owner can cancel to claim vested funds

## Integration Example

### DeFi Protocol Integration
```rust
// Protocol accepts stream receipts as collateral
pub fn deposit_collateral(stream_id: u64, user: Address) {
    // Verify user owns receipt
    let receipt = get_receipt(stream_id);
    require(receipt.owner == user);
    
    // Get collateral value
    let metadata = get_receipt_metadata(stream_id);
    let collateral_value = calculate_value(metadata);
    
    // Transfer receipt to protocol
    transfer_receipt(stream_id, user, protocol_address);
    
    // Issue loan based on collateral
    issue_loan(user, collateral_value);
}
```

## Error Handling

| Error | Code | Description |
|-------|------|-------------|
| NotReceiptOwner | 13 | Caller is not the receipt owner |
| StreamNotFound | 4 | Invalid stream_id or receipt not found |

## Gas Optimization

- Receipt stored as single struct (minimal storage)
- Transfer updates only 2 storage entries
- No loops or complex computations

## Backward Compatibility

- Existing `Stream` struct extended with `receipt_owner` field
- All existing functions remain compatible
- Receipt system is transparent to basic stream operations

## Future Enhancements

1. **Fractional Receipts**: Split receipts for partial stream ownership
2. **Receipt Metadata URI**: Link to off-chain metadata (images, descriptions)
3. **Receipt Royalties**: Automatic fees on secondary sales
4. **Batch Transfers**: Transfer multiple receipts in one transaction
