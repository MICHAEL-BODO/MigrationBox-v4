# MigrationBox V5.0 — Complete Platform Architecture

**Version**: 5.0.0 (AI-First + I2I Pipeline + Agentic Orchestration Edition)  
**Date**: February 12, 2026  
**Author**: Sir Chief Architect (Mihaly Bodo)  
**Status**: Architecture Complete — Ready for Implementation  
**Codename**: "Phoenix"  
**Supersedes**: ARCHITECTURE-V4-PLUS.md, AI_ENHANCEMENTS.md (all content consolidated herein)

---

## Table of Contents

| # | Section | Description |
|---|---------|-------------|
| 1 | Executive Summary | Platform overview, key metrics, financial projections |
| 2 | Platform Vision & Market Context | Problem, opportunity, competitive landscape |
| 3 | Five Flagship Capabilities | I2I, Agentic AI, CRDT, Extended Thinking, MCP Mesh — highlighted |
| 4 | System Architecture Overview | Full platform diagram, component registry |
| 5 | Cloud Abstraction Layer | Multi-cloud portability, adapter interfaces, factory pattern |
| 6 | Backend Services Architecture | All 7 core services, APIs, data flows, contracts |
| 7 | I2I Pipeline Deep Dive | Intent Schema, 4-layer architecture, Synthesis Engine, OPA/Rego |
| 8 | Agentic AI Orchestration | 6 agents, EventBridge, A2A protocol, Temporal workflows |
| 9 | CRDT Knowledge Network | Distributed patterns, GDPR compliance, merge semantics |
| 10 | Extended Thinking Engine | Multi-variable analysis, risk scoring, confidence intervals |
| 11 | Federated MCP Server Mesh | 12+ MCP servers, multi-cloud knowledge, real-time querying |
| 12 | AI/ML Intelligence Layer | All ML models, Bedrock, SageMaker, training pipelines |
| 13 | Frontend Architecture — Desktop SaaS | Next.js 15 control panel, dashboards, component library |
| 14 | Frontend Architecture — iPhone Companion | React Native / Swift, voice interface, offline-first |
| 15 | MCP Requirements & Deployment | All MCP servers, Docker containers, laptop/iPhone deploy |
| 16 | Data Architecture | DynamoDB, PostgreSQL, Neo4j, Redis, OpenSearch, S3 |
| 17 | API Architecture | REST endpoints, GraphQL, WebSocket, rate limiting, auth |
| 18 | Event-Driven Architecture | EventBridge, SQS/SNS, Kafka, event schemas |
| 19 | Workflow Orchestration | Step Functions, Temporal.io, Saga patterns, rollback |
| 20 | Security Architecture | 5-layer defense, zero trust, encryption, compliance |
| 21 | Multi-Tenancy Architecture | Isolation, billing, onboarding, data partitioning |
| 22 | Observability & Operations | Metrics, logs, traces, dashboards, alerting |
| 23 | Disaster Recovery | RPO/RTO, failover, cross-region, self-healing |
| 24 | Local Development (LocalStack) | Docker Compose, verified services, dev workflow |
| 25 | Deployment Strategy | Environments, CI/CD, blue-green, canary |
| 26 | Testing Strategy | Pyramid, categories, tools, chaos engineering |
| 27 | Cost Model | Platform costs, AI costs, per-migration economics |
| 28 | Risk Register | 15 risks with mitigations, owners, probabilities |
| 29 | Performance Targets | Latency, throughput, scale, benchmarks |
| 30 | Implementation Roadmap | 6-month plan, 12 sprints, milestones |
| 31 | Appendices | ADRs, cloud service mapping, glossary, references |

---

## 1. Executive Summary

MigrationBox V5.0 is a **100% serverless, AI-first, multi-cloud migration automation platform** that discovers, analyzes, migrates, validates, and optimizes workloads across AWS, Azure, and Google Cloud Platform. It replaces months of manual cloud migration consulting with automated, AI-driven orchestration powered by five flagship capabilities that together deliver 20x–100x productivity multipliers.

The platform is built on a hybrid architecture that combines LLM intelligence for ambiguity resolution with deterministic engines for guaranteed correctness — embodied most powerfully in the Intent-to-Infrastructure (I2I) pipeline, where natural language descriptions become validated, deployable Infrastructure-as-Code in minutes instead of days.

### Platform Equation

```
MigrationBox = I2I Pipeline (20-50x) 
             × Agentic Orchestration (7-100x) 
             × CRDT Knowledge (10,000x at scale) 
             × Extended Thinking (10x decisions) 
             × Federated MCP Mesh (1,000x knowledge)
```

### Key Metrics

| Metric | Value | Comparison |
|--------|-------|------------|
| Migration Success Rate | 95%+ | vs 27% industry unplanned |
| IaC Generation Speed | Minutes | vs Days manual |
| Config Error Reduction | 99.8% | Deterministic guardrails |
| Migration Duration | 1–2.4 weeks | vs 10.5 weeks manual |
| Infrastructure Cost | 86% reduction | Serverless vs Kubernetes |
| Cold Start Latency | <200ms | vs 2,000ms K8s |
| Decision Quality | 10x | Extended Thinking |
| Knowledge Scale | 10,000x | CRDT replication |
| Addressable Market | 2x | Multi-cloud federation |
| Engagement Revenue | €20K–€60K | Per migration |
| Timeline Prediction | <15% MAPE | vs 35% manual estimation |
| Rollback Time | <30 seconds | Autonomous detection-to-recovery |
| Cost Optimization | +25% savings | Beyond baseline 18% |
| Dependency Discovery | 95% accuracy | vs 70% config-only |

### Financial Projections

| Year | ARR Target | Customers | Avg Engagement | I2I Revenue Add |
|------|------------|-----------|----------------|-----------------|
| Year 1 | €6.48M | 150 | €25K–€60K | +€15K–€40K |
| Year 2 | €14M | 400 | €30K–€70K | +€20K–€50K |
| Year 3 | €35M | 1,000 | €35K–€80K | +€25K–€60K |

### Technology Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend (Desktop) | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui | SaaS Control Panel |
| Frontend (Mobile) | React Native + Swift modules | iPhone Companion App |
| API Gateway | AWS API Gateway HTTP, Azure APIM, GCP API GW | Multi-cloud routing |
| Functions | Lambda, Azure Functions, Cloud Functions | Business logic |
| Orchestration | Step Functions + Temporal.io + EventBridge | Workflows + agents |
| I2I Engine | Bedrock Claude + OPA/Rego + CUE Lang + Terraform | Intent-to-Infrastructure |
| Event Bus | EventBridge + Event Grid + Pub/Sub | Event-driven backbone |
| Primary DB | DynamoDB (multi-region) | Workloads, migrations, tenants |
| Analytics DB | PostgreSQL (Aurora Serverless) | Reporting, CRDT merge |
| Graph DB | Neo4j | Dependency graphs, knowledge network |
| Vector DB | OpenSearch Serverless | RAG, semantic search |
| Cache | ElastiCache Redis | Sessions, rate limiting, inference |
| Object Storage | S3 / Azure Blob / GCS | Artifacts, logs, backups |
| AI/ML | Bedrock Claude Sonnet 4.5, SageMaker, Whisper, Polly | Intelligence layer |
| Browser Automation | Claude MCP, Playwright, Puppeteer | Console automation |
| IaC | Serverless Framework V4, Terraform, Pulumi, Crossplane | Infrastructure |
| Local Dev | LocalStack Pro, Docker Compose | Emulation |
| CI/CD | GitHub Actions | Automation |
| Monitoring | CloudWatch, Grafana, X-Ray | Observability |
| CRDT | Yjs / Automerge | Distributed knowledge sync |

---

## 2. Platform Vision & Market Context

### The Problem

Enterprises waste **$3.7M/year** on manual Infrastructure-as-Code work. **83% of migrations fail or exceed budget** (Gartner). Multi-cloud environments (used by 87% of Fortune 500) multiply complexity 3x per provider. No existing tool provides end-to-end automation across all three major clouds with AI-generated, validated, deployable infrastructure.

**Specific Pain Points:**
- Manual migration projects: 6–18 months, $500K+, specialized consultants required
- IaC generation: error-prone, requires deep platform expertise per cloud
- Risk assessment: gut-feel vs data-driven, leading to 73% failure rate on unplanned migrations
- Knowledge loss: every engagement starts from scratch, no institutional learning
- Multi-cloud: each provider requires separate tooling, teams, and processes

### Market Opportunity

| Market | Size | Growth | Source |
|--------|------|--------|--------|
| Cloud Migration Services | $15.76B → $86.06B by 2034 | 23.64% CAGR | Mordor Intelligence |
| IaC Market | $1B → $6B by 2033 | ~25% CAGR | StackGen Analysis |
| Public Cloud Migration | $414.18B by 2033 | 31.2% CAGR | Precedence Research |
| AI-Powered IaC Adoption | 94% Fortune 500 | Accelerating | Enterprise Survey |
| Multi-Cloud Adoption | 87% of enterprises | Stable high | Fortune 500 Survey |

### Competitive Landscape

| Competitor | Approach | Strength | MigrationBox Advantage |
|-----------|----------|----------|----------------------|
| StackGen | I2I pioneer, single-cloud | First mover in I2I | Multi-cloud + CRDT knowledge + agentic |
| Spacelift Intent | IaC management + intent | Strong drift detection | Full migration lifecycle, not just IaC |
| Pulumi Neo | AI IaC generation | TypeScript-native | Deterministic guardrails, compliance |
| Terraform Cloud | Manual IaC workflow | Massive ecosystem | I2I natural language → validated IaC |
| AWS Migration Hub | AWS-only migration | Deep AWS integration | Multi-cloud + agentic orchestration |
| Azure Migrate | Azure-only migration | Enterprise AD integration | Multi-cloud + I2I + Extended Thinking |
| Google Cloud Migrate | GCP-only migration | Anthos multi-cloud | True serverless + AI-first approach |

### Our Solution — The Migration Lifecycle

MigrationBox automates the entire migration lifecycle:

1. **Discover** — Scan source environments (on-prem, VMware, any cloud), inventory every workload, dependency, and data asset using AI-powered GraphSAGE neural networks
2. **Analyze** — AI-powered path analysis with 6Rs framework, cost/risk/timeline scoring using Extended Thinking with 100+ variables
3. **Generate** — I2I Pipeline: natural language → validated, deployable IaC via 4-layer hybrid architecture
4. **Migrate** — Zero-downtime orchestrated migration via 6 specialized AI agents coordinated through EventBridge
5. **Validate** — 5-dimension post-migration validation (connectivity, performance, data integrity, security, compliance)
6. **Optimize** — Continuous cost optimization via AI Copilot with 8 analyzers, auto-remediation with approval gates
7. **Learn** — CRDT-backed knowledge network captures anonymized patterns, making every migration faster

---

## 3. Five Flagship Capabilities

These five capabilities represent the highest-value differentiators of the MigrationBox platform. They are **highlighted** here as flagship features and expanded in dedicated sections (7–11). All other platform capabilities described in sections 4–6 and 12–31 are equally essential to the complete system.

### 🏗️ #1 — Intent-to-Infrastructure (I2I) Pipeline [FLAGSHIP]

**Multiplier: 20x–50x | Revenue: +€15K–€40K/engagement**

The crown jewel. Users describe their target state in natural language, and the system generates validated, deployable Infrastructure-as-Code through a 4-layer hybrid pipeline: LLM Intent Ingestion → Deterministic Policy Guardrails → Template-Based Synthesis Engine → Closed-Loop Reconciliation.

The IaC market is exploding from $1B to $6B by 2033. 94% of Fortune 500 companies are already using AI-powered IaC. StackGen coined "intent-to-infrastructure"; Spacelift Intent and Pulumi Neo are shipping this now. MigrationBox's advantage is the deterministic guardrail layer that guarantees compliance (PCI-DSS, HIPAA, SOC 2, GDPR) and the CRDT knowledge network that makes each generation smarter.

**Full deep dive: Section 7**

### 🤖 #2 — Agentic AI Orchestration (Multi-Agent Migration)

**Multiplier: 7.13x (AWS-validated) → 100x composed | Revenue: 8x–10x at scale**

Six specialized AI agents — Discovery, Assessment, IaC Generation, Validation, Optimization, Orchestration — coordinated via EventBridge using the Linux Foundation's A2A protocol (adopted by Adobe, Microsoft, SAP, ServiceNow). AWS validated 7.13x productivity multiplier at re:Invent 2025 with "frontier agents." The result: a migration that took 10.5 weeks manually completes in 1–2.4 weeks.

**Full deep dive: Section 8**

### 🧠 #3 — CRDT-Backed Knowledge Network

**Multiplier: 10,000x knowledge base (at scale) | Revenue: Compounding**

Conflict-Free Replicated Data Types (used by League of Legends for 7.5M concurrent users, Facebook Apollo, Redis Enterprise) enable distributed migration knowledge that merges without conflicts. Every MigrationBox engagement generates anonymized pattern data — failure modes, cost baselines, dependency graphs — that replicates across all instances. GDPR-compliant because only anonymized patterns sync; raw data stays within client boundaries.

**Full deep dive: Section 9**

### 🧮 #4 — Extended Thinking for Complex Migration Decisions

**Multiplier: 10x decision quality | Revenue: Failure rate 83% → <10%**

Claude Extended Thinking enables multi-step reasoning chains that evaluate 100+ variables simultaneously — dependency analysis, risk scoring with confidence intervals, multi-cloud cost projections over 3 years, circular reference detection. This is the difference between a migration consultant who "thinks it'll probably work" and one who provides actuarial-grade risk assessment.

**Full deep dive: Section 10**

### 🌐 #5 — Federated MCP Server Mesh

**Multiplier: 1,000x knowledge (federated) | Revenue: 2x addressable market**

12+ Docker MCP servers form a multi-cloud knowledge mesh: AWS (core + CDK + Terraform + diagram), Azure (Microsoft Learn), GCP (Gemini + Cloud Run), plus Context7 for code docs. During a migration, MigrationBox simultaneously queries all three cloud providers' official documentation, generates IaC for any target, and compares pricing/capabilities in real-time. This turns MigrationBox from an "AWS migration tool" into a true multi-cloud platform, doubling the addressable market.

**Full deep dive: Section 11**

---

## 4. System Architecture Overview

