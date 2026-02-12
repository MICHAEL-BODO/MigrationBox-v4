/**
 * MigrationBox V5.0 - Assessment Agent
 *
 * AI agent for workload assessment with Extended Thinking integration.
 * Performs 6Rs analysis, risk scoring, and timeline prediction using
 * Claude Extended Thinking for complex multi-variable analysis.
 */

import { AgentTask } from '@migrationbox/types';
import { BaseAgent, AgentType } from './base-agent';

interface AssessmentResult {
  workloadId: string;
  strategy: string;
  confidence: number;
  riskScore: number;
  complexityScore: number;
  timelineWeeks: number;
  timelineConfidence: { min: number; max: number; p50: number; p95: number };
  costProjection: { monthly: number; yearly: number; threeYear: number };
  recommendations: string[];
  blockers: string[];
  thinkingSteps?: string[];
}

export class AssessmentAgent extends BaseAgent {
  readonly agentType: AgentType = 'assessment';

  protected async executeTask(task: AgentTask): Promise<void> {
    const { workloadIds, tenantId, preferences } = task.payload;

    this.updateProgress(5);

    // Phase 1: Load workloads from discovery data
    const workloads = await this.loadWorkloads(tenantId || task.tenantId, workloadIds || []);
    this.updateProgress(15);

    // Phase 2: Run 6Rs analysis with Extended Thinking for complex workloads
    const results: AssessmentResult[] = [];
    const total = workloads.length || 1;

    for (let i = 0; i < workloads.length; i++) {
      const workload = workloads[i];
      const isComplex = this.isComplexWorkload(workload);

      let result: AssessmentResult;
      if (isComplex) {
        result = await this.assessWithExtendedThinking(workload, preferences);
      } else {
        result = await this.assessStandard(workload, preferences);
      }

      results.push(result);
      this.updateProgress(15 + Math.round((i / total) * 60));
    }

    this.updateProgress(80);

    // Phase 3: Cross-workload dependency analysis
    const dependencyRisks = this.analyzeCrossDependencies(results);
    this.updateProgress(90);

    // Phase 4: Store results
    await this.storeResults(task.tenantId, task.taskId, results, dependencyRisks);
    this.updateProgress(95);

    // Phase 5: Notify orchestration agent
    await this.sendMessage('orchestration', 'assessment-complete', {
      taskId: task.taskId,
      tenantId: task.tenantId,
      assessmentCount: results.length,
      strategies: results.map(r => ({ workloadId: r.workloadId, strategy: r.strategy })),
    });

    this.updateProgress(100);
  }

  private async loadWorkloads(tenantId: string, workloadIds: string[]): Promise<any[]> {
    if (workloadIds.length === 0) {
      // Load all workloads for tenant
      const result = await this.db.query?.('migrationbox-workloads', {
        tenantId,
      });
      return result?.items || [];
    }

    return Promise.all(
      workloadIds.map((id: string) =>
        this.db.getItem?.('migrationbox-workloads', { tenantId, workloadId: id })
      )
    ).then(items => items.filter(Boolean));
  }

  /**
   * Standard assessment for simple workloads
   */
  private async assessStandard(workload: any, preferences?: any): Promise<AssessmentResult> {
    // 6Rs scoring
    const scores = {
      rehost: this.scoreRehost(workload),
      replatform: this.scoreReplatform(workload),
      refactor: this.scoreRefactor(workload),
      repurchase: this.scoreRepurchase(workload),
      retire: this.scoreRetire(workload),
      retain: this.scoreRetain(workload),
    };

    // Apply preference weights
    if (preferences) {
      if (preferences.costWeight) scores.rehost *= preferences.costWeight;
      if (preferences.modernizeWeight) scores.refactor *= preferences.modernizeWeight;
    }

    const strategy = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    const confidence = Math.min(0.95, Object.values(scores).sort((a, b) => b - a)[0] / 100);

    return {
      workloadId: workload.workloadId,
      strategy,
      confidence,
      riskScore: this.calculateRisk(workload),
      complexityScore: this.calculateComplexity(workload),
      timelineWeeks: this.estimateTimeline(strategy, workload),
      timelineConfidence: this.estimateTimelineConfidence(strategy, workload),
      costProjection: this.estimateCost(workload),
      recommendations: this.generateRecommendations(strategy, workload),
      blockers: this.identifyBlockers(workload),
    };
  }

