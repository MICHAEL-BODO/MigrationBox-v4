/**
 * MigrationBox V5.0 - Optimization Agent
 *
 * AI agent for cost analysis, right-sizing, and optimization recommendations.
 * Analyzes resource utilization, reserved instance opportunities, and
 * generates savings recommendations across all 3 clouds.
 */

import { AgentTask } from '@migrationbox/types';
import { BaseAgent, AgentType } from './base-agent';

export interface OptimizationRecommendation {
  type: 'right-size' | 'reserved' | 'spot' | 'storage-tier' | 'unused-resource' | 'architecture' | 'licensing' | 'scheduling';
  resource: string;
  currentCost: number;
  projectedCost: number;
  savingsMonthly: number;
  savingsPercent: number;
  effort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  description: string;
  implementation: string;
}

export interface OptimizationReport {
  taskId: string;
  tenantId: string;
  totalCurrentMonthly: number;
  totalOptimizedMonthly: number;
  totalSavingsMonthly: number;
  totalSavingsPercent: number;
  recommendations: OptimizationRecommendation[];
  analysisDate: string;
}

export class OptimizationAgent extends BaseAgent {
  readonly agentType: AgentType = 'optimization';

  protected async executeTask(task: AgentTask): Promise<void> {
    const { tenantId, workloadIds } = task.payload;

    this.updateProgress(5);

    // Load workloads
    const workloads = await this.loadWorkloads(tenantId || task.tenantId, workloadIds);
    this.updateProgress(15);

    const recommendations: OptimizationRecommendation[] = [];

    // Analyzer 1: Right-sizing
    recommendations.push(...this.analyzeRightSizing(workloads));
    this.updateProgress(30);

    // Analyzer 2: Reserved instances
    recommendations.push(...this.analyzeReservedInstances(workloads));
    this.updateProgress(40);

    // Analyzer 3: Spot instances
    recommendations.push(...this.analyzeSpotOpportunities(workloads));
    this.updateProgress(50);

    // Analyzer 4: Storage optimization
    recommendations.push(...this.analyzeStorageOptimization(workloads));
    this.updateProgress(60);

    // Analyzer 5: Unused resources
    recommendations.push(...this.analyzeUnusedResources(workloads));
    this.updateProgress(70);

    // Analyzer 6: Architecture optimization
    recommendations.push(...this.analyzeArchitecture(workloads));
    this.updateProgress(80);

    // Analyzer 7: Licensing
    recommendations.push(...this.analyzeLicensing(workloads));
    this.updateProgress(85);

    // Analyzer 8: Scheduling
    recommendations.push(...this.analyzeScheduling(workloads));
    this.updateProgress(90);

    // Generate report
    const totalCurrent = recommendations.reduce((s, r) => s + r.currentCost, 0);
    const totalOptimized = recommendations.reduce((s, r) => s + r.projectedCost, 0);
    const totalSavings = totalCurrent - totalOptimized;

    const report: OptimizationReport = {
      taskId: task.taskId,
      tenantId: task.tenantId,
      totalCurrentMonthly: totalCurrent,
      totalOptimizedMonthly: totalOptimized,
      totalSavingsMonthly: Math.max(0, totalSavings),
      totalSavingsPercent: totalCurrent > 0 ? Math.max(0, (totalSavings / totalCurrent) * 100) : 0,
      recommendations: recommendations.sort((a, b) => b.savingsMonthly - a.savingsMonthly),
      analysisDate: new Date().toISOString(),
    };

    await this.storeReport(task.tenantId, report);
    this.updateProgress(95);

    await this.sendMessage('orchestration', 'optimization-complete', {
      taskId: task.taskId,
      savingsMonthly: report.totalSavingsMonthly,
      savingsPercent: report.totalSavingsPercent,
      recommendationCount: recommendations.length,
    });

    this.updateProgress(100);
  }

