# Pooch Palace - Docker Deployment

Complete Docker Compose setup for the Pooch Palace AI-assisted dog adoption system.

## 🏗️ Architecture

The system consists of 5 services:

| Service | Port | Description |
|---------|------|-------------|
| **postgres** | 15432 | PostgreSQL database with pgvector extension |
| **ollama** | 11434 | Local LLM and embeddings server |
| **mcp-server** | 8082 | MCP tools server (scheduling, etc.) |
| **assistant** | 8081 | Spring Boot AI assistant service |
| **web-ui** | 3000 | TypeScript web interface |

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- `.env` file configured (see Configuration section)

### Start All Services
```bash
# Start infrastructure and all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### Access the Application
- **Web UI**: http://localhost:3000
- **Assistant API**: http://localhost:8081
- **MCP Server**: http://localhost:8082
- **Ollama**: http://localhost:11434
- **PostgreSQL**: localhost:15432

## ⚙️ Configuration

### Environment Variables (.env)
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=15432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=postgres
DB_SCHEMA=public

# Service URLs (for Docker internal communication)
ASSISTANT_URL=http://assistant:8081/proposal-assistant-service
MCP_SERVER_URL=http://mcp-server:8082/proposal-mcp-service/sse

# AI Configuration
OPENAI_API_KEY=sk-proj-your-key-here
```

### Service Dependencies
The services start in the correct order with health checks:
1. **postgres** + **ollama** (infrastructure)
2. **mcp-server** (tools)
3. **assistant** (depends on postgres + mcp-server)
4. **web-ui** (depends on assistant)

## 🔧 Development

### Build Individual Services
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build assistant
docker-compose build mcp-server
docker-compose build web-ui
```

### Development Mode
```bash
# Start with rebuild
docker-compose up --build

# Start only infrastructure for local development
docker-compose up postgres ollama -d

# Then run services locally:
cd mcp-server && mvn spring-boot:run
cd assistant && mvn spring-boot:run
cd ui && npm start
```

### Logs and Debugging
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f assistant
docker-compose logs -f web-ui

# Execute commands in running containers
docker-compose exec assistant bash
docker-compose exec web-ui sh
```

## 🏥 Health Checks

All services include health checks:
- **postgres**: `pg_isready` command
- **ollama**: API endpoint check
- **mcp-server**: Spring Boot actuator health
- **assistant**: Spring Boot actuator health  
- **web-ui**: HTTP endpoint check

Check health status:
```bash
docker-compose ps
```

## 📊 Monitoring

### Service Status
```bash
# Check all services
docker-compose ps

# Check specific service
docker-compose ps assistant
```

### Resource Usage
```bash
# View resource usage
docker stats

# View specific service resources
docker stats pooch-palace-assistant
```

## 🔄 Updates and Maintenance

### Update Services
```bash
# Pull latest images and rebuild
docker-compose pull
docker-compose up --build -d

# Restart specific service
docker-compose restart assistant
```

### Database Management
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d postgres

# Backup database
docker-compose exec postgres pg_dump -U postgres postgres > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres -d postgres < backup.sql
```

### Clean Up
```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## 🐛 Troubleshooting

### Common Issues

**Port Conflicts**
```bash
# Check what's using ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :8081

# Kill processes using ports
sudo kill -9 $(lsof -t -i:3000)
```

**Service Won't Start**
```bash
# Check logs
docker-compose logs service-name

# Restart service
docker-compose restart service-name

# Rebuild service
docker-compose up --build service-name
```

**Database Connection Issues**
```bash
# Check postgres health
docker-compose exec postgres pg_isready -U postgres

# Verify environment variables
docker-compose exec assistant env | grep DB_
```

**UI Can't Connect to Assistant**
```bash
# Check assistant health
curl http://localhost:8081/actuator/health

# Check network connectivity
docker-compose exec web-ui curl http://assistant:8081/actuator/health
```

## 🔐 Security Notes

- All services run as non-root users
- Health checks ensure services are ready before dependencies start
- Environment variables are used for configuration
- No sensitive data in Docker images
- PostgreSQL data is persisted in volumes

## 📈 Production Considerations

For production deployment:
1. Use proper secrets management instead of `.env` files
2. Configure proper logging and monitoring
3. Set up SSL/TLS termination
4. Use production-grade database setup
5. Configure resource limits and scaling
6. Set up backup and disaster recovery
7. Use container orchestration (Kubernetes, Docker Swarm)

## 🎯 Next Steps

1. **Start the system**: `docker-compose up -d`
2. **Access the UI**: http://localhost:3000
3. **Test the assistant**: Select a user and start chatting
4. **Schedule adoptions**: Ask about dogs and schedule pickups
5. **Monitor logs**: `docker-compose logs -f`