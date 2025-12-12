import * as fc from 'fast-check';
import type { 
  User, 
  Chat, 
  Message, 
  MessageRole, 
  MessageStatus, 
  AppState, 
  DOMElements,
  ChatHistoryResponse,
  AskResponse,
  StreamEvent,
  UIConfig,
  Theme,
  RenderOptions,
  ThemeOptions,
  MessageOverrides
} from '../../src/types.js';

/**
 * Fast-Check generators for property-based testing
 * Comprehensive generators for all domain objects and edge cases
 */

// Basic primitive generators
export const primitiveGenerators = {
  // String generators with realistic constraints
  userId: () => fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  userName: () => fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  chatId: () => fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  messageId: () => fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  
  // Content generators
  chatTitle: () => fc.option(fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0), { nil: null }),
  messageContent: () => fc.string({ minLength: 0, maxLength: 1000 }),
  
  // Timestamp generators
  validTimestamp: () => fc.date({ min: new Date('2020-01-01T00:00:00.000Z'), max: new Date('2030-12-31T23:59:59.999Z') })
    .filter(d => !isNaN(d.getTime()))
    .map(d => d.toISOString()),
  
  // Enum generators
  messageRole: () => fc.constantFrom('user', 'assistant', 'system', 'tool') as fc.Arbitrary<MessageRole>,
  messageStatus: () => fc.constantFrom('complete', 'pending', 'streaming') as fc.Arbitrary<MessageStatus>,
  
  // HTML/DOM generators
  elementId: () => fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9-_]/g, '')).filter(s => s.length > 0),
  className: () => fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9-_]/g, '')).filter(s => s.length > 0),
  htmlContent: () => fc.string({ minLength: 0, maxLength: 500 }),
  
  // Boolean and numeric generators
  boolean: () => fc.boolean(),
  httpStatus: () => fc.integer({ min: 200, max: 599 }),
  errorStatus: () => fc.integer({ min: 400, max: 599 })
};

