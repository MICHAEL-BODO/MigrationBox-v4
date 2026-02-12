/**
 * MigrationBox V5.0 - Shared Types Package
 * 
 * Centralized TypeScript type definitions used across all packages and services.
 */

// ============================================================================
// Core Domain Types
// ============================================================================

export type CloudProvider = 'aws' | 'azure' | 'gcp';
export type MigrationStatus = 'pending' | 'discovering' | 'assessing' | 'planning' | 'migrating' | 'validating' | 'completed' | 'failed' | 'rolled_back';
export type WorkloadType = 'compute' | 'database' | 'storage' | 'network' | 'application' | 'container' | 'serverless';
export type MigrationStrategy = 'rehost' | 'replatform' | 'refactor' | 'repurchase' | 'retire' | 'retain';

// ============================================================================
// Tenant & Multi-Tenancy
// ============================================================================

export interface Tenant {
  tenantId: string;
  name: string;
  email: string;
  tier: 'starter' | 'professional' | 'enterprise' | 'custom';
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'suspended' | 'deleted';
}

// ============================================================================
// Workload Discovery
// ============================================================================

export interface Workload {
  workloadId: string;
  tenantId: string;
  discoveryId: string;
  type: WorkloadType;
  provider: CloudProvider;
  region: string;
  name: string;
  status: string;
  metadata: Record<string, any>;
  discoveredAt: string;
  dependencies?: string[]; // Array of workloadIds
}

export interface Discovery {
  discoveryId: string;
  tenantId: string;
  sourceEnvironment: CloudProvider;
  status: 'initiated' | 'running' | 'complete' | 'failed';
  scope: 'full' | 'partial';
  workloadsFound: number;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
}

// ============================================================================
// Assessment & 6Rs Analysis
// ============================================================================

export interface Assessment {
  assessmentId: string;
  tenantId: string;
  workloadId: string;
  strategy: MigrationStrategy;
  confidence: number; // 0-1
  costProjection: {
    monthly: number;
    yearly: number;
    threeYear: number;
    currency: string;
  };
  riskScore: number; // 0-100
  complexityScore: number; // 0-100
  timelineWeeks: number;
  timelineConfidence: {
    min: number;
    max: number;
    p50: number;
    p95: number;
  };
  recommendations: string[];
  blockers: string[];
  createdAt: string;
}

// ============================================================================
// Migration Execution
// ============================================================================

export interface Migration {
  migrationId: string;
  tenantId: string;
  workloadId: string;
  sourceProvider: CloudProvider;
  targetProvider: CloudProvider;
  status: MigrationStatus;
  strategy: MigrationStrategy;
  assessmentId: string;
  iacTemplateId?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
  rollbackAt?: string;
  metadata: Record<string, any>;
}

// ============================================================================
// I2I Pipeline - Intent Schema (IR)
// ============================================================================

export interface IntentSchema {
  intentId: string;
  tenantId: string;
  naturalLanguage: string;
  provider: CloudProvider;
  resources: IntentResource[];
  networking: IntentNetworking;
  security: IntentSecurity;
  compliance: string[]; // PCI-DSS, HIPAA, SOC2, GDPR
  confidence: number; // 0-1
  createdAt: string;
  validatedAt?: string;
}

export interface IntentResource {
  type: string; // 'vpc', 'rds', 's3', 'lambda', etc.
  name: string;
  properties: Record<string, any>;
  dependencies?: string[]; // References to other resource names
}

export interface IntentNetworking {
  vpc: {
    cidr: string;
    subnets: Array<{
      name: string;
      cidr: string;
      availabilityZone: string;
      public: boolean;
    }>;
  };
  securityGroups: Array<{
    name: string;
    rules: Array<{
      type: 'ingress' | 'egress';
      protocol: string;
      port: number;
      source: string;
    }>;
  }>;
}

export interface IntentSecurity {
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  iamPolicies: string[];
  secretsManagement: 'aws-secrets-manager' | 'azure-key-vault' | 'gcp-secret-manager';
}

// ============================================================================
// Agentic AI
// ============================================================================

export interface AgentTask {
  taskId: string;
  agentType: 'discovery' | 'assessment' | 'iac-generation' | 'validation' | 'optimization' | 'orchestration';
  tenantId: string;
  migrationId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  payload: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// ============================================================================
// CRDT Knowledge Network
// ============================================================================

export interface MigrationPattern {
  patternId: string;
  patternType: string;
  sourceProvider: CloudProvider;
  targetProvider: CloudProvider;
  workloadTypes: WorkloadType[];
  strategy: MigrationStrategy;
  anonymizedMetadata: Record<string, any>; // No PII
  successRate: number; // 0-1
  avgDurationWeeks: number;
  avgCostSavings: number; // Percentage
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Event Types
// ============================================================================

export interface Event {
  eventId: string;
  eventType: string;
  tenantId: string;
  source: string;
  payload: Record<string, any>;
  timestamp: string;
  version: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class MigrationBoxError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'MigrationBoxError';
  }
}
