/**
 * MigrationBox V5.0 - AI Classifier & Strategy Engine (Layer 7)
 * 
 * Claude AI-powered intelligence for:
 *   - Workload classification (identify app stack & purpose)
 *   - Migration strategy recommendation (6 R's)
 *   - Risk assessment
 *   - Wave planning (optimal migration order)
 *   - Cost estimation
 *   - Anomaly detection
 */

import { BaseScanner, ScanContext } from '../../engine/scanner-registry';
import {
  AIClassification, MigrationStrategy, MigrationWave,
  HostInventory, ApplicationDiscovery, DependencyEdge,
  PerformanceBaseline, ScannerConfig,
} from '../types/onprem-types';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export interface AIClassifierConfig extends ScannerConfig {
  options?: {
    modelId?: string;              // Default: 'anthropic.claude-sonnet-4-20250514'
    region?: string;               // AWS region for Bedrock
    maxTokens?: number;            // Default: 4096
    generateWavePlan?: boolean;    // Generate migration wave plan
    estimateCosts?: boolean;       // Generate cost estimates
  };
}

interface AIClassificationData {
  classifications: AIClassification[];
  wavePlan?: MigrationWave[];
  summary: {
    totalWorkloads: number;
    strategyBreakdown: Record<MigrationStrategy, number>;
    overallRisk: 'low' | 'medium' | 'high';
    estimatedDuration: string;
    estimatedSavings: number;
  };
}

export class AIClassifier extends BaseScanner<AIClassifierConfig, AIClassificationData> {
  readonly id = 'ai-classifier';
  readonly name = 'AI Classifier & Strategy Engine (Layer 7)';
  readonly version = '2.0.0';
  readonly layer = 7;
  readonly dependencies = ['ssh-collector', 'app-fingerprinter', 'dependency-reconstructor'];

  private bedrockClient: BedrockRuntimeClient | null = null;

  async validate(config: AIClassifierConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    // Bedrock credentials come from IAM role or env vars
    if (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_PROFILE) {
      errors.push('AWS credentials required for Bedrock (set AWS_ACCESS_KEY_ID or AWS_PROFILE)');
    }
    return { valid: errors.length === 0, errors };
  }

  protected async execute(config: AIClassifierConfig, context: ScanContext): Promise<AIClassificationData> {
    const opts = config.options || {};
    const modelId = opts.modelId || 'anthropic.claude-sonnet-4-20250514';
    const region = opts.region || process.env.AWS_REGION || 'us-east-1';

    this.bedrockClient = new BedrockRuntimeClient({ region });

    // Gather data from all previous layers
    const inventoryHosts: HostInventory[] = [
      ...(context.previousResults.get('ssh-collector')?.data?.hosts || []),
      ...(context.previousResults.get('winrm-collector')?.data?.hosts || []),
    ];
    const apps: ApplicationDiscovery =
      context.previousResults.get('app-fingerprinter')?.data || {};
    const deps: DependencyEdge[] =
      context.previousResults.get('dependency-reconstructor')?.data?.edges || [];

    const classifications: AIClassification[] = [];

    // Classify each host/workload
    for (const host of inventoryHosts) {
      if (context.signal.aborted) break;

      context.log.info(`Classifying workload: ${host.hostname}`);
      context.events.emit('scanner:progress', {
        scannerId: this.id,
        current: classifications.length + 1,
        total: inventoryHosts.length,
      });

      try {
        const classification = await this.classifyWorkload(
          host, apps, deps, modelId, opts.estimateCosts !== false,
        );
        classifications.push(classification);
        this.itemsDiscovered++;
      } catch (error) {
        this.addError(host.ip, `Classification failed: ${error}`);
      }
    }

    // Generate wave plan if requested
    let wavePlan: MigrationWave[] | undefined;
    if (opts.generateWavePlan !== false && classifications.length > 0) {
      context.log.info('Generating migration wave plan');
      wavePlan = await this.generateWavePlan(classifications, deps, modelId);
    }

    // Build summary
    const strategyBreakdown: Record<MigrationStrategy, number> = {
      rehost: 0, replatform: 0, refactor: 0, retire: 0, retain: 0, repurchase: 0,
    };
    for (const c of classifications) {
      strategyBreakdown[c.recommendedStrategy]++;
    }

    const totalSavings = classifications.reduce(
      (sum, c) => sum + (c.costEstimate?.savingsPercent || 0), 0,
    );

    return {
      classifications,
      wavePlan,
      summary: {
        totalWorkloads: classifications.length,
        strategyBreakdown,
        overallRisk: this.assessOverallRisk(classifications),
        estimatedDuration: wavePlan
          ? `${wavePlan.length} waves (~${wavePlan.length * 2} months)`
          : 'TBD',
        estimatedSavings: classifications.length > 0
          ? Math.round(totalSavings / classifications.length)
          : 0,
      },
    };
  }

