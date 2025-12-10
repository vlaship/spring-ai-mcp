export const DEFAULT_ASSISTANT_BASE_URL = 'http://localhost:8083/proposal-assistant-service';

export const DRAFT_CHAT_KEY = '__draft';
export const MAX_HISTORY_MESSAGES = 40;
export const THEME_STORAGE_KEY = 'pooch-palace-theme';

export const ANIMATION_INTERVAL_MS = 400;
export const PENDING_DOTS_MAX = 3;

export const DOM_SELECTORS = {
  userSelect: '#userSelect',
  chatList: '#chatList',
  chatCount: '#chatCount',
  newChatButton: '#newChat',
  chatPanelTitle: '#chatPanelTitle',
  chatHistory: '#chatHistory',
  messageForm: '#messageForm',
  messageInput: '#messageInput',
  sendButton: '#sendMessage',
  themeToggleButton: '#themeToggle',
  themeToggleText: '#themeToggleText'
} as const;

export const CSS_CLASSES = {
  chatCard: 'chat-card',
  chatCardActive: 'chat-card--active',
  chatBubble: 'chat-bubble',
  chatBubbleRole: 'chat-bubble__role',
  chatBubbleText: 'chat-bubble__text',
  chatBubbleTimestamp: 'chat-bubble__timestamp',
  chatBubbleInlineStatus: 'chat-bubble__inline-status',
  chatBubbleInlineStatusText: 'chat-bubble__inline-status-text',
  emptyState: 'empty-state',
  emptyStateLight: 'empty-state--light',
  themeDark: 'theme-dark'
} as const;