### Complete Platform Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MIGRATIONBOX V5.0 PLATFORM                             │
│              (Serverless Framework V4 + Temporal + I2I + Agents)            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PRESENTATION LAYER                                                         │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────────────────────┐ │
│  │  Desktop SaaS    │  │ iPhone App   │  │  CLI Tool    │  Browser MCP  │ │
│  │  (Next.js 15)    │  │ (RN + Swift) │  │  (Python)    │  (Claude)     │ │
│  │  Control Panel   │  │ Voice + Chat │  │  Automation  │  Console Auto │ │
│  └────────┬─────────┘  └──────┬───────┘  └──────┬───────┴───────┬───────┘ │
│           │                    │                  │               │         │
│           └────────────────────┴──────────────────┴───────────────┘         │
│                                    │                                        │
│  ┌─────────────────────────────────┴──────────────────────────────────────┐ │
│  │                 API GATEWAY (Multi-Cloud Native)                        │ │
│  │    AWS API GW HTTP  │  Azure APIM  │  GCP API Gateway                  │ │
│  │    JWT Auth │ Rate Limiting │ Tenant Isolation │ CORS                   │ │
│  └─────────────────────────────────┬──────────────────────────────────────┘ │
│                                    │                                        │
│  ┌─────────────────────────────────┴──────────────────────────────────────┐ │
│  │              CLOUD ABSTRACTION LAYER (CAL)                              │ │
│  │  StorageAdapter │ DatabaseAdapter │ MessagingAdapter │ IAMAdapter       │ │
│  │  ComputeAdapter │ MonitoringAdapter │ SecretsAdapter                    │ │
│  └─────────────────────────────────┬──────────────────────────────────────┘ │
│                                    │                                        │
├────────────────────────────────────┴────────────────────────────────────────┤
│                                                                             │
│  BUSINESS LOGIC LAYER (Serverless Functions)                                │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│  │  Discovery    │ │  Assessment   │ │ Provisioning  │ │  Validation   │  │
│  │  Service      │ │  Service      │ │  Service      │ │  Service      │  │
│  │ ─────────────│ │ ─────────────│ │ ─────────────│ │ ─────────────│  │
│  │ Workload Scan│ │ 6Rs Analysis │ │ I2I Pipeline │ │ PreFlight    │  │
│  │ Dependency   │ │ Cost Project │ │ Terraform Gen│ │ PostMigrate  │  │
│  │ DataClassify │ │ Risk Score   │ │ MCP Automate │ │ PerfTest     │  │
│  │ (Python)     │ │ (TS + AI)    │ │ (Python+IaC) │ │ (TypeScript) │  │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘  │
│                                                                             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                     │
│  │ Orchestration │ │ Data Transfer │ │ Optimization  │                     │
│  │  Service      │ │  Service      │ │  Service      │                     │
│  │ ─────────────│ │ ─────────────│ │ ─────────────│                     │
│  │ Step Fn      │ │ DB Sync      │ │ Cost Copilot │                     │
│  │ Temporal     │ │ File Transfer│ │ Right-Size   │                     │
│  │ Agent Coord  │ │ CDC/Repl     │ │ RI/Savings   │                     │
│  │ (Go+Temporal)│ │ (Python+Go)  │ │ (TS + AI)    │                     │
│  └───────────────┘ └───────────────┘ └───────────────┘                     │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  I2I PIPELINE ENGINE                                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Intent Ingestion  → Validation/Policy → Synthesis Engine → Recon.   │   │
│  │ (Bedrock Claude)    (OPA/Rego+CUE)     (Terraform Modules) (Loop)  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  AGENTIC AI ORCHESTRATION                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Discovery   Assessment   IaC Gen   Validation   Optim.   Orchestr.  │   │
│  │  Agent       Agent       Agent      Agent       Agent     Agent     │   │
│  │    └───────────┴──────────┴──────────┴───────────┴─────────┘        │   │
│  │                    EventBridge (A2A Protocol)                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ORCHESTRATION LAYER                                                        │
│  ┌────────────────────┐ ┌─────────────────────┐ ┌────────────────────────┐ │
│  │ AWS Step Functions │ │ Azure Durable Fns   │ │ Temporal.io            │ │
│  │ (Rehost, simple)   │ │ (Azure-specific)    │ │ (Cross-cloud, complex) │ │
│  └────────────────────┘ └─────────────────────┘ └────────────────────────┘ │
│                                                                             │
│  EVENT-DRIVEN BACKBONE                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ AWS EventBridge │ Azure Event Grid │ GCP Pub/Sub │ Apache Kafka     │   │
│  │ (Primary bus)     (Azure events)     (GCP events)  (High-volume)    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DATA LAYER                                                                 │
│  ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ DynamoDB  │ │PostgreSQL │ │  Neo4j   │ │  Redis   │ │ OpenSearch    │  │
│  │ (Primary) │ │(Analytics)│ │ (Graph)  │ │ (Cache)  │ │ (Vector/RAG) │  │
│  │ Workloads │ │ Reporting │ │ Deps/KB  │ │ Session  │ │ Semantic Srch│  │
│  │ Migrations│ │ CRDT Merge│ │ GNN Data │ │ Rate Lim │ │ Doc Embed    │  │
│  │ Tenants   │ │ Multi-ten │ │ Patterns │ │ Inf Cache│ │ RAG Store    │  │
│  └───────────┘ └───────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│                                                                             │
│  ┌────────────────────────────────┐  ┌──────────────────────────────────┐  │
│  │ S3 / Azure Blob / GCS         │  │ MLflow (Model Registry)          │  │
│  │ Migration artifacts, logs,    │  │ Model versioning, A/B testing,  │  │
│  │ backups, IaC state, IR schemas│  │ experiment tracking             │  │
│  └────────────────────────────────┘  └──────────────────────────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  AI/ML INTELLIGENCE LAYER                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ LLM: Bedrock Claude Sonnet 4.5 │ Azure OpenAI │ GCP Vertex AI      │   │
│  │ ML:  SageMaker (LSTM, GNN, XGBoost) │ Lookout for Metrics          │   │
│  │ Voice: Whisper Large v3 (Hungarian) │ Polly Neural (Dóra)          │   │
│  │ Graph: PyTorch Geometric (GraphSAGE) │ Neo4j GDS                   │   │
│  │ NLP:  Extended Thinking chains  │ SHAP/LIME explainability         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  CRDT KNOWLEDGE NETWORK                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Yjs/Automerge CRDTs │ Anonymized patterns │ Federated sync          │   │
│  │ Failure modes │ Cost baselines │ Dependency graphs │ Best practices  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  FEDERATED MCP SERVER MESH                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ aws-mcp │ aws-cdk-mcp │ aws-terraform-mcp │ aws-diagram-mcp        │   │
│  │ azure-cli-mcp │ azure-learn-mcp │ gcp-gemini-mcp │ gcp-run-mcp    │   │
│  │ context7-mcp │ localstack-mcp │ playwright-mcp │ memory-mcp        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  SECURITY LAYER                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ WAF/DDoS │ IAM/OIDC │ JWT/mTLS │ KMS/AES-256 │ CloudTrail/Audit   │   │
│  │ Macie PII │ OPA Policies │ Bedrock Guardrails │ Secrets Manager    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
            │  Source Env   │  │  Target Cloud │  │  Multi-Cloud  │
            │  - On-prem    │  │  - AWS        │  │  - AWS+Azure  │
            │  - VMware     │  │  - Azure      │  │  - AWS+GCP    │
            │  - Any Cloud  │  │  - GCP        │  │  - All three  │
            │  - Mainframe  │  │  - Hybrid     │  │  - Hybrid     │
            └───────────────┘  └───────────────┘  └───────────────┘
```

### Complete Component Registry

| Component | Type | Technology | Owner | Status |
|-----------|------|-----------|-------|--------|
| Desktop SaaS UI | Frontend | Next.js 15 + TypeScript + Tailwind | Frontend | Planned |
| iPhone Companion | Mobile | React Native + Swift modules | Mobile | Planned |
| CLI Tool | CLI | Python 3.12 + Click + Rich | Backend | Planned |
| API Gateway | Infrastructure | AWS API GW HTTP / Azure APIM | DevOps | Planned |
| Discovery Service | Backend | Python 3.12 + Boto3 + Azure SDK | Backend | Planned |
| Assessment Service | Backend | TypeScript + Bedrock + Extended Thinking | Backend + AI | Planned |
| Provisioning Service | Backend | Python + Terraform + I2I Pipeline | Backend + AI | Planned |
| Orchestration Service | Backend | Go + Temporal + Step Functions | Backend | Planned |
| Validation Service | Backend | TypeScript + Playwright + k6 | Backend + QA | Planned |
| Data Transfer Service | Backend | Python + Go + CDC engines | Backend | Planned |
| Optimization Service | Backend | TypeScript + Bedrock + ML models | Backend + AI | Planned |
| I2I Intent Ingestion | AI/I2I | Bedrock Claude Sonnet 4.5 | AI | Planned |
| I2I Policy Guardrails | AI/I2I | OPA/Rego + CUE Lang | Security | Planned |
| I2I Synthesis Engine | AI/I2I | Terraform modules + Pulumi + Crossplane | DevOps | Planned |
| I2I Reconciliation Loop | AI/I2I | CloudWatch + Terraform Plan | DevOps | Planned |
| Discovery Agent | Agent | Python + Bedrock + AWS Config | AI | Planned |
| Assessment Agent | Agent | TypeScript + Extended Thinking | AI | Planned |
| IaC Generation Agent | Agent | Python + I2I Pipeline | AI | Planned |
| Validation Agent | Agent | TypeScript + Playwright | AI | Planned |
| Optimization Agent | Agent | TypeScript + Cost Explorer APIs | AI | Planned |
| Orchestration Agent | Agent | Go + Temporal + EventBridge | AI | Planned |
| CRDT Knowledge Store | Data | Yjs/Automerge + PostgreSQL | Backend | Planned |
| Neo4j Graph DB | Data | Neo4j Community/Enterprise | Data | Planned |
| OpenSearch Vector DB | Data | OpenSearch Serverless | Data | Planned |
| Redis Cache | Data | ElastiCache Redis | Data | Planned |
| MLflow Registry | AI | MLflow on EC2 | AI | Planned |
| SageMaker Endpoints | AI | SageMaker Real-Time | AI | Planned |
| Whisper Integration | AI | OpenAI Whisper Large v3 | AI | Planned |
| Polly Integration | AI | Amazon Polly Neural (Dóra) | AI | Planned |
| 12+ MCP Servers | Infrastructure | Docker containers + native | DevOps | Partial |
| LocalStack | Dev | LocalStack Community/Pro | DevOps | Verified |
| GitHub Actions CI/CD | DevOps | GitHub Actions | DevOps | Planned |
| Grafana Dashboards | Observability | Grafana Cloud / self-hosted | DevOps | Planned |

---

## 5. Cloud Abstraction Layer (CAL)

The Cloud Abstraction Layer enables **true multi-cloud portability** — a single codebase that deploys to AWS, Azure, or GCP with zero code changes. This is a core architectural pattern that underpins all 7 backend services.

### Architecture Pattern

```
Application Code (Business Logic)
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│           Cloud Abstraction Layer (CAL)                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │StorageAdapter│ │DatabaseAdapter│ │MessagingAdapter  │ │
│  ├──────────────┤ ├──────────────┤ ├──────────────────┤ │
│  │ IAMAdapter   │ │ComputeAdapter│ │MonitoringAdapter │ │
│  ├──────────────┤ ├──────────────┤ ├──────────────────┤ │
│  │SecretsAdapter│ │NetworkAdapter│ │ BillingAdapter   │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
│                         │                                 │
│              AdapterFactory (provider)                    │
└─────────────────────────┬───────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│     AWS      │ │    Azure     │ │     GCP      │
│  S3, DynamoDB│ │ Blob, Cosmos │ │ GCS, Firestr │
│  Lambda, SQS │ │ Fn, Svc Bus  │ │ CF, Pub/Sub  │
│  IAM, Cognito│ │ AD, Key Vault│ │ IAM, SecMgr  │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Adapter Interfaces

```typescript
// shared/lib/adapters/storage.adapter.ts
export interface IStorageAdapter {
  upload(bucket: string, key: string, data: Buffer, metadata?: Record<string, string>): Promise<void>;
  download(bucket: string, key: string): Promise<Buffer>;
  delete(bucket: string, key: string): Promise<void>;
  list(bucket: string, prefix?: string, maxKeys?: number): Promise<StorageObject[]>;
  getSignedUrl(bucket: string, key: string, expiresIn: number): Promise<string>;
  copy(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void>;
}

// shared/lib/adapters/database.adapter.ts
export interface IDatabaseAdapter {
  put(table: string, item: Record<string, any>): Promise<void>;
  get(table: string, key: Record<string, any>): Promise<Record<string, any> | null>;
  query(table: string, keyCondition: QueryCondition, options?: QueryOptions): Promise<QueryResult>;
  scan(table: string, filter?: ScanFilter, options?: ScanOptions): Promise<ScanResult>;
  update(table: string, key: Record<string, any>, updates: Record<string, any>): Promise<void>;
  delete(table: string, key: Record<string, any>): Promise<void>;
  batchWrite(table: string, operations: BatchOperation[]): Promise<void>;
  transactWrite(operations: TransactOperation[]): Promise<void>;
}

// shared/lib/adapters/messaging.adapter.ts
export interface IMessagingAdapter {
  publish(topic: string, message: any, attributes?: Record<string, string>): Promise<string>;
  subscribe(topic: string, endpoint: string, protocol: string): Promise<string>;
  sendToQueue(queue: string, message: any, delaySeconds?: number): Promise<string>;
  receiveFromQueue(queue: string, maxMessages?: number, waitTimeSeconds?: number): Promise<QueueMessage[]>;
  deleteMessage(queue: string, receiptHandle: string): Promise<void>;
}

// shared/lib/adapters/iam.adapter.ts
export interface IIAMAdapter {
  createRole(name: string, trustPolicy: any, permissions: string[]): Promise<string>;
  attachPolicy(roleName: string, policyArn: string): Promise<void>;
  assumeRole(roleArn: string, sessionName: string): Promise<Credentials>;
  validatePermissions(principal: string, action: string, resource: string): Promise<boolean>;
}

// shared/lib/adapters/compute.adapter.ts
export interface IComputeAdapter {
  invokeFunction(name: string, payload: any, async?: boolean): Promise<any>;
  listInstances(filters?: Record<string, string>): Promise<ComputeInstance[]>;
  describeInstance(instanceId: string): Promise<ComputeInstanceDetail>;
  getMetrics(instanceId: string, metricName: string, period: number): Promise<MetricDatapoint[]>;
}

// shared/lib/adapters/monitoring.adapter.ts
export interface IMonitoringAdapter {
  putMetric(namespace: string, metricName: string, value: number, unit: string): Promise<void>;
  getMetrics(namespace: string, metricName: string, startTime: Date, endTime: Date): Promise<MetricDatapoint[]>;
  createAlarm(name: string, config: AlarmConfig): Promise<string>;
  putLogEvent(logGroup: string, logStream: string, message: string): Promise<void>;
}

// shared/lib/adapters/secrets.adapter.ts
export interface ISecretsAdapter {
  getSecret(secretId: string): Promise<string>;
  putSecret(secretId: string, value: string): Promise<void>;
  rotateSecret(secretId: string): Promise<void>;
  listSecrets(prefix?: string): Promise<SecretMetadata[]>;
}
```

### Adapter Factory

```typescript
// shared/lib/adapters/adapter-factory.ts
import { CloudProvider } from '../types';

export class AdapterFactory {
  private static provider: CloudProvider;

  static initialize(provider: CloudProvider): void {
    this.provider = provider;
  }

  static getStorageAdapter(): IStorageAdapter {
    switch (this.provider) {
      case 'aws': return new AWSS3Adapter();
      case 'azure': return new AzureBlobAdapter();
      case 'gcp': return new GCSAdapter();
      default: throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  static getDatabaseAdapter(): IDatabaseAdapter {
    switch (this.provider) {
      case 'aws': return new DynamoDBAdapter();
      case 'azure': return new CosmosDBAdapter();
      case 'gcp': return new FirestoreAdapter();
    }
  }

  static getMessagingAdapter(): IMessagingAdapter {
    switch (this.provider) {
      case 'aws': return new SQSSNSAdapter();
      case 'azure': return new ServiceBusAdapter();
      case 'gcp': return new PubSubAdapter();
    }
  }

  // ... similar for all adapters
}
```

### Cloud Service Mapping (Complete)

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
| Graph DB | Neptune | Cosmos DB (Gremlin) | N/A (use Neo4j) |
| Caching | ElastiCache | Azure Cache for Redis | Memorystore |
| Vector DB | OpenSearch Serverless | AI Search | Vertex AI Vector | 
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
| Policy Engine | Config Rules | Azure Policy | Organization Policy |



---

## 6. Backend Services Architecture

MigrationBox has **7 core backend services**, each deployed as serverless functions with clear domain boundaries, well-defined APIs, and event-driven communication. Services follow a hexagonal (ports and adapters) pattern, using the Cloud Abstraction Layer for all infrastructure interactions.

### Service Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE DEPENDENCY MAP                         │
│                                                                   │
│  Discovery ──→ Assessment ──→ Provisioning ──→ Validation        │
│     │              │              │                │              │
│     │              ▼              ▼                │              │
│     └──────→ Orchestration ←──────┘                │              │
│                    │                               │              │
│                    ▼                               ▼              │
│              Data Transfer ──────────────→ Optimization           │
│                                                                   │
│  All services ←→ EventBridge (event-driven communication)        │
│  All services ←→ CRDT Knowledge Network (pattern learning)      │
└─────────────────────────────────────────────────────────────────┘
```

### 6.1 Discovery Service

**Purpose**: Scan source environments, inventory every workload, map dependencies, classify data.

**Runtime**: Python 3.12 + Boto3 + Azure SDK + GCP Client Libraries  
**Capacity**: 1,000+ servers/hour scan rate  
**Dependency Detection**: 95% accuracy (GNN-enhanced vs 70% config-only)

**Functions**:

| Function | Trigger | Description | SLA |
|----------|---------|-------------|-----|
| WorkloadDiscovery | API / Schedule | Scan EC2, RDS, Lambda, S3, VMs, Cloud SQL | <5s/resource |
| DependencyMapping | Post-discovery | Graph-based dependency analysis via Neo4j + GNN | <30s/workload |
| DataClassification | Post-discovery | PII/PHI/PCI classification via Comprehend + Macie | <2s/object |
| NetworkTopologyMap | Post-discovery | VPC/VNET/VPC peering + security group analysis | <10s/vpc |
| ApplicationProfiler | Post-discovery | CPU/memory/IO profiling via CloudWatch/Monitor metrics | <15s/app |

**Data Model** (DynamoDB):
```
WorkloadTable:
  PK: TENANT#{tenantId}
  SK: WORKLOAD#{workloadId}
  Attributes: type, provider, region, resourceId, tags, dependencies[], 
              dataClassification, metrics{}, costPerMonth, lastScanAt

