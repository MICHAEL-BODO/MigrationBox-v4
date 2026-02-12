# MigrationBox V5.0 — MCP Server Mesh Requirements

**Version**: 5.0.0  
**Last Updated**: February 12, 2026  
**Architecture Reference**: ARCHITECTURE.md V5.0 Sections 11, 15  
**Scope**: Federated MCP Server Mesh (12+ Docker containers)

---

## 1. Overview

The Federated MCP Server Mesh is MigrationBox's fifth flagship capability, providing 1,000x knowledge amplification by connecting 12+ Docker MCP servers that query AWS, Azure, and GCP documentation simultaneously. This enables real-time IaC generation for any target cloud and doubles the addressable market by transforming from single-cloud to true multi-cloud.

---

## 2. MCP Server Registry

| # | Server | Base Image | Source | Purpose | Key Tools |
|---|--------|-----------|--------|---------|-----------|
| 1 | aws-mcp | node:20-slim | @anthropic/aws-mcp | AWS resource management | EC2, S3, Lambda, CloudFormation |
| 2 | aws-cdk-mcp | node:20-slim | aws-cdk-mcp-server | CDK construct generation | CDK synth, deploy, diff |
| 3 | aws-terraform-mcp | node:20-slim | terraform-mcp-server | Terraform doc + generation | Registry lookup, module gen |
| 4 | aws-diagram-mcp | python:3.12-slim | diagrams-mcp | Architecture diagrams | Diagram generation, export |
| 5 | azure-cli-mcp | node:20-slim | azure-cli-mcp-server | Azure CLI automation | az commands, ARM templates |
| 6 | azure-learn-mcp | node:20-slim | azure-learn-mcp | MS Learn documentation | Doc search, best practices |
| 7 | gcp-gemini-mcp | python:3.12-slim | gcp-gemini-mcp | Gemini AI integration | Gemini API, GCP context |
| 8 | gcp-run-mcp | node:20-slim | gcp-cloud-run-mcp | Cloud Run deployment | Deploy, configure, scale |
| 9 | context7-mcp | node:20-slim | context7-mcp-server | Code documentation lookup | Library docs, API refs |
| 10 | localstack-mcp | node:20-slim | localstack-mcp-server | Local development tools | LocalStack API, testing |
| 11 | playwright-mcp | node:20-slim | playwright-mcp-server | Browser automation | Console scraping, portal ops |
| 12 | memory-mcp | node:20-slim | memory-mcp-server | Conversation memory | Knowledge graph, recall |

### Future Servers (Planned)

| # | Server | Purpose | Target Sprint |
|---|--------|---------|--------------|
| 13 | opa-policy-mcp | OPA/Rego policy management | Sprint 5 |
| 14 | crdt-sync-mcp | CRDT knowledge sync operations | Sprint 7 |
| 15 | i2i-pipeline-mcp | I2I Pipeline orchestration | Sprint 6 |
| 16 | monitoring-mcp | CloudWatch/Grafana integration | Sprint 9 |

---

## 3. Docker Container Specifications

| Server | Memory | CPU | Ports | Health Check |
|--------|--------|-----|-------|-------------|
| aws-mcp | 256MB | 0.25 | 3001 | HTTP /health |
| aws-cdk-mcp | 512MB | 0.5 | 3002 | HTTP /health |
| aws-terraform-mcp | 256MB | 0.25 | 3003 | HTTP /health |
| aws-diagram-mcp | 512MB | 0.5 | 3004 | HTTP /health |
| azure-cli-mcp | 256MB | 0.25 | 3011 | HTTP /health |
| azure-learn-mcp | 256MB | 0.25 | 3012 | HTTP /health |
| gcp-gemini-mcp | 512MB | 0.5 | 3021 | HTTP /health |
| gcp-run-mcp | 256MB | 0.25 | 3022 | HTTP /health |
| context7-mcp | 256MB | 0.25 | 3031 | HTTP /health |
| localstack-mcp | 256MB | 0.25 | 3032 | HTTP /health |
| playwright-mcp | 1024MB | 1.0 | 3033 | HTTP /health |
| memory-mcp | 512MB | 0.25 | 3034 | HTTP /health |

**Total Resource Requirements**: ~4.5GB RAM, ~4 CPU cores (development)

---

## 4. Docker Compose Configuration

