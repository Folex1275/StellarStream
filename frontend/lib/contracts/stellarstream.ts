/**
 * StellarStream Contract Interface Bindings
 * Auto-generated from contract metadata and soroban contract inspect
 * 
 * Generated: February 2026
 * Contract Version: 0.1.0
 * 
 * This file provides TypeScript type definitions for the StellarStream contract.
 * It enables type-safe interactions between the frontend and smart contract.
 */

// ============================================================================
// Core Data Types
// ============================================================================

export interface Stream {
  streamId: bigint;
  sender: string;
  receiver: string;
  token: string;
  totalAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  withdrawn: bigint;
  cancelled: boolean;
  isPaused: boolean;
  pausedTime: bigint;
  curveType: CurveType;
  interestStrategy: number;
}

export interface StreamProposal {
  proposalId: bigint;
  sender: string;
  receiver: string;
  token: string;
  totalAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  approvers: string[];
  requiredApprovals: number;
  deadline: bigint;
  executed: boolean;
}

export interface ReceiptMetadata {
  streamId: bigint;
  totalAmount: bigint;
  unlockedBalance: bigint;
  lockedBalance: bigint;
  token: string;
  receiver: string;
}

export type CurveType = "Linear" | "Exponential";

export type Role = "Admin" | "Pauser" | "TreasuryManager";

export enum ErrorCode {
  InvalidTimeRange = 2,
  InvalidAmount = 3,
  ProposalNotFound = 8,
  ProposalExpired = 9,
  AlreadyApproved = 10,
  ProposalAlreadyExecuted = 11,
  InvalidApprovalThreshold = 12,
  StreamNotFound = 13,
  Unauthorized = 14,
}

// ============================================================================
// Function Parameter Types
// ============================================================================

export interface CreateProposalParams {
  sender: string;
  receiver: string;
  token: string;
  totalAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  requiredApprovals: number;
  deadline: bigint;
}

export interface ApproveProposalParams {
  proposalId: bigint;
  approver: string;
}

export interface CreateStreamParams {
  sender: string;
  receiver: string;
  token: string;
  totalAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  curveType?: CurveType;
}

export interface WithdrawParams {
  streamId: bigint;
  amount: bigint;
}

export interface CancelStreamParams {
  streamId: bigint;
}

export interface PauseStreamParams {
  streamId: bigint;
}

export interface UnpauseStreamParams {
  streamId: bigint;
}

export interface GrantRoleParams {
  target: string;
  role: Role;
}

export interface RevokeRoleParams {
  target: string;
  role: Role;
}

export interface RestrictAddressParams {
  address: string;
}

export interface UnrestrictAddressParams {
  address: string;
}

export interface DepositGasBufferParams {
  amount: bigint;
  /** Caller / payer address */
  from: string;
}

export interface WithdrawGasBufferParams {
  amount: bigint;
  /** Destination address for the withdrawn XLM */
  to: string;
}

// ============================================================================
// Contract Interface
// ============================================================================

/**
 * StellarStream Contract Client
 * 
 * Multi-signature token streaming contract with:
 * - Dynamic vesting curves (linear/exponential)
 * - Multi-sig proposal system (M-of-N approvals)
 * - Yield optimization support
 * - OFAC compliance
 * - Role-based access control (RBAC)
 * - Stream pause/resume capabilities
 * - Receipt NFT for stream ownership
 */
export interface StellarStreamContractClient {
  // ========== Proposal Functions ==========
  
  /**
   * Create a multi-signature proposal for token streaming
   * @returns Proposal ID (u64)
   */
  createProposal(params: CreateProposalParams): Promise<bigint>;

  /**
   * Approve a proposal (auto-executes when threshold reached)
   * @throws If proposal expired or already approved by approver
   */
  approveProposal(params: ApproveProposalParams): Promise<void>;

  /**
   * Query proposal details
   */
  getProposal(proposalId: bigint): Promise<StreamProposal>;

  // ========== Stream Functions ==========

  /**
   * Create a stream directly (no multisig required)
   * @returns Stream ID (u64)
   */
  createStream(params: CreateStreamParams): Promise<bigint>;

  /**
   * Withdraw unlocked tokens from stream
   * @throws If amount exceeds available balance
   */
  withdraw(params: WithdrawParams): Promise<void>;

  /**
   * Cancel an active stream and return funds
   * Only sender can cancel
   */
  cancelStream(params: CancelStreamParams): Promise<void>;

  /**
   * Query stream details
   */
  getStream(streamId: bigint): Promise<Stream>;

  /**
   * Calculate withdrawable amount at current time
   */
  getWithdrawable(streamId: bigint): Promise<bigint>;

  /**
   * Pause a stream (stops token flow)
   */
  pauseStream(params: PauseStreamParams): Promise<void>;

  /**
   * Resume a paused stream
   */
  unpauseStream(params: UnpauseStreamParams): Promise<void>;

  // ========== Receipt NFT Functions ==========

