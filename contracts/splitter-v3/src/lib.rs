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

// ── Public types ──────────────────────────────────────────────────────────────

/// A recipient and their share in basis points (0–10000).
#[contracttype]
#[derive(Clone)]
pub struct Recipient {
    pub address: Address,
    pub share_bps: u32,
}

/// A recipient with a percentage share expressed in basis points for `split_percentage`.
#[contracttype]
#[derive(Clone)]
pub struct PercentRecipient {
    pub address: Address,
    pub bps: u32,
}

/// The protocol setting being changed by a quorum proposal.
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum AdminAction {
    /// Update the protocol fee (basis points).
    UpdateFee(u32),
    /// Update the fee-collector / treasury address.
    UpdateCollector(Address),
}

/// A pending or executed quorum proposal.
#[contracttype]
#[derive(Clone)]
pub struct Proposal {
    pub action: AdminAction,
    /// Addresses that have approved so far.
    pub approvals: Vec<Address>,
    pub executed: bool,
}

/// Status of a scheduled split.
#[contracttype]
#[derive(Clone, PartialEq)]
pub enum SplitStatus {
    Pending,
    Executed,
    Cancelled,
}

/// A scheduled (future) split stored on-chain until its release_time.
#[contracttype]
#[derive(Clone)]
pub struct SplitConfig {
    pub sender: Address,
    pub recipients: Vec<Recipient>,
    pub total_amount: i128,
    pub release_time: u64,
    pub status: SplitStatus,
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct SplitterV3;

#[contractimpl]
impl SplitterV3 {
    // ── Initialization ────────────────────────────────────────────────────────

    /// Called once by the factory. `owner` is the single-admin for #633 guards.
    /// `quorum_admins` must contain exactly 3 addresses for the quorum system.
    /// `council_keys` must contain exactly 7 addresses for the 5-of-7 recovery.
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

        // Auto-verify the owner.
        Self::_set_verified(&env, &owner, true);
        for addr in quorum_admins.iter() {
            Self::_set_verified(&env, &addr, true);
        }

        Ok(())
    }

    // ── #633: Verification management (single-admin) ──────────────────────────

    pub fn set_verification_status(
        env: Env,
        user: Address,
        status: bool,
    ) -> Result<(), Error> {
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

    /// Create a new proposal. Caller is automatically the first approver.
    /// Returns the new `proposal_id`.
    pub fn propose_change(
        env: Env,
        caller: Address,
        action: AdminAction,
    ) -> Result<u64, Error> {
        caller.require_auth();
        Self::_require_quorum_admin(&env, &caller)?;

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextProposalId)
            .unwrap_or(0);

        let mut approvals: Vec<Address> = Vec::new(&env);
        approvals.push_back(caller);

        let proposal = Proposal { action, approvals, executed: false };
        env.storage().persistent().set(&DataKey::Proposal(id), &proposal);
        env.storage().instance().set(&DataKey::NextProposalId, &(id + 1));

        Ok(id)
    }

    // ── #634: Quorum — approve ────────────────────────────────────────────────

    /// Add caller's approval to an existing proposal.
    pub fn approve_proposal(
        env: Env,
        caller: Address,
        proposal_id: u64,
    ) -> Result<(), Error> {
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
        // Prevent double-vote.
        for existing in proposal.approvals.iter() {
            if existing == caller {
                return Err(Error::AlreadyApproved);
            }
        }

        proposal.approvals.push_back(caller);
        env.storage().persistent().set(&DataKey::Proposal(proposal_id), &proposal);

        Ok(())
    }

    // ── #634: Quorum — execute ────────────────────────────────────────────────

    /// Execute a proposal once it has >= 2 approvals.
    pub fn execute_proposal(
        env: Env,
        caller: Address,
        proposal_id: u64,
    ) -> Result<(), Error> {
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
        if proposal.approvals.len() < 2 {
            return Err(Error::QuorumNotReached);
        }

        // Apply the state change.
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

        env.events().publish(
            (symbol_short!("settings"), proposal_id),
            proposal.action,
        );

        Ok(())
    }

    // ── Core: split ───────────────────────────────────────────────────────────

