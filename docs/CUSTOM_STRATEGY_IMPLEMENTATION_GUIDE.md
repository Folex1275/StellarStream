# Custom-Strategy Implementation Guide

This guide provides advanced developers with the knowledge to extend the StellarStream V3 contract logic using custom "hooks" or external strategies. These extensions enable sophisticated features like tax withholding, automated yield distribution, and other programmable behaviors that execute during split operations.

## Overview

The V3 splitter contract supports extensibility through cross-contract calls, allowing developers to implement custom strategies that modify or enhance the standard split behavior. This is achieved by:

1. **Pre-Split Hooks**: Execute custom logic before funds are distributed
2. **Post-Split Hooks**: Execute custom logic after funds are distributed
3. **Strategy Contracts**: External contracts that implement specific behaviors

## Cross-Contract Calls to V3 Entry Points

### Core Entry Points

The V3 contract exposes several entry points that can be called from external contracts:

#### `split`
```rust
pub fn split(
    env: Env,
    sender: Address,
    recipients: Vec<Recipient>,
    total_amount: i128,
    affiliate: Option<Address>,
    salt: BytesN<32>,
) -> Result<(), Error>
```

**Parameters:**
- `sender`: The address initiating the split
- `recipients`: Vector of `Recipient` structs with address and share_bps
- `total_amount`: Total amount to split (in token base units)
- `affiliate`: Optional affiliate address for referral fees
- `salt`: 32-byte salt for idempotency

#### `split_funds`
```rust
pub fn split_funds(
    env: Env,
    sender: Address,
    asset_address: Address,
    recipients: Vec<Recipient>,
    total_amount: i128,
    mode: SplitMode,
) -> Result<(), Error>
```

**Parameters:**
- `sender`: The address initiating the split
- `asset_address`: SAC token contract address
- `recipients`: Vector of recipients with BPS shares
- `total_amount`: Total amount to distribute
- `mode`: `SplitMode::Push` or `SplitMode::Pull`

#### `split_multi_asset`
```rust
pub fn split_multi_asset(
    env: Env,
    sender: Address,
    asset_groups: Vec<AssetGroup>,
) -> Result<(), Error>
```

**Parameters:**
- `sender`: The address initiating the multi-asset split
- `asset_groups`: Vector of `AssetGroup` structs containing asset address, recipients, and amounts

### Cross-Contract Invocation

To call V3 functions from your custom strategy contract:

```rust
use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

#[contract]
pub struct TaxWithholdingStrategy;

#[contractimpl]
impl TaxWithholdingStrategy {
    pub fn execute_with_tax_withholding(
        env: Env,
        v3_splitter: Address,
        sender: Address,
        recipients: Vec<Recipient>,
        total_amount: i128,
        tax_rate_bps: u32,
    ) -> Result<(), Error> {
        // Calculate tax amount
        let tax_amount = (total_amount * tax_rate_bps as i128) / 10_000;

        // Calculate amount after tax
        let distributable_amount = total_amount - tax_amount;

        // Adjust recipient shares proportionally
        let mut adjusted_recipients = Vec::new(&env);
        for recipient in recipients.iter() {
            let adjusted_amount = (distributable_amount * recipient.share_bps as i128) / 10_000;
            // Note: In practice, you'd need to convert back to BPS or use a different approach
        }

        // Call V3 splitter
        let splitter_client = SplitterV3Client::new(&env, &v3_splitter);
        splitter_client.split(&sender, &adjusted_recipients, &distributable_amount, &None, &salt);

        Ok(())
    }
}
```

## Strategy Examples

### 1. Tax Withholding Strategy

This strategy automatically withholds taxes from distributions and sends them to a designated tax authority wallet.

```rust
#[contract]
pub struct TaxWithholdingStrategy;

#[contracttype]
#[derive(Clone)]
pub struct TaxConfig {
    pub tax_rate_bps: u32,        // Tax rate in basis points (e.g., 2500 = 25%)
    pub tax_authority: Address,   // Address to receive tax payments
    pub jurisdiction: Bytes,      // Tax jurisdiction identifier
}

#[contractimpl]
impl TaxWithholdingStrategy {
    pub fn initialize(env: Env, config: TaxConfig) {
        env.storage().instance().set(&DataKey::TaxConfig, &config);
    }

    pub fn split_with_tax_withholding(
        env: Env,
        v3_splitter: Address,
        sender: Address,
        recipients: Vec<Recipient>,
        total_amount: i128,
        salt: BytesN<32>,
    ) -> Result<(), Error> {
        let config: TaxConfig = env.storage().instance().get(&DataKey::TaxConfig)
            .ok_or(Error::NotInitialized)?;

        // Calculate tax amount
        let tax_amount = (total_amount * config.tax_rate_bps as i128) / 10_000;

        // Send tax to authority
        let token_addr = // Get token address from V3 contract
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&sender, &config.tax_authority, &tax_amount);

        // Calculate distributable amount
        let distributable = total_amount - tax_amount;

        // Adjust recipient shares to account for withheld tax
        let mut adjusted_recipients = Vec::new(&env);
        for recipient in recipients.iter() {
            // Recalculate BPS based on new total
            let recipient_amount = (distributable * recipient.share_bps as i128) / 10_000;
            let new_bps = ((recipient_amount * 10_000) / distributable) as u32;
            adjusted_recipients.push_back(Recipient {
                address: recipient.address.clone(),
                share_bps: new_bps,
            });
        }

        // Execute split with adjusted amounts
        let splitter_client = SplitterV3Client::new(&env, &v3_splitter);
        splitter_client.split(&sender, &adjusted_recipients, &distributable, &None, &salt);

        // Emit tax withholding event
        env.events().publish(
            (symbol_short!("taxwth"), sender),
            (tax_amount, config.jurisdiction)
        );

        Ok(())
    }
}
```