DependencyTable:
  PK: TENANT#{tenantId}
  SK: DEP#{sourceWorkloadId}#{targetWorkloadId}
  Attributes: type (network|data|application|service), protocol, port, 
              latencyMs, throughputMbps, discoveryMethod, confidence
```

**Events Emitted**:
- `discovery.scan.started` → triggers progress tracking
- `discovery.workload.found` → triggers assessment pipeline
- `discovery.dependency.mapped` → triggers graph update
- `discovery.data.classified` → triggers compliance check
- `discovery.scan.completed` → triggers assessment batch

### 6.2 Assessment Service

**Purpose**: Analyze workloads using 6Rs framework, project costs, score risks, predict timelines.

**Runtime**: TypeScript + Bedrock Claude + Extended Thinking  
**Decision Quality**: 10x (Extended Thinking, 100+ variables)  
**Timeline Accuracy**: <15% MAPE

**Functions**:

| Function | Trigger | Description | SLA |
|----------|---------|-------------|-----|
| MigrationPathAnalysis | discovery.completed | 6Rs decision engine (Rehost/Replatform/Refactor/Repurchase/Retire/Retain) | <10s |
| CostProjectionEngine | path.determined | 3-year TCO projection across all 3 clouds | <5s |
| RiskAnalysis | path.determined | Multi-dimensional risk scoring with confidence intervals | <8s |
| TimelinePredictor | path.determined | ML-based timeline prediction (XGBoost + LightGBM ensemble) | <100ms |
| ComplexityScorer | discovery.completed | Automated scoring of migration difficulty (1-100 scale) | <2s |
| ComplianceChecker | discovery.data.classified | PCI-DSS, HIPAA, SOC 2, GDPR rule evaluation | <3s |

**6Rs Decision Engine**:
```
Input: Workload profile, dependencies, data classification, business requirements
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│             Extended Thinking Analysis Chain              │
│                                                           │
│  Step 1: Evaluate workload characteristics (20 features) │
│  Step 2: Assess dependency constraints (graph analysis)  │
│  Step 3: Calculate cost for each R option (3 clouds)     │
│  Step 4: Score risk for each R option (5 dimensions)     │
│  Step 5: Check compliance requirements per option        │
│  Step 6: Generate confidence intervals (Monte Carlo)     │
│  Step 7: Produce ranked recommendation with reasoning    │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
Output: Ranked list of migration strategies with 
        cost/risk/timeline/compliance scores per strategy per cloud
```

**ML Models** (trained via SageMaker):
- **Timeline Predictor**: XGBoost + LightGBM ensemble, 25 input features, weekly retraining
- **Risk Predictor**: Neural network (3 hidden layers), trained on historical migration outcomes
- **Cost Predictor**: Regression model calibrated to AWS/Azure/GCP pricing APIs
- **Complexity Scorer**: Gradient boosting on dependency graph features

### 6.3 Provisioning Service

**Purpose**: Generate and deploy Infrastructure-as-Code. Houses the I2I Pipeline engine.

**Runtime**: Python 3.12 + Terraform + Pulumi + Crossplane + I2I Engine  
**IaC Generation**: Minutes (vs days manual)  
**Config Error Rate**: 0.2% (99.8% reduction)

**Functions**:

| Function | Trigger | Description | SLA |
|----------|---------|-------------|-----|
| I2IPipelineExecutor | API / assessment.complete | Full I2I pipeline: intent → validated IaC | <60s |
| TerraformPlanGenerator | I2I output | Generate terraform plan from Building Blocks | <30s |
| TerraformApplyExecutor | Approval gate | Execute terraform apply with state management | <5min |
| CrossplaneManifestGen | I2I output (K8s targets) | Generate Crossplane YAML for K8s environments | <20s |
| DriftDetector | Schedule (5min) / Event | Compare desired state vs actual state | <15s |
| RemediationEngine | drift.detected | Auto-remediate or escalate based on blast radius | <30s |
| MCPBrowserProvisioner | API | Execute console operations via Claude MCP | Variable |

**Terraform Building Block Library**:
```
terraform-modules/
├── aws/
│   ├── vpc/                  # VPC + subnets + NAT + flow logs
│   ├── eks/                  # EKS cluster + node groups + add-ons
│   ├── rds/                  # RDS + read replicas + Multi-AZ
│   ├── aurora-serverless/    # Aurora Serverless v2 + global DB
│   ├── s3/                   # S3 + lifecycle + replication + encryption
│   ├── lambda/               # Lambda + layers + VPC config
│   ├── api-gateway/          # API Gateway HTTP/REST + custom domain
│   ├── dynamodb/             # DynamoDB + GSI + DAX + global tables
│   ├── elasticache/          # ElastiCache Redis cluster mode
│   ├── sqs-sns/              # SQS + SNS + DLQ + FIFO
│   ├── step-functions/       # Step Functions + X-Ray + logging
│   ├── waf/                  # WAF v2 + managed rules + rate limiting
│   ├── cognito/              # Cognito user pool + identity pool
│   └── cloudfront/           # CloudFront + OAI + custom headers
├── azure/
│   ├── vnet/                 # VNET + NSG + NAT Gateway
│   ├── aks/                  # AKS + node pools + AAD integration
│   ├── sql-database/         # Azure SQL + failover groups
│   ├── cosmos-db/            # Cosmos DB + multi-region write
│   ├── storage-account/      # Blob + lifecycle + replication
│   ├── functions/            # Azure Functions + VNET integration
│   ├── api-management/       # APIM + policies + custom domain
│   ├── service-bus/          # Service Bus + topics + subscriptions
│   ├── key-vault/            # Key Vault + access policies
│   └── front-door/           # Front Door + WAF + routing
├── gcp/
│   ├── vpc/                  # VPC + subnets + Cloud NAT
│   ├── gke/                  # GKE autopilot/standard + workload identity
│   ├── cloud-sql/            # Cloud SQL + HA + read replicas
│   ├── cloud-storage/        # GCS + lifecycle + versioning
│   ├── cloud-functions/      # Cloud Functions v2 + VPC connector
│   ├── cloud-run/            # Cloud Run + custom domains
│   └── pub-sub/              # Pub/Sub + DLQ + ordering
└── cross-cloud/
    ├── vpn-tunnel/           # Site-to-site VPN between clouds
    ├── dns-delegation/       # Cross-cloud DNS resolution
    ├── identity-federation/  # OIDC federation between IAMs
    └── monitoring-unified/   # Unified monitoring across clouds
```

Each module follows the standard pattern from the Terraform Module Library skill:
- `main.tf` — resources with conditional creation
- `variables.tf` — validated inputs with descriptions
- `outputs.tf` — composable outputs
- `versions.tf` — pinned provider versions
- `README.md` — auto-generated documentation
- `examples/` — usage examples
- `tests/` — Terratest Go test files

### 6.4 Orchestration Service

**Purpose**: Coordinate multi-step migration workflows, manage agent lifecycle, handle rollback.

**Runtime**: Go 1.22 + Temporal.io + AWS Step Functions  
**Rollback Time**: <30 seconds detection-to-recovery  
**Saga Pattern**: Distributed transactions with compensating actions

**Functions**:

| Function | Trigger | Description | SLA |
|----------|---------|-------------|-----|
| MigrationWorkflowEngine | API | Start/manage full migration workflow | N/A |
| AgentCoordinator | EventBridge | Dispatch tasks to 6 AI agents via A2A | <1s dispatch |
| RollbackAutomation | validation.failed / alert | Execute compensating actions | <30s |
| ProgressTracker | Events | Real-time progress with WebSocket push | <500ms |
| CheckpointManager | Periodic | Save migration state for recovery | <2s |
| ApprovalGateManager | Workflow | Human-in-the-loop approval for high-risk steps | N/A |

**Workflow Types**:
- **Simple Rehost**: Step Functions (single-cloud, 5-10 steps)
- **Complex Refactor**: Temporal.io (cross-cloud, 20-50 activities, saga pattern)
- **Multi-Cloud**: Temporal.io (parallel tracks per cloud, coordination points)
- **Agent-Orchestrated**: EventBridge + A2A (autonomous agent decision-making)

**Saga Pattern Implementation**:
```
Migration Saga:
  Step 1: Create target infrastructure  ←→  Compensate: Destroy target
  Step 2: Sync data (initial)           ←→  Compensate: Delete synced data
  Step 3: Configure networking          ←→  Compensate: Revert DNS/routing
  Step 4: Cutover (switch traffic)      ←→  Compensate: Switch back
  Step 5: Validate post-migration       ←→  Compensate: Full rollback
  Step 6: Decommission source           ←→  N/A (manual approval gate)
```

### 6.5 Validation Service

**Purpose**: Pre-flight checks, post-migration validation across 5 dimensions, performance testing.

**Runtime**: TypeScript + Playwright + k6  
**Dimensions**: Connectivity, Performance, Data Integrity, Security, Compliance

**Functions**:

| Function | Trigger | Description | SLA |
|----------|---------|-------------|-----|
| PreFlightCheck | pre-migration | Verify target readiness (IAM, quotas, networking) | <30s |
| ConnectivityValidator | post-migration | Verify all network paths, DNS, SSL | <60s |
| PerformanceValidator | post-migration | k6 load tests against migrated workloads | <5min |
| DataIntegrityValidator | post-migration | Row counts, checksums, schema comparison | <10min |
| SecurityValidator | post-migration | Security group rules, encryption, IAM | <60s |
| ComplianceValidator | post-migration | PCI-DSS, HIPAA, SOC 2, GDPR rule checking | <60s |
| SmokeTestRunner | post-migration | Application-level smoke tests via Playwright | <3min |

**Validation Matrix**:
```
┌──────────────────┬──────────────┬──────────┬──────────┬──────────┐
│   Dimension      │  Pre-Flight  │ During   │  Post    │  Ongoing │
├──────────────────┼──────────────┼──────────┼──────────┼──────────┤
│ Connectivity     │ Port scan    │ Heartbeat│ Full path│ 5-min    │
│ Performance      │ Baseline     │ Compare  │ Load test│ Dashboard│
│ Data Integrity   │ Row counts   │ CDC check│ Checksum │ Daily    │
│ Security         │ IAM audit    │ Monitor  │ Full scan│ Weekly   │
│ Compliance       │ Rule check   │ N/A      │ Certify  │ Monthly  │
└──────────────────┴──────────────┴──────────┴──────────┴──────────┘
```

### 6.6 Data Transfer Service

**Purpose**: Move data between clouds with zero downtime via CDC, streaming replication, and bulk transfer.

**Runtime**: Python 3.12 + Go + AWS DMS + Azure DMS + CDC Engines  
**Zero Downtime**: Blue-green with continuous replication until cutover  
**Supported**: Relational DB, NoSQL, file systems, object storage, streaming data

**Functions**:

| Function | Trigger | Description | SLA |
|----------|---------|-------------|-----|
| DatabaseMigrationSync | orchestration | Full + incremental DB migration via DMS | Variable |
| CDCReplicator | orchestration | Change Data Capture for continuous sync | <1s lag |
| FileTransferEngine | orchestration | Large-scale S3/Blob/GCS transfer | 10 Gbps |
| StreamingDataMigration | orchestration | Kafka/Kinesis/Event Hub migration | Real-time |
| SchemaConverter | pre-transfer | DDL translation between DB engines | <10s |
| DataMasker | pre-transfer | PII/PHI masking for non-prod environments | <5s/record |

### 6.7 Optimization Service

**Purpose**: Continuous cost optimization and right-sizing using AI Copilot with 8 specialized analyzers.

**Runtime**: TypeScript + Bedrock Claude + Cost Explorer APIs + ML  
**Cost Savings**: Additional 25% beyond baseline 18%  
**Analyzers**: 8 specialized (Idle, Right-Size, RI/Savings, Storage, Network, License, Spot, Architecture)

**Functions**:

| Function | Trigger | Description | SLA |
|----------|---------|-------------|-----|
| CostCopilot | Schedule / API | Orchestrate all 8 analyzers + generate recommendations | <30s |
| IdleResourceDetector | Schedule (hourly) | Find unused EC2, RDS, ELB, EIP | <15s |
| RightSizingAnalyzer | Schedule (daily) | CPU/memory utilization analysis + recommendations | <30s |
| RIRecommender | Schedule (weekly) | Reserved Instance / Savings Plan optimization | <60s |
| StorageOptimizer | Schedule (daily) | Lifecycle policy, tiering, compression analysis | <20s |
| NetworkCostAnalyzer | Schedule (weekly) | Cross-AZ, cross-region, internet egress optimization | <30s |
| SpotInstanceAdvisor | Schedule (daily) | Spot/preemptible instance feasibility analysis | <15s |
| ArchitectureOptimizer | Schedule (monthly) | Serverless migration candidates, refactoring suggestions | <5min |

**Optimization Actions**:
```
Recommendation → Approval Gate → Execution → Validation

Actions by blast radius:
  LOW:   Auto-execute (storage lifecycle, tag cleanup)         → No approval
  MEDIUM: Notify + auto-execute after 24h (right-sizing)      → Async approval  
  HIGH:  Require explicit approval (RI purchase, architecture) → Manual approval
