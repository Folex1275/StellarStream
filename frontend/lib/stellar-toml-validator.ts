/**
 * stellar-toml-validator.ts
 * 
 * Utility for parsing and validating stellar.toml files.
 * Validates required CURRENCIES and AUTH_ENDPOINT entries
 * for organizational verification badge requests.
 */

import toml from 'toml';

export interface TomlCurrency {
  code: string;
  issuer?: string;
  status?: string;
  display_decimals?: number;
  name?: string;
  desc?: string;
  conditions?: string;
  is_asset_anchored?: boolean;
  fixed_number?: number;
  max_number?: number;
}

export interface TomlValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  currencies: TomlCurrency[];
  authEndpoint: string | null;
  documentationUrl?: string;
  orgName?: string;
}

/**
 * Fetches and parses a stellar.toml file from a given domain
 */
export async function fetchStellarToml(domain: string): Promise<string> {
  const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const tomlUrl = `https://${normalizedDomain}/.well-known/stellar.toml`;
  
  const response = await fetch(tomlUrl, {
    method: 'GET',
    headers: {
      'Accept': 'text/plain, application/toml',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch stellar.toml from ${tomlUrl} (HTTP ${response.status})`
    );
  }

  return await response.text();
}

/**
 * Parses TOML content and extracts validation data
 */
export function parseStellarToml(tomlContent: string): TomlValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const currencies: TomlCurrency[] = [];
  let authEndpoint: string | null = null;
  let documentationUrl: string | undefined;
  let orgName: string | undefined;

  try {
    const parsed = toml.parse(tomlContent);

    // Extract DOCUMENTATION section
    if (parsed.DOCUMENTATION) {
      orgName = parsed.DOCUMENTATION.ORG_NAME;
      documentationUrl = parsed.DOCUMENTATION.DOCUMENTATION;
    }

    // Validate AUTH_ENDPOINT
    if (parsed.VERSION && parsed.VERSION >= 1) {
      authEndpoint = parsed.CLIENT_ATTRIBUTION?.AUTH_ENDPOINT || null;
      
      // Also check for AUTH_ENDPOINT in NETWORK_PASSPHRASE section (older format)
      if (!authEndpoint && parsed.NETWORK_PASSPHRASE) {
        authEndpoint = parsed.NETWORK_PASSPHRASE.AUTH_ENDPOINT || null;
      }

      // Check root level for AUTH_ENDPOINT
      if (!authEndpoint && parsed.AUTH_ENDPOINT) {
        authEndpoint = parsed.AUTH_ENDPOINT;
      }
    }

    if (!authEndpoint) {
      warnings.push('No AUTH_ENDPOINT found. This is recommended for SEP-10 authentication.');
    } else {
      // Validate AUTH_ENDPOINT URL format
      try {
        new URL(authEndpoint);
      } catch {
        errors.push(`Invalid AUTH_ENDPOINT URL: ${authEndpoint}`);
      }
    }

    // Extract and validate CURRENCIES
    if (Array.isArray(parsed.CURRENCIES)) {
      parsed.CURRENCIES.forEach((currency: any, index: number) => {
        if (!currency.code) {
          errors.push(`Currency at index ${index} is missing required 'code' field`);
          return;
        }

        const validatedCurrency: TomlCurrency = {
          code: currency.code,
          issuer: currency.issuer,
          status: currency.status,
          display_decimals: currency.display_decimals,
          name: currency.name,
          desc: currency.desc,
          conditions: currency.conditions,
          is_asset_anchored: currency.is_asset_anchored,
          fixed_number: currency.fixed_number,
          max_number: currency.max_number,
        };

        // Validate issuer format for anchored assets
        if (currency.is_asset_anchored && !currency.issuer) {
          errors.push(`Currency ${currency.code} is anchored but missing 'issuer'`);
        }

        if (currency.issuer && !isValidStellarAddress(currency.issuer)) {
          errors.push(`Currency ${currency.code} has invalid issuer address: ${currency.issuer}`);
        }

        currencies.push(validatedCurrency);
      });
    } else {
      warnings.push('No CURRENCIES section found in stellar.toml');
    }

    // Additional validations
    if (currencies.length === 0) {
      warnings.push('No currencies defined. At least one currency is recommended for verification.');
    }

  } catch (error) {
    errors.push(
      `Failed to parse TOML: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    currencies,
    authEndpoint,
    documentationUrl,
    orgName,
  };
}

/**
 * Validates a complete verification request
 */
export async function validateVerificationRequest(data: {
  officialWebsite: string;
  stellarTomlLink: string;
  businessRegistration: File | null;
}): Promise<TomlValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate official website URL
  try {
    new URL(data.officialWebsite);
  } catch {
    errors.push('Invalid official website URL');
  }

  // Validate stellar.toml link
  try {
    new URL(data.stellarTomlLink);
  } catch {
    errors.push('Invalid stellar.toml link URL');
  }

  // If basic URL validation passes, fetch and parse the TOML
  if (errors.length === 0) {
    try {
      const tomlContent = await fetchStellarToml(data.stellarTomlLink);
      const tomlResult = parseStellarToml(tomlContent);
      
      return {
        ...tomlResult,
        errors: [...errors, ...tomlResult.errors],
        isValid: errors.length === 0 && tomlResult.isValid,
      };
    } catch (error) {
      errors.push(
        `Failed to fetch stellar.toml: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      
      return {
        isValid: false,
        errors,
        warnings,
        currencies: [],
        authEndpoint: null,
      };
    }
  }

  return {
    isValid: false,
    errors,
    warnings,
    currencies: [],
    authEndpoint: null,
  };
}

/**
 * Validates a Stellar public key address
 */
function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address);
}
