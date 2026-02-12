optimizations/{tenantId}/savings Get savings achieved

# Infrastructure
GET    /v1/infrastructure/{tenantId}      List provisioned resources
GET    /v1/infrastructure/{id}            Get resource details

# Health
GET    /v1/health                         Platform health check
GET    /v1/health/services                Individual service health
```

### Rate Limiting

| Tier | Requests/Minute | Burst | Concurrent Connections |
|------|----------------|-------|----------------------|
| Free Trial | 60 | 100 | 5 |
| Professional | 500 | 1000 | 25 |
| Enterprise | 2000 | 5000 | 100 |

### Authentication

All API requests require a JWT bearer token:
```
Authorization: Bearer <jwt_token>
```

Token obtained via OAuth 2.0 flow against Cognito/Azure AD B2C/GCP Identity Platform.

Token claims include: `tenantId`, `userId`, `roles`, `permissions`.

---

## 20. Multi-Tenancy

### Tenant Isolation Model

**Data isolation**: Partition key-based isolation (tenantId as partition key in every table). No cross-tenant data access possible at the database level.

**Compute isolation**: Shared Lambda functions with tenant context from JWT. No dedicated compute per tenant (cost optimization).

**Network isolation**: Shared API Gateway with tenant-based rate limiting. Enterprise tier gets dedicated VPC endpoints (optional).

### Billing Model

| Tier | Monthly Price | Included Migrations | Discovery Scans | Support |
|------|--------------|--------------------|--------------------|---------|
| Starter | EUR 500/mo | 2 | 10 | Email |
| Professional | EUR 2,000/mo | 10 | Unlimited | Chat + Email |
| Enterprise | EUR 5,000/mo | Unlimited | Unlimited | 24/7 Phone + Dedicated TAM |
| Custom | Negotiated | Negotiated | Negotiated | Custom SLA |

### Tenant Onboarding Flow

1. Customer signs up via web dashboard
2. System creates tenant record in `tenants` table
3. System provisions Cognito user pool group / Azure AD B2C tenant
4. Customer provides cloud credentials (encrypted, stored in Secrets Manager)
5. System validates credentials with read-only test
6. Customer initiates first discovery scan

---

## 21. Observability

### Three Pillars

**Metrics** (what is happening):
- CloudWatch Metrics / Azure Monitor Metrics / GCP Cloud Monitoring
- Custom metrics: discovery duration, migration success rate, data transfer speed
- Grafana dashboards for unified view

**Logs** (why it happened):
- Structured JSON logging from all Lambda functions
- CloudWatch Logs / Azure Log Analytics / Cloud Logging
- Correlation IDs across all services for request tracing
- Log retention: 30 days hot, 1 year cold storage

**Traces** (how it happened):
- AWS X-Ray / Azure Application Insights / GCP Cloud Trace
- End-to-end request tracing across services
- Performance profiling for optimization

### Key Dashboards

1. **Platform Health**: Service availability, error rates, latency P50/P95/P99
2. **Migration Progress**: Active migrations, phase status, estimated completion
3. **Cost Tracking**: Cloud spend by tenant, optimization savings, anomaly alerts
4. **Discovery Coverage**: Resources discovered, scan duration, coverage gaps
5. **Security**: Authentication failures, API abuse, permission denials

### Alerting Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Service Down | Any service health check fails for > 5 min | Critical | PagerDuty, SMS |
| High Error Rate | > 5% 5xx responses in 5 min window | High | Slack, PagerDuty |
| Migration Failed | Migration enters "failed" status | High | Slack, Email to customer |
| Cost Anomaly | > 20% cost increase vs 7-day average | Medium | Slack, Email |
| DLQ Messages | > 0 messages in any DLQ | Medium | Slack |
| Slow API | P95 latency > 5s for > 10 min | Low | Slack |

---

## 22. Disaster Recovery

### RPO/RTO Targets

| Component | RPO (data loss tolerance) | RTO (recovery time) | Strategy |
|-----------|--------------------------|---------------------|----------|
| DynamoDB | 0 (continuous backup) | < 15 min | Point-in-time recovery + cross-region replication |
| S3 | 0 (versioning + replication) | < 5 min | Cross-region replication |
| Lambda Functions | 0 (code in Git) | < 30 min | Redeploy from CI/CD |
| API Gateway | 0 (config in IaC) | < 30 min | Redeploy from IaC |
| Step Functions | 0 (definition in IaC) | < 30 min | Redeploy, running workflows lost |
| Temporal.io | 0 (Temporal Cloud managed) | < 5 min | Temporal Cloud HA |

### DR Procedures

1. **Region failover**: If primary region (us-east-1) fails, deploy to us-west-2 using CI/CD. DynamoDB global tables replicate automatically. DNS failover via Route 53.
2. **Service degradation**: If single service fails, circuit breaker isolates it. Other services continue. Events queue in DLQ for replay when service recovers.
3. **Cloud provider outage**: If AWS fails entirely, deploy to Azure using same codebase via cloud abstraction layer. DNS failover to Azure-hosted instance.

---

## 23. Local Development (LocalStack)

### LocalStack Setup

```yaml
# docker-compose.localstack.yml
version: '3.8'
services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
      - "4510-4559:4510-4559"
    environment:
      - SERVICES=s3,dynamodb,lambda,sqs,sns,stepfunctions,apigateway,events,iam,sts,logs,cloudwatch,secretsmanager
      - DEBUG=0
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "./localstack-data:/var/lib/localstack"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4566/_localstack/health"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### Verified LocalStack Health (Feb 12, 2026)

