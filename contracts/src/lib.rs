#![no_std]
#![allow(clippy::too_many_arguments)]

mod errors;
mod storage;
mod types;

use errors::Error;
use soroban_sdk::{contract, contractimpl, token, Address, Env, Vec};
use storage::{PROPOSAL_COUNT, RECEIPT, STREAM_COUNT};
use types::{Milestone, ReceiptMetadata, Stream, StreamProposal, StreamReceipt};

#[contract]
pub struct StellarStreamContract;

#[contractimpl]
impl StellarStreamContract {
    pub fn create_proposal(
        env: Env,
        sender: Address,
        receiver: Address,
        token: Address,
        total_amount: i128,
        start_time: u64,
        end_time: u64,
        required_approvals: u32,
        deadline: u64,
    ) -> Result<u64, Error> {
        sender.require_auth();

        if start_time >= end_time {
            return Err(Error::InvalidTimeRange);
        }
        if total_amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if required_approvals == 0 {
            return Err(Error::InvalidApprovalThreshold);
        }
        if deadline <= env.ledger().timestamp() {
            return Err(Error::ProposalExpired);
        }

        let proposal_id: u64 = env.storage().instance().get(&PROPOSAL_COUNT).unwrap_or(0);
        let next_id = proposal_id + 1;

        let proposal = StreamProposal {
            sender: sender.clone(),
            receiver,
            token,
            total_amount,
            start_time,
            end_time,
            approvers: Vec::new(&env),
            required_approvals,
            deadline,
            executed: false,
        };

        env.storage()
            .instance()
            .set(&(PROPOSAL_COUNT, proposal_id), &proposal);
        env.storage().instance().set(&PROPOSAL_COUNT, &next_id);

        Ok(proposal_id)
    }

    pub fn approve_proposal(env: Env, proposal_id: u64, approver: Address) -> Result<(), Error> {
        approver.require_auth();

        let key = (PROPOSAL_COUNT, proposal_id);
        let mut proposal: StreamProposal = env
            .storage()
            .instance()
            .get(&key)
            .ok_or(Error::ProposalNotFound)?;

        if proposal.executed {
            return Err(Error::ProposalAlreadyExecuted);
        }
        if env.ledger().timestamp() > proposal.deadline {
            return Err(Error::ProposalExpired);
        }

        for existing_approver in proposal.approvers.iter() {
            if existing_approver == approver {
                return Err(Error::AlreadyApproved);
            }
        }

        proposal.approvers.push_back(approver);
        let approval_count = proposal.approvers.len();

        if approval_count >= proposal.required_approvals {
            proposal.executed = true;
            env.storage().instance().set(&key, &proposal);
            Self::execute_proposal(env, proposal)?;
        } else {
            env.storage().instance().set(&key, &proposal);
        }

        Ok(())
    }

    fn execute_proposal(env: Env, proposal: StreamProposal) -> Result<u64, Error> {
        let token_client = token::Client::new(&env, &proposal.token);
        token_client.transfer(
            &proposal.sender,
            &env.current_contract_address(),
            &proposal.total_amount,
        );

        let stream_id: u64 = env.storage().instance().get(&STREAM_COUNT).unwrap_or(0);
        let next_id = stream_id + 1;

        let stream = Stream {
            sender: proposal.sender,
            receiver: proposal.receiver.clone(),
            token: proposal.token,
            total_amount: proposal.total_amount,
            start_time: proposal.start_time,
            end_time: proposal.end_time,
            withdrawn: 0,
            cancelled: false,
            receipt_owner: proposal.receiver.clone(),
            is_paused: false,
            paused_time: 0,
            total_paused_duration: 0,
            milestones: Vec::new(&env),
        };

        env.storage()
            .instance()
            .set(&(STREAM_COUNT, stream_id), &stream);
        env.storage().instance().set(&STREAM_COUNT, &next_id);

        Self::mint_receipt(&env, stream_id, &proposal.receiver);

        Ok(stream_id)
    }

