/**
 * Unit Tests - Data Transfer Service
 */

import { DataTransferService, TransferConfig } from '../data-transfer-service';

describe('DataTransferService', () => {
  let service: DataTransferService;
  let mockDb: any;
  let mockMessaging: any;

  beforeEach(() => {
    mockDb = {
      putItem: jest.fn().mockResolvedValue(undefined),
      getItem: jest.fn(),
      updateItem: jest.fn().mockResolvedValue(undefined),
    };
    mockMessaging = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      publishEvent: jest.fn().mockResolvedValue(undefined),
    };
    service = new DataTransferService(mockDb, mockMessaging);
  });

  describe('startTransfer', () => {
    it('should create a transfer job and queue it', async () => {
      const config: TransferConfig = {
        tenantId: 'tenant-001',
        sourceProvider: 'aws',
        targetProvider: 'gcp',
        sourceRegion: 'us-east-1',
        targetRegion: 'us-central1',
        transferType: 'storage',
        resources: [
          {
            sourceId: 'my-bucket',
            sourceName: 'my-bucket',
            sourceType: 's3-bucket',
            targetMapping: 'gs://my-gcp-bucket',
            sizeBytes: 1024 * 1024 * 100,
          },
        ],
      };

      const job = await service.startTransfer(config);

      expect(job.transferId).toMatch(/^xfer-/);
      expect(job.status).toBe('queued');
      expect(job.sourceProvider).toBe('aws');
      expect(job.targetProvider).toBe('gcp');
      expect(job.resources).toHaveLength(1);
      expect(job.progress.resourcesTotal).toBe(1);
      expect(job.progress.totalBytes).toBe(1024 * 1024 * 100);

      expect(mockDb.putItem).toHaveBeenCalledTimes(1);
      expect(mockMessaging.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple resources', async () => {
      const config: TransferConfig = {
        tenantId: 'tenant-001',
        sourceProvider: 'aws',
        targetProvider: 'gcp',
        sourceRegion: 'us-east-1',
        targetRegion: 'us-central1',
        transferType: 'full',
        resources: [
          { sourceId: 'bucket-1', sourceName: 'bucket-1', sourceType: 's3-bucket', targetMapping: 'gs://b1', sizeBytes: 100 },
          { sourceId: 'rds-1', sourceName: 'rds-1', sourceType: 'rds-instance', targetMapping: 'cloud-sql:db1', sizeBytes: 200 },
          { sourceId: 'ddb-1', sourceName: 'ddb-1', sourceType: 'dynamodb-table', targetMapping: 'firestore:col1', sizeBytes: 50 },
        ],
      };

      const job = await service.startTransfer(config);

      expect(job.resources).toHaveLength(3);
      expect(job.progress.totalBytes).toBe(350);
      expect(job.progress.resourcesTotal).toBe(3);
    });

    it('should work without messaging (standalone mode)', async () => {
      const standaloneService = new DataTransferService(mockDb);
      const config: TransferConfig = {
        tenantId: 'tenant-001',
        sourceProvider: 'azure',
        targetProvider: 'gcp',
        sourceRegion: 'eastus',
        targetRegion: 'europe-west1',
        transferType: 'storage',
        resources: [{ sourceId: 'blob-1', sourceName: 'blob-1', sourceType: 'azure-blob', targetMapping: 'gs://b1' }],
      };

      const job = await standaloneService.startTransfer(config);
      expect(job.transferId).toBeDefined();
      expect(mockMessaging.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('copyStorage', () => {
    it('should copy S3 to GCS', async () => {
      const result = await service.copyStorage(
        'xfer-001',
        { provider: 'aws', bucket: 'source-bucket', region: 'us-east-1' },
        { bucket: 'target-bucket', region: 'us-central1', project: 'my-project' }
      );

      expect(result.status).toBe('complete');
      expect(result.sourceType).toBe('s3-bucket');
      expect(result.targetMapping).toBe('gs://target-bucket');
      expect(result.checksum).toMatch(/^sha256-/);
    });

    it('should copy Azure Blob to GCS', async () => {
      const result = await service.copyStorage(
        'xfer-002',
        { provider: 'azure', bucket: 'source-container', region: 'eastus' },
        { bucket: 'target-bucket', region: 'europe-west1', project: 'my-project' }
      );

      expect(result.status).toBe('complete');
      expect(result.sourceType).toBe('azure-blob');
    });
  });

  describe('copyDatabase', () => {
    it('should map PostgreSQL to Cloud SQL', async () => {
      const result = await service.copyDatabase(
        'xfer-003',
        { provider: 'aws', instanceId: 'rds-pg-001', engine: 'postgresql', region: 'us-east-1' },
        { instanceId: 'csql-pg-001', region: 'us-central1', project: 'my-project' }
      );

      expect(result.status).toBe('complete');
      expect(result.targetMapping).toContain('cloud-sql-postgres');
    });

    it('should map DynamoDB to Firestore', async () => {
      const result = await service.copyDatabase(
        'xfer-004',
        { provider: 'aws', instanceId: 'ddb-001', engine: 'dynamodb', region: 'us-east-1' },
        { instanceId: 'fs-001', region: 'us-central1', project: 'my-project' }
      );

      expect(result.targetMapping).toContain('firestore');
    });
  });

  describe('streamData', () => {
    it('should start a CDP stream', async () => {
      const result = await service.streamData(
        'xfer-005',
        { provider: 'onprem', resourceId: 'disk-001', type: 'block-device' },
        { resourceId: 'pd-001', project: 'my-project' },
        { cdpEnabled: true }
      );

      expect(result.streamId).toMatch(/^stream-/);
      expect(result.status).toBe('cdp-active');
    });

    it('should start a regular stream', async () => {
      const result = await service.streamData(
        'xfer-006',
        { provider: 'aws', resourceId: 'kinesis-001', type: 'stream' },
        { resourceId: 'pubsub-001', project: 'my-project' }
      );

      expect(result.status).toBe('streaming');
    });
  });

  describe('getTransferStatus', () => {
    it('should return transfer job when found', async () => {
      mockDb.getItem.mockResolvedValue({ transferId: 'xfer-001', status: 'transferring' });

      const result = await service.getTransferStatus('xfer-001');
      expect(result).toBeDefined();
      expect(result?.status).toBe('transferring');
    });

    it('should return null when not found', async () => {
      mockDb.getItem.mockResolvedValue(null);

      const result = await service.getTransferStatus('xfer-999');
      expect(result).toBeNull();
    });
  });

  describe('validateTransfer', () => {
    it('should validate a completed transfer', async () => {
      mockDb.getItem.mockResolvedValue({
        transferId: 'xfer-001',
        status: 'validating',
        resources: [
          { sourceId: 'b1', status: 'complete', bytesTransferred: 100, checksum: 'sha256-abc' },
          { sourceId: 'b2', status: 'complete', bytesTransferred: 200, checksum: 'sha256-def' },
        ],
        progress: { totalBytes: 300 },
      });

      const result = await service.validateTransfer('xfer-001');

      expect(result.passed).toBe(true);
      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.checks.find(c => c.name === 'all-resources-transferred')?.passed).toBe(true);
      expect(result.checks.find(c => c.name === 'checksum-validation')?.passed).toBe(true);
    });

    it('should fail validation when resources are incomplete', async () => {
      mockDb.getItem.mockResolvedValue({
        transferId: 'xfer-002',
        status: 'transferring',
        resources: [
          { sourceId: 'b1', status: 'complete', bytesTransferred: 100, checksum: 'sha256-abc' },
          { sourceId: 'b2', status: 'failed', bytesTransferred: 0, error: 'timeout' },
        ],
        progress: { totalBytes: 200 },
      });

      const result = await service.validateTransfer('xfer-002');

      expect(result.passed).toBe(false);
      expect(result.checks.find(c => c.name === 'all-resources-transferred')?.passed).toBe(false);
    });

    it('should throw when transfer not found', async () => {
      mockDb.getItem.mockResolvedValue(null);
      await expect(service.validateTransfer('xfer-999')).rejects.toThrow('not found');
    });
  });

  describe('cancelTransfer', () => {
    it('should cancel a running transfer', async () => {
      mockDb.getItem.mockResolvedValue({ transferId: 'xfer-001', status: 'transferring' });

      await service.cancelTransfer('xfer-001');

      expect(mockDb.putItem).toHaveBeenCalledWith(
        'migrationbox-transfers',
        expect.objectContaining({ status: 'cancelled' })
      );
    });

    it('should throw when transfer not found', async () => {
      mockDb.getItem.mockResolvedValue(null);
      await expect(service.cancelTransfer('xfer-999')).rejects.toThrow('not found');
    });
  });
});
