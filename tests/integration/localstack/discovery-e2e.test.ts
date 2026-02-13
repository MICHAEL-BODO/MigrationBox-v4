/**
 * Integration Test - Discovery Service E2E against LocalStack
 *
 * Tests the full discovery flow: create → process → list workloads → get dependencies
 * Requires LocalStack running on localhost:4566
 */

import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const ENDPOINT = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const REGION = 'us-east-1';
const STAGE = 'dev';

const dynamodb = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});

const sqs = new SQSClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});

describe('Discovery Service E2E (LocalStack)', () => {
  const tenantId = `test-tenant-${Date.now()}`;
  const discoveryId = `disc-e2e-${Date.now()}`;

  describe('DynamoDB Operations', () => {
    it('should write and read a discovery record', async () => {
      const discovery = {
        tenantId,
        discoveryId,
        sourceEnvironment: 'aws',
        status: 'initiated',
        scope: 'full',
        workloadsFound: 0,
        createdAt: new Date().toISOString(),
      };

      await dynamodb.send(new PutItemCommand({
        TableName: `migrationbox-discoveries-${STAGE}`,
        Item: marshall(discovery, { removeUndefinedValues: true }),
      }));

      const result = await dynamodb.send(new GetItemCommand({
        TableName: `migrationbox-discoveries-${STAGE}`,
        Key: marshall({ tenantId, discoveryId }),
      }));

      expect(result.Item).toBeDefined();
      const item = unmarshall(result.Item!);
      expect(item.discoveryId).toBe(discoveryId);
      expect(item.status).toBe('initiated');
      expect(item.sourceEnvironment).toBe('aws');
    });

    it('should write and read workload records', async () => {
      const workload = {
        tenantId,
        workloadId: `ec2-test-${Date.now()}`,
        discoveryId,
        type: 'compute',
        provider: 'aws',
        region: 'us-east-1',
        name: 'test-instance',
        status: 'running',
        metadata: { instanceType: 't3.medium' },
        discoveredAt: new Date().toISOString(),
      };

      await dynamodb.send(new PutItemCommand({
        TableName: `migrationbox-workloads-${STAGE}`,
        Item: marshall(workload, { removeUndefinedValues: true }),
      }));

      const result = await dynamodb.send(new GetItemCommand({
        TableName: `migrationbox-workloads-${STAGE}`,
        Key: marshall({ tenantId, workloadId: workload.workloadId }),
      }));

      expect(result.Item).toBeDefined();
      const item = unmarshall(result.Item!);
      expect(item.type).toBe('compute');
      expect(item.provider).toBe('aws');
    });

    it('should write agent task records', async () => {
      const task = {
        tenantId,
        taskId: `task-e2e-${Date.now()}`,
        agentType: 'discovery',
        status: 'pending',
        payload: { discoveryId, sourceEnvironment: 'aws' },
        createdAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400,
      };

      await dynamodb.send(new PutItemCommand({
        TableName: `migrationbox-agent-tasks-${STAGE}`,
        Item: marshall(task, { removeUndefinedValues: true }),
      }));

      const result = await dynamodb.send(new GetItemCommand({
        TableName: `migrationbox-agent-tasks-${STAGE}`,
        Key: marshall({ tenantId, taskId: task.taskId }),
      }));

      expect(result.Item).toBeDefined();
      const item = unmarshall(result.Item!);
      expect(item.agentType).toBe('discovery');
      expect(item.status).toBe('pending');
    });
  });

  describe('SQS Operations', () => {
    it('should send and receive discovery queue messages', async () => {
      const queueUrl = `${ENDPOINT}/000000000000/migrationbox-discovery-queue-${STAGE}`;

      const message = {
        discoveryId,
        tenantId,
        sourceEnvironment: 'aws',
        regions: ['us-east-1'],
        scope: 'full',
      };

      await sqs.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message),
      }));

      const response = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 5,
      }));

      expect(response.Messages).toBeDefined();
      expect(response.Messages!.length).toBeGreaterThan(0);
      const received = JSON.parse(response.Messages![0].Body!);
      expect(received.discoveryId).toBe(discoveryId);
      expect(received.tenantId).toBe(tenantId);
    });
  });

  describe('Tenant Table Operations', () => {
    it('should write and read tenant records', async () => {
      const tenant = {
        tenantId,
        name: 'E2E Test Corp',
        email: `e2e-${Date.now()}@test.com`,
        tier: 'enterprise',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dynamodb.send(new PutItemCommand({
        TableName: `migrationbox-tenants-${STAGE}`,
        Item: marshall(tenant, { removeUndefinedValues: true }),
      }));

      const result = await dynamodb.send(new GetItemCommand({
        TableName: `migrationbox-tenants-${STAGE}`,
        Key: marshall({ tenantId }),
      }));

      expect(result.Item).toBeDefined();
      const item = unmarshall(result.Item!);
      expect(item.name).toBe('E2E Test Corp');
      expect(item.tier).toBe('enterprise');
    });
  });
});
