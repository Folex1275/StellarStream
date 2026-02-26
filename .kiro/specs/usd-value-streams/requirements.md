# Requirements Document

## Introduction

This feature adds USD value support to streams in the backend by integrating cryptocurrency price feeds and exposing estimated USD values through the stream API. The system will fetch exchange rates from external price sources, cache them with periodic updates, and calculate USD values for stream amounts.

## Glossary

- **Stream**: A payment stream on the Stellar network with an associated asset and amount
- **Price_Feed_Service**: The service responsible for fetching cryptocurrency exchange rates from external sources
- **Price_Cache**: In-memory or database storage for cached exchange rates
- **Background_Job**: A scheduled task that runs periodically to update cached prices
- **Stream_API**: The REST API endpoint that returns stream data to the frontend
- **Exchange_Rate**: The conversion rate between a cryptocurrency asset and USD
- **Asset**: A cryptocurrency token (e.g., XLM, USDC) that can be streamed
- **Price_Provider**: An external service that provides cryptocurrency prices (e.g., CoinGecko API, Stellar DEX)

## Requirements

### Requirement 1: Fetch Exchange Rates from Price Provider

**User Story:** As a backend system, I want to fetch current exchange rates from a reliable price provider, so that I can calculate accurate USD values for streams.

#### Acceptance Criteria

1. THE Price_Feed_Service SHALL support fetching exchange rates from at least one Price_Provider
2. WHEN the Price_Feed_Service requests exchange rates, THE Price_Provider_Client SHALL return rates for all supported Assets
3. WHEN the Price_Provider is unavailable, THE Price_Feed_Service SHALL log the error and retain the last known Exchange_Rate
4. THE Price_Feed_Service SHALL fetch exchange rates for all Assets used in active streams
5. WHEN an Exchange_Rate is fetched, THE Price_Feed_Service SHALL validate that the rate is a positive number
6. IF an Exchange_Rate is invalid or missing, THEN THE Price_Feed_Service SHALL exclude that Asset from the update

### Requirement 2: Cache Exchange Rates

**User Story:** As a backend system, I want to cache exchange rates locally, so that I can provide fast USD value calculations without hitting external APIs for every request.

#### Acceptance Criteria

1. THE Price_Cache SHALL store Exchange_Rates with their associated Asset identifiers
2. THE Price_Cache SHALL store the timestamp when each Exchange_Rate was last updated
3. WHEN an Exchange_Rate is stored, THE Price_Cache SHALL overwrite any existing rate for that Asset
4. WHEN the Stream_API requests an Exchange_Rate, THE Price_Cache SHALL return the cached rate within 10ms
5. THE Price_Cache SHALL support concurrent read operations without blocking

### Requirement 3: Update Prices Periodically

**User Story:** As a system administrator, I want exchange rates to update automatically every 5 minutes, so that USD values remain reasonably current without manual intervention.

#### Acceptance Criteria

1. THE Background_Job SHALL execute every 5 minutes
2. WHEN the Background_Job executes, THE Background_Job SHALL trigger the Price_Feed_Service to fetch new Exchange_Rates
3. WHEN new Exchange_Rates are fetched, THE Background_Job SHALL update the Price_Cache with the new rates
4. THE Background_Job SHALL log the number of Exchange_Rates successfully updated
5. IF the Background_Job fails, THEN THE Background_Job SHALL log the error and retry at the next scheduled interval
6. THE Background_Job SHALL complete execution within 30 seconds

### Requirement 4: Calculate USD Values for Streams

**User Story:** As a frontend application, I want to receive estimated USD values for streams, so that I can display meaningful financial information to users.

#### Acceptance Criteria

1. WHEN the Stream_API returns stream data, THE Stream_API SHALL include an estimated_usd_value field for each stream
2. THE Stream_API SHALL calculate estimated_usd_value by multiplying the stream amount by the cached Exchange_Rate
3. WHEN an Exchange_Rate is not available for a stream Asset, THE Stream_API SHALL set estimated_usd_value to null
4. THE Stream_API SHALL format estimated_usd_value as a decimal number with 2 decimal places
5. THE Stream_API SHALL calculate estimated_usd_value using the most recent Exchange_Rate from the Price_Cache
6. FOR ALL streams with valid Exchange_Rates, the estimated_usd_value SHALL be greater than or equal to zero

### Requirement 5: Handle Multiple Asset Types

**User Story:** As a backend system, I want to support exchange rates for multiple cryptocurrency assets, so that I can provide USD values for streams in any supported token.

#### Acceptance Criteria

1. THE Price_Feed_Service SHALL support fetching Exchange_Rates for XLM, USDC, and other Stellar assets
2. WHEN a new Asset type is encountered in streams, THE Price_Feed_Service SHALL attempt to fetch its Exchange_Rate
3. THE Price_Cache SHALL store Exchange_Rates for multiple Assets simultaneously
4. WHEN the Stream_API calculates USD values, THE Stream_API SHALL use the Exchange_Rate specific to each stream's Asset

### Requirement 6: Provide Price Freshness Information

**User Story:** As a frontend developer, I want to know when exchange rates were last updated, so that I can inform users about the recency of USD value estimates.

#### Acceptance Criteria

1. WHEN the Stream_API returns stream data, THE Stream_API SHALL include a price_updated_at timestamp field
2. THE price_updated_at field SHALL contain the timestamp when the Exchange_Rate was last fetched from the Price_Provider
3. WHEN an Exchange_Rate is not available, THE Stream_API SHALL set price_updated_at to null
4. THE price_updated_at field SHALL be formatted as an ISO 8601 timestamp

### Requirement 7: Handle Price Provider Failures Gracefully

**User Story:** As a system operator, I want the system to continue functioning when the price provider is unavailable, so that stream data remains accessible even without current USD values.

#### Acceptance Criteria

1. WHEN the Price_Provider is unavailable, THE Stream_API SHALL continue to return stream data with the last known Exchange_Rates
2. WHEN the Price_Provider returns an error, THE Price_Feed_Service SHALL log the error with sufficient detail for debugging
3. THE Stream_API SHALL not fail or return errors when Exchange_Rates are unavailable
4. WHEN Exchange_Rates are stale by more than 1 hour, THE Stream_API SHALL still return the cached values
5. THE Background_Job SHALL continue attempting to fetch Exchange_Rates even after consecutive failures

### Requirement 8: Support Price Provider Configuration

**User Story:** As a system administrator, I want to configure which price provider to use, so that I can switch providers or use multiple sources without code changes.

#### Acceptance Criteria

1. THE Price_Feed_Service SHALL read Price_Provider configuration from environment variables or configuration files
2. WHERE CoinGecko is configured as the Price_Provider, THE Price_Feed_Service SHALL use the CoinGecko API
3. WHERE Stellar DEX is configured as the Price_Provider, THE Price_Feed_Service SHALL use Stellar DEX prices
4. THE Price_Feed_Service SHALL validate the Price_Provider configuration at startup
5. IF the Price_Provider configuration is invalid, THEN THE Price_Feed_Service SHALL log an error and fail to start
