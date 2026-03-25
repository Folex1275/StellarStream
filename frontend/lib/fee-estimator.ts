import type { SimulationSuccess } from "./simulation-service";

export interface FeeEstimate {
  inclusionFee: number; // stroops, integer, no buffer
  resourceFee: number;  // stroops, integer, ceil(raw * 1.10)
}

export interface EstimationError {
  kind: "malformed_result";
  message: string;
}

export type EstimationResult = FeeEstimate | EstimationError;

export function isEstimationError(r: EstimationResult): r is EstimationError {
  return "kind" in r;
}

export function estimateFees(simulation: SimulationSuccess): EstimationResult {
  const raw = simulation.minResourceFee;

  if (raw === undefined || raw === null || raw === "") {
    return { kind: "malformed_result", message: "Simulation result is missing minResourceFee" };
  }

  const parsed = parseInt(raw, 10);

  if (isNaN(parsed)) {
    return { kind: "malformed_result", message: `minResourceFee is non-numeric: ${raw}` };
  }

  return {
    inclusionFee: parsed,
    resourceFee: Math.ceil(parsed * 1.10),
  };
}