### 2. Automated Yield Strategy

This strategy automatically compounds yield from yield-bearing assets before distribution.

```rust
#[contract]
pub struct AutomatedYieldStrategy;

#[contracttype]
#[derive(Clone)]
pub struct YieldConfig {
    pub yield_vault: Address,     // Address of yield-generating vault
    pub compounding_threshold: i128, // Minimum amount to trigger compounding
    pub yield_asset: Address,    // Asset that generates yield
}

#[contractimpl]
impl AutomatedYieldStrategy {
    pub fn split_with_yield_compounding(
        env: Env,
        v3_splitter: Address,
        sender: Address,
        recipients: Vec<Recipient>,
        principal_amount: i128,
        salt: BytesN<32>,
    ) -> Result<(), Error> {
        let config: YieldConfig = env.storage().instance().get(&DataKey::YieldConfig)
            .ok_or(Error::NotInitialized)?;

        // Deposit principal into yield vault
        let vault_client = YieldVaultClient::new(&env, &config.yield_vault);
        vault_client.deposit(&sender, &principal_amount);

        // Check if yield meets compounding threshold
        let current_yield = vault_client.get_yield_balance(&sender);
        let total_amount = if current_yield >= config.compounding_threshold {
            // Compound yield into principal
            vault_client.compound_yield(&sender);
            principal_amount + current_yield
        } else {
            principal_amount
        };

        // Execute split with compounded amount
        let splitter_client = SplitterV3Client::new(&env, &v3_splitter);
        splitter_client.split(&sender, &recipients, &total_amount, &None, &salt);

        // Emit yield event
        env.events().publish(
            (symbol_short!("yldcmp"), sender),
            (current_yield, total_amount)
        );

        Ok(())
    }
}
```

### 3. Conditional Split Strategy

This strategy only executes splits when certain conditions are met (e.g., oracle price thresholds).

```rust
#[contract]
pub struct ConditionalSplitStrategy;

#[contracttype]
#[derive(Clone)]
pub struct ConditionConfig {
    pub price_oracle: Address,
    pub minimum_price: i128,
    pub asset_pair: Bytes,        // Asset pair identifier (e.g., "XLM/USD")
}

#[contractimpl]
impl ConditionalSplitStrategy {
    pub fn conditional_split(
        env: Env,
        v3_splitter: Address,
        sender: Address,
        recipients: Vec<Recipient>,
        total_amount: i128,
        salt: BytesN<32>,
    ) -> Result<(), Error> {
        let config: ConditionConfig = env.storage().instance().get(&DataKey::ConditionConfig)
            .ok_or(Error::NotInitialized)?;

        // Check price condition via oracle
        let oracle_client = PriceOracleClient::new(&env, &config.price_oracle);
        let current_price = oracle_client.get_price(&config.asset_pair);

        if current_price < config.minimum_price {
            return Err(Error::ConditionNotMet);
        }

        // Condition met, execute split
        let splitter_client = SplitterV3Client::new(&env, &v3_splitter);
        splitter_client.split(&sender, &recipients, &total_amount, &None, &salt);

        // Emit condition check event
        env.events().publish(
            (symbol_short!("condmet"), sender),
            (current_price, config.minimum_price)
        );

        Ok(())
    }
}
```

## Local Testing with Soroban Environment

### Setting Up the Test Environment

1. **Install Soroban CLI:**
```bash
cargo install soroban-cli
```

2. **Initialize a new project:**
```bash
soroban contract init custom-strategy-test
cd custom-strategy-test
```

3. **Add dependencies to Cargo.toml:**
```toml
[dependencies]
soroban-sdk = "20.0.0"
splitter-v3 = { path = "../contracts/splitter-v3" }
```

### Writing Tests