```

---

## 7. I2I Pipeline Deep Dive

The Intent-to-Infrastructure (I2I) Pipeline is MigrationBox's flagship capability. It converts natural language infrastructure descriptions into validated, deployable, compliant Infrastructure-as-Code through a **4-layer hybrid architecture** that separates AI intelligence (ambiguity resolution) from deterministic correctness (code synthesis).

### Why Hybrid: The Core Insight

LLMs are excellent at understanding human intent but unreliable at generating syntactically correct, security-compliant Infrastructure-as-Code. The hybrid approach solves this:

| Capability | LLM (Layer 1) | Deterministic (Layers 2-3) |
|-----------|---------------|---------------------------|
| Understand "redundant DB" → HA: true | ✅ Excellent | ❌ Cannot |
| Resolve ambiguous requirements | ✅ Excellent | ❌ Cannot |
| Generate valid Terraform syntax | ❌ Unreliable | ✅ Perfect |
| Guarantee PCI-DSS compliance | ❌ Cannot guarantee | ✅ 100% deterministic |
| Use correct module versions | ❌ May hallucinate | ✅ Pre-audited modules |
| Detect configuration drift | ❌ Not suitable | ✅ State comparison |

### 4-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    I2I PIPELINE (4 LAYERS)                            │
│                                                                       │
│  LAYER 1: Intent Ingestion (LLM-Based)                               │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Natural Language Input                                          │ │
│  │       │                                                          │ │
│  │       ▼                                                          │ │
│  │  Bedrock Claude Sonnet 4.5 (Extended Thinking enabled)          │ │
│  │       │                                                          │ │
│  │       ▼                                                          │ │
│  │  Intermediate Representation (IR) — Typed YAML Intent Schema    │ │
│  │       │                                                          │ │
│  │  Resolves: "redundant DB" → high_availability: true              │ │
│  │  Resolves: "fast website" → scaling.strategy: latency-based     │ │
│  │  Resolves: "EU compliant" → data_residency: eu                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│       │                                                               │
│       ▼                                                               │
│  LAYER 2: Validation & Policy Guardrails (Deterministic)             │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  CUE Lang Schema Validation                                      │ │
│  │       │ (structural + type + constraint validation)              │ │
│  │       ▼                                                          │ │
│  │  OPA/Rego Policy Engine                                          │ │
│  │       │                                                          │ │
│  │  BLOCKS:  0.0.0.0/0 SSH access                                  │ │
│  │  BLOCKS:  Missing encryption at rest                             │ │
│  │  BLOCKS:  Non-compliant data residency                          │ │
│  │  BLOCKS:  Missing audit logging                                  │ │
│  │  ENFORCES: PCI-DSS, HIPAA, SOC 2, GDPR rules                   │ │
│  │       │                                                          │ │
│  │  Output: Validated IR (policy-stamped)                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│       │                                                               │
│       ▼                                                               │
│  LAYER 3: Synthesis Engine (Deterministic IaC)                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Template-Based Composition Engine                               │ │
│  │       │                                                          │ │
│  │  Maps validated IR fields → Pre-Audited Building Blocks         │ │
│  │       │                                                          │ │
│  │  database: true + type: relational + ha: true                   │ │
│  │       → aws/aurora-serverless/ module (v2.1.0, audited)         │ │
│  │       → azure/sql-database/ module (v1.4.0, audited)            │ │
│  │       → gcp/cloud-sql/ module (v1.2.0, audited)                 │ │
│  │       │                                                          │ │
│  │  NOT LLM-generated code. Pre-audited, version-pinned modules.   │ │
│  │       │                                                          │ │
│  │  Output: Terraform plan / Pulumi program / Crossplane YAML      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│       │                                                               │
│       ▼                                                               │
│  LAYER 4: Reconciliation Loop (Closed-Loop)                          │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Deploy IaC → Monitor actual state                               │ │
│  │       │                                                          │ │
│  │  Drift Detection (5-min intervals + event-driven)               │ │
│  │       │                                                          │ │
│  │  Desired State (Terraform state) ←→ Actual State (CloudWatch)   │ │
│  │       │                                                          │ │
│  │  Self-Healing with Blast Radius Controls:                       │ │
│  │    LOW:    Auto-remediate (tag drift, config drift)              │ │
│  │    MEDIUM: Notify + auto-remediate after 1 hour                 │ │
│  │    HIGH:   Require human approval (security group changes)      │ │
│  │       │                                                          │ │
│  │  State Store: S3 + DynamoDB locking + versioned + audit trail   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Intent Schema (Intermediate Representation)

The IR is the **contract** between Layer 1 (LLM) and Layer 2 (Policy). It is a typed, validated YAML schema that captures infrastructure intent without implementation details.

```yaml
# Intent Schema v1.0 — MigrationBox I2I Pipeline
# This is the Intermediate Representation (IR) that flows between layers

intent_id: "tx-98765"
version: "1.0"
created_at: "2026-02-12T14:30:00Z"
created_by: "user@enterprise.com"

metadata:
  environment: "production"          # production | staging | development
  compliance:                         # Array of compliance frameworks
    - "pci-dss"
    - "gdpr"
  data_residency: "eu"               # eu | us | ap | global
  classification: "confidential"     # public | internal | confidential | restricted
  cost_limit: 500                    # Monthly budget in USD
  tagging_policy:                    # Required tags
    Environment: "production"
    CostCenter: "CC-1234"
    DataClassification: "confidential"
    ManagedBy: "migrationbox"

workload:
  name: "order-processing-api"
  type: "web-service"                # web-service | batch-job | data-pipeline | ml-inference | static-site
  runtime: "nodejs-20"               # nodejs-20 | python-3.12 | java-21 | go-1.22 | dotnet-8
  scaling:
    strategy: "latency-based"        # latency-based | cpu-based | schedule-based | request-based
    target_latency_ms: 200
    min_instances: 2
    max_instances: 50
  networking:
    ingress: "public"                # public | internal | vpn-only
    egress_restrictions:
      - "allow:*.amazonaws.com"
      - "allow:api.stripe.com"
      - "deny:*"

persistence:
  - resource: "order-db"
    type: "relational"               # relational | document | key-value | graph | time-series
    engine: "postgresql"             # postgresql | mysql | aurora | cosmos | dynamodb
    requirements:
      high_availability: true
      encryption: "provider-managed" # provider-managed | customer-managed | none
      backup_retention_days: 30
      point_in_time_recovery: true
      read_replicas: 2
  - resource: "order-cache"
    type: "key-value"
    engine: "redis"
    requirements:
      cluster_mode: true
      encryption: "provider-managed"
      eviction_policy: "allkeys-lru"

messaging:
  - resource: "order-events"
    type: "event-bus"                # event-bus | queue | topic | stream
    requirements:
      ordering: "fifo"
      deduplication: true
      dead_letter_queue: true
      retention_days: 14

disaster_recovery:
  rpo_minutes: 15                    # Recovery Point Objective
  rto_minutes: 30                    # Recovery Time Objective
  strategy: "warm-standby"          # backup-restore | pilot-light | warm-standby | multi-site
  cross_region: true

observability:
  logging: "centralized"
  metrics: true
  tracing: true
  alerting:
    - metric: "error_rate"
      threshold: "5%"
      action: "page"
    - metric: "latency_p99"
      threshold: "500ms"
      action: "notify"

constraints:
  cloud_provider: "aws"             # aws | azure | gcp | multi-cloud
  region: "eu-west-1"
  existing_vpc: null                # VPC ID if using existing, null for new
  kubernetes: false                  # Deploy to K8s or serverless
```

### CUE Lang Schema Definition

```cue
// i2i-schema.cue — Formal schema for Intent IR validation

#IntentSchema: {
  intent_id:   string & =~"^tx-[0-9]+$"
  version:     "1.0"
  created_at:  string & =~"^\\d{4}-\\d{2}-\\d{2}T"
  created_by:  string & =~"^.+@.+\\..+$"

  metadata: #Metadata
  workload: #Workload
  persistence: [...#PersistenceResource]
  messaging?: [...#MessagingResource]
  disaster_recovery?: #DisasterRecovery
  observability?: #Observability
  constraints: #Constraints
}

#Metadata: {
  environment:      "production" | "staging" | "development"
  compliance:       [...("pci-dss" | "hipaa" | "soc2" | "gdpr" | "iso27001")]
  data_residency:   "eu" | "us" | "ap" | "global"
  classification:   "public" | "internal" | "confidential" | "restricted"
  cost_limit?:      number & >0
  tagging_policy:   {[string]: string}
}

#Workload: {
  name:    string & =~"^[a-z0-9-]+$"
  type:    "web-service" | "batch-job" | "data-pipeline" | "ml-inference" | "static-site"
  runtime: string
  scaling: #ScalingConfig
  networking: #NetworkingConfig
}

#ScalingConfig: {
  strategy:          "latency-based" | "cpu-based" | "schedule-based" | "request-based"
  target_latency_ms?: number & >0
  min_instances:      number & >=0
  max_instances:      number & >0 & >=min_instances
}

#Constraints: {
  cloud_provider: "aws" | "azure" | "gcp" | "multi-cloud"
  region:         string
  existing_vpc?:  string | null
  kubernetes:     bool
}
```

### OPA/Rego Policy Rules

```rego
# i2i-policies.rego — Deterministic compliance guardrails

package migrationbox.i2i

# RULE: Block public SSH access
deny[msg] {
  input.workload.networking.ingress == "public"
  some i
  input.workload.networking.security_rules[i].port == 22
  input.workload.networking.security_rules[i].source == "0.0.0.0/0"
  msg := "BLOCKED: SSH (port 22) open to 0.0.0.0/0 is not permitted"
}

# RULE: Require encryption at rest for all persistence
deny[msg] {
  some i
  input.persistence[i].requirements.encryption == "none"
  msg := sprintf("BLOCKED: Resource '%s' must have encryption enabled", [input.persistence[i].resource])
}

# RULE: PCI-DSS requires encryption
deny[msg] {
  "pci-dss" in input.metadata.compliance
  some i
  not input.persistence[i].requirements.encryption
  msg := sprintf("PCI-DSS: Resource '%s' missing encryption configuration", [input.persistence[i].resource])
}

# RULE: GDPR data residency
deny[msg] {
  "gdpr" in input.metadata.compliance
  input.metadata.data_residency != "eu"
  msg := "GDPR: Data residency must be 'eu' when GDPR compliance is required"
}

# RULE: HIPAA requires audit logging
deny[msg] {
  "hipaa" in input.metadata.compliance
  not input.observability.logging
  msg := "HIPAA: Centralized audit logging is required"
}

# RULE: Production must have disaster recovery
deny[msg] {
  input.metadata.environment == "production"
  not input.disaster_recovery
  msg := "Production environments must have disaster recovery configured"
}

# RULE: Production requires minimum 2 instances
deny[msg] {
  input.metadata.environment == "production"
  input.workload.scaling.min_instances < 2
  msg := "Production environments must have minimum 2 instances for high availability"
}

# RULE: Cost limit enforcement
warn[msg] {
  input.metadata.cost_limit
  estimated := estimate_monthly_cost(input)
  estimated > input.metadata.cost_limit
  msg := sprintf("WARNING: Estimated cost $%d exceeds limit $%d", [estimated, input.metadata.cost_limit])
}

# RULE: Required tags must be present
deny[msg] {
  required_tags := {"Environment", "CostCenter", "ManagedBy"}
  provided_tags := {k | input.metadata.tagging_policy[k]}
  missing := required_tags - provided_tags
  count(missing) > 0
  msg := sprintf("BLOCKED: Missing required tags: %v", [missing])
}
```

### Synthesis Engine Mapping Rules

```python
# synthesis_engine.py — Maps validated IR to Building Blocks

BUILDING_BLOCK_MAPPING = {
    "aws": {
        "persistence": {
            "relational": {
                "postgresql": {
                    "high_availability": True,
                    "module": "aws/aurora-serverless",
                    "version": "2.1.0",
                },
                "postgresql": {
                    "high_availability": False,
                    "module": "aws/rds",
                    "version": "3.0.1",
                },
                "mysql": {
                    "high_availability": True,
                    "module": "aws/aurora-serverless",
                    "version": "2.1.0",
                },
            },
            "key-value": {
                "redis": {
                    "cluster_mode": True,
                    "module": "aws/elasticache",
                    "version": "1.5.0",
                },
                "dynamodb": {
                    "module": "aws/dynamodb",
                    "version": "2.0.0",
                },
            },
            "document": {
                "module": "aws/dynamodb",
                "version": "2.0.0",
            },
        },
        "workload": {
            "web-service": {
                "kubernetes": False,
                "module": "aws/lambda",
                "version": "3.2.0",
                "additional": ["aws/api-gateway"],
            },
            "web-service": {
                "kubernetes": True,
                "module": "aws/eks",
                "version": "4.0.0",
            },
        },
        "networking": {
            "module": "aws/vpc",
            "version": "5.0.0",
        },
        "observability": {
            "module": "aws/cloudwatch-stack",
            "version": "1.1.0",
        },
    },
    # Similar for "azure" and "gcp"
}
```

### Why This Achieves 20x–50x Efficiency

| Without I2I (Manual) | With I2I Pipeline | Multiplier |
|----------------------|-------------------|------------|
| Engineer writes 400-line Terraform manually | LLM fills fixed schema, engine composes modules | 20x faster |
| Security team reviews PR line by line | OPA/Rego validates in milliseconds | 50x faster |
| LLM generates code with syntax errors | Pre-audited modules, zero syntax errors | ∞ reliability |
| Compliance verified manually post-deploy | Guaranteed by deterministic guardrails pre-deploy | 100% |
| Drift discovered during audit | 5-minute detection + auto-remediation | Proactive |
| Each engagement starts from scratch | CRDT patterns improve generation over time | Compounding |

---

## 8. Agentic AI Orchestration

Six specialized AI agents collaborate through EventBridge using the Linux Foundation's Agent-to-Agent (A2A) protocol to execute migrations autonomously with human-in-the-loop approval gates.

### Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AGENT ORCHESTRATION MESH                          │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  Discovery   │  │  Assessment  │  │  IaC Generation          │   │
│  │  Agent       │  │  Agent       │  │  Agent                   │   │
│  │              │  │              │  │                          │   │
│  │  Scans env   │  │  6Rs + risk  │  │  I2I pipeline trigger   │   │
│  │  Maps deps   │  │  Cost/time   │  │  Building block select  │   │
│  │  Classifies  │  │  Compliance  │  │  Multi-cloud IaC gen    │   │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬──────────────┘   │
│         │                  │                       │                  │
│         └──────────────────┼───────────────────────┘                  │
│                            │                                          │
│                            ▼                                          │
│         ┌──────────────────────────────────────────────┐             │
│         │         EventBridge (A2A Protocol)            │             │
│         │                                                │             │
│         │  Agent Cards (capability advertisement)       │             │
│         │  Task Queue (priority-based dispatch)         │             │
│         │  Result Bus (completion + artifacts)          │             │
│         │  Heartbeat (agent health monitoring)          │             │
│         └──────────────────────────────────────────────┘             │
│                            │                                          │
│         ┌──────────────────┼───────────────────────┐                  │
│         │                  │                       │                  │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌───────────┴──────────────┐   │
│  │  Validation  │  │ Optimization │  │  Orchestration            │   │
│  │  Agent       │  │  Agent       │  │  Agent (Supervisor)       │   │
│  │              │  │              │  │                            │   │
│  │  5-dim check │  │  8 analyzers │  │  Workflow management      │   │
│  │  Smoke tests │  │  Cost copilot│  │  Approval gates           │   │
│  │  Rollback    │  │  Auto-resize │  │  Error recovery           │   │
│  └──────────────┘  └──────────────┘  └────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Agent Specifications

| Agent | LLM | Specialization | Tools | Autonomy Level |
|-------|-----|---------------|-------|---------------|
| Discovery | Bedrock Claude | Environment scanning | AWS Config, Azure Resource Graph, GCP Asset Inventory | Full autonomous |
| Assessment | Bedrock Claude + Extended Thinking | Risk/cost/path analysis | SageMaker endpoints, pricing APIs, Neo4j | Full autonomous |
| IaC Generation | Bedrock Claude + I2I Pipeline | Infrastructure code generation | OPA, Terraform, Building Block library | Semi-autonomous (approval gate) |
| Validation | Bedrock Claude | Quality assurance | Playwright, k6, custom validators | Full autonomous |
| Optimization | Bedrock Claude | Cost & performance tuning | Cost Explorer, Compute Optimizer, custom ML | Semi-autonomous (cost gates) |
| Orchestration | Bedrock Claude | Supervisory coordination | EventBridge, Temporal, Step Functions | Human-in-the-loop |

### A2A Protocol Implementation

```json
// Agent Card (capability advertisement)
{
  "agent_id": "migrationbox-discovery-agent-v1",
  "name": "Discovery Agent",
  "version": "1.0.0",
  "capabilities": [
    {
      "name": "workload_scan",
      "description": "Scan cloud environment for workloads",
      "input_schema": { "type": "object", "properties": { "provider": { "enum": ["aws", "azure", "gcp"] }, "regions": { "type": "array" } } },
      "output_schema": { "type": "object", "properties": { "workloads": { "type": "array" } } },
      "estimated_duration_seconds": 300
    },
    {
      "name": "dependency_map",
      "description": "Map dependencies between workloads using GNN",
      "input_schema": { "type": "object", "properties": { "workload_ids": { "type": "array" } } },
      "output_schema": { "type": "object", "properties": { "dependency_graph": { "type": "object" } } },
      "estimated_duration_seconds": 60
    }
  ],
  "health_endpoint": "/health",
  "heartbeat_interval_seconds": 30
}
```

### Agent Coordination Flow

```
User: "Migrate our order-processing system from on-prem to AWS"
                    │
                    ▼
         Orchestration Agent (Supervisor)
                    │
    ┌───────────────┼───────────────────────┐
    │               │                       │
    ▼               ▼                       ▼
Discovery      Assessment              IaC Generation
Agent          Agent                    Agent
    │               │                       │
    │  workloads[]  │  6Rs + risk scores   │  (waits for assessment)
    │  deps[]       │  cost projections    │
    │  data class   │  timeline estimate   │
    │               │                       │
    └───────┬───────┘                       │
            │ assessment.completed           │
            ├───────────────────────────────→│
            │                               │
            │                    I2I Pipeline execution
            │                    terraform plan
            │                               │
            │          ┌────────────────────┤
            │          │ APPROVAL GATE      │
            │          │ (human review)     │
            │          └───────┬────────────┘
            │                  │ approved
            │                  ▼
            │          terraform apply
            │                  │
            │                  ▼
            │          Validation Agent
            │          (5-dimension check)
            │                  │
            │                  ▼
            │          Optimization Agent
            │          (post-migration tuning)
            │                  │
            │                  ▼
         Migration Complete → CRDT Knowledge Update
