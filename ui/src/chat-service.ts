import type { Message } from './types.js';
import { ApiError, fetchUsers, fetchChats, fetchChatHistory, streamAssistantResponse } from './api.js';
import { stateManager } from './state.js';
import { normalizeRole } from './utils.js';
import { DRAFT_CHAT_KEY } from './constants.js';

export class ChatService {
  async loadUsers(): Promise<void> {
    try {
      const users = await fetchUsers();
      stateManager.setUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
      throw error;
    }
  }

  async loadChats(userId: string): Promise<void> {
    try {
      const chats = await fetchChats(userId);
      stateManager.setChats(chats);
    } catch (error) {
      console.error('Failed to load chats:', error);
      throw error;
    }
  }

  async loadChatHistory(chatId: string, userId: string): Promise<void> {
    try {
      const history = await fetchChatHistory(chatId, userId);
      const messages: Message[] = history.map((message, index) => ({
        id: `${chatId}-${index}`,
        role: normalizeRole(message.role),
        content: message.content,
        timestamp: message.timestamp,
        status: 'complete',
      }));
      
      stateManager.setChatHistory(chatId, messages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      throw error;
    }
  }

  async sendMessage(
    question: string,
    onDelta?: (content: string) => void,
    onComplete?: (chatId: string, answer: string) => void
  ): Promise<void> {
    const state = stateManager.getState();
    
    if (!state.selectedUserId) {
      throw new Error('No user selected');
    }

    const historyKey = stateManager.getActiveHistoryKey();
    
    stateManager.addMessageToHistory('user', question, historyKey);
    
    stateManager.addAssistantPlaceholder(historyKey);
    
    stateManager.setIsSending(true);
    
    let aggregatedAnswer = '';
    let currentHistoryKey = historyKey;

    try {
      const stream = streamAssistantResponse({
        question,
        userId: state.selectedUserId,
        ...(state.selectedChatId && { chatId: state.selectedChatId }),
      });

      for await (const event of stream) {
        const { chatId, delta, done, answer, error } = event;

        if (error) {
          throw new ApiError(error);
        }

        if (chatId && chatId !== currentHistoryKey) {
          currentHistoryKey = stateManager.ensureChatSelection(chatId, currentHistoryKey);
        }

        if (typeof delta === 'string') {
          if (delta.length > 0) {
            aggregatedAnswer += delta;
          }
          stateManager.updateAssistantPlaceholderContent(currentHistoryKey, aggregatedAnswer);
          onDelta?.(aggregatedAnswer);
        }

        if (done) {
          const finalAnswer = answer ?? aggregatedAnswer ?? '';
          stateManager.resolveAssistantPlaceholder(currentHistoryKey, finalAnswer);
          onComplete?.(chatId ?? state.selectedChatId ?? currentHistoryKey, finalAnswer);
          return;
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      stateManager.clearAssistantPlaceholder(currentHistoryKey);
      
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to send message';
      
      stateManager.addMessageToHistory('system', `Failed to send message: ${errorMessage}`, currentHistoryKey);
      throw error;
    } finally {
      stateManager.setIsSending(false);
    }
  }

  beginNewChatSession(): void {
    const state = stateManager.getState();
    
    if (!state.selectedUserId) {
      return;
    }

    stateManager.setSelectedChatId(null);
    stateManager.setIsComposingNewChat(true);
    
    stateManager.setChatHistory(DRAFT_CHAT_KEY, []);
    
    const pendingId = state.pendingAssistantByChatId[DRAFT_CHAT_KEY];
    if (pendingId) {
      stateManager.stopPendingAnimation(pendingId);
      stateManager.clearAssistantPlaceholder(DRAFT_CHAT_KEY);
    }
  }

  async selectExistingChat(chatId: string): Promise<void> {
    const state = stateManager.getState();
    
    if (!state.selectedUserId) {
      throw new Error('No user selected');
    }

    stateManager.setSelectedChatId(chatId);
    stateManager.setIsComposingNewChat(false);

    const cachedHistory = stateManager.getHistory(chatId);
    if (cachedHistory.length === 0) {
      await this.loadChatHistory(chatId, state.selectedUserId);
    }
  }

  canSendMessages(): boolean {
    const state = stateManager.getState();
    return Boolean(state.selectedUserId && (state.selectedChatId || state.isComposingNewChat));
  }

  async refreshActiveChatMetadata(): Promise<void> {
    const state = stateManager.getState();
    
    if (!state.selectedUserId || !state.selectedChatId) {
      return;
    }

    try {
      await this.loadChats(state.selectedUserId);
    } catch (error) {
      console.error('Failed to refresh chat metadata:', error);
    }
  }
}

export const chatService = new ChatService();