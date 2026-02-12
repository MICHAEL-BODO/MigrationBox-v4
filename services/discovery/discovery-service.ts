/**
 * MigrationBox V5.0 - Discovery Service
 *
 * Business logic orchestration for workload discovery.
 * Ties together DynamoDB storage, SQS queuing, AWS adapter scanning,
 * Neo4j graph ingestion, and EventBridge event publishing.
 */

import { v4 as uuidv4 } from 'uuid';
import { Discovery, Workload, CloudProvider } from '@migrationbox/types';

const STAGE = process.env.STAGE || 'dev';
const DISCOVERIES_TABLE = `migrationbox-discoveries-${STAGE}`;
const WORKLOADS_TABLE = process.env.WORKLOADS_TABLE || `migrationbox-workloads-${STAGE}`;
const DISCOVERY_QUEUE = `migrationbox-discovery-queue-${STAGE}`;
const EVENT_BUS = process.env.EVENT_BUS || `migrationbox-events-${STAGE}`;

export interface StartDiscoveryInput {
  tenantId: string;
  sourceEnvironment: CloudProvider;
  regions?: string[];
  services?: string[];
  scope?: 'full' | 'partial';
  credentials?: Record<string, string>;
}

export interface DiscoveryResult {
  discovery: Discovery;
  workloads: Workload[];
}

export class DiscoveryService {
  private db: any;
  private messaging: any;

  constructor(db: any, messaging: any) {
    this.db = db;
    this.messaging = messaging;
  }

  /**
   * Start a new discovery — creates record and queues async processing
   */
  async startDiscovery(input: StartDiscoveryInput): Promise<Discovery> {
    const discoveryId = `disc-${uuidv4()}`;
    const now = new Date().toISOString();

    const discovery: Discovery = {
      discoveryId,
      tenantId: input.tenantId,
      sourceEnvironment: input.sourceEnvironment,
      status: 'initiated',
      scope: input.scope || 'full',
      workloadsFound: 0,
      createdAt: now,
    };

    // Store discovery record
    await this.db.putItem(DISCOVERIES_TABLE, {
      tenantId: input.tenantId,
      discoveryId,
      ...discovery,
    });

    // Queue async discovery processing
    await this.messaging.sendMessage(DISCOVERY_QUEUE, {
      discoveryId,
      tenantId: input.tenantId,
      sourceEnvironment: input.sourceEnvironment,
      regions: input.regions || this.getDefaultRegions(input.sourceEnvironment),
      services: input.services,
      scope: input.scope || 'full',
      credentials: input.credentials || {},
    });

    // Publish DiscoveryInitiated event
    await this.messaging.publishEvent(EVENT_BUS, {
      discoveryId,
      tenantId: input.tenantId,
      sourceEnvironment: input.sourceEnvironment,
      status: 'initiated',
      timestamp: now,
    }, 'DiscoveryInitiated');

    return discovery;
  }

  /**
   * Get discovery by ID
   */
  async getDiscovery(tenantId: string, discoveryId: string): Promise<Discovery | null> {
    const result = await this.db.getItem(DISCOVERIES_TABLE, {
      tenantId,
      discoveryId,
    });
    return result || null;
  }

  /**
   * List workloads for a discovery
   */
  async listWorkloads(
    tenantId: string,
    discoveryId: string,
    options?: { type?: string; limit?: number; nextToken?: string }
  ): Promise<{ workloads: Workload[]; nextToken?: string }> {
    const queryParams: any = {
      indexName: 'discoveryId-index',
      keyCondition: 'discoveryId = :discoveryId',
      expressionValues: { ':discoveryId': discoveryId },
    };

    if (options?.type) {
      queryParams.filterExpression = '#type = :type';
      queryParams.expressionValues[':type'] = options.type;
      queryParams.expressionNames = { '#type': 'type' };
    }

    if (options?.limit) {
      queryParams.limit = options.limit;
    }

    const result = await this.db.queryItems(WORKLOADS_TABLE, queryParams);
    return {
      workloads: result.items || result,
      nextToken: result.lastEvaluatedKey,
    };
  }