    pub fn create_stream(
        env: Env,
        sender: Address,
        receiver: Address,
        token: Address,
        total_amount: i128,
        start_time: u64,
        end_time: u64,
    ) -> Result<u64, Error> {
        let milestones = Vec::new(&env);
        Self::create_stream_with_milestones(
            env,
            sender,
            receiver,
            token,
            total_amount,
            start_time,
            end_time,
            milestones,
        )
    }

    pub fn create_stream_with_milestones(
        env: Env,
        sender: Address,
        receiver: Address,
        token: Address,
        total_amount: i128,
        start_time: u64,
        end_time: u64,
        milestones: Vec<Milestone>,
    ) -> Result<u64, Error> {
        sender.require_auth();

        if start_time >= end_time {
            return Err(Error::InvalidTimeRange);
        }
        if total_amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sender, &env.current_contract_address(), &total_amount);

        let stream_id: u64 = env.storage().instance().get(&STREAM_COUNT).unwrap_or(0);
        let next_id = stream_id + 1;

        let stream = Stream {
            sender,
            receiver: receiver.clone(),
            token,
            total_amount,
            start_time,
            end_time,
            withdrawn: 0,
            cancelled: false,
            receipt_owner: receiver.clone(),
            is_paused: false,
            paused_time: 0,
            total_paused_duration: 0,
            milestones,
        };

        env.storage()
            .instance()
            .set(&(STREAM_COUNT, stream_id), &stream);
        env.storage().instance().set(&STREAM_COUNT, &next_id);

        Self::mint_receipt(&env, stream_id, &receiver);

