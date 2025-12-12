import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

// Mock global objects
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

const mockCrypto = {
  randomUUID: vi.fn()
};

const mockWindow = {
  location: {
    hostname: 'localhost',
    origin: 'http://localhost:3000',
    protocol: 'http:'
  },
  UI_CONFIG: {}
};

describe('Utils Tests', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup global mocks
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    Object.defineProperty(global, 'crypto', {
      value: mockCrypto,
      writable: true
    });
    
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('normalizeRole', () => {
    it('should return assistant for undefined input', () => {
      expect(normalizeRole(undefined)).toBe('assistant');
    });

    it('should return assistant for empty string', () => {
      expect(normalizeRole('')).toBe('assistant');
    });

    it('should return assistant for null input', () => {
      expect(normalizeRole(null as any)).toBe('assistant');
    });

    it('should normalize valid roles to lowercase', () => {
      expect(normalizeRole('ASSISTANT')).toBe('assistant');
      expect(normalizeRole('User')).toBe('user');
      expect(normalizeRole('SYSTEM')).toBe('system');
      expect(normalizeRole('Tool')).toBe('tool');
    });

    it('should return assistant for invalid roles', () => {
      expect(normalizeRole('invalid')).toBe('assistant');
      expect(normalizeRole('admin')).toBe('assistant');
      expect(normalizeRole('123')).toBe('assistant');
    });

    it('should handle whitespace in roles', () => {
      expect(normalizeRole(' assistant ')).toBe('assistant');
      expect(normalizeRole('user\n')).toBe('assistant'); // trimmed becomes invalid
    });
  });

  describe('formatTimestamp', () => {
    it('should return "Unknown date" for null input', () => {
      expect(formatTimestamp(null)).toBe('Unknown date');
    });

    it('should return "Unknown date" for undefined input', () => {
      expect(formatTimestamp(undefined)).toBe('Unknown date');
    });

    it('should return "Unknown date" for empty string', () => {
      expect(formatTimestamp('')).toBe('Unknown date');
    });

    it('should return original string for invalid date strings', () => {
      expect(formatTimestamp('invalid-date')).toBe('invalid-date');
      expect(formatTimestamp('not a date')).toBe('not a date');
    });

    it('should format valid ISO date strings', () => {
      const result = formatTimestamp('2023-12-25T10:30:00Z');
      expect(result).toMatch(/Dec/); // Should contain month abbreviation
      expect(result).toMatch(/25/); // Should contain day
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Should contain time in some format
    });

    it('should format valid date strings in different formats', () => {
      const result = formatTimestamp('2023-01-01');
      expect(result).toMatch(/Jan|Dec/); // Should contain month (could be Dec 31 due to timezone)
      expect(result).toMatch(/\d{1,2}/); // Should contain day number
    });
  });

  describe('formatBubbleTimestamp', () => {
    it('should return empty string for invalid date', () => {
      expect(formatBubbleTimestamp('invalid-date')).toBe('');
      expect(formatBubbleTimestamp('not a date')).toBe('');
    });

    it('should format valid date to time string', () => {
      const result = formatBubbleTimestamp('2023-12-25T14:30:00Z');
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Should match time format like "2:30" or "14:30"
    });

    it('should handle different valid date formats', () => {
      const result = formatBubbleTimestamp('2023-01-01T09:15:30');
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('formatRole', () => {
    it('should format assistant role', () => {
      expect(formatRole('assistant')).toBe('Assistant');
    });

    it('should format system role', () => {
      expect(formatRole('system')).toBe('System');
    });

    it('should format user role as "You"', () => {
      expect(formatRole('user')).toBe('You');
    });

    it('should format tool role as "You"', () => {
      expect(formatRole('tool')).toBe('You');
    });

    it('should handle any other role as "You"', () => {
      expect(formatRole('unknown' as MessageRole)).toBe('You');
    });
  });

  describe('generateMessageId', () => {
    it('should use crypto.randomUUID when available', () => {
      const mockUUID = 'test-uuid-123';
      mockCrypto.randomUUID.mockReturnValue(mockUUID);
      
      expect(generateMessageId()).toBe(mockUUID);
      expect(mockCrypto.randomUUID).toHaveBeenCalledOnce();
    });

    it('should fallback to timestamp-random when crypto.randomUUID is not available', () => {
      mockCrypto.randomUUID = undefined;
      
      const result = generateMessageId();
      expect(result).toMatch(/^\d+-\d/); // Should match timestamp-random pattern
    });

    it('should generate unique IDs on multiple calls', () => {
      mockCrypto.randomUUID = undefined;
      
      const id1 = generateMessageId();
      const id2 = generateMessageId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isLocalHostname', () => {
    it('should return true for empty hostname', () => {
      expect(isLocalHostname('')).toBe(true);
    });

    it('should return true for localhost variations', () => {
      expect(isLocalHostname('localhost')).toBe(true);
      expect(isLocalHostname('LOCALHOST')).toBe(true);
      expect(isLocalHostname('127.0.0.1')).toBe(true);
      expect(isLocalHostname('::1')).toBe(true);
      expect(isLocalHostname('0.0.0.0')).toBe(true);
    });

    it('should return true for private network ranges', () => {
      expect(isLocalHostname('192.168.1.1')).toBe(true);
      expect(isLocalHostname('192.168.0.100')).toBe(true);
      expect(isLocalHostname('10.0.0.1')).toBe(true);
      expect(isLocalHostname('10.255.255.255')).toBe(true);
      expect(isLocalHostname('172.16.0.1')).toBe(true);
    });

    it('should return true for .local domains', () => {
      expect(isLocalHostname('mycomputer.local')).toBe(true);
      expect(isLocalHostname('test.local')).toBe(true);
    });

    it('should return false for public domains', () => {
      expect(isLocalHostname('google.com')).toBe(false);
      expect(isLocalHostname('example.org')).toBe(false);
      expect(isLocalHostname('api.service.com')).toBe(false);
    });

    it('should handle undefined hostname', () => {
      expect(isLocalHostname(undefined)).toBe(true);
    });
  });

  describe('inferAssistantBaseUrl', () => {
    it('should return default URL for file protocol', () => {
      mockWindow.location.protocol = 'file:';
      mockWindow.location.origin = 'file://';
      
      expect(inferAssistantBaseUrl()).toBe('http://localhost:8083/proposal-assistant-service');
    });

    it('should return default URL for null origin', () => {
      mockWindow.location.origin = 'null';
      
      expect(inferAssistantBaseUrl()).toBe('http://localhost:8083/proposal-assistant-service');
    });

    it('should return default URL for localhost hostname', () => {
      mockWindow.location.hostname = 'localhost';
      mockWindow.location.origin = 'http://localhost:3000';
      
      expect(inferAssistantBaseUrl()).toBe('http://localhost:8083/proposal-assistant-service');
    });

    it('should return origin-based URL for non-local hostname', () => {
      // Mock the window.location object properly
      const originalLocation = global.window.location;
      delete (global.window as any).location;
      global.window.location = {
        hostname: 'production.example.com',
        origin: 'https://production.example.com',
        protocol: 'https:'
      } as any;
      
      expect(inferAssistantBaseUrl()).toBe('https://production.example.com/proposal-assistant-service');
      
      // Restore original location
      global.window.location = originalLocation;
    });

    it('should handle missing origin', () => {
      mockWindow.location.origin = undefined as any;
      
      expect(inferAssistantBaseUrl()).toBe('http://localhost:8083/proposal-assistant-service');
    });
  });

  describe('normalizeBaseUrl', () => {
    it('should return empty string for undefined input', () => {
      expect(normalizeBaseUrl(undefined)).toBe('');
    });

    it('should return empty string for null input', () => {
      expect(normalizeBaseUrl(null as any)).toBe('');
    });

    it('should return empty string for empty string input', () => {
      expect(normalizeBaseUrl('')).toBe('');
    });

    it('should remove trailing slash', () => {
      expect(normalizeBaseUrl('http://example.com/')).toBe('http://example.com');
      expect(normalizeBaseUrl('https://api.service.com/')).toBe('https://api.service.com');
    });

    it('should leave URLs without trailing slash unchanged', () => {
      expect(normalizeBaseUrl('http://example.com')).toBe('http://example.com');
      expect(normalizeBaseUrl('https://api.service.com/path')).toBe('https://api.service.com/path');
    });

    it('should handle multiple trailing slashes', () => {
      expect(normalizeBaseUrl('http://example.com///')).toBe('http://example.com//');
    });
  });

  describe('getUIConfig', () => {
    it('should return UI_CONFIG from window', () => {
      const testConfig = { assistantBaseUrl: 'http://test.com' };
      mockWindow.UI_CONFIG = testConfig;
      
      expect(getUIConfig()).toBe(testConfig);
    });

    it('should return empty object when UI_CONFIG is not set', () => {
      mockWindow.UI_CONFIG = undefined;
      
      expect(getUIConfig()).toEqual({});
    });

    it('should handle null UI_CONFIG', () => {
      mockWindow.UI_CONFIG = null;
      
      expect(getUIConfig()).toEqual({}); // The function uses nullish coalescing, so null becomes {}
    });
  });

  describe('readStoredThemePreference', () => {
    it('should return stored theme preference', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');
      
      expect(readStoredThemePreference()).toBe('dark');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('pooch-palace-theme');
    });

    it('should return null when no preference is stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      expect(readStoredThemePreference()).toBe(null);
    });

    it('should return null when localStorage throws error', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      expect(readStoredThemePreference()).toBe(null);
    });
  });

  describe('persistThemePreference', () => {
    it('should store theme preference', () => {
      persistThemePreference('light');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('pooch-palace-theme', 'light');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      expect(() => persistThemePreference('dark')).not.toThrow();
    });

    it('should handle empty string theme', () => {
      persistThemePreference('');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('pooch-palace-theme', '');
    });
  });
});