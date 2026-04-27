#![cfg(test)]
extern crate std;

use std::panic::AssertUnwindSafe;

use soroban_sdk::{
    testutils::Address as _,
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, Vec,
};

use crate::{errors::Error, AdminAction, Recipient, SplitterV3, SplitterV3Client};
use soroban_sdk::BytesN;

// ── Helpers ───────────────────────────────────────────────────────────────────

struct Setup {
    env: Env,
    contract: SplitterV3Client<'static>,
    token: TokenClient<'static>,
    owner: Address,
    treasury: Address,
    admin_a: Address,
    admin_b: Address,
    admin_c: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let treasury = Address::generate(&env);
    let admin_a = Address::generate(&env);
    let admin_b = Address::generate(&env);
    let admin_c = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token = TokenClient::new(&env, &token_id.address());
    let sac = StellarAssetClient::new(&env, &token_id.address());
    sac.mint(&owner, &1_000_000_000);

    let contract_id = env.register(SplitterV3, ());
    let contract = SplitterV3Client::new(&env, &contract_id);

    let mut quorum = Vec::new(&env);
    quorum.push_back(admin_a.clone());
    quorum.push_back(admin_b.clone());
    quorum.push_back(admin_c.clone());

    // council_keys: 7 addresses for 5-of-7 recovery (use dummy addresses in tests)
    let mut council = Vec::new(&env);
    for _ in 0..7 {
        council.push_back(Address::generate(&env));
    }

    contract.initialize(
        &owner,
        &token_id.address(),
        &100u32,
        &treasury,
        &quorum,
        &council,
    );

    Setup {
        env,
        contract,
        token,
        owner,
        treasury,
        admin_a,
        admin_b,
        admin_c,
    }
}

// ── Test 1 (Happy Path): A proposes, B approves, C executes ──────────────────

#[test]
fn test_full_quorum_updates_fee() {
    let s = setup();

    let id = s
        .contract
        .propose_change(&s.admin_a, &AdminAction::UpdateFee(500));
    s.contract.approve_proposal(&s.admin_b, &id);
    s.contract.execute_proposal(&s.admin_c, &id);

    assert_eq!(s.contract.fee_bps(), 500u32);

    let proposal = s.contract.get_proposal(&id).unwrap();
    assert!(proposal.executed);
}

#[test]
fn test_full_quorum_updates_collector() {
    let s = setup();
    let new_treasury = Address::generate(&s.env);

    let id = s.contract.propose_change(
        &s.admin_a,
        &AdminAction::UpdateCollector(new_treasury.clone()),
    );
    s.contract.approve_proposal(&s.admin_b, &id);
    s.contract.execute_proposal(&s.admin_c, &id);

    assert_eq!(s.contract.treasury(), new_treasury);
}

// ── Test 2 (Double Vote): Admin A cannot approve twice ────────────────────────

#[test]
fn test_double_vote_prevented() {
    let s = setup();

    let id = s
        .contract
        .propose_change(&s.admin_a, &AdminAction::UpdateFee(200));
    // admin_a already voted via propose_change — second vote must fail.
    let result = s.contract.try_approve_proposal(&s.admin_a, &id);
    assert_eq!(result, Err(Ok(Error::AlreadyApproved)));
}

// ── Test 3 (Unauthorized): Non-admin cannot propose, approve, or execute ──────

#[test]
fn test_non_admin_cannot_propose() {
    let env = Env::default(); // no mock_all_auths
    let s = setup();
    let attacker = Address::generate(&s.env);

    // Without mock_all_auths the require_auth will panic.
    let result = std::panic::catch_unwind(AssertUnwindSafe(|| {
        let c = SplitterV3Client::new(&env, &s.contract.address);
        c.propose_change(&attacker, &AdminAction::UpdateFee(999))
    }));
    assert!(result.is_err());
}

#[test]
fn test_non_admin_rejected_by_quorum_check() {
    let s = setup();
    // With mock_all_auths, auth passes but _require_quorum_admin rejects.
    let attacker = Address::generate(&s.env);
    let result = s
        .contract
        .try_propose_change(&attacker, &AdminAction::UpdateFee(999));
    assert_eq!(result, Err(Ok(Error::NotAuthorizedAdmin)));
}

#[test]
fn test_non_admin_cannot_approve() {
    let s = setup();
    let id = s
        .contract
        .propose_change(&s.admin_a, &AdminAction::UpdateFee(200));
    let attacker = Address::generate(&s.env);
    let result = s.contract.try_approve_proposal(&attacker, &id);
    assert_eq!(result, Err(Ok(Error::NotAuthorizedAdmin)));
}

