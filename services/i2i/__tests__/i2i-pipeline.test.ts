/**
 * Unit Tests - I2I Pipeline Layers 1 & 2
 */

import { IntentIngestionEngine } from '../layers/layer1-intent-ingestion';
import { ValidationGuardrailEngine } from '../layers/layer2-validation-guardrails';

describe('I2I Pipeline - Layer 1: Intent Ingestion', () => {
  const engine = new IntentIngestionEngine();

  it('should extract compute resources from natural language', async () => {
    const result = await engine.extractIntent({
      tenantId: 'tenant-001',
      naturalLanguageInput: 'I need a web server with a PostgreSQL database',
      targetProvider: 'aws',
    });

    expect(result.intentSchema).toBeDefined();
    expect(result.intentSchema.provider).toBe('aws');
    expect(result.intentSchema.resources.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0.5);

    const types = result.intentSchema.resources.map(r => r.type);
    expect(types).toContain('compute');
    expect(types).toContain('database');
  });

  it('should resolve "redundant" to high availability', async () => {
    const result = await engine.extractIntent({
      tenantId: 'tenant-001',
      naturalLanguageInput: 'Deploy a redundant PostgreSQL database on AWS',
      targetProvider: 'aws',
    });

    const dbResource = result.intentSchema.resources.find(r => r.type === 'database');
    expect(dbResource?.config?.multiAZ).toBe(true);
  });

  it('should detect compliance requirements', async () => {
    const result = await engine.extractIntent({
      tenantId: 'tenant-001',
      naturalLanguageInput: 'Set up HIPAA-compliant healthcare data storage with GDPR compliance',
      targetProvider: 'aws',
    });

    expect(result.intentSchema.compliance?.hipaa).toBe(true);
    expect(result.intentSchema.compliance?.gdpr).toBe(true);
  });

  it('should enable encryption by default', async () => {
    const result = await engine.extractIntent({
      tenantId: 'tenant-001',
      naturalLanguageInput: 'Create a simple storage bucket',
      targetProvider: 'aws',
    });

    expect(result.intentSchema.security?.encryptionAtRest).toBe(true);
    expect(result.intentSchema.security?.encryptionInTransit).toBe(true);
  });

  it('should detect serverless requirements', async () => {
    const result = await engine.extractIntent({
      tenantId: 'tenant-001',
      naturalLanguageInput: 'Build a serverless API with Lambda functions',
      targetProvider: 'aws',
    });

    const serverless = result.intentSchema.resources.find(r => r.type === 'serverless');
    expect(serverless).toBeDefined();
  });

  it('should detect container/kubernetes requirements', async () => {
    const result = await engine.extractIntent({
      tenantId: 'tenant-001',
      naturalLanguageInput: 'Deploy a Kubernetes cluster with 5 nodes',
      targetProvider: 'gcp',
    });

    const container = result.intentSchema.resources.find(r => r.type === 'container');
    expect(container).toBeDefined();
    expect(container?.config?.orchestrator).toBe('kubernetes');
  });
});

describe('I2I Pipeline - Layer 2: Validation & Policy Guardrails', () => {
  const engine = new ValidationGuardrailEngine();

  const makeSchema = (overrides: any = {}) => ({
    intentId: 'intent-001',
    tenantId: 'tenant-001',
    provider: 'aws',
    naturalLanguageInput: 'test',
    resources: [{ type: 'compute', name: 'server', config: {} }],
    networking: { vpc: true, subnets: { public: 2, private: 2 }, securityGroups: [] },
    security: { encryptionAtRest: true, encryptionInTransit: true, iamLeastPrivilege: true },
    compliance: {},
    status: 'draft',
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  it('should validate a correct schema', async () => {
    const result = await engine.validate(makeSchema());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty resources', async () => {
    const result = await engine.validate(makeSchema({ resources: [] }));
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'EMPTY_RESOURCES')).toBe(true);
  });

  it('should flag missing encryption at rest', async () => {
    const result = await engine.validate(makeSchema({
      security: { encryptionAtRest: false, encryptionInTransit: true, iamLeastPrivilege: true },
    }));

    expect(result.policyViolations.some(v => v.policy === 'encryption-at-rest')).toBe(true);
  });

  it('should enforce PCI-DSS encryption requirements', async () => {
    const result = await engine.validate(makeSchema({
      compliance: { pciDss: true },
      security: { encryptionAtRest: true, encryptionInTransit: false, iamLeastPrivilege: true },
    }));

    expect(result.policyViolations.some(v => v.framework === 'pci-dss')).toBe(true);
  });

  it('should enforce HIPAA audit logging', async () => {
    const result = await engine.validate(makeSchema({
      compliance: { hipaa: true },
    }));

    expect(result.policyViolations.some(v => v.framework === 'hipaa')).toBe(true);
  });

  it('should enforce GDPR data residency', async () => {
    const schema = makeSchema({ compliance: { gdpr: true }, region: 'us-east-1' });
    const result = await engine.validate(schema);

    expect(result.policyViolations.some(v => v.policy === 'gdpr-data-residency')).toBe(true);
  });

  it('should enforce SOC 2 monitoring', async () => {
    const result = await engine.validate(makeSchema({ compliance: { soc2: true } }));
    expect(result.policyViolations.some(v => v.framework === 'soc2')).toBe(true);
  });

  it('should provide auto-remediation for encryption', async () => {
    const schema = makeSchema({
      security: { encryptionAtRest: false, encryptionInTransit: false, iamLeastPrivilege: false },
    });
    const result = await engine.validate(schema);

    const autoFixable = result.remediations.filter(r => r.autoFix);
    expect(autoFixable.length).toBeGreaterThan(0);

    const remediated = engine.autoRemediate(schema, result);
    expect(remediated.security.encryptionAtRest).toBe(true);
  });
});
