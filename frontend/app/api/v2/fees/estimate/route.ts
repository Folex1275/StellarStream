import { simulate, isSimulationError } from "@/lib/simulation-service";
import { estimateFees, isEstimationError } from "@/lib/fee-estimator";

const FALLBACK_RPC_URL = "https://soroban-testnet.stellar.org";

export async function GET(request: Request): Promise<Response> {
  const rpcUrl = process.env.SOROBAN_RPC_URL ?? (() => {
    console.warn("[fees/estimate] SOROBAN_RPC_URL is not set; falling back to testnet");
    return FALLBACK_RPC_URL;
  })();

  const { searchParams } = new URL(request.url);
  const transactionXdr = searchParams.get("transactionXdr");

  if (!transactionXdr || transactionXdr.trim() === "") {
    return Response.json(
      { error: "Missing required query parameter: transactionXdr" },
      { status: 400 }
    );
  }

  const truncatedXdr = transactionXdr.slice(0, 64);

  const simulationResult = await simulate(transactionXdr, rpcUrl);

  if (isSimulationError(simulationResult)) {
    console.error(
      `[fees/estimate] Simulation failed for XDR "${truncatedXdr}": ${simulationResult.message}`
    );
    return Response.json(
      { error: simulationResult.message },
      { status: 502 }
    );
  }

  const estimationResult = estimateFees(simulationResult);

  if (isEstimationError(estimationResult)) {
    console.error(
      `[fees/estimate] Fee estimation failed for XDR "${truncatedXdr}": ${estimationResult.message}`
    );
    return Response.json(
      { error: estimationResult.message },
      { status: 422 }
    );
  }

  return Response.json(
    { inclusionFee: estimationResult.inclusionFee, resourceFee: estimationResult.resourceFee },
    { status: 200 }
  );
}
