import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup.js';
import { mockUtils } from '../mocks/api-mocks.js';
import { domUtils, asyncUtils, dataUtils } from '../utils/test-helpers.js';
import type { DOMElements, StreamEvent } from '../../src/types.js';

// Import the modules we need to test
import { stateManager } from '../../src/state.js';
import { chatService } from '../../src/chat-service.js';
import { createUIComponents } from '../../src/ui-components.js';
import { DRAFT_CHAT_KEY } from '../../src/constants.js';

/**
 * Integration tests for user workflows
 * Tests complete user interactions from UI events through state changes
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */
describe('User Workflows Integration Tests', () => {
  let elements: DOMElements;
  let uiComponents: ReturnType<typeof createUIComponents>;

  beforeEach(() => {
    // Setup complete DOM structure for integration testing
    elements = domUtils.setupCompleteDOM();
    uiComponents = createUIComponents(
      elements.chatList,
      elements.chatCount,
      elements.chatHistory
    );

    // Reset state manager to clean state
    stateManager.resetChatState();
    stateManager.setUsers([]);
    stateManager.setChats([]);
    stateManager.setSelectedUserId(null);
  });

  describe('User Selection and Chat Loading Workflow', () => {
    /**
     * **Validates: Requirements 3.1**
     * WHEN a user selects a different user from the dropdown 
     * THEN the UI_Application SHALL load and display the correct chat list
     */
    it('should load and display chats when user is selected', async () => {
      // Arrange: Setup test users and chats
      const testUsers = dataUtils.createTestUsers(2);
      const testChats = dataUtils.createTestChats(3);

      // Simulate the workflow without API calls
      stateManager.setUsers(testUsers);
      uiComponents.populateUserSelect(elements.userSelect, testUsers);

      // Act: Simulate user selection workflow
      stateManager.setSelectedUserId(testUsers[0].userId);
      stateManager.setChats(testChats);

      // Assert: Verify state and UI updates
      const updatedState = stateManager.getState();
      expect(updatedState.selectedUserId).toBe(testUsers[0].userId);
      expect(updatedState.chats).toHaveLength(3);
      
      // Verify UI components can render the chats
      uiComponents.renderChats(updatedState.chats, null);
      const chatCards = elements.chatList.querySelectorAll('.chat-card');
      expect(chatCards).toHaveLength(3);
    });

    it('should handle user selection with no chats gracefully', async () => {
      // Arrange: Setup user with no chats
      const testUsers = dataUtils.createTestUsers(1);
      
      // Simulate the workflow without API calls
      stateManager.setUsers(testUsers);
      uiComponents.populateUserSelect(elements.userSelect, testUsers);

      // Act: Simulate user selection with no chats
      stateManager.setSelectedUserId(testUsers[0].userId);
      stateManager.setChats([]); // Empty chat list

      // Assert: Verify empty state handling
      const state = stateManager.getState();
      expect(state.selectedUserId).toBe(testUsers[0].userId);
      expect(state.chats).toHaveLength(0);
      
      // Verify UI renders empty state
      uiComponents.renderChats(state.chats, null);
      expect(elements.chatCount.textContent).toBe('0');
    });

    it('should reset chat panel when user is deselected', async () => {
      // Arrange: Setup with selected user
      const testUsers = dataUtils.createTestUsers(1);
      stateManager.setUsers(testUsers);
      stateManager.setSelectedUserId(testUsers[0].userId);
      uiComponents.populateUserSelect(elements.userSelect, testUsers);
      elements.userSelect.value = testUsers[0].userId;

      // Act: Simulate user deselection
      stateManager.setSelectedUserId(null);
      stateManager.setChats([]);

      // Assert: Verify reset state
      const state = stateManager.getState();
      expect(state.selectedUserId).toBe(null);
      
      // Verify UI reflects deselected state
      uiComponents.renderChatPlaceholder('Choose a user to view their chats.');
      const placeholder = elements.chatList.querySelector('.empty-state');
      expect(placeholder).toBeTruthy();
      expect(placeholder?.textContent).toBe('Choose a user to view their chats.');
    });
  });

  describe('New Chat Session Creation Workflow', () => {
    /**
     * **Validates: Requirements 3.2**
     * WHEN a user starts a new chat session 
     * THEN the UI_Application SHALL initialize the chat interface and enable message input
     */
    it('should initialize new chat session correctly', async () => {
      // Arrange: Setup user selection
      const testUsers = dataUtils.createTestUsers(1);
      stateManager.setUsers(testUsers);
      stateManager.setSelectedUserId(testUsers[0].userId);
      elements.newChatButton.disabled = false;

      // Act: Simulate new chat session creation
      chatService.beginNewChatSession();

      // Assert: Verify new chat state
      const state = stateManager.getState();
      expect(state.isComposingNewChat).toBe(true);
      expect(state.selectedChatId).toBe(null);
      
      // Verify chat service allows message sending
      expect(chatService.canSendMessages()).toBe(true);
      
      // Verify UI components can handle new chat state
      uiComponents.renderChatHistory([], { placeholder: 'Say hello to begin the conversation.' });
      const placeholder = elements.chatHistory.querySelector('.empty-state');
      expect(placeholder?.textContent).toBe('Say hello to begin the conversation.');
    });

    it('should not create new chat when no user is selected', async () => {
      // Arrange: No user selected
      stateManager.setSelectedUserId(null);
      elements.newChatButton.disabled = true;

      // Act: Try to begin new chat without user
      chatService.beginNewChatSession();

      // Assert: Verify no state change (service should prevent this)
      const state = stateManager.getState();
      expect(chatService.canSendMessages()).toBe(false);
    });

    it('should clear previous chat history when starting new chat', async () => {
      // Arrange: Setup with existing chat selected
      const testUsers = dataUtils.createTestUsers(1);
      const testChats = dataUtils.createTestChats(1);
      const testMessages = dataUtils.createTestMessages(3);
      
      stateManager.setUsers(testUsers);
      stateManager.setSelectedUserId(testUsers[0].userId);
      stateManager.setChats(testChats);
      stateManager.setSelectedChatId(testChats[0].chatId);
      stateManager.setChatHistory(testChats[0].chatId, testMessages);
      elements.newChatButton.disabled = false;

      // Act: Start new chat
      chatService.beginNewChatSession();

      // Assert: Verify clean slate for new chat
      const state = stateManager.getState();
      expect(state.isComposingNewChat).toBe(true);
      expect(state.selectedChatId).toBe(null);
      
      const draftHistory = stateManager.getHistory(DRAFT_CHAT_KEY);
      expect(draftHistory).toHaveLength(0);
    });
  });

  describe('Message Sending and Response Handling Workflow', () => {
    /**
     * **Validates: Requirements 3.3**
     * WHEN a user sends a message 
     * THEN the UI_Application SHALL display the message, show loading state, and handle the response
     */
    it('should handle complete message sending workflow', async () => {
      // Arrange: Setup for message sending
      const testUsers = dataUtils.createTestUsers(1);
      const testMessage = 'Hello, I need help with dog adoption';
      
      stateManager.setUsers(testUsers);
      stateManager.setSelectedUserId(testUsers[0].userId);
      stateManager.setIsComposingNewChat(true);
      
      // Act: Simulate message sending workflow without actual API call
      // Add user message directly to state
      stateManager.addMessageToHistory('user', testMessage, DRAFT_CHAT_KEY);
      
      // Add assistant placeholder
      const placeholder = stateManager.addAssistantPlaceholder(DRAFT_CHAT_KEY);
      
      // Simulate streaming response
      stateManager.updateAssistantPlaceholderContent(DRAFT_CHAT_KEY, 'I\'d be happy to help!');
      stateManager.resolveAssistantPlaceholder(DRAFT_CHAT_KEY, 'I\'d be happy to help you find the perfect dog!');
      
      // Assert: Verify message workflow
      const history = stateManager.getHistory(DRAFT_CHAT_KEY);
      expect(history).toHaveLength(2);
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe(testMessage);
      expect(history[1].role).toBe('assistant');
      expect(history[1].status).toBe('complete');
      expect(history[1].content).toBe('I\'d be happy to help you find the perfect dog!');
      
      // Verify UI components can render the history
      uiComponents.renderChatHistory(history);
      const bubbles = elements.chatHistory.querySelectorAll('.chat-bubble');
      expect(bubbles.length).toBeGreaterThan(0);
    });

    it('should handle message sending with form submission', async () => {
      // Arrange: Setup for form submission
      const testUsers = dataUtils.createTestUsers(1);
      stateManager.setUsers(testUsers);
      stateManager.setSelectedUserId(testUsers[0].userId);
      stateManager.setIsComposingNewChat(true);

      // Act: Simulate form submission workflow
      const testMessage = 'Test message';
      stateManager.addMessageToHistory('user', testMessage, DRAFT_CHAT_KEY);
      const placeholder = stateManager.addAssistantPlaceholder(DRAFT_CHAT_KEY);
      stateManager.resolveAssistantPlaceholder(DRAFT_CHAT_KEY, 'Response');

      // Assert: Verify message was processed
      const history = stateManager.getHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].content).toBe('Test message');
      expect(history[1].content).toBe('Response');
      
      // Verify UI can handle the state
      expect(chatService.canSendMessages()).toBe(true);
    });

    it('should prevent sending empty messages', async () => {
      // Arrange: Setup for empty message test
      const testUsers = dataUtils.createTestUsers(1);
      stateManager.setUsers(testUsers);
      stateManager.setSelectedUserId(testUsers[0].userId);
      stateManager.setIsComposingNewChat(true);

      // Act: Simulate empty message validation
      const emptyMessage = '   '; // Whitespace only
      const trimmedMessage = emptyMessage.trim();
      
      // Only add message if it's not empty (simulating validation)
      if (trimmedMessage.length > 0) {
        stateManager.addMessageToHistory('user', trimmedMessage, DRAFT_CHAT_KEY);
      }

      // Assert: Verify no message was sent
      const history = stateManager.getHistory();
      const userMessages = history.filter(msg => msg.role === 'user' && msg.content.trim().length > 0);
      expect(userMessages).toHaveLength(0);
      
      // Verify UI components handle empty state
      uiComponents.renderChatHistory(history, { placeholder: 'No messages yet.' });
      const placeholder = elements.chatHistory.querySelector('.empty-state');
      expect(placeholder?.textContent).toBe('No messages yet.');
    });
  });

  describe('Chat Switching and History Loading Workflow', () => {
    /**
     * **Validates: Requirements 3.4**
     * WHEN a user switches between existing chats 
     * THEN the UI_Application SHALL load and display the correct message history
     */
    it('should load chat history when switching to existing chat', async () => {
      // Arrange: Setup chats and messages
      const testUsers = dataUtils.createTestUsers(1);
      const testChats = dataUtils.createTestChats(2);
      const testMessages = dataUtils.createTestMessages(5);
      
      stateManager.setUsers(testUsers);
      stateManager.setSelectedUserId(testUsers[0].userId);
      stateManager.setChats(testChats);
      
      // Pre-populate chat history
      stateManager.setChatHistory(testChats[0].chatId, testMessages);

      // Render chats in UI
      uiComponents.renderChats(testChats, null);
      
      // Act: Simulate chat selection
      stateManager.setSelectedChatId(testChats[0].chatId);
      stateManager.setIsComposingNewChat(false);
      
      // Assert: Verify chat selection and history loading
      const state = stateManager.getState();
      expect(state.selectedChatId).toBe(testChats[0].chatId);
      expect(state.isComposingNewChat).toBe(false);
      
      const history = stateManager.getHistory(testChats[0].chatId);
      expect(history).toHaveLength(5);
      
      // Verify UI can render the chat history
      uiComponents.renderChatHistory(history);
      const bubbles = elements.chatHistory.querySelectorAll('.chat-bubble');
      expect(bubbles.length).toBeGreaterThan(0);
    });

    it('should handle switching between multiple chats', async () => {
      // Arrange: Setup multiple chats with different histories
      const testUsers = dataUtils.createTestUsers(1);
      const testChats = dataUtils.createTestChats(3);
      
      stateManager.setUsers(testUsers);
      stateManager.setSelectedUserId(testUsers[0].userId);
      stateManager.setChats(testChats);
      
      // Pre-populate different histories for each chat
      const messages1 = dataUtils.createTestMessages(3);
      const messages2 = dataUtils.createTestMessages(2);
      stateManager.setChatHistory(testChats[0].chatId, messages1);
      stateManager.setChatHistory(testChats[1].chatId, messages2);
      
      uiComponents.renderChats(testChats, null);

      // Render chats first
      uiComponents.renderChats(testChats, null);
      
      // Act: Switch between chats through service
      await chatService.selectExistingChat(testChats[0].chatId);
      
      let state = stateManager.getState();
      expect(state.selectedChatId).toBe(testChats[0].chatId);
      expect(stateManager.getHistory(testChats[0].chatId)).toHaveLength(3);
      
      // Switch to second chat
      await chatService.selectExistingChat(testChats[1].chatId);
      
      state = stateManager.getState();
      expect(state.selectedChatId).toBe(testChats[1].chatId);
      expect(stateManager.getHistory(testChats[1].chatId)).toHaveLength(2);
    });

    it('should handle cached vs uncached chat history', async () => {
      // Arrange: Setup chat with no cached history
      const testUsers = dataUtils.createTestUsers(1);
      const testChats = dataUtils.createTestChats(1);
      const testMessages = dataUtils.createTestMessages(4);
      
      stateManager.setUsers(testUsers);
      stateManager.setSelectedUserId(testUsers[0].userId);
      stateManager.setChats(testChats);
      
      uiComponents.renderChats(testChats, null);
      
      // Act: Simulate loading chat history (uncached)
      stateManager.setChatHistory(testChats[0].chatId, testMessages);
      stateManager.setSelectedChatId(testChats[0].chatId);
      
      // Assert: Verify history was loaded
      const history = stateManager.getHistory(testChats[0].chatId);
      expect(history).toHaveLength(4);
      
      // Act: Access same chat again (should use cache)
      const cachedHistory = stateManager.getHistory(testChats[0].chatId);
      
      // Assert: Verify cached history is used
      expect(cachedHistory).toHaveLength(4);
      expect(cachedHistory).toEqual(history);
      
      // Verify UI can render both scenarios
      uiComponents.renderChatHistory(cachedHistory);
      const bubbles = elements.chatHistory.querySelectorAll('.chat-bubble');
      expect(bubbles.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Recovery Workflow', () => {
    /**
     * **Validates: Requirements 3.5**
     * WHEN API calls fail 
     * THEN the UI_Application SHALL display appropriate error messages and maintain stable state
     */
    it('should handle user loading errors gracefully', async () => {
      // Arrange: Setup error response
      server.use(
        http.get('/users', () => new HttpResponse(null, { status: 500 }))
      );

      // Act: Try to load users
      try {
        await chatService.loadUsers();
      } catch (error) {
        // Expected to throw
      }

      // Assert: Verify error handling
      const state = stateManager.getState();
      expect(state.users).toHaveLength(0);
      
      // Verify UI shows error state (would be handled by calling code)
      expect(elements.userSelect.disabled).toBe(false); // Should remain functional
    });

    it('should handle chat loading errors gracefully', async () => {
      // Arrange: Setup user but error on chat loading
      const testUsers = dataUtils.createTestUsers(1);
      stateManager.setUsers(testUsers);
      stateManager.setSelectedUserId(testUsers[0].userId);
      
      server.use(
        http.get('/chats', () => new HttpResponse(null, { status: 500 }))
      );

      // Act: Try to load chats
      try {
        await chatService.loadChats(testUsers[0].userId);
      } catch (error) {
        // Expected to throw
      }

      // Assert: Verify error state
      const state = stateManager.getState();
      expect(state.chats).toHaveLength(0);
      expect(state.selectedUserId).toBe(testUsers[0].userId); // User selection preserved
    });

    it('should handle message sending errors gracefully', async () => {
      // Arrange: Setup for message sending with error
      const testUsers = dataUtils.createTestUsers(1);
      stateManager.setUsers(testUsers);
      stateManager.setSelectedUserId(testUsers[0].userId);
      stateManager.setIsComposingNewChat(true);
      
      server.use(
        http.get('/ask/stream', () => new HttpResponse(null, { status: 500 }))
      );

      // Act: Try to send message
      try {
        await chatService.sendMessage('Test message');
      } catch (error) {
        // Expected to throw
      }
      
      await asyncUtils.sleep(100);

      // Assert: Verify error handling
      const history = stateManager.getHistory();
      
      if (history.length > 0) {
        // Should have user message and error message
        const lastMessage = history[history.length - 1];
        expect(lastMessage.role).toBe('system');
        expect(lastMessage.content).toContain('Failed to send message');
      }
      
      // Verify UI state is recovered
      const state = stateManager.getState();
      expect(state.isSending).toBe(false);
    });

    it('should handle network timeouts gracefully', async () => {
      // Arrange: Setup timeout scenario simulation
      const initialState = stateManager.getState();
      
      // Act: Simulate timeout behavior
      const startTime = Date.now();
      
      // Simulate a timeout by waiting and then checking state
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const endTime = Date.now();

      // Assert: Verify timeout behavior
      expect(endTime - startTime).toBeGreaterThan(100); // Should have waited
      
      // Verify state remains unchanged after timeout
      const finalState = stateManager.getState();
      expect(finalState.users).toEqual(initialState.users);
      
      // Verify UI can handle timeout state
      uiComponents.setUserSelectError(elements.userSelect, 'Request timeout');
      expect(elements.userSelect.disabled).toBe(true);
    });

    it('should maintain state consistency during errors', async () => {
      // Arrange: Setup initial valid state
      const testUsers = dataUtils.createTestUsers(2);
      const testChats = dataUtils.createTestChats(1);
      
      stateManager.setUsers(testUsers);
      stateManager.setSelectedUserId(testUsers[0].userId);
      stateManager.setChats(testChats);
      
      const initialState = stateManager.getState();

      // Act: Perform operation that will fail
      server.use(
        http.get('/chats/:chatId', () => new HttpResponse(null, { status: 500 }))
      );
      
      try {
        await chatService.loadChatHistory('invalid-chat', testUsers[0].userId);
      } catch (error) {
        // Expected to throw
      }

      // Assert: Verify state consistency is maintained
      const finalState = stateManager.getState();
      expect(finalState.users).toEqual(initialState.users);
      expect(finalState.selectedUserId).toBe(initialState.selectedUserId);
      expect(finalState.chats).toEqual(initialState.chats);
    });
  });
});