#[test]
fn test_non_admin_cannot_execute() {
    let s = setup();
    let id = s
        .contract
        .propose_change(&s.admin_a, &AdminAction::UpdateFee(200));
    s.contract.approve_proposal(&s.admin_b, &id);
    let attacker = Address::generate(&s.env);
    let result = s.contract.try_execute_proposal(&attacker, &id);
    assert_eq!(result, Err(Ok(Error::NotAuthorizedAdmin)));
}

// ── Test 4 (Execution Guard): Cannot execute with only 1 approval ─────────────

#[test]
fn test_execute_with_one_approval_fails() {
    let s = setup();
    // propose_change gives 1 approval (admin_a). No further approvals.
    let id = s
        .contract
        .propose_change(&s.admin_a, &AdminAction::UpdateFee(300));
    let result = s.contract.try_execute_proposal(&s.admin_b, &id);
    assert_eq!(result, Err(Ok(Error::QuorumNotReached)));

    // Fee must be unchanged.
    assert_eq!(s.contract.fee_bps(), 100u32);
}

// ── Test 5: Cannot execute an already-executed proposal ──────────────────────

#[test]
fn test_cannot_execute_twice() {
    let s = setup();
    let id = s
        .contract
        .propose_change(&s.admin_a, &AdminAction::UpdateFee(50));
    s.contract.approve_proposal(&s.admin_b, &id);
    s.contract.execute_proposal(&s.admin_c, &id);

    let result = s.contract.try_execute_proposal(&s.admin_c, &id);
    assert_eq!(result, Err(Ok(Error::AlreadyExecuted)));
}

// ── Test 6: Proposal not found ────────────────────────────────────────────────

#[test]
fn test_approve_nonexistent_proposal_fails() {
    let s = setup();
    let result = s.contract.try_approve_proposal(&s.admin_b, &999u64);
    assert_eq!(result, Err(Ok(Error::ProposalNotFound)));
}

// ── Test 7: #633 split still works after fee update via quorum ────────────────

#[test]
fn test_split_uses_updated_fee() {
    let s = setup();

    // Update fee to 0 via quorum.
    let id = s
        .contract
        .propose_change(&s.admin_a, &AdminAction::UpdateFee(0));
    s.contract.approve_proposal(&s.admin_b, &id);
    s.contract.execute_proposal(&s.admin_c, &id);

    let alice = Address::generate(&s.env);
    s.contract.set_verification_status(&alice, &true);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    s.contract.split(
        &s.owner,
        &recipients,
        &20_000_000,
        &None,
        &BytesN::from_array(&s.env, &[1u8; 32]),
    );

    // 0% fee → alice gets the full amount.
    assert_eq!(s.token.balance(&alice), 20_000_000);
}

// ── Scheduled split tests ─────────────────────────────────────────────────────

use crate::SplitStatus;
use soroban_sdk::testutils::Ledger as _;

#[test]
fn test_schedule_and_execute_split() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let bob = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 6_000,
    });
    recipients.push_back(Recipient {
        address: bob.clone(),
        share_bps: 4_000,
    });

    let now = s.env.ledger().timestamp();
    let release_time = now + 1_000;

    let split_id = s
        .contract
        .schedule_split(&s.owner, &recipients, &30_000_000, &release_time);

    // Advance ledger past release_time.
    s.env.ledger().with_mut(|l| l.timestamp = release_time + 1);

    s.contract.execute_split(&split_id);

    // 1% fee (100 bps) → distributable = 29_700_000
    // alice: 29_700_000 * 6000 / 10000 = 17_820_000
    // bob:   29_700_000 * 4000 / 10000 = 11_880_000
    assert_eq!(s.token.balance(&alice), 17_820_000);
    assert_eq!(s.token.balance(&bob), 11_880_000);

    let config = s.contract.get_split(&split_id).unwrap();
    assert_eq!(config.status, SplitStatus::Executed);
}