```yaml
version: '3.8'

services:
  # --- AWS MCP Servers ---
  aws-mcp:
    image: migrationbox/aws-mcp:latest
    build:
      context: ./aws-console
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - MCP_PORT=3001
    mem_limit: 256m
    cpus: 0.25
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - mcp-mesh

  aws-cdk-mcp:
    image: migrationbox/aws-cdk-mcp:latest
    build:
      context: ./aws-cdk
      dockerfile: Dockerfile
    ports:
      - "3002:3002"
    environment:
      - AWS_REGION=us-east-1
      - MCP_PORT=3002
    mem_limit: 512m
    cpus: 0.5
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - mcp-mesh

  aws-terraform-mcp:
    image: migrationbox/aws-terraform-mcp:latest
    build:
      context: ./aws-terraform
      dockerfile: Dockerfile
    ports:
      - "3003:3003"
    environment:
      - MCP_PORT=3003
    mem_limit: 256m
    cpus: 0.25
    restart: unless-stopped
    volumes:
      - ../infrastructure/terraform-modules:/modules:ro
    networks:
      - mcp-mesh

  aws-diagram-mcp:
    image: migrationbox/aws-diagram-mcp:latest
    build:
      context: ./aws-diagram
      dockerfile: Dockerfile
    ports:
      - "3004:3004"
    environment:
      - MCP_PORT=3004
    mem_limit: 512m
    cpus: 0.5
    restart: unless-stopped
    networks:
      - mcp-mesh

  # --- Azure MCP Servers ---
  azure-cli-mcp:
    image: migrationbox/azure-cli-mcp:latest
    build:
      context: ./azure-cli
      dockerfile: Dockerfile
    ports:
      - "3011:3011"
    environment:
      - AZURE_TENANT_ID=${AZURE_TENANT_ID}
      - AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
      - AZURE_CLIENT_SECRET=${AZURE_CLIENT_SECRET}
      - MCP_PORT=3011
    mem_limit: 256m
    cpus: 0.25
    restart: unless-stopped
    networks:
      - mcp-mesh

  azure-learn-mcp:
    image: migrationbox/azure-learn-mcp:latest
    build:
      context: ./azure-learn
      dockerfile: Dockerfile
    ports:
      - "3012:3012"
    environment:
      - MCP_PORT=3012
    mem_limit: 256m
    cpus: 0.25
    restart: unless-stopped
    networks:
      - mcp-mesh

  # --- GCP MCP Servers ---
  gcp-gemini-mcp:
    image: migrationbox/gcp-gemini-mcp:latest
    build:
      context: ./gcp-gemini
      dockerfile: Dockerfile
    ports:
      - "3021:3021"
    environment:
      - GOOGLE_PROJECT_ID=${GCP_PROJECT_ID}
      - GOOGLE_APPLICATION_CREDENTIALS=/credentials/sa-key.json
      - MCP_PORT=3021
    mem_limit: 512m
    cpus: 0.5
    restart: unless-stopped
    volumes:
      - ${GCP_CREDENTIALS_PATH}:/credentials/sa-key.json:ro
    networks:
      - mcp-mesh

  gcp-run-mcp:
    image: migrationbox/gcp-run-mcp:latest
    build:
      context: ./gcp-run
      dockerfile: Dockerfile
    ports:
      - "3022:3022"
    environment:
      - GOOGLE_PROJECT_ID=${GCP_PROJECT_ID}
      - MCP_PORT=3022
    mem_limit: 256m
    cpus: 0.25
    restart: unless-stopped
    networks:
      - mcp-mesh

  # --- Utility MCP Servers ---
  context7-mcp:
    image: migrationbox/context7-mcp:latest
    build:
      context: ./context7
      dockerfile: Dockerfile
    ports:
      - "3031:3031"
    environment:
      - MCP_PORT=3031
    mem_limit: 256m
    cpus: 0.25
    restart: unless-stopped
    networks:
      - mcp-mesh

  localstack-mcp:
    image: migrationbox/localstack-mcp:latest
    build:
      context: ./localstack
      dockerfile: Dockerfile
    ports:
      - "3032:3032"
    environment:
      - LOCALSTACK_ENDPOINT=http://localstack-main:4566
      - MCP_PORT=3032
    mem_limit: 256m
    cpus: 0.25
    restart: unless-stopped
    networks:
      - mcp-mesh
    depends_on:
      - localstack-main

  playwright-mcp:
    image: migrationbox/playwright-mcp:latest
    build:
      context: ./playwright
      dockerfile: Dockerfile
    ports:
      - "3033:3033"
    environment:
      - MCP_PORT=3033
    mem_limit: 1024m
    cpus: 1.0
    restart: unless-stopped
    networks:
      - mcp-mesh

  memory-mcp:
    image: migrationbox/memory-mcp:latest
    build:
      context: ./memory
      dockerfile: Dockerfile
    ports:
      - "3034:3034"
    environment:
      - MCP_PORT=3034
    mem_limit: 512m
    cpus: 0.25
    restart: unless-stopped
    volumes:
      - memory-data:/data
    networks:
      - mcp-mesh

  # --- MCP Federation Router ---
  mcp-router:
    image: migrationbox/mcp-router:latest
    build:
      context: ./router
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - MCP_SERVERS=aws-mcp:3001,aws-cdk-mcp:3002,aws-terraform-mcp:3003,aws-diagram-mcp:3004,azure-cli-mcp:3011,azure-learn-mcp:3012,gcp-gemini-mcp:3021,gcp-run-mcp:3022,context7-mcp:3031,localstack-mcp:3032,playwright-mcp:3033,memory-mcp:3034
      - HEALTH_CHECK_INTERVAL=30
      - AUTO_RESTART=true
    mem_limit: 256m
    cpus: 0.25
    restart: unless-stopped
    depends_on:
      - aws-mcp
      - azure-cli-mcp
      - gcp-gemini-mcp
    networks:
      - mcp-mesh

networks:
  mcp-mesh:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16

volumes:
  memory-data:
```

