import { http, HttpResponse } from 'msw';
import type { User, Chat, ChatHistoryResponse, StreamEvent } from '../../src/types.js';

/**
 * Mock API handlers for testing - comprehensive coverage of all endpoints
 */

// Mock data stores for dynamic responses
let mockUsers: User[] = [
  { userId: 'user1', name: 'Alice Johnson' },
  { userId: 'user2', name: 'Bob Smith' },
  { userId: 'user3', name: 'Carol Davis' }
];

let mockChatsByUser: Record<string, Chat[]> = {
  'user1': [
    { chatId: 'chat1', title: 'Dog Adoption Questions', createdAt: '2023-01-01T10:00:00Z' },
    { chatId: 'chat2', title: 'Breed Information', createdAt: '2023-01-02T14:30:00Z' }
  ],
  'user2': [
    { chatId: 'chat3', title: 'Training Tips', createdAt: '2023-01-03T15:20:00Z' }
  ],
  'user3': []
};

let mockMessagesByChat: Record<string, ChatHistoryResponse[]> = {
  'chat1': [
    {
      role: 'user',
      content: 'I\'m looking for a friendly dog for my family.',
      timestamp: '2023-01-01T10:00:00Z'
    },
    {
      role: 'assistant',
      content: 'I\'d be happy to help you find the perfect family dog! What size dog are you looking for?',
      timestamp: '2023-01-01T10:00:30Z'
    }
  ],
  'chat2': [
    {
      role: 'user',
      content: 'What breeds are good with children?',
      timestamp: '2023-01-02T14:30:00Z'
    },
    {
      role: 'assistant',
      content: 'Great question! Breeds like Golden Retrievers, Labradors, and Beagles are known for being excellent with children.',
      timestamp: '2023-01-02T14:30:45Z'
    }
  ],
  'chat3': [
    {
      role: 'user',
      content: 'How do I house train a puppy?',
      timestamp: '2023-01-03T15:20:00Z'
    }
  ]
};

