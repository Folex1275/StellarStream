use soroban_sdk::{contractclient, contracterror, contracttype, Address, BytesN, Env, Vec};

#[contracttype]
#[derive(Clone)]
pub enum CurveType {
    Linear = 0,
    Exponential = 1,
}

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub timestamp: u64,
    pub percentage: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct Stream {
    pub sender: Address,
    pub receiver: Address,
    pub token: Address,
    pub total_amount: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub withdrawn: i128,
    pub withdrawn_amount: i128,
    pub cancelled: bool,
    pub receipt_owner: Address,
    pub is_paused: bool,
    pub paused_time: u64,
    pub total_paused_duration: u64,
    pub milestones: Vec<Milestone>,
    pub curve_type: CurveType,
    pub interest_strategy: u32,
    pub vault_address: Option<Address>,
    pub deposited_principal: i128,
    pub metadata: Option<BytesN<32>>,
    pub is_usd_pegged: bool,
    pub usd_amount: i128,
    pub oracle_address: Address,
    pub oracle_max_staleness: u64,
    pub price_min: i128,
    pub price_max: i128,
    pub is_soulbound: bool,
    pub clawback_enabled: bool,
    pub arbiter: Option<Address>,
    pub is_frozen: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    Unknown = 1,
}

#[contractclient(name = "Client")]
pub trait V1Contract {
    fn get_stream(env: Env, stream_id: u64) -> Result<Stream, Error>;
    fn cancel(env: Env, stream_id: u64, caller: Address) -> Result<(), Error>;
}
