/**
 * MigrationBox V5.0 - Orchestration Agent (Conductor)
 *
 * The "conductor" agent that coordinates all other agents.
 * Manages migration workflow execution, agent task assignment,
 * and end-to-end migration lifecycle.
 */

import { AgentTask } from '@migrationbox/types';
import { generateId, getCurrentTimestamp } from '@migrationbox/utils';
import { BaseAgent, AgentType, A2AMessage } from './base-agent';

export interface MigrationPlan {
  planId: string;
  tenantId: string;
  phases: MigrationPhase[];
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed' | 'rolled-back';
  currentPhase: number;
  createdAt: string;
  updatedAt: string;
}

export interface MigrationPhase {
  name: string;
  agentType: AgentType;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  taskId?: string;
  startedAt?: string;
  completedAt?: string;
  result?: Record<string, any>;
  error?: string;
}

const MIGRATION_PHASES: Array<{ name: string; agent: AgentType }> = [
  { name: 'discovery', agent: 'discovery' },
  { name: 'assessment', agent: 'assessment' },
  { name: 'iac-generation', agent: 'iac-generation' },
  { name: 'pre-validation', agent: 'validation' },
  { name: 'optimization', agent: 'optimization' },
  { name: 'post-validation', agent: 'validation' },
];

export class OrchestrationAgent extends BaseAgent {
  readonly agentType: AgentType = 'orchestration';
  private activePlans: Map<string, MigrationPlan> = new Map();
  private messageHandlers: Map<string, (msg: A2AMessage) => Promise<void>> = new Map();

  protected async onStart(): Promise<void> {
    this.registerMessageHandlers();
  }

  protected async executeTask(task: AgentTask): Promise<void> {
    const { action } = task.payload;

    switch (action) {
      case 'create-plan':
        await this.createMigrationPlan(task);
        break;
      case 'execute-plan':
        await this.executeMigrationPlan(task);
        break;
      case 'rollback-plan':
        await this.rollbackPlan(task);
        break;
      default:
        await this.handleAgentMessage(task);
    }
  }

  /**
   * Create a migration plan that sequences all agents
   */
  private async createMigrationPlan(task: AgentTask): Promise<void> {
    const { tenantId, workloadIds, sourceProvider, targetProvider, strategy } = task.payload;

    const plan: MigrationPlan = {
      planId: generateId('plan'),
      tenantId: tenantId || task.tenantId,
      phases: MIGRATION_PHASES.map(p => ({
        name: p.name,
        agentType: p.agent,
        status: 'pending',
      })),
      status: 'draft',
      currentPhase: 0,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    this.activePlans.set(plan.planId, plan);

    await this.db.putItem?.('migrationbox-migrations', {
      tenantId: plan.tenantId,
      migrationId: plan.planId,
      type: 'migration-plan',
      plan,
      sourceProvider,
      targetProvider,
      strategy,
      workloadIds,
      createdAt: plan.createdAt,
    });

    this.updateProgress(100);

    await this.broadcastEvent('migration-plan-created', {
      planId: plan.planId,
      phaseCount: plan.phases.length,
    });
  }

  /**
   * Execute a migration plan phase by phase
   */
  private async executeMigrationPlan(task: AgentTask): Promise<void> {
    const { planId } = task.payload;
    const plan = this.activePlans.get(planId);

    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    plan.status = 'executing';
    plan.updatedAt = getCurrentTimestamp();

    for (let i = plan.currentPhase; i < plan.phases.length; i++) {
      const phase = plan.phases[i];
      plan.currentPhase = i;

      this.updateProgress(Math.round((i / plan.phases.length) * 100));

      phase.status = 'running';
      phase.startedAt = getCurrentTimestamp();

      try {
        // Dispatch task to the appropriate agent
        const agentTaskId = generateId('task');
        phase.taskId = agentTaskId;

        await this.sendMessage(phase.agentType, 'execute-task', {
          taskId: agentTaskId,
          tenantId: plan.tenantId,
          planId: plan.planId,
          phase: phase.name,
          payload: task.payload,
        });

        // Simulate waiting for agent completion
        phase.status = 'completed';
        phase.completedAt = getCurrentTimestamp();

        await this.broadcastEvent('phase-completed', {
          planId: plan.planId,
          phase: phase.name,
          agentType: phase.agentType,
        });
      } catch (error: any) {
        phase.status = 'failed';
        phase.error = error.message;
        phase.completedAt = getCurrentTimestamp();

        plan.status = 'failed';
        plan.updatedAt = getCurrentTimestamp();

        await this.broadcastEvent('phase-failed', {
          planId: plan.planId,
          phase: phase.name,
          error: error.message,
        });

        throw error;
      }
    }

    plan.status = 'completed';
    plan.updatedAt = getCurrentTimestamp();

    await this.broadcastEvent('migration-plan-completed', {
      planId: plan.planId,
    });

    this.updateProgress(100);
  }

  /**
   * Rollback a failed migration plan (Saga compensating transactions)
   */
  private async rollbackPlan(task: AgentTask): Promise<void> {
    const { planId } = task.payload;
    const plan = this.activePlans.get(planId);

    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    plan.status = 'rolled-back';
    plan.updatedAt = getCurrentTimestamp();

    // Rollback completed phases in reverse order
    const completedPhases = plan.phases.filter(p => p.status === 'completed');

    for (const phase of completedPhases.reverse()) {
      try {
        await this.sendMessage(phase.agentType, 'rollback', {
          planId: plan.planId,
          phase: phase.name,
          taskId: phase.taskId,
        });

        phase.status = 'pending';
      } catch (error: any) {
        console.error(`Rollback failed for phase ${phase.name}:`, error.message);
      }
    }

    await this.broadcastEvent('migration-plan-rolled-back', {
      planId: plan.planId,
    });

    this.updateProgress(100);
  }

  /**
   * Handle incoming A2A messages from other agents
   */
  private async handleAgentMessage(task: AgentTask): Promise<void> {
    const { action, planId, phase, status, result } = task.payload;

    if (action && planId) {
      const plan = this.activePlans.get(planId);
      if (plan) {
        const phaseEntry = plan.phases.find(p => p.name === phase);
        if (phaseEntry) {
          phaseEntry.status = status || 'completed';
          phaseEntry.result = result;
          phaseEntry.completedAt = getCurrentTimestamp();
        }
      }
    }

    this.updateProgress(100);
  }

  private registerMessageHandlers(): void {
    this.messageHandlers.set('assessment-complete', async (msg) => {
      console.log(`Assessment completed for ${msg.payload.tenantId}: ${msg.payload.assessmentCount} workloads`);
    });

    this.messageHandlers.set('iac-generation-complete', async (msg) => {
      console.log(`IaC generation completed: ${msg.payload.resourceCount} resources`);
    });

    this.messageHandlers.set('validation-complete', async (msg) => {
      if (msg.payload.status === 'failed') {
        console.log(`Validation FAILED for migration ${msg.payload.migrationId}`);
      }
    });

    this.messageHandlers.set('optimization-complete', async (msg) => {
      console.log(`Optimization complete: $${msg.payload.savingsMonthly}/mo savings identified`);
    });
  }

  getActivePlans(): MigrationPlan[] {
    return Array.from(this.activePlans.values());
  }

  getPlan(planId: string): MigrationPlan | undefined {
    return this.activePlans.get(planId);
  }
}
