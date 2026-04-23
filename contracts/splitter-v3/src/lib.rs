#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, Vec,
};

mod errors;
mod storage;
use errors::Error;
use storage::DataKey;

#[cfg(test)]
mod test;

// ── Public types ─────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct Recipient {
    pub address: Address,
    pub share_bps: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct PercentRecipient {
    pub address: Address,
    pub bps: u32,
}

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum AdminAction {
    UpdateFee(u32),
    UpdateCollector(Address),
}

#[contracttype]
#[derive(Clone)]
pub struct Proposal {
    pub action: AdminAction,
    pub approvals: Vec<Address>,
    pub executed: bool,
}

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum SplitStatus {
    Pending,
    Executed,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct SplitConfig {
    pub sender: Address,
    pub recipients: Vec<Recipient>,
    pub total_amount: i128,
    pub release_time: u64,
    pub status: SplitStatus,
}

/// #922: Protocol-wide circuit-breaker state.
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum ContractState {
    Active,
    Paused,
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct SplitterV3;

#[contractimpl]
impl SplitterV3 {
    // ── Initialization ────────────────────────────────────────────────────────

    pub fn initialize(
        env: Env,
        owner: Address,
        token: Address,
        fee_bps: u32,
        treasury: Address,
        quorum_admins: Vec<Address>,
        council_keys: Vec<Address>,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        owner.require_auth();
        env.storage().instance().set(&DataKey::Admin, &owner);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::StrictMode, &false);
        env.storage().instance().set(&DataKey::NextProposalId, &0u64);
        env.storage().instance().set(&DataKey::QuorumAdmins, &quorum_admins);
        env.storage().instance().set(&DataKey::NextSplitId, &0u64);
        env.storage().instance().set(&DataKey::CouncilKeys, &council_keys);
        // #922: start Active
        env.storage().instance().set(&DataKey::ContractState, &ContractState::Active);
        Self::_set_verified(&env, &owner, true);
        for addr in quorum_admins.iter() {
            Self::_set_verified(&env, &addr, true);
        }
        Ok(())
    }

    // ── #922: Circuit-breaker ─────────────────────────────────────────────────

    pub fn pause(env: Env) -> Result<(), Error> {
        Self::_require_admin(&env)?;
        env.storage().instance().set(&DataKey::ContractState, &ContractState::Paused);
        env.events().publish((symbol_short!("paused"),), true);
        Ok(())
    }

    pub fn unpause(env: Env) -> Result<(), Error> {
        Self::_require_admin(&env)?;
        env.storage().instance().set(&DataKey::ContractState, &ContractState::Active);
        env.events().publish((symbol_short!("paused"),), false);
        Ok(())
    }

    // ── #919: Affiliate config ────────────────────────────────────────────────

    /// Set the protocol-level affiliate address and their fee in basis points.
    pub fn set_affiliate(env: Env, affiliate: Address, bps: u32) -> Result<(), Error> {
        Self::_require_admin(&env)?;
        env.storage().instance().set(&DataKey::AffiliateAddress, &affiliate);
        env.storage().instance().set(&DataKey::AffiliateBps, &bps);
        Ok(())
    }

    /// Affiliate (or anyone) calls this to pull their pending balance.
    pub fn withdraw_affiliate(env: Env, caller: Address) -> Result<(), Error> {
        caller.require_auth();
        let amount: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::PendingWithdrawal(caller.clone()))
            .unwrap_or(0);
        if amount <= 0 {
            return Err(Error::NothingToClaim);
        }
        env.storage().persistent().set(&DataKey::PendingWithdrawal(caller.clone()), &0i128);
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &caller, &amount);
        env.events().publish((symbol_short!("aff_out"), caller), amount);
        Ok(())
    }

    // ── #633: Verification management ────────────────────────────────────────

    pub fn set_verification_status(env: Env, user: Address, status: bool) -> Result<(), Error> {
        Self::_require_admin(&env)?;
        Self::_set_verified(&env, &user, status);
        env.events().publish((symbol_short!("verified"), user.clone()), status);
        Ok(())
    }

    pub fn set_strict_mode(env: Env, strict: bool) -> Result<(), Error> {
        Self::_require_admin(&env)?;
        env.storage().instance().set(&DataKey::StrictMode, &strict);
        Ok(())
    }

    // ── #634: Quorum — propose ────────────────────────────────────────────────

    pub fn propose_change(env: Env, caller: Address, action: AdminAction) -> Result<u64, Error> {
        caller.require_auth();
        Self::_require_quorum_admin(&env, &caller)?;
        let id: u64 = env.storage().instance().get(&DataKey::NextProposalId).unwrap_or(0);
        let mut approvals: Vec<Address> = Vec::new(&env);
        approvals.push_back(caller);
        let proposal = Proposal { action, approvals, executed: false };
        env.storage().persistent().set(&DataKey::Proposal(id), &proposal);
        env.storage().instance().set(&DataKey::NextProposalId, &(id + 1));
        Ok(id)
    }

    pub fn approve_proposal(env: Env, caller: Address, proposal_id: u64) -> Result<(), Error> {
        caller.require_auth();
        Self::_require_quorum_admin(&env, &caller)?;
        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(Error::ProposalNotFound)?;
        if proposal.executed {
            return Err(Error::AlreadyExecuted);
        }
        for existing in proposal.approvals.iter() {
            if existing == caller {
                return Err(Error::AlreadyApproved);
            }
        }
        proposal.approvals.push_back(caller);
        env.storage().persistent().set(&DataKey::Proposal(proposal_id), &proposal);
        Ok(())
    }

    pub fn execute_proposal(env: Env, caller: Address, proposal_id: u64) -> Result<(), Error> {
        caller.require_auth();
        Self::_require_quorum_admin(&env, &caller)?;
        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(Error::ProposalNotFound)?;
        if proposal.executed { return Err(Error::AlreadyExecuted); }
        if proposal.approvals.len() < 2 { return Err(Error::QuorumNotReached); }
        match proposal.action.clone() {
            AdminAction::UpdateFee(new_bps) => {
                env.storage().instance().set(&DataKey::FeeBps, &new_bps);
            }
            AdminAction::UpdateCollector(new_treasury) => {
                env.storage().instance().set(&DataKey::Treasury, &new_treasury);
            }
        }
        proposal.executed = true;
        env.storage().persistent().set(&DataKey::Proposal(proposal_id), &proposal);
        env.events().publish((symbol_short!("settings"), proposal_id), proposal.action);
        Ok(())
    }

    // ── Core: split ───────────────────────────────────────────────────────────

    pub fn split(
        env: Env,
        sender: Address,
        recipients: Vec<Recipient>,
        total_amount: i128,
        affiliate: Option<Address>,
    ) -> Result<(), Error> {
        Self::_require_not_paused(&env)?;
        sender.require_auth();
        let strict: bool = env.storage().instance().get(&DataKey::StrictMode).unwrap_or(false);
        let mut bps_sum: u32 = 0;
        for r in recipients.iter() {
            bps_sum = bps_sum.checked_add(r.share_bps).ok_or(Error::Overflow)?;
        }
        if bps_sum != 10_000 { return Err(Error::InvalidSplit); }
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        let contract_addr = env.current_contract_address();
        token_client.transfer(&sender, &contract_addr, &total_amount);
        let affiliate_amount = if let Some(ref affiliate_addr) = affiliate {
            let a = total_amount.checked_mul(10).ok_or(Error::Overflow)? / 10_000;
            if a > 0 {
                token_client.transfer(&contract_addr, affiliate_addr, &a);
                env.events().publish((symbol_short!("affiliate"),), a);
            }
            a
        } else { 0 };
        let after_affiliate = total_amount.checked_sub(affiliate_amount).ok_or(Error::Overflow)?;
        let fee_bps: u32 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0);
        let fee_amount = if fee_bps > 0 {
            let f = after_affiliate.checked_mul(fee_bps as i128).ok_or(Error::Overflow)? / 10_000;
            let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
            if f > 0 { token_client.transfer(&contract_addr, &treasury, &f); }
            f
        } else { 0 };
        let distributable = after_affiliate.checked_sub(fee_amount).ok_or(Error::Overflow)?;
        if strict {
            for r in recipients.iter() {
                if !Self::is_verified(&env, r.address.clone()) {
                    return Err(Error::RecipientNotVerified);
                }
            }
            Self::_distribute(&env, &token_client, &contract_addr, &recipients, distributable)?;
        } else {
            let mut verified: Vec<Recipient> = Vec::new(&env);
            let mut verified_bps: u32 = 0;
            for r in recipients.iter() {
                if Self::is_verified(&env, r.address.clone()) {
                    verified_bps = verified_bps.checked_add(r.share_bps).ok_or(Error::Overflow)?;
                    verified.push_back(r);
                }
            }
            if verified.is_empty() { return Err(Error::NoVerifiedRecipients); }
            let mut scaled: Vec<Recipient> = Vec::new(&env);
            for r in verified.iter() {
                let new_bps = (r.share_bps as u64)
                    .checked_mul(10_000)
                    .ok_or(Error::Overflow)? as u32
                    / verified_bps;
                scaled.push_back(Recipient { address: r.address.clone(), share_bps: new_bps });
            }
            Self::_distribute(&env, &token_client, &contract_addr, &scaled, distributable)?;
        }
        Ok(())
    }

    // ── Scheduled splits ──────────────────────────────────────────────────────

    pub fn schedule_split(
        env: Env,
        sender: Address,
        recipients: Vec<Recipient>,
        total_amount: i128,
        release_time: u64,
    ) -> Result<u64, Error> {
        Self::_require_not_paused(&env)?;
        sender.require_auth();
        let mut bps_sum: u32 = 0;
        for r in recipients.iter() {
            bps_sum = bps_sum.checked_add(r.share_bps).ok_or(Error::Overflow)?;
        }
        if bps_sum != 10_000 { return Err(Error::InvalidSplit); }
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&sender, &env.current_contract_address(), &total_amount);
        let split_id: u64 = env.storage().instance().get(&DataKey::NextSplitId).unwrap_or(0);
        env.storage().instance().set(&DataKey::NextSplitId, &(split_id + 1));
        let config = SplitConfig { sender, recipients, total_amount, release_time, status: SplitStatus::Pending };
        env.storage().persistent().set(&DataKey::ScheduledSplit(split_id), &config);
        env.events().publish((symbol_short!("sched"), split_id), release_time);
        Ok(split_id)
    }

    pub fn execute_split(env: Env, split_id: u64) -> Result<(), Error> {
        Self::_require_not_paused(&env)?;
        let mut config: SplitConfig = env
            .storage().persistent().get(&DataKey::ScheduledSplit(split_id))
            .ok_or(Error::SplitNotFound)?;
        match config.status {
            SplitStatus::Cancelled => return Err(Error::SplitAlreadyCancelled),
            SplitStatus::Executed  => return Err(Error::SplitAlreadyExecuted),
            SplitStatus::Pending   => {}
        }
        if env.ledger().timestamp() < config.release_time { return Err(Error::NotYetReleased); }
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        let contract_addr = env.current_contract_address();
        let fee_bps: u32 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0);
        let fee_amount = if fee_bps > 0 {
            let f = config.total_amount.checked_mul(fee_bps as i128).ok_or(Error::Overflow)? / 10_000;
            let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
            if f > 0 { token_client.transfer(&contract_addr, &treasury, &f); }
            f
        } else { 0 };
        let distributable = config.total_amount.checked_sub(fee_amount).ok_or(Error::Overflow)?;
        Self::_distribute(&env, &token_client, &contract_addr, &config.recipients, distributable)?;
        config.status = SplitStatus::Executed;
        env.storage().persistent().set(&DataKey::ScheduledSplit(split_id), &config);
        Ok(())
    }

    pub fn cancel_split(env: Env, caller: Address, split_id: u64) -> Result<(), Error> {
        caller.require_auth();
        let mut config: SplitConfig = env
            .storage().persistent().get(&DataKey::ScheduledSplit(split_id))
            .ok_or(Error::SplitNotFound)?;
        if config.sender != caller { return Err(Error::NotSplitSender); }
        match config.status {
            SplitStatus::Cancelled => return Err(Error::SplitAlreadyCancelled),
            SplitStatus::Executed  => return Err(Error::SplitAlreadyExecuted),
            SplitStatus::Pending   => {}
        }
        if env.ledger().timestamp() >= config.release_time { return Err(Error::SplitNotYetDue); }
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &config.sender, &config.total_amount);
        config.status = SplitStatus::Cancelled;
        env.storage().persistent().set(&DataKey::ScheduledSplit(split_id), &config);
        env.events().publish((symbol_short!("cancel"), split_id), config.sender);
        Ok(())
    }

    pub fn get_split(env: Env, split_id: u64) -> Option<SplitConfig> {
        env.storage().persistent().get(&DataKey::ScheduledSplit(split_id))
    }

    // ── Pull-based (claimable) splits ─────────────────────────────────────────

    pub fn split_pull(
        env: Env,
        sender: Address,
        recipients: Vec<Recipient>,
        total_amount: i128,
        affiliate: Option<Address>,
    ) -> Result<(), Error> {
        Self::_require_not_paused(&env)?;
        sender.require_auth();
        let mut bps_sum: u32 = 0;
        for r in recipients.iter() {
            bps_sum = bps_sum.checked_add(r.share_bps).ok_or(Error::Overflow)?;
        }
        if bps_sum != 10_000 { return Err(Error::InvalidSplit); }
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        let contract_addr = env.current_contract_address();
        token_client.transfer(&sender, &contract_addr, &total_amount);
        let affiliate_amount = if let Some(ref affiliate_addr) = affiliate {
            let a = total_amount.checked_mul(10).ok_or(Error::Overflow)? / 10_000;
            if a > 0 {
                token_client.transfer(&contract_addr, affiliate_addr, &a);
                env.events().publish((symbol_short!("affiliate"),), a);
            }
            a
        } else { 0 };
        let after_affiliate = total_amount.checked_sub(affiliate_amount).ok_or(Error::Overflow)?;
        let fee_bps: u32 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0);
        let fee_amount = if fee_bps > 0 {
            let f = after_affiliate.checked_mul(fee_bps as i128).ok_or(Error::Overflow)? / 10_000;
            let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
            if f > 0 { token_client.transfer(&contract_addr, &treasury, &f); }
            f
        } else { 0 };
        let distributable = after_affiliate.checked_sub(fee_amount).ok_or(Error::Overflow)?;
        for r in recipients.iter() {
            let share = distributable
                .checked_mul(r.share_bps as i128)
                .ok_or(Error::Overflow)?
                / 10_000;
            if share > 0 {
                Self::_credit_claimable(&env, &r.address, &token_addr, share)?;
            }
        }
        env.events().publish((symbol_short!("pullsplit"),), distributable);
        Ok(())
    }

    pub fn claim_share(env: Env, caller: Address, asset: Address) -> Result<(), Error> {
        caller.require_auth();
        let key = DataKey::ClaimableBalance(caller.clone(), asset.clone());
        let amount: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        if amount <= 0 { return Err(Error::NothingToClaim); }
        env.storage().persistent().set(&key, &0i128);
        let token_client = token::Client::new(&env, &asset);
        token_client.transfer(&env.current_contract_address(), &caller, &amount);
        env.events().publish((symbol_short!("claimed"), caller), amount);
        Ok(())
    }

    pub fn claimable_balance(env: Env, recipient: Address, asset: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::ClaimableBalance(recipient, asset))
            .unwrap_or(0)
    }

    // ── split_funds: #919 affiliate + #920 chunked + #922 pause guard ─────────
    //
    // #920: If recipients.len() > 50 the call processes one chunk of 50 per
    // invocation, persisting `SplitFundsNextIndex` in instance storage and
    // bumping the instance TTL so state survives across ledgers.
    // The caller must re-invoke until the function returns Ok(()) with the
    // index reset to 0 (all chunks done).
    //
    // #919: Before distributing to recipients the contract-level affiliate
    // (set via `set_affiliate`) receives their bps share, credited to their
    // `PendingWithdrawal` map entry (pull pattern).

    pub fn split_funds(
        env: Env,
        sender: Address,
        asset: Address,
        recipients: Vec<Recipient>,
        total_amount: i128,
    ) -> Result<(), Error> {
        Self::_require_not_paused(&env)?;
        sender.require_auth();
        if recipients.is_empty() { return Err(Error::EmptyRecipients); }

        let token_client = token::Client::new(&env, &asset);
        let _ = token_client.decimals();
        let contract_addr = env.current_contract_address();

        // Only pull tokens on the first chunk (next_index == 0).
        let next_index: u32 = env
            .storage()
            .instance()
            .get(&DataKey::SplitFundsNextIndex)
            .unwrap_or(0);

        if next_index == 0 {
            token_client.transfer(&sender, &contract_addr, &total_amount);

            // #919: credit affiliate pending withdrawal before distribution.
            if let Some(aff_addr) = env
                .storage()
                .instance()
                .get::<DataKey, Address>(&DataKey::AffiliateAddress)
            {
                let aff_bps: u32 = env
                    .storage()
                    .instance()
                    .get(&DataKey::AffiliateBps)
                    .unwrap_or(0);
                if aff_bps > 0 {
                    let aff_amount = total_amount
                        .checked_mul(aff_bps as i128)
                        .ok_or(Error::Overflow)?
                        / 10_000;
                    if aff_amount > 0 {
                        let key = DataKey::PendingWithdrawal(aff_addr.clone());
                        let current: i128 =
                            env.storage().persistent().get(&key).unwrap_or(0);
                        env.storage()
                            .persistent()
                            .set(&key, &current.checked_add(aff_amount).ok_or(Error::Overflow)?);
                        env.events()
                            .publish((symbol_short!("aff_pend"), aff_addr), aff_amount);
                    }
                }
            }
        }

        // #920: chunked processing.
        const CHUNK: u32 = 50;
        let len = recipients.len();

        if len > CHUNK {
            let end = (next_index + CHUNK).min(len);
            for i in next_index..end {
                let r = recipients.get(i).unwrap();
                let amount = total_amount
                    .checked_mul(r.share_bps as i128)
                    .ok_or(Error::Overflow)?
                    / 10_000;
                if amount > 0 {
                    token_client.transfer(&contract_addr, &r.address, &amount);
                }
            }
            if end < len {
                // More chunks remain — persist progress and bump TTL.
                env.storage().instance().set(&DataKey::SplitFundsNextIndex, &end);
                env.storage().instance().bump(17280, 17280); // ~1 day in ledgers
            } else {
                // All done — clear state.
                env.storage().instance().set(&DataKey::SplitFundsNextIndex, &0u32);
            }
        } else {
            // Small list — process in one shot.
            for r in recipients.iter() {
                let amount = total_amount
                    .checked_mul(r.share_bps as i128)
                    .ok_or(Error::Overflow)?
                    / 10_000;
                if amount > 0 {
                    token_client.transfer(&contract_addr, &r.address, &amount);
                }
            }
        }

        Ok(())
    }

    // ── split_percentage ──────────────────────────────────────────────────────

    pub fn split_percentage(
        env: Env,
        sender: Address,
        asset: Address,
        total_amount: i128,
        recipients: Vec<PercentRecipient>,
    ) -> Result<(), Error> {
        Self::_require_not_paused(&env)?;
        sender.require_auth();
        if recipients.is_empty() { return Err(Error::EmptyRecipients); }
        let mut bps_sum: u32 = 0;
        for r in recipients.iter() {
            bps_sum = bps_sum.checked_add(r.bps).ok_or(Error::Overflow)?;
        }
        if bps_sum != 10_000 { return Err(Error::InvalidBpsSum); }
        let token_client = token::Client::new(&env, &asset);
        let contract_addr = env.current_contract_address();
        token_client.transfer(&sender, &contract_addr, &total_amount);
        env.events().publish((symbol_short!("splitstrt"), sender.clone()), recipients.len() as u32);
        let mut total_disbursed: i128 = 0;
        let first = recipients.get(0).unwrap();
        for i in 1..recipients.len() {
            let r = recipients.get(i).unwrap();
            let amount = total_amount.checked_mul(r.bps as i128).ok_or(Error::Overflow)? / 10_000;
            if amount > 0 {
                token_client.transfer(&contract_addr, &r.address, &amount);
                env.events().publish((symbol_short!("paysent"), r.address.clone()), amount);
            }
            total_disbursed = total_disbursed.checked_add(amount).ok_or(Error::Overflow)?;
        }
        let first_base = total_amount.checked_mul(first.bps as i128).ok_or(Error::Overflow)? / 10_000;
        let dust = total_amount
            .checked_sub(total_disbursed).ok_or(Error::Overflow)?
            .checked_sub(first_base).ok_or(Error::Overflow)?;
        let first_amount = first_base.checked_add(dust).ok_or(Error::Overflow)?;
        if first_amount > 0 {
            token_client.transfer(&contract_addr, &first.address, &first_amount);
            env.events().publish((symbol_short!("paysent"), first.address.clone()), first_amount);
        }
        Ok(())
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    pub fn is_verified(env: &Env, address: Address) -> bool {
        env.storage().persistent().get(&DataKey::VerifiedUsers(address)).unwrap_or(false)
    }

    pub fn get_proposal(env: Env, proposal_id: u64) -> Option<Proposal> {
        env.storage().persistent().get(&DataKey::Proposal(proposal_id))
    }

    pub fn fee_bps(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0)
    }

    pub fn treasury(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Treasury).unwrap()
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn council_keys(env: Env) -> Vec<Address> {
        env.storage().instance().get(&DataKey::CouncilKeys).unwrap_or_else(|| Vec::new(&env))
    }

    pub fn contract_state(env: Env) -> ContractState {
        env.storage()
            .instance()
            .get(&DataKey::ContractState)
            .unwrap_or(ContractState::Active)
    }

    pub fn pending_withdrawal(env: Env, addr: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::PendingWithdrawal(addr))
            .unwrap_or(0)
    }

    // ── Recovery: 5-of-7 Council ──────────────────────────────────────────────

    pub fn recovery_split(
        env: Env,
        council_signatures: Vec<Address>,
        recipients: Vec<Recipient>,
        total_amount: i128,
    ) -> Result<(), Error> {
        let council_keys: Vec<Address> = env
            .storage().instance().get(&DataKey::CouncilKeys)
            .ok_or(Error::CouncilNotSet)?;
        for signer in council_signatures.iter() { signer.require_auth(); }
        if council_signatures.len() < 5 { return Err(Error::InsufficientCouncilSignatures); }
        let mut validated: u32 = 0;
        for signer in council_signatures.iter() {
            let mut count: u32 = 0;
            for other in council_signatures.iter() {
                if other == signer { count += 1; }
            }
            if count > 1 { return Err(Error::DuplicateCouncilSigner); }
            let mut found = false;
            for key in council_keys.iter() {
                if key == signer { found = true; break; }
            }
            if !found { return Err(Error::InvalidCouncilSigner); }
            validated += 1;
        }
        if validated < 5 { return Err(Error::InsufficientCouncilSignatures); }
        let mut bps_sum: u32 = 0;
        for r in recipients.iter() {
            bps_sum = bps_sum.checked_add(r.share_bps).ok_or(Error::Overflow)?;
        }
        if bps_sum != 10_000 { return Err(Error::InvalidSplit); }
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        let contract_addr = env.current_contract_address();
        Self::_distribute(&env, &token_client, &contract_addr, &recipients, total_amount)?;
        env.events().publish((symbol_short!("recovery"),), total_amount);
        Ok(())
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /// #922: Revert if the contract is paused.
    fn _require_not_paused(env: &Env) -> Result<(), Error> {
        let state: ContractState = env
            .storage()
            .instance()
            .get(&DataKey::ContractState)
            .unwrap_or(ContractState::Active);
        if state == ContractState::Paused {
            return Err(Error::ContractPaused);
        }
        Ok(())
    }

    fn _require_admin(env: &Env) -> Result<(), Error> {
        let admin: Address = env
            .storage().instance().get(&DataKey::Admin)
            .ok_or(Error::NotAdmin)?;
        admin.require_auth();
        Ok(())
    }

    fn _require_quorum_admin(env: &Env, caller: &Address) -> Result<(), Error> {
        let admins: Vec<Address> = env
            .storage().instance().get(&DataKey::QuorumAdmins)
            .ok_or(Error::NotAuthorizedAdmin)?;
        for a in admins.iter() {
            if a == *caller { return Ok(()); }
        }
        Err(Error::NotAuthorizedAdmin)
    }

    fn _set_verified(env: &Env, user: &Address, status: bool) {
        env.storage().persistent().set(&DataKey::VerifiedUsers(user.clone()), &status);
    }

    fn _credit_claimable(env: &Env, recipient: &Address, asset: &Address, amount: i128) -> Result<(), Error> {
        let key = DataKey::ClaimableBalance(recipient.clone(), asset.clone());
        let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        let updated = current.checked_add(amount).ok_or(Error::Overflow)?;
        env.storage().persistent().set(&key, &updated);
        Ok(())
    }

    fn _distribute(
        env: &Env,
        token_client: &token::Client,
        from: &Address,
        recipients: &Vec<Recipient>,
        distributable: i128,
    ) -> Result<(), Error> {
        for r in recipients.iter() {
            let amount = distributable
                .checked_mul(r.share_bps as i128)
                .ok_or(Error::Overflow)?
                / 10_000;
            if amount > 0 {
                token_client.transfer(from, &r.address, &amount);
            }
        }
        env.events().publish((symbol_short!("split"),), distributable);
        Ok(())
    }
}
