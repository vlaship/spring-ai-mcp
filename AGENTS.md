# Agents Overview

This repository hosts two cooperating Spring Boot applications (plus a lightweight UI) that demonstrate how to build AI-assisted workflows for financial advisors creating investment proposals.

## Repository layout

| Folder | Description |
| --- | --- |
| `assistant/` | Spring Boot web application that exposes REST endpoints and an AI chat assistant powered by Spring AI plus a chat-directory API for the UI. Helps financial advisors create investment proposals. |
| `mcp-server/` | Spring Boot application that exposes MCP tools for retrieving client data, accounts, risk profiles, investment models, and creating proposals. |
| `ui/` | Static HTML/JS console that exercises the assistant/chat directory APIs. |
| `http/` | Example HTTP requests for manual testing. |
| `pgdata/` | Local PostgreSQL volume used by pgvector. |
| `.env`, `docker-compose.yaml` | Helper files for local infrastructure (PostgreSQL vector store + supporting services). |

## Assistant application (`assistant/`)

* **Purpose**: Provide an AI assistant that helps financial advisors create investment proposals for their clients through conversational interaction.
* **Primary endpoints**:
  * `GET /ask?question=...` – routes the advisor's question through the assistant. Requires the `X-User-Id` header and optional `chatId` to scope chat memory.
  * `GET /ask/stream` – streaming version of the ask endpoint for real-time responses.
* **Chat directory endpoints** (consumed by the UI):
  * `GET /users` – lists all known financial advisors.
  * `GET /chats` – lists conversations for the requesting advisor (via `X-User-Id`).
  * `GET /chats/{chatId}` – returns the persisted message history for a conversation.
* **Chat configuration**:
  * Uses `proposalAssistantChatClient` bean configured with finance-focused system prompts plus two advisors: `QuestionAnswerAdvisor` for pgvector-backed retrieval and `PromptChatMemoryAdvisor` for JDBC chat memory.
  * Registers MCP tool callbacks so the assistant can invoke remote tools (e.g., getClientsByFaId, createProposal) while responding.
  * Generates short, title-case chat titles by calling a dedicated `summarizeClient` when a conversation is first saved.
* **Data flow**: Client and proposal data is accessed via MCP tools from the mcp-server. The vector store can optionally be populated with financial documentation for retrieval-augmented answers.
* **Database prerequisites**: Before running the assistant, ensure the target Postgres database has the application schema and pgvector extension created:

  ```sql
  CREATE SCHEMA IF NOT EXISTS ${DB_SCHEMA};

  CREATE EXTENSION IF NOT EXISTS vector;
  ```

## Proposal MCP service (`mcp-server/`)

* **Purpose**: Provide MCP tools that the assistant (or other agents) can invoke over SSE for managing financial proposals.
* **Port**: 8082 with context path `/proposal-mcp-service`
* **MCP Endpoint**: `http://localhost:8082/proposal-mcp-service/mcp`
* **Protocol**: STREAMABLE with Server-Sent Events (SSE) transport
* **Technology**: Built with `spring-ai-starter-mcp-server-webmvc`, MapStruct for DTO mapping, SpringDoc OpenAPI for documentation

### MCP Tools (defined in `McpTools.java`)

All tools are annotated with `@McpTool` and automatically registered:

* `getClientsByFaId(faId)` – retrieves all clients for a 4-character Financial Advisor ID. Validates FA ID length.
* `getAccountsByClient(client)` – lists all accounts for a specific client with balances and types. Takes `ClientRequest` with id and name.
* `getRisksByClient(client)` – returns available risk profiles suitable for the client. Takes `ClientRequest` parameter.
* `getModelsByRisk(risk)` – lists investment models matching a risk tolerance level. Takes `RiskRequest` with id and name.
* `createProposal(request)` – creates a complete investment proposal combining client, accounts, risk profile, securities, and investment amount. Takes `CreateProposalRequest` with all proposal components.

### MCP Prompts (defined in `McpPrompts.java`)

Guided prompts using `@McpPrompt` annotation with template variables:

* `get-client-accounts` – guided prompt for retrieving client accounts. Arguments: `faId` (required), `clientName` (optional).
* `create-investment-proposal` – step-by-step prompt for creating a full proposal. Arguments: `faId`, `clientName`, `investmentAmount` (all required).
* `analyze-client-risk` – prompt for analyzing risk profiles and investment options. Arguments: `faId`, `clientName` (both required).
* `list-all-clients` – prompt for listing all clients for an FA. Arguments: `faId` (required).

### REST API Alternative

The MCP server also exposes traditional REST endpoints at `/api/*` for direct HTTP access, documented via Swagger UI at `http://localhost:8082/proposal-mcp-service/swagger-ui.html`.

### Monitoring

* **Actuator endpoints**: Available at `/actuator/*` for health checks, metrics, and monitoring
* **Logging**: Each tool invocation logs the request parameters at DEBUG level for debugging and audit purposes

## How the pieces interact

1. The UI (or an API caller) retrieves financial advisors via `/users`, selects one, and loads their conversation summaries plus history via `/chats` + `/chats/{chatId}`.
2. When the advisor sends a message, the UI calls `/ask/stream?question=...` with `X-User-Id` and optional `chatId`. `ChatAssistantService` resolves or creates the chat, routes the question through `proposalAssistantChatClient`, and persists the answer/title in the database.
3. The `proposalAssistantChatClient` uses the finance-focused system instructions, optional vector-store grounding, and chat-memory advisor scoped by `ChatMemory.CONVERSATION_ID`. When the model needs client data or wants to create a proposal, it calls MCP tools (e.g., `getClientsByFaId`, `createProposal`) hosted by `mcp-server`, receives structured data, and incorporates it into the response.

## Next steps

* Populate the vector store with financial documentation, compliance guidelines, or investment strategy documents for enhanced retrieval-augmented generation.
* Extend `mcp-server` with additional MCP tools (e.g., update proposals, retrieve historical performance data, compliance checks).
* Add authentication to the UI and document environment variables (OpenAI API key, database URLs, LLM provider configurations) for easier onboarding.
* Implement proposal versioning and approval workflows.