---

## 5. Federation Router

The MCP Federation Router sits in front of all MCP servers and provides intelligent query routing, load balancing, and health monitoring.

### Routing Logic

| Query Type | Routed To | Example |
|-----------|-----------|---------|
| AWS infrastructure | aws-mcp, aws-cdk-mcp, aws-terraform-mcp | "Create an S3 bucket with versioning" |
| Azure infrastructure | azure-cli-mcp, azure-learn-mcp | "Deploy Azure Functions app" |
| GCP infrastructure | gcp-gemini-mcp, gcp-run-mcp | "Set up Cloud Run service" |
| Multi-cloud comparison | All cloud servers (parallel) | "Compare storage options across clouds" |
| IaC generation | aws-terraform-mcp + cloud-specific | "Generate Terraform for load balancer" |
| Documentation lookup | context7-mcp, azure-learn-mcp | "How does DynamoDB auto-scaling work?" |
| Architecture diagrams | aws-diagram-mcp | "Create architecture diagram" |
| Browser automation | playwright-mcp | "Navigate to AWS Console" |
| Local development | localstack-mcp | "Create test S3 bucket locally" |
| Memory / context | memory-mcp | "What did we discuss about the VPC?" |

### Health Monitoring

The router performs health checks every 30 seconds:

1. HTTP GET to each server health endpoint
2. Track response time, status code, error count
3. Circuit breaker: after 3 consecutive failures, mark server unhealthy
4. Auto-restart: if Docker restart policy does not recover, alert DevOps
5. Metrics emitted to CloudWatch: server_health, response_time_ms, error_count

### Failover Strategy

| Scenario | Action |
|----------|--------|
| Single server unhealthy | Route to alternative (e.g., aws-mcp down, use aws-cdk-mcp for basic ops) |
| All servers for one cloud unhealthy | Return partial results from other clouds + error message |
| Router itself unhealthy | Docker restart policy + health check from external monitor |
| Network partition | Retry with exponential backoff, max 3 attempts |

---

## 6. Security Requirements

### Credential Management

| Server | Credentials Needed | Storage |
|--------|-------------------|---------|
| aws-mcp, aws-cdk-mcp, aws-terraform-mcp | AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY | Docker secrets / .env |
| azure-cli-mcp | AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET | Docker secrets / .env |
| gcp-gemini-mcp, gcp-run-mcp | GCP Service Account JSON | Mounted volume (read-only) |
| All servers | MCP_AUTH_TOKEN (inter-server auth) | Docker secrets |

### Network Security

- MCP mesh on isolated Docker bridge network (172.28.0.0/16)
- No direct internet access from MCP containers (egress via router only)
- Inter-server communication via internal DNS (service names)
- TLS 1.3 for all external API calls
- MCP_AUTH_TOKEN required for all router-to-server communication

