/**
 * MigrationBox V4.1 - AWS S3 Storage Adapter
 * 
 * Implements StorageAdapter interface using AWS SDK v3 for S3.
 * Works with both real AWS and LocalStack (via AWS_ENDPOINT_URL).
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageAdapter } from '../../../packages/cal/src/interfaces';

export class AWSS3Adapter implements StorageAdapter {
  private client: S3Client;

  constructor() {
    const config: any = {
      region: process.env.AWS_DEFAULT_REGION || process.env.REGION || 'us-east-1',
    };

    // Support LocalStack endpoint
    if (process.env.AWS_ENDPOINT_URL) {
      config.endpoint = process.env.AWS_ENDPOINT_URL;
      config.forcePathStyle = true;
    }

    this.client = new S3Client(config);
  }

  async putObject(bucket: string, key: string, body: Buffer, metadata?: Record<string, string>): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      Metadata: metadata || {},
    }));
  }

  async getObject(bucket: string, key: string): Promise<{ body: Buffer; metadata: Record<string, string> }> {
    const response = await this.client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }));

    const bodyBytes = await response.Body?.transformToByteArray();
    return {
      body: Buffer.from(bodyBytes || []),
      metadata: (response.Metadata as Record<string, string>) || {},
    };
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }));
  }

  async listObjects(bucket: string, prefix: string, maxKeys?: number): Promise<string[]> {
    const response = await this.client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys || 1000,
    }));

    return (response.Contents || []).map(obj => obj.Key!).filter(Boolean);
  }

  async generatePresignedUrl(bucket: string, key: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async copyObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
    await this.client.send(new CopyObjectCommand({
      Bucket: destBucket,
      Key: destKey,
      CopySource: `${sourceBucket}/${sourceKey}`,
    }));
  }

  async headObject(bucket: string, key: string): Promise<{ size: number; lastModified: Date; metadata: Record<string, string> }> {
    const response = await this.client.send(new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    }));

    return {
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      metadata: (response.Metadata as Record<string, string>) || {},
    };
  }

  async createBucket(bucket: string, region?: string): Promise<void> {
    const commandInput: any = {
      Bucket: bucket,
    };
    
    // Only add LocationConstraint if region is provided and not us-east-1 (default)
    if (region && region !== 'us-east-1') {
      commandInput.CreateBucketConfiguration = {
        LocationConstraint: region as any,
      };
    }
    
    await this.client.send(new CreateBucketCommand(commandInput));
  }

  async deleteBucket(bucket: string): Promise<void> {
    await this.client.send(new DeleteBucketCommand({
      Bucket: bucket,
    }));
  }
}
