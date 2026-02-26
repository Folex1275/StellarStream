// JSDoc Parser Service
// Scans controller files for JSDoc comments and extracts OpenAPI annotations

import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from './swagger.config.js';
import { OpenAPIV3 } from 'openapi-types';

/**
 * JSDoc Parser Service
 * Responsible for scanning controller files and extracting OpenAPI specifications
 */
export class JsDocParserService {
  private swaggerSpec: OpenAPIV3.Document | null = null;
  private errorLog: Array<{ file: string; message: string; type: 'warning' | 'error' }> = [];

  /**
   * Generate OpenAPI specification from JSDoc comments in controller files
   * Scans all files specified in swagger configuration and aggregates their specifications
   *
   * @returns OpenAPI 3.0 specification document
   */
  public async generateSpecification(): Promise<OpenAPIV3.Document> {
    // Clear error log for fresh generation
    this.errorLog = [];

    try {
      // Use swagger-jsdoc to scan and parse JSDoc comments from controller files
      // This automatically handles:
      // - Scanning all files matching the patterns in swaggerOptions.apis
      // - Extracting OpenAPI annotations from JSDoc comments
      // - Aggregating specifications from multiple files
      // - Merging with the base definition from swaggerOptions
      const spec = swaggerJsdoc(swaggerOptions) as OpenAPIV3.Document;

      // Check if no JSDoc comments were found (empty paths object)
      // If so, use minimal specification as fallback (Requirement 3.4)
      if (!spec.paths || Object.keys(spec.paths).length === 0) {
        console.log('ℹ No JSDoc comments found in controller files, using minimal specification');
        const minimalSpec = this.createMinimalSpecification();
        this.swaggerSpec = minimalSpec;
        return minimalSpec;
      }

      // Validate the generated specification conforms to OpenAPI 3.0 standards
      await this.validateSpecification(spec);

      // Detect and log conflicting annotations
      this.detectConflictingAnnotations(spec);

      // Apply minimal metadata defaults for endpoints missing JSDoc comments
      this.applyMinimalDefaults(spec);

      this.swaggerSpec = spec;
      return this.swaggerSpec;
    } catch (error) {
      // Log warning for invalid JSDoc syntax and continue with minimal spec (Requirement 3.2)
      if (error instanceof Error && this.isJSDocSyntaxError(error)) {
        this.logWarning('unknown', `Invalid JSDoc syntax encountered: ${error.message}`);
        console.warn('⚠ Invalid JSDoc syntax detected, continuing with minimal specification');
        
        const minimalSpec = this.createMinimalSpecification();
        this.swaggerSpec = minimalSpec;
        return minimalSpec;
      }

      // For any other error during specification generation, use fallback (Requirement 3.2)
      console.error('Error generating OpenAPI specification:', error);
      console.warn('⚠ Specification generation failed, using minimal specification as fallback');
      this.logError('unknown', `Specification generation failed: ${error instanceof Error ? error.message : String(error)}`);
      
      const minimalSpec = this.createMinimalSpecification();
      this.swaggerSpec = minimalSpec;
      return minimalSpec;
    }
  }

