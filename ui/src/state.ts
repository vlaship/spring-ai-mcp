import type { AppState, Message, MessageOverrides, MessageRole, User, Chat } from './types.js';
import { DRAFT_CHAT_KEY } from './constants.js';
import { generateMessageId } from './utils.js';

class StateManager {
  private state: AppState = {
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

  getState(): Readonly<AppState> {
    return this.state;
  }

  setUsers(users: readonly User[]): void {
    this.state = { ...this.state, users };
  }

  setChats(chats: readonly Chat[]): void {
    this.state = { ...this.state, chats };
  }

  setSelectedUserId(userId: string | null): void {
    this.state = { ...this.state, selectedUserId: userId };
  }

  setSelectedChatId(chatId: string | null): void {
    this.state = { ...this.state, selectedChatId: chatId };
  }

  setIsSending(isSending: boolean): void {
    this.state = { ...this.state, isSending };
  }

  setIsComposingNewChat(isComposingNewChat: boolean): void {
    this.state = { ...this.state, isComposingNewChat };
  }

  resetChatState(): void {
    this.state = {
      ...this.state,
      historyByChatId: {},
      selectedChatId: null,
      isComposingNewChat: true,
      pendingAssistantByChatId: {},
      pendingAssistantIntervals: {}
    };
    this.clearAllPendingAnimations();
    this.initializeDraftHistory();
  }

  private initializeDraftHistory(): void {
    this.state.historyByChatId[DRAFT_CHAT_KEY] = [];
  }

  getHistory(chatKey: string = this.getActiveHistoryKey()): Message[] {
    if (!this.state.historyByChatId[chatKey]) {
      this.state.historyByChatId[chatKey] = [];
    }
    return this.state.historyByChatId[chatKey]!;
  }

  getActiveHistoryKey(): string {
    return this.state.selectedChatId ?? DRAFT_CHAT_KEY;
  }

  addMessageToHistory(
    role: MessageRole,
    content: string,
    chatKey: string,
    overrides: MessageOverrides = {}
  ): Message {
    const history = this.getHistory(chatKey);
    const entry: Message = {
      id: generateMessageId(),
      role,
      content,
      status: overrides.status ?? 'complete',
      timestamp: overrides.hasOwnProperty('timestamp') && overrides.timestamp !== undefined
        ? overrides.timestamp
        : new Date().toISOString(),
    };
    history.push(entry);
    return entry;
  }

  addAssistantPlaceholder(chatKey: string): Message {
    const entry = this.addMessageToHistory('assistant', '', chatKey, {
      status: 'pending',
      timestamp: null,
    });
    this.state.pendingAssistantByChatId[chatKey] = entry.id;
    return entry;
  }

  updateAssistantPlaceholderContent(chatKey: string, content: string): void {
    const pendingId = this.state.pendingAssistantByChatId[chatKey];
    if (!pendingId) {
      return;
    }

    const history = this.getHistory(chatKey);
    const entry = history.find((message) => message.id === pendingId);
    if (!entry) {
      return;
    }

    const updatedEntry: Message = {
      ...entry,
      content: content ?? '',
      status: entry.status === 'pending' ? 'streaming' : entry.status
    };

    const index = history.findIndex((message) => message.id === pendingId);
    if (index >= 0) {
      history[index] = updatedEntry;
    }

    if (entry.status === 'pending' && content && content.length > 0) {
      this.stopPendingAnimation(pendingId);
    }
  }

  resolveAssistantPlaceholder(chatKey: string, answer: string): boolean {
    const pendingId = this.state.pendingAssistantByChatId[chatKey];
    if (!pendingId) {
      return false;
    }

    const history = this.getHistory(chatKey);
    const entry = history.find((message) => message.id === pendingId);
    if (!entry) {
      delete this.state.pendingAssistantByChatId[chatKey];
      return false;
    }

    const updatedEntry: Message = {
      ...entry,
      content: answer,
      status: 'complete',
      timestamp: new Date().toISOString()
    };

    const index = history.findIndex((message) => message.id === pendingId);
    if (index >= 0) {
      history[index] = updatedEntry;
    }

    this.stopPendingAnimation(entry.id);
    delete this.state.pendingAssistantByChatId[chatKey];
    return true;
  }

  clearAssistantPlaceholder(chatKey: string): void {
    const pendingId = this.state.pendingAssistantByChatId[chatKey];
    if (!pendingId) {
      return;
    }
    const history = this.getHistory(chatKey);
    const index = history.findIndex((message) => message.id === pendingId);
    if (index >= 0) {
      history.splice(index, 1);
    }
    this.stopPendingAnimation(pendingId);
    delete this.state.pendingAssistantByChatId[chatKey];
  }

  ensureChatSelection(chatId: string, previousHistoryKey: string): string {
    if (!chatId) {
      return previousHistoryKey;
    }

    if (previousHistoryKey !== chatId) {
      const previousHistory = this.state.historyByChatId[previousHistoryKey] ?? [];
      this.state.historyByChatId[chatId] = previousHistory;
      delete this.state.historyByChatId[previousHistoryKey];

      const pendingId = this.state.pendingAssistantByChatId[previousHistoryKey];
      if (pendingId) {
        this.state.pendingAssistantByChatId[chatId] = pendingId;
        delete this.state.pendingAssistantByChatId[previousHistoryKey];
      }
    }

    if (!this.state.selectedChatId) {
      this.state = {
        ...this.state,
        selectedChatId: chatId,
        isComposingNewChat: false
      };
    }

    return chatId;
  }

  setChatHistory(chatId: string, messages: Message[]): void {
    this.state.historyByChatId[chatId] = messages;
  }

  startPendingAnimation(messageId: string, intervalId: number): void {
    this.state.pendingAssistantIntervals[messageId] = intervalId;
  }

  stopPendingAnimation(messageId: string): void {
    const timerId = this.state.pendingAssistantIntervals[messageId];
    if (timerId) {
      window.clearInterval(timerId);
      delete this.state.pendingAssistantIntervals[messageId];
    }
  }

  clearAllPendingAnimations(): void {
    Object.keys(this.state.pendingAssistantIntervals).forEach((messageId) => {
      window.clearInterval(this.state.pendingAssistantIntervals[messageId]!);
      delete this.state.pendingAssistantIntervals[messageId];
    });
  }
}

export const stateManager = new StateManager();