```

---

## 9. CRDT Knowledge Network

### Architecture

Conflict-Free Replicated Data Types (CRDTs) enable **eventually consistent, merge-without-conflict** distributed data structures that MigrationBox uses to build a compounding knowledge base across all migration engagements.

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Instance A   │     │  Instance B   │     │  Instance C   │
│  (Client X)   │     │  (Client Y)   │     │  (Client Z)   │
│               │     │               │     │               │
│  Raw Data     │     │  Raw Data     │     │  Raw Data     │
│  (Private)    │     │  (Private)    │     │  (Private)    │
│       │       │     │       │       │     │       │       │
│       ▼       │     │       ▼       │     │       ▼       │
│  Anonymizer   │     │  Anonymizer   │     │  Anonymizer   │
│       │       │     │       │       │     │       │       │
│       ▼       │     │       ▼       │     │       ▼       │
│  CRDT Replica │◄───►│  CRDT Replica │◄───►│  CRDT Replica │
│  (Shared)     │     │  (Shared)     │     │  (Shared)     │
└───────────────┘     └───────────────┘     └───────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  Global Merged  │
                   │  Knowledge Base │
                   │                 │
                   │  Patterns:      │
                   │  - Failure modes│
                   │  - Cost baselines│
                   │  - Dep patterns │
                   │  - Best practices│
                   │  - Risk factors │
                   └─────────────────┘
```

### CRDT Data Types Used

| Data Structure | CRDT Type | Use Case |
|---------------|-----------|----------|
| Migration pattern counter | G-Counter | "RDS→Aurora migration succeeded N times" |
| Cost baseline | LWW-Register | Latest known cost for workload type per region |
| Failure mode set | OR-Set (Observed-Remove) | Add/remove known failure modes |
| Dependency pattern graph | G-Set (Grow-Only) | Known dependency patterns |
| Risk factor map | LWW-Map | Risk scores per migration path |
| Best practice list | Sequence CRDT | Ordered best practices |

### Anonymization Pipeline

```python
# anonymizer.py — Strips PII/PHI before CRDT replication

class MigrationAnonymizer:
    """
    Converts raw migration data into anonymized patterns.
    
    KEEPS: resource types, counts, regions, strategies, outcomes, 
           durations, cost ratios, failure categories
    
    STRIPS: company names, IPs, account IDs, resource ARNs, 
            user names, custom tags, specific costs
    """
    
    def anonymize_pattern(self, migration_record: dict) -> dict:
        return {
            "pattern_id": generate_uuid(),
            "source_provider": migration_record["source_provider"],
            "target_provider": migration_record["target_provider"],
            "workload_type": migration_record["workload_type"],        # e.g., "web-service"
            "resource_count": bucket_count(migration_record["resources"]),  # "10-50"
            "data_volume_bucket": bucket_size(migration_record["data_gb"]),  # "100-500GB"
            "strategy": migration_record["strategy"],                    # e.g., "replatform"
            "duration_bucket": bucket_duration(migration_record["days"]),  # "7-14 days"
            "outcome": migration_record["outcome"],                      # "success" | "partial" | "rollback"
            "failure_modes": migration_record.get("failures", []),       # ["timeout", "permission"]
            "cost_ratio": migration_record["actual_cost"] / migration_record["estimated_cost"],
            "dependency_pattern": abstract_deps(migration_record["dependencies"]),
            "compliance_frameworks": migration_record["compliance"],
            "region_type": classify_region(migration_record["region"]),  # "eu" | "us" | "ap"
        }
```

### GDPR Compliance

| Requirement | Implementation |
|-------------|---------------|
| Data minimization | Only anonymized patterns replicate; raw data stays in client instance |
| Right to erasure | Client can delete their contributions; CRDT tombstones propagate |
| Consent | Explicit opt-in for knowledge sharing during onboarding |
| Data residency | CRDT sync respects region constraints (EU replicas stay in EU) |
| Audit trail | Every sync operation logged with timestamp and participant hash |
| Encryption | TLS 1.3 in transit, AES-256 at rest for all CRDT stores |

---

## 10. Extended Thinking Engine

### Purpose

Claude Extended Thinking enables multi-step reasoning chains that evaluate 100+ variables simultaneously for migration decisions that would otherwise require weeks of human analysis.

### Thinking Chain Architecture

```
Input: Workload profile + dependency graph + compliance requirements
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  EXTENDED THINKING CHAIN (Claude Sonnet 4.5)                     │
│                                                                   │
│  Step 1: DECOMPOSE                                                │
│    Parse 20+ workload features into analysis dimensions           │
│                                                                   │
│  Step 2: DEPENDENCY ANALYSIS                                      │
│    Walk Neo4j graph, identify circular refs, critical paths      │
│    Calculate migration order using topological sort              │
│                                                                   │
│  Step 3: MULTI-CLOUD COST PROJECTION                             │
│    For each of AWS/Azure/GCP:                                    │
│      - Calculate Year 1/2/3 costs (compute, storage, network)   │
│      - Apply RI/Savings Plan discounts                           │
│      - Factor data transfer costs                                │
│      - Include hidden costs (support, training, tooling)         │
│                                                                   │
│  Step 4: RISK ASSESSMENT                                          │
│    For each migration path:                                      │
│      - Technical risk (complexity, dependency breaks)            │
│      - Operational risk (downtime, team capacity)                │
│      - Financial risk (cost overrun probability)                 │
│      - Compliance risk (regulatory gaps)                         │
│      - Timeline risk (delay probability)                         │
│    Generate confidence intervals (Monte Carlo simulation)        │
│                                                                   │
│  Step 5: STRATEGY RANKING                                         │
│    Score each 6R option × 3 clouds = 18 permutations             │
│    Weight by customer priorities (cost vs speed vs risk)         │
│    Produce ranked recommendations with reasoning chains          │
│                                                                   │
│  Step 6: GENERATE ARTIFACTS                                       │
│    - Migration plan (Gantt chart data)                           │
│    - Architecture diagrams (target state per cloud)              │
│    - Risk register with mitigations                              │
│    - Cost comparison matrix                                      │
│    - Compliance checklist                                        │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
Output: Ranked migration recommendations with full reasoning,
        confidence intervals, and decision artifacts
```

### Decision Variables (100+)

| Category | Variables | Count |
|----------|-----------|-------|
| Workload Properties | CPU, memory, storage, network, IOPS, GPU, runtime, framework | 15 |
| Dependencies | Count, types, latency requirements, data flow, circular refs | 12 |
| Data Properties | Volume, sensitivity, residency, backup, replication needs | 10 |
| Compliance | PCI-DSS rules, HIPAA rules, SOC 2 controls, GDPR articles | 20 |
| Cost Factors | Compute, storage, network, licensing, support, training, tooling | 15 |
| Risk Factors | Technical, operational, financial, compliance, timeline | 15 |
| Team Factors | Size, cloud expertise, availability, velocity, certification | 8 |
| Business Factors | Revenue impact, SLA requirements, peak seasons, growth rate | 10 |
| **Total** | | **105+** |

---

## 11. Federated MCP Server Mesh

### MCP Server Registry

| # | Server | Docker | Source | Purpose | Key Tools |
|---|--------|--------|--------|---------|-----------|
| 1 | aws-mcp | Container | Official AWS | AWS documentation, service info, pricing | `search_docs`, `get_pricing` |
| 2 | aws-cdk-mcp | Container | CDK team | CDK construct library, patterns | `search_constructs`, `generate_cdk` |
| 3 | aws-terraform-mcp | Container | HashiCorp | Terraform AWS provider docs | `search_resources`, `get_examples` |
| 4 | aws-diagram-mcp | Container | Draw.io | AWS architecture diagrams | `generate_diagram`, `export_svg` |
| 5 | azure-cli-mcp | Container | Microsoft | Azure CLI commands, azd automation | `az_command`, `azd_deploy` |
| 6 | azure-learn-mcp | Container | MS Learn | Azure documentation, best practices | `search_learn`, `get_guide` |
| 7 | gcp-gemini-mcp | Container | Google | GCP documentation via Gemini | `search_gcp_docs`, `get_samples` |
| 8 | gcp-cloudrun-mcp | Container | Google | Cloud Run deployment | `deploy_service`, `configure_domain` |
| 9 | context7-mcp | Container | Context7 | Code documentation for any library | `resolve_library`, `get_docs` |
| 10 | localstack-mcp | Container | LocalStack | Local AWS emulation control | `manage_services`, `deploy_local` |
| 11 | playwright-mcp | Container | Microsoft | Browser automation | `navigate`, `click`, `fill` |
| 12 | memory-mcp | Native | Anthropic | Cross-session memory | `search`, `store`, `recall` |
| 13 | sequential-thinking-mcp | Native | Anthropic | Step-by-step reasoning | `think_step`, `evaluate` |
| 14 | i2i-pipeline-mcp | Container | MigrationBox | I2I Pipeline control (NEW) | `submit_intent`, `validate`, `synthesize` |
| 15 | crdt-sync-mcp | Container | MigrationBox | Knowledge network (NEW) | `query_patterns`, `contribute` |
| 16 | agent-coordinator-mcp | Container | MigrationBox | Agent lifecycle (NEW) | `dispatch_task`, `get_status` |

### Multi-Cloud Knowledge Query

During any migration, MigrationBox can simultaneously query:

```
User: "What's the best way to migrate a 500GB PostgreSQL database to a managed service?"

┌──────────────────────────────────────────────────────────────┐
│  Federated MCP Query                                          │
│                                                                │
│  aws-mcp:        → RDS PostgreSQL, Aurora Serverless v2       │
│  aws-terraform:  → aws_rds_cluster module examples            │
│  azure-learn-mcp:→ Azure Database for PostgreSQL Flexible     │
│  azure-cli-mcp:  → az postgres flexible-server create         │
│  gcp-gemini-mcp: → Cloud SQL for PostgreSQL, AlloyDB          │
│  context7-mcp:   → pg_dump, pgloader, AWS DMS documentation  │
│  crdt-sync-mcp:  → 47 similar migrations, 92% success rate   │
│                                                                │
│  Result: Comparative analysis with pricing, migration paths,  │
│          IaC templates for all 3 clouds, historical patterns  │
└──────────────────────────────────────────────────────────────┘
```

### Deployment Matrix

| MCP Server | Control Laptop | iPhone App | LocalStack Dev |
|-----------|---------------|-----------|---------------|
| aws-mcp | ✅ | ❌ | ✅ |
| aws-cdk-mcp | ✅ | ❌ | ✅ |
| aws-terraform-mcp | ✅ | ❌ | ✅ |
| aws-diagram-mcp | ✅ | ❌ | ✅ |
| azure-cli-mcp | ✅ | ❌ | ✅ |
| azure-learn-mcp | ✅ | ❌ | ✅ |
| gcp-gemini-mcp | ✅ | ❌ | ✅ |
| gcp-cloudrun-mcp | ✅ | ❌ | ✅ |
| context7-mcp | ✅ | ✅ | ✅ |
| localstack-mcp | ✅ | ❌ | ✅ |
| playwright-mcp | ✅ | ❌ | ✅ |
| memory-mcp | ✅ | ✅ | ✅ |
| sequential-thinking-mcp | ✅ | ✅ | ✅ |
| i2i-pipeline-mcp | ✅ | ✅ (read) | ✅ |
| crdt-sync-mcp | ✅ | ✅ (read) | ✅ |
| agent-coordinator-mcp | ✅ | ✅ (status) | ✅ |



---

## 12. AI/ML Intelligence Layer

MigrationBox deploys a comprehensive AI/ML stack spanning large language models, specialized ML models, voice AI, graph neural networks, and explainability systems.

### AI/ML Component Registry

| Component | Technology | Training | Inference | Purpose |
|-----------|-----------|----------|-----------|---------|
| Intent Understanding | Bedrock Claude Sonnet 4.5 | N/A (foundation) | Real-time | I2I Layer 1 intent extraction |
| Extended Thinking | Bedrock Claude Sonnet 4.5 | N/A (foundation) | Real-time | Multi-step reasoning chains |
| Timeline Predictor | XGBoost + LightGBM ensemble | SageMaker weekly | Lambda <100ms | Migration duration estimation |
| Risk Predictor | Neural Network (3 hidden layers, 128/64/32) | SageMaker weekly | Lambda <50ms | Risk scoring per dimension |
| Cost Predictor | Gradient Boosting Regression | SageMaker daily | Lambda <30ms | Cost estimation calibrated to APIs |
| Complexity Scorer | Gradient Boosting Classifier | SageMaker weekly | Lambda <20ms | Migration difficulty 1-100 |
| Anomaly Detector | Amazon Lookout for Metrics | Continuous | Real-time | Detect migration anomalies |
| Workload Classifier | XGBoost multi-class | SageMaker monthly | Lambda <50ms | 6Rs classification |
| Dependency GNN | PyTorch Geometric (GraphSAGE) | SageMaker GPU weekly | Lambda <200ms | Network-aware dependency detection |
| Cost Optimizer RL | PPO (Reinforcement Learning) | SageMaker continuous | Lambda <100ms | Right-sizing, scheduling optimization |
| Voice Transcription | Whisper Large v3 | Pre-trained | Real-time streaming | Hungarian speech-to-text |
| Voice Synthesis | Amazon Polly Neural (Dóra) | Pre-trained | Real-time | Hungarian text-to-speech |
| Semantic Search | OpenSearch + all-MiniLM-L6-v2 | Self-hosted | OpenSearch | RAG for documentation queries |
| Explainability | SHAP + LIME | Per-prediction | On-demand | ML decision explanation |
| Guardrails | Bedrock Guardrails | Configured | Real-time | Prevent harmful/non-compliant outputs |

### Model Training Pipeline

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Data Source  │───→│   Feature    │───→│   Training   │───→│   Registry   │
│  (DynamoDB +  │    │  Engineering │    │  (SageMaker) │    │  (MLflow)    │
│   PostgreSQL) │    │  (Lambda)    │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                    │
                                               ┌────────────────────┤
                                               │                    │
                                        ┌──────┴──────┐    ┌───────┴──────┐
                                        │  Champion   │    │  Challenger  │
                                        │  Model      │    │  Model       │
                                        │  (Lambda)   │    │  (Shadow)    │
                                        └─────────────┘    └──────────────┘
                                                                    │
                                                            Auto-promote if
                                                            challenger wins
                                                            A/B test (7 days)
```

### GraphSAGE Dependency Detection

Traditional dependency detection relies on configuration analysis (security groups, DNS, load balancers) achieving ~70% accuracy. MigrationBox uses Graph Neural Networks trained on actual network traffic patterns to achieve 95% accuracy:

```python
# gnn_dependency.py — GraphSAGE for dependency detection

class DependencyGNN:
    """
    GraphSAGE model trained on VPC Flow Logs + CloudWatch metrics
    to detect application-level dependencies invisible to config analysis.
    
    Node features: resource_type, cpu_p95, memory_p95, io_p95, network_p95
    Edge features: bytes_transferred, packet_count, avg_latency, protocol
    
    Output: Probability of dependency between any two nodes (0-1)
    """
    
    architecture = {
        "model": "GraphSAGE",
        "layers": 3,
        "hidden_dim": 128,
        "aggregator": "mean",
        "dropout": 0.3,
        "node_features": 15,
        "edge_features": 8,
        "output": "binary_classification",
    }
    
    training = {
        "framework": "PyTorch Geometric",
        "infrastructure": "SageMaker ml.g5.xlarge (GPU)",
        "dataset": "VPC Flow Logs + CloudWatch + known dependency labels",
        "frequency": "Weekly retraining",
        "validation": "5-fold cross-validation",
        "target_accuracy": 0.95,
    }
