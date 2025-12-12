import { vi } from 'vitest';
import type { User, Chat, Message, AppState, DOMElements } from '../../src/types.js';

/**
 * Comprehensive test utilities for UI testing
 */

// DOM Utilities
export const domUtils = {
  /**
   * Creates a mock DOM element with specified properties
   */
  createMockElement(tagName: string, properties: Record<string, any> = {}): HTMLElement {
    const element = document.createElement(tagName);
    
    // Handle special properties that can't be assigned directly
    const { dataset, ...assignableProperties } = properties;
    
    // Assign regular properties
    Object.assign(element, assignableProperties);
    
    // Handle dataset separately if provided
    if (dataset && typeof dataset === 'object') {
      try {
        Object.assign(element.dataset, dataset);
      } catch (error) {
        // Ignore dataset assignment errors for invalid keys
        // Dataset keys must be valid HTML data attribute names
      }
    }
    
    return element;
  },

  /**
   * Creates a mock event with specified properties
   */
  createMockEvent(type: string, properties: Record<string, any> = {}): Event {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, properties);
    return event;
  },

  /**
   * Creates a mock keyboard event
   */
  createMockKeyboardEvent(type: string, key: string, properties: Record<string, any> = {}): KeyboardEvent {
    const event = new KeyboardEvent(type, { key, bubbles: true, cancelable: true, ...properties });
    return event;
  },

  /**
   * Creates a mock mouse event
   */
  createMockMouseEvent(type: string, properties: Record<string, any> = {}): MouseEvent {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, ...properties });
    return event;
  },

  /**
   * Cleans up DOM after tests
   */
  cleanupDOM(): void {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    // Clear any remaining event listeners
    const newBody = document.createElement('body');
    document.documentElement.replaceChild(newBody, document.body);
  },

  /**
   * Sets up a basic DOM structure for testing
   */
  setupBasicDOM(): void {
    document.body.innerHTML = `
      <div id="app">
        <div id="user-selector">
          <select id="user-select">
            <option value="">Select a user...</option>
          </select>
        </div>
        <div id="chat-list">
          <div id="chat-count">0 chats</div>
          <button id="new-chat-button">New Chat</button>
          <div id="chat-items"></div>
        </div>
        <div id="chat-panel">
          <div id="chat-panel-title">Chat</div>
          <div id="chat-history"></div>
          <form id="message-form">
            <textarea id="message-input" placeholder="Type your message..."></textarea>
            <button id="send-button" type="submit">Send</button>
          </form>
        </div>
        <button id="theme-toggle-button">
          <span id="theme-toggle-text">Toggle Theme</span>
        </button>
      </div>
    `;
  },

  /**
   * Sets up a complete DOM structure matching the application
   */
  setupCompleteDOM(): DOMElements {
    this.setupBasicDOM();
    
    return {
      userSelect: document.getElementById('user-select') as HTMLSelectElement,
      chatList: document.getElementById('chat-items') as HTMLElement,
      chatCount: document.getElementById('chat-count') as HTMLElement,
      newChatButton: document.getElementById('new-chat-button') as HTMLButtonElement,
      chatPanelTitle: document.getElementById('chat-panel-title') as HTMLElement,
      chatHistory: document.getElementById('chat-history') as HTMLElement,
      messageForm: document.getElementById('message-form') as HTMLFormElement,
      messageInput: document.getElementById('message-input') as HTMLTextAreaElement,
      sendButton: document.getElementById('send-button') as HTMLButtonElement,
      themeToggleButton: document.getElementById('theme-toggle-button') as HTMLButtonElement,
      themeToggleText: document.getElementById('theme-toggle-text') as HTMLElement
    };
  },

  /**
   * Simulates user interaction with an element
   */
  simulateUserInteraction(element: HTMLElement, eventType: string = 'click'): void {
    const event = this.createMockEvent(eventType);
    element.dispatchEvent(event);
  },

  /**
   * Simulates typing in an input element
   */
  simulateTyping(element: HTMLInputElement | HTMLTextAreaElement, text: string): void {
    element.value = text;
    element.dispatchEvent(this.createMockEvent('input'));
    element.dispatchEvent(this.createMockEvent('change'));
  },

  /**
   * Waits for DOM mutations to complete
   */
  async waitForDOMUpdate(): Promise<void> {
    return new Promise(resolve => {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        resolve();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 10);
    });
  }
};

