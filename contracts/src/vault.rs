use soroban_sdk::{contractclient, Address, Env};

/// Standard Soroban Lending Vault Interface
/// Compatible with money market protocols
#[allow(dead_code)]
#[contractclient(name = "VaultClient")]
pub trait VaultInterface {
    /// Deposit tokens into vault, returns shares/receipt tokens
    fn deposit(env: Env, from: Address, amount: i128) -> i128;

    /// Withdraw tokens from vault using shares
    fn withdraw(env: Env, to: Address, shares: i128) -> i128;

    /// Get current value of shares in underlying tokens
    fn get_value(env: Env, shares: i128) -> i128;
}

/// Deposit principal into approved vault
pub fn deposit_to_vault(
    env: &Env,
    vault: &Address,
    token: &Address,
    amount: i128,
) -> Result<i128, ()> {
    if amount <= 0 {
        return Err(());
    }

    // Transfer tokens to vault via contract
    let token_client = crate::token::Client::new(env, token);
    token_client.transfer(&env.current_contract_address(), vault, &amount);

    // Call vault deposit and get shares
    let vault_client = VaultClient::new(env, vault);
    let shares = vault_client.deposit(&env.current_contract_address(), &amount);

    if shares <= 0 {
        return Err(());
    }

    Ok(shares)
}

#[allow(dead_code)]
/// Withdraw principal from vault
pub fn withdraw_from_vault(env: &Env, vault: &Address, shares: i128) -> Result<i128, ()> {
    if shares <= 0 {
        return Err(());
    }

    let vault_client = VaultClient::new(env, vault);
    let amount = vault_client.withdraw(&env.current_contract_address(), &shares);

    if amount <= 0 {
        return Err(());
    }

    Ok(amount)
}

/// Get current value of vault shares
#[allow(dead_code)]
pub fn get_vault_value(env: &Env, vault: &Address, shares: i128) -> Result<i128, ()> {
    if shares <= 0 {
        return Ok(0);
    }

    let vault_client = VaultClient::new(env, vault);
    let value = vault_client.get_value(&shares);

    Ok(value)
}
