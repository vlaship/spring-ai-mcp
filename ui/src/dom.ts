import type { DOMElements } from './types.js';
import { DOM_SELECTORS } from './constants.js';

function getRequiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return element;
}

function getOptionalElement<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

export function getDOMElements(): DOMElements {
  return {
    userSelect: getRequiredElement<HTMLSelectElement>(DOM_SELECTORS.userSelect),
    chatList: getRequiredElement<HTMLElement>(DOM_SELECTORS.chatList),
    chatCount: getRequiredElement<HTMLElement>(DOM_SELECTORS.chatCount),
    newChatButton: getRequiredElement<HTMLButtonElement>(DOM_SELECTORS.newChatButton),
    chatPanelTitle: getRequiredElement<HTMLElement>(DOM_SELECTORS.chatPanelTitle),
    chatHistory: getRequiredElement<HTMLElement>(DOM_SELECTORS.chatHistory),
    messageForm: getRequiredElement<HTMLFormElement>(DOM_SELECTORS.messageForm),
    messageInput: getRequiredElement<HTMLTextAreaElement>(DOM_SELECTORS.messageInput),
    sendButton: getRequiredElement<HTMLButtonElement>(DOM_SELECTORS.sendButton),
    themeToggleButton: getOptionalElement<HTMLButtonElement>(DOM_SELECTORS.themeToggleButton),
    themeToggleText: getOptionalElement<HTMLElement>(DOM_SELECTORS.themeToggleText),
  };
}

export function focusElement(element: HTMLElement | null): void {
  if (element && 'focus' in element) {
    element.focus();
  }
}

export function scrollToBottom(element: HTMLElement, smooth = false): void {
  element.scrollTo({
    top: element.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  });
}