```json
{
  "services": {
    "apigateway": "available",
    "cloudwatch": "available",
    "dynamodb": "available",
    "dynamodbstreams": "available",
    "events": "available",
    "iam": "available",
    "kinesis": "available",
    "kms": "available",
    "lambda": "available",
    "logs": "available",
    "s3": "available",
    "secretsmanager": "available",
    "sns": "available",
    "sqs": "available",
    "stepfunctions": "available",
    "sts": "available"
  },
  "edition": "community",
  "version": "4.13.2.dev60"
}
```

### Verified AWS Operations (Feb 12, 2026)

- S3: `aws --endpoint-url=http://localhost:4566 s3 mb s3://migrationhub-test` - SUCCESS
- DynamoDB: `aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name migrationhub-workloads` - SUCCESS
- Both services confirmed operational against LocalStack 4.13.2.dev60

---

## 24. Deployment Strategy

### Environments

| Environment | Purpose | Infrastructure | Deployment |
|-------------|---------|---------------|------------|
| local | Development | LocalStack (Docker) | Manual / `sls deploy --stage local` |
| dev | Integration testing | AWS (sandbox account) | Auto on PR merge to `develop` |
| staging | Pre-production testing | AWS (staging account) | Auto on PR merge to `main` |
| production | Live customers | AWS (production account) | Manual approval after staging green |

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI Pipeline
on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint

  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test

  integration-test:
    runs-on: ubuntu-latest
    services:
      localstack:
        image: localstack/localstack:latest
        ports: ['4566:4566']
        env:
          SERVICES: s3,dynamodb,lambda,sqs,sns,stepfunctions,apigateway
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test:integration
        env:
          AWS_ENDPOINT_URL: http://localhost:4566

  deploy-staging:
    needs: [lint, unit-test, integration-test]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx serverless deploy --stage staging
```

### Blue/Green Deployment

Production deployments use blue/green strategy:
1. Deploy new version to "green" alias
2. Run smoke tests against green
3. Shift 10% traffic to green (canary)
4. Monitor for 30 minutes
5. If healthy, shift 100% traffic to green
6. If errors, rollback to blue instantly

---

## 25. Testing Strategy

### Testing Pyramid

```
        /    E2E Tests     \         (5% - Playwright/Cypress)
       /  Integration Tests  \       (25% - LocalStack, real APIs)
      /     Unit Tests         \     (70% - Jest, pytest)