  /**
   * Get metadata for a stream receipt NFT
   */
  getReceiptMetadata(streamId: bigint): Promise<ReceiptMetadata>;

  /**
   * Get all receipts owned by an address
   */
  getReceiptsByOwner(owner: string): Promise<bigint[]>;

  /**
   * Claim a receipt NFT for a stream
   */
  claimReceipt(streamId: bigint): Promise<void>;

  // ========== Gas Buffer Functions ==========

  /**
   * Deposit XLM into the organisation's gas buffer.
   * TreasuryManager or Admin only.
   */
  depositGasBuffer(params: DepositGasBufferParams): Promise<void>;

  /**
   * Withdraw XLM from the organisation's gas buffer.
   * TreasuryManager or Admin only.
   */
  withdrawGasBuffer(params: WithdrawGasBufferParams): Promise<void>;

  /**
   * Query the current gas buffer balance in stroops.
   */
  getGasBufferBalance(): Promise<bigint>;

  // ========== RBAC Functions ==========

  /**
   * Grant a role to an address (Admin only)
   */
  grantRole(params: GrantRoleParams): Promise<void>;

  /**
   * Revoke a role from an address (Admin only)
   */
  revokeRole(params: RevokeRoleParams): Promise<void>;

  /**
   * Check if an address has a specific role
   */
  checkRole(address: string, role: Role): Promise<boolean>;

  // ========== OFAC Compliance Functions ==========

  /**
   * Restrict an address from receiving streams
   * @throws If not called by Admin
   */
  restrictAddress(params: RestrictAddressParams): Promise<void>;

  /**
   * Remove restriction from an address (Admin only)
   */
  unrestrictAddress(params: UnrestrictAddressParams): Promise<void>;

  /**
   * Check if an address is restricted
   */
  isAddressRestricted(address: string): Promise<boolean>;

  /**
   * Get all restricted addresses
   */
  getRestrictedAddresses(): Promise<string[]>;

  // ========== Utility Functions ==========

  /**
   * Get current contract version
   */
  getVersion(): Promise<string>;

  /**
   * Get contract metadata
   */
  getMetadata(): Promise<{
    name: string;
    version: string;
    description: string;
  }>;
}

// ============================================================================
// Helper Functions for Type Conversion
// ============================================================================

/**
 * Convert string-based curve type to enum
 */
export function parseCurveType(value: string): CurveType {
  if (value === "Linear" || value === "Exponential") {
    return value;
  }
  throw new Error(`Invalid curve type: ${value}`);
}

/**
 * Convert string-based role to enum
 */
export function parseRole(value: string): Role {
  const validRoles: Role[] = ["Admin", "Pauser", "TreasuryManager"];
  if (validRoles.includes(value as Role)) {
    return value as Role;
  }
  throw new Error(`Invalid role: ${value}`);
}

/**
 * Format amount to display units (assuming 7 decimals like USDC)
 */
export function formatAmount(amount: bigint, decimals: number = 7): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const decimalPart = amount % divisor;
  
  if (decimalPart === BigInt(0)) {
    return integerPart.toString();
  }
  
  return `${integerPart}.${decimalPart.toString().padStart(decimals, "0")}`;
}

/**
 * Parse amount from display units to contract units (assuming 7 decimals)
 */
export function parseAmount(amount: string, decimals: number = 7): bigint {
  const [integerPart, decimalPart = ""] = amount.split(".");
  const padded = decimalPart.padEnd(decimals, "0");
  return BigInt(integerPart + padded);
}

// ============================================================================
// Export Default Empty Client for Type Checking
// ============================================================================

/**
 * Mock client for development/testing
 * Replace with actual client implementation in your contract SDK
 */
export const mockClient: StellarStreamContractClient = {
  createProposal: async () => BigInt(0),
  approveProposal: async () => {},
  getProposal: async () => ({} as StreamProposal),
  createStream: async () => BigInt(0),
  withdraw: async () => {},
  cancelStream: async () => {},
  getStream: async () => ({} as Stream),
  getWithdrawable: async () => BigInt(0),
  pauseStream: async () => {},
  unpauseStream: async () => {},
  getReceiptMetadata: async () => ({} as ReceiptMetadata),
  getReceiptsByOwner: async () => [],
  claimReceipt: async () => {},
  grantRole: async () => {},
  revokeRole: async () => {},
  checkRole: async () => false,
  restrictAddress: async () => {},
  unrestrictAddress: async () => {},
  isAddressRestricted: async () => false,
  getRestrictedAddresses: async () => [],
  getVersion: async () => "0.1.0",
  getMetadata: async () => ({
    name: "StellarStream",
    version: "0.1.0",
    description:
      "Token streaming with multi-sig proposals, dynamic vesting curves, and OFAC compliance",
  }),
  depositGasBuffer: async () => {},
  withdrawGasBuffer: async () => {},
  getGasBufferBalance: async () => BigInt(0),
};
