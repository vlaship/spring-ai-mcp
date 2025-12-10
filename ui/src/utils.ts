import type { MessageRole, UIConfig } from './types.js';
import { DEFAULT_ASSISTANT_BASE_URL } from './constants.js';

export function normalizeRole(role: string | undefined): MessageRole {
  if (!role) {
    return 'assistant';
  }
  const normalized = role.toLowerCase();
  if (['assistant', 'user', 'system', 'tool'].includes(normalized)) {
    return normalized as MessageRole;
  }
  return 'assistant';
}

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatBubbleTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatRole(role: MessageRole): string {
  switch (role) {
    case 'assistant':
      return 'Assistant';
    case 'system':
      return 'System';
    default:
      return 'You';
  }
}

export function generateMessageId(): string {
  return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function isLocalHostname(hostname = ''): boolean {
  const normalized = hostname.toLowerCase();

  if (
    normalized === '' ||
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '0.0.0.0'
  ) {
    return true;
  }

  if (
    normalized.startsWith('192.168.') ||
    normalized.startsWith('10.') ||
    normalized.startsWith('172.') ||
    normalized.endsWith('.local')
  ) {
    return true;
  }

  return false;
}

export function inferAssistantBaseUrl(): string {
  const { hostname, origin, protocol } = window.location;

  const isFileOrigin = protocol === 'file:' || origin?.startsWith('file://');
  if (!origin || origin === 'null' || isFileOrigin) {
    return DEFAULT_ASSISTANT_BASE_URL;
  }

  if (isLocalHostname(hostname)) {
    return DEFAULT_ASSISTANT_BASE_URL;
  }

  return `${origin}/proposal-assistant-service`;
}

export function normalizeBaseUrl(value: string | undefined): string {
  if (!value) {
    return '';
  }

  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function getUIConfig(): UIConfig {
  return (window as any).UI_CONFIG ?? {};
}

export function readStoredThemePreference(): string | null {
  try {
    return localStorage.getItem('pooch-palace-theme');
  } catch (error) {
    return null;
  }
}

export function persistThemePreference(theme: string): void {
  try {
    localStorage.setItem('pooch-palace-theme', theme);
  } catch (error) {
    // ignore write errors (e.g., storage disabled)
  }
}