  private async loadWorkloads(tenantId: string, workloadIds?: string[]): Promise<any[]> {
    try {
      const result = await this.db.query?.('migrationbox-workloads', { tenantId });
      const items = result?.items || [];
      if (workloadIds?.length) {
        return items.filter((w: any) => workloadIds.includes(w.workloadId));
      }
      return items;
    } catch {
      return [];
    }
  }

  private analyzeRightSizing(workloads: any[]): OptimizationRecommendation[] {
    const recs: OptimizationRecommendation[] = [];
    for (const w of workloads) {
      if (w.type !== 'compute') continue;
      const util = w.metadata?.cpuUtilization || w.metadata?.utilizationPercent || 50;
      if (util < 30) {
        const currentCost = w.metadata?.monthlyCost || 120;
        const savingsPercent = util < 15 ? 50 : 30;
        recs.push({
          type: 'right-size',
          resource: w.name || w.workloadId,
          currentCost,
          projectedCost: currentCost * (1 - savingsPercent / 100),
          savingsMonthly: currentCost * (savingsPercent / 100),
          savingsPercent,
          effort: 'low',
          risk: 'low',
          description: `Instance ${w.name} is underutilized at ${util}% CPU — downsize to smaller instance`,
          implementation: `Change instance type from ${w.metadata?.instanceType || 'current'} to next smaller size`,
        });
      }
    }
    return recs;
  }

  private analyzeReservedInstances(workloads: any[]): OptimizationRecommendation[] {
    const recs: OptimizationRecommendation[] = [];
    for (const w of workloads) {
      if (!['compute', 'database'].includes(w.type)) continue;
      if (w.metadata?.reservedInstance) continue; // Already reserved

      const currentCost = w.metadata?.monthlyCost || 100;
      if (currentCost < 50) continue; // Not worth reserving small instances

      const reservedCost = currentCost * 0.6; // ~40% savings for 1yr RI
      recs.push({
        type: 'reserved',
        resource: w.name || w.workloadId,
        currentCost,
        projectedCost: reservedCost,
        savingsMonthly: currentCost - reservedCost,
        savingsPercent: 40,
        effort: 'low',
        risk: 'low',
        description: `Convert ${w.name} to 1-year reserved instance for 40% savings`,
        implementation: 'Purchase 1-year reserved instance via cloud provider console',
      });
    }
    return recs;
  }

  private analyzeSpotOpportunities(workloads: any[]): OptimizationRecommendation[] {
    const recs: OptimizationRecommendation[] = [];
    for (const w of workloads) {
      if (w.type !== 'compute') continue;
      if (w.metadata?.stateful) continue; // Spot not suitable for stateful
      if (w.metadata?.criticalPath) continue;

      const currentCost = w.metadata?.monthlyCost || 100;
      const spotCost = currentCost * 0.3;
      recs.push({
        type: 'spot',
        resource: w.name || w.workloadId,
        currentCost,
        projectedCost: spotCost,
        savingsMonthly: currentCost - spotCost,
        savingsPercent: 70,
        effort: 'medium',
        risk: 'medium',
        description: `Use spot/preemptible instances for ${w.name} (non-critical, stateless workload)`,
        implementation: 'Configure Auto Scaling group with mixed on-demand/spot fleet',
      });
    }
    return recs;
  }

  private analyzeStorageOptimization(workloads: any[]): OptimizationRecommendation[] {
    const recs: OptimizationRecommendation[] = [];
    for (const w of workloads) {
      if (w.type !== 'storage') continue;
      const accessPattern = w.metadata?.accessFrequency || 'frequent';
      if (accessPattern === 'infrequent' || accessPattern === 'archive') {
        const currentCost = w.metadata?.monthlyCost || 50;
        const optimizedCost = currentCost * 0.3;
        recs.push({
          type: 'storage-tier',
          resource: w.name || w.workloadId,
          currentCost,
          projectedCost: optimizedCost,
          savingsMonthly: currentCost - optimizedCost,
          savingsPercent: 70,
          effort: 'low',
          risk: 'low',
          description: `Move ${w.name} to infrequent access / archive storage tier`,
          implementation: 'Enable S3 Intelligent-Tiering or lifecycle policy to Glacier',
        });
      }
    }
    return recs;
  }