// Async Utilities
export const asyncUtils = {
  /**
   * Waits for a specified number of milliseconds
   */
  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Waits for the next tick of the event loop
   */
  nextTick(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  },

  /**
   * Waits for a condition to become true
   */
  async waitFor(condition: () => boolean, timeout: number = 1000, interval: number = 10): Promise<void> {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await this.sleep(interval);
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  },

  /**
   * Waits for an element to appear in the DOM
   */
  async waitForElement(selector: string, timeout: number = 1000): Promise<HTMLElement> {
    let element: HTMLElement | null = null;
    await this.waitFor(() => {
      element = document.querySelector(selector);
      return element !== null;
    }, timeout);
    return element!;
  }
};

// Mock Utilities
export const mockUtils = {
  /**
   * Creates a spy function with optional implementation
   */
  createSpy<T extends (...args: any[]) => any>(implementation?: T): ReturnType<typeof vi.fn> {
    return implementation ? vi.fn(implementation) : vi.fn();
  },

  /**
   * Creates a mock fetch function
   */
  createMockFetch(responses: Record<string, any> = {}): ReturnType<typeof vi.fn> {
    return vi.fn((url: string) => {
      const response = responses[url] || { status: 404, json: () => Promise.resolve({}) };
      return Promise.resolve({
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: () => Promise.resolve(response.data || {}),
        text: () => Promise.resolve(response.text || ''),
        ...response
      });
    });
  },

  /**
   * Creates a mock localStorage
   */
  createMockLocalStorage(): Storage {
    const store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { Object.keys(store).forEach(key => delete store[key]); }),
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
      get length() { return Object.keys(store).length; }
    };
  },

  /**
   * Creates a mock console for testing console output
   */
  createMockConsole(): Console {
    return {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    } as any;
  }
};

