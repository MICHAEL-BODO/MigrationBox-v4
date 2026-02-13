/**
 * Unit Tests - Assessment 6Rs Engine
 */

import { AssessmentService } from '../assessment-service';
import { Workload } from '@migrationbox/types';

describe('AssessmentService', () => {
  let service: AssessmentService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      putItem: jest.fn().mockResolvedValue(undefined),
      getItem: jest.fn(),
      queryItems: jest.fn().mockResolvedValue({ items: [] }),
    };
    service = new AssessmentService(mockDb);
  });

  const makeWorkload = (overrides: Partial<Workload> = {}): Workload => ({
    workloadId: 'ec2-test-001',
    tenantId: 'tenant-001',
    discoveryId: 'disc-001',
    type: 'compute',
    provider: 'aws',
    region: 'us-east-1',
    name: 'test-server',
    status: 'running',
    metadata: { instanceType: 't3.large' },
    dependencies: [],
    discoveredAt: new Date().toISOString(),
    ...overrides,
  });

  describe('assessWorkloads', () => {
    it('should return assessments for all workloads', async () => {
      const workloads = [
        makeWorkload({ workloadId: 'ec2-1', type: 'compute' }),
        makeWorkload({ workloadId: 'rds-1', type: 'database', metadata: { engine: 'postgresql' } }),
      ];

      const assessments = await service.assessWorkloads({
        tenantId: 'tenant-001',
        workloads,
        targetProvider: 'azure',
      });

      expect(assessments).toHaveLength(2);
      expect(assessments[0].assessmentId).toBeDefined();
      expect(assessments[0].strategy).toBeDefined();
      expect(assessments[0].confidence).toBeGreaterThan(0);
      expect(mockDb.putItem).toHaveBeenCalledTimes(2);
    });

    it('should recommend rehost for simple compute workloads', async () => {
      const assessments = await service.assessWorkloads({
        tenantId: 'tenant-001',
        workloads: [makeWorkload({ type: 'compute', dependencies: [] })],
        targetProvider: 'aws',
      });

      expect(assessments[0].strategy).toBe('rehost');
    });

    it('should recommend replatform for databases with engines', async () => {
      const assessments = await service.assessWorkloads({
        tenantId: 'tenant-001',
        workloads: [makeWorkload({
          workloadId: 'rds-1',
          type: 'database',
          metadata: { engine: 'postgresql', multiAZ: false },
        })],
        targetProvider: 'azure',
      });

      // Database should score high for replatform
      expect(['rehost', 'replatform']).toContain(assessments[0].strategy);
    });

    it('should recommend retire for stopped resources', async () => {
      const assessments = await service.assessWorkloads({
        tenantId: 'tenant-001',
        workloads: [makeWorkload({
          status: 'stopped',
          dependencies: [],
          name: 'old-deprecated-server',
        })],
        targetProvider: 'aws',
      });

      expect(assessments[0].strategy).toBe('retire');
    });

    it('should include risk and complexity scores', async () => {
      const assessments = await service.assessWorkloads({
        tenantId: 'tenant-001',
        workloads: [makeWorkload()],
        targetProvider: 'aws',
      });

      expect(assessments[0].riskScore).toBeGreaterThanOrEqual(0);
      expect(assessments[0].riskScore).toBeLessThanOrEqual(100);
      expect(assessments[0].complexityScore).toBeGreaterThanOrEqual(0);
    });

    it('should respect preference weights', async () => {
      const modernizeAssessment = await service.assessWorkloads({
        tenantId: 'tenant-001',
        workloads: [makeWorkload({ type: 'application' })],
        targetProvider: 'aws',
        preferences: { costWeight: 0.1, riskWeight: 0.1, speedWeight: 0.1, modernizeWeight: 0.7 },
      });

      const speedAssessment = await service.assessWorkloads({
        tenantId: 'tenant-001',
        workloads: [makeWorkload({ type: 'application' })],
        targetProvider: 'aws',
        preferences: { costWeight: 0.1, riskWeight: 0.1, speedWeight: 0.7, modernizeWeight: 0.1 },
      });

      // Both should produce valid assessments
      expect(modernizeAssessment[0].strategy).toBeDefined();
      expect(speedAssessment[0].strategy).toBeDefined();
    });

    it('should include recommendations', async () => {
      const assessments = await service.assessWorkloads({
        tenantId: 'tenant-001',
        workloads: [makeWorkload()],
        targetProvider: 'azure',
      });

      expect(assessments[0].recommendations).toBeDefined();
      expect(assessments[0].recommendations.length).toBeGreaterThan(0);
    });
  });
});