  // ──────────────────────────────────────────
  // Single workload classification
  // ──────────────────────────────────────────

  private async classifyWorkload(
    host: HostInventory,
    apps: ApplicationDiscovery,
    deps: DependencyEdge[],
    modelId: string,
    estimateCosts: boolean,
  ): Promise<AIClassification> {
    // Gather host's apps
    const hostApps = {
      databases: (apps.databases || []).filter(d => d.host === host.ip),
      webServers: (apps.webServers || []).filter(w => w.host === host.ip),
      middleware: (apps.middleware || []).filter(m => m.host === host.ip),
    };

    // Gather host's dependencies
    const hostDeps = deps.filter(d => d.source === host.ip || d.target === host.ip);

    const prompt = this.buildClassificationPrompt(host, hostApps, hostDeps, estimateCosts);

    const response = await this.invokeModel(modelId, prompt);
    return this.parseClassificationResponse(response, host.ip);
  }

  private buildClassificationPrompt(
    host: HostInventory,
    apps: any,
    deps: DependencyEdge[],
    estimateCosts: boolean,
  ): string {
    const lines = [
      'You are a cloud migration expert analyzing an on-premises workload.',
      'Based on the following discovery data, classify this workload and recommend a migration strategy.',
      '',
      '## Host Information',
      `- Hostname: ${host.hostname}`,
      `- IP: ${host.ip}`,
      `- OS: ${host.os.distribution} ${host.os.version} (${host.os.kernel})`,
      `- CPU: ${host.hardware.cpuCores} cores (${host.hardware.cpuModel})`,
      `- Memory: ${host.hardware.memoryGB} GB`,
      `- Disks: ${host.hardware.disks.map(d => `${d.device} ${d.sizeGB}GB ${d.type}`).join(', ')}`,
      '',
      '## Installed Packages (top 30)',
      ...host.software.packages.slice(0, 30).map(p => `- ${p.name} ${p.version}`),
      '',
      '## Running Services',
      ...host.software.services
        .filter(s => s.status === 'running')
        .slice(0, 20)
        .map(s => `- ${s.name} (ports: ${s.ports?.join(',') || 'none'})`),
      '',
      '## Detected Applications',
      `- Databases: ${apps.databases.map((d: any) => `${d.engine} ${d.version}`).join(', ') || 'none'}`,
      `- Web servers: ${apps.webServers.map((w: any) => `${w.engine} ${w.version}`).join(', ') || 'none'}`,
      `- Middleware: ${apps.middleware.map((m: any) => `${m.engine} ${m.version}`).join(', ') || 'none'}`,
      '',
      '## Dependencies',
      `- Outbound: ${deps.filter(d => d.source === host.ip).length} connections`,
      `- Inbound: ${deps.filter(d => d.target === host.ip).length} connections`,
      ...deps.slice(0, 15).map(d => `  ${d.source}→${d.target}:${d.port} (${d.protocol}, confidence=${d.confidence})`),
      '',
      '## Task',
      'Respond in valid JSON with this structure:',
      '{',
      '  "applicationStack": "string (e.g., LAMP, .NET, Java EE, Node.js)",',
      '  "description": "string (what this workload does)",',
      '  "recommendedStrategy": "rehost|replatform|refactor|retire|retain|repurchase",',
      '  "strategyConfidence": number (0-1),',
      '  "reasoning": ["reason1", "reason2"],',
      '  "estimatedEffort": { "hours": number, "complexity": "low|medium|high|very-high" },',
      '  "risks": [{ "category": "string", "description": "string", "severity": "critical|high|medium|low", "mitigation": "string" }]',
      estimateCosts ? '  ,"costEstimate": { "onPremAnnual": number, "cloudAnnual": number, "cloudOptimized": number, "savingsPercent": number }' : '',
      '}',
    ];

    return lines.join('\n');
  }

  // ──────────────────────────────────────────
  // Wave plan generation
  // ──────────────────────────────────────────