  private analyzeUnusedResources(workloads: any[]): OptimizationRecommendation[] {
    const recs: OptimizationRecommendation[] = [];
    for (const w of workloads) {
      if (w.status === 'stopped' || w.metadata?.utilizationPercent === 0) {
        const currentCost = w.metadata?.monthlyCost || 50;
        recs.push({
          type: 'unused-resource',
          resource: w.name || w.workloadId,
          currentCost,
          projectedCost: 0,
          savingsMonthly: currentCost,
          savingsPercent: 100,
          effort: 'low',
          risk: 'low',
          description: `Remove unused resource ${w.name} (stopped/0% utilization)`,
          implementation: 'Verify no dependencies, then terminate/delete resource',
        });
      }
    }
    return recs;
  }

  private analyzeArchitecture(workloads: any[]): OptimizationRecommendation[] {
    const recs: OptimizationRecommendation[] = [];
    // Check for serverless conversion opportunities
    for (const w of workloads) {
      if (w.type === 'compute' && (w.metadata?.utilizationPercent || 50) < 20) {
        const currentCost = w.metadata?.monthlyCost || 100;
        recs.push({
          type: 'architecture',
          resource: w.name || w.workloadId,
          currentCost,
          projectedCost: currentCost * 0.15,
          savingsMonthly: currentCost * 0.85,
          savingsPercent: 85,
          effort: 'high',
          risk: 'medium',
          description: `Convert ${w.name} to serverless (Lambda/Cloud Functions) — very low utilization`,
          implementation: 'Refactor to event-driven serverless architecture',
        });
      }
    }
    return recs;
  }

  private analyzeLicensing(workloads: any[]): OptimizationRecommendation[] {
    const recs: OptimizationRecommendation[] = [];
    for (const w of workloads) {
      if (w.metadata?.licenseCost > 500) {
        const licenseCost = w.metadata.licenseCost;
        recs.push({
          type: 'licensing',
          resource: w.name || w.workloadId,
          currentCost: licenseCost,
          projectedCost: 0,
          savingsMonthly: licenseCost,
          savingsPercent: 100,
          effort: 'high',
          risk: 'medium',
          description: `Evaluate open-source alternatives for ${w.name} to eliminate licensing costs`,
          implementation: 'Migrate from commercial to open-source equivalent (e.g., MSSQL → PostgreSQL)',
        });
      }
    }
    return recs;
  }

  private analyzeScheduling(workloads: any[]): OptimizationRecommendation[] {
    const recs: OptimizationRecommendation[] = [];
    for (const w of workloads) {
      if (w.type !== 'compute') continue;
      if (w.metadata?.environment === 'development' || w.metadata?.environment === 'staging') {
        const currentCost = w.metadata?.monthlyCost || 100;
        const scheduledCost = currentCost * 0.4; // ~60% savings running 10h/day weekdays only
        recs.push({
          type: 'scheduling',
          resource: w.name || w.workloadId,
          currentCost,
          projectedCost: scheduledCost,
          savingsMonthly: currentCost - scheduledCost,
          savingsPercent: 60,
          effort: 'low',
          risk: 'low',
          description: `Schedule ${w.name} (${w.metadata?.environment}) to run business hours only`,
          implementation: 'Configure AWS Instance Scheduler or similar for auto start/stop',
        });
      }
    }
    return recs;
  }

  private async storeReport(tenantId: string, report: OptimizationReport): Promise<void> {
    try {
      await this.db.putItem?.('migrationbox-assessments', {
        tenantId,
        assessmentId: report.taskId,
        type: 'optimization',
        report,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Non-fatal
    }
  }
}
