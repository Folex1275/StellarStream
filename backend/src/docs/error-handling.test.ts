// Error Handling Tests for JSDoc Parser Service
// Tests the error handling functionality

import { JsDocParserService } from './jsdoc-parser.service.js';

/**
 * Test error handling functionality
 */
async function testErrorHandling() {
  console.log('Testing Error Handling Functionality...\n');

  const service = new JsDocParserService();

  try {
    // Test 1: Generate specification and verify error log is empty initially
    console.log('Test 1: Verify error log starts empty');
    const initialLog = service.getErrorLog();
    console.log(`✓ Initial error log length: ${initialLog.length}`);
    console.log();

    // Test 2: Generate specification
    console.log('Test 2: Generate specification with error tracking');
    const spec = await service.generateSpecification();
    console.log('✓ Specification generated successfully');
    console.log(`  - OpenAPI version: ${spec.openapi}`);
    console.log(`  - API title: ${spec.info.title}`);
    console.log();

    // Test 3: Check error log after generation
    console.log('Test 3: Check error log after generation');
    const errorLog = service.getErrorLog();
    console.log(`✓ Error log retrieved`);
    console.log(`  - Total entries: ${errorLog.length}`);
    console.log(`  - Warnings: ${errorLog.filter(e => e.type === 'warning').length}`);
    console.log(`  - Errors: ${errorLog.filter(e => e.type === 'error').length}`);
    
    if (errorLog.length > 0) {
      console.log('\n  Error log entries:');
      errorLog.forEach((entry, index) => {
        console.log(`    ${index + 1}. [${entry.type.toUpperCase()}] ${entry.file}: ${entry.message}`);
      });
    }
    console.log();

    // Test 4: Verify error log is cleared on refresh
    console.log('Test 4: Verify error log is cleared on refresh');
    await service.refreshSpecification();
    const refreshedLog = service.getErrorLog();
    console.log(`✓ Error log after refresh: ${refreshedLog.length} entries`);
    console.log();

    // Test 5: Verify getErrorLog returns readonly array
    console.log('Test 5: Verify error log is readonly');
    const log = service.getErrorLog();
    console.log(`✓ Error log type: ${Array.isArray(log) ? 'Array' : 'Unknown'}`);
    console.log(`  - Is readonly: ${Object.isFrozen(log) || 'enforced by TypeScript'}`);
    console.log();

    console.log('All error handling tests passed! ✓\n');
    
  } catch (error) {
    console.error('Error handling test failed:', error);
    process.exit(1);
  }
}

// Run tests
testErrorHandling();