#[test]
fn test_cancel_split_refunds_sender() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    let now = s.env.ledger().timestamp();
    let release_time = now + 1_000;
    let initial_balance = s.token.balance(&s.owner);

    let split_id = s
        .contract
        .schedule_split(&s.owner, &recipients, &500_000, &release_time);

    // Tokens are locked — owner balance reduced.
    assert_eq!(s.token.balance(&s.owner), initial_balance - 500_000);

    // Cancel before release_time.
    s.contract.cancel_split(&s.owner, &split_id);

    // Tokens fully refunded.
    assert_eq!(s.token.balance(&s.owner), initial_balance);

    let config = s.contract.get_split(&split_id).unwrap();
    assert_eq!(config.status, SplitStatus::Cancelled);
}

#[test]
fn test_cancel_split_wrong_sender_rejected() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let attacker = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    let now = s.env.ledger().timestamp();
    let split_id = s
        .contract
        .schedule_split(&s.owner, &recipients, &100_000, &(now + 1_000));

    let result = s.contract.try_cancel_split(&attacker, &split_id);
    assert_eq!(result, Err(Ok(Error::NotSplitSender)));
}

#[test]
fn test_cancel_split_after_release_time_rejected() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    let now = s.env.ledger().timestamp();
    let release_time = now + 500;

    let split_id = s
        .contract
        .schedule_split(&s.owner, &recipients, &20_000_000, &release_time);

    // Advance past release_time.
    s.env.ledger().with_mut(|l| l.timestamp = release_time + 1);

    let result = s.contract.try_cancel_split(&s.owner, &split_id);
    assert_eq!(result, Err(Ok(Error::SplitNotYetDue)));
}

#[test]
fn test_execute_split_before_release_time_rejected() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    let now = s.env.ledger().timestamp();
    let split_id = s
        .contract
        .schedule_split(&s.owner, &recipients, &100_000, &(now + 1_000));

    let result = s.contract.try_execute_split(&split_id);
    assert_eq!(result, Err(Ok(Error::NotYetReleased)));
}

#[test]
fn test_cancel_already_cancelled_split_rejected() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    let now = s.env.ledger().timestamp();
    let split_id = s
        .contract
        .schedule_split(&s.owner, &recipients, &100_000, &(now + 1_000));

    s.contract.cancel_split(&s.owner, &split_id);

    let result = s.contract.try_cancel_split(&s.owner, &split_id);
    assert_eq!(result, Err(Ok(Error::SplitAlreadyCancelled)));
}

#[test]
fn test_cancel_executed_split_rejected() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    let now = s.env.ledger().timestamp();
    let release_time = now + 500;

    let split_id = s
        .contract
        .schedule_split(&s.owner, &recipients, &20_000_000, &release_time);

    s.env.ledger().with_mut(|l| l.timestamp = release_time + 1);
    s.contract.execute_split(&split_id);

    let result = s.contract.try_cancel_split(&s.owner, &split_id);
    assert_eq!(result, Err(Ok(Error::SplitAlreadyExecuted)));
}

// ── Pull-based claimable balance tests ───────────────────────────────────────

#[test]
fn test_split_pull_credits_claimable_balances() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let bob = Address::generate(&s.env);
    let token_addr = s.token.address.clone();

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 7_000,
    });
    recipients.push_back(Recipient {
        address: bob.clone(),
        share_bps: 3_000,
    });

    // Use 0% fee for clean math.
    let id = s
        .contract
        .propose_change(&s.admin_a, &AdminAction::UpdateFee(0));
    s.contract.approve_proposal(&s.admin_b, &id);
    s.contract.execute_proposal(&s.admin_c, &id);

    s.contract
        .split_pull(&s.owner, &recipients, &40_000_000, &None);

    // Tokens NOT yet in wallets — still in contract.
    assert_eq!(s.token.balance(&alice), 0);
    assert_eq!(s.token.balance(&bob), 0);

    // Claimable balances credited correctly.
    assert_eq!(
        s.contract.claimable_balance(&alice, &token_addr),
        28_000_000
    );
    assert_eq!(s.contract.claimable_balance(&bob, &token_addr), 12_000_000);
}

#[test]
fn test_claim_share_transfers_and_zeroes_balance() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let token_addr = s.token.address.clone();

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    let id = s
        .contract
        .propose_change(&s.admin_a, &AdminAction::UpdateFee(0));
    s.contract.approve_proposal(&s.admin_b, &id);
    s.contract.execute_proposal(&s.admin_c, &id);

    s.contract
        .split_pull(&s.owner, &recipients, &20_000_000, &None);

    // Alice claims her share.
    s.contract.claim_share(&alice, &token_addr);

    assert_eq!(s.token.balance(&alice), 20_000_000);
    // Balance zeroed after claim.
    assert_eq!(s.contract.claimable_balance(&alice, &token_addr), 0);
}

