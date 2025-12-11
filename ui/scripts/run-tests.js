#!/usr/bin/env node

/**
 * Test Execution Script
 * Orchestrates different types of tests with proper reporting
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.testTypes = {
      unit: {
        command: 'vitest',
        args: ['--run', 'tests/unit'],
        description: 'Unit Tests'
      },
      integration: {
        command: 'vitest', 
        args: ['--run', 'tests/integration'],
        description: 'Integration Tests'
      },
      properties: {
        command: 'vitest',
        args: ['--run', 'tests/properties'],
        description: 'Property-Based Tests'
      },
      all: {
        command: 'vitest',
        args: ['--run'],
        description: 'All Tests'
      },
      coverage: {
        command: 'vitest',
        args: ['--run', '--coverage'],
        description: 'All Tests with Coverage'
      }
    };
  }

  async runTest(type, options = {}) {
    const testConfig = this.testTypes[type];
    if (!testConfig) {
      throw new Error(`Unknown test type: ${type}`);
    }

    console.log(`🧪 Running ${testConfig.description}...`);
    
    const args = [...testConfig.args];
    
    // Add CI-specific options
    if (options.ci) {
      args.push('--reporter=verbose', '--reporter=junit', '--reporter=json');
    }
    
    // Add coverage options
    if (options.coverage && type !== 'coverage') {
      args.push('--coverage');
    }

    return new Promise((resolve, reject) => {
      const child = spawn('npx', [testConfig.command, ...args], {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: {
          ...process.env,
          FAST_CHECK_NUM_RUNS: '100'
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${testConfig.description} completed successfully`);
          resolve({ success: true, code });
        } else {
          console.log(`❌ ${testConfig.description} failed with code ${code}`);
          resolve({ success: false, code });
        }
      });

      child.on('error', (error) => {
        console.error(`❌ Error running ${testConfig.description}:`, error.message);
        reject(error);
      });
    });
  }

  async runSequential(types, options = {}) {
    const results = [];
    
    for (const type of types) {
      try {
        const result = await this.runTest(type, options);
        results.push({ type, ...result });
        
        // Stop on first failure if bail is enabled
        if (!result.success && options.bail) {
          break;
        }
      } catch (error) {
        results.push({ type, success: false, error: error.message });
        if (options.bail) {
          break;
        }
      }
    }
    
    return results;
  }

  async runParallel(types, options = {}) {
    const promises = types.map(type => 
      this.runTest(type, options).catch(error => ({ 
        type, 
        success: false, 
        error: error.message 
      }))
    );
    
    return Promise.all(promises);
  }

  printSummary(results) {
    console.log('\n📊 Test Execution Summary:');
    console.log('=' .repeat(50));
    
    let totalSuccess = true;
    
    results.forEach(({ type, success, code, error }) => {
      const icon = success ? '✅' : '❌';
      const status = success ? 'PASSED' : 'FAILED';
      console.log(`${icon} ${type.toUpperCase()}: ${status}`);
      
      if (error) {
        console.log(`   Error: ${error}`);
      } else if (code !== undefined) {
        console.log(`   Exit Code: ${code}`);
      }
      
      totalSuccess = totalSuccess && success;
    });
    
    console.log('=' .repeat(50));
    console.log(`Overall Result: ${totalSuccess ? '✅ SUCCESS' : '❌ FAILURE'}`);
    
    return totalSuccess;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();
  
  // Parse command line arguments
  const options = {
    ci: args.includes('--ci'),
    coverage: args.includes('--coverage'),
    bail: args.includes('--bail'),
    parallel: args.includes('--parallel')
  };
  
  // Determine test types to run
  const testTypes = args.filter(arg => !arg.startsWith('--'));
  const typesToRun = testTypes.length > 0 ? testTypes : ['all'];
  
  // Validate test types
  const validTypes = Object.keys(runner.testTypes);
  const invalidTypes = typesToRun.filter(type => !validTypes.includes(type));
  
  if (invalidTypes.length > 0) {
    console.error(`❌ Invalid test types: ${invalidTypes.join(', ')}`);
    console.error(`Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
  }
  
  try {
    console.log(`🚀 Starting test execution...`);
    console.log(`Types: ${typesToRun.join(', ')}`);
    console.log(`Options: ${JSON.stringify(options, null, 2)}\n`);
    
    // Run tests
    const results = options.parallel 
      ? await runner.runParallel(typesToRun, options)
      : await runner.runSequential(typesToRun, options);
    
    // Print summary
    const success = runner.printSummary(results);
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TestRunner;