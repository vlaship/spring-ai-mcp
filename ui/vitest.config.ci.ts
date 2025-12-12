import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config';

/**
 * Vitest configuration optimized for CI environments
 * Extends base configuration with CI-specific settings
 */
export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    
    // CI-specific settings
    reporters: ['verbose', 'junit', 'json'],
    
    // Fail fast in CI
    bail: 1,
    
    // Retry failed tests
    retry: 2,
    
    // Longer timeout for CI environments
    testTimeout: 15000,
    
    // Disable watch mode
    watch: false,
    
    // Force coverage in CI
    coverage: {
      ...baseConfig.test?.coverage,
      enabled: true,
      reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
      
      // Stricter thresholds for CI
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        // Critical components require higher coverage
        'src/state.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/chat-service.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/dom.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    
    // Output configuration for CI
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json'
    },
    
    // Environment variables for property-based testing
    env: {
      FAST_CHECK_NUM_RUNS: '100',
      CI: 'true'
    }
  }
});