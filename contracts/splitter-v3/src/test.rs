#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _},
    token::{Client as TokenClient, StellarAssetClient},
    Address, Env, Vec,
};

use crate::{errors::Error, AdminAction, Recipient, SplitterV3, SplitterV3Client};

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

    contract
        .initialize(&owner, &token_id.address(), &100u32, &treasury, &quorum)
        .unwrap();

    Setup { env, contract, token, owner, treasury, admin_a, admin_b, admin_c }
}

// ── Test 1 (Happy Path): A proposes, B approves, C executes ──────────────────

#[test]
fn test_full_quorum_updates_fee() {
    let s = setup();

    let id = s.contract.propose_change(&s.admin_a, &AdminAction::UpdateFee(500)).unwrap();
    s.contract.approve_proposal(&s.admin_b, &id).unwrap();
    s.contract.execute_proposal(&s.admin_c, &id).unwrap();

    assert_eq!(s.contract.fee_bps(), 500u32);

    let proposal = s.contract.get_proposal(id).unwrap();
    assert!(proposal.executed);
}

#[test]
fn test_full_quorum_updates_collector() {
    let s = setup();
    let new_treasury = Address::generate(&s.env);

    let id = s.contract
        .propose_change(&s.admin_a, &AdminAction::UpdateCollector(new_treasury.clone()))
        .unwrap();
    s.contract.approve_proposal(&s.admin_b, &id).unwrap();
    s.contract.execute_proposal(&s.admin_c, &id).unwrap();

    assert_eq!(s.contract.treasury(), new_treasury);
}

// ── Test 2 (Double Vote): Admin A cannot approve twice ────────────────────────

#[test]
fn test_double_vote_prevented() {
    let s = setup();

    let id = s.contract.propose_change(&s.admin_a, &AdminAction::UpdateFee(200)).unwrap();
    // admin_a already voted via propose_change — second vote must fail.
    let result = s.contract.approve_proposal(&s.admin_a, &id);
    assert_eq!(result, Err(Error::AlreadyApproved));
}

// ── Test 3 (Unauthorized): Non-admin cannot propose, approve, or execute ──────

#[test]
fn test_non_admin_cannot_propose() {
    let env = Env::default(); // no mock_all_auths
    let s = setup();
    let attacker = Address::generate(&s.env);

    // Without mock_all_auths the require_auth will panic.
    let result = std::panic::catch_unwind(|| {
        let c = SplitterV3Client::new(&env, s.contract.address());
        c.propose_change(&attacker, &AdminAction::UpdateFee(999))
    });
    assert!(result.is_err());
}

#[test]
fn test_non_admin_rejected_by_quorum_check() {
    let s = setup();
    // With mock_all_auths, auth passes but _require_quorum_admin rejects.
    let attacker = Address::generate(&s.env);
    let result = s.contract.propose_change(&attacker, &AdminAction::UpdateFee(999));
    assert_eq!(result, Err(Error::NotAuthorizedAdmin));
}

#[test]
fn test_non_admin_cannot_approve() {
    let s = setup();
    let id = s.contract.propose_change(&s.admin_a, &AdminAction::UpdateFee(200)).unwrap();
    let attacker = Address::generate(&s.env);
    let result = s.contract.approve_proposal(&attacker, &id);
    assert_eq!(result, Err(Error::NotAuthorizedAdmin));
}

#[test]
fn test_non_admin_cannot_execute() {
    let s = setup();
    let id = s.contract.propose_change(&s.admin_a, &AdminAction::UpdateFee(200)).unwrap();
    s.contract.approve_proposal(&s.admin_b, &id).unwrap();
    let attacker = Address::generate(&s.env);
    let result = s.contract.execute_proposal(&attacker, &id);
    assert_eq!(result, Err(Error::NotAuthorizedAdmin));
}

// ── Test 4 (Execution Guard): Cannot execute with only 1 approval ─────────────

#[test]
fn test_execute_with_one_approval_fails() {
    let s = setup();
    // propose_change gives 1 approval (admin_a). No further approvals.
    let id = s.contract.propose_change(&s.admin_a, &AdminAction::UpdateFee(300)).unwrap();
    let result = s.contract.execute_proposal(&s.admin_b, &id);
    assert_eq!(result, Err(Error::QuorumNotReached));

    // Fee must be unchanged.
    assert_eq!(s.contract.fee_bps(), 100u32);
}

// ── Test 5: Cannot execute an already-executed proposal ──────────────────────

#[test]
fn test_cannot_execute_twice() {
    let s = setup();
    let id = s.contract.propose_change(&s.admin_a, &AdminAction::UpdateFee(50)).unwrap();
    s.contract.approve_proposal(&s.admin_b, &id).unwrap();
    s.contract.execute_proposal(&s.admin_c, &id).unwrap();

    let result = s.contract.execute_proposal(&s.admin_c, &id);
    assert_eq!(result, Err(Error::AlreadyExecuted));
}

