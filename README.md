# Finance Proposal Assistant – Spring AI MCP Agents

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java Version](https://img.shields.io/badge/Java-25-orange)](https://www.oracle.com/java/technologies/javase-downloads.html)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.8-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Spring AI](https://img.shields.io/badge/Spring%20AI-1.1.0-blue.svg)](https://docs.spring.io/spring-ai/reference/)

Demo workspace for building AI-assisted workflows for financial advisors creating investment proposals. The repo contains:

* A Spring AI **assistant service** that exposes REST endpoints, persists chat history, performs RAG over pgvector, and calls MCP tools.
* A Spring AI **MCP server** that publishes financial proposal tools (client lookup, account retrieval, risk assessment, proposal creation) over SSE.
* A lightweight **HTML/JS UI** that exercises the APIs.

## Repository layout

| Folder | Description |
| --- | --- |
| `assistant/` | Spring Boot assistant + chat directory APIs (`/ask`, `/users`, `/chats`). |
| `mcp-server/` | Spring Boot MCP server hosting proposal tools (clients, accounts, risks, models, proposals). |
| `ui/` | Static console for selecting financial advisors, browsing conversations, and creating proposals. |
| `http/` | Ready-to-run HTTPie/cURL samples. |
| `pgdata/` | Local PostgreSQL volume for pgvector. |
| `docker-compose.yaml`, `.env`, `example.env` | Infra helpers for Postgres + Ollama. |

## Architecture highlights

1. **Assistant service** routes advisor questions through Spring AI `ChatClient`, layering vector-store grounding and JDBC chat memory. It also generates concise chat titles using a separate summarization client.
2. **Proposal MCP server** exposes tools for retrieving clients by FA ID, listing accounts, analyzing risk profiles, exploring investment models, and creating complete proposals. The assistant invokes these via Sync MCP tool callbacks.
3. **UI** presents financial advisors, conversation summaries, and streaming message updates. It auto-detects the assistant base URL or falls back to `http://localhost:8083/proposal-assistant-service`.

## Assistant service (`assistant/`)

### Core features

* **Conversational proposal creation** – `GET /ask?question=...` and `GET /ask/stream` process advisor questions using Spring AI, scoped by `X-User-Id` and optional `chatId`.
* **Chat directory APIs** – `/users`, `/chats`, and `/chats/{chatId}` drive the UI by serving financial advisor identities, conversation summaries, and persisted message history.

### Configuration

* **System + summary prompts** live in `AssistantConstants`, including finance-focused guidance and the 5-word title prompt for newly created conversations.
* **Vector store**: pgvector via Spring AI, can be populated with financial documentation, compliance guidelines, or investment strategy documents.
* **Chat memory**: JDBC-backed `PromptChatMemoryAdvisor` scoped by `ChatMemory.CONVERSATION_ID`.
* **MCP integration**: registered through `SyncMcpToolCallbackProvider`, enabling model-initiated tool calls to retrieve client data and create proposals.
* **Profiles**: `application.yml` holds shared settings, while `application-openai.yml` and `application-ollama.yml` configure different model providers. Use `--spring.profiles.active=openai` for OpenAI or `--spring.profiles.active=ollama` for local models.

### Persistence & infra

* Database + vector store share the same Postgres instance. Liquibase changelogs live under `assistant/src/main/resources/db/changelog/`.
* MCP SSE endpoint is configured via `spring.ai.mcp.client.sse.connections.scheduler.url` (`MCP_SERVER_URL`).
* Server port defaults to `8083` with context path `/proposal-assistant-service`.

## Proposal MCP service (`mcp-server/`)

* Runs on port `8082` with context path `/proposal-mcp-service`.
* **MCP Endpoint**: `http://localhost:8082/proposal-mcp-service/mcp`
* **Protocol**: STREAMABLE with Server-Sent Events (SSE) transport
* Built with `spring-ai-starter-mcp-server-webmvc`, making it consumable by the assistant's MCP client.

### MCP Tools

* `getClientsByFaId(faId)` – retrieves all clients for a 4-character Financial Advisor ID
* `getAccountsByClient(client)` – lists all accounts for a specific client with balances and types
* `getRisksByClient(client)` – returns available risk profiles suitable for the client
* `getModelsByRisk(risk)` – lists investment models matching a risk tolerance level
* `createProposal(request)` – creates a complete investment proposal combining client, accounts, risk profile, securities, and investment amount

### MCP Prompts

* `get-client-accounts` – guided prompt for retrieving client accounts
* `create-investment-proposal` – step-by-step prompt for creating a full proposal
* `analyze-client-risk` – prompt for analyzing risk profiles and investment options
* `list-all-clients` – prompt for listing all clients for an FA

### REST API (Alternative Access)

The MCP server also exposes traditional REST endpoints for direct HTTP access:
* `GET /api/clients?faId=...` – get clients by FA ID (exactly 4 characters)
* `POST /api/accounts` – get accounts by client (requires `ClientRequest` body)
* `POST /api/risks` – get risk profiles by client (requires `ClientRequest` body)
* `POST /api/models` – get investment models by risk (requires `RiskRequest` body)
* `POST /api/proposals` – create a new proposal (requires `CreateProposalRequest` body)
* `GET /api/hello` – health check endpoint
* **Swagger UI**: `http://localhost:8082/proposal-mcp-service/swagger-ui.html`
* **Actuator**: `http://localhost:8082/proposal-mcp-service/actuator`

### Technology Stack

* **Java 25** with Spring Boot 3.5.7
* **Spring AI 1.1.0-SNAPSHOT** with `spring-ai-starter-mcp-server-webmvc`
* **MapStruct 1.6.3** for DTO mapping
* **Lombok 1.18.42** for boilerplate reduction
* **SpringDoc OpenAPI 2.8.13** for API documentation
* **JSpecify** for nullability annotations

## UI (`ui/`)

* Plain HTML + vanilla JS (no build step).
* Fetches `/users` to populate a dropdown of financial advisors, loads conversations per advisor, and keeps per-chat history caches client-side.
* Sends messages via `/ask/stream`, automatically linking newly created conversations once a response arrives.
* Includes a day/dark theme toggle that persists the selection in `localStorage` and updates all UI surfaces via CSS variables.
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

```bash
cp example.env .env
# update DB credentials / OPENAI_API_KEY / MCP_SERVER_URL as needed
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This launches:

* Postgres + pgvector on `localhost:5432` with volume `./pgdata`
* Ollama on `localhost:11434` storing models under `./ollama`

### 3. Run the MCP server

```bash
cd mcp-server
mvn spring-boot:run
```

The MCP server will start on `http://localhost:8082/proposal-mcp-service`

### 4. Run the assistant service

```bash
cd assistant
mvn spring-boot:run -Dspring-boot.run.profiles=ollama   # or openai
```

The assistant will:
- Connect to Postgres
- Apply Liquibase schema + seed data
- Connect to the MCP server at the configured `MCP_SERVER_URL`
- Start on `http://localhost:8083/proposal-assistant-service`

### 5. Launch the UI (optional)

```bash
npx http-server ui --port 4173
# or use any static file host; UI auto-points to http://localhost:8083/proposal-assistant-service
```

Open `http://localhost:4173` in your browser.

## API quick start

* Base URL: `http://localhost:8083/proposal-assistant-service`
* Headers: `X-User-Id` (UUID of financial advisor from `/users`)

| Endpoint | Description |
| --- | --- |
| `GET /users` | Lists financial advisors. |
| `GET /chats` | Lists conversations for `X-User-Id`. |
| `GET /chats/{chatId}` | Returns persisted messages (via chat memory repository). |
| `GET /ask?question=...&chatId=...` | Sends a question. Returns `{ chatId, answer }`. |
| `GET /ask/stream?question=...&chatId=...` | Streaming version returning NDJSON events. |

Sample request (HTTPie):

```bash
http "http://localhost:8083/proposal-assistant-service/ask" \
  X-User-Id:00000000-0000-0000-0000-000000000001 \
  question=="Show me clients for FA ID ABCD"
```

## MCP tooling

The assistant registers proposal tool providers tied to the MCP server connection via `SyncMcpToolCallbackProvider`. When the LLM needs client data or wants to create a proposal, Spring AI auto-invokes the MCP server tools over SSE, receives structured data, and incorporates it into the chat response. 

### MCP Connection Configuration

The assistant connects to the MCP server using the `MCP_SERVER_URL` environment variable (default: `http://localhost:8082/proposal-mcp-service/mcp`). The connection uses the STREAMABLE protocol with Server-Sent Events transport.

### Observing Tool Invocations

You can observe MCP tool invocations via:
- MCP server logs (set `logging.level.dev.vlaship=debug`)
- Assistant logs (tool calls are logged during chat processing)
- MCP server Swagger UI at `http://localhost:8082/proposal-mcp-service/swagger-ui.html`

## MCP Protocol Testing

### Connecting to the MCP Server

The MCP server uses the **STREAMABLE protocol** with Server-Sent Events (SSE) transport over HTTP.

**MCP Endpoint:** `http://localhost:8082/proposal-mcp-service/mcp`

### MCP Protocol Flow

1. **Initialize** - Establish a session with the MCP server
   ```json
   POST http://localhost:8082/proposal-mcp-service/mcp
   Content-Type: application/json
   Accept: text/event-stream
   
   {
     "jsonrpc": "2.0",
     "id": "1",
     "method": "initialize",
     "params": {
       "protocolVersion": "2024-11-05",
       "clientInfo": { "name": "your-client", "version": "1.0" },
       "capabilities": { "tools": {} }
     }
   }
   ```
   
   The response includes an `Mcp-Session-Id` header that must be used in subsequent requests.

2. **List Tools** - Discover available tools
   ```json
   POST http://localhost:8082/proposal-mcp-service/mcp
   Mcp-Session-Id: <session-id>
   
   {
     "jsonrpc": "2.0",
     "id": "2",
     "method": "tools/list",
     "params": {}
   }
   ```

3. **Call Tool** - Invoke a specific tool
   ```json
   POST http://localhost:8082/proposal-mcp-service/mcp
   Mcp-Session-Id: <session-id>
   
   {
     "jsonrpc": "2.0",
     "id": "3",
     "method": "tools/call",
     "params": {
       "name": "getClientsByFaId",
       "arguments": { "faId": "TEST" }
     }
   }
   ```

### Testing with HTTP Files

The project includes HTTP test files in the `http/` directory for testing both REST API and MCP protocol endpoints.

## Development tips

1. Use the `http/` samples to sanity-check endpoints without the UI.
2. To populate the vector store with financial documentation, add documents and run with the `embedding` profile.
3. Update `assistant/src/main/resources/application-openai.yml` and `application-ollama.yml` to target other models or embeddings.
4. The UI stores draft conversations client-side (key `__draft`) before a chatId is assigned; keep this in mind when extending the UX.
5. Enable debug logging with `logging.level.dev.vlaship=debug` to see detailed MCP tool invocations.
6. Use Swagger UI at `http://localhost:8082/proposal-mcp-service/swagger-ui.html` for interactive API testing.

## License

MIT – see [LICENSE](./LICENSE).
