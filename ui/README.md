# Pooch Palace UI - TypeScript Implementation

A modern TypeScript rewrite of the Pooch Palace AI Assistant UI, following best practices for maintainable and type-safe frontend development.

## Features

- **Full TypeScript Implementation**: Strict type checking with comprehensive type definitions
- **Modular Architecture**: Clean separation of concerns with dedicated modules
- **Modern ES2020**: Uses latest JavaScript features with proper module system
- **Type Safety**: Comprehensive interfaces and strict null checks
- **Error Handling**: Robust error handling with custom error types
- **State Management**: Centralized state management with immutable updates
- **Theme Support**: Auto/Day/Night theme switching with system preference detection
- **Streaming Support**: Real-time chat streaming with proper async generators
- **Accessibility**: ARIA labels and semantic HTML structure

## Architecture

### Core Modules

- **`types.ts`** - Comprehensive type definitions for all data structures
- **`constants.ts`** - Application constants and configuration
- **`utils.ts`** - Pure utility functions for data transformation
- **`api.ts`** - HTTP client with streaming support and error handling
- **`state.ts`** - Centralized state management with immutable updates
- **`theme.ts`** - Theme management with system preference detection
- **`dom.ts`** - DOM utilities and element management
- **`ui-components.ts`** - Reusable UI component rendering
- **`chat-service.ts`** - Business logic for chat operations
- **`app.ts`** - Main application controller and event coordination

### Key Design Principles

1. **Type Safety First**: Every function, parameter, and return value is properly typed
2. **Immutable State**: State updates create new objects rather than mutating existing ones
3. **Error Boundaries**: Comprehensive error handling with typed error classes
4. **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
5. **Modern JavaScript**: Uses ES2020 features like optional chaining, nullish coalescing
6. **Async/Await**: Proper async handling with generators for streaming

## Build System

### Scripts

- `npm run build` - Compile TypeScript and copy assets
- `npm run build:watch` - Watch mode for development
- `npm run dev` - Build and copy assets for development
- `npm run clean` - Remove build artifacts
- `npm run type-check` - Type checking without compilation

### TypeScript Configuration

- **Target**: ES2020 for modern browser support
- **Strict Mode**: All strict type checking options enabled
- **Module System**: ES2020 modules with proper imports/exports
- **Source Maps**: Full source map support for debugging
- **Declaration Files**: Generated for potential library usage

## File Structure

```
ui/
├── src/                 # TypeScript source files
│   ├── types.ts         # Type definitions
│   ├── constants.ts     # Application constants
│   ├── utils.ts         # Pure utility functions
│   ├── api.ts          # HTTP client & streaming
│   ├── state.ts        # State management
│   ├── theme.ts        # Theme management
│   ├── dom.ts          # DOM utilities
│   ├── ui-components.ts # UI rendering
│   ├── chat-service.ts # Business logic
│   ├── app.ts          # Main application
│   ├── index.html      # HTML template
│   └── styles.css      # Stylesheet
├── dist/               # Compiled output (generated)
├── index.html          # Main HTML file (points to dist/)
├── package.json        # Dependencies & scripts
├── tsconfig.json       # TypeScript config
└── README.md          # Documentation
```

## Usage

### Development

```bash
# Install dependencies
npm install

# Build and serve the application
npm start

# Development mode (build + serve)
npm run dev

# Watch mode with server (rebuilds on changes)
npm run dev:watch

# Just build the project
npm run build

# Just serve the built application
npm run serve
```

### Development Server

The UI includes a lightweight TypeScript HTTP server (`src/server.ts`) that compiles to CommonJS (`dist/server.cjs`) and:

- Serves static files from the root directory and `dist/` folder
- Enables CORS headers for API integration
- Provides cache-busting headers for development
- Runs on `http://localhost:3000` by default
- **Reads configuration from root `.env` file**
- Injects configuration into HTML as `window.UI_CONFIG`

#### Environment Variables

**Server Configuration:**
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: localhost)

**API Configuration (from root `.env`):**
- `ASSISTANT_URL` - Spring Boot assistant service URL
  - Used by the UI to connect to the backend API
  - Example: `http://localhost:8081/proposal-assistant-service`
  - Automatically injected into the frontend as `window.UI_CONFIG.assistantBaseUrl`

### Production

The built files in `dist/` are ready for production deployment. The main `index.html` file in the root directory points to the compiled assets:

- `dist/index.html` - Built HTML file
- `dist/app.js` - Main application bundle
- `dist/styles.css` - Stylesheet
- `dist/*.js` - Individual module files
- `dist/*.d.ts` - TypeScript declaration files
- `dist/*.js.map` - Source maps for debugging

The root `index.html` file is configured to load the compiled TypeScript modules from the `dist/` directory.

## API Integration

The UI integrates with the Spring Boot assistant service through:

- **User Management**: `GET /users` - Load available demo users
- **Chat Management**: `GET /chats` - Load user's chat history
- **Chat History**: `GET /chats/{chatId}` - Load specific chat messages
- **Streaming Chat**: `GET /ask/stream` - Real-time chat with SSE streaming

### Headers

- `X-User-Id`: Required for all chat-related requests
- `Accept: application/x-ndjson`: For streaming responses

## Type Definitions

### Core Types

```typescript
interface User {
  readonly userId: string;
  readonly name: string;
}

interface Chat {
  readonly chatId: string;
  readonly title: string | null;
  readonly createdAt: string;
}

interface Message {
  readonly id: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly timestamp: string | null;
  readonly status: MessageStatus;
}

type MessageRole = 'assistant' | 'user' | 'system' | 'tool';
type MessageStatus = 'complete' | 'pending' | 'streaming';
```

### State Management

The application uses a centralized state manager with immutable updates:

```typescript
interface AppState {
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
```

## Browser Support

- Modern browsers supporting ES2020
- Native ES modules support required
- Fetch API and ReadableStream support for streaming
- CSS Grid and Flexbox support
- LocalStorage for theme preferences

## Migration from JavaScript

This TypeScript implementation maintains full compatibility with the original JavaScript version while adding:

- Comprehensive type safety
- Better IDE support with IntelliSense
- Compile-time error detection
- Improved maintainability
- Self-documenting code through types
- Better refactoring support

The API contracts and UI behavior remain identical to ensure seamless integration with the existing Spring Boot backend services.