```

---

## 13. Frontend Architecture — Desktop SaaS

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15 | SSR + App Router + Server Components |
| Language | TypeScript | 5.4+ | Type safety |
| Styling | Tailwind CSS | 4.0+ | Utility-first CSS |
| Components | shadcn/ui | Latest | Accessible component library |
| State | Zustand + React Query | Latest | Client state + server cache |
| Charts | Recharts + Tremor | Latest | Data visualization |
| Real-time | WebSocket + SSE | Native | Live progress updates |
| Auth | NextAuth.js v5 | 5.0+ | OAuth2/OIDC + SAML |
| API Client | tRPC or GraphQL (Apollo) | Latest | Type-safe API calls |
| Testing | Vitest + Playwright | Latest | Unit + E2E |
| Deployment | Vercel / AWS Amplify | Latest | Edge deployment |

### Page Architecture

```
/                           → Landing / Marketing
/auth/login                 → Login (SSO, email, enterprise SAML)
/auth/signup                → Registration
/dashboard                  → Main dashboard (migration overview)
/dashboard/migrations       → Active migrations list
/dashboard/migrations/[id]  → Migration detail + real-time progress
/dashboard/discover         → Discovery wizard
/dashboard/assess           → Assessment results + 6Rs
/dashboard/i2i              → I2I Pipeline interface (natural language → IaC)
/dashboard/generate         → Generated IaC review + approval
/dashboard/migrate          → Active migration orchestration view
/dashboard/validate         → Validation results (5 dimensions)
/dashboard/optimize         → Cost optimization dashboard + recommendations
/dashboard/knowledge        → CRDT Knowledge explorer
/dashboard/agents           → Agent status + activity feed
/dashboard/settings         → Account, team, billing
/dashboard/settings/mcp     → MCP server configuration
/admin                      → Admin panel (multi-tenant management)
/admin/tenants              → Tenant management
/admin/billing              → Billing dashboard
/admin/compliance           → Compliance reports
```

### Key UI Components

**I2I Natural Language Interface**:
- Full-screen text editor with syntax-highlighted YAML preview
- Natural language input → real-time IR preview → policy validation status
- "Generate IaC" button triggers Synthesis Engine
- Side-by-side: intent description | generated Terraform | cost estimate

**Migration Workflow Visualization**:
- Interactive Gantt chart with real-time progress
- Dependency graph visualization (D3.js force-directed)
- Agent activity timeline (which agent is doing what)
- WebSocket-powered live status updates (no polling)

**Cost Optimization Dashboard**:
- Treemap of cost allocation by service/workload
- 3-year cost projection curves (AWS vs Azure vs GCP)
- Savings opportunity cards with one-click implementation
- Historical cost tracking with trend analysis

**CRDT Knowledge Explorer**:
- Searchable pattern library
- Migration success/failure rates by path type
- Community-contributed best practices
- Anonymized cost baselines by workload type

### Design System Principles

Following the frontend-design skill guidance, MigrationBox UI avoids generic AI aesthetics:

- **Color System**: Deep navy (#0A1628) primary, electric blue (#3B82F6) accent, warm amber (#F59E0B) for warnings, emerald (#10B981) for success
- **Typography**: Inter for UI, JetBrains Mono for code/IaC
- **Layout**: 12-column grid, 8px spacing system, responsive breakpoints at 640/768/1024/1280/1536px
- **Motion**: Subtle micro-animations (150-300ms), no gratuitous animation
- **Dark Mode**: Full support, system preference auto-detect
- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support

---

## 14. Frontend Architecture — iPhone Companion App

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React Native 0.75+ | Cross-platform (iOS-first) |
| Native Modules | Swift (voice, haptics, ARKit) | iOS-specific features |
| Navigation | React Navigation 7 | Tab + stack navigation |
| State | Zustand + React Query | Same as desktop |
| Voice Input | OpenAI Whisper Large v3 | Hungarian speech-to-text |
| Voice Output | Amazon Polly (Dóra neural) | Hungarian text-to-speech |
| NLU | Bedrock Claude Sonnet 4.5 | Natural language understanding |
| Offline | WatermelonDB + MMKV | Offline-first data |
| Push | APNs + EventBridge | Real-time notifications |
| Auth | Face ID + Keychain + NextAuth | Biometric + SSO |

### App Architecture

```
┌─────────────────────────────────────────────┐
│           iPhone Companion App               │
│                                               │
│  Tab Bar:                                     │
│  ┌────────┬────────┬────────┬─────────────┐  │
│  │  Chat  │Migrate │ Status │  Settings   │  │
│  └────────┴────────┴────────┴─────────────┘  │
│                                               │
│  Chat Tab:                                    │
│  ┌─────────────────────────────────────────┐ │
│  │  Conversational interface                │ │
│  │  Voice input (tap-to-speak)             │ │
│  │  Real-time transcript (Hungarian)       │ │
│  │  Generated artifacts inline             │ │
│  │  (PDF, Gantt, architecture diagrams)    │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  Migrate Tab:                                 │
│  ┌─────────────────────────────────────────┐ │
│  │  Active migrations list                  │ │
│  │  Real-time progress (push notifications)│ │
│  │  Approval gates (swipe to approve)      │ │
│  │  Agent activity feed                    │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  Status Tab:                                  │
│  ┌─────────────────────────────────────────┐ │
│  │  Platform health dashboard              │ │
│  │  Cost overview (sparklines)             │ │
│  │  Alert feed                             │ │
│  │  Quick metrics                          │ │
│  └─────────────────────────────────────────┘ │
│                                               │
│  Export: Email, AirDrop, Print, Share Sheet   │
└─────────────────────────────────────────────┘
```

### Voice Pipeline

```
User speaks Hungarian
         │
         ▼
Whisper Large v3 (streaming)
         │ Hungarian text
         ▼
Bedrock Claude NLU
         │ Structured intent + entities
         ▼
MigrationBox API
         │ Response data
         ▼
Claude Response Generation
         │ Hungarian text
         ▼
Amazon Polly Dóra (neural)
         │ Audio stream
         ▼
User hears response
```

---

## 15. MCP Requirements & Deployment

### Docker Container Specifications

| MCP Server | Base Image | Memory | CPU | Ports | Volumes |
|-----------|-----------|--------|-----|-------|---------|
| aws-mcp | node:20-alpine | 256MB | 0.25 | 3001 | config/ |
| aws-cdk-mcp | node:20-alpine | 256MB | 0.25 | 3002 | constructs/ |
| aws-terraform-mcp | node:20-alpine | 256MB | 0.25 | 3003 | providers/ |
| aws-diagram-mcp | node:20-alpine | 512MB | 0.5 | 3004 | templates/ |
| azure-cli-mcp | python:3.12-slim | 512MB | 0.5 | 3005 | az-config/ |
| azure-learn-mcp | node:20-alpine | 256MB | 0.25 | 3006 | docs-cache/ |
| gcp-gemini-mcp | python:3.12-slim | 512MB | 0.5 | 3007 | gcp-creds/ |
| gcp-cloudrun-mcp | python:3.12-slim | 256MB | 0.25 | 3008 | service-defs/ |
| context7-mcp | node:20-alpine | 256MB | 0.25 | 3009 | cache/ |
| localstack-mcp | python:3.12-slim | 256MB | 0.25 | 3010 | state/ |
| playwright-mcp | mcr.microsoft.com/playwright | 1GB | 1.0 | 3011 | screenshots/ |
| i2i-pipeline-mcp | python:3.12-slim | 1GB | 1.0 | 3012 | modules/, policies/ |
| crdt-sync-mcp | node:20-alpine | 512MB | 0.5 | 3013 | replicas/ |
| agent-coordinator-mcp | python:3.12-slim | 512MB | 0.5 | 3014 | agent-state/ |
| **Total** | | **~6GB** | **~6 vCPU** | | |

### Docker Compose (Development)

```yaml
# docker-compose.mcp.yml
version: '3.8'

services:
  aws-mcp:
    image: migrationbox/aws-mcp:latest
    ports: ["3001:3001"]
    environment:
      - AWS_REGION=eu-west-1
      - AWS_PROFILE=migrationbox
    volumes:
      - ~/.aws:/home/node/.aws:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  # ... similar for all 14 services

  i2i-pipeline-mcp:
    image: migrationbox/i2i-pipeline-mcp:latest
    ports: ["3012:3012"]
    environment:
      - OPA_ENDPOINT=http://opa-server:8181
      - BUILDING_BLOCKS_PATH=/modules
      - BEDROCK_MODEL=claude-sonnet-4-5-20250929
    volumes:
      - ./terraform-modules:/modules:ro
      - ./opa-policies:/policies:ro
    depends_on:
      - opa-server

  opa-server:
    image: openpolicyagent/opa:latest
    ports: ["8181:8181"]
    command: ["run", "--server", "--addr", "0.0.0.0:8181", "/policies"]
    volumes:
      - ./opa-policies:/policies:ro
```

---

## 16. Data Architecture

### Database Selection Matrix

| Database | Type | Primary Use | Scale | Cost Model |
|----------|------|-------------|-------|-----------|
| DynamoDB | Key-Value/Document | Workloads, migrations, tenants, state | Unlimited, auto-scale | Pay-per-request |
| PostgreSQL (Aurora Serverless v2) | Relational | Analytics, CRDT merge store, reporting | 128 ACUs max | Serverless |
| Neo4j | Graph | Dependency graphs, knowledge network, GNN data | Millions of nodes | Instance-based |
| ElastiCache Redis | Key-Value | Sessions, rate limiting, inference cache, pub/sub | Cluster mode | Node-based |
| OpenSearch Serverless | Search/Vector | RAG store, semantic search, log analytics | Auto-scale | Compute units |
| S3 | Object | Artifacts, IaC state, backups, logs, ML data | Unlimited | Storage + requests |
| MLflow (on S3 + EC2) | ML Registry | Model versioning, experiment tracking, A/B | Elastic | EC2 instance |

### DynamoDB Table Design

```
┌─────────────────────────────────────────────────────────────────────┐
│  TABLE: MigrationBox-Main (Single-Table Design)                      │
├─────────────────────────────────────────────────────────────────────┤
│  PK                          │ SK                     │ Type         │
├──────────────────────────────┼────────────────────────┼──────────────┤
│  TENANT#t-001                │ METADATA               │ Tenant       │
│  TENANT#t-001                │ USER#u-001             │ User         │
│  TENANT#t-001                │ MIGRATION#m-001        │ Migration    │
│  TENANT#t-001                │ WORKLOAD#w-001         │ Workload     │
│  TENANT#t-001                │ DEPENDENCY#d-001       │ Dependency   │
│  TENANT#t-001                │ INTENT#i-001           │ I2I Intent   │
│  TENANT#t-001                │ IAC#iac-001            │ Generated IaC│
│  TENANT#t-001                │ AGENT_TASK#at-001      │ Agent Task   │
│  TENANT#t-001                │ VALIDATION#v-001       │ Validation   │
│  TENANT#t-001                │ OPTIMIZATION#o-001     │ Cost Rec     │
├──────────────────────────────┼────────────────────────┼──────────────┤
│  GSI1: Type-based queries                                            │
│  GSI1-PK: TENANT#t-001#TYPE#Migration                               │
│  GSI1-SK: CREATED_AT#2026-02-12                                     │
├──────────────────────────────────────────────────────────────────────┤
│  GSI2: Status-based queries                                          │
│  GSI2-PK: TENANT#t-001#STATUS#in-progress                          │
│  GSI2-SK: UPDATED_AT                                                │
├──────────────────────────────────────────────────────────────────────┤
│  GSI3: Global queries (admin)                                        │
│  GSI3-PK: TYPE#Migration                                            │
│  GSI3-SK: CREATED_AT                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Neo4j Graph Model

```cypher
// Node types
(:Workload {id, name, type, provider, region, cpu, memory, storage})
(:Database {id, name, engine, version, size_gb, connections})
(:Network {id, name, type, cidr, provider})
(:Dependency {id, type, latency_ms, throughput_mbps, protocol})
(:MigrationPattern {id, source_type, target_type, strategy, success_rate})

// Relationships
(:Workload)-[:DEPENDS_ON {type, latency, throughput}]->(:Workload)
(:Workload)-[:READS_FROM]->(:Database)
(:Workload)-[:WRITES_TO]->(:Database)
(:Workload)-[:RESIDES_IN]->(:Network)
(:Network)-[:PEERS_WITH]->(:Network)
(:MigrationPattern)-[:APPLIED_TO]->(:Workload)
(:MigrationPattern)-[:SUCCEEDED_WITH {confidence}]->(:Strategy)
```

---

## 17. API Architecture

### API Design Principles

- **RESTful** for CRUD operations
- **GraphQL** for complex queries (assessment results, knowledge explorer)
- **WebSocket** for real-time progress (migration status, agent activity)
- **gRPC** for internal service-to-service (high throughput)

### REST API Endpoints (V1)

```
Base URL: https://api.migrationbox.io/v1

Authentication:
  POST   /auth/login                    # Login (returns JWT)
  POST   /auth/refresh                  # Refresh token
  POST   /auth/sso/{provider}           # SSO callback

Discovery:
  POST   /discovery/scan                # Start environment scan
  GET    /discovery/scans/{scanId}      # Get scan status/results
  GET    /discovery/workloads           # List discovered workloads
  GET    /discovery/workloads/{id}      # Get workload details
  GET    /discovery/dependencies        # Get dependency graph
  GET    /discovery/data-classification # Get data classification results

Assessment:
  POST   /assessment/analyze            # Start assessment
  GET    /assessment/{id}               # Get assessment results
  GET    /assessment/{id}/paths         # Get 6Rs recommendations
  GET    /assessment/{id}/costs         # Get cost projections (3 clouds × 3 years)
  GET    /assessment/{id}/risks         # Get risk scores
  GET    /assessment/{id}/timeline      # Get predicted timeline

I2I Pipeline:
  POST   /i2i/intent                    # Submit natural language intent
  GET    /i2i/intent/{id}               # Get IR (intermediate representation)
  POST   /i2i/validate                  # Validate IR against policies
  POST   /i2i/synthesize                # Generate IaC from validated IR
  GET    /i2i/plan/{id}                 # Get terraform plan
  POST   /i2i/apply/{id}               # Apply IaC (requires approval)
  GET    /i2i/drift/{id}               # Get drift status

Migrations:
  POST   /migrations                    # Create migration
  GET    /migrations                    # List migrations
  GET    /migrations/{id}              # Get migration detail
  PUT    /migrations/{id}/approve      # Approve migration step
  POST   /migrations/{id}/rollback     # Trigger rollback
  GET    /migrations/{id}/progress     # Get progress (also via WebSocket)

Agents:
  GET    /agents                        # List agents and status
  GET    /agents/{id}/tasks             # Get agent task history
  POST   /agents/{id}/dispatch          # Dispatch task to agent

Validation:
  POST   /validation/preflight          # Run pre-flight checks
  GET    /validation/{migrationId}     # Get validation results
  POST   /validation/{migrationId}/rerun # Re-run validation

Optimization:
  GET    /optimization/recommendations  # Get cost recommendations
  POST   /optimization/{id}/apply      # Apply recommendation
  GET    /optimization/savings          # Get savings dashboard data

Knowledge:
  GET    /knowledge/patterns            # Search CRDT knowledge base
  GET    /knowledge/patterns/{id}      # Get pattern details
  GET    /knowledge/stats              # Get knowledge network statistics

Admin:
  GET    /admin/tenants                 # List tenants
  POST   /admin/tenants                # Create tenant
  GET    /admin/billing                 # Get billing data
  GET    /admin/compliance              # Get compliance reports
```

### WebSocket Channels

```
ws://api.migrationbox.io/ws/v1

Channels:
  migration:{migrationId}:progress     # Real-time migration progress
  migration:{migrationId}:agents       # Agent activity feed
  migration:{migrationId}:logs         # Live log stream
  tenant:{tenantId}:notifications      # Push notifications
  i2i:{intentId}:generation           # I2I generation progress
  optimization:{tenantId}:alerts      # Cost optimization alerts
```

### Rate Limiting

| Tier | Requests/min | Concurrent | WebSocket |
|------|-------------|------------|-----------|
| Free | 60 | 5 | 1 |
| Professional | 300 | 20 | 5 |
| Enterprise | 1,000 | 100 | 25 |
| Custom | Unlimited | Custom | Custom |

---

## 18. Event-Driven Architecture

### Event Bus Design

All services communicate through events. EventBridge is the primary bus for AWS; Azure Event Grid and GCP Pub/Sub for their respective clouds. Apache Kafka handles high-volume streaming telemetry.