// ── Test 6: Proposal not found ────────────────────────────────────────────────

#[test]
fn test_approve_nonexistent_proposal_fails() {
    let s = setup();
    let result = s.contract.approve_proposal(&s.admin_b, &999u64);
    assert_eq!(result, Err(Error::ProposalNotFound));
}

// ── Test 7: #633 split still works after fee update via quorum ────────────────

#[test]
fn test_split_uses_updated_fee() {
    let s = setup();

    // Update fee to 0 via quorum.
    let id = s.contract.propose_change(&s.admin_a, &AdminAction::UpdateFee(0)).unwrap();
    s.contract.approve_proposal(&s.admin_b, &id).unwrap();
    s.contract.execute_proposal(&s.admin_c, &id).unwrap();

    let alice = Address::generate(&s.env);
    s.contract.set_verification_status(&alice, &true).unwrap();

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient { address: alice.clone(), share_bps: 10_000 });

    s.contract.split(&s.owner, &recipients, &1_000_000).unwrap();

    // 0% fee → alice gets the full amount.
    assert_eq!(s.token.balance(&alice), 1_000_000);
}

// ── Scheduled split tests ─────────────────────────────────────────────────────

use crate::{SplitStatus};
use soroban_sdk::testutils::Ledger as _;

#[test]
fn test_schedule_and_execute_split() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let bob = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient { address: alice.clone(), share_bps: 6_000 });
    recipients.push_back(Recipient { address: bob.clone(), share_bps: 4_000 });

    let now = s.env.ledger().timestamp();
    let release_time = now + 1_000;

    let split_id = s.contract
        .schedule_split(&s.owner, &recipients, &1_000_000, &release_time)
        .unwrap();

    // Advance ledger past release_time.
    s.env.ledger().with_mut(|l| l.timestamp = release_time + 1);

    s.contract.execute_split(&split_id).unwrap();

    // 1% fee (100 bps) → distributable = 990_000
    // alice: 990_000 * 6000 / 10000 = 594_000
    // bob:   990_000 * 4000 / 10000 = 396_000
    assert_eq!(s.token.balance(&alice), 594_000);
    assert_eq!(s.token.balance(&bob), 396_000);

    let config = s.contract.get_split(split_id).unwrap();
    assert_eq!(config.status, SplitStatus::Executed);
}

#[test]
fn test_cancel_split_refunds_sender() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient { address: alice.clone(), share_bps: 10_000 });

    let now = s.env.ledger().timestamp();
    let release_time = now + 1_000;
    let initial_balance = s.token.balance(&s.owner);

    let split_id = s.contract
        .schedule_split(&s.owner, &recipients, &500_000, &release_time)
        .unwrap();

    // Tokens are locked — owner balance reduced.
    assert_eq!(s.token.balance(&s.owner), initial_balance - 500_000);

    // Cancel before release_time.
    s.contract.cancel_split(&s.owner, &split_id).unwrap();

    // Tokens fully refunded.
    assert_eq!(s.token.balance(&s.owner), initial_balance);

    let config = s.contract.get_split(split_id).unwrap();
    assert_eq!(config.status, SplitStatus::Cancelled);
}

#[test]
fn test_cancel_split_wrong_sender_rejected() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let attacker = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient { address: alice.clone(), share_bps: 10_000 });

    let now = s.env.ledger().timestamp();
    let split_id = s.contract
        .schedule_split(&s.owner, &recipients, &100_000, &(now + 1_000))
        .unwrap();

    let result = s.contract.cancel_split(&attacker, &split_id);
    assert_eq!(result, Err(Error::NotSplitSender));
}

#[test]
fn test_cancel_split_after_release_time_rejected() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient { address: alice.clone(), share_bps: 10_000 });

    let now = s.env.ledger().timestamp();
    let release_time = now + 500;

    let split_id = s.contract
        .schedule_split(&s.owner, &recipients, &100_000, &release_time)
        .unwrap();

    // Advance past release_time.
    s.env.ledger().with_mut(|l| l.timestamp = release_time + 1);

    let result = s.contract.cancel_split(&s.owner, &split_id);
    assert_eq!(result, Err(Error::SplitNotYetDue));
}

#[test]
fn test_execute_split_before_release_time_rejected() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient { address: alice.clone(), share_bps: 10_000 });

    let now = s.env.ledger().timestamp();
    let split_id = s.contract
        .schedule_split(&s.owner, &recipients, &100_000, &(now + 1_000))
        .unwrap();

    let result = s.contract.execute_split(&split_id);
    assert_eq!(result, Err(Error::NotYetReleased));
}

