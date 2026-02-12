/**
 * MigrationBox V5.0 - Discovery Agent
 * 
 * AI-powered discovery agent that orchestrates workload discovery across cloud providers.
 * Extends BaseAgent and integrates with EventBridge for coordination.
 */

import { AgentTask } from '@migrationbox/types';
import { getDatabaseAdapter, getMessagingAdapter } from '@migrationbox/cal';

// BaseAgent will be defined in packages/agents/base-agent.ts (Sprint 7)
// For now, we define a minimal interface
interface BaseAgent {
  agentType: string;
  tenantId: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): Promise<{ status: string; lastHeartbeat: Date }>;
}

export class DiscoveryAgent implements BaseAgent {
  agentType = 'discovery';
  tenantId: string;
  private running = false;
  private lastHeartbeat: Date = new Date();
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Discovery Agent is already running');
    }

    this.running = true;
    this.startHeartbeat();

    // Publish agent started event
    const messaging = getMessagingAdapter();
    await messaging.publishEvent('migrationbox-events-dev', {
      agentType: this.agentType,
      tenantId: this.tenantId,
      status: 'started',
      timestamp: new Date().toISOString(),
    }, 'AgentStarted');
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    const messaging = getMessagingAdapter();
    await messaging.publishEvent('migrationbox-events-dev', {
      agentType: this.agentType,
      tenantId: this.tenantId,
      status: 'stopped',
      timestamp: new Date().toISOString(),
    }, 'AgentStopped');
  }

  async getStatus(): Promise<{ status: string; lastHeartbeat: Date }> {
    return {
      status: this.running ? 'running' : 'stopped',
      lastHeartbeat: this.lastHeartbeat,
    };
  }

  /**
   * Self-discovery: Identifies what to scan based on environment
   */
  async identifyScanTargets(credentials: Record<string, any>): Promise<{
    provider: string;
    regions: string[];
    services: string[];
  }> {
    // Analyze credentials to determine provider
    let provider = 'aws';
    if (credentials.azureTenantId || credentials.azureClientId) {
      provider = 'azure';
    } else if (credentials.gcpProjectId || credentials.gcpKeyFile) {
      provider = 'gcp';
    }

    // Default regions per provider
    const defaultRegions: Record<string, string[]> = {
      aws: ['us-east-1', 'us-west-2', 'eu-west-1'],
      azure: ['eastus', 'westus2', 'westeurope'],
      gcp: ['us-central1', 'us-east1', 'europe-west1'],
    };

    // Default services to scan
    const defaultServices: Record<string, string[]> = {
      aws: [
        'EC2', 'RDS', 'S3', 'Lambda', 'VPC', 'ELB', 'DynamoDB',
        'ECS', 'EKS', 'IAM', 'Route53', 'CloudWatch', 'SecretsManager',
        'SQS', 'SNS', 'Kinesis',
      ],
      azure: [
        'VMs', 'SQL', 'CosmosDB', 'Blob', 'Functions', 'VNets',
        'AppService', 'AKS', 'ServiceBus',
      ],
      gcp: [
        'ComputeEngine', 'CloudSQL', 'Firestore', 'CloudStorage',
        'CloudFunctions', 'CloudRun', 'VPC', 'GKE',
      ],
    };

    return {
      provider,
      regions: credentials.regions || defaultRegions[provider] || [],
      services: credentials.services || defaultServices[provider] || [],
    };
  }

  /**
   * Execute discovery task
   */
  async executeDiscoveryTask(task: AgentTask): Promise<void> {
    const db = getDatabaseAdapter();
    const messaging = getMessagingAdapter();

    try {
      // Update task status
      await db.updateItem('migrationbox-agent-tasks-dev', {
        tenantId: task.tenantId,
        taskId: task.taskId,
      }, {
        status: 'running',
        startedAt: new Date().toISOString(),
      });

      // Identify scan targets
      const scanTargets = await this.identifyScanTargets(task.payload.credentials || {});

      // Import appropriate adapter
      let adapter: any;
      switch (scanTargets.provider) {
        case 'aws':
          adapter = await import('./aws-adapter-v5');
          break;
        case 'azure':
          adapter = await import('./azure-adapter');
          break;
        case 'gcp':
          adapter = await import('./gcp-adapter');
          break;
        default:
          throw new Error(`Unsupported provider: ${scanTargets.provider}`);
      }

      // Execute discovery for each region
      const allWorkloads: any[] = [];
      for (const region of scanTargets.regions) {
        const workloads = await adapter.discover({
          region,
          credentials: task.payload.credentials,
          scope: task.payload.scope || 'full',
        });

        // Set tenantId and discoveryId
        workloads.forEach(w => {
          w.tenantId = task.tenantId;
          w.discoveryId = task.payload.discoveryId || 'pending';
        });

        allWorkloads.push(...workloads);
      }

      // Store results
      await db.updateItem('migrationbox-agent-tasks-dev', {
        tenantId: task.tenantId,
        taskId: task.taskId,
      }, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        result: {
          workloadsFound: allWorkloads.length,
          provider: scanTargets.provider,
          regions: scanTargets.regions,
        },
      });

      // Publish completion event
      await messaging.publishEvent('migrationbox-events-dev', {
        agentType: this.agentType,
        tenantId: task.tenantId,
        taskId: task.taskId,
        status: 'completed',
        workloadsFound: allWorkloads.length,
        timestamp: new Date().toISOString(),
      }, 'DiscoveryCompleted');

    } catch (error: any) {
      // Update task with error
      const db = getDatabaseAdapter();
      await db.updateItem('migrationbox-agent-tasks-dev', {
        tenantId: task.tenantId,
        taskId: task.taskId,
      }, {
        status: 'failed',
        failedAt: new Date().toISOString(),
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      this.lastHeartbeat = new Date();
      const messaging = getMessagingAdapter();
      await messaging.publishEvent('migrationbox-events-dev', {
        agentType: this.agentType,
        tenantId: this.tenantId,
        status: 'heartbeat',
        timestamp: this.lastHeartbeat.toISOString(),
      }, 'AgentHeartbeat');
    }, 30000); // Every 30 seconds
  }
}
