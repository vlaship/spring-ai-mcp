import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatService } from '../../src/chat-service.js';
import { stateManager } from '../../src/state.js';
import { ApiError } from '../../src/api.js';
import { DRAFT_CHAT_KEY } from '../../src/constants.js';
import type { User, Chat, ChatHistoryResponse, StreamEvent } from '../../src/types.js';
import { mockUtils } from '../mocks/api-mocks.js';

// Mock the API module
vi.mock('../../src/api.js', async () => {
  const actual = await vi.importActual('../../src/api.js');
  return {
    ...actual,
    fetchUsers: vi.fn(),
    fetchChats: vi.fn(),
    fetchChatHistory: vi.fn(),
    streamAssistantResponse: vi.fn(),
    ApiError: actual.ApiError
  };
});

// Import mocked functions
import { fetchUsers, fetchChats, fetchChatHistory, streamAssistantResponse } from '../../src/api.js';

const mockFetchUsers = vi.mocked(fetchUsers);
const mockFetchChats = vi.mocked(fetchChats);
const mockFetchChatHistory = vi.mocked(fetchChatHistory);
const mockStreamAssistantResponse = vi.mocked(streamAssistantResponse);

describe('ChatService Unit Tests', () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService();
    
    // Reset state manager to clean state
    stateManager.clearAllPendingAnimations();
    stateManager.resetChatState();
    stateManager.setUsers([]);
    stateManager.setChats([]);
    stateManager.setSelectedUserId(null);
    stateManager.setIsSending(false);
    stateManager.setIsComposingNewChat(false);
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset mock data
    mockUtils.resetMockData();
  });

  afterEach(() => {
    stateManager.clearAllPendingAnimations();
  });

  describe('loadUsers()', () => {
    it('should load users and update state manager', async () => {
      const mockUsers: User[] = [
        { userId: 'user1', name: 'Alice Johnson' },
        { userId: 'user2', name: 'Bob Smith' }
      ];
      
      mockFetchUsers.mockResolvedValue(mockUsers);
      
      await chatService.loadUsers();
      
      expect(mockFetchUsers).toHaveBeenCalledOnce();
      
      const state = stateManager.getState();
      expect(state.users).toEqual(mockUsers);
    });

    it('should handle empty users array', async () => {
      mockFetchUsers.mockResolvedValue([]);
      
      await chatService.loadUsers();
      
      const state = stateManager.getState();
      expect(state.users).toEqual([]);
    });

    it('should throw error when API call fails', async () => {
      const apiError = new ApiError('Failed to fetch users', 500);
      mockFetchUsers.mockRejectedValue(apiError);
      
      await expect(chatService.loadUsers()).rejects.toThrow('Failed to fetch users');
      expect(mockFetchUsers).toHaveBeenCalledOnce();
    });

    it('should log error and rethrow when API call fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const networkError = new Error('Network error');
      mockFetchUsers.mockRejectedValue(networkError);
      
      await expect(chatService.loadUsers()).rejects.toThrow('Network error');
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load users:', networkError);
      consoleSpy.mockRestore();
    });
  });

  describe('loadChats()', () => {
    it('should load chats for specified user and update state', async () => {
      const userId = 'user1';
      const mockChats: Chat[] = [
        { chatId: 'chat1', title: 'Dog Questions', createdAt: '2023-01-01T10:00:00Z' },
        { chatId: 'chat2', title: 'Breed Info', createdAt: '2023-01-02T14:30:00Z' }
      ];
      
      mockFetchChats.mockResolvedValue(mockChats);
      
      await chatService.loadChats(userId);
      
      expect(mockFetchChats).toHaveBeenCalledWith(userId);
      
      const state = stateManager.getState();
      expect(state.chats).toEqual(mockChats);
    });

    it('should handle empty chats array', async () => {
      mockFetchChats.mockResolvedValue([]);
      
      await chatService.loadChats('user1');
      
      const state = stateManager.getState();
      expect(state.chats).toEqual([]);
    });

    it('should throw error when API call fails', async () => {
      const apiError = new ApiError('Failed to fetch chats', 404);
      mockFetchChats.mockRejectedValue(apiError);
      
      await expect(chatService.loadChats('user1')).rejects.toThrow('Failed to fetch chats');
      expect(mockFetchChats).toHaveBeenCalledWith('user1');
    });

    it('should log error and rethrow when API call fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const networkError = new Error('Network timeout');
      mockFetchChats.mockRejectedValue(networkError);
      
      await expect(chatService.loadChats('user1')).rejects.toThrow('Network timeout');
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load chats:', networkError);
      consoleSpy.mockRestore();
    });
  });

  describe('loadChatHistory()', () => {
    it('should load chat history and convert to messages', async () => {
      const chatId = 'chat1';
      const userId = 'user1';
      const mockHistory: ChatHistoryResponse[] = [
        {
          role: 'user',
          content: 'Hello, I need help with dog adoption.',
          timestamp: '2023-01-01T10:00:00Z'
        },
        {
          role: 'assistant',
          content: 'I\'d be happy to help you find the perfect dog!',
          timestamp: '2023-01-01T10:00:30Z'
        }
      ];
      
      mockFetchChatHistory.mockResolvedValue(mockHistory);
      
      await chatService.loadChatHistory(chatId, userId);
      
      expect(mockFetchChatHistory).toHaveBeenCalledWith(chatId, userId);
      
      const history = stateManager.getHistory(chatId);
      expect(history).toHaveLength(2);
      
      expect(history[0]).toMatchObject({
        id: `${chatId}-0`,
        role: 'user',
        content: 'Hello, I need help with dog adoption.',
        timestamp: '2023-01-01T10:00:00Z',
        status: 'complete'
      });
      
      expect(history[1]).toMatchObject({
        id: `${chatId}-1`,
        role: 'assistant',
        content: 'I\'d be happy to help you find the perfect dog!',
        timestamp: '2023-01-01T10:00:30Z',
        status: 'complete'
      });
    });

    it('should handle empty chat history', async () => {
      mockFetchChatHistory.mockResolvedValue([]);
      
      await chatService.loadChatHistory('chat1', 'user1');
      
      const history = stateManager.getHistory('chat1');
      expect(history).toEqual([]);
    });

    it('should normalize message roles correctly', async () => {
      const mockHistory: ChatHistoryResponse[] = [
        { role: 'ASSISTANT', content: 'Test', timestamp: '2023-01-01T10:00:00Z' },
        { role: 'USER', content: 'Test', timestamp: '2023-01-01T10:01:00Z' }
      ];
      
      mockFetchChatHistory.mockResolvedValue(mockHistory);
      
      await chatService.loadChatHistory('chat1', 'user1');
      
      const history = stateManager.getHistory('chat1');
      expect(history[0].role).toBe('assistant');
      expect(history[1].role).toBe('user');
    });

    it('should throw error when API call fails', async () => {
      const apiError = new ApiError('Chat not found', 404);
      mockFetchChatHistory.mockRejectedValue(apiError);
      
      await expect(chatService.loadChatHistory('chat1', 'user1')).rejects.toThrow('Chat not found');
      expect(mockFetchChatHistory).toHaveBeenCalledWith('chat1', 'user1');
    });

    it('should log error and rethrow when API call fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const networkError = new Error('Connection failed');
      mockFetchChatHistory.mockRejectedValue(networkError);
      
      await expect(chatService.loadChatHistory('chat1', 'user1')).rejects.toThrow('Connection failed');
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load chat history:', networkError);
      consoleSpy.mockRestore();
    });
  });

  describe('sendMessage()', () => {
    beforeEach(() => {
      // Set up required state for sending messages
      stateManager.setSelectedUserId('user1');
      stateManager.setSelectedChatId('chat1');
    });

    it('should send message and handle streaming response', async () => {
      const question = 'What breeds are good for families?';
      const mockEvents: StreamEvent[] = [
        { chatId: 'chat1', delta: 'Great ', done: false },
        { chatId: 'chat1', delta: 'question! ', done: false },
        { chatId: 'chat1', done: true, answer: 'Great question! Golden Retrievers are excellent family dogs.' }
      ];
      
      // Mock the async generator
      mockStreamAssistantResponse.mockImplementation(async function* () {
        for (const event of mockEvents) {
          yield event;
        }
      });
      
      const onDelta = vi.fn();
      const onComplete = vi.fn();
      
      await chatService.sendMessage(question, onDelta, onComplete);
      
      expect(mockStreamAssistantResponse).toHaveBeenCalledWith({
        question,
        userId: 'user1',
        chatId: 'chat1'
      });
      
      expect(onDelta).toHaveBeenCalledWith('Great ');
      expect(onDelta).toHaveBeenCalledWith('Great question! ');
      expect(onComplete).toHaveBeenCalledWith('chat1', 'Great question! Golden Retrievers are excellent family dogs.');
      
      const state = stateManager.getState();
      expect(state.isSending).toBe(false);
    });

    it('should handle new chat creation during streaming', async () => {
      stateManager.setSelectedChatId(null);
      stateManager.setIsComposingNewChat(true);
      
      const question = 'Start new chat';
      const newChatId = 'new-chat-123';
      const mockEvents: StreamEvent[] = [
        { chatId: newChatId, delta: 'Hello! ', done: false },
        { chatId: newChatId, done: true, answer: 'Hello! How can I help you today?' }
      ];
      
      mockStreamAssistantResponse.mockImplementation(async function* () {
        for (const event of mockEvents) {
          yield event;
        }
      });
      
      const onComplete = vi.fn();
      
      await chatService.sendMessage(question, undefined, onComplete);
      
      expect(mockStreamAssistantResponse).toHaveBeenCalledWith({
        question,
        userId: 'user1'
      });
      
      expect(onComplete).toHaveBeenCalledWith(newChatId, 'Hello! How can I help you today?');
    });

    it('should throw error when no user is selected', async () => {
      stateManager.setSelectedUserId(null);
      
      await expect(chatService.sendMessage('test question')).rejects.toThrow('No user selected');
      
      expect(mockStreamAssistantResponse).not.toHaveBeenCalled();
    });

    it('should handle API errors during streaming', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const apiError = new ApiError('Server error');
      
      mockStreamAssistantResponse.mockImplementation(async function* () {
        throw apiError;
      });
      
      await expect(chatService.sendMessage('test question')).rejects.toThrow('Server error');
      
      expect(consoleSpy).toHaveBeenCalledWith('Stream error:', apiError);
      
      const state = stateManager.getState();
      expect(state.isSending).toBe(false);
      
      consoleSpy.mockRestore();
    });

    it('should handle non-API errors during streaming', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const genericError = new Error('Network timeout');
      
      mockStreamAssistantResponse.mockImplementation(async function* () {
        throw genericError;
      });
      
      await expect(chatService.sendMessage('test question')).rejects.toThrow('Network timeout');
      
      expect(consoleSpy).toHaveBeenCalledWith('Stream error:', genericError);
      
      const state = stateManager.getState();
      expect(state.isSending).toBe(false);
      
      // Check that the error message uses the generic fallback
      const history = stateManager.getHistory();
      const errorMessage = history.find(msg => msg.role === 'system' && msg.content.includes('Failed to send message'));
      expect(errorMessage).toBeDefined();
      expect(errorMessage?.content).toBe('Failed to send message: Failed to send message');
      
      consoleSpy.mockRestore();
    });

    it('should handle stream events with errors', async () => {
      const mockEvents: StreamEvent[] = [
        { chatId: 'chat1', error: 'Stream processing error', done: false }
      ];
      
      mockStreamAssistantResponse.mockImplementation(async function* () {
        for (const event of mockEvents) {
          yield event;
        }
      });
      
      await expect(chatService.sendMessage('test question')).rejects.toThrow('Stream processing error');
      
      const state = stateManager.getState();
      expect(state.isSending).toBe(false);
    });

    it('should add error message to history when stream fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const networkError = new Error('Network connection lost');
      
      mockStreamAssistantResponse.mockImplementation(async function* () {
        throw networkError;
      });
      
      await expect(chatService.sendMessage('test question')).rejects.toThrow('Network connection lost');
      
      const history = stateManager.getHistory('chat1');
      const errorMessage = history.find(msg => msg.role === 'system');
      expect(errorMessage?.content).toContain('Failed to send message: Failed to send message');
      
      consoleSpy.mockRestore();
    });

    it('should handle empty delta values gracefully', async () => {
      const mockEvents: StreamEvent[] = [
        { chatId: 'chat1', delta: '', done: false },
        { chatId: 'chat1', delta: 'Hello', done: false },
        { chatId: 'chat1', done: true, answer: 'Hello' }
      ];
      
      mockStreamAssistantResponse.mockImplementation(async function* () {
        for (const event of mockEvents) {
          yield event;
        }
      });
      
      const onDelta = vi.fn();
      
      await chatService.sendMessage('test', onDelta);
      
      // onDelta is called for each delta event (empty string and 'Hello')
      expect(onDelta).toHaveBeenCalledTimes(2);
      expect(onDelta).toHaveBeenNthCalledWith(1, ''); // First call with empty aggregated answer
      expect(onDelta).toHaveBeenNthCalledWith(2, 'Hello'); // Second call with 'Hello'
    });

    it('should handle various answer and chatId combinations in completion', async () => {
      // Test case 1: No answer, use aggregatedAnswer
      stateManager.setSelectedUserId('user1');
      stateManager.resetChatState();
      
      const mockEvents1: StreamEvent[] = [
        { delta: 'Hello', done: false },
        { delta: ' world', done: false },
        { done: true } // No answer field, should use aggregatedAnswer
      ];
      
      mockStreamAssistantResponse.mockImplementation(async function* () {
        for (const event of mockEvents1) {
          yield event;
        }
      });
      
      await chatService.sendMessage('test question 1');
      
      let history = stateManager.getHistory();
      let assistantMessage = history.find(msg => msg.role === 'assistant');
      expect(assistantMessage?.content).toBe('Hello world');
      
      // Test case 2: Empty answer and empty aggregatedAnswer, use fallback
      stateManager.resetChatState();
      
      const mockEvents2: StreamEvent[] = [
        { answer: '', done: true } // Empty answer, no deltas
      ];
      
      mockStreamAssistantResponse.mockImplementation(async function* () {
        for (const event of mockEvents2) {
          yield event;
        }
      });
      
      await chatService.sendMessage('test question 2');
      
      history = stateManager.getHistory();
      assistantMessage = history.find(msg => msg.role === 'assistant');
      expect(assistantMessage?.content).toBe('');
      
      // Test case 3: chatId provided in stream vs using selectedChatId
      stateManager.resetChatState();
      stateManager.setSelectedChatId('selected-chat');
      
      const mockEvents3: StreamEvent[] = [
        { chatId: 'stream-chat', answer: 'Response with chatId', done: true }
      ];
      
      mockStreamAssistantResponse.mockImplementation(async function* () {
        for (const event of mockEvents3) {
          yield event;
        }
      });
      
      const onComplete = vi.fn();
      await chatService.sendMessage('test question 3', undefined, onComplete);
      
      // Should use chatId from stream, not selectedChatId
      expect(onComplete).toHaveBeenCalledWith('stream-chat', 'Response with chatId');
    });

    it('should set isSending state correctly during operation', async () => {
      const mockEvents: StreamEvent[] = [
        { chatId: 'chat1', done: true, answer: 'Response' }
      ];
      
      let isSendingDuringStream = false;
      
      mockStreamAssistantResponse.mockImplementation(async function* () {
        isSendingDuringStream = stateManager.getState().isSending;
        for (const event of mockEvents) {
          yield event;
        }
      });
      
      await chatService.sendMessage('test');
      
      expect(isSendingDuringStream).toBe(true);
      expect(stateManager.getState().isSending).toBe(false);
    });
  });

  describe('beginNewChatSession()', () => {
    it('should initialize new chat session when user is selected', () => {
      stateManager.setSelectedUserId('user1');
      stateManager.setSelectedChatId('existing-chat');
      stateManager.setIsComposingNewChat(false);
      
      chatService.beginNewChatSession();
      
      const state = stateManager.getState();
      expect(state.selectedChatId).toBeNull();
      expect(state.isComposingNewChat).toBe(true);
      
      const draftHistory = stateManager.getHistory(DRAFT_CHAT_KEY);
      expect(draftHistory).toEqual([]);
    });

    it('should do nothing when no user is selected', () => {
      stateManager.setSelectedUserId(null);
      stateManager.setSelectedChatId('existing-chat');
      stateManager.setIsComposingNewChat(false);
      
      chatService.beginNewChatSession();
      
      const state = stateManager.getState();
      expect(state.selectedChatId).toBe('existing-chat');
      expect(state.isComposingNewChat).toBe(false);
    });

    it('should clean up pending assistant placeholder', () => {
      stateManager.setSelectedUserId('user1');
      
      // Add a pending assistant to draft chat
      const placeholder = stateManager.addAssistantPlaceholder(DRAFT_CHAT_KEY);
      stateManager.startPendingAnimation(placeholder.id, 12345);
      
      chatService.beginNewChatSession();
      
      const state = stateManager.getState();
      expect(state.pendingAssistantByChatId[DRAFT_CHAT_KEY]).toBeUndefined();
      
      const draftHistory = stateManager.getHistory(DRAFT_CHAT_KEY);
      expect(draftHistory).toEqual([]);
    });
  });

  describe('selectExistingChat()', () => {
    beforeEach(() => {
      stateManager.setSelectedUserId('user1');
    });

    it('should select existing chat and load history if not cached', async () => {
      const chatId = 'chat1';
      const mockHistory: ChatHistoryResponse[] = [
        { role: 'user', content: 'Hello', timestamp: '2023-01-01T10:00:00Z' }
      ];
      
      mockFetchChatHistory.mockResolvedValue(mockHistory);
      
      await chatService.selectExistingChat(chatId);
      
      const state = stateManager.getState();
      expect(state.selectedChatId).toBe(chatId);
      expect(state.isComposingNewChat).toBe(false);
      
      expect(mockFetchChatHistory).toHaveBeenCalledWith(chatId, 'user1');
      
      const history = stateManager.getHistory(chatId);
      expect(history).toHaveLength(1);
    });

    it('should select existing chat without loading if history is cached', async () => {
      const chatId = 'chat1';
      
      // Pre-populate history
      stateManager.addMessageToHistory('user', 'Cached message', chatId);
      
      await chatService.selectExistingChat(chatId);
      
      const state = stateManager.getState();
      expect(state.selectedChatId).toBe(chatId);
      expect(state.isComposingNewChat).toBe(false);
      
      expect(mockFetchChatHistory).not.toHaveBeenCalled();
      
      const history = stateManager.getHistory(chatId);
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('Cached message');
    });

    it('should throw error when no user is selected', async () => {
      stateManager.setSelectedUserId(null);
      
      await expect(chatService.selectExistingChat('chat1')).rejects.toThrow('No user selected');
      
      expect(mockFetchChatHistory).not.toHaveBeenCalled();
    });

    it('should handle API errors when loading chat history', async () => {
      const apiError = new ApiError('Chat not found', 404);
      mockFetchChatHistory.mockRejectedValue(apiError);
      
      await expect(chatService.selectExistingChat('chat1')).rejects.toThrow('Chat not found');
      
      expect(mockFetchChatHistory).toHaveBeenCalledWith('chat1', 'user1');
    });
  });

  describe('canSendMessages()', () => {
    it('should return true when user is selected and chat is selected', () => {
      stateManager.setSelectedUserId('user1');
      stateManager.setSelectedChatId('chat1');
      stateManager.setIsComposingNewChat(false);
      
      expect(chatService.canSendMessages()).toBe(true);
    });

    it('should return true when user is selected and composing new chat', () => {
      stateManager.setSelectedUserId('user1');
      stateManager.setSelectedChatId(null);
      stateManager.setIsComposingNewChat(true);
      
      expect(chatService.canSendMessages()).toBe(true);
    });

    it('should return false when no user is selected', () => {
      stateManager.setSelectedUserId(null);
      stateManager.setSelectedChatId('chat1');
      stateManager.setIsComposingNewChat(false);
      
      expect(chatService.canSendMessages()).toBe(false);
    });

    it('should return false when user is selected but no chat context', () => {
      stateManager.setSelectedUserId('user1');
      stateManager.setSelectedChatId(null);
      stateManager.setIsComposingNewChat(false);
      
      expect(chatService.canSendMessages()).toBe(false);
    });
  });

  describe('refreshActiveChatMetadata()', () => {
    it('should refresh chats when user and chat are selected', async () => {
      stateManager.setSelectedUserId('user1');
      stateManager.setSelectedChatId('chat1');
      
      const mockChats: Chat[] = [
        { chatId: 'chat1', title: 'Updated Title', createdAt: '2023-01-01T10:00:00Z' }
      ];
      
      mockFetchChats.mockResolvedValue(mockChats);
      
      await chatService.refreshActiveChatMetadata();
      
      expect(mockFetchChats).toHaveBeenCalledWith('user1');
      
      const state = stateManager.getState();
      expect(state.chats).toEqual(mockChats);
    });

    it('should do nothing when no user is selected', async () => {
      stateManager.setSelectedUserId(null);
      stateManager.setSelectedChatId('chat1');
      
      await chatService.refreshActiveChatMetadata();
      
      expect(mockFetchChats).not.toHaveBeenCalled();
    });

    it('should do nothing when no chat is selected', async () => {
      stateManager.setSelectedUserId('user1');
      stateManager.setSelectedChatId(null);
      
      await chatService.refreshActiveChatMetadata();
      
      expect(mockFetchChats).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      stateManager.setSelectedUserId('user1');
      stateManager.setSelectedChatId('chat1');
      
      const apiError = new ApiError('Server error', 500);
      mockFetchChats.mockRejectedValue(apiError);
      
      await chatService.refreshActiveChatMetadata();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to refresh chat metadata:', apiError);
      
      consoleSpy.mockRestore();
    });
  });

  describe('State management integration', () => {
    it('should properly manage state during complete message workflow', async () => {
      // Setup initial state
      stateManager.setSelectedUserId('user1');
      stateManager.setSelectedChatId(null);
      stateManager.setIsComposingNewChat(true);
      
      const question = 'Hello, I need help';
      const newChatId = 'new-chat-123';
      const mockEvents: StreamEvent[] = [
        { chatId: newChatId, delta: 'Hi! ', done: false },
        { chatId: newChatId, done: true, answer: 'Hi! How can I help you?' }
      ];
      
      mockStreamAssistantResponse.mockImplementation(async function* () {
        for (const event of mockEvents) {
          yield event;
        }
      });
      
      await chatService.sendMessage(question);
      
      // Verify final state
      const state = stateManager.getState();
      expect(state.selectedChatId).toBe(newChatId);
      expect(state.isComposingNewChat).toBe(false);
      expect(state.isSending).toBe(false);
      
      const history = stateManager.getHistory(newChatId);
      expect(history).toHaveLength(2); // User message + assistant response
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe(question);
      expect(history[1].role).toBe('assistant');
      expect(history[1].content).toBe('Hi! How can I help you?');
    });

    it('should handle state cleanup on errors', async () => {
      stateManager.setSelectedUserId('user1');
      stateManager.setSelectedChatId('chat1');
      
      const networkError = new Error('Connection lost');
      mockStreamAssistantResponse.mockImplementation(async function* () {
        throw networkError;
      });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await expect(chatService.sendMessage('test')).rejects.toThrow('Connection lost');
      
      // Verify state is properly cleaned up
      const state = stateManager.getState();
      expect(state.isSending).toBe(false);
      expect(state.pendingAssistantByChatId['chat1']).toBeUndefined();
      
      consoleSpy.mockRestore();
    });
  });
});