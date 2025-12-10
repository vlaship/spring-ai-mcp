import type { User, Chat, ChatHistoryResponse, StreamEvent } from './types.js';
import { normalizeBaseUrl, getUIConfig, inferAssistantBaseUrl } from './utils.js';

const API_BASE_URL = normalizeBaseUrl(
  getUIConfig().assistantBaseUrl ?? inferAssistantBaseUrl()
);

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly historyKey?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function tryReadError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body?.message) {
      return body.message;
    }
  } catch (error) {
    // ignore JSON parsing errors
  }
  return `${response.status} ${response.statusText}`;
}

async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await tryReadError(response);
    throw new ApiError(message, response.status);
  }

  return response.json();
}

export async function fetchUsers(): Promise<readonly User[]> {
  return fetchJson<User[]>('/users');
}

export async function fetchChats(userId: string): Promise<readonly Chat[]> {
  return fetchJson<Chat[]>('/chats', {
    headers: {
      'X-User-Id': userId,
    },
  });
}

export async function fetchChatHistory(
  chatId: string,
  userId: string
): Promise<readonly ChatHistoryResponse[]> {
  return fetchJson<ChatHistoryResponse[]>(`/chats/${chatId}`, {
    headers: {
      'X-User-Id': userId,
    },
  });
}

export interface StreamAssistantOptions {
  readonly question: string;
  readonly userId: string;
  readonly chatId?: string;
}

export async function* streamAssistantResponse(
  options: StreamAssistantOptions
): AsyncGenerator<StreamEvent, void, unknown> {
  const { question, userId, chatId } = options;
  
  const params = new URLSearchParams({ question });
  if (chatId) {
    params.append('chatId', chatId);
  }

  const response = await fetch(`${API_BASE_URL}/ask/stream?${params.toString()}`, {
    headers: {
      Accept: 'application/x-ndjson',
      'X-User-Id': userId,
    },
  });

  if (!response.ok) {
    const message = await tryReadError(response);
    throw new ApiError(message, response.status);
  }

  if (!response.body) {
    throw new ApiError('Streaming not supported in this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          const trimmed = line.trim();
          if (!trimmed) {
            continue;
          }

          let event: StreamEvent;
          try {
            event = JSON.parse(trimmed);
          } catch (parseError) {
            console.error('Failed to parse stream chunk', parseError, trimmed);
            continue;
          }

          if (event.error) {
            throw new ApiError(event.error);
          }

          yield event;

          if (event.done) {
            return;
          }
        }
      }

      if (done) {
        const remaining = buffer.trim();
        if (remaining) {
          try {
            const event: StreamEvent = JSON.parse(remaining);
            if (event.error) {
              throw new ApiError(event.error);
            }
            yield event;
          } catch (parseError) {
            console.error('Failed to parse final stream chunk', parseError, remaining);
          }
        }
        break;
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch (releaseError) {
      // ignore release issues
    }
  }
}