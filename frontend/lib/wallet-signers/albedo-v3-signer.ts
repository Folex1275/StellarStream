import { Networks } from "@stellar/stellar-sdk";

export interface AlbedoV3SignResult {
  signedTxXdr: string;
  txHash: string;
  submitted: boolean;
  raw: unknown;
}

interface AlbedoTxPayload {
  signed_envelope_xdr?: string;
  signedTxXdr?: string;
  xdr?: string;
  tx_hash?: string;
  txHash?: string;
  hash?: string;
  submitted?: boolean;
  status?: string;
  result?: object;
  error?: string;
}

function resolveAlbedoNetwork(networkPassphrase: string): "public" | "testnet" {
  return networkPassphrase === Networks.PUBLIC ? "public" : "testnet";
}

function normalizeAlbedoTxPayload(payload: AlbedoTxPayload): AlbedoV3SignResult {
  if (payload.error) {
    throw new Error(payload.error);
  }

  const signedTxXdr = payload.signed_envelope_xdr || payload.signedTxXdr || payload.xdr;
  if (!signedTxXdr) {
    throw new Error("Albedo did not return a signed transaction XDR");
  }

  const txHash = payload.tx_hash || payload.txHash || payload.hash;
  // Check if transaction was submitted either explicitly or via Horizon response
  const statusStr = typeof payload.status === 'string' ? payload.status : '';
  const submittedFromStatus = statusStr.toLowerCase() === "submitted" || statusStr.toLowerCase() === "success";
  const submittedFromResult = Boolean(payload.result && typeof payload.result === 'object' && typeof payload.result !== 'string');
  const submitted = Boolean(payload.submitted || submittedFromStatus || submittedFromResult || txHash);

  if (!submitted) {
    throw new Error("Albedo transaction callback did not confirm network submission");
  }

  if (!txHash) {
    throw new Error("Albedo callback is missing transaction hash after submission");
  }

  return {
    signedTxXdr,
    txHash,
    submitted,
    raw: payload,
  };
}

export async function signV3XdrWithAlbedo(
  xdr: string,
  networkPassphrase: string,
): Promise<AlbedoV3SignResult> {
  const albedoModule = await import("@albedo-link/intent");
  const albedo = albedoModule.default;

  const payload = (await albedo.tx({
    xdr,
    network: resolveAlbedoNetwork(networkPassphrase),
    submit: true,
  })) as unknown as AlbedoTxPayload;

  return normalizeAlbedoTxPayload(payload);
}

export const __internal = {
  normalizeAlbedoTxPayload,
  resolveAlbedoNetwork,
};
