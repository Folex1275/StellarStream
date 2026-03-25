# Requirements Document

## Introduction

The Gas-Estimate Oracle provides accurate fee estimation for Nebula V2 Soroban smart contract operations. It exposes a backend API endpoint that simulates a transaction against the Soroban RPC, applies a 10% safety buffer to resource fee increments (CPU/RAM), and returns both the inclusion fee and the buffered resource fee so the frontend can display accurate cost estimates to users before they submit transactions.

## Glossary

- **Simulation_Service**: The backend module that wraps the Soroban RPC `simulateTransaction` call and returns raw simulation results.
- **Fee_Estimator**: The backend module that applies buffer logic to simulation results and computes final fee estimates.
- **Inclusion_Fee**: The base network fee (in stroops) required for a transaction to be included in a Stellar ledger, derived from the `minResourceFee` field of the simulation response.
- **Resource_Fee**: The fee (in stroops) covering CPU and RAM consumption of a Soroban smart contract invocation, derived from the `sorobanData` resource increments in the simulation response.
- **Safety_Buffer**: A 10% multiplicative increase applied to the raw resource fee increment to prevent "Out of Resources" errors during execution.
- **Soroban_RPC**: The Soroban JSON-RPC server endpoint used to simulate and submit Soroban transactions.
- **Fee_Estimate_Response**: The JSON object returned by `GET /api/v2/fees/estimate` containing `inclusionFee` and `resourceFee` fields.
- **Stroop**: The smallest unit of XLM (1 XLM = 10,000,000 stroops).
- **Transaction_XDR**: A base64-encoded XDR string representing an unsigned Soroban transaction envelope to be simulated.

## Requirements

### Requirement 1: Simulation Service

**User Story:** As a backend developer, I want a simulation service that wraps the Soroban RPC `simulateTransaction` call, so that fee estimation logic has a clean interface to raw simulation data.

#### Acceptance Criteria

1. WHEN a valid Transaction_XDR is provided, THE Simulation_Service SHALL call the Soroban_RPC `simulateTransaction` method and return the simulation result.
2. WHEN the Soroban_RPC returns a simulation error, THE Simulation_Service SHALL propagate a structured error containing the RPC error message.
3. WHEN the Soroban_RPC is unreachable or returns a network error, THE Simulation_Service SHALL return a structured error indicating the connectivity failure.
4. THE Simulation_Service SHALL accept the Soroban_RPC endpoint URL as a configuration parameter, not as a hardcoded value.
5. WHEN the simulation result contains a `restoreFootprint` field, THE Simulation_Service SHALL include it in the returned result so callers can detect state expiry conditions.

### Requirement 2: Buffer Logic

**User Story:** As a backend developer, I want a 10% safety buffer applied to the raw resource fee estimate, so that submitted transactions do not fail with "Out of Resources" errors due to underestimation.

#### Acceptance Criteria

1. WHEN a raw resource fee increment is provided, THE Fee_Estimator SHALL multiply it by 1.10 and return the result as the buffered Resource_Fee.
2. WHEN the raw resource fee increment is zero, THE Fee_Estimator SHALL return zero as the buffered Resource_Fee.
3. THE Fee_Estimator SHALL compute the buffered Resource_Fee using integer arithmetic by applying `ceil(rawResourceFee * 1.10)` to avoid fractional stroop values.
4. THE Fee_Estimator SHALL derive the Inclusion_Fee directly from the `minResourceFee` field of the simulation result without applying any buffer.
5. WHEN the simulation result is missing the `minResourceFee` field, THE Fee_Estimator SHALL return a structured error indicating the simulation result is malformed.

### Requirement 3: Fee Estimate API Endpoint

**User Story:** As a frontend developer, I want a REST API endpoint that returns inclusion and resource fee estimates, so that the UI can display accurate transaction costs to users before they submit.

#### Acceptance Criteria

1. THE API SHALL expose a `GET /api/v2/fees/estimate` endpoint that accepts a `transactionXdr` query parameter.
2. WHEN a valid `transactionXdr` query parameter is provided, THE API SHALL return a JSON response containing `inclusionFee` (in stroops) and `resourceFee` (in stroops) as integer values.
3. WHEN the `transactionXdr` query parameter is missing or empty, THE API SHALL return an HTTP 400 response with a descriptive error message.
4. WHEN the Simulation_Service returns an error, THE API SHALL return an HTTP 502 response with a structured error body containing the upstream error message.
5. WHEN the Fee_Estimator returns a malformed-result error, THE API SHALL return an HTTP 422 response with a descriptive error message.
6. THE API SHALL return all fee values in stroops as integer numbers in the JSON response body.
7. WHEN a valid request is processed successfully, THE API SHALL return an HTTP 200 response with `Content-Type: application/json`.

### Requirement 4: Configuration

**User Story:** As a DevOps engineer, I want the service to read its Soroban RPC endpoint from environment configuration, so that the same build artifact can target different networks (testnet, mainnet) without code changes.

#### Acceptance Criteria

1. THE Simulation_Service SHALL read the Soroban_RPC endpoint URL from the `SOROBAN_RPC_URL` environment variable.
2. WHEN the `SOROBAN_RPC_URL` environment variable is not set at startup, THE API SHALL return an HTTP 503 response for all fee estimate requests with an error indicating misconfiguration.
3. WHERE a default network is configured, THE Simulation_Service SHALL fall back to the Stellar testnet RPC URL (`https://soroban-testnet.stellar.org`) when `SOROBAN_RPC_URL` is not set.

### Requirement 5: Error Handling and Observability

**User Story:** As a backend developer, I want all errors to be logged with sufficient context, so that I can diagnose fee estimation failures in production.

#### Acceptance Criteria

1. WHEN any error occurs during fee estimation, THE API SHALL log the error with the request's `transactionXdr` (truncated to 64 characters) and the error message.
2. WHEN the Soroban_RPC returns a non-success HTTP status code, THE Simulation_Service SHALL log the status code and response body before returning a structured error.
3. THE API SHALL never expose raw internal stack traces in HTTP response bodies.