### Principle of Least Privilege

- Each MCP server has only the IAM permissions it needs
- aws-mcp: ReadOnly access to EC2, S3, Lambda, etc. (no write in production)
- azure-cli-mcp: Reader role (no Contributor in production)
- gcp-gemini-mcp: Viewer role (no Editor in production)
- Write permissions only granted for development/staging environments

---

## 7. Deployment Targets

### Development (Alienware m17 laptop)

- All 12+ servers running in Docker Desktop
- Total RAM: ~4.5GB for MCP mesh + 2GB LocalStack + 2GB other DBs = ~8.5GB
- Alienware has 32GB RAM: sufficient headroom
- GPU (RTX 2060): available for Whisper inference but not used by MCP servers

### Staging (AWS ECS Fargate)

- Each MCP server as a Fargate task
- Auto-scaling: 1-3 tasks per server based on request volume
- Shared VPC with backend services
- CloudWatch Container Insights for monitoring

### Production (AWS ECS Fargate + Caching)

- Same as staging but with Redis caching layer
- Frequently queried documentation cached (TTL: 1 hour)
- MCP responses cached per query hash (TTL: 15 minutes)
- Geographic distribution: us-east-1 primary, eu-west-1 secondary

### iPhone Target

- MCP servers are backend-only (not on device)
- iPhone app calls backend API which routes to MCP mesh
- No direct MCP server connection from mobile

---

## 8. Monitoring and Alerting

### Metrics (CloudWatch Custom Metrics)

| Metric | Namespace | Dimensions | Alarm Threshold |
|--------|-----------|-----------|-----------------|
| mcp.server.health | MigrationBox/MCP | ServerName | unhealthy > 0 for 2 min |
| mcp.server.response_time | MigrationBox/MCP | ServerName | p95 > 5000ms |
| mcp.server.error_count | MigrationBox/MCP | ServerName | > 10/min |
| mcp.server.memory_usage | MigrationBox/MCP | ServerName | > 90% |
| mcp.router.requests | MigrationBox/MCP | RouteType | informational |
| mcp.router.cache_hit_rate | MigrationBox/MCP | — | < 30% (investigate) |

### Dashboards

- **MCP Health Dashboard**: All 12+ servers with status, response time, error rate
- **MCP Usage Dashboard**: Requests by server, by query type, cache hit rate
- **MCP Cost Dashboard**: Estimated API costs (Bedrock, Azure, GCP) per server

### Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| Server Down | Health check fails 3x | PagerDuty + auto-restart |
| High Latency | p95 > 5s for 5 min | Slack notification |
| Error Spike | > 50 errors in 5 min | PagerDuty |
| Memory Leak | Memory > 90% for 10 min | Auto-restart + alert |
| Credential Expiry | Token expires in < 7 days | Email + Slack |

---

## 9. Testing Requirements

### Per-Server Tests

| Test Type | Description | Frequency |
|-----------|-------------|-----------|
| Health Check | HTTP GET /health returns 200 | Every 30s (automated) |
| Tool Invocation | Call each tool with test params | CI/CD pipeline |
| Error Handling | Invalid params, network timeout | CI/CD pipeline |
| Memory Leak | 1000 requests, check memory growth | Weekly |
| Credential Rotation | Verify operation after credential swap | Monthly |

### Integration Tests

| Test | Description |
|------|-------------|
| Multi-cloud query | Ask for storage comparison across AWS/Azure/GCP, verify all 3 respond |
| I2I full pipeline | Natural language to Terraform via MCP mesh |
| Failover | Kill one server, verify router handles gracefully |
| Cache invalidation | Update docs, verify cache refreshes after TTL |

---

## 10. Implementation Timeline

| Sprint | MCP Deliverables |
|--------|-----------------|
| Sprint 1 | Verify 14 existing MCP connections, Docker Compose skeleton |
| Sprint 5 | OPA Policy MCP server |
| Sprint 6 | I2I Pipeline MCP server |
| Sprint 7 | CRDT Sync MCP server |
| Sprint 8 | Full containerization, federation router, health monitoring |
| Sprint 9 | Monitoring MCP server, production deployment prep |
| Sprint 12 | Performance optimization, security hardening |

---

*Last Updated: February 12, 2026*  
*Architecture Reference: ARCHITECTURE.md V5.0 Sections 11, 15*