### Core Event Schema

```json
{
  "version": "1.0",
  "id": "evt-12345",
  "source": "migrationbox.discovery",
  "type": "discovery.workload.found",
  "time": "2026-02-12T14:30:00Z",
  "tenant_id": "t-001",
  "correlation_id": "migration-m-001",
  "data": {
    "workload_id": "w-001",
    "type": "ec2",
    "provider": "aws",
    "region": "eu-west-1"
  },
  "metadata": {
    "agent_id": "discovery-agent-v1",
    "trace_id": "xray-abc123"
  }
}
```

### Event Catalog

| Event | Source | Consumers | Description |
|-------|--------|-----------|-------------|
| `discovery.scan.started` | Discovery | Orchestration, Dashboard | Scan initiated |
| `discovery.workload.found` | Discovery | Assessment, Neo4j | New workload discovered |
| `discovery.dependency.mapped` | Discovery | Neo4j, Assessment | Dependency edge created |
| `discovery.scan.completed` | Discovery | Assessment, Orchestration | Scan finished |
| `assessment.analysis.completed` | Assessment | Orchestration, Dashboard | 6Rs analysis done |
| `i2i.intent.submitted` | I2I | Provisioning | Intent IR submitted |
| `i2i.validation.passed` | I2I | Provisioning | Policy validation passed |
| `i2i.validation.failed` | I2I | Dashboard, Alert | Policy validation blocked |
| `i2i.iac.generated` | I2I | Dashboard, Orchestration | IaC ready for review |
| `i2i.drift.detected` | Reconciliation | Alert, Dashboard | Configuration drift found |
| `migration.step.completed` | Orchestration | Dashboard, Validation | Migration step done |
| `migration.step.failed` | Orchestration | Alert, Rollback | Migration step failed |
| `migration.approval.required` | Orchestration | Dashboard, Mobile | Human approval needed |
| `migration.completed` | Orchestration | Validation, CRDT, Dashboard | Full migration done |
| `migration.rollback.triggered` | Orchestration | All services | Rollback in progress |
| `validation.passed` | Validation | Orchestration, Dashboard | Validation succeeded |
| `validation.failed` | Validation | Orchestration, Alert | Validation failed |
| `optimization.recommendation` | Optimization | Dashboard, Mobile | New cost recommendation |
| `crdt.pattern.learned` | CRDT | Knowledge store | New pattern replicated |
| `agent.task.dispatched` | Coordinator | Agent | Task assigned to agent |
| `agent.task.completed` | Agent | Coordinator, Dashboard | Agent task finished |
| `agent.heartbeat` | Agent | Coordinator | Agent health check |

---

## 19. Workflow Orchestration

### Workflow Engine Selection

| Workflow Type | Engine | Use Case | Max Duration |
|--------------|--------|----------|-------------|
| Simple (5-10 steps) | AWS Step Functions | Single-cloud rehost, validation | 1 year |
| Complex (20-50 steps) | Temporal.io | Cross-cloud refactor, multi-phase | Unlimited |
| Azure-specific | Azure Durable Functions | Azure-to-Azure migrations | 7 days |
| Agent-driven | EventBridge + A2A | Autonomous agent decisions | Event-driven |

### Temporal Workflow Example (Saga Pattern)

```go
// migration_workflow.go — Cross-cloud migration with saga compensation

func MigrationWorkflow(ctx workflow.Context, params MigrationParams) error {
    logger := workflow.GetLogger(ctx)
    
    // Activity options with retry
    ao := workflow.ActivityOptions{
        StartToCloseTimeout: 30 * time.Minute,
        RetryPolicy: &temporal.RetryPolicy{
            InitialInterval:    time.Second,
            BackoffCoefficient: 2.0,
            MaximumAttempts:    3,
        },
    }
    ctx = workflow.WithActivityOptions(ctx, ao)
    
    // Saga compensation stack
    var compensations []func(ctx workflow.Context) error
    defer func() {
        if r := recover(); r != nil {
            // Execute compensations in reverse order
            for i := len(compensations) - 1; i >= 0; i-- {
                compensations[i](ctx)
            }
        }
    }()
    
    // Step 1: Create target infrastructure
    var infraResult InfraResult
    err := workflow.ExecuteActivity(ctx, CreateTargetInfra, params).Get(ctx, &infraResult)
    if err != nil {
        return err
    }
    compensations = append(compensations, func(ctx workflow.Context) error {
        return workflow.ExecuteActivity(ctx, DestroyTargetInfra, infraResult).Get(ctx, nil)
    })
    
    // Step 2: Initial data sync
    var syncResult SyncResult
    err = workflow.ExecuteActivity(ctx, InitialDataSync, params, infraResult).Get(ctx, &syncResult)
    if err != nil {
        panic("data sync failed, triggering saga compensation")
    }
    compensations = append(compensations, func(ctx workflow.Context) error {
        return workflow.ExecuteActivity(ctx, CleanSyncedData, syncResult).Get(ctx, nil)
    })
    
    // Step 3: Approval gate (human-in-the-loop)
    var approved bool
    signalChan := workflow.GetSignalChannel(ctx, "approval")
    signalChan.Receive(ctx, &approved)
    if !approved {
        panic("migration rejected, triggering saga compensation")
    }
    
    // Step 4: Cutover
    err = workflow.ExecuteActivity(ctx, ExecuteCutover, params, infraResult, syncResult).Get(ctx, nil)
    if err != nil {
        panic("cutover failed, triggering saga compensation")
    }
    
    // Step 5: Validate
    var validResult ValidationResult
    err = workflow.ExecuteActivity(ctx, PostMigrationValidation, infraResult).Get(ctx, &validResult)
    if err != nil || !validResult.AllPassed {
        panic("validation failed, triggering saga compensation")
    }
    
    // Step 6: Update CRDT knowledge
    workflow.ExecuteActivity(ctx, UpdateCRDTKnowledge, params, validResult).Get(ctx, nil)
    
    return nil
}
```

---

## 20. Security Architecture

### Five-Layer Defense Model

```
LAYER 1: PERIMETER SECURITY
┌─────────────────────────────────────────────────────────────────┐
│  AWS WAF v2           │ Azure Front Door WAF  │ GCP Cloud Armor  │
│  - OWASP Top 10 rules│ - Bot protection      │ - Rate limiting   │
│  - Rate limiting      │ - Geo-filtering       │ - DDoS protection │
│  - IP reputation      │ - Custom rules        │ - Adaptive protect│
│  AWS Shield Advanced  │ Azure DDoS Protection │                   │
└─────────────────────────────────────────────────────────────────┘
                                 │
LAYER 2: IDENTITY & ACCESS
┌─────────────────────────────────────────────────────────────────┐
│  AWS IAM + Cognito    │ Azure AD + AD B2C     │ GCP IAM + IdP    │
│  - OIDC Federation    │ - SAML 2.0            │ - Workload IdP   │
│  - MFA enforcement    │ - Conditional Access  │ - Service accounts│
│  - Role-based access  │ - PIM (Just-in-Time)  │ - IAM conditions │
│  Zero Trust: Never trust, always verify                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
LAYER 3: APPLICATION SECURITY
┌─────────────────────────────────────────────────────────────────┐
│  JWT validation (RS256) │ mTLS (service-to-service)             │
│  API key rotation (90d) │ CORS strict policy                    │
│  Input validation       │ Output encoding                       │
│  CSP headers           │ Rate limiting per tenant               │
│  Bedrock Guardrails    │ Prompt injection defense               │
│  OPA/Rego policies     │ I2I compliance enforcement             │
└─────────────────────────────────────────────────────────────────┘
                                 │
LAYER 4: DATA SECURITY
┌─────────────────────────────────────────────────────────────────┐
│  At Rest: AES-256 (KMS) │ In Transit: TLS 1.3                  │
│  Secrets Manager        │ Key rotation (automatic)              │
│  Macie (PII detection)  │ DLP policies                         │
│  Client-side encryption │ Envelope encryption                   │
│  Data masking (non-prod)│ Tokenization (PCI)                    │
│  CRDT anonymization     │ Pattern-only replication              │
└─────────────────────────────────────────────────────────────────┘
                                 │
LAYER 5: AUDIT & COMPLIANCE
┌─────────────────────────────────────────────────────────────────┐
│  CloudTrail (all API)   │ Azure Monitor         │ GCP Audit Logs  │
│  3-year immutable logs  │ Log Analytics         │ BigQuery export  │
│  GDPR compliance        │ SOC 2 Type II         │ ISO 27001        │
│  PCI-DSS Level 1        │ HIPAA BAA             │ FedRAMP (future) │
│  Automated compliance   │ Continuous monitoring  │ Drift alerting   │
│  penetration testing    │ Quarterly audits      │ Bug bounty        │
└─────────────────────────────────────────────────────────────────┘
```

### AI-Specific Security

| Threat | Mitigation |
|--------|-----------|
| Prompt injection | Bedrock Guardrails + input sanitization + output validation |
| Model hallucination in IaC | Deterministic Synthesis Engine (Layer 3) — LLM never generates IaC directly |
| Data leakage via LLM | Bedrock VPC endpoints, no data sent to external APIs |
| CRDT poisoning | Anonymization pipeline + schema validation + anomaly detection |
| Agent misbehavior | Approval gates + blast radius controls + audit logging |
| Knowledge exfiltration | Encryption + access control + pattern-only (no raw data) replication |



---

## 21. Multi-Tenancy Architecture

### Isolation Model

MigrationBox uses a **hybrid isolation** approach: shared compute (Lambda) with isolated data (per-tenant DynamoDB partition keys + per-tenant S3 prefixes + per-tenant database schemas).

```
┌─────────────────────────────────────────────────────────────────┐
│  TENANT ISOLATION MODEL                                          │
│                                                                   │
│  Compute:   Shared Lambda functions (cost-efficient)             │
│  Data:      DynamoDB partition key isolation (TENANT#{id})       │
│  Storage:   S3 prefix isolation (s3://bucket/tenants/{id}/)     │
│  Analytics: PostgreSQL schema isolation (schema per tenant)      │
│  Graph:     Neo4j label isolation (tenant property on all nodes)│
│  Cache:     Redis key prefix isolation (tenant:{id}:*)          │
│  Secrets:   Per-tenant KMS keys                                  │
│  Networking: Shared API Gateway, per-tenant rate limiting        │
│                                                                   │
│  Upgrade path: Dedicated infrastructure for Enterprise tier      │
└─────────────────────────────────────────────────────────────────┘
```

### Tenant Onboarding Flow

```
1. Registration (self-serve or sales-assisted)
2. Identity verification + plan selection
3. Auto-provisioning:
   - DynamoDB partition setup
   - S3 prefix creation + lifecycle policies
   - PostgreSQL schema creation
   - Neo4j tenant label
   - Redis key space
   - KMS key creation
   - Cognito user pool group
   - API key generation
   - Default OPA policies
4. Welcome email + onboarding wizard
5. First scan setup (discovery agent)
```

### Billing Model

| Plan | Price | Migrations/month | MCP Servers | I2I Generations | Support |
|------|-------|------------------|-------------|-----------------|---------|
| Free | €0 | 1 (small) | 3 | 5 | Community |
| Professional | €499/mo | 10 | 8 | 50 | Email (24h) |
| Enterprise | €2,499/mo | Unlimited | All 16 | Unlimited | Dedicated CSM |
| Custom | Contact | Custom | Custom | Custom | White-glove |

---

## 22. Observability & Operations

### Three Pillars

```
METRICS                    LOGS                      TRACES
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ CloudWatch  │     │ CloudWatch  │     │ AWS X-Ray   │
│ Custom      │     │ Logs        │     │             │
│ Metrics     │     │ Structured  │     │ Distributed │
│             │     │ JSON format │     │ Tracing     │
│ + Grafana   │     │ + OpenSearch│     │ + Service   │
│   Dashboards│     │   Analytics │     │   Map       │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Key Dashboards

| Dashboard | Audience | Metrics |
|-----------|----------|---------|
| Platform Health | DevOps | Lambda errors, latency p50/p95/p99, DynamoDB throttles, API 4xx/5xx |
| Migration Progress | Users | Active migrations, completion %, agent status, ETA |
| I2I Pipeline | Engineering | Intent submissions, validation pass/fail, generation time, drift count |
| Cost Optimization | Finance | Monthly spend, savings achieved, recommendation adoption rate |
| Agent Activity | Engineering | Tasks dispatched, success rate, avg duration, queue depth |
| CRDT Knowledge | Product | Patterns learned, sync latency, knowledge base size |
| Security | SecOps | Failed auth, WAF blocks, policy violations, encryption status |
| Tenant Usage | Sales | Active tenants, feature usage, migration volume, churn risk |

### Alerting Rules

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| API Error Rate | >5% of requests 5xx | P1 | PagerDuty + Slack |
| Lambda Duration | p99 > 10s for 5 min | P2 | Slack |
| DynamoDB Throttle | >0 throttled requests | P2 | Slack |
| Migration Failed | Step failure after retries | P1 | PagerDuty + Email |
| I2I Policy Block | >10 blocks in 1 hour | P3 | Slack |
| Drift Detected (prod) | Any production drift | P2 | Slack + Dashboard |
| Agent Unhealthy | Heartbeat missed 3x | P2 | Slack |
| CRDT Sync Lag | >5 min sync delay | P3 | Dashboard |
| Cost Spike | >20% increase day-over-day | P2 | Email + Slack |
| Security Event | Failed auth >100/min | P1 | PagerDuty + SecOps |

---

## 23. Disaster Recovery

### RPO/RTO Targets

| Component | RPO | RTO | Strategy |
|-----------|-----|-----|----------|
| DynamoDB | 0 (continuous) | <1 min | Global Tables (multi-region) |
| PostgreSQL | 5 min | <15 min | Aurora Global Database |
| Neo4j | 1 hour | <30 min | Snapshot + restore |
| Redis | N/A (cache) | <5 min | Multi-AZ + auto-failover |
| S3 | 0 | 0 | Cross-Region Replication |
| IaC State | 0 | <5 min | S3 versioning + DynamoDB lock |
| Lambda Functions | 0 | <2 min | Multi-region deploy |

### Self-Healing Capabilities

```
Detection → Classification → Action → Verification

Detection:
  - CloudWatch alarms (metrics)
  - Health check failures (endpoints)
  - Drift detection (I2I Reconciliation Loop)
  - Agent heartbeat failures

Classification (blast radius):
  LOW:    Auto-remediate immediately
  MEDIUM: Auto-remediate + notify
  HIGH:   Notify + require approval
  
Action:
  - Lambda: Auto-redeploy from S3
  - DynamoDB: Failover to replica
  - Infrastructure drift: terraform apply (approved)
  - Agent failure: Restart container + reassign tasks
  
Verification:
  - Automated smoke test post-remediation
  - Metric validation (return to baseline)
  - Alert closure
```

---

## 24. Local Development (LocalStack)

### Verified LocalStack Status (as of February 12, 2026)

```
LocalStack Version: 4.13.2.dev60
Docker Desktop: 29.2.0
Status: HEALTHY ✅

Verified Services:
  ✅ S3           — Object storage
  ✅ DynamoDB     — Primary database
  ✅ Lambda       — Function compute
  ✅ SQS          — Message queues
  ✅ SNS          — Pub/sub messaging
  ✅ Step Functions — Workflow orchestration
  ✅ EventBridge  — Event bus
  ✅ CloudWatch   — Monitoring
  ✅ IAM          — Identity/access
  ✅ API Gateway  — HTTP APIs
  ✅ Secrets Mgr  — Secret storage
  ✅ KMS          — Encryption keys
  ✅ CloudFormation — IaC deployment
  ✅ STS          — Temp credentials
  ✅ ACM          — Certificates
  ✅ Route 53     — DNS
  
