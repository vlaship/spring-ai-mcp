import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { stateManager } from '../../src/state.js';
import { DRAFT_CHAT_KEY } from '../../src/constants.js';
import type { AppState, User, Chat, Message, MessageRole } from '../../src/types.js';

describe('StateManager Unit Tests', () => {
  let initialState: AppState;

  beforeEach(() => {
    // Capture initial state to restore after each test
    initialState = stateManager.getState();
    
    // Reset to clean state
    stateManager.clearAllPendingAnimations();
    stateManager.resetChatState();
    stateManager.setUsers([]);
    stateManager.setChats([]);
    stateManager.setSelectedUserId(null);
    stateManager.setIsSending(false);
    stateManager.setIsComposingNewChat(false);
  });

  afterEach(() => {
    // Clean up any pending animations
    stateManager.clearAllPendingAnimations();
  });

  describe('getState()', () => {
    it('should return the current state', () => {
      const state = stateManager.getState();
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('object');
      expect(state).toHaveProperty('users');
      expect(state).toHaveProperty('chats');
      expect(state).toHaveProperty('selectedUserId');
      expect(state).toHaveProperty('selectedChatId');
      expect(state).toHaveProperty('historyByChatId');
      expect(state).toHaveProperty('isSending');
      expect(state).toHaveProperty('isComposingNewChat');
      expect(state).toHaveProperty('pendingAssistantByChatId');
      expect(state).toHaveProperty('pendingAssistantIntervals');
    });

    it('should return a readonly state object', () => {
      const state = stateManager.getState();
      
      // The returned state should be readonly (TypeScript enforces this)
      expect(Array.isArray(state.users)).toBe(true);
      expect(Array.isArray(state.chats)).toBe(true);
    });
  });

  describe('setUsers()', () => {
    it('should set users array', () => {
      const users: User[] = [
        { userId: 'user1', name: 'John Doe' },
        { userId: 'user2', name: 'Jane Smith' }
      ];

      stateManager.setUsers(users);
      const state = stateManager.getState();

      expect(state.users).toEqual(users);
      expect(state.users).toHaveLength(2);
    });

    it('should accept empty users array', () => {
      stateManager.setUsers([]);
      const state = stateManager.getState();

      expect(state.users).toEqual([]);
      expect(state.users).toHaveLength(0);
    });

    it('should throw error for non-array input', () => {
      expect(() => stateManager.setUsers(null as any)).toThrow('Invalid state update: users must be an array');
      expect(() => stateManager.setUsers('invalid' as any)).toThrow('Invalid state update: users must be an array');
      expect(() => stateManager.setUsers(123 as any)).toThrow('Invalid state update: users must be an array');
    });

    it('should throw error for invalid user objects', () => {
      expect(() => stateManager.setUsers([null] as any)).toThrow('Invalid state update: each user must be an object');
      expect(() => stateManager.setUsers(['invalid'] as any)).toThrow('Invalid state update: each user must be an object');
      expect(() => stateManager.setUsers([{ userId: 123 }] as any)).toThrow('Invalid state update: user.userId must be a string');
      expect(() => stateManager.setUsers([{ userId: 'valid', name: 123 }] as any)).toThrow('Invalid state update: user.name must be a string');
    });
  });

  describe('setChats()', () => {
    it('should set chats array', () => {
      const chats: Chat[] = [
        { chatId: 'chat1', title: 'Chat 1', createdAt: '2023-01-01T00:00:00Z' },
        { chatId: 'chat2', title: null, createdAt: '2023-01-02T00:00:00Z' }
      ];

      stateManager.setChats(chats);
      const state = stateManager.getState();

      expect(state.chats).toEqual(chats);
      expect(state.chats).toHaveLength(2);
    });

    it('should accept empty chats array', () => {
      stateManager.setChats([]);
      const state = stateManager.getState();

      expect(state.chats).toEqual([]);
      expect(state.chats).toHaveLength(0);
    });

    it('should throw error for non-array input', () => {
      expect(() => stateManager.setChats(null as any)).toThrow('Invalid state update: chats must be an array');
      expect(() => stateManager.setChats('invalid' as any)).toThrow('Invalid state update: chats must be an array');
    });

    it('should throw error for invalid chat objects', () => {
      expect(() => stateManager.setChats([null] as any)).toThrow('Invalid state update: each chat must be an object');
      expect(() => stateManager.setChats([{ chatId: 123 }] as any)).toThrow('Invalid state update: chat.chatId must be a string');
      expect(() => stateManager.setChats([{ chatId: 'valid', title: 123 }] as any)).toThrow('Invalid state update: chat.title must be a string or null');
      expect(() => stateManager.setChats([{ chatId: 'valid', title: null, createdAt: 123 }] as any)).toThrow('Invalid state update: chat.createdAt must be a string');
    });
  });

  describe('setSelectedUserId()', () => {
    it('should set selected user ID', () => {
      stateManager.setSelectedUserId('user123');
      const state = stateManager.getState();

      expect(state.selectedUserId).toBe('user123');
    });

    it('should accept null value', () => {
      stateManager.setSelectedUserId(null);
      const state = stateManager.getState();

      expect(state.selectedUserId).toBeNull();
    });

    it('should throw error for invalid input', () => {
      expect(() => stateManager.setSelectedUserId(123 as any)).toThrow('Invalid state update: selectedUserId must be a string or null');
      expect(() => stateManager.setSelectedUserId([] as any)).toThrow('Invalid state update: selectedUserId must be a string or null');
    });
  });

  describe('setSelectedChatId()', () => {
    it('should set selected chat ID', () => {
      stateManager.setSelectedChatId('chat123');
      const state = stateManager.getState();

      expect(state.selectedChatId).toBe('chat123');
    });

    it('should accept null value', () => {
      stateManager.setSelectedChatId(null);
      const state = stateManager.getState();

      expect(state.selectedChatId).toBeNull();
    });

    it('should throw error for invalid input', () => {
      expect(() => stateManager.setSelectedChatId(123 as any)).toThrow('Invalid state update: selectedChatId must be a string or null');
      expect(() => stateManager.setSelectedChatId([] as any)).toThrow('Invalid state update: selectedChatId must be a string or null');
    });
  });

  describe('setIsSending()', () => {
    it('should set isSending to true', () => {
      stateManager.setIsSending(true);
      const state = stateManager.getState();

      expect(state.isSending).toBe(true);
    });

    it('should set isSending to false', () => {
      stateManager.setIsSending(false);
      const state = stateManager.getState();

      expect(state.isSending).toBe(false);
    });

    it('should throw error for non-boolean input', () => {
      expect(() => stateManager.setIsSending('true' as any)).toThrow('Invalid state update: isSending must be a boolean');
      expect(() => stateManager.setIsSending(1 as any)).toThrow('Invalid state update: isSending must be a boolean');
      expect(() => stateManager.setIsSending(null as any)).toThrow('Invalid state update: isSending must be a boolean');
    });
  });

  describe('setIsComposingNewChat()', () => {
    it('should set isComposingNewChat to true', () => {
      stateManager.setIsComposingNewChat(true);
      const state = stateManager.getState();

      expect(state.isComposingNewChat).toBe(true);
    });

    it('should set isComposingNewChat to false', () => {
      stateManager.setIsComposingNewChat(false);
      const state = stateManager.getState();

      expect(state.isComposingNewChat).toBe(false);
    });

    it('should throw error for non-boolean input', () => {
      expect(() => stateManager.setIsComposingNewChat('false' as any)).toThrow('Invalid state update: isComposingNewChat must be a boolean');
      expect(() => stateManager.setIsComposingNewChat(0 as any)).toThrow('Invalid state update: isComposingNewChat must be a boolean');
    });
  });

  describe('resetChatState()', () => {
    it('should reset chat-related state', () => {
      // Set up some state first
      stateManager.setSelectedChatId('chat123');
      stateManager.setIsComposingNewChat(false);
      stateManager.addMessageToHistory('user', 'Hello', 'chat123');

      stateManager.resetChatState();
      const state = stateManager.getState();

      expect(state.historyByChatId).toEqual({ [DRAFT_CHAT_KEY]: [] });
      expect(state.selectedChatId).toBeNull();
      expect(state.isComposingNewChat).toBe(true);
      expect(state.pendingAssistantByChatId).toEqual({});
      expect(state.pendingAssistantIntervals).toEqual({});
    });

    it('should initialize draft history', () => {
      stateManager.resetChatState();
      const state = stateManager.getState();

      expect(state.historyByChatId[DRAFT_CHAT_KEY]).toEqual([]);
    });
  });

  describe('getHistory()', () => {
    it('should return history for specified chat key', () => {
      stateManager.addMessageToHistory('user', 'Hello', 'chat123');
      
      const history = stateManager.getHistory('chat123');
      
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('Hello');
      expect(history[0].role).toBe('user');
    });

    it('should return empty array for non-existent chat', () => {
      const history = stateManager.getHistory('nonexistent');
      
      expect(history).toEqual([]);
    });

    it('should use active history key when no key provided', () => {
      stateManager.setSelectedChatId('active-chat');
      stateManager.addMessageToHistory('user', 'Active message', 'active-chat');
      
      const history = stateManager.getHistory();
      
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('Active message');
    });

    it('should create empty history array if not exists', () => {
      const history = stateManager.getHistory('new-chat');
      
      expect(history).toEqual([]);
      expect(stateManager.getState().historyByChatId['new-chat']).toEqual([]);
    });
  });

  describe('getActiveHistoryKey()', () => {
    it('should return selected chat ID when set', () => {
      stateManager.setSelectedChatId('chat123');
      
      const key = stateManager.getActiveHistoryKey();
      
      expect(key).toBe('chat123');
    });

    it('should return DRAFT_CHAT_KEY when no chat selected', () => {
      stateManager.setSelectedChatId(null);
      
      const key = stateManager.getActiveHistoryKey();
      
      expect(key).toBe(DRAFT_CHAT_KEY);
    });
  });

  describe('addMessageToHistory()', () => {
    it('should add message with default values', () => {
      const message = stateManager.addMessageToHistory('user', 'Hello world', 'chat123');
      
      expect(message.id).toBeDefined();
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello world');
      expect(message.status).toBe('complete');
      expect(message.timestamp).toBeDefined();
      
      const history = stateManager.getHistory('chat123');
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(message);
    });

    it('should add message with custom overrides', () => {
      const message = stateManager.addMessageToHistory('assistant', 'Response', 'chat123', {
        status: 'pending',
        timestamp: '2023-01-01T00:00:00Z'
      });
      
      expect(message.status).toBe('pending');
      expect(message.timestamp).toBe('2023-01-01T00:00:00Z');
    });

    it('should handle null timestamp override', () => {
      const message = stateManager.addMessageToHistory('user', 'Test', 'chat123', {
        timestamp: null
      });
      
      expect(message.timestamp).toBeNull();
    });

    it('should generate unique message IDs', () => {
      const message1 = stateManager.addMessageToHistory('user', 'First', 'chat123');
      const message2 = stateManager.addMessageToHistory('user', 'Second', 'chat123');
      
      expect(message1.id).not.toBe(message2.id);
    });
  });
  describe('addAssistantPlaceholder()', () => {
    it('should add assistant placeholder message', () => {
      const placeholder = stateManager.addAssistantPlaceholder('chat123');
      
      expect(placeholder.role).toBe('assistant');
      expect(placeholder.content).toBe('');
      expect(placeholder.status).toBe('pending');
      expect(placeholder.timestamp).toBeNull();
      
      const state = stateManager.getState();
      expect(state.pendingAssistantByChatId['chat123']).toBe(placeholder.id);
      
      const history = stateManager.getHistory('chat123');
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(placeholder);
    });

    it('should track pending assistant by chat ID', () => {
      const placeholder = stateManager.addAssistantPlaceholder('chat123');
      const state = stateManager.getState();
      
      expect(state.pendingAssistantByChatId['chat123']).toBe(placeholder.id);
    });
  });

  describe('updateAssistantPlaceholderContent()', () => {
    it('should update placeholder content and status', () => {
      const placeholder = stateManager.addAssistantPlaceholder('chat123');
      
      stateManager.updateAssistantPlaceholderContent('chat123', 'Partial response');
      
      const history = stateManager.getHistory('chat123');
      const updated = history.find(m => m.id === placeholder.id);
      
      expect(updated?.content).toBe('Partial response');
      expect(updated?.status).toBe('streaming');
    });

    it('should do nothing if no pending assistant exists', () => {
      stateManager.updateAssistantPlaceholderContent('nonexistent', 'Content');
      
      // Should not throw or create any messages
      const history = stateManager.getHistory('nonexistent');
      expect(history).toHaveLength(0);
    });

    it('should do nothing if message not found in history', () => {
      // Create placeholder but remove from history manually
      const placeholder = stateManager.addAssistantPlaceholder('chat123');
      const state = stateManager.getState();
      state.historyByChatId['chat123'] = []; // Clear history but keep pending reference
      
      stateManager.updateAssistantPlaceholderContent('chat123', 'Content');
      
      // Should not throw
      const history = stateManager.getHistory('chat123');
      expect(history).toHaveLength(0);
    });

    it('should handle empty content gracefully', () => {
      const placeholder = stateManager.addAssistantPlaceholder('chat123');
      
      stateManager.updateAssistantPlaceholderContent('chat123', '');
      
      const history = stateManager.getHistory('chat123');
      const updated = history.find(m => m.id === placeholder.id);
      
      expect(updated?.content).toBe('');
      expect(updated?.status).toBe('streaming'); // Status changes to streaming when updateAssistantPlaceholderContent is called
    });
  });

  describe('resolveAssistantPlaceholder()', () => {
    it('should resolve placeholder with final content', () => {
      const placeholder = stateManager.addAssistantPlaceholder('chat123');
      
      const result = stateManager.resolveAssistantPlaceholder('chat123', 'Final answer');
      
      expect(result).toBe(true);
      
      const history = stateManager.getHistory('chat123');
      const resolved = history.find(m => m.id === placeholder.id);
      
      expect(resolved?.content).toBe('Final answer');
      expect(resolved?.status).toBe('complete');
      expect(resolved?.timestamp).toBeDefined();
      expect(resolved?.timestamp).not.toBeNull();
      
      const state = stateManager.getState();
      expect(state.pendingAssistantByChatId['chat123']).toBeUndefined();
    });

    it('should return false if no pending assistant exists', () => {
      const result = stateManager.resolveAssistantPlaceholder('nonexistent', 'Answer');
      
      expect(result).toBe(false);
    });

    it('should return false and cleanup if message not found', () => {
      // Create placeholder but remove from history
      const placeholder = stateManager.addAssistantPlaceholder('chat123');
      const state = stateManager.getState();
      state.historyByChatId['chat123'] = [];
      
      const result = stateManager.resolveAssistantPlaceholder('chat123', 'Answer');
      
      expect(result).toBe(false);
      expect(state.pendingAssistantByChatId['chat123']).toBeUndefined();
    });

    it('should handle empty answer', () => {
      const placeholder = stateManager.addAssistantPlaceholder('chat123');
      
      const result = stateManager.resolveAssistantPlaceholder('chat123', '');
      
      expect(result).toBe(true);
      
      const history = stateManager.getHistory('chat123');
      const resolved = history.find(m => m.id === placeholder.id);
      
      expect(resolved?.content).toBe('');
      expect(resolved?.status).toBe('complete');
    });
  });

  describe('clearAssistantPlaceholder()', () => {
    it('should remove placeholder message from history', () => {
      const placeholder = stateManager.addAssistantPlaceholder('chat123');
      
      stateManager.clearAssistantPlaceholder('chat123');
      
      const history = stateManager.getHistory('chat123');
      expect(history).toHaveLength(0);
      
      const state = stateManager.getState();
      expect(state.pendingAssistantByChatId['chat123']).toBeUndefined();
    });

    it('should do nothing if no pending assistant exists', () => {
      stateManager.clearAssistantPlaceholder('nonexistent');
      
      // Should not throw
      const history = stateManager.getHistory('nonexistent');
      expect(history).toHaveLength(0);
    });

    it('should handle case where message not found in history', () => {
      // Create placeholder but remove from history manually
      const placeholder = stateManager.addAssistantPlaceholder('chat123');
      const state = stateManager.getState();
      state.historyByChatId['chat123'] = [];
      
      stateManager.clearAssistantPlaceholder('chat123');
      
      // Should cleanup pending reference without throwing
      expect(state.pendingAssistantByChatId['chat123']).toBeUndefined();
    });
  });

  describe('ensureChatSelection()', () => {
    it('should return previous key if no chat ID provided', () => {
      const result = stateManager.ensureChatSelection('', 'previous-key');
      
      expect(result).toBe('previous-key');
    });

    it('should return chat ID if same as previous key', () => {
      const result = stateManager.ensureChatSelection('chat123', 'chat123');
      
      expect(result).toBe('chat123');
    });

    it('should move history from previous key to new chat ID', () => {
      // Add messages to previous key
      stateManager.addMessageToHistory('user', 'Message 1', 'previous-key');
      stateManager.addMessageToHistory('user', 'Message 2', 'previous-key');
      
      const result = stateManager.ensureChatSelection('chat123', 'previous-key');
      
      expect(result).toBe('chat123');
      
      const newHistory = stateManager.getHistory('chat123');
      expect(newHistory).toHaveLength(2);
      expect(newHistory[0].content).toBe('Message 1');
      expect(newHistory[1].content).toBe('Message 2');
      
      const state = stateManager.getState();
      expect(state.historyByChatId['previous-key']).toBeUndefined();
    });

    it('should move pending assistant reference', () => {
      const placeholder = stateManager.addAssistantPlaceholder('previous-key');
      
      const result = stateManager.ensureChatSelection('chat123', 'previous-key');
      
      expect(result).toBe('chat123');
      
      const state = stateManager.getState();
      expect(state.pendingAssistantByChatId['chat123']).toBe(placeholder.id);
      expect(state.pendingAssistantByChatId['previous-key']).toBeUndefined();
    });

    it('should set selected chat ID and composing state', () => {
      stateManager.setSelectedChatId(null);
      stateManager.setIsComposingNewChat(true);
      
      stateManager.ensureChatSelection('chat123', 'previous-key');
      
      const state = stateManager.getState();
      expect(state.selectedChatId).toBe('chat123');
      expect(state.isComposingNewChat).toBe(false);
    });

    it('should not change state if chat already selected', () => {
      stateManager.setSelectedChatId('existing-chat');
      stateManager.setIsComposingNewChat(false);
      
      stateManager.ensureChatSelection('chat123', 'previous-key');
      
      const state = stateManager.getState();
      expect(state.selectedChatId).toBe('existing-chat'); // Should not change
      expect(state.isComposingNewChat).toBe(false);
    });
  });

  describe('setChatHistory()', () => {
    it('should set chat history for specified chat ID', () => {
      const messages: Message[] = [
        {
          id: 'msg1',
          role: 'user',
          content: 'Hello',
          status: 'complete',
          timestamp: '2023-01-01T00:00:00Z'
        },
        {
          id: 'msg2',
          role: 'assistant',
          content: 'Hi there!',
          status: 'complete',
          timestamp: '2023-01-01T00:01:00Z'
        }
      ];
      
      stateManager.setChatHistory('chat123', messages);
      
      const history = stateManager.getHistory('chat123');
      expect(history).toEqual(messages);
      expect(history).toHaveLength(2);
    });

    it('should replace existing history', () => {
      // Set initial history
      stateManager.addMessageToHistory('user', 'Old message', 'chat123');
      
      const newMessages: Message[] = [
        {
          id: 'new-msg',
          role: 'user',
          content: 'New message',
          status: 'complete',
          timestamp: '2023-01-01T00:00:00Z'
        }
      ];
      
      stateManager.setChatHistory('chat123', newMessages);
      
      const history = stateManager.getHistory('chat123');
      expect(history).toEqual(newMessages);
      expect(history).toHaveLength(1);
      expect(history[0].content).toBe('New message');
    });

    it('should accept empty array', () => {
      stateManager.addMessageToHistory('user', 'Message', 'chat123');
      
      stateManager.setChatHistory('chat123', []);
      
      const history = stateManager.getHistory('chat123');
      expect(history).toEqual([]);
    });
  });

  describe('startPendingAnimation()', () => {
    it('should store animation interval ID', () => {
      const intervalId = 12345;
      
      stateManager.startPendingAnimation('msg123', intervalId);
      
      const state = stateManager.getState();
      expect(state.pendingAssistantIntervals['msg123']).toBe(intervalId);
    });

    it('should handle multiple animations', () => {
      stateManager.startPendingAnimation('msg1', 111);
      stateManager.startPendingAnimation('msg2', 222);
      
      const state = stateManager.getState();
      expect(state.pendingAssistantIntervals['msg1']).toBe(111);
      expect(state.pendingAssistantIntervals['msg2']).toBe(222);
    });
  });

  describe('stopPendingAnimation()', () => {
    beforeEach(() => {
      // Mock window.clearInterval
      vi.stubGlobal('clearInterval', vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should clear interval and remove from state', () => {
      const intervalId = 12345;
      stateManager.startPendingAnimation('msg123', intervalId);
      
      stateManager.stopPendingAnimation('msg123');
      
      expect(window.clearInterval).toHaveBeenCalledWith(intervalId);
      
      const state = stateManager.getState();
      expect(state.pendingAssistantIntervals['msg123']).toBeUndefined();
    });

    it('should do nothing if animation does not exist', () => {
      stateManager.stopPendingAnimation('nonexistent');
      
      expect(window.clearInterval).not.toHaveBeenCalled();
    });

    it('should handle multiple animations independently', () => {
      stateManager.startPendingAnimation('msg1', 111);
      stateManager.startPendingAnimation('msg2', 222);
      
      stateManager.stopPendingAnimation('msg1');
      
      expect(window.clearInterval).toHaveBeenCalledWith(111);
      expect(window.clearInterval).not.toHaveBeenCalledWith(222);
      
      const state = stateManager.getState();
      expect(state.pendingAssistantIntervals['msg1']).toBeUndefined();
      expect(state.pendingAssistantIntervals['msg2']).toBe(222);
    });
  });

  describe('clearAllPendingAnimations()', () => {
    beforeEach(() => {
      vi.stubGlobal('clearInterval', vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should clear all pending animations', () => {
      stateManager.startPendingAnimation('msg1', 111);
      stateManager.startPendingAnimation('msg2', 222);
      stateManager.startPendingAnimation('msg3', 333);
      
      stateManager.clearAllPendingAnimations();
      
      expect(window.clearInterval).toHaveBeenCalledWith(111);
      expect(window.clearInterval).toHaveBeenCalledWith(222);
      expect(window.clearInterval).toHaveBeenCalledWith(333);
      
      const state = stateManager.getState();
      expect(state.pendingAssistantIntervals).toEqual({});
    });

    it('should do nothing if no animations exist', () => {
      stateManager.clearAllPendingAnimations();
      
      expect(window.clearInterval).not.toHaveBeenCalled();
      
      const state = stateManager.getState();
      expect(state.pendingAssistantIntervals).toEqual({});
    });

    it('should handle empty intervals object', () => {
      // Ensure clean state
      const state = stateManager.getState();
      expect(Object.keys(state.pendingAssistantIntervals)).toHaveLength(0);
      
      stateManager.clearAllPendingAnimations();
      
      expect(window.clearInterval).not.toHaveBeenCalled();
    });
  });

  describe('State isolation and cleanup', () => {
    it('should maintain state isolation between different chat keys', () => {
      stateManager.addMessageToHistory('user', 'Chat 1 message', 'chat1');
      stateManager.addMessageToHistory('user', 'Chat 2 message', 'chat2');
      
      const history1 = stateManager.getHistory('chat1');
      const history2 = stateManager.getHistory('chat2');
      
      expect(history1).toHaveLength(1);
      expect(history2).toHaveLength(1);
      expect(history1[0].content).toBe('Chat 1 message');
      expect(history2[0].content).toBe('Chat 2 message');
    });

    it('should properly clean up when resetting chat state', () => {
      // Set up complex state
      stateManager.setSelectedChatId('chat123');
      stateManager.setIsComposingNewChat(false);
      stateManager.addMessageToHistory('user', 'Message', 'chat123');
      stateManager.addAssistantPlaceholder('chat123');
      stateManager.startPendingAnimation('msg1', 12345);
      
      stateManager.resetChatState();
      
      const state = stateManager.getState();
      expect(state.selectedChatId).toBeNull();
      expect(state.isComposingNewChat).toBe(true);
      expect(state.historyByChatId).toEqual({ [DRAFT_CHAT_KEY]: [] });
      expect(state.pendingAssistantByChatId).toEqual({});
      expect(state.pendingAssistantIntervals).toEqual({});
    });

    it('should handle edge cases with null and undefined values', () => {
      // Test that the state manager handles edge cases gracefully
      const message = stateManager.addMessageToHistory('user', '', 'chat123', {
        timestamp: null
      });
      
      expect(message.content).toBe('');
      expect(message.timestamp).toBeNull();
      
      const history = stateManager.getHistory('chat123');
      expect(history).toHaveLength(1);
      expect(history[0].timestamp).toBeNull();
    });
  });
});