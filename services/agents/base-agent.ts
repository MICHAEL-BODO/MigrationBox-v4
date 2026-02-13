/**
 * MigrationBox V5.0 - BaseAgent Class
 *
 * Abstract base class for all AI agents with:
 * - Lifecycle management (start/stop/pause/resume)
 * - Heartbeat monitoring (30s intervals)
 * - A2A (Agent-to-Agent) protocol messaging via EventBridge
 * - Circuit breaker pattern for fault tolerance
 * - Retry logic with exponential backoff
 * - Task queue management
 */

import { AgentTask } from '@migrationbox/types';
import { generateId, getCurrentTimestamp } from '@migrationbox/utils';

// ============================================================================
// Types
// ============================================================================

export type AgentType = 'discovery' | 'assessment' | 'iac-generation' | 'validation' | 'optimization' | 'orchestration';
export type AgentState = 'idle' | 'running' | 'paused' | 'stopped' | 'error';

export interface AgentStatus {
  agentId: string;
  agentType: AgentType;
  tenantId: string;
  state: AgentState;
  lastHeartbeat: string;
  currentTask?: string;
  progress: number;
  tasksCompleted: number;
  tasksFailed: number;
  uptime: number;
  circuitBreakerState: CircuitBreakerState;
  queueDepth: number;
}

export interface A2AMessage {
  messageId: string;
  from: AgentType;
  to: AgentType;
  type: 'request' | 'response' | 'event' | 'command';
  action: string;
  payload: Record<string, any>;
  correlationId?: string;
  timestamp: string;
  ttl: number; // seconds
}

export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

interface CircuitBreaker {
  state: CircuitBreakerState;
  failures: number;
  lastFailure?: string;
  nextRetry?: string;
  threshold: number;
  resetTimeout: number; // ms
}

// ============================================================================
// BaseAgent
// ============================================================================

export abstract class BaseAgent {
  readonly agentId: string;
  abstract readonly agentType: AgentType;
  readonly tenantId: string;

  protected state: AgentState = 'idle';
  protected taskQueue: AgentTask[] = [];
  protected currentTask?: AgentTask;
  protected progress = 0;
  protected tasksCompleted = 0;
  protected tasksFailed = 0;
  protected startedAt?: Date;

  private heartbeatInterval?: NodeJS.Timeout;
  private circuitBreaker: CircuitBreaker;
  private eventBus: EventBusAdapter;

  protected db: any;
  protected messaging: any;

  static readonly MAX_RETRIES = 3;
  static readonly BASE_DELAY_MS = 2000;
  static readonly HEARTBEAT_INTERVAL_MS = 30000;
  static readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  static readonly CIRCUIT_BREAKER_RESET_MS = 60000;

  constructor(tenantId: string, db: any, messaging: any) {
    this.agentId = generateId(`agent-${this.constructor.name.toLowerCase()}`);
    this.tenantId = tenantId;
    this.db = db;
    this.messaging = messaging;
    this.eventBus = new EventBusAdapter();
    this.circuitBreaker = {
      state: 'closed',
      failures: 0,
      threshold: BaseAgent.CIRCUIT_BREAKER_THRESHOLD,
      resetTimeout: BaseAgent.CIRCUIT_BREAKER_RESET_MS,
    };
  }

  // ---- Lifecycle ----

  async start(): Promise<void> {
    if (this.state === 'running') {
      throw new Error(`${this.agentType} agent is already running`);
    }

    this.state = 'running';
    this.startedAt = new Date();
    this.startHeartbeat();

    await this.publishEvent('AgentStarted', {
      agentId: this.agentId,
      agentType: this.agentType,
      tenantId: this.tenantId,
    });

    await this.onStart();
  }

  async stop(): Promise<void> {
    if (this.state === 'stopped') return;

    this.state = 'stopped';
    this.stopHeartbeat();

    await this.publishEvent('AgentStopped', {
      agentId: this.agentId,
      agentType: this.agentType,
      tenantId: this.tenantId,
      tasksCompleted: this.tasksCompleted,
      tasksFailed: this.tasksFailed,
    });

    await this.onStop();
  }

  async pause(): Promise<void> {
    if (this.state !== 'running') return;
    this.state = 'paused';
    await this.publishEvent('AgentPaused', { agentId: this.agentId });
  }

  async resume(): Promise<void> {
    if (this.state !== 'paused') return;
    this.state = 'running';
    await this.publishEvent('AgentResumed', { agentId: this.agentId });
  }

  async getStatus(): Promise<AgentStatus> {
    return {
      agentId: this.agentId,
      agentType: this.agentType,
      tenantId: this.tenantId,
      state: this.state,
      lastHeartbeat: getCurrentTimestamp(),
      currentTask: this.currentTask?.taskId,
      progress: this.progress,
      tasksCompleted: this.tasksCompleted,
      tasksFailed: this.tasksFailed,
      uptime: this.startedAt ? Date.now() - this.startedAt.getTime() : 0,
      circuitBreakerState: this.circuitBreaker.state,
      queueDepth: this.taskQueue.length,
    };
  }

  // ---- Task Execution ----

  async enqueueTask(task: AgentTask): Promise<void> {
    this.taskQueue.push(task);
    await this.publishEvent('TaskEnqueued', {
      agentId: this.agentId,
      taskId: task.taskId,
      queueDepth: this.taskQueue.length,
    });
  }

  async processQueue(): Promise<void> {
    while (this.taskQueue.length > 0 && this.state === 'running') {
      const task = this.taskQueue.shift()!;
      await this.executeWithRetry(task);
    }
  }