  /**
   * Process discovery — called by SQS consumer (async)
   */
  async processDiscovery(message: {
    discoveryId: string;
    tenantId: string;
    sourceEnvironment: CloudProvider;
    regions: string[];
    services?: string[];
    scope: string;
    credentials: Record<string, string>;
  }): Promise<DiscoveryResult> {
    const { discoveryId, tenantId, sourceEnvironment, regions, scope, credentials } = message;

    // Update status to running
    await this.db.updateItem(DISCOVERIES_TABLE, {
      tenantId,
      discoveryId,
    }, {
      status: 'running',
      startedAt: new Date().toISOString(),
    });

    await this.messaging.publishEvent(EVENT_BUS, {
      discoveryId,
      tenantId,
      status: 'running',
      timestamp: new Date().toISOString(),
    }, 'DiscoveryStarted');

    try {
      // Dynamically load the appropriate cloud adapter
      let discoverFn: any;
      switch (sourceEnvironment) {
        case 'aws':
          const awsAdapter = await import('./aws-adapter-v5');
          discoverFn = awsAdapter.discover;
          break;
        case 'azure':
          // Azure adapter will be implemented in Sprint 4
          throw new Error('Azure discovery not yet implemented');
        case 'gcp':
          // GCP adapter will be implemented in Sprint 4
          throw new Error('GCP discovery not yet implemented');
        default:
          throw new Error(`Unsupported provider: ${sourceEnvironment}`);
      }

      // Execute discovery across all regions
      const allWorkloads: Workload[] = [];
      for (const region of regions) {
        const workloads = await discoverFn({
          region,
          credentials,
          scope,
        });

        // Tag each workload with tenant and discovery context
        for (const workload of workloads) {
          workload.tenantId = tenantId;
          workload.discoveryId = discoveryId;

          // Store each workload
          await this.db.putItem(WORKLOADS_TABLE, {
            tenantId,
            workloadId: workload.workloadId,
            ...workload,
          });

          // Publish per-workload event
          await this.messaging.publishEvent(EVENT_BUS, {
            discoveryId,
            tenantId,
            workloadId: workload.workloadId,
            type: workload.type,
            name: workload.name,
            timestamp: new Date().toISOString(),
          }, 'WorkloadDiscovered');
        }

        allWorkloads.push(...workloads);
      }

      // Update discovery with results
      const completedAt = new Date().toISOString();
      const discovery: Discovery = {
        discoveryId,
        tenantId,
        sourceEnvironment,
        status: 'complete',
        scope: scope as 'full' | 'partial',
        workloadsFound: allWorkloads.length,
        createdAt: '', // preserved from original record
        completedAt,
      };

      await this.db.updateItem(DISCOVERIES_TABLE, {
        tenantId,
        discoveryId,
      }, {
        status: 'complete',
        workloadsFound: allWorkloads.length,
        completedAt,
      });

      // Publish DiscoveryCompleted event
      await this.messaging.publishEvent(EVENT_BUS, {
        discoveryId,
        tenantId,
        status: 'complete',
        workloadsFound: allWorkloads.length,
        regions,
        timestamp: completedAt,
      }, 'DiscoveryCompleted');

      return { discovery, workloads: allWorkloads };

    } catch (error: any) {
      const failedAt = new Date().toISOString();
      await this.db.updateItem(DISCOVERIES_TABLE, {
        tenantId,
        discoveryId,
      }, {
        status: 'failed',
        failedAt,
        error: error.message,
      });

      await this.messaging.publishEvent(EVENT_BUS, {
        discoveryId,
        tenantId,
        status: 'failed',
        error: error.message,
        timestamp: failedAt,
      }, 'DiscoveryFailed');

      throw error;
    }
  }

  private getDefaultRegions(provider: CloudProvider): string[] {
    const defaults: Record<string, string[]> = {
      aws: ['us-east-1', 'us-west-2', 'eu-west-1'],
      azure: ['eastus', 'westus2', 'westeurope'],
      gcp: ['us-central1', 'us-east1', 'europe-west1'],
    };
    return defaults[provider] || ['us-east-1'];
  }
}
