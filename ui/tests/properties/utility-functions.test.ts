import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  normalizeRole,
  formatTimestamp,
  formatBubbleTimestamp,
  formatRole,
  generateMessageId,
  isLocalHostname,
  inferAssistantBaseUrl,
  normalizeBaseUrl,
  getUIConfig,
  readStoredThemePreference,
  persistThemePreference
} from '../../src/utils.js';
import type { MessageRole } from '../../src/types.js';

/**
 * **Feature: ui-testing, Property 5: Utility function correctness**
 * **Validates: Requirements 1.5**
 * 
 * Property: For any valid input to formatting and transformation utilities, 
 * the functions should produce correctly formatted output of the expected type
 */

describe('Utility Functions Property Tests', () => {
  beforeEach(() => {
    // Mock window object
    vi.stubGlobal('window', {
      location: {
        hostname: 'localhost',
        origin: 'http://localhost:3000',
        protocol: 'http:'
      },
      UI_CONFIG: {}
    });

    // Mock crypto object
    vi.stubGlobal('crypto', {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
    });

    // Mock localStorage
    const storage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storage[key]; }),
      clear: vi.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); })
    });
  });

  afterEach(() => {
    // Restore all mocks
    vi.unstubAllGlobals();
  });

  it('normalizeRole should handle any string input and return valid MessageRole', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: undefined }),
        (input: string | undefined) => {
          try {
            const result = normalizeRole(input);
            
            // Property: Result should always be a valid MessageRole
            const validRoles: MessageRole[] = ['assistant', 'user', 'system', 'tool'];
            return (
              typeof result === 'string' &&
              validRoles.includes(result)
            );
          } catch (error) {
            // Function should never throw with any string input
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formatTimestamp should handle any timestamp input and return valid string', () => {
    fc.assert(
      fc.property(
        fc.option(
          fc.oneof(
            // Valid ISO timestamps
            fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') })
              .map(d => d.toISOString()),
            // Invalid timestamp strings
            fc.string(),
            // Null/undefined
            fc.constant(null),
            fc.constant(undefined)
          ),
          { nil: null }
        ),
        (input: string | null | undefined) => {
          try {
            const result = formatTimestamp(input);
            
            // Property: Result should always be a non-empty string
            return (
              typeof result === 'string' &&
              result.length > 0
            );
          } catch (error) {
            // Function should never throw with any input
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formatBubbleTimestamp should handle any string input and return valid string', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Valid ISO timestamps
          fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') })
            .map(d => d.toISOString()),
          // Invalid timestamp strings
          fc.string(),
          // Empty string
          fc.constant('')
        ),
        (input: string) => {
          try {
            const result = formatBubbleTimestamp(input);
            
            // Property: Result should always be a string (may be empty for invalid dates)
            return typeof result === 'string';
          } catch (error) {
            // Function should never throw with any string input
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('formatRole should handle any MessageRole and return valid string', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('assistant', 'user', 'system', 'tool') as fc.Arbitrary<MessageRole>,
        (role: MessageRole) => {
          try {
            const result = formatRole(role);
            
            // Property: Result should always be a non-empty string
            return (
              typeof result === 'string' &&
              result.length > 0
            );
          } catch (error) {
            // Function should never throw with valid MessageRole
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('generateMessageId should always return valid string ID', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No input needed
        () => {
          try {
            const result = generateMessageId();
            
            // Property: Result should always be a non-empty string
            return (
              typeof result === 'string' &&
              result.length > 0
            );
          } catch (error) {
            // Function should never throw
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('isLocalHostname should handle any hostname string and return boolean', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: undefined }),
        (hostname: string | undefined) => {
          try {
            const result = isLocalHostname(hostname);
            
            // Property: Result should always be a boolean
            return typeof result === 'boolean';
          } catch (error) {
            // Function should never throw with any string input
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('inferAssistantBaseUrl should always return valid URL string', () => {
    fc.assert(
      fc.property(
        // Generate different window.location configurations
        fc.record({
          hostname: fc.option(fc.string(), { nil: 'localhost' }),
          origin: fc.option(fc.string(), { nil: 'http://localhost:3000' }),
          protocol: fc.option(fc.constantFrom('http:', 'https:', 'file:'), { nil: 'http:' })
        }),
        (locationConfig: any) => {
          try {
            // Update window.location for this test
            vi.stubGlobal('window', {
              location: {
                hostname: locationConfig.hostname || 'localhost',
                origin: locationConfig.origin || 'http://localhost:3000',
                protocol: locationConfig.protocol || 'http:'
              },
              UI_CONFIG: {}
            });

            const result = inferAssistantBaseUrl();
            
            // Property: Result should always be a non-empty string
            return (
              typeof result === 'string' &&
              result.length > 0
            );
          } catch (error) {
            // Function should never throw
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('normalizeBaseUrl should handle any string input and return valid string', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: undefined }),
        (input: string | undefined) => {
          try {
            const result = normalizeBaseUrl(input);
            
            // Property: Result should always be a string
            return typeof result === 'string';
          } catch (error) {
            // Function should never throw with any string input
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getUIConfig should always return valid UIConfig object', () => {
    fc.assert(
      fc.property(
        // Generate different UI_CONFIG values
        fc.option(
          fc.record({
            assistantBaseUrl: fc.option(fc.string(), { nil: undefined })
          }),
          { nil: undefined }
        ),
        (uiConfig: any) => {
          try {
            // Update window.UI_CONFIG for this test
            vi.stubGlobal('window', {
              location: {
                hostname: 'localhost',
                origin: 'http://localhost:3000',
                protocol: 'http:'
              },
              UI_CONFIG: uiConfig || {}
            });

            const result = getUIConfig();
            
            // Property: Result should always be an object
            return (
              result !== null &&
              typeof result === 'object' &&
              !Array.isArray(result)
            );
          } catch (error) {
            // Function should never throw
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('readStoredThemePreference should always return string or null', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string(), { nil: null }),
        (storedValue: string | null) => {
          try {
            // Set up localStorage mock to return the test value
            const storage: Record<string, string> = {};
            if (storedValue !== null) {
              storage['pooch-palace-theme'] = storedValue;
            }
            
            vi.stubGlobal('localStorage', {
              getItem: vi.fn((key: string) => storage[key] || null),
              setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
              removeItem: vi.fn((key: string) => { delete storage[key]; }),
              clear: vi.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); })
            });

            const result = readStoredThemePreference();
            
            // Property: Result should always be string or null
            return (
              result === null ||
              typeof result === 'string'
            );
          } catch (error) {
            // Function should never throw
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('persistThemePreference should handle any string input without throwing', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (theme: string) => {
          try {
            // This function returns void, so we just check it doesn't throw
            persistThemePreference(theme);
            
            // Property: Function should complete without throwing
            return true;
          } catch (error) {
            // Function should never throw with any string input
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: ui-testing, Property 10: Timestamp formatting reliability**
   * **Validates: Requirements 2.5**
   * 
   * Property: For any randomly generated timestamp data, the formatting utilities 
   * should produce valid, well-formed output
   */
  it('timestamp formatting utilities should produce reliable output for any timestamp data', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Valid timestamps - various formats and edge cases
          fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') })
            .map(d => d.toISOString()),
          fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') })
            .map(d => d.toString()),
          fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') })
            .map(d => d.getTime().toString()),
          
          // Edge case timestamps
          fc.constant('1970-01-01T00:00:00.000Z'), // Unix epoch
          fc.constant('2038-01-19T03:14:07.000Z'), // 32-bit timestamp limit
          fc.constant('9999-12-31T23:59:59.999Z'), // Far future
          
          // Invalid but common timestamp strings
          fc.string().filter(s => s.length > 0),
          fc.constant('invalid-date'),
          fc.constant('not-a-timestamp'),
          fc.constant('2023-13-45T25:70:99.999Z'), // Invalid date components
          
          // Null and undefined cases
          fc.constant(null),
          fc.constant(undefined),
          fc.constant('')
        ),
        (timestampData: string | null | undefined) => {
          try {
            // Test formatTimestamp reliability
            const formattedResult = formatTimestamp(timestampData);
            
            // Property: formatTimestamp should always return a non-empty string
            const formatTimestampReliable = (
              typeof formattedResult === 'string' &&
              formattedResult.length > 0
            );

            // Test formatBubbleTimestamp reliability (only for string inputs)
            let formatBubbleTimestampReliable = true;
            if (typeof timestampData === 'string') {
              const bubbleResult = formatBubbleTimestamp(timestampData);
              
              // Property: formatBubbleTimestamp should always return a string (may be empty for invalid dates)
              formatBubbleTimestampReliable = typeof bubbleResult === 'string';
            }

            // Additional reliability checks for valid timestamps
            if (timestampData && typeof timestampData === 'string') {
              const date = new Date(timestampData);
              if (!Number.isNaN(date.getTime())) {
                // For valid dates, formatted output should contain recognizable date/time elements
                const hasDateElements = (
                  formattedResult.includes('/') || 
                  formattedResult.includes('-') || 
                  formattedResult.includes(',') ||
                  /\d{1,2}:\d{2}/.test(formattedResult) // Time pattern
                );
                
                return formatTimestampReliable && formatBubbleTimestampReliable && hasDateElements;
              }
            }

            return formatTimestampReliable && formatBubbleTimestampReliable;
          } catch (error) {
            // Timestamp formatting functions should never throw with any input
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('utility functions should maintain type safety across all valid inputs', () => {
    fc.assert(
      fc.property(
        // Generate a mix of different utility function calls
        fc.oneof(
          fc.record({
            type: fc.constant('normalizeRole'),
            input: fc.option(fc.string(), { nil: undefined })
          }),
          fc.record({
            type: fc.constant('formatTimestamp'),
            input: fc.option(
              fc.oneof(
                fc.date().map(d => d.toISOString()),
                fc.string(),
                fc.constant(null)
              ),
              { nil: null }
            )
          }),
          fc.record({
            type: fc.constant('formatBubbleTimestamp'),
            input: fc.string()
          }),
          fc.record({
            type: fc.constant('formatRole'),
            input: fc.constantFrom('assistant', 'user', 'system', 'tool') as fc.Arbitrary<MessageRole>
          }),
          fc.record({
            type: fc.constant('isLocalHostname'),
            input: fc.option(fc.string(), { nil: undefined })
          }),
          fc.record({
            type: fc.constant('normalizeBaseUrl'),
            input: fc.option(fc.string(), { nil: undefined })
          })
        ),
        (testCase: any) => {
          try {
            let result: any;

            switch (testCase.type) {
              case 'normalizeRole':
                result = normalizeRole(testCase.input);
                return typeof result === 'string' && ['assistant', 'user', 'system', 'tool'].includes(result);
              
              case 'formatTimestamp':
                result = formatTimestamp(testCase.input);
                return typeof result === 'string' && result.length > 0;
              
              case 'formatBubbleTimestamp':
                result = formatBubbleTimestamp(testCase.input);
                return typeof result === 'string';
              
              case 'formatRole':
                result = formatRole(testCase.input);
                return typeof result === 'string' && result.length > 0;
              
              case 'isLocalHostname':
                result = isLocalHostname(testCase.input);
                return typeof result === 'boolean';
              
              case 'normalizeBaseUrl':
                result = normalizeBaseUrl(testCase.input);
                return typeof result === 'string';
              
              default:
                return false;
            }
          } catch (error) {
            // No utility function should throw with valid inputs
            return false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});