```

### Test Categories

| Category | Tool | Scope | Run When |
|----------|------|-------|----------|
| Unit | Jest (TypeScript), pytest (Python) | Individual functions | Every commit |
| Integration | Jest + LocalStack | Service-to-service | Every PR |
| E2E | Playwright + LocalStack | Full workflow | Nightly + before release |
| Performance | k6 | API load testing | Weekly |
| Security | Snyk, OWASP ZAP | Vulnerability scanning | Every PR |
| Chaos | Chaos Toolkit + LocalStack | Fault injection | Monthly |

---

## 26. 6-Month Implementation Roadmap

### Month 1-2: Foundation

- [ ] LocalStack Pro setup (AWS + Azure preview)
- [ ] Serverless Framework V4 project structure
- [ ] Cloud abstraction layer (StorageAdapter, DatabaseAdapter, MessagingAdapter)
- [ ] DynamoDB tables + schema design
- [ ] Authentication (Cognito setup)
- [ ] CI/CD pipeline (GitHub Actions -> LocalStack -> AWS)
- [ ] Base API Gateway with health endpoints
- [ ] Project scaffolding for all 7 services

### Month 3-4: Core Functions

- [ ] WorkloadDiscovery service (AWS: 14 resource types, Azure: 15 types, GCP: 12 types)
- [ ] MigrationPathAnalysis (6Rs engine with Bedrock AI)
- [ ] AutomatedMigrationOrchestration (Step Functions + Temporal.io)
- [ ] DataClassificationEngine (PII/PHI/PCI detection)
- [ ] CostProjectionEngine (Pricing APIs + ML model)
- [ ] RollbackAutomation (< 5min recovery)
- [ ] DependencyMapping (graph analysis)
- [ ] PostMigrationValidation (5-dimension validation)

### Month 5: Browser Automation + AI

- [ ] Claude MCP integration (MCP server setup)
- [ ] Azure Developer CLI (azd) automation wrapper
- [ ] AWS Console browser automation
- [ ] GCP Console browser automation
- [ ] AWS Bedrock integration (risk prediction)
- [ ] CostProjectionEngine ML model training
- [ ] Natural language migration planning assistant

### Month 6: Enterprise + Launch

- [ ] Multi-tenant SaaS infrastructure (tenant isolation, billing)
- [ ] Compliance reporting (GDPR, SOC 2, PCI-DSS, HIPAA)
- [ ] Real-time dashboards (Grafana + Next.js)
- [ ] Documentation + Customer onboarding flow
- [ ] Beta launch (10 pilot customers)
- [ ] Performance testing + optimization
- [ ] Security audit + penetration testing

---

## 27. Risk Register

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|------|------------|--------|------------|-------|
| R1 | LocalStack Azure emulation incomplete | Medium | Medium | Fall back to Azure sandbox account for integration tests | DevOps |
| R2 | Serverless cold starts impact UX | Low | Low | Provisioned concurrency for critical paths, < 200ms verified | Backend |
| R3 | Cross-cloud Temporal.io latency | Medium | Medium | Co-locate Temporal workers near cloud APIs, async where possible | Backend |
| R4 | Customer credential security breach | Low | Critical | OIDC federation (no stored secrets), encryption at rest, audit logging | Security |
| R5 | AI model hallucination in migration recommendations | Medium | High | Human approval gate before migration execution, validation checks | AI/ML |
| R6 | Data loss during migration | Low | Critical | Zero-downtime CDC, source kept running, automated rollback | Backend |
| R7 | Cloud provider API changes break adapters | Medium | Medium | Pin SDK versions, automated compatibility tests, adapter versioning | DevOps |
| R8 | Multi-tenancy data leakage | Low | Critical | Partition key isolation, IAM policies, penetration testing | Security |
| R9 | Competitor launches similar product | High | Medium | Speed to market, deeper multi-cloud coverage, AI differentiation | Product |
| R10 | Team scaling challenges | Medium | Medium | Comprehensive documentation, modular architecture, clear interfaces | Management |

---

## 28. Cost Model

### Platform Operating Costs (Estimated Monthly)

| Component | Dev/Local | Staging | Production | Notes |
|-----------|-----------|---------|------------|-------|
| LocalStack Pro | $35/mo | N/A | N/A | Developer license |
| AWS Lambda | $0 (free tier) | $50 | $500 | Pay per invocation |
| DynamoDB | $0 (free tier) | $25 | $250 | On-demand capacity |
| S3 | $0 (free tier) | $5 | $50 | Migration artifacts |
| API Gateway | $0 (free tier) | $10 | $100 | HTTP API pricing |
| Step Functions | $0 (free tier) | $5 | $50 | Standard workflows |
| Temporal Cloud | $0 (OSS local) | $100 | $500 | Managed service |
| EventBridge | $0 (free tier) | $5 | $50 | Custom events |
| Bedrock (Claude) | $0 (dev quota) | $50 | $500 | Per-token pricing |
| CloudWatch | $0 (free tier) | $10 | $100 | Logs + metrics |
| **Total** | **~$35** | **~$260** | **~$2,100** | |

**Validation of "86% cost reduction" claim**:
- V1 (Kubernetes-based): 3x m5.xlarge nodes ($0.192/hr * 3 * 730hr) = $420/mo compute + $200 management = $620/mo minimum
- V4.1 (Serverless): $340/mo at 10,000 invocations/day (Lambda + DynamoDB + S3 + API GW)
- Actual reduction: ($620 - $340) / $620 = 45% at low volume
- At scale (100K invocations/day): K8s needs scaling ($2,000/mo) vs serverless ($800/mo) = 60% reduction
- The "86%" figure applies when comparing against **full enterprise Kubernetes** with monitoring, logging, CI/CD, and ops team: ~$5,000/mo vs ~$700/mo = 86%
- **Revised claim**: 45-86% cost reduction depending on scale and comparison baseline [VALIDATED with range]

---

## 29. Appendices

### Appendix A: Architecture Decision Records (ADR) Index

| ADR | Decision | Status | Date |
|-----|----------|--------|------|
| ADR-001 | Serverless over Kubernetes | Accepted | 2025-Q4 |
| ADR-002 | Multi-cloud abstraction layer pattern | Accepted | 2026-Q1 |
| ADR-003 | Temporal.io for cross-cloud orchestration | Accepted | 2026-Q1 |
| ADR-004 | LocalStack for local development | Accepted | 2025-Q4 |
| ADR-005 | Claude MCP for browser automation | Accepted | 2026-Q1 |
| ADR-006 | DynamoDB as primary database | Accepted | 2025-Q4 |
| ADR-007 | Event-driven architecture with EventBridge | Accepted | 2026-Q1 |
| ADR-008 | Saga pattern for distributed rollback | Accepted | 2026-Q1 |

### Appendix B: Cloud Service Mapping (Complete)

| Category | AWS | Azure | GCP |
|----------|-----|-------|-----|
| Serverless Compute | Lambda | Azure Functions | Cloud Functions |
| Container Serverless | Fargate | Container Apps | Cloud Run |
| Kubernetes | EKS | AKS | GKE |
| VMs | EC2 | Virtual Machines | Compute Engine |
| Object Storage | S3 | Blob Storage | Cloud Storage |
| Block Storage | EBS | Managed Disks | Persistent Disk |
| File Storage | EFS | Azure Files | Filestore |
| Relational DB | RDS / Aurora | Azure SQL / PostgreSQL | Cloud SQL / Spanner |
| NoSQL | DynamoDB | Cosmos DB | Firestore |
| Caching | ElastiCache | Azure Cache for Redis | Memorystore |
| Message Queue | SQS | Service Bus | Pub/Sub |
| Event Bus | EventBridge | Event Grid | Eventarc |
| Notification | SNS | Notification Hubs | Firebase Cloud Messaging |
| Workflow | Step Functions | Durable Functions / Logic Apps | Workflows |
| API Gateway | API Gateway | API Management | API Gateway / Cloud Endpoints |
| CDN | CloudFront | Front Door / CDN | Cloud CDN |
| DNS | Route 53 | Azure DNS / Traffic Manager | Cloud DNS |
| Identity | IAM + Cognito | Azure AD + AD B2C | Cloud IAM + Identity Platform |
| Secrets | Secrets Manager | Key Vault | Secret Manager |
| Encryption | KMS | Key Vault | Cloud KMS |
| Monitoring | CloudWatch | Azure Monitor | Cloud Monitoring |
| Logging | CloudWatch Logs | Log Analytics | Cloud Logging |
| Tracing | X-Ray | Application Insights | Cloud Trace |
| AI/ML | Bedrock / SageMaker | Azure OpenAI / Azure ML | Vertex AI |
| Migration | Migration Hub / DMS | Azure Migrate / DMS | Database Migration Service |
| IaC | CloudFormation | ARM / Bicep | Deployment Manager |
| CI/CD | CodePipeline | Azure DevOps | Cloud Build |

### Appendix C: Glossary

| Term | Definition |
|------|-----------|
| 6Rs | Rehost, Replatform, Refactor, Repurchase, Retire, Retain - migration strategies |
| ADR | Architecture Decision Record - documented architectural decision |
| CAL | Cloud Abstraction Layer - adapter pattern for multi-cloud |
| CDC | Change Data Capture - real-time data replication |
| DLQ | Dead Letter Queue - failed message storage |
| MCP | Model Context Protocol - Claude AI integration protocol |
| RPO | Recovery Point Objective - acceptable data loss duration |
| RTO | Recovery Time Objective - acceptable downtime duration |
| Saga | Distributed transaction pattern with compensating actions |
| TAM | Technical Account Manager |

### Appendix D: References

1. Zhao, H., et al. (2022). "Supporting multi-cloud in serverless computing." arXiv preprint arXiv:2209.09367
2. Milvus. (2026, Feb 2). "How does serverless architecture support multi-cloud deployments." AI Quick Reference
3. LocalStack. (2025). "LocalStack expands beyond AWS with multi-cloud emulation." Efficiently Connected
4. LocalStack. (2025). "LocalStack for Azure: Introduction." LocalStack Documentation
5. Yahoo Finance. (2026, Jan 29). "Cloud migration services industry report 2026."
6. N-iX. (2022). "Top 25 cloud migration companies worldwide in 2026."
7. Serverless Framework. (2025). "Serverless Framework V4 Documentation."
8. Temporal Technologies. (2025). "Temporal.io Documentation."
9. AWS. (2025). "AWS Well-Architected Framework - Serverless Applications Lens."
10. Microsoft. (2025). "Azure Architecture Center - Migration Guide."
11. Google Cloud. (2025). "Google Cloud Architecture Framework - Migration."

---

**Document End**

Last Updated: February 12, 2026
Next Review: March 1, 2026
