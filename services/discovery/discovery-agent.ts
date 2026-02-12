/**
 * MigrationBox V5.0 - Discovery Agent
 *
 * AI-powered discovery agent that orchestrates workload discovery across cloud providers.
 * Extends BaseAgent pattern and integrates with EventBridge for coordination.
 * Includes retry logic with exponential backoff and progress reporting.
 */

import { AgentTask, CloudProvider } from '@migrationbox/types';
import { DiscoveryService } from './discovery-service';
import { publishDiscoveryEvent } from './eventbridge-integration';

interface BaseAgent {
  agentType: string;
  tenantId: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): Promise<AgentStatus>;
}

interface AgentStatus {
  status: 'idle' | 'running' | 'stopped' | 'error';
  lastHeartbeat: Date;
  currentTask?: string;
  progress?: number;
  tasksCompleted: number;
  tasksFailed: number;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

export class DiscoveryAgent implements BaseAgent {
  agentType = 'discovery';
  tenantId: string;
  private running = false;
  private lastHeartbeat: Date = new Date();
  private heartbeatInterval?: NodeJS.Timeout;
  private currentTaskId?: string;
  private progress = 0;
  private tasksCompleted = 0;
  private tasksFailed = 0;
  private service: DiscoveryService;

  constructor(tenantId: string, db: any, messaging: any) {
    this.tenantId = tenantId;
    this.service = new DiscoveryService(db, messaging);
  }

  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Discovery Agent is already running');
    }

    this.running = true;
    this.startHeartbeat();

    await publishDiscoveryEvent('AgentStarted', {
      agentType: this.agentType,
      tenantId: this.tenantId,
      status: 'started',
    });
  }

  async stop(): Promise<void> {
    if (!this.running) return;

    this.running = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    await publishDiscoveryEvent('AgentStopped', {
      agentType: this.agentType,
      tenantId: this.tenantId,
      status: 'stopped',
      tasksCompleted: this.tasksCompleted,
      tasksFailed: this.tasksFailed,
    });
  }

  async getStatus(): Promise<AgentStatus> {
    return {
      status: this.running ? 'running' : 'stopped',
      lastHeartbeat: this.lastHeartbeat,
      currentTask: this.currentTaskId,
      progress: this.progress,
      tasksCompleted: this.tasksCompleted,
      tasksFailed: this.tasksFailed,
    };
  }

  /**
   * Execute a discovery task with retry logic
   */
  async executeTask(task: AgentTask): Promise<void> {
    this.currentTaskId = task.taskId;
    this.progress = 0;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.executeTaskAttempt(task, attempt);
        this.tasksCompleted++;
        this.currentTaskId = undefined;
        this.progress = 100;
        return;
      } catch (error: any) {
        console.error(`Discovery task ${task.taskId} attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);

        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        } else {
          this.tasksFailed++;
          this.currentTaskId = undefined;

          await publishDiscoveryEvent('DiscoveryFailed', {
            agentType: this.agentType,
            tenantId: this.tenantId,
            taskId: task.taskId,
            error: error.message,
            attempts: attempt,
          });

          throw error;
        }
      }
    }
  }

  private async executeTaskAttempt(task: AgentTask, attempt: number): Promise<void> {
    const { discoveryId, sourceEnvironment, regions, scope, credentials } = task.payload;

    const scanTargets = this.identifyScanTargets(
      credentials || {},
      sourceEnvironment,
      regions
    );

    await this.service.processDiscovery({
      discoveryId: discoveryId || task.taskId,
      tenantId: task.tenantId,
      sourceEnvironment: scanTargets.provider as CloudProvider,
      regions: scanTargets.regions,
      scope: scope || 'full',
      credentials: credentials || {},
    });

    this.progress = 100;

    await publishDiscoveryEvent('DiscoveryCompleted', {
      agentType: this.agentType,
      tenantId: task.tenantId,
      taskId: task.taskId,
      discoveryId,
      attempt,
    });
  }

  /**
   * Identify scan targets based on credentials and config
   */
  identifyScanTargets(
    credentials: Record<string, any>,
    sourceEnvironment?: string,
    regions?: string[]
  ): { provider: string; regions: string[]; services: string[] } {
    let provider = sourceEnvironment || 'aws';
    if (!sourceEnvironment) {
      if (credentials.azureTenantId || credentials.azureClientId) provider = 'azure';
      else if (credentials.gcpProjectId || credentials.gcpKeyFile) provider = 'gcp';
    }

    const defaultRegions: Record<string, string[]> = {
      aws: ['us-east-1', 'us-west-2', 'eu-west-1'],
      azure: ['eastus', 'westus2', 'westeurope'],
      gcp: ['us-central1', 'us-east1', 'europe-west1'],
    };

    const defaultServices: Record<string, string[]> = {
      aws: ['EC2', 'RDS', 'S3', 'Lambda', 'VPC', 'ELB', 'DynamoDB', 'ECS', 'EKS', 'IAM', 'Route53', 'CloudWatch', 'SecretsManager', 'SQS', 'SNS', 'Kinesis'],
      azure: ['VMs', 'SQL', 'CosmosDB', 'Blob', 'Functions', 'VNets', 'AppService', 'AKS', 'ServiceBus'],
      gcp: ['ComputeEngine', 'CloudSQL', 'Firestore', 'CloudStorage', 'CloudFunctions', 'CloudRun', 'VPC', 'GKE'],
    };

    return {
      provider,
      regions: regions || defaultRegions[provider] || [],
      services: defaultServices[provider] || [],
    };
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      this.lastHeartbeat = new Date();
      try {
        await publishDiscoveryEvent('AgentHeartbeat', {
          agentType: this.agentType,
          tenantId: this.tenantId,
          status: this.running ? 'running' : 'stopped',
          currentTask: this.currentTaskId,
          progress: this.progress,
          tasksCompleted: this.tasksCompleted,
          tasksFailed: this.tasksFailed,
        });
      } catch {
        // Heartbeat failure is non-fatal
      }
    }, 30000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