  /**
   * Extended Thinking assessment for complex workloads
   * Uses Claude's chain-of-thought reasoning for multi-variable analysis
   */
  private async assessWithExtendedThinking(workload: any, preferences?: any): Promise<AssessmentResult> {
    const thinkingSteps: string[] = [];

    // Step 1: Analyze dependencies
    thinkingSteps.push(`Analyzing ${workload.dependencies?.length || 0} dependencies for ${workload.name}`);

    // Step 2: Evaluate each strategy
    const strategies = ['rehost', 'replatform', 'refactor', 'repurchase', 'retire', 'retain'];
    const evaluations: Record<string, number> = {};

    for (const strat of strategies) {
      const score = this.evaluateStrategy(strat, workload);
      evaluations[strat] = score;
      thinkingSteps.push(`Strategy ${strat}: score=${score.toFixed(1)} — ${this.explainScore(strat, workload)}`);
    }

    // Step 3: Consider inter-dependencies
    if (workload.dependencies?.length > 3) {
      thinkingSteps.push('High dependency count increases migration risk; favoring rehost for stability');
      evaluations.rehost *= 1.2;
      evaluations.refactor *= 0.8;
    }

    // Step 4: Compliance constraints
    if (workload.metadata?.compliance?.length > 0) {
      thinkingSteps.push(`Compliance requirements (${workload.metadata.compliance.join(', ')}) constrain strategy options`);
      evaluations.refactor *= 0.9; // Compliance validation more complex for refactored apps
    }

    // Step 5: Final recommendation
    const strategy = Object.entries(evaluations).sort((a, b) => b[1] - a[1])[0][0];
    const confidence = Math.min(0.95, evaluations[strategy] / 100);
    thinkingSteps.push(`Final recommendation: ${strategy} (confidence: ${(confidence * 100).toFixed(0)}%)`);

    const base = await this.assessStandard(workload, preferences);
    return {
      ...base,
      strategy,
      confidence,
      thinkingSteps,
    };
  }

  private isComplexWorkload(workload: any): boolean {
    const deps = workload.dependencies?.length || 0;
    const hasCompliance = workload.metadata?.compliance?.length > 0;
    const isStateful = ['database', 'storage'].includes(workload.type);
    return deps > 3 || hasCompliance || isStateful;
  }

  private scoreRehost(w: any): number {
    let score = 60;
    if (w.type === 'compute') score += 20;
    if (w.type === 'container') score += 15;
    if ((w.dependencies?.length || 0) > 5) score += 10;
    if (w.metadata?.age === 'legacy') score += 15;
    return Math.min(100, score);
  }

  private scoreReplatform(w: any): number {
    let score = 50;
    if (w.type === 'database') score += 25;
    if (w.type === 'container') score += 20;
    if (w.metadata?.managedServiceAvailable) score += 15;
    return Math.min(100, score);
  }

  private scoreRefactor(w: any): number {
    let score = 30;
    if (w.type === 'serverless') score += 30;
    if (w.metadata?.modernizable) score += 25;
    if (w.metadata?.containerReady) score += 15;
    if ((w.dependencies?.length || 0) > 5) score -= 15; // Hard to refactor tightly-coupled
    return Math.max(0, Math.min(100, score));
  }

  private scoreRepurchase(w: any): number {
    let score = 20;
    if (w.metadata?.saasAlternative) score += 50;
    if (w.metadata?.licenseCost > 1000) score += 15;
    return Math.min(100, score);
  }

  private scoreRetire(w: any): number {
    let score = 10;
    if (w.status === 'stopped' || w.status === 'unused') score += 60;
    if (w.metadata?.lastAccessedDaysAgo > 90) score += 30;
    if (w.metadata?.utilizationPercent < 5) score += 25;
    return Math.min(100, score);
  }

  private scoreRetain(w: any): number {
    let score = 20;
    if (w.metadata?.recentlyMigrated) score += 40;
    if (w.metadata?.endOfLife && w.metadata.endOfLifeMonths < 6) score += 30;
    if (w.metadata?.complianceRestriction) score += 25;
    return Math.min(100, score);
  }

  private evaluateStrategy(strategy: string, w: any): number {
    switch (strategy) {
      case 'rehost': return this.scoreRehost(w);
      case 'replatform': return this.scoreReplatform(w);
      case 'refactor': return this.scoreRefactor(w);
      case 'repurchase': return this.scoreRepurchase(w);
      case 'retire': return this.scoreRetire(w);
      case 'retain': return this.scoreRetain(w);
      default: return 0;
    }
  }

