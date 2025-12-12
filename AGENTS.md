# Agents Overview

This repository hosts two cooperating Spring Boot applications (plus a lightweight UI) that demonstrate how to build AI-assisted workflows for a fictional dog adoption agency, **Pooch Palace**.

## Repository layout

| Folder | Description |
| --- | --- |
| `assistant/` | Spring Boot web application that exposes REST endpoints and an AI chat assistant powered by Spring AI plus a chat-directory API for the UI. |
| `mcp-server/` | Spring Boot application that exposes MCP tools—currently a scheduling tool that downstream agents can call to book adoption pickups. |
| `ui/` | TypeScript web interface that exercises the assistant/chat directory APIs. |
| `http/` | Example HTTP requests for manual testing. |
| `.env`, `docker-compose.yaml` | Helper files for local infrastructure (PostgreSQL vector store + supporting services). |

## Assistant application (`assistant/`)

* **Purpose**: Provide an AI assistant that helps prospective adopters find available dogs, ask follow-up questions, and keep a persistent conversation history.
* **Primary endpoints**:
  * `GET /dogs` – lists all dogs in the repository.
  * `GET /ask?question=...` – routes the user’s question through the assistant. Requires the `X-User-Id` header and optional `chatId` to scope chat memory.
* **Chat directory endpoints** (consumed by the UI):
  * `GET /users` – lists all known demo users.
  * `GET /chats` – lists chats for the requesting user (via `X-User-Id`).
  * `GET /chats/{chatId}` – returns the persisted message history for a chat.
* **Chat configuration**:
  * Uses `ChatClient` beans configured with `AssistantConstants.ASSISTANT_SYSTEM_PROMPT` plus two advisors: `QuestionAnswerAdvisor` for pgvector-backed retrieval and `PromptChatMemoryAdvisor` for JDBC chat memory.
  * Registers MCP tool callbacks so the assistant can invoke remote tools (e.g., scheduling) while responding.
  * Generates short, title-case chat titles by calling a dedicated `summarizeClient` when a conversation is first saved.
* **Data flow**: Dog data lives in the application database. When the `embedding` profile is active, an `ApplicationRunner` pushes dog records into the vector store for retrieval-augmented answers.
* **Database prerequisites**: Before running the assistant, ensure the target Postgres database has the application schema and pgvector extension created:

  ```sql
  CREATE SCHEMA IF NOT EXISTS ${DB_SCHEMA};

  CREATE EXTENSION IF NOT EXISTS vector;
  ```

## Scheduler MCP service (`mcp-server/`)

* **Purpose**: Provide MCP tools that the assistant (or other agents) can invoke over SSE. Currently includes `DogAdoptionScheduler`.
* **Tools**:
  * `schedule(dogId, dogName)` – returns an ISO timestamp three days in the future to represent an adoption pickup, using `@McpTool` and `@McpArg` annotations for schema publishing.
* **Logging**: Each scheduling request logs the requested dog and the proposed pickup timestamp.

## How the pieces interact

1. The UI (or an API caller) retrieves demo users via `/users`, selects one, and loads their chat summaries plus history via `/chats` + `/chats/{chatId}`.
2. When the user sends a message, the UI calls `/ask?question=...` with `X-User-Id` and optional `chatId`. `ChatAssistantService` resolves or creates the chat, routes the question through `dogAssistantChatClient`, and persists the answer/title in the database.
3. The `dogAssistantChatClient` prompt uses the system instructions, vector-store grounding, and chat-memory advisor scoped by `ChatMemory.CONVERSATION_ID`. If the model decides to schedule a pickup, it calls the MCP `schedule` tool hosted by `mcp-server`, receives a timestamp, and weaves it into the final reply.

## Development roadmap

* **Data enhancement**: Seed realistic dog data in `assistant` and re-run with the `embedding` profile to refresh the vector store.
* **MCP expansion**: Extend `mcp-server` with more MCP tools (e.g., cancel/reschedule appointments, notify adopters) and wire them into the assistant tool callbacks.
* **UI improvements**: Add authentication, live-streamed responses, and better error handling to the TypeScript interface.
* **Configuration**: Document all environment variables (OpenAI API key, database URLs, Ollama models) for easier onboarding.