// Data Utilities
export const dataUtils = {
  /**
   * Creates a test user with default or custom properties
   */
  createTestUser(overrides: Partial<User> = {}): User {
    return {
      userId: 'test-user-id',
      name: 'Test User',
      ...overrides
    };
  },

  /**
   * Creates a test chat with default or custom properties
   */
  createTestChat(overrides: Partial<Chat> = {}): Chat {
    return {
      chatId: 'test-chat-id',
      title: 'Test Chat',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  },

  /**
   * Creates a test message with default or custom properties
   */
  createTestMessage(overrides: Partial<Message> = {}): Message {
    return {
      id: 'test-message-id',
      role: 'user',
      content: 'Test message content',
      timestamp: new Date().toISOString(),
      status: 'complete',
      ...overrides
    };
  },

  /**
   * Creates a test app state with default or custom properties
   */
  createTestAppState(overrides: Partial<AppState> = {}): AppState {
    return {
      users: [this.createTestUser()],
      chats: [this.createTestChat()],
      selectedUserId: null,
      selectedChatId: null,
      historyByChatId: {},
      isSending: false,
      isComposingNewChat: false,
      pendingAssistantByChatId: {},
      pendingAssistantIntervals: {},
      ...overrides
    };
  },

  /**
   * Creates multiple test users
   */
  createTestUsers(count: number): User[] {
    return Array.from({ length: count }, (_, i) => this.createTestUser({
      userId: `user-${i + 1}`,
      name: `User ${i + 1}`
    }));
  },

  /**
   * Creates multiple test chats
   */
  createTestChats(count: number): Chat[] {
    return Array.from({ length: count }, (_, i) => this.createTestChat({
      chatId: `chat-${i + 1}`,
      title: `Chat ${i + 1}`,
      createdAt: new Date(Date.now() - i * 86400000).toISOString() // Each chat 1 day older
    }));
  },

  /**
   * Creates multiple test messages
   */
  createTestMessages(count: number): Message[] {
    return Array.from({ length: count }, (_, i) => this.createTestMessage({
      id: `message-${i + 1}`,
      content: `Message ${i + 1}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      timestamp: new Date(Date.now() - i * 60000).toISOString() // Each message 1 minute older
    }));
  }
};

// Validation Utilities
export const validationUtils = {
  /**
   * Validates that an object matches the User interface
   */
  isValidUser(obj: any): obj is User {
    return obj && 
           typeof obj.userId === 'string' && 
           typeof obj.name === 'string' &&
           obj.userId.length > 0 &&
           obj.name.length > 0;
  },

  /**
   * Validates that an object matches the Chat interface
   */
  isValidChat(obj: any): obj is Chat {
    return obj && 
           typeof obj.chatId === 'string' && 
           (obj.title === null || typeof obj.title === 'string') &&
           typeof obj.createdAt === 'string' &&
           obj.chatId.length > 0;
  },

  /**
   * Validates that an object matches the Message interface
   */
  isValidMessage(obj: any): obj is Message {
    return obj && 
           typeof obj.id === 'string' && 
           ['user', 'assistant', 'system', 'tool'].includes(obj.role) &&
           typeof obj.content === 'string' &&
           (obj.timestamp === null || typeof obj.timestamp === 'string') &&
           ['complete', 'pending', 'streaming'].includes(obj.status) &&
           obj.id.length > 0;
  },

  /**
   * Validates that a timestamp string is a valid ISO date
   */
  isValidTimestamp(timestamp: string): boolean {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) && date.toISOString() === timestamp;
  },

  /**
   * Validates that DOM elements exist and have expected properties
   */
  validateDOMElements(elements: Partial<DOMElements>): boolean {
    return Object.values(elements).every(element => 
      element instanceof HTMLElement || element === null
    );
  }
};

// API Testing Utilities
export const apiUtils = {
  /**
   * Creates a mock API response with standard structure
   */
  createMockApiResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  },

  /**
   * Creates a mock error response
   */
  createMockErrorResponse(message: string, status: number = 500): Response {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  },

  /**
   * Creates a mock streaming response
   */
  createMockStreamResponse(events: any[]): Response {
    const stream = new ReadableStream({
      start(controller) {
        events.forEach((event, index) => {
          setTimeout(() => {
            controller.enqueue(new TextEncoder().encode(JSON.stringify(event) + '\n'));
            if (event.done || index === events.length - 1) {
              controller.close();
            }
          }, index * 10);
        });
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'application/x-ndjson' }
    });
  },

  /**
   * Validates API response structure
   */
  isValidApiResponse(response: any): boolean {
    return response && 
           typeof response.status === 'number' &&
           response.status >= 200 && 
           response.status < 600;
  }
};

// State Testing Utilities
export const stateUtils = {
  /**
   * Creates a minimal valid state for testing
   */
  createMinimalState(): AppState {
    return {
      users: [],
      chats: [],
      selectedUserId: null,
      selectedChatId: null,
      historyByChatId: {},
      isSending: false,
      isComposingNewChat: false,
      pendingAssistantByChatId: {},
      pendingAssistantIntervals: {}
    };
  },

  /**
   * Creates a state with realistic test data
   */
  createRealisticState(): AppState {
    const users = dataUtils.createTestUsers(3);
    const chats = dataUtils.createTestChats(5);
    const messages = dataUtils.createTestMessages(10);

    return {
      users,
      chats,
      selectedUserId: users[0].userId,
      selectedChatId: chats[0].chatId,
      historyByChatId: {
        [chats[0].chatId]: messages.slice(0, 5),
        [chats[1].chatId]: messages.slice(5, 8)
      },
      isSending: false,
      isComposingNewChat: false,
      pendingAssistantByChatId: {},
      pendingAssistantIntervals: {}
    };
  },

  /**
   * Validates state consistency
   */
  isValidState(state: any): boolean {
    return state &&
           Array.isArray(state.users) &&
           Array.isArray(state.chats) &&
           typeof state.isSending === 'boolean' &&
           typeof state.isComposingNewChat === 'boolean' &&
           typeof state.historyByChatId === 'object';
  }
};

// Export all utilities as a single object for convenience
export const testHelpers = {
  dom: domUtils,
  async: asyncUtils,
  mock: mockUtils,
  data: dataUtils,
  validation: validationUtils,
  api: apiUtils,
  state: stateUtils
};

// Legacy exports for backward compatibility
export const {
  createMockElement,
  createMockEvent,
  cleanupDOM,
  setupBasicDOM
} = domUtils;

export const {
  sleep,
  nextTick
} = asyncUtils;

export const {
  createSpy
} = mockUtils;