export const apiMocks = {
  // Users API - GET /users
  getUsers: http.get('/users', () => {
    return HttpResponse.json(mockUsers);
  }),

  // Chats API - GET /chats
  getChats: http.get('/chats', ({ request }) => {
    const userId = request.headers.get('X-User-Id');
    
    if (!userId) {
      return new HttpResponse(null, { status: 400 });
    }

    const userChats = mockChatsByUser[userId] || [];
    return HttpResponse.json(userChats);
  }),

  // Chat messages API - GET /chats/:chatId
  getChatMessages: http.get('/chats/:chatId', ({ params, request }) => {
    const { chatId } = params;
    const userId = request.headers.get('X-User-Id');
    
    if (!userId) {
      return new HttpResponse(null, { status: 400 });
    }

    const messages = mockMessagesByChat[chatId as string] || [];
    return HttpResponse.json(messages);
  }),

  // Ask API - GET /ask
  askQuestion: http.get('/ask', ({ request }) => {
    const url = new URL(request.url);
    const question = url.searchParams.get('question');
    const chatId = url.searchParams.get('chatId');
    const userId = request.headers.get('X-User-Id');
    
    if (!userId) {
      return new HttpResponse(null, { status: 400 });
    }

    if (!question) {
      return new HttpResponse(null, { status: 400 });
    }

    return HttpResponse.json({
      answer: `Thank you for your question: "${question}". I'm here to help with dog adoption!`,
      chatId: chatId || `new-chat-${Date.now()}`
    });
  }),

  // Streaming Ask API - GET /ask/stream
  askQuestionStream: http.get('/ask/stream', ({ request }) => {
    const url = new URL(request.url);
    const question = url.searchParams.get('question');
    const chatId = url.searchParams.get('chatId');
    const userId = request.headers.get('X-User-Id');
    
    if (!userId || !question) {
      return new HttpResponse(null, { status: 400 });
    }

    // Create a mock streaming response
    const events: StreamEvent[] = [
      { chatId: chatId || `new-chat-${Date.now()}`, delta: 'Thank ', done: false },
      { chatId: chatId || `new-chat-${Date.now()}`, delta: 'you for ', done: false },
      { chatId: chatId || `new-chat-${Date.now()}`, delta: 'your question!', done: false },
      { 
        chatId: chatId || `new-chat-${Date.now()}`, 
        done: true, 
        answer: `Thank you for your question: "${question}". I'm here to help with dog adoption!`
      }
    ];

    const stream = new ReadableStream({
      start(controller) {
        events.forEach((event, index) => {
          setTimeout(() => {
            controller.enqueue(new TextEncoder().encode(JSON.stringify(event) + '\n'));
            if (event.done) {
              controller.close();
            }
          }, index * 100);
        });
      }
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
      },
    });
  }),

  // Error handlers for testing error conditions
  getUsersError: http.get('/users', () => {
    return new HttpResponse(null, { status: 500 });
  }),

  getChatsError: http.get('/chats', () => {
    return new HttpResponse(null, { status: 500 });
  }),

  getChatMessagesError: http.get('/chats/:chatId', () => {
    return new HttpResponse(null, { status: 500 });
  }),

  askQuestionError: http.get('/ask', () => {
    return new HttpResponse(null, { status: 500 });
  }),

  askQuestionStreamError: http.get('/ask/stream', () => {
    return new HttpResponse(null, { status: 500 });
  }),

  // Network timeout simulation
  getUsersTimeout: http.get('/users', () => {
    return new Promise(() => {}); // Never resolves
  }),

  // Malformed JSON responses
  getUsersMalformed: http.get('/users', () => {
    return new HttpResponse('invalid json{', {
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  getChatsMalformed: http.get('/chats', () => {
    return new HttpResponse('{"incomplete": json', {
      headers: { 'Content-Type': 'application/json' }
    });
  })
};

// Enhanced error simulation handlers
export const errorSimulationHandlers = {
  // Simulate various HTTP error codes
  badRequest: http.get('/users', () => new HttpResponse(null, { status: 400 })),
  unauthorized: http.get('/chats', () => new HttpResponse(null, { status: 401 })),
  forbidden: http.get('/chats/:chatId', () => new HttpResponse(null, { status: 403 })),
  notFound: http.get('/ask', () => new HttpResponse(null, { status: 404 })),
  methodNotAllowed: http.get('/users', () => new HttpResponse(null, { status: 405 })),
  conflict: http.get('/chats', () => new HttpResponse(null, { status: 409 })),
  tooManyRequests: http.get('/ask', () => new HttpResponse(null, { status: 429 })),
  internalServerError: http.get('/users', () => new HttpResponse(null, { status: 500 })),
  badGateway: http.get('/chats', () => new HttpResponse(null, { status: 502 })),
  serviceUnavailable: http.get('/ask', () => new HttpResponse(null, { status: 503 })),
  gatewayTimeout: http.get('/chats/:chatId', () => new HttpResponse(null, { status: 504 })),

  // Simulate network conditions
  slowResponse: http.get('/users', async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    return HttpResponse.json(mockUsers);
  }),

  intermittentFailure: (() => {
    let callCount = 0;
    return http.get('/chats', () => {
      callCount++;
      if (callCount % 3 === 0) {
        return new HttpResponse(null, { status: 500 });
      }
      return HttpResponse.json(mockChatsByUser['user1'] || []);
    });
  })(),

  // Simulate malformed responses
  invalidJson: http.get('/users', () => {
    return new HttpResponse('{"invalid": json syntax}', {
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  emptyResponse: http.get('/chats', () => {
    return new HttpResponse('', {
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  wrongContentType: http.get('/ask', () => {
    return new HttpResponse(JSON.stringify({ answer: 'test' }), {
      headers: { 'Content-Type': 'text/plain' }
    });
  }),

  // Simulate streaming errors
  streamError: http.get('/ask/stream', () => {
    const stream = new ReadableStream({
      start(controller) {
        setTimeout(() => {
          controller.error(new Error('Stream connection lost'));
        }, 100);
      }
    });
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'application/x-ndjson' }
    });
  }),

  partialStream: http.get('/ask/stream', () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"chatId": "test", "delta": "partial", "done": false}\n'));
        setTimeout(() => {
          controller.error(new Error('Connection interrupted'));
        }, 50);
      }
    });
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'application/x-ndjson' }
    });
  })
};

