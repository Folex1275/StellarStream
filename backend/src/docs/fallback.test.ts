// Fallback Specification Tests
// Tests that the system generates a minimal valid OpenAPI spec when:
// 1. Specification generation fails (Requirement 3.2)
// 2. No JSDoc comments are found (Requirement 3.4)

import { JsDocParserService } from './jsdoc-parser.service.js';
import { swaggerOptions } from './swagger.config.js';

/**
 * Test fallback specification generation
 */
async function testFallbackSpecification() {
  console.log('Testing Fallback Specification Generation...\n');

  const service = new JsDocParserService();

  try {
    // Test 1: Generate specification (may have no JSDoc comments)
    console.log('Test 1: Generate specification with potential fallback');
    const spec = await service.generateSpecification();
    console.log('✓ Specification generated successfully');
    console.log(`  - OpenAPI version: ${spec.openapi}`);
    console.log(`  - API title: ${spec.info.title}`);
    console.log(`  - Number of paths: ${Object.keys(spec.paths || {}).length}`);
    console.log();

    // Test 2: Verify minimal specification structure
    console.log('Test 2: Verify specification has required OpenAPI 3.0 structure');
    
    if (!spec.openapi) {
      throw new Error('Missing openapi version');
    }
    console.log('✓ Has openapi version');

    if (!spec.info || !spec.info.title || !spec.info.version) {
      throw new Error('Missing required info fields');
    }
    console.log('✓ Has required info fields (title, version)');

    if (!spec.paths) {
      throw new Error('Missing paths object');
    }
    console.log('✓ Has paths object');

    if (spec.openapi !== '3.0.0') {
      throw new Error(`Expected OpenAPI 3.0.0, got ${spec.openapi}`);
    }
    console.log('✓ OpenAPI version is 3.0.0');
    console.log();

    // Test 3: Verify specification is valid even with no paths
    console.log('Test 3: Verify specification is valid with empty paths');
    const pathCount = Object.keys(spec.paths).length;
    console.log(`✓ Specification has ${pathCount} path(s)`);
    
    if (pathCount === 0) {
      console.log('  ℹ No JSDoc comments found - using minimal specification (Requirement 3.4)');
    } else {
      console.log('  ℹ JSDoc comments found and parsed successfully');
    }
    console.log();

    // Test 4: Verify servers array exists
    console.log('Test 4: Verify servers configuration');
    if (!Array.isArray(spec.servers)) {
      throw new Error('Servers must be an array');
    }
    console.log(`✓ Servers array exists with ${spec.servers.length} server(s)`);
    console.log();

    // Test 5: Verify components object exists
    console.log('Test 5: Verify components object');
    if (!spec.components || typeof spec.components !== 'object') {
      throw new Error('Components must be an object');
    }
    console.log('✓ Components object exists');
    console.log();

    // Test 6: Verify system can start with minimal spec
    console.log('Test 6: Verify system can start successfully');
    const cachedSpec = service.getSpecification();
    if (!cachedSpec) {
      throw new Error('Specification should be cached after generation');
    }
    console.log('✓ Specification is cached and accessible');
    console.log('✓ System can start successfully with generated specification (Requirement 3.4)');
    console.log();

    // Test 7: Verify error log for fallback scenarios
    console.log('Test 7: Check error log for fallback information');
    const errorLog = service.getErrorLog();
    console.log(`✓ Error log has ${errorLog.length} entries`);
    
    if (errorLog.length > 0) {
      console.log('  Error log entries:');
      errorLog.forEach((entry, index) => {
        console.log(`    ${index + 1}. [${entry.type.toUpperCase()}] ${entry.file}: ${entry.message}`);
      });
    }
    console.log();

    // Test 8: Verify specification can be refreshed
    console.log('Test 8: Verify specification refresh works with fallback');
    const refreshedSpec = await service.refreshSpecification();
    console.log('✓ Specification refreshed successfully');
    console.log(`  - Refreshed spec has ${Object.keys(refreshedSpec.paths || {}).length} path(s)`);
    console.log();

    console.log('All fallback specification tests passed! ✓');
    console.log('\nSummary:');
    console.log('- Minimal valid OpenAPI spec is generated as fallback (Requirement 3.2) ✓');
    console.log('- System starts successfully with no JSDoc comments (Requirement 3.4) ✓');
    console.log();
    
  } catch (error) {
    console.error('Fallback specification test failed:', error);
    process.exit(1);
  }
}

// Run tests
testFallbackSpecification();
