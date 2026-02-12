# DynamoDB Schema Design - MigrationBox V5.0

## Overview

This document describes the DynamoDB table schemas for MigrationBox V5.0. All tables use **PAY_PER_REQUEST** billing mode for cost efficiency and auto-scaling.

## Table: Workloads

**Purpose**: Store discovered workloads from source environments.

**Partition Key**: `tenantId` (String)  
**Sort Key**: `workloadId` (String)

**Attributes**:
- `tenantId` (S) - Tenant identifier
- `workloadId` (S) - Unique workload identifier (format: `wl-{discoveryId}-{resourceId}`)
- `discoveryId` (S) - Discovery job identifier
- `type` (S) - Workload type: `compute`, `database`, `storage`, `network`, `application`, `container`, `serverless`
- `provider` (S) - Cloud provider: `aws`, `azure`, `gcp`
- `region` (S) - Region where workload exists
- `name` (S) - Workload name
- `status` (S) - Current status
- `metadata` (M) - Provider-specific metadata
- `dependencies` (L) - Array of workloadIds this workload depends on
- `discoveredAt` (S) - ISO timestamp

**Global Secondary Indexes**:
1. **discoveryId-index**: Query workloads by discovery job
   - Partition Key: `discoveryId`
   - Sort Key: `workloadId`
2. **type-index**: Query workloads by type
   - Partition Key: `type`
   - Sort Key: `workloadId`

**Access Patterns**:
- Get workload by tenantId + workloadId
- List workloads for a discovery job
- List workloads by type for a tenant
- Query workloads with dependencies

---

## Table: Assessments

**Purpose**: Store 6Rs assessment results for workloads.

**Partition Key**: `tenantId` (String)  
**Sort Key**: `assessmentId` (String)

**Attributes**:
- `tenantId` (S)
- `assessmentId` (S) - Unique assessment identifier
- `workloadId` (S) - Reference to workload
- `strategy` (S) - Migration strategy: `rehost`, `replatform`, `refactor`, `repurchase`, `retire`, `retain`
- `confidence` (N) - Confidence score (0-1)
- `costProjection` (M) - Cost projection object
  - `monthly` (N)
  - `yearly` (N)
  - `threeYear` (N)
  - `currency` (S)
- `riskScore` (N) - Risk score (0-100)
- `complexityScore` (N) - Complexity score (0-100)
- `timelineWeeks` (N) - Estimated timeline in weeks
- `timelineConfidence` (M) - Timeline confidence intervals
  - `min` (N)
  - `max` (N)
  - `p50` (N)
  - `p95` (N)
- `recommendations` (L) - Array of recommendation strings
- `blockers` (L) - Array of blocker strings
- `createdAt` (S) - ISO timestamp

**Global Secondary Indexes**:
1. **workloadId-index**: Query assessments by workload
   - Partition Key: `workloadId`
   - Sort Key: `assessmentId`
2. **strategy-index**: Query assessments by strategy
   - Partition Key: `strategy`
   - Sort Key: `assessmentId`

**Access Patterns**:
- Get assessment by tenantId + assessmentId
- List assessments for a workload
- List assessments by strategy for a tenant

---

## Table: Migrations

**Purpose**: Track migration execution status and metadata.

**Partition Key**: `tenantId` (String)  
**Sort Key**: `migrationId` (String)

**Attributes**:
- `tenantId` (S)
- `migrationId` (S) - Unique migration identifier
- `workloadId` (S) - Reference to workload
- `sourceProvider` (S) - Source cloud provider
- `targetProvider` (S) - Target cloud provider
- `status` (S) - Migration status: `pending`, `discovering`, `assessing`, `planning`, `migrating`, `validating`, `completed`, `failed`, `rolled_back`
- `strategy` (S) - Migration strategy
- `assessmentId` (S) - Reference to assessment
- `iacTemplateId` (S) - Reference to generated IaC template
- `startedAt` (S) - ISO timestamp
- `completedAt` (S) - ISO timestamp
- `failedAt` (S) - ISO timestamp
- `error` (S) - Error message if failed
- `rollbackAt` (S) - ISO timestamp if rolled back
- `metadata` (M) - Migration-specific metadata

