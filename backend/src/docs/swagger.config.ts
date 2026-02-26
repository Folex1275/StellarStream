// Swagger/OpenAPI configuration
// Defines API metadata, server URLs, and documentation settings

import { Options } from 'swagger-jsdoc';
import { getDocsConfig } from './docs.config';

/**
 * Build Swagger configuration options from documentation config
 * Configures the OpenAPI specification generation
 */
export function buildSwaggerOptions(): Options {
  const docsConfig = getDocsConfig();

  return {
    definition: {
      openapi: '3.0.0',
      info: {
        title: docsConfig.title,
        version: docsConfig.version,
        description: docsConfig.description,
        contact: docsConfig.contact,
        license: docsConfig.license,
      },
      servers: docsConfig.servers,
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT Bearer token authentication',
          },
          apiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API Key authentication',
          },
        },
      },
    },
    // Paths to files containing OpenAPI annotations
    apis: ['./src/api/**/*.ts', './src/api/*.ts'],
  };
}

/**
 * Swagger configuration options
 * Lazy-loaded from environment configuration
 */
export const swaggerOptions: Options = buildSwaggerOptions();

/**
 * Build Swagger UI configuration options
 * Customizes the Swagger UI interface
 */
export function buildSwaggerUiOptions() {
  const docsConfig = getDocsConfig();

  return {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: `${docsConfig.title} Documentation`,
  };
}

/**
 * Swagger UI configuration options
 * Lazy-loaded from environment configuration
 */
export const swaggerUiOptions = buildSwaggerUiOptions();
