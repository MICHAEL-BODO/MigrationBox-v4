/**
 * MigrationBox V5.0 - I2I Pipeline Layer 1: Intent Ingestion
 *
 * FLAGSHIP FEATURE
 *
 * Converts natural language migration intent into structured Intent Schema (IR).
 * Uses Google Vertex AI (Gemini 1.5 Pro) for complex intents.
 * Supports multi-turn refinement and ambiguity resolution.
 */

import { IntentSchema, CloudProvider } from '@migrationbox/types';
import { generateId } from '@migrationbox/utils';

export interface IntentIngestionInput {
  tenantId: string;
  naturalLanguageInput: string;
  targetProvider?: CloudProvider;
  context?: {
    previousIntentId?: string;
    workloadIds?: string[];
    refinements?: string[];
  };
}

export interface IntentIngestionResult {
  intentSchema: IntentSchema;
  confidence: number;
  ambiguities: Ambiguity[];
  requiresRefinement: boolean;
}

export interface Ambiguity {
  field: string;
  input: string;
  interpretations: string[];
  resolved: string;
  confidence: number;
}

const SYSTEM_PROMPT = `You are MigrationBox's Intent Extraction Engine. Convert natural language migration requests into structured Intent Schema (IR) format.

Output a valid JSON Intent Schema with these sections:
- provider: target cloud provider (aws/azure/gcp)
- resources: array of infrastructure resources to provision
- networking: VPC, subnets, security groups configuration
- security: encryption, IAM, secrets management settings
- compliance: regulatory framework flags (pciDss, hipaa, soc2, gdpr)
- scaling: auto-scaling policies
- monitoring: alerting and observability settings

Rules:
1. "redundant" or "high availability" → multi-AZ: true, replicas >= 2
2. "secure" → encryption at rest + in transit, least-privilege IAM
3. "scalable" → auto-scaling with sensible min/max
4. "cost-effective" → use reserved/spot instances where appropriate
5. If ambiguous, choose the most common enterprise interpretation and note the ambiguity`;

export class IntentIngestionEngine {
  private projectId: string;
  private location: string;
  private modelId: string;

  constructor(config?: { projectId?: string; location?: string; modelId?: string }) {
    this.projectId = config?.projectId || process.env.GCP_PROJECT || 'migrationbox-v5';
    this.location = config?.location || process.env.GCP_LOCATION || 'us-central1';
    this.modelId = config?.modelId || 'gemini-1.5-pro-001';
  }

  /**
   * Extract intent from natural language input
   */
  async extractIntent(input: IntentIngestionInput): Promise<IntentIngestionResult> {
    const intentId = generateId('intent');
    const now = new Date().toISOString();

    // Build prompt with context
    let prompt = input.naturalLanguageInput;
    if (input.context?.refinements) {
      prompt += '\n\nRefinements:\n' + input.context.refinements.join('\n');
    }

    // Call Vertex AI for intent extraction
    let extractedSchema: any;
    let ambiguities: Ambiguity[] = [];

    try {
      const response = await this.callVertex(prompt, input.targetProvider);
      extractedSchema = response.schema || response; // Handle direct schema return
      ambiguities = response.ambiguities || [];
    } catch (error: any) {
      // Fallback: use deterministic extraction
      extractedSchema = this.deterministicExtraction(prompt, input.targetProvider);
    }

    // Build full Intent Schema
    const intentSchema: IntentSchema = {
      intentId,
      tenantId: input.tenantId,
      provider: extractedSchema?.provider || input.targetProvider || 'aws',
      naturalLanguage: input.naturalLanguageInput,
      resources: extractedSchema?.resources || [],
      networking: extractedSchema?.networking || { vpc: { cidr: '10.0.0.0/16', subnets: { public: 2, private: 2 } }, securityGroups: [] },
      security: extractedSchema?.security || {
        encryptionAtRest: true,
        encryptionInTransit: true,
        iamPolicies: [],
        secretsManagement: 'aws-secrets-manager',
      },
      compliance: extractedSchema?.compliance || {},
      confidence: this.calculateConfidence(extractedSchema, ambiguities),
      createdAt: now,
    };

    // Resolve known ambiguities
    const resolvedAmbiguities = this.resolveAmbiguities(input.naturalLanguageInput, ambiguities);

    return {
      intentSchema,
      confidence: intentSchema.confidence || 0.8,
      ambiguities: resolvedAmbiguities,
      requiresRefinement: resolvedAmbiguities.some(a => a.confidence < 0.7),
    };
  }

  /**
   * Multi-turn refinement: update an existing intent with clarifications
   */
  async refineIntent(
    existingIntent: IntentSchema,
    refinement: string
  ): Promise<IntentIngestionResult> {
    return this.extractIntent({
      tenantId: existingIntent.tenantId,
      naturalLanguageInput: existingIntent.naturalLanguage,
      targetProvider: existingIntent.provider as CloudProvider,
      context: {
        previousIntentId: existingIntent.intentId,
        refinements: [refinement],
      },
    });
  }

