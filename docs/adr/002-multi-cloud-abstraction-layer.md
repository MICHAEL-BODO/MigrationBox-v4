# ADR-002: Multi-Cloud Abstraction Layer Pattern

**Status**: Accepted
**Date**: 2026-Q1

## Context

MigrationBox must deploy to AWS, Azure, and GCP from a single codebase. We needed an approach to abstract cloud-specific APIs.

## Decision

Implement a **Cloud Abstraction Layer (CAL)** using the Adapter Pattern with unified interfaces for Storage, Database, Messaging, IAM, and Compute. Each cloud provider has a concrete adapter implementation.

## Alternatives Considered

1. **Kubernetes everywhere** - Rejected: violates serverless principle (ADR-001)
2. **Terraform-only abstraction** - Rejected: IaC is build-time only, not runtime portable
3. **Cloud-agnostic libraries (Pulumi/Crossplane)** - Rejected: build-time abstractions don't help runtime code
4. **No abstraction (write 3 codebases)** - Rejected: 3x maintenance cost

## Justification

The Adapter Pattern provides compile-time type safety (TypeScript interfaces), runtime flexibility (factory pattern selects provider), and testability (mock adapters for unit tests). Business logic has zero cloud SDK imports, making it truly portable.

## Consequences

- Positive: Single codebase for three clouds, easy to add new providers
- Negative: Cannot use cloud-specific optimizations (e.g., DynamoDB Streams, Cosmos Change Feed) without adapter extensions
- Mitigated: Adapter interfaces are extensible; provider-specific features available via optional methods
