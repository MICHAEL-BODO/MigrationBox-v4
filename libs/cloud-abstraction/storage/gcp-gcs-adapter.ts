/**
 * MigrationBox V5.0 - GCP Cloud Storage Adapter
 * 
 * Implements StorageAdapter interface using Google Cloud Storage SDK.
 */

import { Storage, Bucket, File } from '@google-cloud/storage';
import { StorageAdapter } from '../../../packages/cal/src/interfaces';

export class GCPGCSAdapter implements StorageAdapter {
  private client: Storage;

  constructor() {
    this.client = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE,
    });
  }

  async putObject(bucket: string, key: string, body: Buffer, metadata?: Record<string, string>): Promise<void> {
    const bucketClient = this.client.bucket(bucket);
    const file = bucketClient.file(key);
    
    await file.save(body, {
      metadata: {
        metadata: metadata || {},
      },
    });
  }

  async getObject(bucket: string, key: string): Promise<{ body: Buffer; metadata: Record<string, string> }> {
    const bucketClient = this.client.bucket(bucket);
    const file = bucketClient.file(key);
    
    const [buffer] = await file.download();
    const [metadata] = await file.getMetadata();
    
    return {
      body: buffer,
      metadata: (metadata.metadata as Record<string, string>) || {},
    };
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    const bucketClient = this.client.bucket(bucket);
    const file = bucketClient.file(key);
    await file.delete();
  }

  async listObjects(bucket: string, prefix: string, maxKeys?: number): Promise<string[]> {
    const bucketClient = this.client.bucket(bucket);
    const options: any = { prefix };
    if (maxKeys) {
      options.maxResults = maxKeys;
    }
    
    const [files] = await bucketClient.getFiles(options);
    return files.map(file => file.name);
  }

  async generatePresignedUrl(bucket: string, key: string, expiresIn: number): Promise<string> {
    const bucketClient = this.client.bucket(bucket);
    const file = bucketClient.file(key);
    
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });
    
    return url;
  }

  async copyObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
    const sourceBucketClient = this.client.bucket(sourceBucket);
    const destBucketClient = this.client.bucket(destBucket);
    const sourceFile = sourceBucketClient.file(sourceKey);
    const destFile = destBucketClient.file(destKey);
    
    await sourceFile.copy(destFile);
  }

  async headObject(bucket: string, key: string): Promise<{ size: number; lastModified: Date; metadata: Record<string, string> }> {
    const bucketClient = this.client.bucket(bucket);
    const file = bucketClient.file(key);
    const [metadata] = await file.getMetadata();
    
    return {
      size: parseInt(metadata.size || '0', 10),
      lastModified: new Date(metadata.updated || Date.now()),
      metadata: (metadata.metadata as Record<string, string>) || {},
    };
  }

  async createBucket(bucket: string, region?: string): Promise<void> {
    const options: any = {};
    if (region) {
      options.location = region;
    }
    
    await this.client.createBucket(bucket, options);
  }

  async deleteBucket(bucket: string): Promise<void> {
    const bucketClient = this.client.bucket(bucket);
    await bucketClient.delete();
  }
}