  private async generateWavePlan(
    classifications: AIClassification[],
    deps: DependencyEdge[],
    modelId: string,
  ): Promise<MigrationWave[]> {
    const prompt = [
      'You are a cloud migration expert creating a wave plan.',
      'Given the following classified workloads and their dependencies, create an optimal migration wave plan.',
      '',
      '## Workloads',
      ...classifications.map(c =>
        `- ${c.workloadId}: ${c.applicationStack} (${c.recommendedStrategy}, effort=${c.estimatedEffort.hours}h, complexity=${c.estimatedEffort.complexity})`
      ),
      '',
      '## Dependencies (source → target)',
      ...deps.slice(0, 50).map(d => `- ${d.source} → ${d.target}:${d.port} (conf=${d.confidence})`),
      '',
      '## Rules',
      '1. Dependencies must be migrated before dependents (or in the same wave)',
      '2. Start with low-risk workloads (quick wins)',
      '3. Group related workloads in the same wave',
      '4. Each wave should complete in ~2-4 weeks',
      '5. Limit to 3-5 workloads per wave',
      '',
      'Respond in valid JSON array:',
      '[{ "waveNumber": 1, "name": "string", "description": "string",',
      '   "workloadIds": ["id1","id2"], "estimatedDuration": "2 weeks",',
      '   "risk": "low|medium|high", "prerequisites": ["string"] }]',
    ].join('\n');

    try {
      const response = await this.invokeModel(modelId, prompt);
      return JSON.parse(response);
    } catch (error) {
      // Fallback: simple sequential wave plan
      return this.fallbackWavePlan(classifications);
    }
  }

  private fallbackWavePlan(classifications: AIClassification[]): MigrationWave[] {
    const sorted = [...classifications].sort((a, b) => {
      const riskOrder = { low: 0, medium: 1, high: 2, 'very-high': 3 };
      return (riskOrder[a.estimatedEffort.complexity] || 0) - (riskOrder[b.estimatedEffort.complexity] || 0);
    });

    const waves: MigrationWave[] = [];
    for (let i = 0; i < sorted.length; i += 5) {
      const batch = sorted.slice(i, i + 5);
      waves.push({
        waveNumber: waves.length + 1,
        name: `Wave ${waves.length + 1}`,
        description: `Migration of ${batch.length} workloads`,
        workloadIds: batch.map(c => c.workloadId),
        estimatedDuration: '2-4 weeks',
        risk: batch.some(c => c.estimatedEffort.complexity === 'very-high') ? 'high'
            : batch.some(c => c.estimatedEffort.complexity === 'high') ? 'medium'
            : 'low',
        prerequisites: waves.length > 0
          ? [`Wave ${waves.length} completion`]
          : [],
      });
    }
    return waves;
  }

  // ──────────────────────────────────────────
  // Bedrock invocation
  // ──────────────────────────────────────────

  private async invokeModel(modelId: string, prompt: string): Promise<string> {
    if (!this.bedrockClient) throw new Error('Bedrock client not initialized');

    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const command = new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: new TextEncoder().encode(body),
    });

    const response = await this.bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.content?.[0]?.text || '{}';
  }

  private parseClassificationResponse(raw: string, workloadId: string): AIClassification {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/);
      const json = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : raw;
      const parsed = JSON.parse(json);

      return {
        workloadId,
        applicationStack: parsed.applicationStack || 'Unknown',
        description: parsed.description || '',
        recommendedStrategy: parsed.recommendedStrategy || 'rehost',
        strategyConfidence: parsed.strategyConfidence || 0.5,
        reasoning: parsed.reasoning || [],
        estimatedEffort: parsed.estimatedEffort || { hours: 0, complexity: 'medium' },
        risks: parsed.risks || [],
        costEstimate: parsed.costEstimate || {
          onPremAnnual: 0, cloudAnnual: 0, cloudOptimized: 0, savingsPercent: 0,
        },
      };
    } catch {
      return {
        workloadId,
        applicationStack: 'Unknown',
        description: 'Classification failed — manual review required',
        recommendedStrategy: 'retain',
        strategyConfidence: 0,
        reasoning: ['AI classification failed to parse response'],
        estimatedEffort: { hours: 0, complexity: 'medium' },
        risks: [{ category: 'classification', description: 'AI response parsing failed', severity: 'medium', mitigation: 'Manual review' }],
        costEstimate: { onPremAnnual: 0, cloudAnnual: 0, cloudOptimized: 0, savingsPercent: 0 },
      };
    }
  }

  private assessOverallRisk(classifications: AIClassification[]): 'low' | 'medium' | 'high' {
    const criticalRisks = classifications.reduce(
      (count, c) => count + c.risks.filter(r => r.severity === 'critical').length, 0,
    );
    const highRisks = classifications.reduce(
      (count, c) => count + c.risks.filter(r => r.severity === 'high').length, 0,
    );

    if (criticalRisks > 0) return 'high';
    if (highRisks > 3) return 'high';
    if (highRisks > 0) return 'medium';
    return 'low';
  }
}
