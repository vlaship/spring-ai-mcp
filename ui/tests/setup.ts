import { beforeAll, afterEach, afterAll, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { defaultHandlers, mockUtils } from './mocks/api-mocks.js';
import { setupDOMMocks, cleanupDOMMocks } from './mocks/dom-mocks.js';
import { domUtils } from './utils/test-helpers.js';

/**
 * Global test setup for UI testing framework
 * Configures MSW server, DOM mocks, and test utilities
 */

// MSW server setup for API testing
export const server = setupServer(...defaultHandlers);

// Global test setup
beforeAll(() => {
  // Start MSW server
  server.listen({ 
    onUnhandledRequest: 'warn' // Changed to warn to avoid noise from legitimate requests
  });
  
  // Setup DOM and browser API mocks
  setupDOMMocks();
  
  // Setup global test environment
  setupGlobalTestEnvironment();
});

// Setup before each test
beforeEach(() => {
  // Clean up DOM state
  domUtils.cleanupDOM();
  
  // Reset mock data to defaults
  mockUtils.resetMockData();
  
  // Clear all mock function calls
  cleanupDOMMocks();
});

// Reset after each test
afterEach(() => {
  // Reset MSW handlers to defaults
  server.resetHandlers();
  
  // Clean up any remaining DOM state
  domUtils.cleanupDOM();
});

// Clean up after all tests
afterAll(() => {
  // Close MSW server
  server.close();
  
  // Final cleanup of mocks
  cleanupDOMMocks();
});

/**
 * Sets up global test environment variables and utilities
 */
function setupGlobalTestEnvironment() {
  // Make server available globally for individual test customization
  globalThis.testServer = server;
  
  // Setup global error handling for tests
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Filter out expected test errors to reduce noise
    const message = args[0]?.toString() || '';
    if (
      message.includes('Warning: ReactDOM.render is no longer supported') ||
      message.includes('Warning: validateDOMNesting') ||
      message.includes('MSW: Found a redundant usage of query parameters')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
  
  // Setup test-specific environment variables
  process.env.NODE_ENV = 'test';
  
  // Mock window.location for tests that need URL manipulation
  delete (window as any).location;
  window.location = {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    toString: () => 'http://localhost:3000'
  } as any;
  
  // Mock window.history for navigation tests
  Object.defineProperty(window, 'history', {
    value: {
      pushState: vi.fn(),
      replaceState: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      go: vi.fn(),
      length: 1,
      state: null
    },
    writable: true
  });
}

// Type declarations for global test utilities
declare global {
  var testServer: typeof server;
  
  // Extend vitest's vi for better TypeScript support
  namespace Vi {
    interface MockedFunction<T extends (...args: any[]) => any> {
      mockReturnValueOnce(value: ReturnType<T>): this;
      mockResolvedValueOnce(value: Awaited<ReturnType<T>>): this;
      mockRejectedValueOnce(value: any): this;
    }
  }
}

// Re-export server for direct access in tests
export { server as testServer };

// Export test configuration utilities
export const testConfig = {
  /**
   * Configures server to use error handlers for testing error conditions
   */
  useErrorHandlers() {
    const { apiMocks } = require('./mocks/api-mocks.js');
    server.use(
      apiMocks.getUsersError,
      apiMocks.getChatsError,
      apiMocks.getChatMessagesError,
      apiMocks.askQuestionError,
      apiMocks.askQuestionStreamError
    );
  },
  
  /**
   * Configures server to use malformed response handlers
   */
  useMalformedHandlers() {
    const { apiMocks } = require('./mocks/api-mocks.js');
    server.use(
      apiMocks.getUsersMalformed,
      apiMocks.getChatsMalformed
    );
  },
  
  /**
   * Configures server to use timeout handlers
   */
  useTimeoutHandlers() {
    const { apiMocks } = require('./mocks/api-mocks.js');
    server.use(
      apiMocks.getUsersTimeout
    );
  },
  
  /**
   * Resets server to use default handlers
   */
  useDefaultHandlers() {
    server.resetHandlers(...defaultHandlers);
  }
};