// Domain object generators
export const generators = {
  // Primitive generators for backward compatibility
  userId: primitiveGenerators.userId,
  userName: primitiveGenerators.userName,
  chatId: primitiveGenerators.chatId,
  messageId: primitiveGenerators.messageId,
  chatTitle: primitiveGenerators.chatTitle,
  messageContent: primitiveGenerators.messageContent,
  validTimestamp: primitiveGenerators.validTimestamp,
  messageRole: primitiveGenerators.messageRole,
  messageStatus: primitiveGenerators.messageStatus,
  elementId: primitiveGenerators.elementId,
  className: primitiveGenerators.className,
  htmlContent: primitiveGenerators.htmlContent,
  boolean: primitiveGenerators.boolean,
  httpStatus: primitiveGenerators.httpStatus,
  errorStatus: primitiveGenerators.errorStatus,
  
  // Error message generator for backward compatibility
  errorMessage: () => fc.string({ minLength: 1, maxLength: 200 }),

  // User generators
  user: () => fc.record({
    userId: primitiveGenerators.userId(),
    name: primitiveGenerators.userName()
  }) as fc.Arbitrary<User>,

  // Chat generators
  chat: () => fc.record({
    chatId: primitiveGenerators.chatId(),
    title: primitiveGenerators.chatTitle(),
    createdAt: primitiveGenerators.validTimestamp()
  }) as fc.Arbitrary<Chat>,

  // Message generators
  message: () => fc.record({
    id: primitiveGenerators.messageId(),
    role: primitiveGenerators.messageRole(),
    content: primitiveGenerators.messageContent(),
    timestamp: fc.option(primitiveGenerators.validTimestamp(), { nil: null }),
    status: primitiveGenerators.messageStatus()
  }) as fc.Arbitrary<Message>,

  // Complete application state
  appState: () => fc.record({
    users: fc.array(generators.user(), { minLength: 0, maxLength: 10 }),
    chats: fc.array(generators.chat(), { minLength: 0, maxLength: 20 }),
    selectedUserId: fc.option(primitiveGenerators.userId(), { nil: null }),
    selectedChatId: fc.option(primitiveGenerators.chatId(), { nil: null }),
    historyByChatId: fc.dictionary(
      primitiveGenerators.chatId(),
      fc.array(generators.message(), { minLength: 0, maxLength: 50 })
    ),
    isSending: primitiveGenerators.boolean(),
    isComposingNewChat: primitiveGenerators.boolean(),
    pendingAssistantByChatId: fc.dictionary(primitiveGenerators.chatId(), primitiveGenerators.messageId()),
    pendingAssistantIntervals: fc.dictionary(primitiveGenerators.messageId(), fc.integer({ min: 1, max: 10000 }))
  }) as fc.Arbitrary<AppState>,

  // DOM configuration generators
  domConfig: () => fc.record({
    id: fc.option(primitiveGenerators.elementId(), { nil: undefined }),
    className: fc.option(primitiveGenerators.className(), { nil: undefined }),
    innerHTML: fc.option(primitiveGenerators.htmlContent(), { nil: undefined }),
    textContent: fc.option(fc.string(), { nil: undefined }),
    style: fc.option(fc.string(), { nil: undefined }),
    dataset: fc.option(fc.dictionary(
      fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9-_]/g, '')).filter(s => s.length > 0),
      fc.string()
    ), { nil: undefined })
  }),

  // API response generators
  apiResponse: () => fc.record({
    status: primitiveGenerators.httpStatus(),
    data: fc.anything(),
    headers: fc.dictionary(fc.string(), fc.string())
  }),

  // Error generators
  apiError: () => fc.record({
    status: primitiveGenerators.errorStatus(),
    message: fc.string({ minLength: 1, maxLength: 200 }),
    name: fc.constant('ApiError')
  }),

  // Stream event generators
  streamEvent: () => fc.record({
    chatId: primitiveGenerators.chatId(),
    delta: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
    done: primitiveGenerators.boolean(),
    answer: fc.option(fc.string({ minLength: 0, maxLength: 1000 }), { nil: undefined }),
    error: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined })
  }) as fc.Arbitrary<StreamEvent>,

  // Chat history response generators
  chatHistoryResponse: () => fc.record({
    role: fc.constantFrom('user', 'assistant', 'system', 'tool'),
    content: primitiveGenerators.messageContent(),
    timestamp: primitiveGenerators.validTimestamp()
  }) as fc.Arbitrary<ChatHistoryResponse>,

  // Ask response generators
  askResponse: () => fc.record({
    chatId: primitiveGenerators.chatId(),
    answer: fc.string({ minLength: 1, maxLength: 1000 })
  }) as fc.Arbitrary<AskResponse>,

  // UI configuration generators
  uiConfig: () => fc.record({
    assistantBaseUrl: fc.option(fc.webUrl(), { nil: undefined })
  }) as fc.Arbitrary<UIConfig>,

  // Theme generators
  theme: () => fc.constantFrom('auto', 'day', 'night') as fc.Arbitrary<Theme>,

  // Render options generators
  renderOptions: () => fc.record({
    placeholder: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined })
  }) as fc.Arbitrary<RenderOptions>,

  // Theme options generators
  themeOptions: () => fc.record({
    skipPersist: fc.option(primitiveGenerators.boolean(), { nil: undefined })
  }) as fc.Arbitrary<ThemeOptions>,

  // Message overrides generators
  messageOverrides: () => fc.record({
    status: fc.option(primitiveGenerators.messageStatus(), { nil: undefined }),
    timestamp: fc.option(fc.oneof(
      primitiveGenerators.validTimestamp(),
      fc.constant(null)
    ), { nil: undefined })
  }) as fc.Arbitrary<MessageOverrides>
};

// Constrained generators for valid data only
export const validGenerators = {
  // Valid user (non-empty, trimmed fields)
  validUser: () => fc.record({
    userId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)
  }) as fc.Arbitrary<User>,

  // Valid message (appropriate content for role) - backward compatibility
  validMessage: () => fc.record({
    id: primitiveGenerators.messageId(),
    role: primitiveGenerators.messageRole(),
    content: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
    timestamp: primitiveGenerators.validTimestamp(),
    status: primitiveGenerators.messageStatus()
  }) as fc.Arbitrary<Message>,

  // Valid message (appropriate content for role)
  validUserMessage: () => fc.record({
    id: primitiveGenerators.messageId(),
    role: fc.constant('user' as MessageRole),
    content: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
    timestamp: primitiveGenerators.validTimestamp(),
    status: fc.constant('complete' as MessageStatus)
  }) as fc.Arbitrary<Message>,

  validAssistantMessage: () => fc.record({
    id: primitiveGenerators.messageId(),
    role: fc.constant('assistant' as MessageRole),
    content: fc.string({ minLength: 1, maxLength: 1000 }),
    timestamp: primitiveGenerators.validTimestamp(),
    status: primitiveGenerators.messageStatus()
  }) as fc.Arbitrary<Message>,

  // Valid chat (non-null title, valid timestamp)
  validChat: () => fc.record({
    chatId: primitiveGenerators.chatId(),
    title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
    createdAt: primitiveGenerators.validTimestamp()
  }) as fc.Arbitrary<Chat>,

  // Valid state with consistent relationships
  validAppState: () => {
    return fc.tuple(
      fc.array(validGenerators.validUser(), { minLength: 1, maxLength: 5 }),
      fc.array(validGenerators.validChat(), { minLength: 0, maxLength: 10 })
    ).chain(([users, chats]) => {
      const userIds = users.map(u => u.userId);
      const chatIds = chats.map(c => c.chatId);
      
      return fc.record({
        users: fc.constant(users),
        chats: fc.constant(chats),
        selectedUserId: fc.option(fc.constantFrom(...userIds), { nil: null }),
        selectedChatId: fc.option(fc.constantFrom(...chatIds), { nil: null }),
        historyByChatId: fc.dictionary(
          fc.constantFrom(...chatIds),
          fc.array(validGenerators.validUserMessage(), { minLength: 0, maxLength: 20 })
        ),
        isSending: primitiveGenerators.boolean(),
        isComposingNewChat: primitiveGenerators.boolean(),
        pendingAssistantByChatId: fc.dictionary(
          fc.constantFrom(...chatIds),
          primitiveGenerators.messageId()
        ),
        pendingAssistantIntervals: fc.dictionary(
          primitiveGenerators.messageId(),
          fc.integer({ min: 1, max: 10000 })
        )
      });
    }) as fc.Arbitrary<AppState>;
  }
};

