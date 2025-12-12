import type { DOMElements } from './types.js';
import { getDOMElements, focusElement } from './dom.js';
import { createUIComponents } from './ui-components.js';
import { chatService } from './chat-service.js';
import { stateManager } from './state.js';
import { themeManager } from './theme.js';
import { DRAFT_CHAT_KEY } from './constants.js';

class App {
  private elements!: DOMElements;
  private uiComponents!: ReturnType<typeof createUIComponents>;

  async initialize(): Promise<void> {
    try {
      this.elements = getDOMElements();
      this.uiComponents = createUIComponents(
        this.elements.chatList,
        this.elements.chatCount,
        this.elements.chatHistory
      );

      this.initializeTheme();
      this.attachEventListeners();
      this.resetChatPanel();
      await this.loadUsers();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  private initializeTheme(): void {
    themeManager.initialize(
      this.elements.themeToggleButton,
      this.elements.themeToggleText
    );
  }

  private attachEventListeners(): void {
    this.elements.themeToggleButton?.addEventListener('click', () => {
      themeManager.toggle();
    });

    this.elements.userSelect.addEventListener('change', async (event) => {
      const target = event.target as HTMLSelectElement;
      const userId = target.value || null;
      
      stateManager.setSelectedUserId(userId);
      this.elements.newChatButton.disabled = !userId;

      if (userId) {
        stateManager.resetChatState();
        this.prepareChatPanelForUser();
        await this.loadChats(userId);
      } else {
        this.resetChatsView();
        this.resetChatPanel();
      }
    });

    this.elements.newChatButton.addEventListener('click', () => {
      const state = stateManager.getState();
      if (!state.selectedUserId) {
        return;
      }
      this.beginNewChatSession();
    });

    this.elements.chatList.addEventListener('click', async (event) => {
      const card = (event.target as HTMLElement).closest('.chat-card') as HTMLElement;
      if (!card?.dataset.chatId) {
        return;
      }

      const state = stateManager.getState();
      const chat = state.chats.find((c) => c.chatId === card.dataset.chatId);
      if (chat) {
        await this.selectExistingChat(chat);
      }
    });

    // Message form
    this.elements.messageForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this.handleMessageSubmit();
    });

    // Message input
    this.elements.messageInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this.elements.messageForm.requestSubmit();
      }
    });

    this.elements.messageInput.addEventListener('input', () => {
      this.updateComposerState();
    });
  }

  private async loadUsers(): Promise<void> {
    this.uiComponents.setUserSelectLoading(this.elements.userSelect);

    try {
      await chatService.loadUsers();
      const state = stateManager.getState();
      this.uiComponents.populateUserSelect(this.elements.userSelect, state.users);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.uiComponents.setUserSelectError(this.elements.userSelect, message);
    }
  }

  private async loadChats(userId: string): Promise<void> {
    this.uiComponents.renderChatPlaceholder('Loading chats…');

    try {
      await chatService.loadChats(userId);
      const state = stateManager.getState();
      const activeChatId = state.isComposingNewChat ? null : state.selectedChatId;
      this.uiComponents.renderChats(state.chats, activeChatId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.uiComponents.renderChatPlaceholder(`Failed to load chats: ${message}`);
    }
  }

  private resetChatsView(): void {
    stateManager.setChats([]);
    this.elements.chatCount.textContent = '0';
    this.uiComponents.renderChatPlaceholder('Choose a user to view their chats.');
  }

  private resetChatPanel(): void {
    this.elements.chatPanelTitle.textContent = 'Select a user to get started';
    stateManager.setChatHistory(DRAFT_CHAT_KEY, []);
    stateManager.clearAllPendingAnimations();
    
    this.uiComponents.renderChatHistory([], {
      placeholder: 'Choose a user, then start a new chat or open an existing one.',
    });
    
    this.elements.messageInput.value = '';
    stateManager.setIsSending(false);
    stateManager.setIsComposingNewChat(false);
    this.updateComposerState();
  }

  private prepareChatPanelForUser(): void {
    this.elements.chatPanelTitle.textContent = 'Pick a chat or start a new one';
    const history = stateManager.getHistory(DRAFT_CHAT_KEY);
    this.uiComponents.renderChatHistory(history, {
      placeholder: 'Type a message to start a new chat or pick one on the left.',
    });
    this.updateComposerState();
  }

  private beginNewChatSession(): void {
    chatService.beginNewChatSession();
    
    this.elements.chatPanelTitle.textContent = 'New conversation';
    this.elements.messageInput.value = '';
    
    const history = stateManager.getHistory(DRAFT_CHAT_KEY);
    this.uiComponents.renderChatHistory(history, {
      placeholder: 'Say hello to begin the conversation.',
    });
    
    this.updateComposerState();
    focusElement(this.elements.messageInput);
  }

  private async selectExistingChat(chat: { chatId: string; title: string | null }): Promise<void> {
    stateManager.setSelectedChatId(chat.chatId);
    stateManager.setIsComposingNewChat(false);
    this.elements.chatPanelTitle.textContent = chat.title || 'Untitled chat';
    
    const cachedHistory = stateManager.getHistory(chat.chatId);
    if (cachedHistory.length) {
      this.uiComponents.renderChatHistory(cachedHistory);
    } else {
      this.uiComponents.renderChatHistory([], {
        placeholder: 'Loading chat history…',
      });
    }
    
    this.updateComposerState();

    try {
      await chatService.selectExistingChat(chat.chatId);
      const history = stateManager.getHistory(chat.chatId);
      this.uiComponents.renderChatHistory(history, {
        placeholder: 'No messages yet. Start the conversation!',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.uiComponents.renderChatHistory([], {
        placeholder: `Failed to load chat: ${message}`,
      });
    } finally {
      focusElement(this.elements.messageInput);
    }
  }

  private async handleMessageSubmit(): Promise<void> {
    const question = this.elements.messageInput.value.trim();
    const state = stateManager.getState();

    if (!question || state.isSending || !chatService.canSendMessages()) {
      return;
    }

    let historyKey = stateManager.getActiveHistoryKey();
    this.elements.messageInput.value = '';
    
    let animationId: number | null = null;

    try {
      // Start the sendMessage process (this adds user message and placeholder to state immediately)
      const sendPromise = chatService.sendMessage(
        question,
        // onDelta
        () => {
          // Update historyKey in case it changed during streaming
          historyKey = stateManager.getActiveHistoryKey();
          this.uiComponents.renderChatHistory(stateManager.getHistory(historyKey));
        },
        // onComplete
        async (chatId: string) => {
          // Update historyKey to the final chatId
          historyKey = chatId || stateManager.getActiveHistoryKey();
          if (animationId !== null) {
            stateManager.stopPendingAnimation(animationId.toString());
          }
          this.uiComponents.renderChatHistory(stateManager.getHistory(historyKey));
          await chatService.refreshActiveChatMetadata();
          
          // Update chat title if we have a new chat
          const updatedState = stateManager.getState();
          if (updatedState.selectedChatId) {
            const activeChat = updatedState.chats.find(
              (chat) => chat.chatId === updatedState.selectedChatId
            );
            if (activeChat) {
              this.elements.chatPanelTitle.textContent = activeChat.title || 'Untitled chat';
            }
          }
        }
      );

      // Show user message and placeholder immediately (they're now in state)
      this.uiComponents.renderChatHistory(stateManager.getHistory(historyKey));

      // Start animation for pending message
      const pendingState = stateManager.getState();
      const pendingId = pendingState.pendingAssistantByChatId[historyKey];
      if (pendingId) {
        animationId = this.uiComponents.startPendingStatusAnimation(pendingId);
        stateManager.startPendingAnimation(pendingId, animationId);
      }

      // Wait for the message to complete
      await sendPromise;

    } catch (error) {
      console.error('Failed to send message:', error);
      // Use the current active history key in case it changed
      historyKey = stateManager.getActiveHistoryKey();
      this.uiComponents.renderChatHistory(stateManager.getHistory(historyKey));
    } finally {
      this.updateComposerState();
    }
  }

  private updateComposerState(): void {
    const state = stateManager.getState();
    const canSend = chatService.canSendMessages();
    
    this.uiComponents.updateComposerState(
      this.elements.messageInput,
      this.elements.sendButton,
      canSend,
      state.isSending
    );
  }
}

// Initialize the application
const app = new App();
app.initialize().catch(console.error);