        Ok(stream_id)
    }

    pub fn pause_stream(env: Env, stream_id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();

        let key = (STREAM_COUNT, stream_id);
        let mut stream: Stream = env
            .storage()
            .instance()
            .get(&key)
            .ok_or(Error::StreamNotFound)?;

        if stream.sender != caller {
            return Err(Error::Unauthorized);
        }
        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }
        if stream.is_paused {
            return Ok(());
        }

        stream.is_paused = true;
        stream.paused_time = env.ledger().timestamp();
        env.storage().instance().set(&key, &stream);

        Ok(())
    }

    pub fn unpause_stream(env: Env, stream_id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();

        let key = (STREAM_COUNT, stream_id);
        let mut stream: Stream = env
            .storage()
            .instance()
            .get(&key)
            .ok_or(Error::StreamNotFound)?;

        if stream.sender != caller {
            return Err(Error::Unauthorized);
        }
        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }
        if !stream.is_paused {
            return Ok(());
        }

        let current_time = env.ledger().timestamp();
        let pause_duration = current_time - stream.paused_time;
        stream.total_paused_duration += pause_duration;
        stream.is_paused = false;
        stream.paused_time = 0;

        env.storage().instance().set(&key, &stream);

        Ok(())
    }

    fn mint_receipt(env: &Env, stream_id: u64, owner: &Address) {
        let receipt = StreamReceipt {
            stream_id,
            owner: owner.clone(),
            minted_at: env.ledger().timestamp(),
        };
        env.storage()
            .instance()
            .set(&(RECEIPT, stream_id), &receipt);
    }

    pub fn transfer_receipt(
        env: Env,
        stream_id: u64,
        from: Address,
        to: Address,
    ) -> Result<(), Error> {
        from.require_auth();

        let receipt_key = (RECEIPT, stream_id);
        let receipt: StreamReceipt = env
            .storage()
            .instance()
            .get(&receipt_key)
            .ok_or(Error::StreamNotFound)?;

        if receipt.owner != from {
            return Err(Error::NotReceiptOwner);
        }

        let stream_key = (STREAM_COUNT, stream_id);
        let mut stream: Stream = env
            .storage()
            .instance()
            .get(&stream_key)
            .ok_or(Error::StreamNotFound)?;

        stream.receipt_owner = to.clone();
        env.storage().instance().set(&stream_key, &stream);

        let new_receipt = StreamReceipt {
            stream_id,
            owner: to,
            minted_at: receipt.minted_at,
        };
        env.storage().instance().set(&receipt_key, &new_receipt);

        Ok(())
    }

    pub fn get_receipt(env: Env, stream_id: u64) -> Result<StreamReceipt, Error> {
        env.storage()
            .instance()
            .get(&(RECEIPT, stream_id))
            .ok_or(Error::StreamNotFound)
    }

    pub fn get_receipt_metadata(env: Env, stream_id: u64) -> Result<ReceiptMetadata, Error> {
        let stream: Stream = env
            .storage()
            .instance()
            .get(&(STREAM_COUNT, stream_id))
            .ok_or(Error::StreamNotFound)?;

        let current_time = env.ledger().timestamp();
        let unlocked = Self::calculate_unlocked(&stream, current_time);
        let locked = stream.total_amount - unlocked;

        Ok(ReceiptMetadata {
            stream_id,
            locked_balance: locked,
            unlocked_balance: unlocked - stream.withdrawn,
            total_amount: stream.total_amount,
            token: stream.token,
        })
    }

    pub fn withdraw(env: Env, stream_id: u64, caller: Address) -> Result<i128, Error> {
        caller.require_auth();

        let receipt: StreamReceipt = env
            .storage()
            .instance()
            .get(&(RECEIPT, stream_id))
            .ok_or(Error::StreamNotFound)?;

        if receipt.owner != caller {
            return Err(Error::NotReceiptOwner);
        }

        let key = (STREAM_COUNT, stream_id);
        let mut stream: Stream = env
            .storage()
            .instance()
            .get(&key)
            .ok_or(Error::StreamNotFound)?;

        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }
        if stream.is_paused {
            return Err(Error::StreamPaused);
        }

        let current_time = env.ledger().timestamp();
        let unlocked = Self::calculate_unlocked(&stream, current_time);
        let withdrawable = unlocked - stream.withdrawn;

        if withdrawable <= 0 {
            return Err(Error::InsufficientBalance);
        }

        stream.withdrawn += withdrawable;
        env.storage().instance().set(&key, &stream);

        let token_client = token::Client::new(&env, &stream.token);
        token_client.transfer(&env.current_contract_address(), &caller, &withdrawable);

        Ok(withdrawable)
    }

    pub fn cancel(env: Env, stream_id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();

        let key = (STREAM_COUNT, stream_id);
        let mut stream: Stream = env
            .storage()
            .instance()
            .get(&key)
            .ok_or(Error::StreamNotFound)?;

        let receipt: StreamReceipt = env
            .storage()
            .instance()
            .get(&(RECEIPT, stream_id))
            .ok_or(Error::StreamNotFound)?;

        if stream.sender != caller && receipt.owner != caller {
            return Err(Error::Unauthorized);
        }
        if stream.cancelled {
            return Err(Error::AlreadyCancelled);
        }

        let current_time = env.ledger().timestamp();
        let unlocked = Self::calculate_unlocked(&stream, current_time);
        let to_receiver = unlocked - stream.withdrawn;
        let to_sender = stream.total_amount - unlocked;

        stream.cancelled = true;
        stream.withdrawn = unlocked;
        env.storage().instance().set(&key, &stream);

        let token_client = token::Client::new(&env, &stream.token);
        if to_receiver > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &receipt.owner,
                &to_receiver,
            );
        }
        if to_sender > 0 {
            token_client.transfer(&env.current_contract_address(), &stream.sender, &to_sender);
        }

        Ok(())
    }

    pub fn get_stream(env: Env, stream_id: u64) -> Result<Stream, Error> {
        env.storage()
            .instance()
            .get(&(STREAM_COUNT, stream_id))
            .ok_or(Error::StreamNotFound)
    }

    pub fn get_proposal(env: Env, proposal_id: u64) -> Result<StreamProposal, Error> {
        env.storage()
            .instance()
            .get(&(PROPOSAL_COUNT, proposal_id))
            .ok_or(Error::ProposalNotFound)
    }

    fn calculate_unlocked(stream: &Stream, current_time: u64) -> i128 {
        if current_time <= stream.start_time {
            return 0;
        }

        let mut effective_time = current_time;
        if stream.is_paused {
            effective_time = stream.paused_time;
        }

        let adjusted_end = stream.end_time + stream.total_paused_duration;
        if effective_time >= adjusted_end {
            return stream.total_amount;
        }

        let elapsed = (effective_time - stream.start_time) as i128;
        let paused = stream.total_paused_duration as i128;
        let effective_elapsed = elapsed - paused;

        if effective_elapsed <= 0 {
            return 0;
        }

        let duration = (stream.end_time - stream.start_time) as i128;
        let linear_unlocked = (stream.total_amount * effective_elapsed) / duration;

        if stream.milestones.is_empty() {
            return linear_unlocked;
        }

        let mut milestone_cap = 0i128;
        for milestone in stream.milestones.iter() {
            if effective_time >= milestone.timestamp {
                let cap = (stream.total_amount * milestone.percentage as i128) / 100;
                if cap > milestone_cap {
                    milestone_cap = cap;
                }
            }
        }

        if linear_unlocked < milestone_cap {
            linear_unlocked
        } else {
            milestone_cap
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        token::{StellarAssetClient, TokenClient},
        Address, Env,
    };

    fn create_token_contract<'a>(env: &Env, admin: &Address) -> (Address, TokenClient<'a>) {
        let contract_id = env
            .register_stellar_asset_contract_v2(admin.clone())
            .address();
        (contract_id.clone(), TokenClient::new(env, &contract_id))
    }

    #[test]
    fn test_create_proposal() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|li| li.timestamp = 50);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let proposal_id =
            client.create_proposal(&sender, &receiver, &token_id, &1000, &100, &200, &2, &1000);

        assert_eq!(proposal_id, 0);
    }

    #[test]
    fn test_approve_proposal() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 50);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let approver1 = Address::generate(&env);
        let approver2 = Address::generate(&env);

        let proposal_id =
            client.create_proposal(&sender, &receiver, &token_id, &1000, &100, &200, &2, &1000);

        client.approve_proposal(&proposal_id, &approver1);

        let proposal = client.get_proposal(&proposal_id);
        assert_eq!(proposal.approvers.len(), 1);
        assert!(!proposal.executed);

        client.approve_proposal(&proposal_id, &approver2);

        let proposal = client.get_proposal(&proposal_id);
        assert_eq!(proposal.approvers.len(), 2);
        assert!(proposal.executed);
    }

    #[test]
    fn test_duplicate_approval_fails() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|li| li.timestamp = 50);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let approver = Address::generate(&env);

        let proposal_id =
            client.create_proposal(&sender, &receiver, &token_id, &1000, &100, &200, &2, &1000);

        client.approve_proposal(&proposal_id, &approver);
        let result = client.try_approve_proposal(&proposal_id, &approver);

        assert_eq!(result, Err(Ok(Error::AlreadyApproved)));
    }

    #[test]
    fn test_proposal_not_found() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let approver = Address::generate(&env);
        let result = client.try_approve_proposal(&999, &approver);

        assert_eq!(result, Err(Ok(Error::ProposalNotFound)));
    }

    #[test]
    fn test_invalid_time_range() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let result =
            client.try_create_proposal(&sender, &receiver, &token_id, &1000, &200, &100, &2, &1000);

        assert_eq!(result, Err(Ok(Error::InvalidTimeRange)));
    }

    #[test]
    fn test_invalid_amount() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let result =
            client.try_create_proposal(&sender, &receiver, &token_id, &0, &100, &200, &2, &1000);

        assert_eq!(result, Err(Ok(Error::InvalidAmount)));
    }

    #[test]
    fn test_invalid_approval_threshold() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let result =
            client.try_create_proposal(&sender, &receiver, &token_id, &1000, &100, &200, &0, &1000);

        assert_eq!(result, Err(Ok(Error::InvalidApprovalThreshold)));
    }

    #[test]
    fn test_create_direct_stream() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(&sender, &receiver, &token_id, &1000, &100, &200);

        assert_eq!(stream_id, 0);

        let stream = client.get_stream(&stream_id);
        assert_eq!(stream.total_amount, 1000);
        assert!(!stream.cancelled);
        assert_eq!(stream.receipt_owner, receiver);

        let receipt = client.get_receipt(&stream_id);
        assert_eq!(receipt.stream_id, stream_id);
        assert_eq!(receipt.owner, receiver);
    }

    #[test]
    fn test_receipt_transfer() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let new_owner = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(&sender, &receiver, &token_id, &1000, &100, &200);

        client.transfer_receipt(&stream_id, &receiver, &new_owner);

        let receipt = client.get_receipt(&stream_id);
        assert_eq!(receipt.owner, new_owner);

        let stream = client.get_stream(&stream_id);
        assert_eq!(stream.receipt_owner, new_owner);
    }

    #[test]
    fn test_withdraw_with_receipt_owner() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 150);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let new_owner = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(&sender, &receiver, &token_id, &1000, &100, &200);

        client.transfer_receipt(&stream_id, &receiver, &new_owner);

        let result = client.try_withdraw(&stream_id, &receiver);
        assert_eq!(result, Err(Ok(Error::NotReceiptOwner)));

        let withdrawn = client.withdraw(&stream_id, &new_owner);
        assert!(withdrawn > 0);
    }

    #[test]
    fn test_receipt_metadata() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 150);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(&sender, &receiver, &token_id, &1000, &100, &200);

        let metadata = client.get_receipt_metadata(&stream_id);
        assert_eq!(metadata.stream_id, stream_id);
        assert_eq!(metadata.total_amount, 1000);
        assert_eq!(metadata.token, token_id);
        assert!(metadata.unlocked_balance > 0);
        assert!(metadata.locked_balance < 1000);
    }

    #[test]
    fn test_three_of_five_multisig() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 50);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &100000);

        let proposal_id =
            client.create_proposal(&sender, &receiver, &token_id, &50000, &100, &200, &3, &1000);

        let approver1 = Address::generate(&env);
        let approver2 = Address::generate(&env);
        let approver3 = Address::generate(&env);

        client.approve_proposal(&proposal_id, &approver1);
        let proposal = client.get_proposal(&proposal_id);
        assert!(!proposal.executed);

        client.approve_proposal(&proposal_id, &approver2);
        let proposal = client.get_proposal(&proposal_id);
        assert!(!proposal.executed);

        client.approve_proposal(&proposal_id, &approver3);
        let proposal = client.get_proposal(&proposal_id);
        assert!(proposal.executed);
        assert_eq!(proposal.approvers.len(), 3);
    }

    #[test]
    fn test_approve_already_executed_proposal() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 50);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let proposal_id =
            client.create_proposal(&sender, &receiver, &token_id, &1000, &100, &200, &1, &1000);

        let approver1 = Address::generate(&env);
        client.approve_proposal(&proposal_id, &approver1);

        let approver2 = Address::generate(&env);
        let result = client.try_approve_proposal(&proposal_id, &approver2);

        assert_eq!(result, Err(Ok(Error::ProposalAlreadyExecuted)));
    }

    #[test]
    fn test_pause_unpause_stream() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 100);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(&sender, &receiver, &token_id, &1000, &100, &300);

        env.ledger().with_mut(|li| li.timestamp = 150);
        client.pause_stream(&stream_id, &sender);

        let stream = client.get_stream(&stream_id);
        assert!(stream.is_paused);
        assert_eq!(stream.paused_time, 150);

        env.ledger().with_mut(|li| li.timestamp = 200);
        client.unpause_stream(&stream_id, &sender);

        let stream = client.get_stream(&stream_id);
        assert!(!stream.is_paused);
        assert_eq!(stream.total_paused_duration, 50);
    }

    #[test]
    fn test_withdraw_paused_fails() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 100);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(&sender, &receiver, &token_id, &1000, &100, &300);

        client.pause_stream(&stream_id, &sender);

        env.ledger().with_mut(|li| li.timestamp = 150);
        let result = client.try_withdraw(&stream_id, &receiver);

        assert_eq!(result, Err(Ok(Error::StreamPaused)));
    }

    #[test]
    fn test_pause_adjusts_unlocked_balance() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 100);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let stream_id = client.create_stream(&sender, &receiver, &token_id, &1000, &100, &300);

        env.ledger().with_mut(|li| li.timestamp = 150);
        let metadata_before = client.get_receipt_metadata(&stream_id);
        let unlocked_before = metadata_before.unlocked_balance;

        client.pause_stream(&stream_id, &sender);

        env.ledger().with_mut(|li| li.timestamp = 200);
        let metadata_paused = client.get_receipt_metadata(&stream_id);

        assert_eq!(metadata_paused.unlocked_balance, unlocked_before);

        client.unpause_stream(&stream_id, &sender);

        env.ledger().with_mut(|li| li.timestamp = 250);
        let withdrawn = client.withdraw(&stream_id, &receiver);
        assert!(withdrawn > 0);
    }

    #[test]
    fn test_quarterly_vesting() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 0);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let mut milestones = Vec::new(&env);
        milestones.push_back(Milestone {
            timestamp: 90,
            percentage: 25,
        });
        milestones.push_back(Milestone {
            timestamp: 180,
            percentage: 50,
        });
        milestones.push_back(Milestone {
            timestamp: 270,
            percentage: 75,
        });
        milestones.push_back(Milestone {
            timestamp: 360,
            percentage: 100,
        });

        let stream_id = client.create_stream_with_milestones(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &0,
            &360,
            &milestones,
        );

        env.ledger().with_mut(|li| li.timestamp = 45);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert!(metadata.unlocked_balance <= 250);

        env.ledger().with_mut(|li| li.timestamp = 100);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert_eq!(metadata.unlocked_balance, 250);

        env.ledger().with_mut(|li| li.timestamp = 200);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert_eq!(metadata.unlocked_balance, 500);
    }

    #[test]
    fn test_hybrid_streaming() {
        let env = Env::default();
        env.mock_all_auths_allowing_non_root_auth();
        env.ledger().with_mut(|li| li.timestamp = 0);

        let contract_id = env.register(StellarStreamContract, ());
        let client = StellarStreamContractClient::new(&env, &contract_id);

        let sender = Address::generate(&env);
        let receiver = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_id, _) = create_token_contract(&env, &admin);

        let token_admin_client = StellarAssetClient::new(&env, &token_id);
        token_admin_client.mint(&sender, &10000);

        let mut milestones = Vec::new(&env);
        milestones.push_back(Milestone {
            timestamp: 100,
            percentage: 50,
        });

        let stream_id = client.create_stream_with_milestones(
            &sender,
            &receiver,
            &token_id,
            &1000,
            &0,
            &200,
            &milestones,
        );

        env.ledger().with_mut(|li| li.timestamp = 50);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert!(metadata.unlocked_balance <= 250);

        env.ledger().with_mut(|li| li.timestamp = 150);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert_eq!(metadata.unlocked_balance, 500);

        env.ledger().with_mut(|li| li.timestamp = 200);
        let metadata = client.get_receipt_metadata(&stream_id);
        assert_eq!(metadata.unlocked_balance, 1000);
    }
}
