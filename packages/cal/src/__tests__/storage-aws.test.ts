/**
 * MigrationBox V5.0 - AWS S3 Adapter Unit Tests
 */

import { AWSS3Adapter } from '../../../../libs/cloud-abstraction/storage/aws-s3-adapter';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn();
  return {
    S3Client: jest.fn(() => ({
      send: mockSend,
    })),
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    ListObjectsV2Command: jest.fn(),
    CopyObjectCommand: jest.fn(),
    HeadObjectCommand: jest.fn(),
    CreateBucketCommand: jest.fn(),
    DeleteBucketCommand: jest.fn(),
  };
});

describe('AWSS3Adapter', () => {
  let adapter: AWSS3Adapter;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new AWSS3Adapter();
    // Get the mock send function
    const S3ClientMock = S3Client as jest.MockedClass<typeof S3Client>;
    const instance = S3ClientMock.mock.results[S3ClientMock.mock.results.length - 1].value;
    mockSend = instance.send as jest.Mock;
  });

  describe('putObject', () => {
    it('should put an object to S3', async () => {
      mockSend.mockResolvedValue({});

      await adapter.putObject('test-bucket', 'test-key', Buffer.from('test data'), { meta: 'value' });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'test-key',
        Body: Buffer.from('test data'),
        Metadata: { meta: 'value' },
      });
    });

    it('should put an object without metadata', async () => {
      mockSend.mockResolvedValue({});

      await adapter.putObject('test-bucket', 'test-key', Buffer.from('test data'));

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'test-key',
        Body: Buffer.from('test data'),
        Metadata: {},
      });
    });
  });

  describe('getObject', () => {
    it('should get an object from S3', async () => {
      const mockBody = {
        transformToByteArray: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      };
      mockSend.mockResolvedValue({
        Body: mockBody,
        Metadata: { meta: 'value' },
      });

      const result = await adapter.getObject('test-bucket', 'test-key');

      expect(result.body).toEqual(Buffer.from([1, 2, 3]));
      expect(result.metadata).toEqual({ meta: 'value' });
    });
  });

  describe('createBucket', () => {
    it('should create a bucket', async () => {
      mockSend.mockResolvedValue({});

      await adapter.createBucket('test-bucket');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should create a bucket with region', async () => {
      mockSend.mockResolvedValue({});

      await adapter.createBucket('test-bucket', 'us-west-2');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
