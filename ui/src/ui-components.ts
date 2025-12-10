import type { User, Chat, Message, RenderOptions } from './types.js';
import { CSS_CLASSES, MAX_HISTORY_MESSAGES, ANIMATION_INTERVAL_MS, PENDING_DOTS_MAX } from './constants.js';
import { formatTimestamp, formatBubbleTimestamp, formatRole } from './utils.js';
import { scrollToBottom } from './dom.js';

export class UIComponents {
  constructor(
    private readonly chatList: HTMLElement,
    private readonly chatCount: HTMLElement,
    private readonly chatHistory: HTMLElement
  ) {}

  populateUserSelect(userSelect: HTMLSelectElement, users: readonly User[]): void {
    userSelect.innerHTML = '';

    if (!users.length) {
      const option = document.createElement('option');
      option.textContent = 'No users found';
      option.disabled = true;
      userSelect.appendChild(option);
      userSelect.disabled = true;
      return;
    }

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a user';
    placeholder.selected = true;
    placeholder.disabled = true;
    userSelect.appendChild(placeholder);

    users.forEach((user) => {
      const option = document.createElement('option');
      option.value = user.userId;
      option.textContent = user.name;
      userSelect.appendChild(option);
    });

    userSelect.disabled = false;
  }

  setUserSelectLoading(userSelect: HTMLSelectElement): void {
    userSelect.innerHTML = '';
    const option = document.createElement('option');
    option.textContent = 'Loading users…';
    option.disabled = true;
    option.selected = true;
    userSelect.appendChild(option);
    userSelect.disabled = true;
  }

  setUserSelectError(userSelect: HTMLSelectElement, message: string): void {
    userSelect.innerHTML = '';
    const option = document.createElement('option');
    option.textContent = `Failed to load users (${message})`;
    option.disabled = true;
    option.selected = true;
    userSelect.appendChild(option);
    userSelect.disabled = true;
  }

  renderChats(chats: readonly Chat[], activeChatId: string | null): void {
    this.chatList.innerHTML = '';
    this.chatCount.textContent = chats.length.toString();

    if (!chats.length) {
      this.renderChatPlaceholder('No chats yet. Start one to begin the conversation!');
      return;
    }

    const fragment = document.createDocumentFragment();

    chats
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach((chat) => {
        const card = this.createChatCard(chat, activeChatId === chat.chatId);
        fragment.appendChild(card);
      });

    this.chatList.appendChild(fragment);
  }

  private createChatCard(chat: Chat, isActive: boolean): HTMLElement {
    const card = document.createElement('article');
    card.className = CSS_CLASSES.chatCard;
    card.dataset.chatId = chat.chatId;
    
    if (isActive) {
      card.classList.add(CSS_CLASSES.chatCardActive);
    }

    const title = document.createElement('h3');
    title.className = 'chat-card__title';
    title.textContent = chat.title || 'Untitled chat';

    const timestamp = document.createElement('span');
    timestamp.className = 'chat-card__timestamp';
    timestamp.textContent = formatTimestamp(chat.createdAt);

    card.appendChild(title);
    card.appendChild(timestamp);

    return card;
  }

  renderChatPlaceholder(message: string): void {
    this.chatList.innerHTML = '';
    const placeholder = document.createElement('div');
    placeholder.className = CSS_CLASSES.emptyState;
    placeholder.textContent = message;
    this.chatList.appendChild(placeholder);
  }

  renderChatHistory(messages: readonly Message[], options: RenderOptions = {}): void {
    this.chatHistory.innerHTML = '';

    if (!messages.length) {
      const placeholder = document.createElement('div');
      placeholder.className = `${CSS_CLASSES.emptyState} ${CSS_CLASSES.emptyStateLight}`;
      placeholder.textContent = options.placeholder || 'No messages yet. Start the conversation!';
      this.chatHistory.appendChild(placeholder);
      return;
    }

    const visibleMessages = messages.slice(-MAX_HISTORY_MESSAGES);
    const fragment = document.createDocumentFragment();

    visibleMessages.forEach((message) => {
      const bubble = this.createChatBubble(message);
      fragment.appendChild(bubble);
    });

    this.chatHistory.appendChild(fragment);
    scrollToBottom(this.chatHistory);
  }

  private createChatBubble(message: Message): HTMLElement {
    const bubble = document.createElement('article');
    bubble.className = `${CSS_CLASSES.chatBubble} ${CSS_CLASSES.chatBubble}--${message.role}`;
    bubble.dataset.messageId = message.id;

    const roleLabel = document.createElement('header');
    roleLabel.className = CSS_CLASSES.chatBubbleRole;
    roleLabel.textContent = formatRole(message.role);

    const body = document.createElement('p');
    body.className = CSS_CLASSES.chatBubbleText;
    body.textContent = message.content;

    if (message.status === 'pending') {
      const inlineStatus = document.createElement('span');
      inlineStatus.className = CSS_CLASSES.chatBubbleInlineStatus;

      const statusText = document.createElement('span');
      statusText.className = CSS_CLASSES.chatBubbleInlineStatusText;
      statusText.textContent = 'Thinking';

      inlineStatus.appendChild(statusText);
      body.appendChild(inlineStatus);
    }

    bubble.appendChild(roleLabel);
    bubble.appendChild(body);

    if (message.timestamp) {
      const time = document.createElement('time');
      time.className = CSS_CLASSES.chatBubbleTimestamp;
      time.dateTime = message.timestamp;
      time.textContent = formatBubbleTimestamp(message.timestamp);
      bubble.appendChild(time);
    }

    return bubble;
  }

  startPendingStatusAnimation(messageId: string): number {
    let frame = 0;
    const updateText = () => {
      const statusText = this.chatHistory.querySelector(
        `[data-message-id="${messageId}"] .${CSS_CLASSES.chatBubbleInlineStatusText}`
      );
      if (!statusText) {
        return;
      }
      const dots = '.'.repeat((frame % PENDING_DOTS_MAX) + 1);
      statusText.textContent = `Thinking${dots}`;
      frame += 1;
    };
    
    updateText();
    return window.setInterval(updateText, ANIMATION_INTERVAL_MS);
  }

  updateComposerState(
    messageInput: HTMLTextAreaElement,
    sendButton: HTMLButtonElement,
    canSend: boolean,
    isSending: boolean
  ): void {
    const hasText = Boolean(messageInput.value.trim());
    const enabled = canSend && hasText && !isSending;
    
    messageInput.disabled = !canSend || isSending;
    sendButton.disabled = !enabled;
  }
}

export function createUIComponents(
  chatList: HTMLElement,
  chatCount: HTMLElement,
  chatHistory: HTMLElement
): UIComponents {
  return new UIComponents(chatList, chatCount, chatHistory);
}