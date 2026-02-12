/**
 * MigrationBox V4.1 - Cloud Abstraction Layer Interfaces
 * 
 * These TypeScript interfaces define the contract for all cloud provider adapters.
 * Business logic imports ONLY these interfaces, never cloud-specific SDKs.
 */

// ============================================================================
// Storage Adapter
// ============================================================================

export interface StorageAdapter {
  putObject(bucket: string, key: string, body: Buffer, metadata?: Record<string, string>): Promise<void>;
  getObject(bucket: string, key: string): Promise<{ body: Buffer; metadata: Record<string, string> }>;
  deleteObject(bucket: string, key: string): Promise<void>;
  listObjects(bucket: string, prefix: string, maxKeys?: number): Promise<string[]>;
  generatePresignedUrl(bucket: string, key: string, expiresIn: number): Promise<string>;
  copyObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void>;
  headObject(bucket: string, key: string): Promise<{ size: number; lastModified: Date; metadata: Record<string, string> }>;
}

// ============================================================================
// Database Adapter
// ============================================================================

export interface DatabaseAdapter {
  putItem(table: string, item: Record<string, any>): Promise<void>;
  getItem(table: string, key: Record<string, any>): Promise<Record<string, any> | null>;
  queryItems(table: string, keyCondition: string, values: Record<string, any>, indexName?: string): Promise<Record<string, any>[]>;
  updateItem(table: string, key: Record<string, any>, updates: Record<string, any>): Promise<void>;
  deleteItem(table: string, key: Record<string, any>): Promise<void>;
  scanItems(table: string, filter?: string, values?: Record<string, any>): Promise<Record<string, any>[]>;
  batchWriteItems(table: string, items: Record<string, any>[]): Promise<void>;
  batchGetItems(table: string, keys: Record<string, any>[]): Promise<Record<string, any>[]>;
}

// ============================================================================
// Messaging Adapter
// ============================================================================

export interface Message {
  id: string;
  body: Record<string, any>;
  receiptHandle: string;
  attributes?: Record<string, string>;
  receivedAt: Date;
}

export interface MessagingAdapter {
  sendMessage(queue: string, message: Record<string, any>, delaySeconds?: number): Promise<string>;
  receiveMessages(queue: string, maxMessages?: number, waitTimeSeconds?: number): Promise<Message[]>;
  deleteMessage(queue: string, receiptHandle: string): Promise<void>;
  publishEvent(topic: string, event: Record<string, any>, eventType: string): Promise<void>;
  createQueue(queueName: string, options?: { fifo?: boolean; dlqArn?: string; maxRetries?: number }): Promise<string>;
}

// ============================================================================
// IAM Adapter
// ============================================================================

export interface Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiresAt: Date;
}

export interface IAMAdapter {
  assumeRole(roleArn: string, sessionName: string, durationSeconds?: number): Promise<Credentials>;
  validatePermissions(requiredPermissions: string[]): Promise<{ granted: string[]; denied: string[] }>;
  createServiceAccount(name: string, policies: string[]): Promise<{ id: string; credentials: Credentials }>;
  getCallerIdentity(): Promise<{ accountId: string; arn: string; userId: string }>;
}

// ============================================================================
// Compute Adapter
// ============================================================================

export interface FunctionInfo {
  name: string;
  runtime: string;
  memoryMB: number;
  timeoutSeconds: number;
  lastModified: Date;
  codeSize: number;
}

export interface LogEntry {
  timestamp: Date;
  message: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
}

export interface ComputeAdapter {
  invokeFunction(functionName: string, payload: Record<string, any>): Promise<{ statusCode: number; body: any }>;
  listFunctions(): Promise<FunctionInfo[]>;
  getFunctionLogs(functionName: string, startTime: Date, endTime: Date): Promise<LogEntry[]>;
}

// ============================================================================
// Factory Pattern
// ============================================================================

export type CloudProvider = 'aws' | 'azure' | 'gcp';

export interface AdapterFactory {
  getStorageAdapter(provider?: CloudProvider): StorageAdapter;
  getDatabaseAdapter(provider?: CloudProvider): DatabaseAdapter;
  getMessagingAdapter(provider?: CloudProvider): MessagingAdapter;
  getIAMAdapter(provider?: CloudProvider): IAMAdapter;
  getComputeAdapter(provider?: CloudProvider): ComputeAdapter;
}