  async executeWithRetry(task: AgentTask): Promise<void> {
    if (!this.checkCircuitBreaker()) {
      this.tasksFailed++;
      await this.publishEvent('TaskRejected', {
        taskId: task.taskId,
        reason: 'Circuit breaker open',
      });
      return;
    }

    this.currentTask = task;
    this.progress = 0;

    for (let attempt = 1; attempt <= BaseAgent.MAX_RETRIES; attempt++) {
      try {
        await this.publishEvent('TaskStarted', {
          taskId: task.taskId,
          attempt,
        });

        await this.executeTask(task);

        this.tasksCompleted++;
        this.progress = 100;
        this.onCircuitBreakerSuccess();

        await this.publishEvent('TaskCompleted', {
          taskId: task.taskId,
          attempt,
        });

        this.currentTask = undefined;
        return;
      } catch (error: any) {
        console.error(`[${this.agentType}] Task ${task.taskId} attempt ${attempt}/${BaseAgent.MAX_RETRIES} failed:`, error.message);

        if (attempt < BaseAgent.MAX_RETRIES) {
          const delay = BaseAgent.BASE_DELAY_MS * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        } else {
          this.tasksFailed++;
          this.onCircuitBreakerFailure();
          this.currentTask = undefined;

          await this.publishEvent('TaskFailed', {
            taskId: task.taskId,
            error: error.message,
            attempts: attempt,
          });
        }
      }
    }
  }

  // ---- Abstract methods for subclasses ----

  protected abstract executeTask(task: AgentTask): Promise<void>;
  protected async onStart(): Promise<void> {}
  protected async onStop(): Promise<void> {}

  // ---- A2A Protocol ----

  async sendMessage(to: AgentType, action: string, payload: Record<string, any>, correlationId?: string): Promise<A2AMessage> {
    const message: A2AMessage = {
      messageId: generateId('msg'),
      from: this.agentType,
      to,
      type: 'request',
      action,
      payload,
      correlationId,
      timestamp: getCurrentTimestamp(),
      ttl: 300,
    };

    await this.eventBus.publish('migrationbox.a2a', message);
    return message;
  }

  async broadcastEvent(action: string, payload: Record<string, any>): Promise<void> {
    const message: A2AMessage = {
      messageId: generateId('msg'),
      from: this.agentType,
      to: this.agentType, // broadcast
      type: 'event',
      action,
      payload: { ...payload, tenantId: this.tenantId },
      timestamp: getCurrentTimestamp(),
      ttl: 300,
    };

    await this.eventBus.publish('migrationbox.a2a.broadcast', message);
  }

  // ---- Circuit Breaker ----

  private checkCircuitBreaker(): boolean {
    if (this.circuitBreaker.state === 'closed') return true;

    if (this.circuitBreaker.state === 'open') {
      const nextRetry = this.circuitBreaker.nextRetry
        ? new Date(this.circuitBreaker.nextRetry).getTime()
        : 0;

      if (Date.now() >= nextRetry) {
        this.circuitBreaker.state = 'half-open';
        return true;
      }
      return false;
    }

    // half-open: allow one request
    return true;
  }

  private onCircuitBreakerSuccess(): void {
    this.circuitBreaker.state = 'closed';
    this.circuitBreaker.failures = 0;
  }

  private onCircuitBreakerFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = getCurrentTimestamp();

    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'open';
      this.circuitBreaker.nextRetry = new Date(
        Date.now() + this.circuitBreaker.resetTimeout
      ).toISOString();
    }
  }

  // ---- Heartbeat ----

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.publishEvent('AgentHeartbeat', {
          agentId: this.agentId,
          agentType: this.agentType,
          tenantId: this.tenantId,
          state: this.state,
          currentTask: this.currentTask?.taskId,
          progress: this.progress,
          tasksCompleted: this.tasksCompleted,
          tasksFailed: this.tasksFailed,
          circuitBreaker: this.circuitBreaker.state,
          queueDepth: this.taskQueue.length,
        });
      } catch {
        // Heartbeat failure is non-fatal
      }
    }, BaseAgent.HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  // ---- Helpers ----

  protected async publishEvent(eventType: string, detail: Record<string, any>): Promise<void> {
    await this.eventBus.publish(`migrationbox.agent.${this.agentType}`, {
      eventType,
      agentId: this.agentId,
      tenantId: this.tenantId,
      ...detail,
      timestamp: getCurrentTimestamp(),
    });
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected updateProgress(percent: number): void {
    this.progress = Math.min(100, Math.max(0, percent));
  }
}

// ============================================================================
// EventBus Adapter (wraps EventBridge)
// ============================================================================

class EventBusAdapter {
  private busName = process.env.EVENT_BUS_NAME || 'migrationbox-events';

  async publish(source: string, detail: Record<string, any>): Promise<void> {
    // In production, this sends to EventBridge
    // In dev/test, logs the event
    if (process.env.NODE_ENV === 'test') return;

    try {
      const { EventBridgeClient, PutEventsCommand } = await import('@aws-sdk/client-eventbridge');
      const client = new EventBridgeClient({
        region: process.env.AWS_REGION || 'us-east-1',
        ...(process.env.LOCALSTACK_ENDPOINT && {
          endpoint: process.env.LOCALSTACK_ENDPOINT,
        }),
      });

      await client.send(new PutEventsCommand({
        Entries: [{
          EventBusName: this.busName,
          Source: source,
          DetailType: detail.eventType || source,
          Detail: JSON.stringify(detail),
        }],
      }));
    } catch {
      // EventBridge publish failure is non-fatal for agents
    }
  }
}
