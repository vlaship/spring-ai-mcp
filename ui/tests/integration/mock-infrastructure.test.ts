import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mockUtils, errorSimulationHandlers } from '../mocks/api-mocks.js';
import { domMocks } from '../mocks/dom-mocks.js';
import { streamMocks } from '../mocks/stream-mocks.js';
import { testHelpers } from '../utils/test-helpers.js';
import { generators } from '../utils/generators.js';

/**
 * Integration tests for the complete mock infrastructure
 * Validates that all mock components work together correctly
 */

describe('Mock Infrastructure Integration', () => {
  beforeEach(() => {
    domMocks.setup();
    mockUtils.resetMockData();
  });

  afterEach(() => {
    domMocks.cleanup();
  });

  it('should provide API mock handlers', () => {
    // Test that API mock handlers are available
    expect(mockUtils.resetMockData).toBeDefined();
    expect(mockUtils.setMockUsers).toBeDefined();
    expect(mockUtils.getMockUsers).toBeDefined();
    
    // Test error simulation handlers exist
    expect(errorSimulationHandlers.badRequest).toBeDefined();
    expect(errorSimulationHandlers.internalServerError).toBeDefined();
    expect(errorSimulationHandlers.invalidJson).toBeDefined();
  });

  it('should handle mock API responses', () => {
    // Test API response creation utilities
    const response = testHelpers.api.createMockApiResponse({ test: 'data' });
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);

    const errorResponse = testHelpers.api.createMockErrorResponse('Test error', 500);
    expect(errorResponse).toBeInstanceOf(Response);
    expect(errorResponse.status).toBe(500);
  });

  it('should provide comprehensive DOM mocking', () => {
    // Test DOM element creation
    const element = testHelpers.dom.createMockElement('div', {
      id: 'test-element',
      className: 'test-class',
      textContent: 'Test content'
    });

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.id).toBe('test-element');
    expect(element.className).toBe('test-class');
    expect(element.textContent).toBe('Test content');

    // Test DOM manipulation
    document.body.appendChild(element);
    expect(document.getElementById('test-element')).toBe(element);
    
    document.body.removeChild(element);
    expect(document.getElementById('test-element')).toBeNull();
  });

  it('should provide working browser API mocks', () => {
    // Test localStorage
    expect(localStorage.setItem).toBeDefined();
    localStorage.setItem('test-key', 'test-value');
    expect(localStorage.getItem('test-key')).toBe('test-value');

    // Test console
    expect(console.log).toBeDefined();
    console.log('test message');
    expect(console.log).toHaveBeenCalledWith('test message');

    // Test window methods
    expect(window.alert).toBeDefined();
    window.alert('test alert');
    expect(window.alert).toHaveBeenCalledWith('test alert');
  });

  it('should generate valid test data', () => {
    // Test that generators are available and return Arbitrary objects
    expect(generators.user).toBeDefined();
    expect(generators.chat).toBeDefined();
    expect(generators.message).toBeDefined();
    expect(generators.appState).toBeDefined();

    // Test validation utilities work
    const testUser = testHelpers.data.createTestUser();
    expect(testHelpers.validation.isValidUser(testUser)).toBe(true);

    const testChat = testHelpers.data.createTestChat();
    expect(testHelpers.validation.isValidChat(testChat)).toBe(true);

    const testMessage = testHelpers.data.createTestMessage();
    expect(testHelpers.validation.isValidMessage(testMessage)).toBe(true);

    const testState = testHelpers.state.createMinimalState();
    expect(testHelpers.state.isValidState(testState)).toBe(true);
  });

  it('should support dynamic mock data management', () => {
    // Test initial state
    const initialUsers = mockUtils.getMockUsers();
    expect(Array.isArray(initialUsers)).toBe(true);

    // Test setting custom data
    const customUsers = [
      { userId: 'custom1', name: 'Custom User 1' },
      { userId: 'custom2', name: 'Custom User 2' }
    ];
    
    mockUtils.setMockUsers(customUsers);
    const updatedUsers = mockUtils.getMockUsers();
    expect(updatedUsers).toEqual(customUsers);

    // Test reset functionality
    mockUtils.resetMockData();
    const resetUsers = mockUtils.getMockUsers();
    expect(resetUsers).not.toEqual(customUsers);
  });

  it('should handle error simulation scenarios', () => {
    // Test that error handlers are available
    expect(errorSimulationHandlers.badRequest).toBeDefined();
    expect(errorSimulationHandlers.internalServerError).toBeDefined();
    expect(errorSimulationHandlers.invalidJson).toBeDefined();
    expect(errorSimulationHandlers.streamError).toBeDefined();

    // Test special data scenarios
    mockUtils.simulateEmptyState();
    expect(mockUtils.getMockUsers()).toEqual([]);

    mockUtils.simulateSpecialCharacters();
    const specialUsers = mockUtils.getMockUsers();
    expect(specialUsers.some(user => user.name.includes('<script>'))).toBe(true);
  });

  it('should provide stream testing utilities', () => {
    // Test stream event generation
    const events = streamMocks.events.success('test-chat', 'test answer');
    expect(events).toHaveLength(3);
    expect(events[events.length - 1].done).toBe(true);
    expect(events[events.length - 1].answer).toBe('test answer');

    // Test stream creation
    const stream = streamMocks.createStream({ events, delay: 10 });
    expect(stream).toBeInstanceOf(ReadableStream);

    // Test NDJSON utilities
    const ndjson = streamMocks.utils.eventsToNDJSON(events);
    expect(typeof ndjson).toBe('string');
    expect(ndjson.includes('test-chat')).toBe(true);
  });

  it('should support comprehensive test scenarios', () => {
    // Test realistic state creation
    const realisticState = testHelpers.state.createRealisticState();
    expect(realisticState.users.length).toBeGreaterThan(0);
    expect(realisticState.chats.length).toBeGreaterThan(0);
    expect(realisticState.selectedUserId).toBeTruthy();

    // Test minimal state creation
    const minimalState = testHelpers.state.createMinimalState();
    expect(minimalState.users).toEqual([]);
    expect(minimalState.chats).toEqual([]);
    expect(minimalState.selectedUserId).toBeNull();

    // Test API response creation
    const apiResponse = testHelpers.api.createMockApiResponse({ test: 'data' });
    expect(apiResponse).toBeInstanceOf(Response);
    expect(apiResponse.status).toBe(200);
  });
});