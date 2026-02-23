/**
 * MigrationBox V5.0 - Shared Types Package
 *
 * Centralized TypeScript type definitions used across all packages and services.
 */
export type CloudProvider = 'aws' | 'azure' | 'gcp';
export type MigrationStatus = 'pending' | 'discovering' | 'assessing' | 'planning' | 'migrating' | 'validating' | 'completed' | 'failed' | 'rolled_back';
export type WorkloadType = 'compute' | 'database' | 'storage' | 'network' | 'application' | 'container' | 'serverless';
export type MigrationStrategy = 'rehost' | 'replatform' | 'refactor' | 'repurchase' | 'retire' | 'retain';
export interface Tenant {
    tenantId: string;
    name: string;
    email: string;
    tier: 'starter' | 'professional' | 'enterprise' | 'custom';
    createdAt: string;
    updatedAt: string;
    status: 'active' | 'suspended' | 'deleted';
}
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
    dependencies?: string[];
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
export interface Assessment {
    assessmentId: string;
    tenantId: string;
    workloadId: string;
    strategy: MigrationStrategy;
    confidence: number;
    costProjection: {
        monthly: number;
        yearly: number;
        threeYear: number;
        currency: string;
    };
    riskScore: number;
    complexityScore: number;
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
export interface IntentSchema {
    intentId: string;
    tenantId: string;
    naturalLanguage: string;
    provider: CloudProvider;
    resources: IntentResource[];
    networking: IntentNetworking;
    security: IntentSecurity;
    compliance: Record<string, boolean>;
    monitoring?: Record<string, any>;
    confidence: number;
    createdAt: string;
    validatedAt?: string;
}
export interface IntentResource {
    type: string;
    name: string;
    properties: Record<string, any>;
    config?: Record<string, any>;
    dependencies?: string[];
}
export interface IntentNetworking {
    vpc: {
        cidr: string;
        subnets?: {
            public: number | Array<{
                name: string;
                cidr: string;
                availabilityZone: string;
                public: boolean;
            }>;
            private?: number;
        };
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
    iamLeastPrivilege?: boolean;
    secretsManagement: 'aws-secrets-manager' | 'azure-key-vault' | 'gcp-secret-manager';
}
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
export interface MigrationPattern {
    patternId: string;
    patternType: string;
    sourceProvider: CloudProvider;
    targetProvider: CloudProvider;
    workloadTypes: WorkloadType[];
    strategy: MigrationStrategy;
    anonymizedMetadata: Record<string, any>;
    successRate: number;
    avgDurationWeeks: number;
    avgCostSavings: number;
    createdAt: string;
    updatedAt: string;
}
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
export interface Event {
    eventId: string;
    eventType: string;
    tenantId: string;
    source: string;
    payload: Record<string, any>;
    timestamp: string;
    version: string;
}
export declare class MigrationBoxError extends Error {
    code: string;
    statusCode: number;
    details?: Record<string, any> | undefined;
    constructor(code: string, message: string, statusCode?: number, details?: Record<string, any> | undefined);
}
//# sourceMappingURL=index.d.ts.map