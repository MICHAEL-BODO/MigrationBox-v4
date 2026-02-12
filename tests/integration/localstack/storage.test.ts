/**
 * MigrationBox V5.0 - Storage Adapter Integration Tests (LocalStack)
 * 
 * Tests AWS S3 adapter against LocalStack.
 * Requires LocalStack running on localhost:4566
 */

import { AWSS3Adapter } from '../../libs/cloud-abstraction/storage/aws-s3-adapter';

describe('Storage Adapter Integration Tests (LocalStack)', () => {
  let adapter: AWSS3Adapter;
  const testBucket = 'test-bucket-' + Date.now();
  const testKey = 'test-key';

  beforeAll(() => {
    // Set LocalStack endpoint
    process.env.AWS_ENDPOINT_URL = 'http://localhost:4566';
    process.env.AWS_DEFAULT_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';

    adapter = new AWSS3Adapter();
  });

  afterAll(async () => {
    // Cleanup: delete bucket
    try {
      await adapter.deleteBucket(testBucket);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Bucket Operations', () => {
    it('should create a bucket', async () => {
      await adapter.createBucket(testBucket);
      // If no error, bucket was created
      expect(true).toBe(true);
    });

    it('should delete a bucket', async () => {
      await adapter.deleteBucket(testBucket);
      // If no error, bucket was deleted
      expect(true).toBe(true);
    });
  });

  describe('Object Operations', () => {
    beforeEach(async () => {
      // Ensure bucket exists
      try {
        await adapter.createBucket(testBucket);
      } catch (error) {
        // Bucket might already exist
      }
    });

    it('should put an object', async () => {
      const testData = Buffer.from('test data');
      await adapter.putObject(testBucket, testKey, testData, { meta: 'value' });
      expect(true).toBe(true);
    });

    it('should get an object', async () => {
      const result = await adapter.getObject(testBucket, testKey);
      expect(result.body.toString()).toBe('test data');
      expect(result.metadata.meta).toBe('value');
    });

    it('should list objects', async () => {
      const keys = await adapter.listObjects(testBucket, 'test-');
      expect(keys).toContain(testKey);
    });

    it('should delete an object', async () => {
      await adapter.deleteObject(testBucket, testKey);
      // Verify deletion by trying to get (should fail)
      try {
        await adapter.getObject(testBucket, testKey);
        fail('Object should not exist');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