  private async callVertex(prompt: string, targetProvider?: CloudProvider): Promise<any> {
    try {
      const { VertexAI } = await import('@google-cloud/vertexai');

      const vertexAI = new VertexAI({
        project: this.projectId,
        location: this.location,
      });

      const model = vertexAI.preview.getGenerativeModel({
        model: this.modelId,
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent({
        contents: [{ 
          role: 'user', 
          parts: [{ text: `${SYSTEM_PROMPT}\n\nTarget provider: ${targetProvider || 'aws'}\n\nUser request: ${prompt}\n\nRespond with valid JSON only.` }] 
        }],
      });

      const response = await result.response;
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { schema: {} };
    } catch (error: any) {
      console.warn('Vertex AI call failed, using deterministic fallback:', error.message);
      // Re-throw if critical, or return deterministic fallback
      // Since extractIntent catches errors, throwing here allows fallback logic there
      throw error; 
    }
  }

  /**
   * Deterministic fallback extraction (no LLM required)
   */
  private deterministicExtraction(input: string, targetProvider?: CloudProvider): any {
    const lower = input.toLowerCase();
    const provider = targetProvider || 'aws';
    const resources: any[] = [];

    // Detect compute requirements
    if (lower.includes('server') || lower.includes('instance') || lower.includes('vm')) {
      resources.push({
        type: 'compute',
        name: 'app-server',
        config: {
          instanceType: lower.includes('large') ? 'large' : 'medium',
          count: lower.includes('redundant') || lower.includes('ha') ? 2 : 1,
          os: lower.includes('windows') ? 'windows' : 'linux',
        },
      });
    }

    // Detect database requirements
    if (lower.includes('database') || lower.includes('db') || lower.includes('sql') || lower.includes('postgres')) {
      resources.push({
        type: 'database',
        name: 'app-database',
        config: {
          engine: lower.includes('postgres') ? 'postgresql' : lower.includes('mysql') ? 'mysql' : 'postgresql',
          multiAZ: lower.includes('redundant') || lower.includes('ha') || lower.includes('high availability'),
          size: lower.includes('large') ? 'large' : 'medium',
          encrypted: true,
        },
      });
    }

    // Detect storage
    if (lower.includes('storage') || lower.includes('bucket') || lower.includes('files') || lower.includes('s3')) {
      resources.push({
        type: 'storage',
        name: 'app-storage',
        config: {
          versioning: true,
          encryption: 'AES256',
          lifecycle: lower.includes('archive') ? { transitionToArchive: 90 } : undefined,
        },
      });
    }

    // Detect serverless
    if (lower.includes('serverless') || lower.includes('lambda') || lower.includes('function')) {
      resources.push({
        type: 'serverless',
        name: 'api-functions',
        config: {
          runtime: 'nodejs20.x',
          memory: 512,
          timeout: 30,
        },
      });
    }

    // Detect containers
    if (lower.includes('container') || lower.includes('docker') || lower.includes('kubernetes') || lower.includes('k8s')) {
      resources.push({
        type: 'container',
        name: 'app-cluster',
        config: {
          orchestrator: lower.includes('kubernetes') || lower.includes('k8s') ? 'kubernetes' : 'ecs',
          nodeCount: lower.includes('large') ? 5 : 3,
          autoScaling: true,
        },
      });
    }

    // Detect compliance
    const compliance: any = {};
    if (lower.includes('pci') || lower.includes('payment')) compliance.pciDss = true;
    if (lower.includes('hipaa') || lower.includes('health')) compliance.hipaa = true;
    if (lower.includes('gdpr') || lower.includes('european') || lower.includes('eu')) compliance.gdpr = true;
    if (lower.includes('soc') || lower.includes('audit')) compliance.soc2 = true;

    return {
      provider,
      resources,
      networking: {
        vpc: true,
        subnets: { public: 2, private: 2 },
        securityGroups: resources.length > 0 ? ['default-sg'] : [],
      },
      security: {
        encryptionAtRest: true,
        encryptionInTransit: true,
        iamLeastPrivilege: true,
        secretsManagement: lower.includes('secret') || lower.includes('credential'),
      },
      compliance,
    };
  }

  private resolveAmbiguities(input: string, ambiguities: Ambiguity[]): Ambiguity[] {
    const lower = input.toLowerCase();
    const resolved: Ambiguity[] = [...ambiguities];

    // Common ambiguity: "redundant" → HA
    if (lower.includes('redundant')) {
      resolved.push({
        field: 'availability',
        input: 'redundant',
        interpretations: ['Multi-AZ deployment', 'Read replicas', 'Active-passive failover'],
        resolved: 'Multi-AZ deployment with automatic failover',
        confidence: 0.85,
      });
    }

    // "Secure" → which security measures?
    if (lower.includes('secure') && !lower.includes('security group')) {
      resolved.push({
        field: 'security',
        input: 'secure',
        interpretations: ['Encryption only', 'Encryption + WAF', 'Full security stack'],
        resolved: 'Encryption at rest + in transit, least-privilege IAM, secrets management',
        confidence: 0.8,
      });
    }

    return resolved;
  }

  private calculateConfidence(schema: any, ambiguities: Ambiguity[]): number {
    let confidence = 0.95;
    if (!schema.resources || schema.resources.length === 0) confidence -= 0.2;
    confidence -= ambiguities.length * 0.05;
    return Math.max(0.3, Math.min(1.0, confidence));
  }
}