#[test]
fn test_cancel_already_cancelled_split_rejected() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient { address: alice.clone(), share_bps: 10_000 });

    let now = s.env.ledger().timestamp();
    let split_id = s.contract
        .schedule_split(&s.owner, &recipients, &100_000, &(now + 1_000))
        .unwrap();

    s.contract.cancel_split(&s.owner, &split_id).unwrap();

    let result = s.contract.cancel_split(&s.owner, &split_id);
    assert_eq!(result, Err(Error::SplitAlreadyCancelled));
}

#[test]
fn test_cancel_executed_split_rejected() {
    let s = setup();
    let alice = Address::generate(&s.env);

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient { address: alice.clone(), share_bps: 10_000 });

    let now = s.env.ledger().timestamp();
    let release_time = now + 500;

    let split_id = s.contract
        .schedule_split(&s.owner, &recipients, &100_000, &release_time)
        .unwrap();

    s.env.ledger().with_mut(|l| l.timestamp = release_time + 1);
    s.contract.execute_split(&split_id).unwrap();

    let result = s.contract.cancel_split(&s.owner, &split_id);
    assert_eq!(result, Err(Error::SplitAlreadyExecuted));
}

// ── Pull-based claimable balance tests ───────────────────────────────────────

#[test]
fn test_split_pull_credits_claimable_balances() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let bob = Address::generate(&s.env);
    let token_addr = s.token.address.clone();

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient { address: alice.clone(), share_bps: 7_000 });
    recipients.push_back(Recipient { address: bob.clone(), share_bps: 3_000 });

    // Use 0% fee for clean math.
    let id = s.contract.propose_change(&s.admin_a, &AdminAction::UpdateFee(0)).unwrap();
    s.contract.approve_proposal(&s.admin_b, &id).unwrap();
    s.contract.execute_proposal(&s.admin_c, &id).unwrap();

    s.contract.split_pull(&s.owner, &recipients, &1_000_000).unwrap();

    // Tokens NOT yet in wallets — still in contract.
    assert_eq!(s.token.balance(&alice), 0);
    assert_eq!(s.token.balance(&bob), 0);

    // Claimable balances credited correctly.
    assert_eq!(s.contract.claimable_balance(&alice, &token_addr), 700_000);
    assert_eq!(s.contract.claimable_balance(&bob, &token_addr), 300_000);
}

#[test]
fn test_claim_share_transfers_and_zeroes_balance() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let token_addr = s.token.address.clone();

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient { address: alice.clone(), share_bps: 10_000 });

    let id = s.contract.propose_change(&s.admin_a, &AdminAction::UpdateFee(0)).unwrap();
    s.contract.approve_proposal(&s.admin_b, &id).unwrap();
    s.contract.execute_proposal(&s.admin_c, &id).unwrap();

    s.contract.split_pull(&s.owner, &recipients, &500_000).unwrap();

    // Alice claims her share.
    s.contract.claim_share(&alice, &token_addr).unwrap();

    assert_eq!(s.token.balance(&alice), 500_000);
    // Balance zeroed after claim.
    assert_eq!(s.contract.claimable_balance(&alice, &token_addr), 0);
}

#[test]
fn test_claim_share_nothing_to_claim_rejected() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let token_addr = s.token.address.clone();

    let result = s.contract.claim_share(&alice, &token_addr);
    assert_eq!(result, Err(Error::NothingToClaim));
}

#[test]
fn test_split_pull_fee_deducted_before_crediting() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let token_addr = s.token.address.clone();

    // Default fee is 100 bps (1%).
    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient { address: alice.clone(), share_bps: 10_000 });

    s.contract.split_pull(&s.owner, &recipients, &1_000_000).unwrap();

    // Fee = 10_000; distributable = 990_000 → alice gets 990_000.
    assert_eq!(s.contract.claimable_balance(&alice, &token_addr), 990_000);
    // Treasury received the fee immediately.
    assert_eq!(s.token.balance(&s.treasury), 10_000);
}

#[test]
fn test_multiple_split_pulls_accumulate_balance() {
    let s = setup();
    let alice = Address::generate(&s.env);
    let token_addr = s.token.address.clone();

    let mut recipients = Vec::new(&s.env);
    recipients.push_back(Recipient { address: alice.clone(), share_bps: 10_000 });

    let id = s.contract.propose_change(&s.admin_a, &AdminAction::UpdateFee(0)).unwrap();
    s.contract.approve_proposal(&s.admin_b, &id).unwrap();
    s.contract.execute_proposal(&s.admin_c, &id).unwrap();

    s.contract.split_pull(&s.owner, &recipients, &200_000).unwrap();
    s.contract.split_pull(&s.owner, &recipients, &300_000).unwrap();

    // Balances accumulate across multiple pulls before claiming.
    assert_eq!(s.contract.claimable_balance(&alice, &token_addr), 500_000);

    s.contract.claim_share(&alice, &token_addr).unwrap();
    assert_eq!(s.token.balance(&alice), 500_000);
}
