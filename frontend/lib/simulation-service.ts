export interface SimulationSuccess {
  minResourceFee: string;    // raw stroop value as string (from RPC)
  sorobanData: string;       // base64 XDR SorobanTransactionData
  restoreFootprint?: object; // present if state expiry detected
}

export interface SimulationError {
  kind: "rpc_error" | "network_error" | "malformed";
  message: string;
}

export type SimulationResult = SimulationSuccess | SimulationError;

export function isSimulationError(r: SimulationResult): r is SimulationError {
  return "kind" in r;
}

interface SorobanSimulateResponse {
  jsonrpc: "2.0";
  id: number;
  result?: {
    minResourceFee: string;
    sorobanData: string;
    results?: Array<{ xdr: string }>;
    restoreFootprint?: object;
    error?: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

export async function simulate(
  transactionXdr: string,
  rpcUrl: string
): Promise<SimulationResult> {
  let response: globalThis.Response;

  try {
    response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "simulateTransaction",
        params: { transaction: transactionXdr },
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { kind: "network_error", message };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "(unreadable body)");
    console.error(
      `[SimulationService] Non-success HTTP status ${response.status}: ${body}`
    );
    return {
      kind: "network_error",
      message: `HTTP ${response.status}: ${body}`,
    };
  }

  let data: SorobanSimulateResponse;
  try {
    data = (await response.json()) as SorobanSimulateResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { kind: "malformed", message: `Failed to parse RPC response: ${message}` };
  }

  // RPC-level error (e.g. invalid method, bad params)
  if (data.error) {
    return { kind: "rpc_error", message: data.error.message };
  }

  // Simulation-level error (e.g. contract execution failed)
  if (data.result?.error) {
    return { kind: "rpc_error", message: data.result.error };
  }

  if (!data.result) {
    return { kind: "malformed", message: "RPC response missing result field" };
  }

  const success: SimulationSuccess = {
    minResourceFee: data.result.minResourceFee,
    sorobanData: data.result.sorobanData,
  };

  if (data.result.restoreFootprint !== undefined) {
    success.restoreFootprint = data.result.restoreFootprint;
  }

  return success;
}
