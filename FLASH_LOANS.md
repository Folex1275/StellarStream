# Flash Loan Implementation

## Overview
Flash loans allow external developers to borrow the contract's idle liquidity for a single transaction, generating risk-free revenue for the protocol.

## Features

### 1. Flash Loan Execution
**Function**: `flash_loan(receiver, token, amount, params)`

Allows borrowing any amount of tokens held by the contract, as long as they are returned with a fee in the same transaction.

### 2. Reentrancy Protection
- Uses `FLASH_LOAN_LOCK` to prevent nested flash loans
- Ensures only one flash loan can be active at a time
- Automatically releases lock after execution

### 3. Fee System
**Function**: `set_flash_loan_fee(fee_bps, admin)`
- Default fee: 0.09% (9 basis points)
- Configurable by admin
- Fee stays in contract, increasing liquidity for streams

### 4. Liquidity Query
**Function**: `get_flash_loan_liquidity(token)`
- Returns available balance for flash loans
- Helps borrowers determine maximum loan amount

## How It Works

### Execution Flow:
1. **Check Reentrancy**: Verify no flash loan is in progress
2. **Lock**: Set reentrancy lock
3. **Calculate Fee**: `fee = amount * fee_bps / 10,000`
4. **Record Balance**: Store balance before loan
5. **Transfer**: Send tokens to receiver contract
6. **Execute**: Call receiver's `exec_op` function
7. **Verify**: Check balance >= initial + fee
8. **Unlock**: Release reentrancy lock
9. **Emit Event**: Publish flash loan execution event

### Receiver Contract Interface:
```rust
pub fn exec_op(
    env: Env,
    initiator: Address,  // Flash loan contract
    token: Address,      // Token borrowed
    amount: i128,        // Amount borrowed
    fee: i128,           // Fee to pay
    params: Bytes,       // Custom parameters
) {
    // 1. Use the borrowed tokens
    // 2. Execute arbitrage/liquidation/etc
    // 3. Repay: transfer amount + fee back to initiator
}
```

## Security Features

### 1. Balance Verification
- Checks exact balance before and after
- Requires balance >= initial + fee
- Reverts if not repaid

### 2. Reentrancy Guard
- Prevents nested flash loans
- Protects against reentrancy attacks
- Ensures single execution path

### 3. Amount Validation
- Rejects zero or negative amounts
- Prevents invalid loan requests

## Error Handling

- `FlashLoanInProgress`: Another flash loan is active
- `FlashLoanNotRepaid`: Loan not repaid with fee
- `InvalidAmount`: Zero or negative amount
- `Unauthorized`: Non-admin trying to set fee

## Fee Distribution

Flash loan fees remain in the contract, effectively:
- Increasing total liquidity
- Benefiting all stream participants
- Generating passive income for the protocol

## Use Cases

### 1. Arbitrage
```rust
// Borrow tokens, execute arbitrage, repay with profit
flash_loan(arbitrage_contract, token, 1000000, params)
```

### 2. Liquidations
```rust
// Borrow to liquidate undercollateralized positions
flash_loan(liquidator, token, amount, liquidation_params)
```

### 3. Collateral Swaps
```rust
// Swap collateral without upfront capital
flash_loan(swap_contract, token, amount, swap_params)
```

## Example Implementation

### Receiver Contract:
```rust
#[contract]
pub struct ArbitrageBot;

#[contractimpl]
impl ArbitrageBot {
    pub fn exec_op(
        env: Env,
        initiator: Address,
        token: Address,
        amount: i128,
        fee: i128,
        _params: Bytes,
    ) {
        // 1. Execute arbitrage with borrowed tokens
        let profit = Self::execute_arbitrage(&env, &token, amount);
        
        // 2. Calculate repayment
        let repayment = amount + fee;
        
        // 3. Transfer back to flash loan contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(
            &env.current_contract_address(),
            &initiator,
            &repayment,
        );
        
        // 4. Keep profit
        let remaining = profit - fee;
        // ... handle profit
    }
    
    fn execute_arbitrage(env: &Env, token: &Address, amount: i128) -> i128 {
        // Arbitrage logic here
        // Returns total amount after arbitrage
        amount + 1000 // Example: made 1000 profit
    }
}
```

## Configuration

### Set Fee (Admin Only):
```rust
// Set fee to 0.05% (5 basis points)
client.set_flash_loan_fee(&5, &admin);
```

### Query Available Liquidity:
```rust
let available = client.get_flash_loan_liquidity(&token_address);
```

## Benefits

### For Protocol:
- **Revenue Generation**: Fees from flash loans
- **Capital Efficiency**: Idle capital generates yield
- **No Risk**: Loan must be repaid in same transaction

### For Users:
- **Increased APR**: Flash loan fees boost returns
- **No Lock-up**: Liquidity still available for streams
- **Passive Income**: Earn from others' arbitrage

### For Borrowers:
- **No Collateral**: Borrow without upfront capital
- **Instant Access**: Borrow any available amount
- **Low Cost**: 0.09% fee (default)

## Safety Considerations

1. **Atomic Execution**: Everything happens in one transaction
2. **Automatic Revert**: Failed repayment reverts entire transaction
3. **Reentrancy Protection**: Prevents complex attack vectors
4. **Balance Verification**: Exact balance checking prevents manipulation

## Testing

All existing tests pass (30 tests). The implementation:
- ✅ Maintains backward compatibility
- ✅ Passes formatting checks
- ✅ Passes clippy linting
- ✅ Compiles without warnings

## Future Enhancements

Potential improvements:
- Multi-token flash loans
- Batch flash loans
- Dynamic fee based on utilization
- Flash loan analytics dashboard
