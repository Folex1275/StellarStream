// lib/soroban-contribute.ts
// Issue #48 — Soroban: Contribute Payment Frontend Action
//
// Builds, signs (via Freighter), and submits a Soroban "contribute"
// invocation against a configurable contract.  The caller only needs to
// supply the contributor address, amount, and (optionally) the token
// contract to use.

import {
  Contract,
  TransactionBuilder,
  Networks,
  Address,
  nativeToScVal,
  rpc as SorobanRpc,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || Networks.TESTNET;
const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || "";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ContributeParams {
  /** Stellar public key of the contributor (G…) */
  contributor: string;
  /** Amount in contract units (e.g. stroops for XLM-based tokens) */
  amount: bigint;
  /** Override the default contract ID */
  contractId?: string;
  /** Override the default RPC URL */
  rpcUrl?: string;
}

export interface ContributeResult {
  /** Whether the transaction was successfully submitted */
  success: boolean;
  /** Transaction hash */
  txHash: string;
  /** Ledger the transaction was included in */
  ledger: number;
}

// ---------------------------------------------------------------------------
// Core flow
// ---------------------------------------------------------------------------

/**
 * Build, sign, and submit a "contribute" call on a Soroban contract.
 *
 * Flow:
 *   1. Fetch the contributor's current account from Soroban RPC.
 *   2. Build a transaction that invokes `contribute(contributor, amount)`.
 *   3. Simulate the transaction to attach Soroban resource metadata.
 *   4. Sign the assembled transaction via Freighter.
 *   5. Submit and poll until the network confirms or rejects it.
 */
export async function contribute(
  params: ContributeParams,
): Promise<ContributeResult> {
  const {
    contributor,
    amount,
    contractId = CONTRACT_ID,
    rpcUrl = RPC_URL,
  } = params;

  if (!contractId) {
    throw new Error("No contract ID configured for contribution");
  }

  const server = new SorobanRpc.Server(rpcUrl);
  const contract = new Contract(contractId);

  // 1. Fetch source account
  const sourceAccount = await server.getAccount(contributor);

  // 2. Build the transaction
  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "contribute",
        new Address(contributor).toScVal(),
        nativeToScVal(amount, { type: "i128" }),
      ),
    )
    .setTimeout(30)
    .build();

  // 3. Simulate to attach Soroban metadata
  const simulated = await server.simulateTransaction(tx);

  if (SorobanRpc.Api.isSimulationError(simulated)) {
    throw new Error(
      `Simulation failed: ${(simulated as SorobanRpc.Api.SimulateTransactionErrorResponse).error}`,
    );
  }

  const assembled = SorobanRpc.assembleTransaction(
    tx,
    simulated as SorobanRpc.Api.SimulateTransactionSuccessResponse,
  ).build();

  // 4. Sign via Freighter
  const signedXdr = await signTransaction(assembled.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const signedTx = TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE,
  );

  // 5. Submit and poll
  const sendResponse = await server.sendTransaction(signedTx);

  if (sendResponse.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${sendResponse.status}`);
  }

  // Poll for confirmation
  let getResponse = await server.getTransaction(sendResponse.hash);
  while (getResponse.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1000));
    getResponse = await server.getTransaction(sendResponse.hash);
  }

  if (getResponse.status === "FAILED") {
    throw new Error(`Transaction failed on-chain: ${sendResponse.hash}`);
  }

  return {
    success: true,
    txHash: sendResponse.hash,
    ledger: getResponse.ledger,
  };
}