  /**
   * Validate that the OpenAPI specification conforms to OpenAPI 3.0 standards
   * Uses swagger-parser to perform comprehensive validation
   *
   * @param spec - The OpenAPI specification to validate
   * @throws Error if the specification is invalid
   */
  private async validateSpecification(spec: OpenAPIV3.Document): Promise<void> {
    try {
      // Validate the specification against OpenAPI 3.0 schema
      // This checks:
      // - Schema structure conforms to OpenAPI 3.0 specification
      // - All required fields are present
      // - Data types are correct
      // - References ($ref) are valid and resolvable
      
      // Use dynamic import to work around TypeScript type issues
      const { default: parser } = await import('swagger-parser');
      await (parser as any).validate(spec);

      console.log('✓ OpenAPI specification validation passed');
    } catch (error) {
      console.error('OpenAPI specification validation failed:', error);
      throw new Error(`Invalid OpenAPI specification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Apply minimal metadata defaults for endpoints missing JSDoc comments
   * Ensures all paths have at least basic documentation
   *
   * @param spec - The OpenAPI specification to enhance with defaults
   */
  private applyMinimalDefaults(spec: OpenAPIV3.Document): void {
    if (!spec.paths) {
      return;
    }

    // Iterate through all paths and operations
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      if (!pathItem) continue;

      // Check each HTTP method
      const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

      for (const method of methods) {
        const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;

        if (operation) {
          // Apply default summary if missing
          if (!operation.summary) {
            operation.summary = this.generateDefaultSummary(method, path);
          }

          // Apply default description if missing
          if (!operation.description) {
            operation.description = `${method.toUpperCase()} operation for ${path}`;
          }

          // Ensure responses object exists with at least a 200 response
          if (!operation.responses || Object.keys(operation.responses).length === 0) {
            operation.responses = {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {}
                    }
                  }
                }
              }
            };
          }

          // Ensure tags array exists
          if (!operation.tags || operation.tags.length === 0) {
            operation.tags = [this.extractTagFromPath(path)];
          }
        }
      }
    }
  }

  /**
   * Generate a default summary for an operation based on HTTP method and path
   *
   * @param method - HTTP method (get, post, etc.)
   * @param path - API path
   * @returns Generated summary string
   */
  private generateDefaultSummary(method: string, path: string): string {
    const action = this.getActionFromMethod(method);
    const resource = this.extractResourceFromPath(path);
    return `${action} ${resource}`;
  }

  /**
   * Get a human-readable action verb from HTTP method
   *
   * @param method - HTTP method
   * @returns Action verb
   */
  private getActionFromMethod(method: string): string {
    const actionMap: Record<string, string> = {
      get: 'Get',
      post: 'Create',
      put: 'Update',
      patch: 'Modify',
      delete: 'Delete',
      options: 'Get options for',
      head: 'Get headers for'
    };
    return actionMap[method.toLowerCase()] || method.toUpperCase();
  }

  /**
   * Extract a resource name from the API path
   *
   * @param path - API path
   * @returns Resource name
   */
  private extractResourceFromPath(path: string): string {
    // Remove leading/trailing slashes and extract the main resource
    const segments = path.split('/').filter(s => s && !s.startsWith(':') && !s.startsWith('{'));

    if (segments.length === 0) {
      return 'resource';
    }

    // Return the last meaningful segment
    const resource = segments[segments.length - 1];

    // Capitalize first letter
    return resource.charAt(0).toUpperCase() + resource.slice(1);
  }

  /**
   * Extract a tag name from the API path for grouping operations
   *
   * @param path - API path
   * @returns Tag name
   */
  private extractTagFromPath(path: string): string {
    // Extract the first meaningful segment as the tag
    const segments = path.split('/').filter(s => s && !s.startsWith(':') && !s.startsWith('{'));

    if (segments.length === 0) {
      return 'default';
    }

    // Use the first segment as the tag
    const tag = segments[0];

    // Capitalize first letter
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }

  /**
   * Check if an error is related to JSDoc syntax issues
   *
   * @param error - The error to check
   * @returns True if the error is a JSDoc syntax error
   */
  private isJSDocSyntaxError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('jsdoc') ||
      message.includes('syntax') ||
      message.includes('parse') ||
      message.includes('invalid comment')
    );
  }

  /**
   * Create a minimal valid OpenAPI specification
   * Used as fallback when JSDoc parsing fails or no JSDoc comments are found
   * Ensures the system starts successfully even with no documentation (Requirements 3.2, 3.4)
   *
   * @returns Minimal OpenAPI 3.0 specification document
   */
  private createMinimalSpecification(): OpenAPIV3.Document {
    const definition = swaggerOptions.definition;
    
    return {
      openapi: '3.0.0',
      info: definition?.info || {
        title: 'API Documentation',
        version: '1.0.0',
        description: 'API documentation is currently unavailable'
      },
      servers: definition?.servers || [],
      paths: {},
      components: definition?.components || {},
    };
  }

  /**
   * Detect and log conflicting OpenAPI annotations in the specification
   * Checks for duplicate operation IDs and conflicting path definitions
   *
   * @param spec - The OpenAPI specification to check
   */
  private detectConflictingAnnotations(spec: OpenAPIV3.Document): void {
    if (!spec.paths) {
      return;
    }

    const operationIds = new Map<string, string>();

    // Check for duplicate operation IDs
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      if (!pathItem) continue;

      const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

      for (const method of methods) {
        const operation = pathItem[method] as OpenAPIV3.OperationObject | undefined;

        if (operation?.operationId) {
          const existingPath = operationIds.get(operation.operationId);

          if (existingPath) {
            this.logError(
              path,
              `Conflicting operationId "${operation.operationId}" found. Already defined in ${existingPath}. Using first encountered value.`
            );
          } else {
            operationIds.set(operation.operationId, `${method.toUpperCase()} ${path}`);
          }
        }
      }
    }
  }

  /**
   * Log a warning message with file location
   *
   * @param file - The file where the warning occurred
   * @param message - The warning message
   */
  private logWarning(file: string, message: string): void {
    this.errorLog.push({ file, message, type: 'warning' });
    console.warn(`⚠ [${file}] ${message}`);
  }

  /**
   * Log an error message with file location
   *
   * @param file - The file where the error occurred
   * @param message - The error message
   */
  private logError(file: string, message: string): void {
    this.errorLog.push({ file, message, type: 'error' });
    console.error(`✗ [${file}] ${message}`);
  }

  /**
   * Get the error log
   * Returns all warnings and errors encountered during specification generation
   *
   * @returns Array of error log entries
   */
  public getErrorLog(): ReadonlyArray<{ file: string; message: string; type: 'warning' | 'error' }> {
    return this.errorLog;
  }

  /**
   * Get the cached OpenAPI specification
   * Returns the previously generated specification without re-scanning files
   *
   * @returns OpenAPI 3.0 specification document or null if not yet generated
   */
  public getSpecification(): OpenAPIV3.Document | null {
    return this.swaggerSpec;
  }

  /**
   * Refresh the OpenAPI specification
   * Re-scans all controller files and regenerates the specification
   * Useful for development mode when files change
   *
   * @returns Updated OpenAPI 3.0 specification document
   */
  public async refreshSpecification(): Promise<OpenAPIV3.Document> {
    return this.generateSpecification();
  }

  /**
   * Extract controller file paths from swagger configuration
   * Returns the list of file patterns that will be scanned for JSDoc comments
   *
   * @returns Array of file path patterns
   */
  public getControllerPaths(): readonly string[] {
    return swaggerOptions.apis || [];
  }
}


// Export singleton instance
export const jsDocParserService = new JsDocParserService();

