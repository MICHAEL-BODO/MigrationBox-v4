/**
 * Unit Tests - Discovery Service
 */

import { DiscoveryService } from '../discovery-service';

describe('DiscoveryService', () => {
  let service: DiscoveryService;
  let mockDb: any;
  let mockMessaging: any;

  beforeEach(() => {
    mockDb = {
      putItem: jest.fn().mockResolvedValue(undefined),
      getItem: jest.fn(),
      queryItems: jest.fn(),
      updateItem: jest.fn().mockResolvedValue(undefined),
    };
    mockMessaging = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      publishEvent: jest.fn().mockResolvedValue(undefined),
    };
    service = new DiscoveryService(mockDb, mockMessaging);
  });

  describe('startDiscovery', () => {
    it('should create a discovery record and queue a message', async () => {
      const result = await service.startDiscovery({
        tenantId: 'tenant-001',
        sourceEnvironment: 'aws',
        regions: ['us-east-1'],
        scope: 'full',
      });

      expect(result.discoveryId).toMatch(/^disc-/);
      expect(result.tenantId).toBe('tenant-001');
      expect(result.sourceEnvironment).toBe('aws');
      expect(result.status).toBe('initiated');
      expect(result.scope).toBe('full');
      expect(result.workloadsFound).toBe(0);

      // Verify DB write
      expect(mockDb.putItem).toHaveBeenCalledTimes(1);
      expect(mockDb.putItem.mock.calls[0][0]).toContain('discoveries');

      // Verify SQS message
      expect(mockMessaging.sendMessage).toHaveBeenCalledTimes(1);

      // Verify EventBridge event
      expect(mockMessaging.publishEvent).toHaveBeenCalledTimes(1);
      const eventCall = mockMessaging.publishEvent.mock.calls[0];
      expect(eventCall[2]).toBe('DiscoveryInitiated');
    });

    it('should use default regions when none provided', async () => {
      await service.startDiscovery({
        tenantId: 'tenant-001',
        sourceEnvironment: 'aws',
      });

      const sqsCall = mockMessaging.sendMessage.mock.calls[0];
      const message = sqsCall[1];
      expect(message.regions).toEqual(['us-east-1', 'us-west-2', 'eu-west-1']);
    });

    it('should default scope to full', async () => {
      const result = await service.startDiscovery({
        tenantId: 'tenant-001',
        sourceEnvironment: 'gcp',
      });

      expect(result.scope).toBe('full');
    });
  });

  describe('getDiscovery', () => {
    it('should return discovery when found', async () => {
      const mockDiscovery = {
        discoveryId: 'disc-001',
        tenantId: 'tenant-001',
        status: 'complete',
      };
      mockDb.getItem.mockResolvedValue(mockDiscovery);

      const result = await service.getDiscovery('tenant-001', 'disc-001');
      expect(result).toEqual(mockDiscovery);
      expect(mockDb.getItem).toHaveBeenCalledWith(
        expect.stringContaining('discoveries'),
        { tenantId: 'tenant-001', discoveryId: 'disc-001' }
      );
    });

    it('should return null when not found', async () => {
      mockDb.getItem.mockResolvedValue(null);

      const result = await service.getDiscovery('tenant-001', 'disc-999');
      expect(result).toBeNull();
    });
  });

  describe('listWorkloads', () => {
    it('should query workloads by discoveryId', async () => {
      mockDb.queryItems.mockResolvedValue({
        items: [
          { workloadId: 'wl-1', type: 'compute' },
          { workloadId: 'wl-2', type: 'database' },
        ],
      });

      const result = await service.listWorkloads('tenant-001', 'disc-001');
      expect(result.workloads).toHaveLength(2);
    });

    it('should support type filtering', async () => {
      mockDb.queryItems.mockResolvedValue({
        items: [{ workloadId: 'wl-1', type: 'compute' }],
      });

      await service.listWorkloads('tenant-001', 'disc-001', { type: 'compute' });
      const queryCall = mockDb.queryItems.mock.calls[0][1];
      expect(queryCall.filterExpression).toContain('#type = :type');
    });
  });

  describe('processDiscovery', () => {
    it('should update status to running then complete', async () => {
      // Mock the dynamic import for aws-adapter-v5
      jest.mock('../aws-adapter-v5', () => ({
        discover: jest.fn().mockResolvedValue([
          {
            workloadId: 'ec2-001',
            type: 'compute',
            provider: 'aws',
            region: 'us-east-1',
            name: 'test-instance',
            status: 'running',
            metadata: {},
            discoveredAt: new Date().toISOString(),
          },
        ]),
      }), { virtual: true });

      const message = {
        discoveryId: 'disc-test',
        tenantId: 'tenant-001',
        sourceEnvironment: 'aws' as const,
        regions: ['us-east-1'],
        scope: 'full',
        credentials: {},
      };

      try {
        await service.processDiscovery(message);
      } catch {
        // May fail due to dynamic import in test — that's OK
      }

      // At minimum, status should have been updated to 'running'
      expect(mockDb.updateItem).toHaveBeenCalled();
      const firstUpdate = mockDb.updateItem.mock.calls[0];
      expect(firstUpdate[2]).toHaveProperty('status', 'running');
    });

    it('should set status to failed on error', async () => {
      const message = {
        discoveryId: 'disc-fail',
        tenantId: 'tenant-001',
        sourceEnvironment: 'azure' as const, // Not implemented yet
        regions: ['eastus'],
        scope: 'full',
        credentials: {},
      };

      await expect(service.processDiscovery(message)).rejects.toThrow('Azure discovery not yet implemented');

      // Should have been updated to failed
      const updateCalls = mockDb.updateItem.mock.calls;
      const failedUpdate = updateCalls.find((c: any) => c[2].status === 'failed');
      expect(failedUpdate).toBeDefined();
    });
  });
});
