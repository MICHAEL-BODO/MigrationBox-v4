/**
 * MigrationBox V5.0 - Azure Blob Storage Adapter
 * 
 * Implements StorageAdapter interface using Azure Storage Blob SDK.
 */

import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { StorageAdapter } from '../../../packages/cal/src/interfaces';

export class AzureBlobAdapter implements StorageAdapter {
  private client: BlobServiceClient;
  private accountName: string;
  private accountKey: string;

  constructor() {
    this.accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
    this.accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
    
    if (!this.accountName || !this.accountKey) {
      throw new Error('Azure Storage credentials not configured. Set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY');
    }

    const credential = new StorageSharedKeyCredential(this.accountName, this.accountKey);
    this.client = BlobServiceClient.fromStorageAccountInfo({
      accountName: this.accountName,
      accountKey: this.accountKey,
    });
  }

  async putObject(bucket: string, key: string, body: Buffer, metadata?: Record<string, string>): Promise<void> {
    const containerClient = this.client.getContainerClient(bucket);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    
    await blockBlobClient.upload(body, body.length, {
      metadata: metadata || {},
    });
  }

  async getObject(bucket: string, key: string): Promise<{ body: Buffer; metadata: Record<string, string> }> {
    const containerClient = this.client.getContainerClient(bucket);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    
    const downloadResponse = await blockBlobClient.download(0);
    const chunks: Uint8Array[] = [];
    
    if (downloadResponse.readableStreamBody) {
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(chunk);
      }
    }
    
    const body = Buffer.concat(chunks);
    const metadata = downloadResponse.metadata || {};
    
    return { body, metadata };
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    const containerClient = this.client.getContainerClient(bucket);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    await blockBlobClient.delete();
  }

  async listObjects(bucket: string, prefix: string, maxKeys?: number): Promise<string[]> {
    const containerClient = this.client.getContainerClient(bucket);
    const keys: string[] = [];
    
    for await (const blob of containerClient.listBlobsFlat({ prefix, maxResults: maxKeys })) {
      keys.push(blob.name);
    }
    
    return keys;
  }

  async generatePresignedUrl(bucket: string, key: string, expiresIn: number): Promise<string> {
    const containerClient = this.client.getContainerClient(bucket);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    
    const sasUrl = await blockBlobClient.generateSasUrl({
      permissions: 'r',
      expiresOn: new Date(Date.now() + expiresIn * 1000),
    });
    
    return sasUrl;
  }

  async copyObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void> {
    const sourceContainer = this.client.getContainerClient(sourceBucket);
    const destContainer = this.client.getContainerClient(destBucket);
    const sourceBlob = sourceContainer.getBlockBlobClient(sourceKey);
    const destBlob = destContainer.getBlockBlobClient(destKey);
    
    const sourceUrl = sourceBlob.url;
    await destBlob.beginCopyFromURL(sourceUrl);
  }

  async headObject(bucket: string, key: string): Promise<{ size: number; lastModified: Date; metadata: Record<string, string> }> {
    const containerClient = this.client.getContainerClient(bucket);
    const blockBlobClient = containerClient.getBlockBlobClient(key);
    const properties = await blockBlobClient.getProperties();
    
    return {
      size: properties.contentLength || 0,
      lastModified: properties.lastModified || new Date(),
      metadata: properties.metadata || {},
    };
  }

  async createBucket(bucket: string, region?: string): Promise<void> {
    const containerClient = this.client.getContainerClient(bucket);
    await containerClient.create({
      access: 'blob',
    });
  }

  async deleteBucket(bucket: string): Promise<void> {
    const containerClient = this.client.getContainerClient(bucket);
    await containerClient.delete();
  }
}
