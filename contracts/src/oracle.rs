use soroban_sdk::{Address, Env};

#[allow(dead_code)]
/// Fetch price from oracle with staleness check
pub fn get_price(env: &Env, oracle: &Address, max_staleness: u64) -> Result<i128, ()> {
    // Call oracle contract to get latest price
    // Oracle interface: get_price() -> (price: i128, timestamp: u64)
    let current_time = env.ledger().timestamp();

    // Invoke oracle contract
    let result: (i128, u64) = env.invoke_contract(
        oracle,
        &soroban_sdk::symbol_short!("price"),
        soroban_sdk::vec![env],
    );

    let (price, timestamp) = result;

    // Check staleness
    if current_time - timestamp > max_staleness {
        return Err(());
    }

    // Validate price is positive
    if price <= 0 {
        return Err(());
    }

    Ok(price)
}

#[allow(dead_code)]
/// Calculate token amount based on USD value and current price
/// usd_amount: USD value with 7 decimals
/// price: Token price in USD with 7 decimals
/// Returns: Token amount with 7 decimals
pub fn calculate_token_amount(usd_amount: i128, price: i128) -> Result<i128, ()> {
    if price <= 0 {
        return Err(());
    }

    // token_amount = (usd_amount * 10^7) / price
    // Both are in 7 decimals, so we multiply by 10^7 to maintain precision
    let numerator = usd_amount.checked_mul(10_000_000).ok_or(())?;
    Ok(numerator / price)
}
