# Pooch Palace – Spring AI MCP Agents

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java Version](https://img.shields.io/badge/Java-25-orange)](https://www.oracle.com/java/technologies/javase-downloads.html)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.8-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Spring AI](https://img.shields.io/badge/Spring%20AI-1.1.0-blue.svg)](https://docs.spring.io/spring-ai/reference/)

Demo workspace showcasing AI-assisted workflows for **Pooch Palace**, a fictional dog adoption agency. Features Spring AI with MCP (Model Context Protocol) integration for tool calling and RAG (Retrieval-Augmented Generation) over pgvector.

## Components

* **Assistant Service** - Spring AI chat assistant with REST endpoints, persistent chat history, and MCP tool integration
* **MCP Server** - Scheduling tools exposed via Model Context Protocol over SSE
* **Web UI** - TypeScript interface for interacting with the assistant

## Repository Structure

| Folder | Description |
| --- | --- |
| `assistant/` | Spring Boot assistant service with chat APIs (`/dogs`, `/ask`, `/users`, `/chats`) |
| `mcp-server/` | Spring Boot MCP server with scheduling tools |
| `ui/` | TypeScript web interface for chat interactions |
| `http/` | HTTP request samples for testing |
| `docker-compose.yaml`, `.env`, `example.env` | Infrastructure configuration |

## Key Features

* **RAG Integration** - pgvector-backed retrieval for contextual dog information
* **Chat Memory** - JDBC-persisted conversation history with automatic title generation
* **MCP Tools** - Model Context Protocol integration for scheduling adoptions
* **Multi-Model Support** - OpenAI and Ollama model configurations
* **TypeScript UI** - Modern web interface with dark/light theme support

## Quick Start

### Docker Compose (Recommended)

```bash
# Configure environment
cp example.env .env
# Edit .env with your OpenAI API key

# Start all services
docker-compose up -d

# Access the application
open http://localhost:3000
```

**Service URLs:**
- Web UI: http://localhost:3000
- Assistant API: http://localhost:8081  
- MCP Server: http://localhost:8082
- PostgreSQL: localhost:15432
- Ollama: http://localhost:11434



### Local Development

**Prerequisites:** Java 25, Maven 3.9+, Node.js 20+, Docker Desktop

```bash
# 1. Configure environment
cp example.env .env

# 2. Start infrastructure
docker-compose up postgres ollama -d

# 3. Run services (separate terminals)
cd mcp-server && mvn spring-boot:run
cd assistant && mvn spring-boot:run -Dspring-boot.run.profiles=ollama  
cd ui && npm install && npm start
```

## API Reference

**Base URL:** `http://localhost:8081/proposal-assistant-service`  
**Required Header:** `X-User-Id` (UUID from `/users` endpoint)

| Endpoint | Description |
| --- | --- |
| `GET /dogs` | List all available dogs |
| `GET /users` | List demo users |
| `GET /chats` | List chats for current user |
| `GET /chats/{chatId}` | Get chat message history |
| `GET /ask?question=...&chatId=...` | Send question to assistant |

**Example:**
```bash
curl "http://localhost:8081/proposal-assistant-service/ask" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001" \
  -G -d "question=Tell me about calm dogs available this week"
```

## Development Notes

- **MCP Integration**: Assistant automatically invokes scheduling tools when users request adoption appointments
- **Embeddings**: Use `--spring.profiles.active="ollama,embedding"` to rebuild vector store
- **Testing**: Use HTTP samples in `http/` directory for API testing
- **Models**: Configure OpenAI or Ollama models in respective `application-*.yml` files
- **Debugging**: Enable `logging.level.com.example=debug` for detailed MCP tool logs

## License

MIT – see [LICENSE](./LICENSE).