# Implementation Plan: Gas-Estimate Oracle

## Overview

Implement the Gas-Estimate Oracle as a Next.js API route in the existing `frontend/` application. The work is split into three layers: the SimulationService (RPC wrapper), the FeeEstimator (buffer logic), and the API route that wires them together.

## Tasks

- [x] 1. Create SimulationService
  - Create `frontend/lib/simulation-service.ts`
  - Define and export `SimulationSuccess`, `SimulationError`, `SimulationResult` types and `isSimulationError` type guard
  - Implement `simulate(transactionXdr: string, rpcUrl: string): Promise<SimulationResult>` using `fetch` with a JSON-RPC 2.0 POST body
  - Map RPC-level errors (`response.error`) to `{ kind: "rpc_error" }`, network failures to `{ kind: "network_error" }`, and pass through `restoreFootprint` when present
  - Log non-success HTTP status codes and response bodies via `console.error` before returning a structured error
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.2_

  - [ ]* 1.1 Write property test for SimulationService error propagation
    - **Property: RPC error propagation** — *For any* RPC error message string, `simulate` should return a `SimulationError` with `kind: "rpc_error"` and the message preserved
    - **Validates: Requirements 1.2**
    - Use `fast-check` with `fc.string()` to generate error messages; mock `fetch` to return them
    - `// Feature: gas-estimate-oracle, Property: rpc-error-propagation`

  - [ ]* 1.2 Write property test for restoreFootprint passthrough
    - **Property: restoreFootprint passthrough** — *For any* simulation result containing a `restoreFootprint` field, `simulate` should include it in the returned `SimulationSuccess`
    - **Validates: Requirements 1.5**
    - `// Feature: gas-estimate-oracle, Property: restore-footprint-passthrough`

- [x] 2. Create FeeEstimator
  - Create `frontend/lib/fee-estimator.ts`
  - Define and export `FeeEstimate`, `EstimationError`, `EstimationResult` types and `isEstimationError` type guard
  - Implement `estimateFees(simulation: SimulationSuccess): EstimationResult`
    - Parse `minResourceFee` as integer; return `EstimationError` with `kind: "malformed_result"` if missing or non-numeric
    - `inclusionFee = parseInt(minResourceFee, 10)`
    - `resourceFee = Math.ceil(parseInt(minResourceFee, 10) * 1.10)`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.1 Write property test for buffer and inclusion fee formula
    - **Property: fee formula correctness** — *For any* non-negative integer `r`, `estimateFees` with `minResourceFee: String(r)` should return `inclusionFee === r` and `resourceFee === Math.ceil(r * 1.10)`
    - **Validates: Requirements 2.1, 2.3, 2.4**
    - Use `fc.integer({ min: 0, max: 1_000_000_000 })` with minimum 100 runs
    - `// Feature: gas-estimate-oracle, Property: fee-formula-correctness`

  - [ ]* 2.2 Write edge-case test for zero resource fee
    - **Edge case: zero input** — `estimateFees` with `minResourceFee: "0"` should return `resourceFee === 0`
    - **Validates: Requirements 2.2**
    - `// Feature: gas-estimate-oracle, Property: zero-resource-fee`

  - [ ]* 2.3 Write property test for malformed simulation result
    - **Property: malformed result error** — *For any* object missing the `minResourceFee` field, `estimateFees` should return an `EstimationError` with `kind: "malformed_result"`
    - **Validates: Requirements 2.5**
    - Use `fc.record({})` (empty record) to generate objects without `minResourceFee`
    - `// Feature: gas-estimate-oracle, Property: malformed-result-error`

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create API route
  - Create `frontend/app/api/v2/fees/estimate/route.ts`
  - Implement `export async function GET(request: Request): Promise<Response>`
  - Read `SOROBAN_RPC_URL` from `process.env`; fall back to `https://soroban-testnet.stellar.org` if unset (log a warning)
  - Extract `transactionXdr` from `request.url` search params; return 400 if missing or empty
  - Call `simulate(transactionXdr, rpcUrl)`; return 502 with `{ error: message }` on `SimulationError`
  - Call `estimateFees(simulationResult)`; return 422 with `{ error: message }` on `EstimationError`
  - On success return 200 `application/json` with `{ inclusionFee, resourceFee }`
  - Log errors via `console.error` with truncated XDR (first 64 chars); never include stack traces in responses
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 5.1, 5.3_

  - [ ]* 4.1 Write property test for valid response shape
    - **Property: valid response shape** — *For any* valid simulation result, the API should return HTTP 200 with `Content-Type: application/json` and a body where both `inclusionFee` and `resourceFee` are integers
    - **Validates: Requirements 3.2, 3.6, 3.7**
    - Mock `simulate` and `estimateFees`; use `fc.integer({ min: 0 })` to generate fee values
    - `// Feature: gas-estimate-oracle, Property: valid-response-shape`

  - [ ]* 4.2 Write edge-case tests for error HTTP status codes
    - Test 400 for missing `transactionXdr`, 502 for RPC error, 422 for malformed result
    - **Validates: Requirements 3.3, 3.4, 3.5**
    - `// Feature: gas-estimate-oracle, Property: error-status-codes`

  - [ ]* 4.3 Write property test for no stack traces in error responses
    - **Property: no stack trace exposure** — *For any* error condition, the response body should not contain the string `"Error:"` followed by a file path or `"at "` stack frame patterns
    - **Validates: Requirements 5.3**
    - `// Feature: gas-estimate-oracle, Property: no-stack-trace-exposure`

- [x] 5. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- `fast-check` must be added as a dev dependency: `npm install --save-dev fast-check`
- All fee values are in stroops (integers); no floating-point values should appear in responses
- The `SOROBAN_RPC_URL` env var should be added to `.env.local` for local development