```rust
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Env as _};
    use splitter_v3::{SplitterV3, SplitterV3Client};

    #[test]
    fn test_tax_withholding_strategy() {
        let env = Env::default();
        let strategy_id = env.register_contract(None, TaxWithholdingStrategy);
        let strategy_client = TaxWithholdingStrategyClient::new(&env, &strategy_id);

        // Deploy V3 splitter contract
        let splitter_id = env.register_contract_wasm(None, splitter_v3::WASM);
        let splitter_client = SplitterV3Client::new(&env, &splitter_id);

        // Initialize contracts
        let admin = Address::generate(&env);
        let token = Address::generate(&env);
        let treasury = Address::generate(&env);

        splitter_client.initialize(&admin, &token, &100, &treasury, &vec![&env], &vec![&env]);

        // Initialize tax strategy
        let tax_config = TaxConfig {
            tax_rate_bps: 2500, // 25%
            tax_authority: Address::generate(&env),
            jurisdiction: Bytes::from_slice(&env, b"US"),
        };
        strategy_client.initialize(&tax_config);

        // Create test recipients
        let recipient1 = Recipient {
            address: Address::generate(&env),
            share_bps: 5000,
        };
        let recipient2 = Recipient {
            address: Address::generate(&env),
            share_bps: 5000,
        };
        let recipients = vec![&env, recipient1, recipient2];

        // Execute strategy
        let sender = Address::generate(&env);
        let total_amount = 100_000_000; // 1 XLM
        let salt = BytesN::from_array(&env, &[0; 32]);

        strategy_client.split_with_tax_withholding(
            &splitter_id,
            &sender,
            &recipients,
            &total_amount,
            &salt,
        );

        // Verify tax was withheld (25% = 25_000_000 stroops)
        // Verify recipients received adjusted amounts
    }
}
```

### Running Tests

```bash
# Run unit tests
cargo test

# Run with Soroban test environment
soroban contract test
```

### Integration Testing

For more comprehensive testing that includes actual contract deployment:

```rust
#[test]
fn test_cross_contract_integration() {
    let env = Env::default();

    // Deploy token contract
    let token_id = env.register_contract_wasm(None, sac_token::WASM);
    let token_client = token::Client::new(&env, &token_id);

    // Deploy V3 splitter
    let splitter_id = env.register_contract_wasm(None, splitter_v3::WASM);
    let splitter_client = SplitterV3Client::new(&env, &splitter_id);

    // Deploy custom strategy
    let strategy_id = env.register_contract(None, TaxWithholdingStrategy);
    let strategy_client = TaxWithholdingStrategyClient::new(&env, &strategy_id);

    // Initialize all contracts
    // ... initialization code ...

    // Mint tokens to sender
    let sender = Address::generate(&env);
    token_client.mint(&sender, &1_000_000_000); // 10 XLM

    // Execute strategy
    // ... execution code ...

    // Assert final balances
    assert_eq!(token_client.balance(&sender), expected_sender_balance);
    assert_eq!(token_client.balance(&tax_authority), expected_tax_amount);
}
```

## Security Considerations

### 1. Reentrancy Protection
Always implement reentrancy guards when making cross-contract calls:

```rust
#[contracttype]
pub enum DataKey {
    ReentrancyGuard,
}

fn with_reentrancy_guard<F, T>(env: &Env, f: F) -> Result<T, Error>
where
    F: FnOnce() -> Result<T, Error>,
{
    if env.storage().instance().has(&DataKey::ReentrancyGuard) {
        return Err(Error::ReentrantCall);
    }
    env.storage().instance().set(&DataKey::ReentrancyGuard, &true);
    let result = f();
    env.storage().instance().remove(&DataKey::ReentrancyGuard);
    result
}
```

### 2. Access Control
Implement proper authorization checks:

```rust
fn require_authorized_strategy(env: &Env, caller: &Address) -> Result<(), Error> {
    let authorized_strategies: Vec<Address> = env.storage()
        .instance()
        .get(&DataKey::AuthorizedStrategies)
        .unwrap_or(Vec::new(env));

    if !authorized_strategies.contains(caller) {
        return Err(Error::UnauthorizedStrategy);
    }
    Ok(())
}
```

### 3. Gas Limits
Be aware of Soroban transaction gas limits when implementing complex strategies.

## Best Practices

1. **Keep Strategies Simple**: Complex logic increases gas costs and potential for bugs
2. **Use Events**: Emit comprehensive events for transparency and debugging
3. **Test Thoroughly**: Cover edge cases, especially around rounding and overflow
4. **Document Interfaces**: Clearly document all public functions and their parameters
5. **Version Control**: Implement versioning for strategy upgrades

## Conclusion

Custom strategies enable powerful extensions to the V3 splitter protocol. By following the patterns outlined in this guide, developers can create sophisticated financial instruments that leverage the atomicity and security of the Soroban environment.

For more examples and community-contributed strategies, check the StellarStream documentation repository.</content>
<parameter name="filePath">/home/semicolon/Desktop/Drip/StellarStream/docs/CUSTOM_STRATEGY_IMPLEMENTATION_GUIDE.md