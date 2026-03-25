import {
  Address,
  Contract,
  Networks,
  rpc as SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  Transaction,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

export type VoteChoice = "yes" | "no";

export interface GovernanceProposal {
  id: string;
  creator: string;
  description: string;
  quorum: number;
  votesFor: number;
  votesAgainst: number;
  txHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface VotingPowerSnapshot {
  address: string;
  stakedBalance: string;
  activeStreamingVolume: string;
  votingPower: string;
  fetchedAt: string;
  expiresAt: string;
}

interface ProposalsApiResponse {
  success: boolean;
  proposals: GovernanceProposal[];
}

interface VotingPowerApiResponse {
  success: boolean;
  votingPower: VotingPowerSnapshot;
}

const BACKEND_API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:3000/api/v1";

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-rpc.stellar.org";
const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? Networks.PUBLIC;

const ACCESS_CONTROL_CONTRACT_ID =
  process.env.NEXT_PUBLIC_ACCESS_CONTROL_CONTRACT_ID ??
  process.env.NEXT_PUBLIC_CONTRACT_ID ??
  "";

export async function fetchGovernanceProposals(): Promise<
  GovernanceProposal[]
> {
  const response = await fetch(`${BACKEND_API_BASE}/governance/proposals`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch proposals (${response.status})`);
  }

  const payload = (await response.json()) as ProposalsApiResponse;
  if (!payload.success || !Array.isArray(payload.proposals)) {
    throw new Error("Invalid governance proposals response");
  }

  return payload.proposals;
}

export async function fetchVotingPower(
  address: string,
): Promise<VotingPowerSnapshot> {
  const response = await fetch(
    `${BACKEND_API_BASE}/governance/voting-power/${encodeURIComponent(address)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch voting power (${response.status})`);
  }

  const payload = (await response.json()) as VotingPowerApiResponse;
  if (!payload.success || !payload.votingPower) {
    throw new Error("Invalid voting power response");
  }

  return payload.votingPower;
}

export async function voteOnProposal(
  proposalId: string,
  voterAddress: string,
  vote: VoteChoice,
): Promise<string> {
  if (!ACCESS_CONTROL_CONTRACT_ID) {
    throw new Error(
      "Missing access-control contract ID. Set NEXT_PUBLIC_ACCESS_CONTROL_CONTRACT_ID (or NEXT_PUBLIC_CONTRACT_ID).",
    );
  }

  const numericProposalId = BigInt(proposalId.replace(/\D/g, "") || proposalId);

  const approveOpAttempts: Array<{ method: string; args: unknown[] }> = [
    {
      method: "approve_op",
      args: [
        nativeToScVal(numericProposalId, { type: "u64" }),
        nativeToScVal(vote === "yes", { type: "bool" }),
      ],
    },
    {
      method: "approve_op",
      args: [
        nativeToScVal(numericProposalId, { type: "u64" }),
        nativeToScVal(Address.fromString(voterAddress)),
        nativeToScVal(vote === "yes", { type: "bool" }),
      ],
    },
    {
      method: "approve_op",
      args: [
        nativeToScVal(numericProposalId, { type: "u64" }),
        nativeToScVal(Address.fromString(voterAddress)),
      ],
    },
  ];

  if (vote === "yes") {
    approveOpAttempts.push({
      method: "approve_proposal",
      args: [
        nativeToScVal(numericProposalId, { type: "u64" }),
        nativeToScVal(Address.fromString(voterAddress)),
      ],
    });
  }

  let lastError: unknown = null;

  for (const attempt of approveOpAttempts) {
    try {
      return await invokeSignedContractTx(
        ACCESS_CONTROL_CONTRACT_ID,
        voterAddress,
        attempt.method,
        attempt.args,
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    lastError instanceof Error
      ? lastError.message
      : "Unable to submit vote using approve_op",
  );
}

async function invokeSignedContractTx(
  contractId: string,
  address: string,
  method: string,
  args: unknown[],
): Promise<string> {
  const rpc = new SorobanRpc.Server(RPC_URL, {
    allowHttp: RPC_URL.startsWith("http://"),
  });

  const sourceAccount = await rpc.getAccount(address);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...(args as any[])))
    .setTimeout(30)
    .build();

  const prepared = await rpc.prepareTransaction(tx);
  const signed = await signTransaction(prepared.toXDR(), {
    address,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if ((signed as { error?: string }).error) {
    throw new Error((signed as { error: string }).error);
  }

  const signedXdr = (signed as { signedTxXdr?: string }).signedTxXdr;
  if (!signedXdr) {
    throw new Error("Wallet signature failed");
  }

  const sendResult = await rpc.sendTransaction(new Transaction(signedXdr, Networks.TESTNET));
  const hash = (sendResult as { hash?: string }).hash;

  if (!hash) {
    throw new Error("Missing transaction hash from RPC response");
  }

  return hash;
}
