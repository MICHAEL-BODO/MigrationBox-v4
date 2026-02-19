/**
 * MIKE-FIRST v6.0 — Cloud Abstraction Layer
 * 
 * Unified interface for all cloud providers + on-prem infrastructure.
 * Supports dual-mode: demo (mock data) and live (real API calls).
 */

// ─── Types ───────────────────────────────────────────────────────────

export type CloudProviderType = 'aws' | 'azure' | 'gcp' | 'onprem';
export type OperatingMode = 'demo' | 'live';

export interface CloudResource {
  id: string;
  name: string;
  type: ResourceType;
  provider: CloudProviderType;
  region: string;
  status: 'running' | 'stopped' | 'terminated' | 'unknown';
  ip?: string;
  privateIp?: string;
  tags: Record<string, string>;
  created: string;
  cpu?: number;
  memoryGB?: number;
  storageGB?: number;
  os?: string;
  dependencies: string[];
  metadata: Record<string, unknown>;
}

export type ResourceType = 
  | 'vm' | 'container' | 'database' | 'storage' | 'network'
  | 'loadbalancer' | 'dns' | 'firewall' | 'gateway' | 'queue'
  | 'function' | 'cluster' | 'cache' | 'cdn' | 'iot' | 'other';

export interface SecurityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  resource: string;
  resourceType: ResourceType;
  provider: CloudProviderType;
  framework?: string;
  control?: string;
  remediation: string;
  autoFixAvailable: boolean;
  detectedAt: string;
  status: 'open' | 'acknowledged' | 'fixed' | 'suppressed';
}

export interface ComplianceResult {
  framework: string;
  score: number;
  totalControls: number;
  passingControls: number;
  failingControls: number;
  warnings: number;
  findings: SecurityFinding[];
  scannedAt: string;
}

export interface CostReport {
  provider: CloudProviderType;
  period: { start: string; end: string };
  totalCost: number;
  currency: string;
  breakdown: CostBreakdown[];
  optimizations: CostOptimization[];
}

export interface CostBreakdown {
  service: string;
  cost: number;
  usage: number;
  unit: string;
}

export interface CostOptimization {
  id: string;
  title: string;
  description: string;
  currentCost: number;
  optimizedCost: number;
  savingsPercent: number;
  savingsAnnual: number;
  category: 'rightsizing' | 'reserved' | 'waste' | 'storage' | 'schedule' | 'architecture';
  risk: 'low' | 'medium' | 'high';
  effort: 'trivial' | 'easy' | 'moderate' | 'complex';
  autoApplicable: boolean;
  resources: string[];
}

export interface MigrationPlan {
  id: string;
  name: string;
  source: CloudProviderType;
  target: CloudProviderType;
  waves: MigrationWave[];
  totalResources: number;
  estimatedDuration: string;
  risk: 'low' | 'medium' | 'high';
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed' | 'rolled-back';
}

export interface MigrationWave {
  id: string;
  name: string;
  order: number;
  resources: MigrationResource[];
  estimatedDuration: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
}

export interface MigrationResource {
  id: string;
  sourceResource: CloudResource;
  targetConfig: Record<string, unknown>;
  status: 'pending' | 'migrating' | 'validating' | 'completed' | 'failed' | 'rolled-back';
  progress: number;
  logs: string[];
}

export interface HealthStatus {
  service: string;
  provider: CloudProviderType;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  cpu: number;
  memory: number;
  latencyMs: number;
  uptime: number;
  lastCheck: string;
  issues: string[];
}

// ─── Cloud Provider Interface ────────────────────────────────────────

export interface ICloudProvider {
  name: CloudProviderType;
  mode: OperatingMode;

  // Discovery
  listResources(filter?: Partial<CloudResource>): Promise<CloudResource[]>;
  getResource(id: string): Promise<CloudResource | null>;
  getDependencies(id: string): Promise<string[]>;

  // Security & Compliance
  getSecurityFindings(): Promise<SecurityFinding[]>;
  getComplianceStatus(framework: string): Promise<ComplianceResult>;
  applyFix(findingId: string): Promise<{ success: boolean; message: string }>;

  // Cost
  getCostReport(startDate: string, endDate: string): Promise<CostReport>;
  getOptimizations(): Promise<CostOptimization[]>;
  applyOptimization(optimizationId: string): Promise<{ success: boolean; message: string }>;

  // Health
  getHealthStatus(): Promise<HealthStatus[]>;

  // Migration
  exportResource(id: string): Promise<Record<string, unknown>>;
  importResource(config: Record<string, unknown>): Promise<{ id: string; status: string }>;
  validateResource(id: string): Promise<{ valid: boolean; issues: string[] }>;
}

// ─── Configuration ───────────────────────────────────────────────────

export interface PlatformConfig {
  mode: OperatingMode;
  providers: {
    aws?: { region: string; accessKeyId?: string; secretAccessKey?: string };
    azure?: { subscriptionId: string; tenantId?: string; clientId?: string; clientSecret?: string };
    gcp?: { projectId: string; keyFile?: string };
    onprem?: { networkCidr: string; scanPorts?: number[] };
  };
}

export function getPlatformConfig(): PlatformConfig {
  return {
    mode: (process.env.MIKE_FIRST_MODE as OperatingMode) || 'demo',
    providers: {
      aws: { region: process.env.AWS_REGION || 'eu-west-1' },
      azure: { 
        subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || 'demo-sub',
        tenantId: process.env.AZURE_TENANT_ID,
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
      },
      gcp: { 
        projectId: process.env.GCP_PROJECT_ID || 'mike-first-demo',
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      },
      onprem: {
        networkCidr: process.env.ONPREM_CIDR || '192.168.1.0/24',
        scanPorts: [22, 80, 443, 445, 3306, 3389, 5432, 5900, 8080, 8443, 9090],
      },
    },
  };
}
