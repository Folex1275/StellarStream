/**
 * Documentation configuration module
 * Loads API documentation settings from environment variables with sensible defaults
 */

/**
 * Contact information for the API
 */
export interface ContactInfo {
  name?: string;
  url?: string;
  email?: string;
}

/**
 * License information for the API
 */
export interface LicenseInfo {
  name: string;
  url?: string;
}

/**
 * Server configuration for Swagger UI
 */
export interface ServerConfig {
  url: string;
  description: string;
}

/**
 * API documentation configuration
 */
export interface DocsConfig {
  title: string;
  version: string;
  description: string;
  contact?: ContactInfo;
  license?: LicenseInfo;
  servers: ServerConfig[];
}

/**
 * Default configuration values
 */
const DEFAULTS = {
  title: 'API Documentation',
  version: '1.0.0',
  description: 'API documentation generated from JSDoc comments',
  contact: {
    name: 'API Team',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
  ],
};

/**
 * Load documentation configuration from environment variables
 * Falls back to sensible defaults for missing values
 */
export function loadDocsConfig(): DocsConfig {
  const title = process.env.API_TITLE || DEFAULTS.title;
  const version = process.env.API_VERSION || DEFAULTS.version;
  const description = process.env.API_DESCRIPTION || DEFAULTS.description;

  // Build contact information
  const contact: ContactInfo | undefined = process.env.API_CONTACT_NAME || process.env.API_CONTACT_URL || process.env.API_CONTACT_EMAIL
    ? {
        name: process.env.API_CONTACT_NAME || DEFAULTS.contact.name,
        url: process.env.API_CONTACT_URL,
        email: process.env.API_CONTACT_EMAIL,
      }
    : DEFAULTS.contact;

  // Build license information
  const license: LicenseInfo | undefined = process.env.API_LICENSE_NAME
    ? {
        name: process.env.API_LICENSE_NAME,
        url: process.env.API_LICENSE_URL,
      }
    : DEFAULTS.license;

  // Build server configurations
  const servers: ServerConfig[] = [];
  
  if (process.env.API_SERVER_URL_DEV) {
    servers.push({
      url: process.env.API_SERVER_URL_DEV,
      description: 'Development server',
    });
  }
  
  if (process.env.API_SERVER_URL_PROD) {
    servers.push({
      url: process.env.API_SERVER_URL_PROD,
      description: 'Production server',
    });
  }

  // If no servers configured, use defaults
  if (servers.length === 0) {
    servers.push(...DEFAULTS.servers);
  }

  return {
    title,
    version,
    description,
    contact,
    license,
    servers,
  };
}

/**
 * Get cached documentation configuration
 */
let cachedConfig: DocsConfig | null = null;

export function getDocsConfig(): DocsConfig {
  if (!cachedConfig) {
    cachedConfig = loadDocsConfig();
  }
  return cachedConfig;
}