#[test]
fn test_claim_share_nothing_to_claim_rejected() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let token_addr = s.token.address.clone();

    let result = s.contract.try_claim_share(&alice, &token_addr);
    assert_eq!(result, Err(Ok(Error::NothingToClaim)));
}

#[test]
fn test_split_pull_fee_deducted_before_crediting() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let token_addr = s.token.address.clone();

    // Default fee is 100 bps (1%).
    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    s.contract
        .split_pull(&s.owner, &recipients, &20_000_000, &None);

    // Fee = 200_000; distributable = 19_800_000 → alice gets 19_800_000.
    assert_eq!(
        s.contract.claimable_balance(&alice, &token_addr),
        19_800_000
    );
    // Treasury received the fee immediately.
    assert_eq!(s.token.balance(&s.treasury), 200_000);
}

#[test]
fn test_multiple_split_pulls_accumulate_balance() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let token_addr = s.token.address.clone();

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    let id = s
        .contract
        .propose_change(&s.admin_a, &AdminAction::UpdateFee(0));
    s.contract.approve_proposal(&s.admin_b, &id);
    s.contract.execute_proposal(&s.admin_c, &id);

    s.contract
        .split_pull(&s.owner, &recipients, &20_000_000, &None);
    s.contract
        .split_pull(&s.owner, &recipients, &30_000_000, &None);

    // Balances accumulate across multiple pulls before claiming.
    assert_eq!(
        s.contract.claimable_balance(&alice, &token_addr),
        50_000_000
    );

    s.contract.claim_share(&alice, &token_addr);
    assert_eq!(s.token.balance(&alice), 50_000_000);
}

// ── Task 1: Pre-flight balance check tests ────────────────────────────────────

#[test]
fn test_split_preflight_rejects_insufficient_balance() {
    let s = setup();
    let alice = Address::generate(&s.env);
    s.contract.set_verification_status(&alice, &true);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    // owner has 1_000_000_000; request more than available
    let result = s.contract.try_split(
        &s.owner,
        &recipients,
        &2_000_000_000i128,
        &None,
        &BytesN::from_array(&s.env, &[10u8; 32]),
    );
    assert_eq!(result, Err(Ok(Error::InsufficientBalance)));
}

#[test]
fn test_split_funds_preflight_rejects_insufficient_balance() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    let result =
        s.contract
            .try_split_funds(&s.owner, &s.token.address, &recipients, &2_000_000_000i128);
    assert_eq!(result, Err(Ok(Error::InsufficientBalance)));
}

// ── Task 2 & 4: Idempotency / double-spend prevention tests ──────────────────

#[test]
fn test_split_idempotency_rejects_replay() {
    let s = setup();
    let alice = Address::generate(&s.env);
    s.contract.set_verification_status(&alice, &true);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    let salt = BytesN::from_array(&s.env, &[42u8; 32]);

    // First call succeeds.
    s.contract
        .split(&s.owner, &recipients, &20_000_000, &None, &salt);

    // Replay with same (sender, recipients, amount, salt) must fail.
    let result = s
        .contract
        .try_split(&s.owner, &recipients, &20_000_000, &None, &salt);
    assert_eq!(result, Err(Ok(Error::AlreadyProcessed)));
}

#[test]
fn test_split_different_salt_succeeds() {
    let s = setup();
    let alice = Address::generate(&s.env);
    s.contract.set_verification_status(&alice, &true);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    // Two calls with different salts are both valid.
    s.contract.split(
        &s.owner,
        &recipients,
        &20_000_000,
        &None,
        &BytesN::from_array(&s.env, &[1u8; 32]),
    );
    s.contract.split(
        &s.owner,
        &recipients,
        &20_000_000,
        &None,
        &BytesN::from_array(&s.env, &[2u8; 32]),
    );
}

// ── Task 3: 120-recipient performance baseline ────────────────────────────────

