import { vi } from 'vitest';
import type { StreamEvent } from '../../src/types.js';

/**
 * Mock utilities for testing streaming responses
 */

export interface MockStreamOptions {
  events: StreamEvent[];
  delay?: number;
  shouldError?: boolean;
  errorMessage?: string;
}

/**
 * Creates a mock ReadableStream for testing streaming responses
 */
export function createMockStream(options: MockStreamOptions): ReadableStream<Uint8Array> {
  const { events, delay = 100, shouldError = false, errorMessage = 'Stream error' } = options;
  
  return new ReadableStream({
    start(controller) {
      if (shouldError) {
        setTimeout(() => {
          controller.error(new Error(errorMessage));
        }, delay);
        return;
      }

      events.forEach((event, index) => {
        setTimeout(() => {
          const eventData = JSON.stringify(event) + '\n';
          controller.enqueue(new TextEncoder().encode(eventData));
          
          if (event.done || index === events.length - 1) {
            controller.close();
          }
        }, index * delay);
      });
    }
  });
}

/**
 * Creates a mock streaming response for fetch
 */
export function createMockStreamResponse(options: MockStreamOptions): Response {
  const stream = createMockStream(options);
  
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson'
    }
  });
}

/**
 * Creates mock stream events for testing
 */
export const mockStreamEvents = {
  // Simple successful stream
  success: (chatId: string = 'test-chat', answer: string = 'Test response'): StreamEvent[] => [
    { chatId, delta: 'Test ', done: false },
    { chatId, delta: 'response', done: false },
    { chatId, done: true, answer }
  ],

  // Stream with multiple chunks
  multiChunk: (chatId: string = 'test-chat'): StreamEvent[] => [
    { chatId, delta: 'This ', done: false },
    { chatId, delta: 'is ', done: false },
    { chatId, delta: 'a ', done: false },
    { chatId, delta: 'multi-chunk ', done: false },
    { chatId, delta: 'response.', done: false },
    { chatId, done: true, answer: 'This is a multi-chunk response.' }
  ],

  // Stream with error
  error: (chatId: string = 'test-chat', error: string = 'Test error'): StreamEvent[] => [
    { chatId, delta: 'Starting ', done: false },
    { chatId, error, done: true }
  ],

  // Empty stream
  empty: (chatId: string = 'test-chat'): StreamEvent[] => [
    { chatId, done: true, answer: '' }
  ],

  // Stream with only deltas (no final answer)
  deltaOnly: (chatId: string = 'test-chat'): StreamEvent[] => [
    { chatId, delta: 'Delta ', done: false },
    { chatId, delta: 'only ', done: false },
    { chatId, delta: 'response', done: false },
    { chatId, done: true }
  ]
};

/**
 * Mock async generator for streaming responses
 */
export async function* createMockStreamGenerator(
  events: StreamEvent[],
  delay: number = 10
): AsyncGenerator<StreamEvent, void, unknown> {
  for (const event of events) {
    await new Promise(resolve => setTimeout(resolve, delay));
    yield event;
    if (event.done) {
      return;
    }
  }
}

/**
 * Mock fetch function that returns streaming responses
 */
export function createMockStreamingFetch(streamOptions: MockStreamOptions) {
  return vi.fn((url: string) => {
    if (url.includes('/ask/stream')) {
      return Promise.resolve(createMockStreamResponse(streamOptions));
    }
    
    // Default non-streaming response
    return Promise.resolve(new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  });
}

/**
 * Utilities for testing stream parsing
 */
export const streamTestUtils = {
  /**
   * Converts stream events to NDJSON string
   */
  eventsToNDJSON(events: StreamEvent[]): string {
    return events.map(event => JSON.stringify(event)).join('\n') + '\n';
  },

  /**
   * Creates a malformed NDJSON string for error testing
   */
  createMalformedNDJSON(): string {
    return '{"chatId": "test", "delta": "incomplete\n{"invalid": json}\n';
  },

  /**
   * Creates a stream with mixed valid and invalid events
   */
  createMixedValidityStream(): string {
    return [
      '{"chatId": "test", "delta": "valid", "done": false}',
      '{"invalid": json}',
      '{"chatId": "test", "delta": " event", "done": false}',
      '{"chatId": "test", "done": true, "answer": "valid event"}'
    ].join('\n') + '\n';
  },

  /**
   * Simulates network interruption in stream
   */
  createInterruptedStream(events: StreamEvent[]): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start(controller) {
        // Send first few events
        const partialEvents = events.slice(0, Math.floor(events.length / 2));
        partialEvents.forEach((event, index) => {
          setTimeout(() => {
            const eventData = JSON.stringify(event) + '\n';
            controller.enqueue(new TextEncoder().encode(eventData));
          }, index * 50);
        });

        // Simulate network interruption
        setTimeout(() => {
          controller.error(new Error('Network interrupted'));
        }, partialEvents.length * 50 + 100);
      }
    });
  }
};

/**
 * Mock WebSocket for testing real-time features
 */
export class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;

  private messageQueue: string[] = [];

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string): void {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.messageQueue.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  // Test utilities
  simulateMessage(data: string): void {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  getMessageQueue(): string[] {
    return [...this.messageQueue];
  }

  clearMessageQueue(): void {
    this.messageQueue = [];
  }
}

// Export all stream mocks
export const streamMocks = {
  createStream: createMockStream,
  createResponse: createMockStreamResponse,
  events: mockStreamEvents,
  generator: createMockStreamGenerator,
  fetch: createMockStreamingFetch,
  utils: streamTestUtils,
  WebSocket: MockWebSocket
};