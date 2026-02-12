# ADR-003: Temporal.io for Cross-Cloud Orchestration

**Status**: Accepted
**Date**: 2026-Q1

## Context

Migrations spanning multiple clouds (e.g., AWS to Azure) need long-running, durable workflows that survive failures across cloud boundaries. AWS Step Functions only work within AWS. Azure Durable Functions only work within Azure.

## Decision

Use **Temporal.io** for cross-cloud migration orchestration, while keeping cloud-native workflow engines (Step Functions, Durable Functions) for single-cloud migrations.

## Justification

Temporal.io provides durable execution (survives crashes), long-running workflows (days/weeks), cross-cloud workers (can invoke both AWS and Azure APIs), built-in retry policies, full audit history, and saga pattern support for distributed rollback.

## Deployment

- **Development**: Self-hosted Temporal in Docker (see docker-compose.yml)
- **Production**: Temporal Cloud (managed service) at $500/mo estimated

## Consequences

- Positive: True cross-cloud orchestration, saga rollback, workflow visibility
- Negative: Additional dependency, learning curve (Go SDK), managed service cost
- Mitigated: Temporal Cloud eliminates operational overhead; team training included in roadmap

---

# ADR-004: LocalStack for Local Development

**Status**: Accepted
**Date**: 2025-Q4

## Context

Developers need to test serverless functions locally without deploying to cloud accounts (cost, speed, isolation).

## Decision

Use **LocalStack** (Community Edition) as the primary local development environment, emulating AWS services.

## Verified Services (Feb 12, 2026)

S3, DynamoDB, Lambda, SQS, SNS, Step Functions, API Gateway, EventBridge, IAM, STS, CloudWatch, Secrets Manager, KMS, Kinesis - all confirmed available on LocalStack 4.13.2.dev60.

## Consequences

- Positive: Free, fast feedback loop, no cloud costs during development
- Negative: Community edition has limited Azure emulation (11 services only); some AWS services may behave differently
- Mitigated: Integration tests run against real cloud accounts in CI/CD pipeline

---

# ADR-005: Claude MCP for Browser Automation

**Status**: Accepted
**Date**: 2026-Q1

## Context

Some cloud operations require browser interaction (Azure portal, complex AWS Console configs, GCP project setup). Manual operations are slow and error-prone.

## Decision

Integrate **Claude MCP (Model Context Protocol)** with Playwright browser instances to automate cloud console operations.

## Use Cases

1. Azure Developer CLI (azd) template deployment
2. AWS Console operations not available via CLI
3. GCP project creation and API enablement
4. Grafana dashboard creation
5. Auto-screenshot for documentation

## Consequences

- Positive: 10x faster than manual console operations, reproducible, auditable
- Negative: Browser automation is fragile (UI changes break scripts), requires headful browser
- Mitigated: CLI/API preferred; MCP is fallback for console-only operations

---

# ADR-006: DynamoDB as Primary Database

**Status**: Accepted
**Date**: 2025-Q4

## Context

Platform needs a primary database for workloads, assessments, migrations, and transfers.

## Decision

Use **DynamoDB** (AWS) / **Cosmos DB** (Azure) / **Firestore** (GCP) as primary NoSQL database via the DatabaseAdapter abstraction.

## Justification

| Criterion | DynamoDB | RDS PostgreSQL | Winner |
|-----------|----------|---------------|--------|
| Serverless | Yes (on-demand) | No (always-on instance) | DynamoDB |
| Cost at low volume | $0 (free tier) | $15/mo minimum | DynamoDB |
| Scaling | Automatic, unlimited | Manual (resize instance) | DynamoDB |
| Multi-cloud equivalent | Cosmos DB, Firestore | Cloud SQL, Azure SQL | Tie |
| Query flexibility | Limited (key-value + indexes) | Full SQL | PostgreSQL |

## Consequences

- Positive: Zero operational overhead, automatic scaling, pay-per-request
- Negative: No SQL joins, limited query patterns, requires careful data modeling
- Mitigated: Denormalized data model designed for access patterns; graph queries use Neptune

---

# ADR-007: Event-Driven Architecture

**Status**: Accepted
**Date**: 2026-Q1

## Context

Seven microservices need to communicate. Options: synchronous HTTP, message queues, event bus.

## Decision

Use **event-driven architecture** with EventBridge (AWS) / Event Grid (Azure) / Pub/Sub (GCP) as the primary inter-service communication mechanism.

## Justification

Events decouple services (independent deployment), enable retry (DLQ on failure), support audit logging (event history), and allow adding new consumers without modifying publishers.

## Consequences

- Positive: Loose coupling, resilience, audit trail, easy to add new services
- Negative: Eventual consistency (not immediate), debugging requires correlation IDs
- Mitigated: Correlation IDs on all events, centralized logging, DLQ monitoring

---

# ADR-008: Saga Pattern for Distributed Rollback

**Status**: Accepted
**Date**: 2026-Q1

## Context

Multi-phase migrations involve provisioning infrastructure, transferring data, switching DNS. If any phase fails, all previous phases must be undone.

## Decision

Implement the **Saga Pattern** where each forward action has a compensating (rollback) action. Orchestrated by Temporal.io (cross-cloud) or Step Functions (single-cloud).

## Rollback Guarantee

Less than 5 minutes to rollback any phase. Zero data loss because source system remains running during entire migration.

## Consequences

- Positive: Reliable rollback, zero data loss, customer confidence
- Negative: Compensating actions must be implemented for every forward action (doubles code)
- Mitigated: Template-based compensating actions reduce implementation effort
