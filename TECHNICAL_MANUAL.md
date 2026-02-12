# MigrationBox V4.1 - Technical Manual

**Version**: 4.1.0  
**Last Updated**: February 12, 2026  
**Document Type**: Technical Reference  
**Audience**: Developers, DevOps Engineers, Technical Architects

---

## PART 1 OF 3 - Foundation & Architecture

This is a comprehensive technical manual. Due to size, it's split into 3 parts:
- **Part 1**: System Overview, Architecture, Cloud Abstraction, Service Specs (this file)
- **Part 2**: API Reference, Database Schema, Events, Security
- **Part 3**: Deployment, Monitoring, Testing, Troubleshooting

---

## Table of Contents (Part 1)

1. [System Overview](#1-system-overview)
2. [Architecture Components](#2-architecture-components)
3. [Cloud Abstraction Layer](#3-cloud-abstraction-layer)
4. [Service Specifications](#4-service-specifications)

---

## 1. System Overview

### 1.1 Platform Architecture

MigrationBox is a 100% serverless, multi-cloud migration automation platform built on Serverless Framework V4.

**Core Principles:**
- Serverless-first (no infrastructure to manage)
- Event-driven (async, decoupled services)
- Multi-cloud by default (single codebase, multiple targets)
- Pay-per-execution (cost optimization)

**Technology Stack Summary:**

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime Framework | Serverless Framework | V4 |
| Compute | Lambda/Functions/Cloud Fn | Latest |
| Orchestration | Step Functions + Temporal | Latest |
| Database | DynamoDB/Cosmos/Firestore | Latest |
| Storage | S3/Blob/GCS | Latest |
| Messaging | SQS/Service Bus/Pub/Sub | Latest |
| AI/ML | AWS Bedrock Claude | Sonnet 4.5 |
| Frontend | Next.js | 14 |
| Local Dev | LocalStack | 4.13.2+ |

### 1.2 System Data Flow

```
USER → API Gateway → Cloud Abstraction Layer → Services → Cloud Providers
                          ↓
                    Data Persistence (DynamoDB, S3, Neptune)
```

---

## 2. Architecture Components

### 2.1 Service Catalog

| Service | Purpose | Runtime |
|---------|---------|---------|
| Discovery | Scan environments | Python 3.11 |
| Assessment | Analyze paths (6Rs) | TypeScript |
| Orchestration | Coordinate workflows | Go + Temporal |
| Validation | Post-migration testing | TypeScript |
| Provisioning | Generate IaC | Python 3.11 |
| Data Transfer | Replicate with CDC | Python 3.11 |
| Optimization | Cost/perf tuning | TypeScript |

### 2.2 Communication Patterns

**Synchronous**: REST API for user operations  
**Asynchronous**: Events via EventBridge  
**Workflows**: Temporal.io for long-running migrations

---

## 3. Cloud Abstraction Layer

### 3.1 StorageAdapter Interface

```typescript
interface StorageAdapter {
  createBucket(name: string, region: string): Promise<string>;
  uploadObject(bucket: string, key: string, data: Buffer): Promise<string>;
  downloadObject(bucket: string, key: string): Promise<Buffer>;
  listObjects(bucket: string, prefix?: string): Promise<StorageObject[]>;
  deleteObject(bucket: string, key: string): Promise<void>;
  getPresignedUrl(bucket: string, key: string, ttl?: number): Promise<string>;
}
```

### 3.2 DatabaseAdapter Interface

```typescript
interface DatabaseAdapter {
  createTable(name: string, schema: TableSchema): Promise<void>;
  putItem(table: string, item: Record<string, any>): Promise<void>;
  getItem(table: string, key: Record<string, any>): Promise<Record<string, any>>;
  query(table: string, condition: KeyCondition): Promise<Record<string, any>[]>;
  scan(table: string, filters?: FilterExpression[]): Promise<Record<string, any>[]>;
  deleteItem(table: string, key: Record<string, any>): Promise<void>;
}
```

### 3.3 MessagingAdapter Interface

```typescript
interface MessagingAdapter {
  sendMessage(queueUrl: string, message: string | object): Promise<string>;
  receiveMessages(queueUrl: string, max?: number): Promise<Message[]>;
  deleteMessage(queueUrl: string, receiptHandle: string): Promise<void>;
  publishToTopic(topicArn: string, message: string | object): Promise<string>;
}
```

### 3.4 Adapter Factory

```typescript
export class AdapterFactory {
  static createStorageAdapter(provider: CloudProvider): StorageAdapter {
    switch (provider) {
      case CloudProvider.AWS: return new AWSS3Adapter();
      case CloudProvider.AZURE: return new AzureBlobAdapter();
      case CloudProvider.GCP: return new GCSAdapter();
    }
  }
  // ... similar for database, messaging
}
```

---

## 4. Service Specifications

### 4.1 Discovery Service

**Purpose**: Scan cloud environments for workloads  
**Runtime**: Python 3.11  
**Input**: Cloud credentials, scope, options  
**Output**: Resource inventory + dependency graph

**Key Functions:**
- `discover_aws()`: AWS resource discovery
- `discover_azure()`: Azure resource discovery  
- `discover_gcp()`: GCP resource discovery
- `build_dependency_graph()`: Create resource relationships

**Resource Types Supported:**

**AWS (14 types)**: EC2, RDS, S3, Lambda, VPC, ELB, DynamoDB, ECS/EKS, IAM, Route 53, CloudWatch, Secrets Manager, Kinesis, SQS/SNS

**Azure (15 types)**: VMs, Azure SQL, Blob Storage, Functions, VNets, Load Balancer, Cosmos DB, App Service, AKS, Azure AD, DNS, Monitor, Key Vault, Service Bus, DevOps

**GCP (12 types)**: Compute Engine, Cloud SQL, Cloud Storage, Cloud Functions, VPC, Load Balancing, Firestore, App Engine, GKE, IAM, DNS, Monitoring

### 4.2 Assessment Service

**Purpose**: Analyze migration paths (6Rs framework)  
**Runtime**: TypeScript (Node 20)  
**AI/ML**: AWS Bedrock (Claude Sonnet 4.5)

**6Rs Framework:**
1. **Rehost**: Lift-and-shift as-is
2. **Replatform**: Minor optimizations
3. **Refactor**: Redesign cloud-native
4. **Repurchase**: Replace with SaaS
5. **Retire**: Decommission
6. **Retain**: Keep on-prem

**Key Functions:**
- `assessResources()`: Evaluate migration paths
- `predictRisks()`: AI-powered risk analysis via Bedrock
- `projectCosts()`: Multi-year cost projections
- `generateRecommendations()`: Scored recommendations

### 4.3 Orchestration Service

**Purpose**: Coordinate multi-phase migrations  
**Runtime**: Go + Temporal.io  
**Pattern**: Saga pattern for distributed rollback

**Workflows:**
- Pre-migration validation
- Resource provisioning
- Data transfer (CDC)
- Application cutover
- Post-migration validation
- Rollback (< 5 min)

### 4.4 Validation Service

**Purpose**: 5-dimension post-migration validation  
**Runtime**: TypeScript (Node 20)

**Validation Dimensions:**
1. **Connectivity**: Network paths, DNS, endpoints
2. **Performance**: Latency, throughput vs baseline
3. **Data Integrity**: Checksums, record counts
4. **Security**: IAM, NSGs, encryption
5. **Compliance**: GDPR, SOC 2, HIPAA, PCI-DSS

### 4.5 Provisioning Service

**Purpose**: Generate and deploy IaC  
**Runtime**: Python 3.11

**Supported IaC:**
- AWS CloudFormation
- Azure ARM/Bicep
- GCP Deployment Manager
- Terraform (multi-cloud)

### 4.6 Data Transfer Service

**Purpose**: Replicate data with CDC  
**Runtime**: Python 3.11

**Mechanisms:**
- AWS DMS (Database Migration Service)
- Azure Database Migration Service
- GCP Database Migration Service
- Real-time CDC replication

### 4.7 Optimization Service

**Purpose**: Cost and performance tuning  
**Runtime**: TypeScript (Node 20)

**Features:**
- Right-sizing recommendations
- Reserved Instance/Savings Plan analysis
- Idle resource detection
- Cost anomaly detection (ML-based)

---

**END OF PART 1**

See TECHNICAL_MANUAL_PART2.md for API Reference, Database Schema, Events, and Security.  
See TECHNICAL_MANUAL_PART3.md for Deployment, Monitoring, Testing, and Troubleshooting.

---

**Document Owner**: Technical Architecture Team  
**Review Cadence**: Monthly  
**Next Review**: March 12, 2026

---

## 8. AI & Machine Learning Capabilities

**Version**: 4.2.0  
**Added**: February 12, 2026

### 8.1 Overview

MigrationBox V4.2 introduces 12 AI-driven capabilities that augment the platform with predictive intelligence, autonomous decision-making, and conversational interfaces. These capabilities leverage state-of-the-art machine learning models, AWS Bedrock Claude, and specialized AI services.

**AI Architecture Principles:**
- **Hybrid AI**: Combine ML models (supervised learning) with LLMs (Bedrock Claude)
- **Explainability**: All AI decisions include confidence scores and reasoning
- **Human-in-the-Loop**: High-stakes decisions require human approval
- **Continuous Learning**: Models retrain on new data automatically
- **Privacy-First**: All ML training respects data privacy (differential privacy, PII masking)

---

### 8.2 Core AI Enhancements (Priority 1)

#### 8.2.1 Predictive Migration Timeline ML Model

**Purpose**: Predict migration completion time with confidence intervals

**ML Architecture:**
```
┌──────────────────────────────────────────────────────────┐
│ Training Data Collection                                  │
│ - Historical migrations (n > 500)                         │
│ - Features: resource count, data volume (GB),            │
│   dependency complexity, network topology score,         │
│   target cloud provider, migration strategy (6Rs)        │
│ - Label: actual completion time (hours)                  │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Feature Engineering                                       │
│ - Normalize numerical features (z-score)                 │
│ - One-hot encode categorical (cloud provider, 6Rs)      │
│ - Derived features: dependencies per resource,          │
│   avg data volume per resource                          │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Model Training (XGBoost Regression)                      │
│ - Algorithm: Gradient Boosting Decision Trees           │
│ - Hyperparameters: max_depth=8, n_estimators=200,      │
│   learning_rate=0.1, subsample=0.8                      │
│ - Train/Val/Test Split: 70/15/15                        │
│ - Cross-validation: 5-fold                              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Model Evaluation                                          │
│ - Metrics: RMSE, MAPE, R-squared, residual analysis     │
│ - Target Accuracy: MAPE < 15%, R² > 0.85               │
│ - Confidence Intervals: Bootstrap 90% CI                │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Model Deployment (SageMaker Endpoint)                    │
│ - Inference API: POST /predict-timeline                 │
│ - Response: { predictedHours, lowerBound, upperBound } │
│ - Latency: <100ms p95                                   │
└──────────────────────────────────────────────────────────┘
```

**Inference API:**
```typescript
interface TimelinePredictionRequest {
  resourceCount: number;
  dataVolumeGB: number;
  dependencyCount: number;
  networkComplexityScore: number; // 1-10
  targetCloud: 'aws' | 'azure' | 'gcp';
  migrationStrategy: '6R'; // Rehost, Replatform, etc.
}

interface TimelinePredictionResponse {
  predictedHours: number;
  confidenceInterval90: {
    lowerBound: number;
    upperBound: number;
  };
  confidence: 'high' | 'medium' | 'low'; // based on feature similarity to training data
  factors: {
    name: string;
    impact: number; // SHAP value
  }[];
}
```

**Retraining Schedule**: Weekly (every Sunday 2 AM UTC)

**Performance Targets**:
- MAPE < 15% (Mean Absolute Percentage Error)
- R² > 0.85 (R-squared)
- Predictions within 90% CI for 90% of migrations

**Integration Points**:
- Assessment Service: Generate initial timeline estimate
- Orchestration Service: Display timeline with confidence bands in UI
- Reporting Service: Include timeline prediction in C-level reports

---

#### 8.2.2 Autonomous Rollback Decision Engine

**Purpose**: Detect anomalies and automatically rollback failed migrations

**Architecture:**
```
┌──────────────────────────────────────────────────────────┐
│ Real-Time Metrics Collection                              │
│ - CloudWatch/Azure Monitor/GCP Monitoring streams        │
│ - Metrics: error rate, latency (p50/p95/p99),           │
│   throughput, availability, data integrity checksums     │
│ - Frequency: 30-second windows                          │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Baseline Learning (First 24 Hours)                       │
│ - Establish normal baselines for all metrics            │
│ - Calculate mean, std dev, p95, p99 for each metric    │
│ - Store baselines in DynamoDB                           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Anomaly Detection (AWS Lookout for Metrics)              │
│ - Algorithm: Isolation Forest + LSTM ensemble           │
│ - Detection: z-score > 3.5 triggers alert               │
│ - Thresholds:                                           │
│   * Error rate > 5%                                     │
│   * Latency > 2x baseline (p95)                        │
│   * Availability < 99.5%                               │
│   * Data integrity checksum mismatch                   │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Decision Logic (Lambda Function)                         │
│ if (errorRate > 0.05 || latencyP95 > 2 * baseline ||   │
│     availability < 0.995 || checksumMismatch) {         │
│   triggerRollback();                                    │
│ }                                                        │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Human Override (60-Second Countdown)                      │
│ - Alert sent to Slack/PagerDuty                         │
│ - "Rollback in 60s... Press CANCEL to override"        │
│ - If no response, proceed with rollback                 │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Rollback Execution (Temporal Saga)                       │
│ - Cancel current Temporal workflow                      │
│ - Execute compensation activities (reverse operations)   │
│ - Restore from backup if needed                         │
│ - Time to complete: <30 seconds                         │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Audit & Notification                                      │
│ - Log decision to DynamoDB audit-trail                  │
│ - Send detailed report to stakeholders                  │
│ - Create incident ticket (Jira/ServiceNow)             │
└──────────────────────────────────────────────────────────┘
```

**Decision API:**
```typescript
interface RollbackDecision {
  shouldRollback: boolean;
  reason: string;
  metrics: {
    errorRate: number;
    latencyP95: number;
    availability: number;
    checksumMatch: boolean;
  };
  confidence: number; // 0-1
  humanOverrideAllowed: boolean;
  countdownSeconds: number;
}

// Real-time decision endpoint
POST /decisions/rollback
Request: { migrationId, currentMetrics }
Response: RollbackDecision
```

**Performance Targets**:
- Detection Latency: <30 seconds from anomaly to detection
- Rollback Latency: <30 seconds from decision to completion
- False Positive Rate: <5%
- False Negative Rate: <2%

**Integration Points**:
- Orchestration Service: Monitor during migration execution
- Validation Service: Trigger on validation failures
- Monitoring Service: Subscribe to CloudWatch/Azure Monitor streams

---

#### 8.2.3 Cost Optimization Copilot

**Purpose**: Continuous cost optimization recommendations and auto-remediation

**Architecture:**
```
┌──────────────────────────────────────────────────────────┐
│ Data Collection (Hourly)                                  │
│ - Cost Explorer API: Daily spend by service              │
│ - CloudWatch Metrics: CPU, memory, network, IOPS        │
│ - Trusted Advisor: Recommendations                      │
│ - Resource inventory: All provisioned resources         │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Analysis Engine (Bedrock Claude + Custom Rules)          │
│                                                          │
│ 1. Right-Sizing Analysis                                │
│    - Identify over-provisioned instances                │
│    - Rule: CPU < 20% AND Memory < 30% for 7+ days      │
│    - Recommendation: Downsize to smaller instance       │
│                                                          │
│ 2. Reserved Instance/Savings Plan Recommender           │
│    - Analyze usage patterns (last 90 days)             │
│    - Calculate ROI: (onDemand - RI) / RIUpfront        │
│    - Recommend 1-year or 3-year commitments            │
│                                                          │
│ 3. Idle Resource Detection                              │
│    - Stopped instances (>7 days): Terminate            │
│    - Unattached volumes (>30 days): Delete             │
│    - Old snapshots (>180 days): Archive to Glacier     │
│                                                          │
│ 4. Storage Tier Optimization                            │
│    - Infrequent access (0 requests/30d): Move to IA    │
│    - Archive candidates (0 requests/90d): Glacier      │
│                                                          │
│ 5. Anomaly Detection                                     │
│    - Cost spike >30% vs rolling 7-day avg             │
│    - Bedrock Claude RCA: "New m5.24xlarge in prod"    │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Recommendation Prioritization                             │
│ - Sort by potential monthly savings (descending)        │
│ - Tag with effort (Low/Medium/High)                     │
│ - Tag with risk (Low/Medium/High)                       │
│ - Quick wins: High savings + Low effort + Low risk      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Execution Mode (Configurable)                             │
│                                                          │
│ Option A: Recommendations Only                          │
│ - Generate report with recommendations                  │
│ - Email to stakeholders                                │
│ - Dashboard with action buttons                        │
│                                                          │
│ Option B: Automated with Approval                       │
│ - Low-risk actions: Auto-execute (e.g., delete old     │
│   snapshots)                                           │
│ - High-risk actions: Require approval (e.g., downsize  │
│   production instances)                                │
│ - Approval workflow via Slack/email                    │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Savings Tracking Dashboard                               │
│ - Potential savings (recommendations not yet applied)   │
│ - Realized savings (applied recommendations)            │
│ - ROI: Realized / (Platform cost + Time invested)      │
│ - Charts: Monthly savings trend                        │
└──────────────────────────────────────────────────────────┘
```

**API Endpoints:**
```typescript
// Get cost optimization recommendations
GET /cost/recommendations?migrationId={id}
Response: {
  totalPotentialSavings: number; // USD/month
  recommendations: [{
    id: string;
    type: 'rightsizing' | 'ri' | 'idle' | 'storage_tier' | 'anomaly';
    resource: { type, id, name };
    currentCost: number;
    optimizedCost: number;
    monthlySavings: number;
    effort: 'low' | 'medium' | 'high';
    risk: 'low' | 'medium' | 'high';
    action: string; // Human-readable description
    automatable: boolean;
  }];
}

// Execute recommendation
POST /cost/recommendations/{id}/execute
Request: { approvalToken? }
Response: { status: 'executed' | 'pending_approval' | 'failed' }
```

**Performance Targets**:
- ROI: 15-25% additional cost savings (on top of migration savings)
- Detection Rate: 95% of optimization opportunities identified
- Time to Value: Recommendations within 24 hours of migration completion

**Integration Points**:
- Optimization Service: Generate recommendations
- Reporting Service: Include in C-level reports
- Frontend Dashboard: Display savings tracker

---

#### 8.2.4 Natural Language Migration Planning (Hungarian Voice Interface)

**Purpose**: Voice-driven migration planning in Hungarian language

**Architecture:**
```
┌──────────────────────────────────────────────────────────┐
│ iOS Mobile App (Swift + React Native)                    │
│ - Voice recording UI with waveform visualization        │
│ - Push-to-talk button                                   │
│ - Conversation history                                  │
│ - Offline mode: Cache last 10 exchanges                │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Audio Streaming (API Gateway WebSocket)                  │
│ - Stream audio chunks in real-time (16kHz, mono, WAV)  │
│ - WebSocket endpoint: wss://api.migrationbox.com/voice │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Speech-to-Text (OpenAI Whisper API)                      │
│ - Language: Hungarian ("hu")                            │
│ - Model: whisper-large-v3                               │
│ - Accuracy: >95% WER (Word Error Rate)                  │
│ - Latency: <500ms for 10-second audio                  │
│ - Fallback: AWS Transcribe if Whisper unavailable      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Natural Language Understanding (Bedrock Claude)           │
│ - Model: Claude Sonnet 4.5                              │
│ - System Prompt: Hungarian-speaking migration expert   │
│ - Context: DynamoDB conversation history (last 10 turns)│
│ - Capabilities:                                         │
│   * Intent classification: create_migration,            │
│     check_status, get_recommendations, troubleshoot     │
│   * Entity extraction: workload names, cloud providers, │
│     dates, resource counts                             │
│   * Multi-turn reasoning: "Azt mondtam Azure-ba"       │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Action Execution (Backend API)                            │
│ - If intent=create_migration: Call Discovery API       │
│ - If intent=check_status: Query DynamoDB for status    │
│ - If intent=recommendations: Call Assessment API       │
│ - Return structured response to NLU                     │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Response Generation (Bedrock Claude)                      │
│ - Generate natural Hungarian response                   │
│ - SSML markup for natural pauses and emphasis          │
│ - Example: "Rendben, elindítottam a felfedezést.       │
│   45 erőforrást találtam az AWS-ben."                  │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Text-to-Speech (AWS Polly)                               │
│ - Voice: "Dora" (Hungarian, neural, female)            │
│ - SSML: <speak><prosody rate="medium">...</prosody>    │
│ - Streaming: Stream audio back via WebSocket           │
│ - Latency: <300ms first byte                           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ iOS App Playback                                          │
│ - Play audio response                                   │
│ - Display transcript (text bubbles)                     │
│ - Show structured data (e.g., migration timeline chart)│
└──────────────────────────────────────────────────────────┘
```

**Sample Conversation (Hungarian):**
```
User (voice): "Szia! Szeretnék migrálni egy Oracle adatbázist Azure-ba."
Translation: "Hi! I want to migrate an Oracle database to Azure."

Assistant (voice): "Szia! Rendben, segítek. Milyen nagy az adatbázis? 
                    Hány GB?"
Translation: "Hi! Okay, I'll help. How large is the database? How many GB?"

User (voice): "Körülbelül 500 gigabájt."
Translation: "About 500 gigabytes."

Assistant (voice): "Értem. Ajánlom az Azure SQL Managed Instance-t Oracle 
                    kompatibilitási móddal. A migráció körülbelül 8-12 órát 
                    fog tartani. Induljunk?"
Translation: "I understand. I recommend Azure SQL Managed Instance with 
              Oracle compatibility mode. The migration will take about 8-12 
              hours. Shall we start?"

User (voice): "Igen, indítsuk el!"
Translation: "Yes, let's start!"

Assistant (voice): "Rendben! Elindítottam a felfedezést. 2 perc múlva 
                    értesítést kapsz, amikor kész."
Translation: "Okay! I started the discovery. You'll get a notification in 
              2 minutes when it's ready."
```

**Data Privacy:**
- Audio stored encrypted in S3 (AES-256)
- S3 lifecycle policy: Delete after 90 days
- PII detection: Redact sensitive info (names, addresses) before logging
- User consent: Explicit opt-in for voice data collection

**API Endpoints:**
```typescript
// WebSocket connection
wss://api.migrationbox.com/voice?userId={id}&lang=hu

// Messages
{
  type: 'audio_chunk',
  data: base64EncodedAudio,
  chunkIndex: number
}

{
  type: 'transcription',
  text: string,
  confidence: number
}

{
  type: 'assistant_response',
  text: string,
  audio: base64EncodedAudio,
  structuredData?: { migrationId, timeline, etc. }
}
```

**Performance Targets**:
- End-to-End Latency: <2 seconds (voice → response audio)
- Transcription Accuracy: >95% WER
- User Satisfaction: >4.5/5 stars

**Integration Points**:
- All core services: Discovery, Assessment, Orchestration, Validation
- Notification Service: Send alerts to mobile app
- Frontend: Embedded chat widget for desktop fallback

---

#### 8.2.5 Intelligent Dependency Discovery

**Purpose**: ML-powered detection of hidden dependencies between resources

**Architecture:**
```
┌──────────────────────────────────────────────────────────┐
│ Data Collection                                           │
│ 1. VPC Flow Logs (AWS)                                   │
│    - Source IP, Dest IP, Port, Protocol, Bytes          │
│    - 14 days retention                                   │
│ 2. NSG Flow Logs (Azure)                                 │
│    - Similar to VPC Flow Logs                           │
│ 3. VPC Flow Logs (GCP)                                   │
│    - Similar to AWS                                      │
│ 4. Application Logs (structured with trace IDs)         │
│    - HTTP requests, DB queries, cache lookups           │
│ 5. APM Tools (DataDog, New Relic, Dynatrace)            │
│    - Service dependency maps                            │
│ 6. Configuration Files                                   │
│    - docker-compose.yml, K8s manifests                  │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Feature Engineering                                       │
│ - Node Features: Resource type, size, region, tags      │
│ - Edge Features: Traffic volume, request rate, latency, │
│   error rate, protocol (HTTP, SQL, Redis, etc.)         │
│ - Derived: Mutual information, correlation             │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Graph Neural Network Training                             │
│ - Architecture: GraphSAGE (inductive learning)          │
│ - Task: Link prediction (binary classification)        │
│ - Input: Node embeddings + edge features               │
│ - Output: Probability of edge existence (0-1)          │
│ - Training: Supervised on labeled dependency graphs    │
│ - Loss: Binary cross-entropy                           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Inference (Predict Missing Edges)                        │
│ - Input: Partial graph (config-based dependencies)     │
│ - Output: Predicted edges with confidence scores       │
│ - Filter: Keep edges with confidence > 0.7             │
│ - Validate: Cross-reference with flow logs             │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Dependency Graph Output                                   │
│ - Nodes: Resources (EC2, RDS, S3, Lambda, etc.)        │
│ - Edges: Dependencies with metadata                    │
│   * type: network, database, storage, api              │
│   * confidence: 0-1                                    │
│   * trafficVolumeGB: Average daily traffic            │
│   * source: config | flow_logs | apm | ml_predicted   │
└──────────────────────────────────────────────────────────┘
```

**Graph Schema:**
```typescript
interface DependencyGraph {
  nodes: ResourceNode[];
  edges: DependencyEdge[];
}

interface ResourceNode {
  id: string;
  type: string; // ec2, rds, s3, lambda, etc.
  name: string;
  region: string;
  tags: Record<string, string>;
  metadata: {
    size?: string; // instance type
    engine?: string; // database engine
    runtime?: string; // lambda runtime
  };
}

interface DependencyEdge {
  source: string; // node id
  target: string; // node id
  type: 'network' | 'database' | 'storage' | 'api' | 'unknown';
  confidence: number; // 0-1
  trafficVolumeGB: number; // avg daily
  requestsPerDay: number;
  avgLatencyMs: number;
  errorRate: number; // 0-1
  detectionSource: 'config' | 'flow_logs' | 'apm' | 'ml_predicted';
  metadata?: {
    protocol?: 'http' | 'https' | 'tcp' | 'udp' | 'sql';
    port?: number;
    method?: string; // HTTP method
  };
}
```

**Accuracy Metrics:**
- **Precision**: % of predicted edges that are correct (target: >90%)
- **Recall**: % of actual edges detected (target: >95%)
- **F1-Score**: Harmonic mean of precision and recall (target: >0.92)

**Comparison to Baseline:**
- **Config-Only Baseline**: 70% recall (misses runtime dependencies)
- **GNN Model**: 95% recall (includes flow log analysis)
- **Improvement**: +25 percentage points

**Visualization:**
- Interactive graph in frontend (D3.js force-directed layout)
- Filter by confidence threshold
- Highlight critical paths (most traffic)
- Export to GraphML, DOT, JSON

**Integration Points**:
- Discovery Service: Augment discovered dependencies
- Assessment Service: Feed into risk calculation
- Orchestration Service: Determine migration sequencing

---

### 8.3 Advanced AI Capabilities (Priority 2)

#### 8.3.1 Intelligent Risk Predictor

**Purpose**: Predict migration failure probability before execution

**ML Model:**
- **Algorithm**: Random Forest Classifier (binary: success/failure)
- **Features**: Workload complexity (LOC, dependencies, age), tech stack, database type, data volume, compliance requirements, migration strategy, team experience
- **Training Data**: Historical migrations (n > 1000, balanced classes)
- **Output**: Risk score (0-100), category (Low/Medium/High/Critical), top 3 risk factors

**Risk Score Calculation:**
```python
def calculate_risk_score(features):
    # ML model inference
    failure_probability = random_forest.predict_proba(features)[1]
    
    # Convert to 0-100 scale
    risk_score = int(failure_probability * 100)
    
    # Categorize
    if risk_score < 30:
        category = 'Low'
    elif risk_score < 60:
        category = 'Medium'
    elif risk_score < 85:
        category = 'High'
    else:
        category = 'Critical'
    
    # SHAP values for explainability
    shap_values = shap.TreeExplainer(random_forest).shap_values(features)
    top_risk_factors = get_top_k_features(shap_values, k=3)
    
    return {
        'score': risk_score,
        'category': category,
        'failureProbability': failure_probability,
        'topRiskFactors': top_risk_factors
    }
```

**Mitigation Suggestions (Bedrock Claude):**
```typescript
// For each risk factor, generate mitigation suggestion
const mitigations = await bedrock.invoke({
  prompt: `
    Migration risk factor: ${riskFactor.name}
    Impact: ${riskFactor.impact}
    Workload: ${workload.description}
    
    Suggest 2-3 concrete mitigation strategies.
  `,
  model: 'claude-sonnet-4-5'
});
```

**API:**
```typescript
POST /risk/predict
Request: {
  workloadId: string;
  features: {
    linesOfCode: number;
    dependencyCount: number;
    ageYears: number;
    techStack: string[];
    databaseType: string;
    dataVolumeGB: number;
    complianceRequirements: string[];
    migrationStrategy: '6R';
  };
}
Response: {
  riskScore: number; // 0-100
  category: 'Low' | 'Medium' | 'High' | 'Critical';
  failureProbability: number; // 0-1
  topRiskFactors: [{
    name: string;
    impact: number; // SHAP value
    mitigation: string; // Bedrock-generated suggestion
  }];
}
```

**Integration**:
- Assessment Service: Run during assessment phase
- Approval Workflow: High/Critical risk requires executive approval
- Resource Allocation: Allocate more time/resources to high-risk migrations

---

#### 8.3.2 Self-Healing Infrastructure

**Purpose**: Automatically detect and fix common infrastructure issues

**Auto-Remediation Capabilities:**

1. **IAM Permission Errors**
   - Detect: Lambda fails with AccessDeniedException
   - Fix: Auto-create missing IAM permission (within approved policy bounds)
   - Safety: Dry-run mode, approval required for production

2. **Network Connectivity**
   - Detect: Connection timeout to RDS
   - Fix: Auto-update security group to allow traffic from source
   - Safety: Only allow within same VPC, log all changes

3. **Configuration Drift**
   - Detect: Terraform state vs actual infrastructure mismatch
   - Fix: Auto-reconcile to desired state (terraform apply)
   - Safety: Require approval for destructive changes

4. **Certificate Expiration**
   - Detect: SSL cert expires in <7 days
   - Fix: Auto-renew via Let's Encrypt or AWS Certificate Manager
   - Safety: Test renewal in staging first

5. **Disk Space**
   - Detect: Disk usage >85%
   - Fix: Auto-expand EBS volume by 20% or cleanup /tmp
   - Safety: Max 3 expansions per instance, alert after 3rd

**Architecture:**
```
┌──────────────────────────────────────────────────────────┐
│ Monitoring (30-second health checks)                      │
│ - CloudWatch alarms                                      │
│ - Custom Lambda health check function                   │
│ - Anomaly detection (AWS Lookout)                       │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Issue Classification (ML + Rules)                        │
│ - Pattern matching: Regex on error messages             │
│ - ML classifier: Known vs unknown issues                │
│ - Severity: P0 (critical), P1 (high), P2, P3            │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Remediation Selection                                     │
│ - Lookup remediation playbook                           │
│ - Risk assessment: Will fix break anything?             │
│ - If low-risk: Auto-execute                             │
│ - If high-risk: Request approval                        │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Execution (Lambda Functions)                              │
│ - Run remediation script                                │
│ - Capture before/after state                            │
│ - Monitor for side effects (5 min window)               │
│ - If side effects detected: Auto-rollback               │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Audit & Learning                                          │
│ - Log all healing actions to DynamoDB                   │
│ - Update success rate metrics                           │
│ - If failure: Add to "difficult cases" for human review │
└──────────────────────────────────────────────────────────┘
```

**Success Rate Target**: 80% of issues auto-resolved without human intervention

---

#### 8.3.3 Smart Resource Recommender

**Purpose**: Recommend optimal instance types and configurations

**Deep Neural Network Architecture:**
```
Input Layer (15 features)
  - avgCPU, p50CPU, p95CPU, p99CPU
  - avgMemory, p50Memory, p95Memory
  - avgNetworkMbps, p95NetworkMbps
  - avgDiskIOPS, p95DiskIOPS
  - requestRate, burstiness (std/mean)
  - currentInstanceType (one-hot encoded)
  - workloadType (web, db, batch, ml)

Hidden Layer 1 (128 neurons, ReLU)
Hidden Layer 2 (64 neurons, ReLU)
Hidden Layer 3 (32 neurons, ReLU)

Output Layer (3 heads)
  - instanceType (multi-class classification)
  - storageType (ssd vs hdd)
  - autoscalingParams (min, max, target CPU)
```

**Training**:
- Transfer learning from AWS Compute Optimizer public dataset
- Fine-tune on customer data
- Training frequency: Weekly

**Confidence Scoring**:
- High: Model trained on similar workloads (n > 100)
- Medium: Workload somewhat similar (n = 10-100)
- Low: Rare workload type (n < 10)

**API:**
```typescript
POST /recommendations/resources
Request: {
  resourceId: string;
  metricsPeriod: '7d' | '14d' | '30d';
}
Response: {
  currentConfig: { instanceType, storageTy pe, autoscaling };
  recommendedConfig: { instanceType, storageType, autoscaling };
  confidence: 'high' | 'medium' | 'low';
  costImpact: {
    current: number;
    recommended: number;
    monthlySavings: number;
  };
  performanceImpact: {
    latencyChange: number; // % change
    throughputChange: number;
  };
}
```

---

#### 8.3.4 Compliance Autopilot

**Purpose**: Continuous compliance scanning and auto-remediation

**Supported Frameworks:**
- GDPR (General Data Protection Regulation)
- SOC 2 Type II (Service Organization Control)
- HIPAA (Health Insurance Portability and Accountability Act)
- PCI-DSS (Payment Card Industry Data Security Standard)
- ISO 27001 (Information Security Management)
- NIST Cybersecurity Framework

**Auto-Remediation Actions:**
1. **Tagging**: Auto-tag resources with compliance metadata
2. **Encryption**: Auto-enable encryption for S3, EBS, RDS
3. **Logging**: Auto-enable CloudTrail, VPC Flow Logs, CloudWatch Logs
4. **Rotation**: Auto-rotate exposed IAM access keys
5. **Public Access**: Auto-remediate public S3 buckets (make private)

**Scanning Rules (AWS Config + Custom):**
```yaml
# Example: GDPR Data Residency Rule
- rule: gdpr-data-residency
  description: All EU customer data must reside in EU regions
  condition: |
    resource.type == 'S3' AND
    resource.tags['data-classification'] == 'customer-eu' AND
    resource.region NOT IN ['eu-west-1', 'eu-central-1']
  remediation:
    action: move-bucket
    targetRegion: eu-west-1
    approvalRequired: true

# Example: SOC 2 Encryption Rule
- rule: soc2-encryption-at-rest
  description: All data at rest must be encrypted
  condition: |
    resource.type IN ['S3', 'EBS', 'RDS'] AND
    resource.encrypted == false
  remediation:
    action: enable-encryption
    kmsKeyId: alias/compliance-key
    approvalRequired: false # Low-risk, auto-execute
```

**Bedrock Claude Integration:**
```typescript
// Analyze complex compliance violations
const analysis = await bedrock.invoke({
  prompt: `
    Compliance violation detected:
    Rule: ${rule.name}
    Resource: ${resource.arn}
    Current state: ${resource.state}
    Required state: ${rule.requiredState}
    
    Generate:
    1. Root cause analysis
    2. Step-by-step remediation plan
    3. Risk assessment if not remediated
  `,
  model: 'claude-sonnet-4-5'
});
```

---

#### 8.3.5 Intelligent Test Data Generator

**Purpose**: Generate realistic, anonymized test data for validation

**Techniques:**

1. **Differential Privacy**
   - Add calibrated noise to numerical columns
   - Preserve statistical properties (mean, std dev, correlations)
   - Epsilon = 0.1 (strong privacy guarantee)

2. **Generative Models**
   - VAE (Variational Autoencoder) for tabular data
   - GAN (Generative Adversarial Network) for complex distributions
   - Train on production data, generate synthetic samples

3. **Smart Sampling**
   - Stratified sampling to preserve class distributions
   - Oversample rare edge cases
   - Preserve referential integrity (FK relationships)

**PII Anonymization:**
- **Detection**: Regex + NER (Named Entity Recognition) via spaCy
- **Masking**:
  - Names: Replace with fake names (Faker library)
  - Email: Replace with fake@example.com
  - Phone: Replace with (555) XXX-XXXX
  - SSN: Replace with 000-00-XXXX
- **Tokenization**: Consistent mapping (same name → same fake name)

**API:**
```typescript
POST /test-data/generate
Request: {
  sourceDatabase: { host, port, database, schema };
  targetDatabase: { ... };
  scaleFactor: number; // 10x, 100x
  techniques: ['differential_privacy', 'gan', 'sampling'];
  piiMasking: true;
  preserveEdgeCases: true;
}
Response: {
  jobId: string;
  estimatedDurationMinutes: number;
}

GET /test-data/jobs/{jobId}
Response: {
  status: 'running' | 'complete' | 'failed';
  progress: number; // 0-100
  recordsGenerated: number;
  validationResults: {
    schemaMatch: boolean;
    constraintsValid: boolean;
    piiDetected: boolean;
  };
}
```

---

#### 8.3.6 Conversational Migration Assistant

**Purpose**: RAG-powered chatbot for migration guidance

**RAG Architecture (Retrieval-Augmented Generation):**
```
┌──────────────────────────────────────────────────────────┐
│ Knowledge Base (Vector Database)                          │
│ - Migration documentation (MigrationBox docs)            │
│ - AWS/Azure/GCP migration guides                        │
│ - Historical Q&A (past user questions + answers)         │
│ - Troubleshooting runbooks                              │
│ - Best practices (6Rs framework, security, costs)       │
│ - Embedded with OpenAI text-embedding-3-large           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ User Question                                             │
│ "How do I migrate SQL Server to Aurora?"                 │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Retrieval (Semantic Search)                               │
│ - Embed question with same model                        │
│ - Cosine similarity search in vector DB                 │
│ - Retrieve top 5 most relevant documents                │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Augmented Generation (Bedrock Claude)                     │
│ Prompt:                                                  │
│   You are a migration expert. Use these docs:           │
│   [Retrieved Doc 1]                                     │
│   [Retrieved Doc 2]                                     │
│   ...                                                   │
│   User question: How do I migrate SQL Server to Aurora? │
│   Provide step-by-step guidance.                        │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Response with Citations                                   │
│ "To migrate SQL Server to Aurora:                        │
│  1. Use AWS DMS (see doc: aws-dms-guide.md)             │
│  2. Create Aurora cluster (see: aurora-setup.md)        │
│  ..."                                                   │
└──────────────────────────────────────────────────────────┘
```

**Multi-turn Conversation:**
- Store last 10 exchanges in DynamoDB
- Include conversation history in Bedrock prompt
- Example:
  ```
  User: "How do I migrate SQL Server?"
  Bot: "Do you want to migrate to Aurora, Azure SQL, or GCP SQL?"
  User: "Aurora"
  Bot: "Great! Here's the step-by-step process..."
  ```

**Learning from Feedback:**
- Thumbs up/down buttons on each response
- Store feedback in DynamoDB
- Periodically review low-rated responses
- Update knowledge base or improve prompts

**Languages**:
- Hungarian (primary)
- English (default)
- Extensible: Add more languages via Bedrock multi-lingual support

---

#### 8.3.7 Predictive Cost Anomaly Detection

**Purpose**: Detect cost spikes before they become budget issues

**ML Pipeline:**
```
┌──────────────────────────────────────────────────────────┐
│ Data Collection (Hourly)                                  │
│ - Cost Explorer API: Hourly spend by service            │
│ - Granularity: Service, Region, Tag                     │
│ - Historical: 90 days                                   │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Baseline Learning                                         │
│ - Seasonal decomposition (trend, weekly, daily patterns)│
│ - Normal range: Mean ± 2 std dev                        │
│ - Store baselines in DynamoDB                           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Anomaly Detection (Isolation Forest + LSTM)              │
│ - Isolation Forest: Detect outliers in cost             │
│ - LSTM: Predict next hour's cost, compare to actual    │
│ - Anomaly score: Combine both models                    │
│ - Threshold: Score > 0.8 triggers alert                 │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Root Cause Analysis (Bedrock Claude)                     │
│ Prompt:                                                  │
│   Cost anomaly detected:                                │
│   - Expected: $500/hour                                 │
│   - Actual: $1200/hour (+140%)                          │
│   - Services with highest increase:                     │
│     * EC2: +$400 (5 new m5.24xlarge instances)         │
│     * Data Transfer: +$200 (spike in outbound traffic) │
│   Analyze:                                              │
│   1. What caused the spike?                             │
│   2. Is it expected (e.g., planned load test)?          │
│   3. Recommended actions?                               │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Alerting & Forecasting                                    │
│ - Slack/email alert with RCA                            │
│ - Forecast end-of-month cost with 90% CI                │
│ - Budget protection: Auto-pause non-critical resources  │
│   if budget exceeded                                    │
└──────────────────────────────────────────────────────────┘
```

**Budget Protection Actions (Auto-Pause):**
- Stop dev/test EC2 instances
- Reduce auto-scaling max capacity
- Pause non-critical scheduled jobs
- Send alert: "Budget protection activated, review ASAP"

---

### 8.4 AI Service Architecture

**Shared Infrastructure:**
```
┌──────────────────────────────────────────────────────────┐
│ AI Orchestration Layer (Lambda)                          │
│ - Route requests to appropriate AI service               │
│ - Handle retries, timeouts, circuit breakers            │
│ - Cache responses (Redis/ElastiCache)                   │
└────────────────────┬─────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬─────────────┐
        │            │            │             │
        ▼            ▼            ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ Bedrock  │ │SageMaker │ │ Whisper  │ │AWS Lookout   │
│ Claude   │ │Endpoints │ │  API     │ │for Metrics   │
└──────────┘ └──────────┘ └──────────┘ └──────────────┘
```

**Model Serving:**
- Bedrock Claude: Managed service, no infra management
- SageMaker: Real-time endpoints for custom ML models
- Whisper: OpenAI API or self-hosted (Hugging Face)
- Lookout for Metrics: Managed anomaly detection

**Monitoring:**
- CloudWatch metrics: Inference latency, error rate, token usage
- Custom metrics: Model accuracy, confidence scores
- Alerts: Latency >500ms, error rate >5%, accuracy drop >10%

**Cost Management:**
- Bedrock: Pay per input/output token
- SageMaker: Reserved capacity for predictable load
- Whisper: Batch processing during off-peak hours
- Lookout: Pay per metric monitored

---

### 8.5 AI Ethics & Safety

**Principles:**
1. **Transparency**: All AI decisions include explanations
2. **Human Oversight**: High-stakes decisions require approval
3. **Bias Mitigation**: Regular audits for fairness
4. **Privacy**: No PII in training data without consent
5. **Reliability**: Fallback to rule-based systems if AI fails

**Bias Auditing:**
- Test ML models on diverse datasets
- Measure fairness metrics (demographic parity, equal opportunity)
- Retrain if bias detected

**Explainability:**
- SHAP values for ML models (feature importance)
- Bedrock Claude: Ask "Why did you recommend X?" in prompt
- Dashboard: Show confidence scores and reasoning

**Fallback Mechanisms:**
- If Bedrock Claude unavailable: Use rule-based migration planner
- If ML model confidence <50%: Request human review
- If Whisper fails: Fallback to AWS Transcribe

---

### 8.6 AI Performance Benchmarks

**Latency Targets:**
| AI Capability | P50 Latency | P95 Latency | P99 Latency |
|---------------|-------------|-------------|-------------|
| Timeline Prediction | <50ms | <100ms | <200ms |
| Rollback Decision | <100ms | <200ms | <500ms |
| Cost Recommendations | <500ms | <1s | <2s |
| Voice Assistant (E2E) | <1.5s | <2.5s | <4s |
| Dependency Discovery | <2s | <5s | <10s |
| Risk Prediction | <200ms | <500ms | <1s |

**Accuracy Targets:**
| AI Capability | Metric | Target |
|---------------|--------|--------|
| Timeline Prediction | MAPE | <15% |
| Rollback Decision | False Positive Rate | <5% |
| Cost Recommendations | Realized Savings / Predicted | >80% |
| Voice Transcription | WER (Word Error Rate) | <5% |
| Dependency Discovery | F1-Score | >0.92 |
| Risk Prediction | AUC-ROC | >0.85 |

---

**End of Part 1 - AI & Machine Learning Capabilities**

---

*For Parts 2-3 (API Reference, Database Schema, Events, Security, Monitoring, Testing), see continuation in TECHNICAL_MANUAL_PART2.md and TECHNICAL_MANUAL_PART3.md (to be created in future sprints).*
