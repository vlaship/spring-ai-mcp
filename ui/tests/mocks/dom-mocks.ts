import { vi } from 'vitest';

/**
 * DOM and Browser API mocks for testing
 */

// Mock localStorage
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Mock sessionStorage
export const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Mock fetch API
export const mockFetch = vi.fn();

// Mock console methods
export const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  trace: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn(),
  time: vi.fn(),
  timeEnd: vi.fn()
};

// Store original functions before mocking
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
const originalSetInterval = globalThis.setInterval;
const originalClearInterval = globalThis.clearInterval;

// Mock window methods
export const mockWindow = {
  alert: vi.fn(),
  confirm: vi.fn(() => true),
  prompt: vi.fn(() => 'test'),
  open: vi.fn(),
  close: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  scrollTo: vi.fn(),
  scrollBy: vi.fn(),
  requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
    originalSetTimeout(callback, 16);
    return 1;
  }),
  cancelAnimationFrame: vi.fn(),
  setTimeout: vi.fn((callback: Function, delay: number) => {
    return originalSetTimeout(callback, delay);
  }),
  clearTimeout: vi.fn((id: number) => {
    originalClearTimeout(id);
  }),
  setInterval: vi.fn().mockImplementation((callback: Function, delay: number) => {
    return originalSetInterval(callback, delay);
  }),
  clearInterval: vi.fn((id: number) => {
    originalClearInterval(id);
  })
};

// Mock document methods
export const mockDocument = {
  createElement: vi.fn((tagName: string) => {
    const element = document.createElement(tagName);
    return element;
  }),
  getElementById: vi.fn((id: string) => {
    return document.getElementById(id);
  }),
  querySelector: vi.fn((selector: string) => {
    return document.querySelector(selector);
  }),
  querySelectorAll: vi.fn((selector: string) => {
    return document.querySelectorAll(selector);
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
};

// Mock IntersectionObserver
export const mockIntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock ResizeObserver
export const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock MutationObserver
export const mockMutationObserver = vi.fn((callback: MutationCallback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => [])
}));

// Mock URL and URLSearchParams
export const mockURL = vi.fn((url: string, base?: string) => {
  try {
    return new URL(url, base);
  } catch {
    return {
      href: url,
      origin: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
      searchParams: new URLSearchParams()
    };
  }
});

export const mockURLSearchParams = vi.fn((init?: string | URLSearchParams) => {
  return new URLSearchParams(init);
});

// Mock MediaQueryList
export const mockMediaQueryList = {
  matches: false,
  media: '',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn()
};

// Mock matchMedia
export const mockMatchMedia = vi.fn((query: string) => mockMediaQueryList);

// Mock Clipboard API
export const mockClipboard = {
  writeText: vi.fn(() => Promise.resolve()),
  readText: vi.fn(() => Promise.resolve('mocked clipboard text')),
  write: vi.fn(() => Promise.resolve()),
  read: vi.fn(() => Promise.resolve([]))
};

// Mock Notification API
export const mockNotification = vi.fn((title: string, options?: NotificationOptions) => ({
  title,
  body: options?.body || '',
  icon: options?.icon || '',
  close: vi.fn(),
  onclick: null,
  onclose: null,
  onerror: null,
  onshow: null
}));

// Mock Geolocation API
export const mockGeolocation = {
  getCurrentPosition: vi.fn((success: PositionCallback, error?: PositionErrorCallback) => {
    const position = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    };
    setTimeout(() => success(position), 10);
  }),
  watchPosition: vi.fn(() => 1),
  clearWatch: vi.fn()
};

// Mock Performance API
export const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn()
};

// Mock File API
export const mockFile = vi.fn((fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) => ({
  name: fileName,
  size: 1024,
  type: options?.type || 'text/plain',
  lastModified: options?.lastModified || Date.now(),
  arrayBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(1024))),
  text: vi.fn(() => Promise.resolve('mock file content')),
  stream: vi.fn(() => new ReadableStream())
}));

// Mock FileReader API
export const mockFileReader = vi.fn(() => ({
  readAsText: vi.fn(),
  readAsDataURL: vi.fn(),
  readAsArrayBuffer: vi.fn(),
  abort: vi.fn(),
  result: null,
  error: null,
  readyState: 0,
  onload: null,
  onerror: null,
  onabort: null,
  onloadstart: null,
  onloadend: null,
  onprogress: null
}));

// Setup function to apply all DOM mocks
export function setupDOMMocks() {
  // Apply localStorage mock
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });

  // Apply sessionStorage mock
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true
  });

  // Apply fetch mock
  global.fetch = mockFetch;

  // Apply console mocks
  Object.assign(console, mockConsole);

  // Apply window method mocks (excluding timer functions to avoid conflicts)
  const { setTimeout, clearTimeout, setInterval, clearInterval, ...windowMethodsToMock } = mockWindow;
  Object.assign(window, windowMethodsToMock);

  // Apply observer mocks
  global.IntersectionObserver = mockIntersectionObserver;
  global.ResizeObserver = mockResizeObserver;
  global.MutationObserver = mockMutationObserver;

  // Apply URL mocks
  global.URL = mockURL as any;
  global.URLSearchParams = mockURLSearchParams as any;

  // Apply matchMedia mock
  window.matchMedia = mockMatchMedia;

  // Apply additional browser API mocks
  if (navigator) {
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true
    });
    
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true
    });
  }

  // Apply global API mocks
  global.Notification = mockNotification as any;
  global.performance = mockPerformance as any;
  global.File = mockFile as any;
  global.FileReader = mockFileReader as any;
}

// Cleanup function to reset all mocks
export function cleanupDOMMocks() {
  vi.clearAllMocks();
  
  // Reset localStorage
  mockLocalStorage.clear();
  
  // Reset sessionStorage
  mockSessionStorage.clear();
}

// Export all mocks as a single object
export const domMocks = {
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  fetch: mockFetch,
  console: mockConsole,
  window: mockWindow,
  document: mockDocument,
  IntersectionObserver: mockIntersectionObserver,
  ResizeObserver: mockResizeObserver,
  MutationObserver: mockMutationObserver,
  URL: mockURL,
  URLSearchParams: mockURLSearchParams,
  matchMedia: mockMatchMedia,
  clipboard: mockClipboard,
  notification: mockNotification,
  geolocation: mockGeolocation,
  performance: mockPerformance,
  file: mockFile,
  fileReader: mockFileReader,
  setup: setupDOMMocks,
  cleanup: cleanupDOMMocks
};