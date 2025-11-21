# Agents Overview

This repository hosts two cooperating Spring Boot applications that demonstrate how to build AI-assisted workflows for a fictional dog adoption agency, **Pooch Palace**.

## Repository layout

| Folder | Description |
| --- | --- |
| `assistant/` | Spring Boot web application that exposes REST endpoints and an AI chat assistant powered by Spring AI. |
| `scheduler/` | Spring Boot application that exposes MCP tools—currently a scheduling tool that downstream agents can call to book adoption pickups. |
| `http/` | Example HTTP requests for manual testing. |
| `pgdata/` | Local PostgreSQL volume used by pgvector. |
| `.env`, `docker-compose.yaml` | Helper files for local infrastructure (PostgreSQL vector store + supporting services). |

## Assistant application (`assistant/`)

* **Purpose**: Provide an AI assistant that helps prospective adopters find available dogs and ask questions.
* **Endpoints**:
  * `GET /dogs` – returns all dogs from the repository.
  * `GET /{user}/ask?question=...` – forwards the user question to the AI assistant while scoping conversation history to `{user}`.
* **Chat configuration**:
  * Uses `ChatClient` with a dog-adoption–specific system prompt and two advisors: `QuestionAnswerAdvisor` (vector-store grounding) and `PromptChatMemoryAdvisor` (conversation memory backed by JDBC + pgvector).
  * Registers Spring AI MCP tool callbacks so the assistant can call external tools (such as the scheduler service) when responding.
* **Data flow**: Dog data is stored in the application database. When the `embedding` profile is active, an `ApplicationRunner` pushes dog documents into the vector store for retrieval-augmented responses.

## Scheduler MCP service (`scheduler/`)

* **Purpose**: Provide MCP tools that the assistant (or other agents) can invoke. Currently includes `DogAdoptionScheduler`.
* **Tools**:
  * `schedule(dogId, dogName)` – returns an ISO timestamp three days in the future to represent an adoption pickup. The method is annotated with `@McpTool` and argument metadata via `@McpArg` so MCP clients can auto-generate tool schemas.
* **Logging**: Each scheduling request logs the dog name, ID, and proposed pickup time.

## How the pieces interact

1. A user calls the assistant’s `/dogs` endpoint or asks a question via `/alice/ask?question=...`.
2. The assistant’s `ChatClient` builds a prompt using the system instructions, vector-store grounding, and chat memory scoped by conversation ID (the `{user}` path variable).
3. When the model decides it needs to schedule a pickup, it can call the MCP `schedule` tool (exposed by the scheduler service). The tool responds with a timestamp that the assistant incorporates into its reply.

## Next steps

* Seed realistic dog data in `assistant` and re-run with the `embedding` profile to refresh the vector store.
* Extend `scheduler` with more MCP tools (e.g., cancel/reschedule appointments, notify adopters).
* Document environment variables (OpenAI API key, database URLs) in `.env` for easier onboarding.