    /// `affiliate` — optional partner address that receives 0.1% of `total_amount`
    /// before the recipient list is processed.
    pub fn split(
        env: Env,
        sender: Address,
        recipients: Vec<Recipient>,
        total_amount: i128,
        affiliate: Option<Address>,
    ) -> Result<(), Error> {
        sender.require_auth();

        let strict: bool = env
            .storage()
            .instance()
            .get(&DataKey::StrictMode)
            .unwrap_or(false);

        let mut bps_sum: u32 = 0;
        for r in recipients.iter() {
            bps_sum = bps_sum.checked_add(r.share_bps).ok_or(Error::Overflow)?;
        }
        if bps_sum != 10_000 {
            return Err(Error::InvalidSplit);
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        let contract_addr = env.current_contract_address();
        token_client.transfer(&sender, &contract_addr, &total_amount);

        // ── Affiliate fee: 0.1% deducted first ───────────────────────────────
        let affiliate_amount = if let Some(ref affiliate_addr) = affiliate {
            // 10 bps = 0.1%
            let a = total_amount
                .checked_mul(10)
                .ok_or(Error::Overflow)?
                / 10_000;
            if a > 0 {
                token_client.transfer(&contract_addr, affiliate_addr, &a);
                env.events().publish((symbol_short!("affiliate"),), a);
            }
            a
        } else {
            0
        };

        let after_affiliate = total_amount
            .checked_sub(affiliate_amount)
            .ok_or(Error::Overflow)?;

        // ── Protocol fee ──────────────────────────────────────────────────────
        let fee_bps: u32 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0);
        let fee_amount = if fee_bps > 0 {
            let f = after_affiliate
                .checked_mul(fee_bps as i128)
                .ok_or(Error::Overflow)?
                / 10_000;
            let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
            if f > 0 {
                token_client.transfer(&contract_addr, &treasury, &f);
            }
            f
        } else {
            0
        };
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
            if verified.is_empty() {
                return Err(Error::NoVerifiedRecipients);
            }
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

    /// Lock `total_amount` tokens and schedule a split for `release_time`.
    ///
    /// Tokens are transferred from `sender` to the contract immediately.
    /// The split can be executed by anyone once `release_time` has passed,
    /// or cancelled exclusively by `sender` before that point.
    ///
    /// Returns the new `split_id`.
    pub fn schedule_split(
        env: Env,
        sender: Address,
        recipients: Vec<Recipient>,
        total_amount: i128,
        release_time: u64,
    ) -> Result<u64, Error> {
        sender.require_auth();

        // Validate shares sum to 10_000 bps.
        let mut bps_sum: u32 = 0;
        for r in recipients.iter() {
            bps_sum = bps_sum.checked_add(r.share_bps).ok_or(Error::Overflow)?;
        }
        if bps_sum != 10_000 {
            return Err(Error::InvalidSplit);
        }

        // Lock the tokens in the contract.
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&sender, &env.current_contract_address(), &total_amount);

        // Assign and increment the split id counter.
        let split_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextSplitId)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::NextSplitId, &(split_id + 1));

        let config = SplitConfig {
            sender,
            recipients,
            total_amount,
            release_time,
            status: SplitStatus::Pending,
        };
        env.storage()
            .persistent()
            .set(&DataKey::ScheduledSplit(split_id), &config);

        env.events()
            .publish((symbol_short!("sched"), split_id), release_time);

        Ok(split_id)
    }

    /// Execute a scheduled split once its `release_time` has been reached.
    ///
    /// Anyone may call this — the auth check is on the ledger timestamp, not
    /// the caller identity.
    pub fn execute_split(env: Env, split_id: u64) -> Result<(), Error> {
        let mut config: SplitConfig = env
            .storage()
            .persistent()
            .get(&DataKey::ScheduledSplit(split_id))
            .ok_or(Error::SplitNotFound)?;

        match config.status {
            SplitStatus::Cancelled => return Err(Error::SplitAlreadyCancelled),
            SplitStatus::Executed => return Err(Error::SplitAlreadyExecuted),
            SplitStatus::Pending => {}
        }

        if env.ledger().timestamp() < config.release_time {
            return Err(Error::NotYetReleased);
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        let contract_addr = env.current_contract_address();

        let fee_bps: u32 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0);
        let fee_amount = if fee_bps > 0 {
            let f = config
                .total_amount
                .checked_mul(fee_bps as i128)
                .ok_or(Error::Overflow)?
                / 10_000;
            let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
            if f > 0 {
                token_client.transfer(&contract_addr, &treasury, &f);
            }
            f
        } else {
            0
        };
        let distributable = config
            .total_amount
            .checked_sub(fee_amount)
            .ok_or(Error::Overflow)?;

        Self::_distribute(
            &env,
            &token_client,
            &contract_addr,
            &config.recipients,
            distributable,
        )?;

        config.status = SplitStatus::Executed;
        env.storage()
            .persistent()
            .set(&DataKey::ScheduledSplit(split_id), &config);

        Ok(())
    }

    /// Cancel a pending scheduled split and refund the locked tokens to the
    /// original sender.
    ///
    /// Auth: only the `sender` stored in the `SplitConfig` may call this.
    /// Reverts if the split has already been executed or cancelled, or if
    /// the release_time has already passed.
    pub fn cancel_split(env: Env, caller: Address, split_id: u64) -> Result<(), Error> {
        caller.require_auth();

        let mut config: SplitConfig = env
            .storage()
            .persistent()
            .get(&DataKey::ScheduledSplit(split_id))
            .ok_or(Error::SplitNotFound)?;

        // Strict sender-only auth: only the original funder may cancel.
        if config.sender != caller {
            return Err(Error::NotSplitSender);
        }

        match config.status {
            SplitStatus::Cancelled => return Err(Error::SplitAlreadyCancelled),
            SplitStatus::Executed => return Err(Error::SplitAlreadyExecuted),
            SplitStatus::Pending => {}
        }

        // Disallow cancellation once the release window has opened — at that
        // point recipients have a legitimate claim and execute_split can be
        // called by anyone.
        if env.ledger().timestamp() >= config.release_time {
            return Err(Error::SplitNotYetDue);
        }

        // Refund the full locked amount back to the sender.
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(
            &env.current_contract_address(),
            &config.sender,
            &config.total_amount,
        );

        config.status = SplitStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::ScheduledSplit(split_id), &config);

        env.events()
            .publish((symbol_short!("cancel"), split_id), config.sender);

        Ok(())
    }

    /// View a scheduled split by id.
    pub fn get_split(env: Env, split_id: u64) -> Option<SplitConfig> {
        env.storage()
            .persistent()
            .get(&DataKey::ScheduledSplit(split_id))
    }

    // ── Pull-based (claimable) splits ─────────────────────────────────────────

    /// Like `split`, but instead of pushing tokens to recipients, credits each
    /// recipient's claimable balance in the contract.  Recipients must call
    /// `claim_share` to actually receive their funds.
    ///
    /// This avoids failures caused by missing trustlines on the recipient side.
    /// The affiliate fee (0.1%) and protocol fee are still deducted immediately.
    pub fn split_pull(
        env: Env,
        sender: Address,
        recipients: Vec<Recipient>,
        total_amount: i128,
        affiliate: Option<Address>,
    ) -> Result<(), Error> {
        sender.require_auth();

        let mut bps_sum: u32 = 0;
        for r in recipients.iter() {
            bps_sum = bps_sum.checked_add(r.share_bps).ok_or(Error::Overflow)?;
        }
        if bps_sum != 10_000 {
            return Err(Error::InvalidSplit);
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        let contract_addr = env.current_contract_address();

        // Pull the full amount into the contract.
        token_client.transfer(&sender, &contract_addr, &total_amount);

        // ── Affiliate fee: 0.1% deducted first ───────────────────────────────
        let affiliate_amount = if let Some(ref affiliate_addr) = affiliate {
            let a = total_amount
                .checked_mul(10)
                .ok_or(Error::Overflow)?
                / 10_000;
            if a > 0 {
                token_client.transfer(&contract_addr, affiliate_addr, &a);
                env.events().publish((symbol_short!("affiliate"),), a);
            }
            a
        } else {
            0
        };

        let after_affiliate = total_amount
            .checked_sub(affiliate_amount)
            .ok_or(Error::Overflow)?;

        // ── Protocol fee ──────────────────────────────────────────────────────
        let fee_bps: u32 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0);
        let fee_amount = if fee_bps > 0 {
            let f = after_affiliate
                .checked_mul(fee_bps as i128)
                .ok_or(Error::Overflow)?
                / 10_000;
            let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
            if f > 0 {
                token_client.transfer(&contract_addr, &treasury, &f);
            }
            f
        } else {
            0
        };
        let distributable = after_affiliate.checked_sub(fee_amount).ok_or(Error::Overflow)?;

        // Credit each recipient's claimable balance — no token transfer yet.
        for r in recipients.iter() {
            let share = distributable
                .checked_mul(r.share_bps as i128)
                .ok_or(Error::Overflow)?
                / 10_000;
            if share > 0 {
                Self::_credit_claimable(&env, &r.address, &token_addr, share)?;
            }
        }

        env.events()
            .publish((symbol_short!("pullsplit"),), distributable);

        Ok(())
    }

    /// Claim all tokens owed to `caller` for the given `asset`.
    ///
    /// Reads the caller's claimable balance, zeroes it, then transfers the
    /// tokens from the contract to the caller.  Reverts with `NothingToClaim`
    /// if the balance is zero.
    pub fn claim_share(env: Env, caller: Address, asset: Address) -> Result<(), Error> {
        caller.require_auth();

        let key = DataKey::ClaimableBalance(caller.clone(), asset.clone());
        let amount: i128 = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(0);

        if amount <= 0 {
            return Err(Error::NothingToClaim);
        }

        // Zero the balance before transferring (checks-effects-interactions).
        env.storage().persistent().set(&key, &0i128);

        let token_client = token::Client::new(&env, &asset);
        token_client.transfer(&env.current_contract_address(), &caller, &amount);

        env.events()
            .publish((symbol_short!("claimed"), caller), amount);

        Ok(())
    }

    /// View the claimable balance for a given recipient and asset.
    pub fn claimable_balance(env: Env, recipient: Address, asset: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::ClaimableBalance(recipient, asset))
            .unwrap_or(0)
    }

    // ── split_funds: security-guarded batch transfer ──────────────────────────

    /// Authenticated batch transfer: sender authorizes the entire batch,
    /// asset is validated as a live token contract, and recipients must be non-empty.
    pub fn split_funds(
        env: Env,
        sender: Address,
        asset: Address,
        recipients: Vec<Recipient>,
        total_amount: i128,
    ) -> Result<(), Error> {
        // Security: sender must authorize the full batch.
        sender.require_auth();

        // Security: recipients list must not be empty.
        if recipients.is_empty() {
            return Err(Error::EmptyRecipients);
        }

        // Security: validate asset is a live token contract by calling decimals().
        // This traps early if the address is not a valid deployed contract.
        let token_client = token::Client::new(&env, &asset);
        let _ = token_client.decimals();

        let contract_addr = env.current_contract_address();
        token_client.transfer(&sender, &contract_addr, &total_amount);

        for r in recipients.iter() {
            let amount = total_amount
                .checked_mul(r.share_bps as i128)
                .ok_or(Error::Overflow)?
                / 10_000;
            if amount > 0 {
                token_client.transfer(&contract_addr, &r.address, &amount);
            }
        }

        Ok(())
    }

    // ── split_percentage: percentage-based split ──────────────────────────────

    /// Split `total_amount` of `asset` among `recipients` using basis-point
    /// percentages.  The sum of all `bps` values must equal exactly 10_000.
    pub fn split_percentage(
        env: Env,
        sender: Address,
        asset: Address,
        total_amount: i128,
        recipients: Vec<PercentRecipient>,
    ) -> Result<(), Error> {
        sender.require_auth();

        if recipients.is_empty() {
            return Err(Error::EmptyRecipients);
        }

        // Validate bps sum == 10_000.
        let mut bps_sum: u32 = 0;
        for r in recipients.iter() {
            bps_sum = bps_sum.checked_add(r.bps).ok_or(Error::Overflow)?;
        }
        if bps_sum != 10_000 {
            return Err(Error::InvalidBpsSum);
        }

        let token_client = token::Client::new(&env, &asset);
        let contract_addr = env.current_contract_address();
        token_client.transfer(&sender, &contract_addr, &total_amount);

        // Emit SplitStarted event with sender and total recipient count.
        env.events().publish(
            (symbol_short!("splitstrt"), sender.clone()),
            recipients.len() as u32,
        );

        // Distribute to all recipients except the first, tracking total disbursed.
        let mut total_disbursed: i128 = 0;
        let first = recipients.get(0).unwrap();

        for i in 1..recipients.len() {
            let r = recipients.get(i).unwrap();
            let amount = total_amount
                .checked_mul(r.bps as i128)
                .ok_or(Error::Overflow)?
                / 10_000;
            if amount > 0 {
                token_client.transfer(&contract_addr, &r.address, &amount);
                env.events().publish(
                    (symbol_short!("paysent"), r.address.clone()),
                    amount,
                );
            }
            total_disbursed = total_disbursed.checked_add(amount).ok_or(Error::Overflow)?;
        }

        // First recipient absorbs any rounding dust so contract balance is exactly zero.
        let first_base = total_amount
            .checked_mul(first.bps as i128)
            .ok_or(Error::Overflow)?
            / 10_000;
        let dust = total_amount
            .checked_sub(total_disbursed)
            .ok_or(Error::Overflow)?
            .checked_sub(first_base)
            .ok_or(Error::Overflow)?;
        let first_amount = first_base.checked_add(dust).ok_or(Error::Overflow)?;

        if first_amount > 0 {
            token_client.transfer(&contract_addr, &first.address, &first_amount);
            env.events().publish(
                (symbol_short!("paysent"), first.address.clone()),
                first_amount,
            );
        }

        Ok(())
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    pub fn is_verified(env: &Env, address: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::VerifiedUsers(address))
            .unwrap_or(false)
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
        env.storage()
            .instance()
            .get(&DataKey::CouncilKeys)
            .unwrap_or_else(|| Vec::new(&env))
    }

    // ── #recovery: 5-of-7 Council emergency split ─────────────────────────────

    /// Safety-valve: allows a 5-out-of-7 Council to split and move funds when
    /// the primary admin keys are lost.
    ///
    /// `council_signatures` — exactly 5 or more distinct Council addresses that
    /// have called `require_auth()`.  The contract validates each against the
    /// 7 keys stored at initialization.  Duplicate signers are rejected.
    pub fn recovery_split(
        env: Env,
        council_signatures: Vec<Address>,
        recipients: Vec<Recipient>,
        total_amount: i128,
    ) -> Result<(), Error> {
        // Load the stored council keys.
        let council_keys: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::CouncilKeys)
            .ok_or(Error::CouncilNotSet)?;

        // Require auth from every signer in the provided list.
        for signer in council_signatures.iter() {
            signer.require_auth();
        }

        // Validate: need at least 5 unique valid signers.
        if council_signatures.len() < 5 {
            return Err(Error::InsufficientCouncilSignatures);
        }

        // Check each signer is in the council list and not duplicated.
        let mut validated: u32 = 0;
        for signer in council_signatures.iter() {
            // Duplicate check against already-validated signers.
            let mut dup = false;
            let mut count: u32 = 0;
            for other in council_signatures.iter() {
                if other == signer {
                    count += 1;
                }
            }
            if count > 1 {
                dup = true;
            }
            if dup {
                return Err(Error::DuplicateCouncilSigner);
            }

            // Membership check.
            let mut found = false;
            for key in council_keys.iter() {
                if key == signer {
                    found = true;
                    break;
                }
            }
            if !found {
                return Err(Error::InvalidCouncilSigner);
            }
            validated += 1;
        }

        if validated < 5 {
            return Err(Error::InsufficientCouncilSignatures);
        }

        // Validate recipient shares.
        let mut bps_sum: u32 = 0;
        for r in recipients.iter() {
            bps_sum = bps_sum.checked_add(r.share_bps).ok_or(Error::Overflow)?;
        }
        if bps_sum != 10_000 {
            return Err(Error::InvalidSplit);
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        let contract_addr = env.current_contract_address();

        Self::_distribute(&env, &token_client, &contract_addr, &recipients, total_amount)?;

        env.events()
            .publish((symbol_short!("recovery"),), total_amount);

        Ok(())
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    fn _require_admin(env: &Env) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotAdmin)?;
        admin.require_auth();
        Ok(())
    }

    fn _require_quorum_admin(env: &Env, caller: &Address) -> Result<(), Error> {
        let admins: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::QuorumAdmins)
            .ok_or(Error::NotAuthorizedAdmin)?;
        for a in admins.iter() {
            if a == *caller {
                return Ok(());
            }
        }
        Err(Error::NotAuthorizedAdmin)
    }

    fn _set_verified(env: &Env, user: &Address, status: bool) {
        env.storage()
            .persistent()
            .set(&DataKey::VerifiedUsers(user.clone()), &status);
    }

    /// Increment a recipient's claimable balance for a given asset.
    fn _credit_claimable(
        env: &Env,
        recipient: &Address,
        asset: &Address,
        amount: i128,
    ) -> Result<(), Error> {
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