**Global Secondary Indexes**:
1. **workloadId-index**: Query migrations by workload
   - Partition Key: `workloadId`
   - Sort Key: `migrationId`
2. **status-index**: Query migrations by status
   - Partition Key: `status`
   - Sort Key: `migrationId`
3. **provider-index**: Query migrations by provider pair
   - Partition Key: `sourceProvider`
   - Sort Key: `targetProvider`

**Access Patterns**:
- Get migration by tenantId + migrationId
- List migrations for a workload
- List migrations by status (e.g., all "running" migrations)
- Query migrations by provider pair

---

## Table: Tenants

**Purpose**: Store tenant/multi-tenant information.

**Partition Key**: `tenantId` (String)

**Attributes**:
- `tenantId` (S) - Unique tenant identifier
- `name` (S) - Tenant name
- `email` (S) - Tenant email (for authentication)
- `tier` (S) - Pricing tier: `starter`, `professional`, `enterprise`, `custom`
- `status` (S) - Tenant status: `active`, `suspended`, `deleted`
- `createdAt` (S) - ISO timestamp
- `updatedAt` (S) - ISO timestamp

**Global Secondary Indexes**:
1. **email-index**: Query tenant by email (for authentication)
   - Partition Key: `email`

**Access Patterns**:
- Get tenant by tenantId
- Get tenant by email (for login)

---

## Table: IntentSchemas

**Purpose**: Store I2I Pipeline Intent Schemas (IR - Intermediate Representation).

**Partition Key**: `tenantId` (String)  
**Sort Key**: `intentId` (String)

**Attributes**:
- `tenantId` (S)
- `intentId` (S) - Unique intent identifier
- `naturalLanguage` (S) - Original natural language description
- `provider` (S) - Target cloud provider
- `resources` (L) - Array of IntentResource objects
- `networking` (M) - Networking configuration
- `security` (M) - Security configuration
- `compliance` (L) - Array of compliance frameworks
- `confidence` (N) - Confidence score (0-1)
- `createdAt` (S) - ISO timestamp
- `validatedAt` (S) - ISO timestamp

**Global Secondary Indexes**:
1. **provider-index**: Query intents by provider
   - Partition Key: `provider`
   - Sort Key: `intentId`

**Access Patterns**:
- Get intent schema by tenantId + intentId
- List intents by provider for a tenant

---

## Table: AgentTasks

**Purpose**: Track Agentic AI agent task execution.

**Partition Key**: `tenantId` (String)  
**Sort Key**: `taskId` (String)

**Attributes**:
- `tenantId` (S)
- `taskId` (S) - Unique task identifier
- `agentType` (S) - Agent type: `discovery`, `assessment`, `iac-generation`, `validation`, `optimization`, `orchestration`
- `migrationId` (S) - Reference to migration (optional)
- `status` (S) - Task status: `pending`, `running`, `completed`, `failed`
- `payload` (M) - Task input payload
- `result` (M) - Task output result
- `error` (S) - Error message if failed
- `createdAt` (S) - ISO timestamp
- `startedAt` (S) - ISO timestamp
- `completedAt` (S) - ISO timestamp
- `ttl` (N) - TTL timestamp (30 days after completion for auto-cleanup)

**Global Secondary Indexes**:
1. **agentType-index**: Query tasks by agent type
   - Partition Key: `agentType`
   - Sort Key: `taskId`
2. **status-index**: Query tasks by status
   - Partition Key: `status`
   - Sort Key: `taskId`
3. **migrationId-index**: Query tasks by migration
   - Partition Key: `migrationId`
   - Sort Key: `taskId`

**TTL**: Enabled on `ttl` attribute for automatic cleanup of completed tasks older than 30 days.

**Access Patterns**:
- Get task by tenantId + taskId
- List tasks by agent type
- List tasks by status
- List tasks for a migration

---

## Notes

- All tables use **PAY_PER_REQUEST** billing mode for cost efficiency
- All timestamps are stored as ISO 8601 strings (S type)
- TTL is enabled on AgentTasks table for automatic cleanup
- GSI projection type is **ALL** to support all query patterns
- Consider adding DynamoDB Streams for real-time event processing