#[test]
fn test_120_recipient_split_baseline() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let treasury = Address::generate(&env);
    let admin_a = Address::generate(&env);
    let admin_b = Address::generate(&env);
    let admin_c = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token = soroban_sdk::token::Client::new(&env, &token_id.address());
    let sac = soroban_sdk::token::StellarAssetClient::new(&env, &token_id.address());
    // Mint enough for 120 recipients with each share above the minimum threshold.
    sac.mint(&owner, &10_000_000_000i128);

    let contract_id = env.register(SplitterV3, ());
    let contract = SplitterV3Client::new(&env, &contract_id);

    let mut quorum = Vec::new(&env);
    quorum.push_back(admin_a.clone());
    quorum.push_back(admin_b.clone());
    quorum.push_back(admin_c.clone());

    let mut council = Vec::new(&env);
    for _ in 0..7 {
        council.push_back(Address::generate(&env));
    }

    contract.initialize(
        &owner,
        &token_id.address(),
        &0u32,
        &treasury,
        &quorum,
        &council,
    );

    // Build 120 recipients with equal shares (10_000 / 120 = 83 bps each,
    // last recipient absorbs the 40 bps rounding remainder).
    let n: u32 = 120;
    let base_bps: u32 = 10_000 / n; // 83
    let remainder_bps: u32 = 10_000 - base_bps * (n - 1);

    let mut recipients = Vec::new(&env);
    for i in 0..n {
        let addr = Address::generate(&env);
        contract.set_verification_status(&addr, &true);
        let bps = if i == n - 1 { remainder_bps } else { base_bps };
        recipients.push_back(Recipient {
            address: addr,
            share_bps: bps,
        });
    }

    let total_amount: i128 = 1_300_000_000;
    let salt = BytesN::from_array(&env, &[99u8; 32]);

    contract.split(&owner, &recipients, &total_amount, &None, &salt);

    assert_eq!(token.balance(&owner), 8_700_000_000);
}

// ── #939: Minimum-Stroop filter tests ─────────────────────────────────────────

#[test]
fn test_split_rejects_share_below_minimum() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let bob = Address::generate(&s.env);
    s.contract.set_verification_status(&alice, &true);
    s.contract.set_verification_status(&bob, &true);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 5_000,
    });
    recipients.push_back(Recipient {
        address: bob.clone(),
        share_bps: 5_000,
    });

    let result = s.contract.try_split(
        &s.owner,
        &recipients,
        &100i128,
        &None,
        &BytesN::from_array(&s.env, &[99u8; 32]),
    );
    assert_eq!(result, Err(Ok(Error::ShareBelowMinimum)));
}

#[test]
fn test_split_allows_share_above_minimum() {
    let s = setup();
    let alice = Address::generate(&s.env);
    s.contract.set_verification_status(&alice, &true);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    s.contract.split(
        &s.owner,
        &recipients,
        &20_000_000i128,
        &None,
        &BytesN::from_array(&s.env, &[98u8; 32]),
    );
    assert_eq!(s.token.balance(&alice), 19_800_000);
}

#[test]
fn test_split_funds_rejects_share_below_minimum() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    let result = s
        .contract
        .try_split_funds(&s.owner, &s.token.address, &recipients, &100i128);
    assert_eq!(result, Err(Ok(Error::ShareBelowMinimum)));
}

#[test]
fn test_split_pull_rejects_share_below_minimum() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    let result = s
        .contract
        .try_split_pull(&s.owner, &recipients, &500i128, &None);
    assert_eq!(result, Err(Ok(Error::ShareBelowMinimum)));
}

// ── #930: SAC asset validation tests ──────────────────────────────────────────

#[test]
fn test_split_funds_rejects_invalid_asset() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let fake_asset = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    let result = s
        .contract
        .try_split_funds(&s.owner, &fake_asset, &recipients, &20_000_000i128);
    assert!(result.is_err());
}

#[test]
fn test_split_percentage_rejects_invalid_asset() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let fake_asset = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(crate::PercentRecipient {
        address: alice.clone(),
        bps: 10_000,
    });

    let result =
        s.contract
            .try_split_percentage(&s.owner, &fake_asset, &20_000_000i128, &recipients);
    assert!(result.is_err());
}

#[test]
fn test_split_funds_accepts_valid_asset() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient {
        address: alice.clone(),
        share_bps: 10_000,
    });

    s.token
        .transfer(&s.owner, &s.contract.address, &20_000_000i128);

    let result =
        s.contract
            .try_split_funds(&s.owner, &s.token.address, &recipients, &20_000_000i128);
    assert!(result.is_ok());
}

#[test]
fn test_split_percentage_accepts_valid_asset() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(crate::PercentRecipient {
        address: alice.clone(),
        bps: 10_000,
    });

    let result =
        s.contract
            .try_split_percentage(&s.owner, &s.token.address, &20_000_000i128, &recipients);
    assert!(result.is_ok());
}
