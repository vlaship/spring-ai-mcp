export interface User {
  readonly userId: string;
  readonly name: string;
}

export interface Chat {
  readonly chatId: string;
  readonly title: string | null;
  readonly createdAt: string;
}

export interface Message {
  readonly id: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly timestamp: string | null;
  readonly status: MessageStatus;
}

export type MessageRole = 'assistant' | 'user' | 'system' | 'tool';
export type MessageStatus = 'complete' | 'pending' | 'streaming';

export interface ChatHistoryResponse {
  readonly role: string;
  readonly content: string;
  readonly timestamp: string;
}

export interface StreamEvent {
  readonly chatId: string;
  readonly delta?: string;
  readonly done: boolean;
  readonly answer?: string;
  readonly error?: string;
}

export interface AskResponse {
  readonly chatId: string;
  readonly answer: string;
}

export interface AppState {
  readonly users: readonly User[];
  readonly chats: readonly Chat[];
  readonly selectedUserId: string | null;
  readonly selectedChatId: string | null;
  readonly historyByChatId: Record<string, Message[]>;
  readonly isSending: boolean;
  readonly isComposingNewChat: boolean;
  readonly pendingAssistantByChatId: Record<string, string>;
  readonly pendingAssistantIntervals: Record<string, number>;
}

export enum Theme {
  AUTO = 'auto',
  DAY = 'day',
  NIGHT = 'night'
}

export interface UIConfig {
  readonly assistantBaseUrl?: string;
}

export interface DOMElements {
  readonly userSelect: HTMLSelectElement;
  readonly chatList: HTMLElement;
  readonly chatCount: HTMLElement;
  readonly newChatButton: HTMLButtonElement;
  readonly chatPanelTitle: HTMLElement;
  readonly chatHistory: HTMLElement;
  readonly messageForm: HTMLFormElement;
  readonly messageInput: HTMLTextAreaElement;
  readonly sendButton: HTMLButtonElement;
  readonly themeToggleButton: HTMLButtonElement | null;
  readonly themeToggleText: HTMLElement | null;
}

export interface RenderOptions {
  readonly placeholder?: string;
}

export interface ThemeOptions {
  readonly skipPersist?: boolean;
}

export interface MessageOverrides {
  readonly status?: MessageStatus;
  readonly timestamp?: string | null;
}