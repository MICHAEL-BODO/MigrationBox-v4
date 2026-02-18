/**
 * Unit Tests - Validation Service
 */

import { ValidationService, ValidationConfig } from '../validation-service';

describe('ValidationService', () => {
  let service: ValidationService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      putItem: jest.fn().mockResolvedValue(undefined),
      getItem: jest.fn(),
    };
    service = new ValidationService(mockDb);
  });

  const makeConfig = (overrides: Partial<ValidationConfig> = {}): ValidationConfig => ({
    tenantId: 'tenant-001',
    migrationId: 'mig-001',
    targetProvider: 'gcp',
    targetRegion: 'us-central1',
    targetProject: 'my-project',
    checks: ['connectivity', 'data-integrity', 'performance', 'security'],
    resources: [
      {
        resourceId: 'vm-001',
        resourceType: 'compute',
        endpoint: 'https://10.0.1.5:443',
        sourceChecksum: 'sha256-abc123',
        sourceRowCount: 1000,
      },
      {
        resourceId: 'db-001',
        resourceType: 'database',
        endpoint: 'https://db.example.com:5432',
        sourceChecksum: 'sha256-def456',
        sourceRowCount: 50000,
      },
    ],
    ...overrides,
  });

  describe('runFullValidation', () => {
    it('should run all validation checks', async () => {
      const result = await service.runFullValidation(makeConfig());

      expect(result.validationId).toMatch(/^val-/);
      expect(result.migrationId).toBe('mig-001');
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(['passed', 'partial', 'failed']).toContain(result.status);
      expect(result.completedAt).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);

      expect(mockDb.putItem).toHaveBeenCalledTimes(1);
    });

    it('should only run requested check types', async () => {
      const result = await service.runFullValidation(makeConfig({ checks: ['security'] }));

      const checkTypes = new Set(result.checks.map(c => c.type));
      expect(checkTypes.has('security')).toBe(true);
      expect(checkTypes.has('connectivity')).toBe(false);
    });
  });

  describe('validateConnectivity', () => {
    it('should check endpoint reachability', async () => {
      const checks = await service.validateConnectivity([
        { resourceId: 'vm-1', resourceType: 'compute', endpoint: 'https://10.0.1.5' },
      ]);

      expect(checks).toHaveLength(1);
      expect(checks[0].type).toBe('connectivity');
      expect(checks[0].status).toBe('passed');
    });

    it('should skip resources without endpoints', async () => {
      const checks = await service.validateConnectivity([
        { resourceId: 'bucket-1', resourceType: 'storage' },
      ]);

      expect(checks).toHaveLength(1);
      expect(checks[0].status).toBe('skipped');
    });

    it('should fail for unreachable endpoints', async () => {
      const checks = await service.validateConnectivity([
        { resourceId: 'vm-1', resourceType: 'compute', endpoint: 'https://unreachable.example.com' },
      ]);

      expect(checks[0].status).toBe('failed');
    });
  });

  describe('validateDataIntegrity', () => {
    it('should validate checksums', async () => {
      const checks = await service.validateDataIntegrity([
        { resourceId: 'db-1', resourceType: 'database', sourceChecksum: 'sha256-abc' },
      ]);

      const checksumCheck = checks.find(c => c.name.includes('checksum'));
      expect(checksumCheck).toBeDefined();
      expect(checksumCheck?.status).toBe('passed');
    });

    it('should validate row counts', async () => {
      const checks = await service.validateDataIntegrity([
        { resourceId: 'db-1', resourceType: 'database', sourceRowCount: 1000 },
      ]);

      const rowCountCheck = checks.find(c => c.name.includes('rowcount'));
      expect(rowCountCheck).toBeDefined();
      expect(rowCountCheck?.status).toBe('passed');
    });
  });

  describe('validatePerformance', () => {
    it('should check latency and throughput', async () => {
      const checks = await service.validatePerformance(
        [{ resourceId: 'vm-1', resourceType: 'compute' }],
        { latencyMs: 500, throughputMbps: 1 }
      );

      expect(checks.length).toBe(2);
      const latencyCheck = checks.find(c => c.name.includes('latency'));
      const throughputCheck = checks.find(c => c.name.includes('throughput'));
      expect(latencyCheck).toBeDefined();
      expect(throughputCheck).toBeDefined();
    });
  });

  describe('validateSecurity', () => {
    it('should check encryption and IAM', async () => {
      const checks = await service.validateSecurity([
        { resourceId: 'vm-1', resourceType: 'compute' },
      ]);

      expect(checks.length).toBeGreaterThan(0);
      const encryptionCheck = checks.find(c => c.name.includes('encryption'));
      expect(encryptionCheck?.status).toBe('passed');
    });
  });

  describe('validateDNS', () => {
    it('should check DNS resolution', async () => {
      const checks = await service.validateDNS([
        { resourceId: 'vm-1', resourceType: 'compute', endpoint: 'https://app.example.com' },
      ]);

      expect(checks).toHaveLength(1);
      expect(checks[0].status).toBe('passed');
    });
  });

  describe('validateSSL', () => {
    it('should validate SSL certificates for HTTPS endpoints', async () => {
      const checks = await service.validateSSL([
        { resourceId: 'vm-1', resourceType: 'compute', endpoint: 'https://app.example.com' },
      ]);

      expect(checks).toHaveLength(1);
      expect(checks[0].status).toBe('passed');
      expect(checks[0].details?.protocol).toBe('TLS 1.3');
    });

    it('should skip non-HTTPS endpoints', async () => {
      const checks = await service.validateSSL([
        { resourceId: 'vm-1', resourceType: 'compute', endpoint: 'http://internal.local' },
      ]);

      expect(checks).toHaveLength(0);
    });
  });

  describe('getValidation', () => {
    it('should return validation result when found', async () => {
      mockDb.getItem.mockResolvedValue({ validationId: 'val-001', status: 'passed' });
      const result = await service.getValidation('val-001');
      expect(result?.status).toBe('passed');
    });

    it('should return null when not found', async () => {
      mockDb.getItem.mockResolvedValue(null);
      const result = await service.getValidation('val-999');
      expect(result).toBeNull();
    });
  });
});