// Edge case and error condition generators
export const edgeCaseGenerators = {
  // Empty or whitespace strings
  emptyOrWhitespace: () => fc.oneof(
    fc.constant(''),
    fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim() === '')
  ),

  // Null or undefined values
  nullish: () => fc.constantFrom(null, undefined),

  // Very long strings that might cause issues
  longString: () => fc.string({ minLength: 1000, maxLength: 10000 }),

  // Strings with special HTML/XML characters
  specialChars: () => fc.string().filter(s => /[<>&"'`]/.test(s)),

  // Invalid timestamps
  invalidTimestamp: () => fc.oneof(
    fc.constant('invalid-date'),
    fc.constant(''),
    fc.constant('2023-13-45T25:70:80Z'),
    fc.constant('not-a-date'),
    fc.constant('2023-02-30T00:00:00Z') // Invalid date
  ),

  // Malformed JSON strings
  malformedJson: () => fc.oneof(
    fc.constant('{"incomplete": json'),
    fc.constant('{invalid json}'),
    fc.constant('{"missing": "quote}'),
    fc.constant('{"trailing": "comma",}')
  ),

  // Invalid DOM configurations
  invalidDomConfig: () => fc.record({
    id: fc.option(edgeCaseGenerators.emptyOrWhitespace(), { nil: undefined }),
    className: fc.option(edgeCaseGenerators.specialChars(), { nil: undefined }),
    innerHTML: fc.option(edgeCaseGenerators.longString(), { nil: undefined }),
    textContent: fc.option(edgeCaseGenerators.nullish(), { nil: undefined })
  }),

  // Network error conditions
  networkError: () => fc.record({
    name: fc.constantFrom('NetworkError', 'TimeoutError', 'AbortError'),
    message: fc.string({ minLength: 1, maxLength: 100 }),
    code: fc.option(fc.string(), { nil: undefined })
  }),

  // Invalid message data
  invalidMessage: () => fc.record({
    id: fc.option(edgeCaseGenerators.emptyOrWhitespace(), { nil: undefined }),
    role: fc.option(fc.string().filter(s => !['user', 'assistant', 'system', 'tool'].includes(s)), { nil: undefined }),
    content: fc.option(edgeCaseGenerators.nullish(), { nil: undefined }),
    timestamp: fc.option(edgeCaseGenerators.invalidTimestamp(), { nil: undefined }),
    status: fc.option(fc.string().filter(s => !['complete', 'pending', 'streaming'].includes(s)), { nil: undefined })
  })
};

// Utility generators for testing specific scenarios
export const scenarioGenerators = {
  // Empty state scenarios
  emptyState: () => fc.constant({
    users: [],
    chats: [],
    selectedUserId: null,
    selectedChatId: null,
    historyByChatId: {},
    isSending: false,
    isComposingNewChat: false,
    pendingAssistantByChatId: {},
    pendingAssistantIntervals: {}
  } as AppState),

  // Loading state scenarios
  loadingState: () => validGenerators.validAppState().map(state => ({
    ...state,
    isSending: true
  })),

  // Error state scenarios
  errorState: () => validGenerators.validAppState().map(state => ({
    ...state,
    selectedUserId: null,
    selectedChatId: null,
    isSending: false
  })),

  // New chat scenarios
  newChatState: () => validGenerators.validAppState().map(state => ({
    ...state,
    isComposingNewChat: true,
    selectedChatId: null
  }))
};