// Utility functions for dynamic mock management
export const mockUtils = {
  // Reset all mock data to defaults
  resetMockData: () => {
    mockUsers = [
      { userId: 'user1', name: 'Alice Johnson' },
      { userId: 'user2', name: 'Bob Smith' },
      { userId: 'user3', name: 'Carol Davis' }
    ];

    mockChatsByUser = {
      'user1': [
        { chatId: 'chat1', title: 'Dog Adoption Questions', createdAt: '2023-01-01T10:00:00Z' },
        { chatId: 'chat2', title: 'Breed Information', createdAt: '2023-01-02T14:30:00Z' }
      ],
      'user2': [
        { chatId: 'chat3', title: 'Training Tips', createdAt: '2023-01-03T15:20:00Z' }
      ],
      'user3': []
    };

    mockMessagesByChat = {
      'chat1': [
        {
          role: 'user',
          content: 'I\'m looking for a friendly dog for my family.',
          timestamp: '2023-01-01T10:00:00Z'
        },
        {
          role: 'assistant',
          content: 'I\'d be happy to help you find the perfect family dog! What size dog are you looking for?',
          timestamp: '2023-01-01T10:00:30Z'
        }
      ],
      'chat2': [
        {
          role: 'user',
          content: 'What breeds are good with children?',
          timestamp: '2023-01-02T14:30:00Z'
        },
        {
          role: 'assistant',
          content: 'Great question! Breeds like Golden Retrievers, Labradors, and Beagles are known for being excellent with children.',
          timestamp: '2023-01-02T14:30:45Z'
        }
      ],
      'chat3': [
        {
          role: 'user',
          content: 'How do I house train a puppy?',
          timestamp: '2023-01-03T15:20:00Z'
        }
      ]
    };
  },

  // Set custom mock data
  setMockUsers: (users: User[]) => {
    mockUsers = users;
  },

  setMockChatsForUser: (userId: string, chats: Chat[]) => {
    mockChatsByUser[userId] = chats;
  },

  setMockMessagesForChat: (chatId: string, messages: ChatHistoryResponse[]) => {
    mockMessagesByChat[chatId] = messages;
  },

  // Get current mock data
  getMockUsers: () => [...mockUsers],
  getMockChatsForUser: (userId: string) => [...(mockChatsByUser[userId] || [])],
  getMockMessagesForChat: (chatId: string) => [...(mockMessagesByChat[chatId] || [])],

  // Advanced mock scenarios
  simulateEmptyState: () => {
    mockUsers = [];
    mockChatsByUser = {};
    mockMessagesByChat = {};
  },

  simulateLargeDataset: () => {
    // Create many users
    mockUsers = Array.from({ length: 100 }, (_, i) => ({
      userId: `user-${i + 1}`,
      name: `User ${i + 1}`
    }));

    // Create many chats for first user
    mockChatsByUser['user-1'] = Array.from({ length: 50 }, (_, i) => ({
      chatId: `chat-${i + 1}`,
      title: `Chat ${i + 1}`,
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    }));

    // Create many messages for first chat
    mockMessagesByChat['chat-1'] = Array.from({ length: 200 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i + 1} content`,
      timestamp: new Date(Date.now() - i * 60000).toISOString()
    }));
  },

  simulateInconsistentData: () => {
    // Create data with missing relationships
    mockUsers = [{ userId: 'user1', name: 'User 1' }];
    mockChatsByUser = {
      'user1': [{ chatId: 'chat1', title: 'Chat 1', createdAt: '2023-01-01T00:00:00Z' }],
      'nonexistent-user': [{ chatId: 'chat2', title: 'Orphaned Chat', createdAt: '2023-01-02T00:00:00Z' }]
    };
    mockMessagesByChat = {
      'chat1': [],
      'nonexistent-chat': [
        { role: 'user', content: 'Orphaned message', timestamp: '2023-01-01T00:00:00Z' }
      ]
    };
  },

  simulateSpecialCharacters: () => {
    mockUsers = [
      { userId: 'user<script>', name: 'User with <script> tags' },
      { userId: 'user"quotes"', name: 'User with "quotes"' },
      { userId: 'user&amp;', name: 'User with &amp; entities' }
    ];
    
    mockChatsByUser['user<script>'] = [
      { 
        chatId: 'chat<>',
        title: 'Chat with <> brackets & "quotes"',
        createdAt: '2023-01-01T00:00:00Z'
      }
    ];

    mockMessagesByChat['chat<>'] = [
      {
        role: 'user',
        content: 'Message with <script>alert("xss")</script> and special chars: ñáéíóú',
        timestamp: '2023-01-01T00:00:00Z'
      }
    ];
  }
};

export const defaultHandlers = [
  apiMocks.getUsers,
  apiMocks.getChats,
  apiMocks.getChatMessages,
  apiMocks.askQuestion,
  apiMocks.askQuestionStream
];

// Export error simulation handlers for testing error conditions
export const errorHandlers = Object.values(errorSimulationHandlers);