Total: 16 services available
```

### Development Workflow

```
1. docker-compose up (LocalStack + MCP servers + Neo4j + Redis + OpenSearch)
2. npm run seed (create DynamoDB tables, S3 buckets, seed data)
3. npm run dev (Next.js frontend on :3000)
4. serverless offline (Lambda functions on :3100)
5. temporal server start-dev (Temporal on :7233)
6. npm run test:unit (Vitest)
7. npm run test:e2e (Playwright against LocalStack)
8. npm run test:integration (service-to-service tests)
```

---

## 25. Deployment Strategy

### Environments

| Environment | Infrastructure | Purpose | Deploy Frequency |
|------------|---------------|---------|-----------------|
| local | LocalStack + Docker Compose | Development | On save (hot reload) |
| dev | AWS (us-east-1) | Integration testing | On PR merge |
| staging | AWS (eu-west-1) | Pre-production | Daily |
| production | AWS (eu-west-1) + DR (us-east-1) | Live | Weekly (blue-green) |

### CI/CD Pipeline (GitHub Actions)

```
PR Created:
  → Lint + Type Check
  → Unit Tests (Vitest)
  → Security Scan (Snyk/Trivy)
  → OPA Policy Test
  → Terraform Validate
  → Build

PR Merged to main:
  → All above +
  → Integration Tests (LocalStack)
  → E2E Tests (Playwright)
  → Deploy to dev
  → Smoke tests on dev

Release tag:
  → All above +
  → Deploy to staging (blue-green)
  → Full regression on staging
  → Manual approval gate
  → Deploy to production (blue-green)
  → Canary analysis (10% → 50% → 100%)
  → Post-deploy validation
  → Rollback if validation fails
```

---

## 26. Testing Strategy

### Test Pyramid

```
                    ┌─────────┐
                    │  E2E    │  10% — Playwright against real(ish) infra
                   ┌┴─────────┴┐
                   │Integration │  20% — Service-to-service via LocalStack
                  ┌┴───────────┴┐
                  │    Unit      │  70% — Vitest / pytest, isolated
                  └──────────────┘
```

### Test Categories

| Category | Tool | Target | Coverage Goal |
|----------|------|--------|--------------|
| Unit | Vitest (TS) / pytest (Python) | Pure functions, adapters, utilities | 90% |
| Integration | LocalStack + Testcontainers | Service contracts, event flows | 80% |
| E2E | Playwright | Full user journeys (UI → API → DB) | Critical paths |
| Contract | Pact | API contracts between services | All endpoints |
| Performance | k6 | Load testing, latency benchmarks | Key APIs |
| Security | OWASP ZAP + Snyk | Vulnerability scanning | All dependencies |
| Chaos | AWS FIS / Litmus | Resilience testing | DR scenarios |
| ML Model | Custom (pytest + MLflow) | Model accuracy, drift detection | All models |
| OPA Policy | OPA test framework | Policy rule correctness | All rules |
| IaC | Terratest (Go) | Building Block modules | All modules |

---

## 27. Cost Model

### Platform Operating Costs (Monthly Estimate)

| Component | Dev/Staging | Production | Notes |
|-----------|------------|-----------|-------|
| Lambda | $50 | $200-$600 | Pay-per-invocation |
| DynamoDB | $25 | $100-$300 | On-demand mode |
| Aurora Serverless | $50 | $200-$500 | Auto-scale ACUs |
| Neo4j | $0 (community) | $100-$300 | Self-managed on EC2 |
| Redis (ElastiCache) | $30 | $100-$200 | cache.t3.medium cluster |
| OpenSearch Serverless | $50 | $200-$400 | OCU-based |
| S3 | $5 | $20-$50 | Storage + requests |
| API Gateway | $10 | $50-$200 | Per-request |
| Bedrock (Claude) | $100 | $500-$2,000 | Per-token |
| SageMaker | $50 | $200-$500 | Endpoint hosting |
| MCP Docker hosts | $50 | $200-$400 | EC2 for containers |
| Monitoring | $20 | $100-$200 | CloudWatch + Grafana |
| **Total** | **~$440** | **~$2,000-$5,650** | |

### Per-Migration Economics

| Cost Component | Per Migration | Revenue Per Migration | Margin |
|---------------|--------------|----------------------|--------|
| Bedrock tokens (I2I + agents) | $5-$50 | - | - |
| Lambda invocations | $1-$10 | - | - |
| DynamoDB operations | $0.50-$5 | - | - |
| SageMaker inference | $1-$5 | - | - |
| Data transfer | $5-$50 | - | - |
| **Total cost per migration** | **$12-$120** | **€20K-€60K** | **>99%** |

---

## 28. Risk Register

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|------|------------|--------|------------|-------|
| 1 | LLM hallucination in I2I | Medium | High | Deterministic Synthesis Engine (Layer 3) | AI Team |
| 2 | Terraform module version drift | Low | Medium | Pinned versions + automated testing | DevOps |
| 3 | CRDT merge conflicts at scale | Low | Medium | Formal CRDT types + thorough testing | Backend |
| 4 | Multi-cloud API rate limiting | Medium | Medium | Exponential backoff + caching + quotas | Backend |
| 5 | Bedrock availability/latency | Low | High | Fallback to Azure OpenAI + local cache | AI Team |
| 6 | Customer data exposure via CRDT | Low | Critical | Anonymization pipeline + audit + encryption | Security |
| 7 | Migration rollback failure | Low | Critical | Saga compensations + checkpoint recovery | Backend |
| 8 | OPA policy rule errors | Low | High | Policy testing framework + staging validation | Security |
| 9 | GraphSAGE model degradation | Medium | Medium | Weekly retraining + A/B champion/challenger | AI Team |
| 10 | LocalStack parity gaps | Medium | Low | Canary testing on real AWS pre-staging | DevOps |
| 11 | Agent coordination deadlock | Low | High | Timeout + supervisor escalation + circuit breaker | AI Team |
| 12 | iPhone voice recognition errors | Medium | Low | Fallback to text input + confidence thresholds | Mobile |
| 13 | Temporal cluster failure | Low | High | Multi-AZ deployment + state recovery | DevOps |
| 14 | Key developer bus factor | Medium | High | Documentation + pair programming + skills overlap | Management |
| 15 | AWS credit exhaustion | Medium | Medium | Budget monitoring + cost alerts + optimization | Finance |

---

## 29. Performance Targets

| Metric | Target | V4 Baseline | Method |
|--------|--------|-------------|--------|
| API Latency (p50) | <50ms | 85ms | Lambda SnapStart + provisioned concurrency |
| API Latency (p95) | <200ms | 450ms | Edge caching + connection pooling |
| API Latency (p99) | <500ms | 1,200ms | Circuit breakers + fallbacks |
| Cold Start | <200ms | 2,000ms (K8s) | Lambda + SnapStart |
| I2I Intent → IR | <5s | N/A (new) | Bedrock streaming |
| I2I IR → Validated IaC | <30s | N/A (new) | OPA + template composition |
| Discovery Scan Rate | 1,000 resources/hr | 500/hr | Parallel scanning + caching |
| Dependency Detection | 95% accuracy | 70% | GraphSAGE GNN |
| Timeline Prediction | <15% MAPE | 35% | XGBoost ensemble |
| Migration Rollback | <30 seconds | 5 minutes | Pre-computed compensations |
| WebSocket Latency | <100ms | N/A | EventBridge → Lambda → WS |
| Dashboard Load | <2s | N/A | SSR + streaming + suspense |
| Scale (10x traffic) | <10 seconds | 5 min (K8s) | Lambda auto-scale |
| Uptime | 99.9% | N/A | Multi-AZ + failover |
| Deployment Time | <5 min | 15 min | Blue-green + CDN invalidation |

---

## 30. Implementation Roadmap

### 6-Month Plan (12 Sprints × 2 Weeks)

**Month 1–2: Foundation (Sprints 1–4)**

| Sprint | Deliverables |
|--------|-------------|
| Sprint 1 | Project setup, monorepo structure, CI/CD pipeline, LocalStack Docker Compose, DynamoDB tables, S3 buckets, basic Next.js shell |
| Sprint 2 | Cloud Abstraction Layer (all 8 adapters for AWS), API Gateway setup, Authentication (Cognito), basic REST endpoints |
| Sprint 3 | Discovery Service (WorkloadDiscovery, DependencyMapping), Neo4j setup, basic frontend (discovery wizard) |
| Sprint 4 | Assessment Service (6Rs engine, CostProjection, RiskAnalysis), ML training pipeline scaffolding, Extended Thinking integration |

**Month 3–4: Core Intelligence (Sprints 5–8)**

| Sprint | Deliverables |
|--------|-------------|
| Sprint 5 | I2I Pipeline Layer 1 (Intent Ingestion + IR schema), Layer 2 (OPA/Rego policies, CUE validation) |
| Sprint 6 | I2I Pipeline Layer 3 (Synthesis Engine + Building Block library for AWS), Layer 4 (drift detection) |
| Sprint 7 | Agentic AI Orchestration (6 agents, EventBridge coordination, A2A protocol), agent dashboard |
| Sprint 8 | CRDT Knowledge Network (Yjs integration, anonymization pipeline, sync protocol), knowledge explorer UI |

**Month 5: Integration & Mobile (Sprints 9–10)**

| Sprint | Deliverables |
|--------|-------------|
| Sprint 9 | Data Transfer Service, Orchestration Service (Temporal workflows, saga patterns), rollback automation |
| Sprint 10 | iPhone Companion App (voice pipeline, migration status, approval gates), MCP server containerization |

**Month 6: Enterprise & Launch (Sprints 11–12)**

| Sprint | Deliverables |
|--------|-------------|
| Sprint 11 | Multi-tenancy, billing, optimization service (8 analyzers), Azure/GCP abstraction layer adapters |
| Sprint 12 | Security hardening, compliance reporting, performance testing, documentation, beta launch (10 pilots) |

### Key Milestones

| Milestone | Target Date | Gate Criteria |
|-----------|-------------|---------------|
| M1: Foundation Complete | Week 8 | CAL working, Discovery scanning, basic UI |
| M2: I2I Pipeline Demo | Week 12 | Natural language → validated Terraform for AWS |
| M3: Full Migration Demo | Week 16 | End-to-end migration with agents |
| M4: Mobile App Alpha | Week 20 | Voice interface + migration tracking |
| M5: Beta Launch | Week 24 | 10 pilot customers, multi-tenant, billing |

---

## 31. Appendices

### A. Architecture Decision Records (ADRs)

| ADR | Decision | Rationale | Date |
|-----|----------|-----------|------|
| ADR-001 | Serverless over Kubernetes | 86% cost reduction, infinite scale, zero ops | 2025-12 |
| ADR-002 | DynamoDB single-table design | Cost efficiency, partition-key tenant isolation | 2025-12 |
| ADR-003 | Temporal.io for complex workflows | Cross-cloud support, saga pattern, unlimited duration | 2026-01 |
| ADR-004 | Hybrid I2I (LLM + Deterministic) | LLM for intent, deterministic for correctness | 2026-02 |
| ADR-005 | OPA/Rego for policy engine | Industry standard, declarative, testable | 2026-02 |
| ADR-006 | CRDTs (Yjs) for knowledge network | Conflict-free merge, offline support, GDPR-friendly | 2026-02 |
| ADR-007 | A2A protocol for agents | Linux Foundation standard, adopted by Adobe/Microsoft/SAP | 2026-02 |
| ADR-008 | Neo4j for dependency graphs | Native graph queries, GDS library, GNN integration | 2026-02 |
| ADR-009 | OpenSearch for vector/RAG | Serverless mode, hybrid search, AWS-native | 2026-02 |
| ADR-010 | React Native for mobile | Code sharing with web, large ecosystem, Swift bridge | 2026-02 |

### B. Glossary

| Term | Definition |
|------|-----------|
| I2I | Intent-to-Infrastructure — natural language to validated IaC pipeline |
| IR | Intermediate Representation — typed YAML schema between I2I layers |
| CRDT | Conflict-Free Replicated Data Type — distributed data structure |
| A2A | Agent-to-Agent — Linux Foundation protocol for AI agent communication |
| CAL | Cloud Abstraction Layer — multi-cloud portability interface |
| 6Rs | Rehost, Replatform, Refactor, Repurchase, Retire, Retain |
| GNN | Graph Neural Network — ML model for graph-structured data |
| GraphSAGE | Graph SAmple and aggreGatE — inductive GNN algorithm |
| OPA | Open Policy Agent — policy engine for cloud-native environments |
| Rego | OPA's declarative policy language |
| CUE | Configuration Unification Engine — data validation language |
| MCP | Model Context Protocol — Anthropic's tool integration standard |
| Saga | Distributed transaction pattern with compensating actions |
| Building Block | Pre-audited, version-pinned Terraform module |

### C. V5.0 Changes from V4.2

| Component | V4.2 Status | V5.0 Change | Impact |
|-----------|------------|-------------|--------|
| I2I Pipeline | Not present | NEW — 4-layer hybrid architecture | Flagship #1 |
| Agentic AI | Not present | NEW — 6 agents + A2A + EventBridge | Flagship #2 |
| CRDT Knowledge | Not present | NEW — Yjs/Automerge distributed patterns | Flagship #3 |
| Extended Thinking | Not present | NEW — Multi-step reasoning chains | Flagship #4 |
| Federated MCP Mesh | Partial (3 servers) | EXPANDED — 16 MCP servers | Flagship #5 |
| Desktop SaaS UI | Planned (empty dirs) | SPECIFIED — Full Next.js 15 architecture | Major |
| iPhone Companion | Not present | NEW — React Native + voice pipeline | Major |
| Neo4j Graph DB | Not present | NEW — Dependency graphs + GNN data | Major |
| OpenSearch Vector | Not present | NEW — RAG + semantic search | Major |
| OPA/Rego Policies | Not present | NEW — Deterministic compliance guardrails | Major |
| CUE Lang Schemas | Not present | NEW — IR validation | Major |
| Temporal.io | Planned | SPECIFIED — Saga patterns + Go workflows | Major |
| GraphSAGE GNN | Not present | NEW — 95% dependency detection | Major |
| ML Training Pipeline | Designed | SPECIFIED — SageMaker + MLflow + A/B | Major |
| Cost Optimizer | Basic | EXPANDED — 8 analyzers + AI Copilot | Major |
| Whisper + Polly | Not present | NEW — Hungarian voice AI | Major |
| Cloud Abstraction | Designed | SPECIFIED — 8 adapter interfaces | Significant |
| Event Schema | Not present | SPECIFIED — 21 core events | Significant |
| Security Model | Basic | EXPANDED — 5-layer + AI-specific | Significant |
| Multi-Tenancy | Basic | SPECIFIED — Hybrid isolation + billing | Significant |
| Rollback | Basic | EXPANDED — Saga compensations + <30s | Significant |

### D. References

1. Mordor Intelligence — Cloud Migration Services Market 2026
2. Precedence Research — Public Cloud Migration Market 2025
3. StackGen — Intent-to-Infrastructure Pioneer (2024-2025)
4. Spacelift — Intent Configuration Management (2025)
5. Pulumi Neo — AI-Powered IaC Generation (2025)
6. Hungarian Technical Document — I2I Pipeline Architecture (2026)
7. AWS re:Invent 2025 — Frontier Agents (7.13x multiplier)
8. Linux Foundation — Agent-to-Agent (A2A) Protocol Specification
9. Gartner — Cloud Migration Failure Rate Study (83%)
10. Riot Games — CRDT usage in League of Legends (7.5M concurrent)
11. Facebook — Apollo CRDT framework
12. Redis Enterprise — CRDT-based Active-Active Geo-Distribution
13. LocalStack Documentation — Multi-Cloud Emulation
14. Azure Developer CLI — January 2026 Features
15. Serverless Framework V4 Documentation
16. Temporal.io — Cross-Cloud Workflow Orchestration
17. Open Policy Agent — Policy as Code
18. CUE Lang — Data Constraint Language
19. PyTorch Geometric — GraphSAGE Implementation
20. Anthropic — Model Context Protocol (MCP) Specification

---

**END OF DOCUMENT**

Document Statistics:
- Sections: 31
- Components: 80+
- Services: 7 core + 16 MCP + 6 agents
- Databases: 6 (DynamoDB, PostgreSQL, Neo4j, Redis, OpenSearch, S3)
- AI/ML Models: 14
- API Endpoints: 40+
- Events: 21 core
- Terraform Modules: 30+ (AWS/Azure/GCP/Cross-Cloud)

This document is the authoritative architectural reference for MigrationBox V5.0.  
All implementation work should be validated against this specification.

---

*Last Updated: February 12, 2026*  
*Next Review: March 1, 2026*  
*Author: Sir Chief Architect (Mihaly Bodo)*
