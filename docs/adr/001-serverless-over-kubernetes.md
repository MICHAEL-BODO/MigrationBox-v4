# ADR-001: Serverless Architecture over Kubernetes

**Status**: Accepted
**Date**: 2025-Q4
**Decision Makers**: Architecture Team

## Context

MigrationBox needed a compute platform for running migration workloads. The two primary options were Kubernetes (EKS/AKS/GKE) and serverless functions (Lambda/Azure Functions/Cloud Functions).

## Decision

We chose **100% serverless architecture** (AWS Lambda, Azure Functions, GCP Cloud Functions) over Kubernetes.

## Justification

| Criterion | Kubernetes | Serverless | Winner |
|-----------|-----------|------------|--------|
| Operational overhead | High (cluster mgmt, upgrades, node scaling) | Zero (fully managed) | Serverless |
| Cost at low volume | ~$620/mo minimum (3 nodes idle) | ~$5/mo (pay-per-invocation) | Serverless |
| Cost at scale | ~$2,000/mo (auto-scaling nodes) | ~$800/mo (10K invocations/day) | Serverless |
| Team size required | 4-5 (DevOps + SRE) | 2-3 (developers only) | Serverless |
| Cold start latency | None (always running) | 50-500ms (mitigated by provisioned concurrency) | Kubernetes |
| Max execution time | Unlimited | 15 min (Lambda), 10 min (Azure Fn) | Kubernetes |
| Multi-cloud portability | High (K8s is K8s everywhere) | Medium (requires abstraction layer) | Kubernetes |

**Decision rationale**: For a startup with a small team, operational overhead is the primary concern. Serverless eliminates it entirely. The cold start limitation is acceptable for migration workloads (batch processing, not real-time). The multi-cloud portability gap is closed by our Cloud Abstraction Layer (ADR-002).

## Consequences

- Positive: 45-86% cost reduction, zero ops overhead, infinite automatic scaling
- Negative: 15-min execution limit requires chunking long-running tasks, cold starts require provisioned concurrency for user-facing APIs
- Mitigated: Long-running migrations use Temporal.io (ADR-003) which handles state across multiple Lambda invocations

## Validation

- V2 prototype confirmed $340/mo vs projected $620/mo for equivalent K8s deployment [VALIDATED]
- Cold start measured at < 200ms for Node.js 20 Lambda with 256MB memory [VALIDATED]
