import { defineConfig } from 'vitest/config';

export default defineConfig({
  // TypeScript configuration
  esbuild: {
    target: 'es2020'
  },
  test: {
    // Use happy-dom for DOM simulation
    environment: 'happy-dom',
    
    // Test file patterns
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '**/*.d.ts'],
    
    // Global test setup
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/tests/**',
        '**/*.test.*',
        '**/*.spec.*',
        'src/server.ts' // Exclude server file from coverage
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        // Per-file thresholds for critical components
        'src/state.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/chat-service.ts': {
          branches: 92,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Setup files
    setupFiles: ['./tests/setup.ts'],
    
    // Reporting configuration
    reporters: process.env.CI 
      ? ['verbose', 'junit', 'json'] 
      : ['verbose', 'html'],
    
    // Output files for CI
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json'
    },
    
    // Fail fast in CI
    bail: process.env.CI ? 1 : 0,
    
    // Retry configuration
    retry: process.env.CI ? 2 : 0,
    
    // Property-based test configuration
    // Ensure property tests run minimum 100 iterations as per design requirements
    env: {
      FAST_CHECK_NUM_RUNS: '100'
    }
  },
  
  // Resolve configuration for TypeScript
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});