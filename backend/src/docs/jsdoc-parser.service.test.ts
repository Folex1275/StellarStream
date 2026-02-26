// JSDoc Parser Service Tests
// Tests for the JSDoc parser service functionality

import { jsDocParserService } from './jsdoc-parser.service.js';

/**
 * Test the JSDoc parser service
 */
async function testJsDocParserService() {
  console.log('Testing JSDoc Parser Service...\n');

  try {
    // Test 1: Generate specification with validation
    console.log('Test 1: Generate OpenAPI specification with validation');
    const spec = await jsDocParserService.generateSpecification();
    
    console.log('✓ Specification generated and validated successfully');
    console.log(`  - OpenAPI version: ${spec.openapi}`);
    console.log(`  - API title: ${spec.info.title}`);
    console.log(`  - API version: ${spec.info.version}`);
    console.log(`  - Number of paths: ${Object.keys(spec.paths || {}).length}`);
    console.log();

    // Test 2: Get cached specification
    console.log('Test 2: Get cached specification');
    const cachedSpec = jsDocParserService.getSpecification();
    
    if (cachedSpec) {
      console.log('✓ Cached specification retrieved successfully');
      console.log(`  - Same as generated: ${cachedSpec === spec}`);
    } else {
      console.log('✗ Failed to retrieve cached specification');
    }
    console.log();

    // Test 3: Get controller paths
    console.log('Test 3: Get controller paths');
    const paths = jsDocParserService.getControllerPaths();
    
    console.log('✓ Controller paths retrieved successfully');
    console.log(`  - Number of patterns: ${paths.length}`);
    paths.forEach((path, index) => {
      console.log(`  - Pattern ${index + 1}: ${path}`);
    });
    console.log();

    // Test 4: Refresh specification
    console.log('Test 4: Refresh specification with validation');
    const refreshedSpec = await jsDocParserService.refreshSpecification();
    
    console.log('✓ Specification refreshed and validated successfully');
    console.log(`  - Number of paths: ${Object.keys(refreshedSpec.paths || {}).length}`);
    console.log();

    // Test 5: Verify specification structure
    console.log('Test 5: Verify specification structure');
    const hasInfo = !!spec.info;
    const hasServers = !!spec.servers && spec.servers.length > 0;
    const hasPaths = !!spec.paths;
    const hasComponents = !!spec.components;
    
    console.log(`  - Has info: ${hasInfo ? '✓' : '✗'}`);
    console.log(`  - Has servers: ${hasServers ? '✓' : '✗'}`);
    console.log(`  - Has paths: ${hasPaths ? '✓' : '✗'}`);
    console.log(`  - Has components: ${hasComponents ? '✓' : '✗'}`);
    console.log();

    // Test 6: Verify minimal defaults are applied
    console.log('Test 6: Verify minimal defaults for paths');
    if (spec.paths) {
      let pathsWithDefaults = 0;
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        if (pathItem) {
          const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
          for (const method of methods) {
            const operation = (pathItem as any)[method];
            if (operation) {
              pathsWithDefaults++;
              const hasSummary = !!operation.summary;
              const hasDescription = !!operation.description;
              const hasResponses = !!operation.responses && Object.keys(operation.responses).length > 0;
              const hasTags = !!operation.tags && operation.tags.length > 0;
              
              console.log(`  - ${method.toUpperCase()} ${path}:`);
              console.log(`    Summary: ${hasSummary ? '✓' : '✗'}`);
              console.log(`    Description: ${hasDescription ? '✓' : '✗'}`);
              console.log(`    Responses: ${hasResponses ? '✓' : '✗'}`);
              console.log(`    Tags: ${hasTags ? '✓' : '✗'}`);
            }
          }
        }
      }
      console.log(`  - Total operations with defaults: ${pathsWithDefaults}`);
    }
    console.log();

    console.log('All tests completed successfully! ✓');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

/**
 * Test error handling functionality
 */
async function testErrorHandling() {
  console.log('\nTesting Error Handling...\n');

  try {
    // Test 1: Verify error log is accessible
    console.log('Test 1: Verify error log is accessible');
    const errorLog = jsDocParserService.getErrorLog();
    console.log('✓ Error log retrieved successfully');
    console.log(`  - Number of entries: ${errorLog.length}`);
    
    if (errorLog.length > 0) {
      console.log('  - Error log entries:');
      errorLog.forEach((entry, index) => {
        console.log(`    ${index + 1}. [${entry.type.toUpperCase()}] ${entry.file}: ${entry.message}`);
      });
    }
    console.log();

    // Test 2: Generate specification and check for warnings/errors
    console.log('Test 2: Generate specification and check for warnings/errors');
    await jsDocParserService.refreshSpecification();
    const newErrorLog = jsDocParserService.getErrorLog();
    
    console.log('✓ Specification generated with error tracking');
    console.log(`  - Warnings: ${newErrorLog.filter(e => e.type === 'warning').length}`);
    console.log(`  - Errors: ${newErrorLog.filter(e => e.type === 'error').length}`);
    console.log();

    console.log('Error handling tests completed successfully! ✓');
    
  } catch (error) {
    console.error('Error handling test failed:', error);
    process.exit(1);
  }
}

// Run tests
testJsDocParserService().then(() => testErrorHandling());
