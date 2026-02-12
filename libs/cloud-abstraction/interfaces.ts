/**
 * MigrationBox V5.0 - Cloud Abstraction Layer Interfaces
 * 
 * These TypeScript interfaces define the contract for all cloud provider adapters.
 * Business logic imports ONLY these interfaces, never cloud-specific SDKs.
 * 
 * All adapters support AWS, Azure, and GCP through a unified interface.
 */

import { CloudProvider } from '@migrationbox/types';

// ============================================================================
// Storage Adapter (S3 / Blob Storage / Cloud Storage)
// ============================================================================

export interface StorageAdapter {
  putObject(bucket: string, key: string, body: Buffer, metadata?: Record<string, string>): Promise<void>;
  getObject(bucket: string, key: string): Promise<{ body: Buffer; metadata: Record<string, string> }>;
  deleteObject(bucket: string, key: string): Promise<void>;
  listObjects(bucket: string, prefix: string, maxKeys?: number): Promise<string[]>;
  generatePresignedUrl(bucket: string, key: string, expiresIn: number): Promise<string>;
  copyObject(sourceBucket: string, sourceKey: string, destBucket: string, destKey: string): Promise<void>;
  headObject(bucket: string, key: string): Promise<{ size: number; lastModified: Date; metadata: Record<string, string> }>;
  createBucket(bucket: string, region?: string): Promise<void>;
  deleteBucket(bucket: string): Promise<void>;
}

// ============================================================================
// Database Adapter (DynamoDB / Cosmos DB / Firestore)
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
  transactWriteItems(transactions: Array<{ table: string; operation: 'put' | 'update' | 'delete'; item: Record<string, any> }>): Promise<void>;
}

// ============================================================================
// Messaging Adapter (SQS/SNS / Service Bus / Pub/Sub)
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
  createTopic(topicName: string): Promise<string>;
  subscribeQueueToTopic(topic: string, queue: string): Promise<void>;
}

// ============================================================================
// IAM Adapter (IAM / Azure AD / Cloud IAM)
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
  createRole(roleName: string, assumeRolePolicy: string, policies: string[]): Promise<{ roleArn: string }>;
  attachPolicyToRole(roleName: string, policyArn: string): Promise<void>;
}

// ============================================================================
// Compute Adapter (Lambda / Functions / Cloud Functions)
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
  createFunction(functionName: string, config: {
    runtime: string;
    handler: string;
    code: Buffer;
    memoryMB?: number;
    timeoutSeconds?: number;
    environment?: Record<string, string>;
  }): Promise<void>;
  updateFunctionCode(functionName: string, code: Buffer): Promise<void>;
  deleteFunction(functionName: string): Promise<void>;
}

// ============================================================================
// Monitoring Adapter (CloudWatch / Monitor / Logging)
// ============================================================================

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  dimensions?: Record<string, string>;
}

export interface Alarm {
  alarmName: string;
  metricName: string;
  threshold: number;
  comparisonOperator: 'GreaterThanThreshold' | 'LessThanThreshold' | 'GreaterThanOrEqualToThreshold' | 'LessThanOrEqualToThreshold';
  evaluationPeriods: number;
  period: number; // seconds
}

export interface MonitoringAdapter {
  putMetric(metric: Metric): Promise<void>;
  putMetrics(metrics: Metric[]): Promise<void>;
  getMetricStatistics(
    metricName: string,
    startTime: Date,
    endTime: Date,
    period: number,
    statistics: string[]
  ): Promise<Array<{ timestamp: Date; value: number }>>;
  createAlarm(alarm: Alarm): Promise<void>;
  deleteAlarm(alarmName: string): Promise<void>;
  listAlarms(): Promise<Alarm[]>;
  describeAlarm(alarmName: string): Promise<Alarm & { state: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA' }>;
}

// ============================================================================
// Secrets Adapter (Secrets Manager / Key Vault / Secret Manager)
// ============================================================================

export interface Secret {
  name: string;
  value: string;
  description?: string;
  tags?: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SecretsAdapter {
  createSecret(name: string, value: string, description?: string, tags?: Record<string, string>): Promise<void>;
  getSecret(name: string): Promise<Secret>;
  updateSecret(name: string, value: string): Promise<void>;
  deleteSecret(name: string): Promise<void>;
  listSecrets(prefix?: string): Promise<string[]>;
  rotateSecret(name: string): Promise<void>;
}

// ============================================================================
// Network Adapter (VPC / VNet / VPC)
// ============================================================================

export interface VPC {
  id: string;
  name: string;
  cidr: string;
  region: string;
  subnets: Subnet[];
  securityGroups: SecurityGroup[];
}

export interface Subnet {
  id: string;
  name: string;
  cidr: string;
  availabilityZone: string;
  public: boolean;
}

export interface SecurityGroup {
  id: string;
  name: string;
  description: string;
  rules: SecurityGroupRule[];
}

export interface SecurityGroupRule {
  type: 'ingress' | 'egress';
  protocol: string;
  port: number;
  source: string; // CIDR or security group ID
}

export interface NetworkAdapter {
  createVPC(name: string, cidr: string): Promise<VPC>;
  getVPC(vpcId: string): Promise<VPC>;
  listVPCs(): Promise<VPC[]>;
  deleteVPC(vpcId: string): Promise<void>;
  createSubnet(vpcId: string, name: string, cidr: string, availabilityZone: string, public?: boolean): Promise<Subnet>;
  createSecurityGroup(vpcId: string, name: string, description: string): Promise<SecurityGroup>;
  addSecurityGroupRule(securityGroupId: string, rule: SecurityGroupRule): Promise<void>;
  removeSecurityGroupRule(securityGroupId: string, rule: SecurityGroupRule): Promise<void>;
}

// ============================================================================
// Factory Pattern
// ============================================================================

export interface AdapterFactory {
  getStorageAdapter(provider?: CloudProvider): StorageAdapter;
  getDatabaseAdapter(provider?: CloudProvider): DatabaseAdapter;
  getMessagingAdapter(provider?: CloudProvider): MessagingAdapter;
  getIAMAdapter(provider?: CloudProvider): IAMAdapter;
  getComputeAdapter(provider?: CloudProvider): ComputeAdapter;
  getMonitoringAdapter(provider?: CloudProvider): MonitoringAdapter;
  getSecretsAdapter(provider?: CloudProvider): SecretsAdapter;
  getNetworkAdapter(provider?: CloudProvider): NetworkAdapter;
}
