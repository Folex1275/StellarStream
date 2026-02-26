/**
 * Documentation routes
 * Serves Swagger UI and OpenAPI specification
 */

import { Router, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerOptions, swaggerUiOptions } from './swagger.config.js';
import { logger } from '../logger.js';

const router = Router();

// Cache for OpenAPI specification
let cachedSpec: any = null;
let lastGenerated: number = 0;
const CACHE_TTL = process.env.NODE_ENV === 'production' ? 3600000 : 5000; // 1 hour in prod, 5 seconds in dev

/**
 * Generate OpenAPI specification
 * Handles errors gracefully and returns minimal spec on failure
 */
function generateOpenApiSpec() {
  try {
    const spec = swaggerJsdoc(swaggerOptions);
    logger.info('OpenAPI specification generated successfully');
    return spec;
  } catch (error) {
    logger.error('Failed to generate OpenAPI specification', { error });
    
    // Return minimal valid specification as fallback
    return {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation',
        version: '1.0.0',
        description: 'API documentation (minimal fallback)',
      },
      paths: {},
    };
  }
}

/**
 * Get OpenAPI specification with caching and hot-reload support
 */
function getOpenApiSpec() {
  const now = Date.now();
  
  // In development, regenerate spec periodically for hot-reload
  if (!cachedSpec || (now - lastGenerated > CACHE_TTL)) {
    cachedSpec = generateOpenApiSpec();
    lastGenerated = now;
  }
  
  return cachedSpec;
}

/**
 * Serve Swagger UI at /api/v1/docs
 */
router.use('/', swaggerUi.serve);
router.get('/', (req: Request, res: Response, next) => {
  const spec = getOpenApiSpec();
  swaggerUi.setup(spec, swaggerUiOptions)(req, res, next);
});

/**
 * Serve raw OpenAPI spec as JSON at /api/v1/docs/spec
 */
router.get('/spec', (_req: Request, res: Response) => {
  const spec = getOpenApiSpec();
  res.json(spec);
});

export default router;
