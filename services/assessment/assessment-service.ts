/**
 * MigrationBox V5.0 - Assessment Service (6Rs Engine)
 *
 * Analyzes workloads and recommends migration strategies using the 6Rs framework:
 * Rehost, Replatform, Refactor, Repurchase, Retire, Retain
 *
 * Includes scoring for cost, risk, complexity, and timeline.
 */

import { Assessment, Workload, MigrationStrategy, CloudProvider } from '@migrationbox/types';
import { generateAssessmentId } from '@migrationbox/utils';

const STAGE = process.env.STAGE || 'dev';
const ASSESSMENTS_TABLE = `migrationbox-assessments-${STAGE}`;

export interface AssessmentInput {
  tenantId: string;
  workloads: Workload[];
  targetProvider: CloudProvider;
  preferences?: {
    costWeight?: number;    // 0-1, default 0.3
    riskWeight?: number;    // 0-1, default 0.3
    speedWeight?: number;   // 0-1, default 0.2
    modernizeWeight?: number; // 0-1, default 0.2
  };
}

export class AssessmentService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Assess a batch of workloads with the 6Rs engine
   */
  async assessWorkloads(input: AssessmentInput): Promise<Assessment[]> {
    const { tenantId, workloads, targetProvider, preferences } = input;
    const assessments: Assessment[] = [];

    for (const workload of workloads) {
      const assessment = await this.assessSingleWorkload(workload, targetProvider, preferences);
      assessment.tenantId = tenantId;

      // Persist
      await this.db.putItem(ASSESSMENTS_TABLE, assessment);

      assessments.push(assessment);
    }

    return assessments;
  }

  /**
   * Run 6Rs decision tree on a single workload
   */
  private async assessSingleWorkload(
    workload: Workload,
    targetProvider: CloudProvider,
    preferences?: AssessmentInput['preferences']
  ): Promise<Assessment> {
    const assessmentId = generateAssessmentId();
    const now = new Date().toISOString();

    // Run all analyzers
    const rehostScore = this.analyzeRehost(workload, targetProvider);
    const replatformScore = this.analyzeReplatform(workload, targetProvider);
    const refactorScore = this.analyzeRefactor(workload, targetProvider);
    const repurchaseScore = this.analyzeRepurchase(workload);
    const retireScore = this.analyzeRetire(workload);
    const retainScore = this.analyzeRetain(workload);

    // Apply preference weights
    const weights = {
      cost: preferences?.costWeight ?? 0.3,
      risk: preferences?.riskWeight ?? 0.3,
      speed: preferences?.speedWeight ?? 0.2,
      modernize: preferences?.modernizeWeight ?? 0.2,
    };

    const scores: Record<MigrationStrategy, number> = {
      rehost: this.applyWeights(rehostScore, weights),
      replatform: this.applyWeights(replatformScore, weights),
      refactor: this.applyWeights(refactorScore, weights),
      repurchase: this.applyWeights(repurchaseScore, weights),
      retire: this.applyWeights(retireScore, weights),
      retain: this.applyWeights(retainScore, weights),
    };

    // Select strategy with highest score
    const strategy = (Object.entries(scores) as [MigrationStrategy, number][])
      .sort((a, b) => b[1] - a[1])[0][0];

    const selectedScore = this.getStrategyDetails(strategy, workload, targetProvider); // This actually calls analyzeXXX again, inefficient but safe

    return {
      assessmentId,
      tenantId: '', // Set by caller
      workloadId: workload.workloadId,
      strategy,
      confidence: selectedScore.confidence,
      costProjection: selectedScore.costProjection || { monthly: 0, yearly: 0, threeYear: 0, currency: 'USD' },
      riskScore: selectedScore.risk,
      complexityScore: selectedScore.complexity,
      timelineWeeks: selectedScore.weeks,
      timelineConfidence: { min: selectedScore.weeks * 0.8, max: selectedScore.weeks * 1.5, p50: selectedScore.weeks, p95: selectedScore.weeks * 1.2 },
      recommendations: selectedScore.recommendations,
      blockers: selectedScore.blockers,
      createdAt: now,
    } as Assessment;
  }

  // ---- 6Rs Analyzers ----

  private analyzeRehost(workload: Workload, targetProvider: CloudProvider): StrategyScore {
    const meta = workload.metadata as any;
    let score = 50;
    let risk = 20;
    let complexity = 15;
    let weeks = 2;
    const recommendations: string[] = [];
    const blockers: string[] = [];

    // Rehost is great for simple compute/storage
    if (workload.type === 'compute') {
      score += 30;
      recommendations.push(`Lift-and-shift ${workload.name} to equivalent ${targetProvider} compute`);
    }
    if (workload.type === 'storage') {
      score += 25;
      recommendations.push('Direct data migration with minimal transformation');
    }
    if (workload.type === 'database' && meta?.engine) {
      score += 15;
      if (meta.multiAZ) { risk += 10; weeks += 1; }
      recommendations.push(`Migrate to managed ${meta.engine} on ${targetProvider}`);
    }

    // Penalize if workload has many dependencies
    const deps = workload.dependencies?.length || 0;
    if (deps > 5) { risk += 15; complexity += 10; }
    if (deps > 10) { blockers.push('High dependency count — validate dependency migration order'); }

    // Serverless/container are harder to rehost
    if (workload.type === 'serverless') { score -= 20; complexity += 15; }
    if (workload.type === 'container') { score -= 10; complexity += 10; }

    return { score: Math.max(0, Math.min(100, score)), risk, complexity, weeks, confidence: 0.85, recommendations, blockers };
  }

  private analyzeReplatform(workload: Workload, targetProvider: CloudProvider): StrategyScore {
    const meta = workload.metadata as any;
    let score = 40;
    let risk = 30;
    let complexity = 30;
    let weeks = 4;
    const recommendations: string[] = [];
    const blockers: string[] = [];

    // Good for databases needing managed service upgrade
    if (workload.type === 'database') {
      score += 25;
      recommendations.push(`Migrate to ${targetProvider} managed database with performance tuning`);
      if (meta?.engine === 'postgresql' || meta?.engine === 'mysql') {
        score += 10; // Well-supported migration path
      }
    }

    // Containers can be replatformed to managed K8s
    if (workload.type === 'container') {
      score += 20;
      recommendations.push(`Move to ${targetProvider} managed Kubernetes (EKS/AKS/GKE)`);
    }

    // Compute with OS-specific requirements
    if (workload.type === 'compute' && meta?.osType === 'Windows') {
      score += 10;
      recommendations.push('Replatform to managed Windows service');
    }

    return { score: Math.max(0, Math.min(100, score)), risk, complexity, weeks, confidence: 0.75, recommendations, blockers };
  }

  private analyzeRefactor(workload: Workload, _targetProvider: CloudProvider): StrategyScore {
    let score = 30;
    let risk = 45;
    let complexity = 60;
    let weeks = 10;
    const recommendations: string[] = [];
    const blockers: string[] = [];

    // Best for monoliths or legacy apps
    if (workload.type === 'compute') {
      score += 15;
      recommendations.push('Decompose into microservices on serverless/containers');
    }

    // Applications that could benefit from cloud-native
    if (workload.type === 'application') {
      score += 25;
      recommendations.push('Rearchitect using cloud-native services');
    }

    // High dependency count suggests intertwined architecture
    const deps = workload.dependencies?.length || 0;
    if (deps > 3) {
      score += 10;
      recommendations.push('Untangle dependencies during refactoring');
      weeks += Math.ceil(deps / 3);
    }

    return { score: Math.max(0, Math.min(100, score)), risk, complexity, weeks, confidence: 0.6, recommendations, blockers };
  }

  private analyzeRepurchase(workload: Workload): StrategyScore {
    let score = 20;
    const recommendations: string[] = [];
    const blockers: string[] = [];

    // Self-hosted software that has SaaS equivalents
    if (workload.type === 'application') {
      score += 30;
      recommendations.push('Evaluate SaaS replacement (e.g., RDS → Aurora, self-hosted CI → GitHub Actions)');
    }

    // Email/CRM/ERP systems
    const name = workload.name.toLowerCase();
    if (name.includes('mail') || name.includes('crm') || name.includes('erp')) {
      score += 25;
      recommendations.push('Strong SaaS candidate — evaluate commercial alternatives');
    }

    return { score: Math.max(0, Math.min(100, score)), risk: 25, complexity: 20, weeks: 6, confidence: 0.7, recommendations, blockers };
  }

  private analyzeRetire(workload: Workload): StrategyScore {
    let score = 10;
    const recommendations: string[] = [];
    const blockers: string[] = [];

    // Inactive/stopped resources
    const status = workload.status?.toLowerCase();
    if (status === 'stopped' || status === 'inactive' || status === 'deallocated' || status === 'terminated') {
      score += 50;
      recommendations.push('Resource appears inactive — validate with stakeholders and retire');
    }

    // Resources with no dependencies (likely unused)
    if (!workload.dependencies || workload.dependencies.length === 0) {
      score += 15;
    }

    // Monitoring/logging that can be replaced
    if (workload.name.toLowerCase().includes('old') || workload.name.toLowerCase().includes('deprecated')) {
      score += 30;
      recommendations.push('Resource name suggests deprecation — confirm and retire');
    }

    return { score: Math.max(0, Math.min(100, score)), risk: 5, complexity: 5, weeks: 1, confidence: 0.9, recommendations, blockers };
  }

  private analyzeRetain(workload: Workload): StrategyScore {
    let score = 15;
    const recommendations: string[] = [];
    const blockers: string[] = [];

    // Resources with compliance/regulatory constraints
    const meta = workload.metadata as any;
    if (meta?.compliance || meta?.dataResidency) {
      score += 40;
      recommendations.push('Data residency or compliance requirements — retain in current location');
      blockers.push('Regulatory constraints prevent migration');
    }

    // Workloads nearing end-of-life
    if (meta?.endOfLife || meta?.decommissionDate) {
      score += 35;
      recommendations.push('Nearing end-of-life — retain and decommission on schedule');
    }

    // Complex legacy with too many dependencies
    const deps = workload.dependencies?.length || 0;
    if (deps > 15) {
      score += 20;
      recommendations.push('Extreme dependency complexity — retain until dependencies are resolved');
    }

    return { score: Math.max(0, Math.min(100, score)), risk: 10, complexity: 5, weeks: 0, confidence: 0.8, recommendations, blockers };
  }

  // ---- Scoring Engine ----

  private applyWeights(score: StrategyScore, weights: { cost: number; risk: number; speed: number; modernize: number }): number {
    // Higher score = better. Lower risk/complexity = better. Lower weeks = faster.
    const costFactor = (100 - score.complexity) * weights.cost;
    const riskFactor = (100 - score.risk) * weights.risk;
    const speedFactor = Math.max(0, 100 - score.weeks * 5) * weights.speed;
    const modernizeFactor = score.score * weights.modernize;

    return costFactor + riskFactor + speedFactor + modernizeFactor;
  }

  private getStrategyDetails(strategy: MigrationStrategy, workload: Workload, targetProvider: CloudProvider): StrategyScore {
    switch (strategy) {
      case 'rehost': return this.analyzeRehost(workload, targetProvider);
      case 'replatform': return this.analyzeReplatform(workload, targetProvider);
      case 'refactor': return this.analyzeRefactor(workload, targetProvider);
      case 'repurchase': return this.analyzeRepurchase(workload);
      case 'retire': return this.analyzeRetire(workload);
      case 'retain': return this.analyzeRetain(workload);
      default: return this.analyzeRehost(workload, targetProvider);
    }
  }

  /**
   * Get assessment by ID
   */
  async getAssessment(tenantId: string, assessmentId: string): Promise<Assessment | null> {
    const result = await this.db.getItem(ASSESSMENTS_TABLE, { tenantId, assessmentId });
    return result || null;
  }

  /**
   * List assessments for a workload
   */
  async listAssessments(tenantId: string, workloadId?: string): Promise<Assessment[]> {
    if (workloadId) {
      const result = await this.db.queryItems(ASSESSMENTS_TABLE, {
        indexName: 'workloadId-index',
        keyCondition: 'workloadId = :workloadId',
        expressionValues: { ':workloadId': workloadId },
      });
      return result.items || result;
    }

    const result = await this.db.queryItems(ASSESSMENTS_TABLE, {
      keyCondition: 'tenantId = :tenantId',
      expressionValues: { ':tenantId': tenantId },
    });
    return result.items || result;
  }
}

interface StrategyScore {
  score: number;
  risk: number;
  complexity: number;
  weeks: number;
  confidence: number;
  recommendations: string[];
  blockers: string[];
  costProjection?: {
    monthly: number;
    yearly: number;
    threeYear: number;
    currency: string;
  };
}
