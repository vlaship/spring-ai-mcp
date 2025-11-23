# Pooch Palace – Spring AI MCP Agents

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java Version](https://img.shields.io/badge/Java-25-orange)](https://www.oracle.com/java/technologies/javase-downloads.html)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.8-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Spring AI](https://img.shields.io/badge/Spring%20AI-1.1.0-blue.svg)](https://docs.spring.io/spring-ai/reference/)

Demo workspace for building AI-assisted workflows at **Pooch Palace**, a fictional dog adoption agency. The repo contains:

* A Spring AI **assistant service** that exposes REST endpoints, persists chat history, performs RAG over pgvector, and calls MCP tools.
* A Spring AI **MCP server** that publishes a scheduling tool over SSE.
* A lightweight **HTML/JS UI** that exercises the APIs.

## Repository layout

| Folder | Description |
| --- | --- |
| `assistant/` | Spring Boot assistant + chat directory APIs (`/dogs`, `/ask`, `/users`, `/chats`). |
| `mcp-server/` | Spring Boot MCP server hosting the `DogAdoptionScheduler` tool. |
| `ui/` | Static console for selecting demo users, browsing chats, and messaging the assistant. |
| `http/` | Ready-to-run HTTPie/cURL samples. |
| `pgdata/` | Local PostgreSQL volume for pgvector. |
| `docker-compose.yaml`, `.env`, `example.env` | Infra helpers for Postgres + Ollama. |

## Architecture highlights

1. **Assistant service** routes user questions through Spring AI `ChatClient`, layering vector-store grounding and JDBC chat memory (@assistant/src/main/java/com/example/assistant/config/AssistantConfiguration.java#29-83). It also generates concise chat titles using a separate summarization client (@assistant/src/main/java/com/example/assistant/service/ChatAssistantService.java#31-93).
2. **Scheduler MCP server** exposes a single `schedule(dogId, dogName)` tool that returns an ISO timestamp three days out (@mcp-server/src/main/java/com/example/scheduler/mcp/DogAdoptionScheduler.java#12-35). The assistant invokes it via Sync MCP tool callbacks.
3. **UI** presents demo users, chat summaries, and streaming-like message updates. It auto-detects the assistant base URL or falls back to `http://localhost:8083/proposal-assistant-service` (@ui/app.js#1-150).

## Assistant service (`assistant/`)

### Core features

* **Dog discovery** – `GET /dogs` lists adoptable dogs directly from the relational database (@assistant/src/main/java/com/example/assistant/web/AssistantController.java#32-36).
* **Conversational Q&A** – `GET /ask?question=...` processes a user’s question using Spring AI, scoped by `X-User-Id` and optional `chatId` (@assistant/src/main/java/com/example/assistant/web/AssistantController.java#37-49).
* **Chat directory APIs** – `/users`, `/chats`, and `/chats/{chatId}` drive the UI by serving demo identities, chat summaries, and persisted message history (@assistant/src/main/java/com/example/assistant/web/ChatDirectoryController.java#27-44).

### Configuration

* **System + summary prompts** live in `AssistantConstants`, including the 5-word title prompt for newly created chats (@assistant/src/main/java/com/example/assistant/AssistantConstants.java#5-29).
* **Vector store**: pgvector via Spring AI, optionally seeded when the `embedding` profile is active (@assistant/src/main/java/com/example/assistant/config/AssistantConfiguration.java#72-84).
* **Chat memory**: JDBC-backed `PromptChatMemoryAdvisor` scoped by `ChatMemory.CONVERSATION_ID` (@assistant/src/main/java/com/example/assistant/config/AssistantConfiguration.java#50-70).
* **MCP integration**: registered through `SyncMcpToolCallbackProvider`, enabling model-initiated scheduling tool calls (@assistant/src/main/java/com/example/assistant/config/AssistantConfiguration.java#29-41).
* **Profiles**: `application.yml` holds shared settings, while `application-openai.yml` and `application-ollama.yml` configure different model providers. Use `--spring.profiles.active=openai` for OpenAI (`gpt-5-nano`, `text-embedding-3-small`) or `--spring.profiles.active=ollama` for local models.

### Persistence & infra

* Database + vector store share the same Postgres instance. Liquibase changelogs live under `assistant/src/main/resources/db/changelog/`.
* MCP SSE endpoint is configured via `spring.ai.mcp.client.sse.connections.scheduler.url` (`MCP_SERVER_URL`).
* Server port defaults to `8083` with context path `/proposal-assistant-service` (@assistant/src/main/resources/application.yml#1-57).

## Scheduler MCP service (`mcp-server/`)

* Runs on port `8082` (`/proposal-mcp-service`).
* Publishes the `DogAdoptionScheduler` tool which adds three days to `Instant.now()` and returns the ISO string (@mcp-server/src/main/java/com/example/scheduler/mcp/DogAdoptionScheduler.java#16-34).
* Built with `spring-ai-starter-mcp-server-webmvc`, making it consumable by the assistant’s MCP client.

## UI (`ui/`)

* Plain HTML + vanilla JS (no build step).
* Fetches `/users` to populate a dropdown, loads chats per user, and keeps per-chat history caches client-side (@ui/app.js#102-405).
* Sends messages via `/ask`, automatically linking newly created chats to the conversation once a response arrives (@ui/app.js#470-529).
* Includes a day/dark theme toggle that persists the selection in `localStorage` and updates all UI surfaces via CSS variables (@ui/app.js#16-711, @ui/styles.css#1-469, @ui/index.html#11-55).
* To host locally, serve the `ui/` directory with any static server (e.g., `npx http-server ui`).

## Local setup

### Prerequisites

* Java 25, Maven 3.9+
* Docker Desktop (for Postgres + Ollama)
* Optional: OpenAI API key
* Postgres role with privileges to run schema/extension setup:

  ```sql
  CREATE SCHEMA IF NOT EXISTS ${DB_SCHEMA};

  CREATE EXTENSION IF NOT EXISTS vector;
  ```

### 1. Configure environment

```
cp example.env .env
# update DB credentials / OPENAI_API_KEY / MCP_SERVER_URL as needed
```

### 2. Start infrastructure

```
docker compose up -d
```

This launches:

* Postgres + pgvector on `localhost:5432` with volume `./pgdata`
* Ollama on `localhost:11434` storing models under `./ollama`

### 3. Run the MCP server

```
cd mcp-server
mvn spring-boot:run
```

### 4. Run the assistant service

```
cd assistant
mvn spring-boot:run -Dspring-boot.run.profiles=ollama   # or openai
```

The assistant will connect to Postgres, Liquibase will apply schema + seed data, and (optionally) the `embedding` profile will push dog docs into pgvector.

### 5. Launch the UI (optional)

```
npx http-server ui --port 4173
# or use any static file host; UI auto-points to http://localhost:8083/proposal-assistant-service
```

## API quick start

* Base URL: `http://localhost:8083/proposal-assistant-service`
* Headers: `X-User-Id` (UUID of demo user from `/users`)

| Endpoint | Description |
| --- | --- |
| `GET /dogs` | Returns all dogs. |
| `GET /users` | Lists demo adopters. |
| `GET /chats` | Lists chats for `X-User-Id`. |
| `GET /chats/{chatId}` | Returns persisted messages (via chat memory repository). |
| `GET /ask?question=...&chatId=...` | Sends a question. Returns `{ chatId, answer }`. |

Sample request (HTTPie):

```bash
http "http://localhost:8083/proposal-assistant-service/ask" \
  X-User-Id:00000000-0000-0000-0000-000000000001 \
  question=="Tell me about calm dogs available this week"
```

## MCP tooling

The assistant registers a `schedule` tool provider tied to the MCP server connection named `scheduler`. When the LLM decides to book an adoption pickup, Spring AI auto-invokes the MCP server, receives the timestamp, and emits it in the chat response. You can observe invocations via the MCP server logs or by setting `logging.level.com.example=debug` (already enabled in both apps).

## Development tips

1. Use the `http/` samples to sanity-check endpoints without the UI.
2. To rebuild embeddings, run the assistant with `--spring.profiles.active="ollama,embedding"` and ensure pgvector is empty (`docker compose down -v` if you need a clean slate).
3. Update `assistant/src/main/resources/application-openai.yml` and `application-ollama.yml` to target other models or embeddings.
4. The UI stores draft chats client-side (key `__draft`) before a chatId is assigned (@ui/app.js#30-75); keep this in mind when extending the UX.

## License

MIT – see [LICENSE](./LICENSE).