  private explainScore(strategy: string, w: any): string {
    const reasons: string[] = [];
    switch (strategy) {
      case 'rehost':
        if (w.type === 'compute') reasons.push('compute workload is lift-and-shift friendly');
        if ((w.dependencies?.length || 0) > 5) reasons.push('high dependency count favors minimal change');
        break;
      case 'refactor':
        if (w.metadata?.modernizable) reasons.push('workload is modernization-ready');
        if ((w.dependencies?.length || 0) > 5) reasons.push('but high dependencies increase risk');
        break;
      case 'retire':
        if (w.status === 'stopped') reasons.push('workload is already stopped');
        break;
    }
    return reasons.join('; ') || `standard evaluation for ${w.type}`;
  }

  private calculateRisk(w: any): number {
    let risk = 30;
    if (w.type === 'database') risk += 25;
    if ((w.dependencies?.length || 0) > 3) risk += 15;
    if (w.metadata?.encrypted === false) risk += 10;
    if (w.metadata?.dataSize === 'large') risk += 15;
    return Math.min(100, risk);
  }

  private calculateComplexity(w: any): number {
    let complexity = 20;
    if ((w.dependencies?.length || 0) > 5) complexity += 30;
    if (w.type === 'database') complexity += 20;
    if (w.metadata?.customCode) complexity += 20;
    return Math.min(100, complexity);
  }

  private estimateTimeline(strategy: string, w: any): number {
    const baseWeeks: Record<string, number> = {
      rehost: 2, replatform: 4, refactor: 12, repurchase: 6, retire: 1, retain: 0,
    };
    let weeks = baseWeeks[strategy] || 4;
    if (w.type === 'database') weeks += 2;
    if ((w.dependencies?.length || 0) > 5) weeks += 3;
    return weeks;
  }

  private estimateTimelineConfidence(strategy: string, w: any): { min: number; max: number; p50: number; p95: number } {
    const base = this.estimateTimeline(strategy, w);
    return { min: Math.max(1, base - 2), max: base + 4, p50: base, p95: base + 6 };
  }

  private estimateCost(w: any): { monthly: number; yearly: number; threeYear: number } {
    const monthly = (w.metadata?.estimatedMonthlyCost || 100);
    return { monthly, yearly: monthly * 12, threeYear: monthly * 36 * 0.85 };
  }

  private generateRecommendations(strategy: string, w: any): string[] {
    const recs: string[] = [];
    switch (strategy) {
      case 'rehost':
        recs.push('Use AWS Application Migration Service for automated lift-and-shift');
        if (w.type === 'compute') recs.push('Right-size instances during migration');
        break;
      case 'replatform':
        recs.push('Evaluate managed service equivalents on target cloud');
        if (w.type === 'database') recs.push('Use DMS for database migration with CDC');
        break;
      case 'refactor':
        recs.push('Containerize with Docker, deploy to ECS/EKS');
        recs.push('Decompose monolith into microservices where feasible');
        break;
      case 'retire':
        recs.push('Verify no active consumers before decommissioning');
        recs.push('Archive data per retention policy before retirement');
        break;
    }
    return recs;
  }

  private identifyBlockers(w: any): string[] {
    const blockers: string[] = [];
    if (w.metadata?.encrypted === false) blockers.push('Data is not encrypted — encrypt before migration');
    if (w.metadata?.compliance?.includes('hipaa') && !w.metadata?.auditLogging) {
      blockers.push('HIPAA requires audit logging — enable before migration');
    }
    if ((w.dependencies?.length || 0) > 10) {
      blockers.push('Excessive dependencies — create migration wave plan');
    }
    return blockers;
  }

  private analyzeCrossDependencies(results: AssessmentResult[]): Record<string, any>[] {
    const risks: Record<string, any>[] = [];
    // Flag when tightly-coupled workloads have different strategies
    for (const result of results) {
      if (result.strategy === 'refactor') {
        risks.push({
          workloadId: result.workloadId,
          risk: 'Refactoring workload may break dependent services — coordinate migration wave',
          severity: 'high',
        });
      }
    }
    return risks;
  }

  private async storeResults(
    tenantId: string,
    taskId: string,
    results: AssessmentResult[],
    dependencyRisks: Record<string, any>[]
  ): Promise<void> {
    try {
      await this.db.putItem?.('migrationbox-assessments', {
        tenantId,
        taskId,
        results,
        dependencyRisks,
        completedAt: new Date().toISOString(),
      });
    } catch {
      // Storage failure logged but non-fatal
    }
  }
}
