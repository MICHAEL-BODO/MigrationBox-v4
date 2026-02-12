/**
 * MigrationBox V5.0 - Multi-Cloud Discovery Orchestration
 *
 * Coordinates discovery across AWS, Azure, and GCP with unified resource format,
 * job status tracking, and progress events.
 */

import { Workload, CloudProvider, Discovery } from '@migrationbox/types';
import { DiscoveryService } from './discovery-service';

export interface MultiCloudDiscoveryInput {
  tenantId: string;
  clouds: {
    provider: CloudProvider;
    regions: string[];
    credentials: Record<string, string>;
  }[];
  scope?: 'full' | 'partial';
}

export interface MultiCloudDiscoveryResult {
  discoveryId: string;
  tenantId: string;
  status: string;
  clouds: {
    provider: CloudProvider;
    status: string;
    workloadsFound: number;
    regions: string[];
    error?: string;
  }[];
  totalWorkloads: number;
  completedAt?: string;
}

export class MultiCloudDiscoveryService {
  private service: DiscoveryService;

  constructor(db: any, messaging: any) {
    this.service = new DiscoveryService(db, messaging);
  }

  /**
   * Start discovery across multiple clouds in parallel
   */
  async startMultiCloudDiscovery(input: MultiCloudDiscoveryInput): Promise<MultiCloudDiscoveryResult> {
    const { tenantId, clouds, scope } = input;

    // Create one sub-discovery per cloud provider
    const results = await Promise.allSettled(
      clouds.map(async (cloud) => {
        const discovery = await this.service.startDiscovery({
          tenantId,
          sourceEnvironment: cloud.provider,
          regions: cloud.regions,
          scope: scope || 'full',
          credentials: cloud.credentials,
        });
        return { provider: cloud.provider, discovery, regions: cloud.regions };
      })
    );

    const cloudResults = results.map((result, idx) => {
      if (result.status === 'fulfilled') {
        return {
          provider: clouds[idx].provider,
          status: 'initiated',
          workloadsFound: 0,
          regions: clouds[idx].regions,
        };
      } else {
        return {
          provider: clouds[idx].provider,
          status: 'failed',
          workloadsFound: 0,
          regions: clouds[idx].regions,
          error: result.reason?.message,
        };
      }
    });

    return {
      discoveryId: `multi-disc-${Date.now()}`,
      tenantId,
      status: 'initiated',
      clouds: cloudResults,
      totalWorkloads: 0,
    };
  }

  /**
   * Normalize workload to unified cross-cloud format
   */
  static normalizeWorkload(workload: Workload): NormalizedWorkload {
    return {
      id: workload.workloadId,
      tenantId: workload.tenantId,
      provider: workload.provider,
      region: workload.region,
      name: workload.name,
      category: mapToUnifiedCategory(workload.type, workload.provider),
      status: normalizeStatus(workload.status, workload.provider),
      costTier: estimateCostTier(workload),
      migrationComplexity: estimateComplexity(workload),
      metadata: workload.metadata,
      dependencies: workload.dependencies || [],
      discoveredAt: workload.discoveredAt,
    };
  }
}

interface NormalizedWorkload {
  id: string;
  tenantId: string;
  provider: string;
  region: string;
  name: string;
  category: string;
  status: string;
  costTier: 'low' | 'medium' | 'high';
  migrationComplexity: 'simple' | 'moderate' | 'complex';
  metadata: Record<string, any>;
  dependencies: string[];
  discoveredAt: string;
}

function mapToUnifiedCategory(type: string, provider: string): string {
  const mapping: Record<string, string> = {
    compute: 'Compute',
    database: 'Database',
    storage: 'Storage',
    network: 'Networking',
    application: 'Application',
    container: 'Container',
    serverless: 'Serverless',
  };
  return mapping[type] || 'Other';
}

function normalizeStatus(status: string, provider: string): string {
  const statusMap: Record<string, string> = {
    running: 'active', available: 'active', active: 'active',
    Running: 'active', Succeeded: 'active', Ready: 'active',
    RUNNING: 'active', ACTIVE: 'active',
    stopped: 'inactive', deallocated: 'inactive', TERMINATED: 'inactive',
    pending: 'pending', creating: 'pending', PROVISIONING: 'pending',
    failed: 'error', Failed: 'error', ERROR: 'error',
  };
  return statusMap[status] || 'unknown';
}

function estimateCostTier(workload: Workload): 'low' | 'medium' | 'high' {
  const meta = workload.metadata as any;
  if (!meta) return 'low';

  // Database instances tend to be higher cost
  if (workload.type === 'database') {
    if (meta.multiAZ || meta.highAvailability) return 'high';
    return 'medium';
  }

  // Large compute instances
  if (workload.type === 'compute') {
    const size = meta.instanceType || meta.vmSize || meta.machineType || '';
    if (size.includes('xlarge') || size.includes('Standard_D') || size.includes('n1-standard-8')) return 'high';
    if (size.includes('large') || size.includes('Standard_B')) return 'medium';
  }

  // Container clusters
  if (workload.type === 'container') {
    const nodeCount = meta.nodeCount || meta.desiredCount || 0;
    if (nodeCount > 5) return 'high';
    if (nodeCount > 1) return 'medium';
  }

  return 'low';
}

function estimateComplexity(workload: Workload): 'simple' | 'moderate' | 'complex' {
  const deps = workload.dependencies?.length || 0;
  if (deps > 5) return 'complex';
  if (deps > 2) return 'moderate';
  return 'simple';
}
