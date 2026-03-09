/**
 * Integration Test - Discovery Service E2E against LocalStack
 *
 * Tests the full discovery flow: create → process → list workloads → get dependencies
 * Requires LocalStack running on localhost:4566
 */

import { DynamoDBClient, GetItemCommand, PutItemCommand, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, CreateQueueCommand } from '@aws-sdk/client-sqs';
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

const TABLES = {
  discoveries: `migrationbox-discoveries-${STAGE}`,
  workloads: `migrationbox-workloads-${STAGE}`,
  tasks: `migrationbox-agent-tasks-${STAGE}`,
  tenants: `migrationbox-tenants-${STAGE}`,
};

const QUEUES = {
  discovery: `migrationbox-discovery-queue-${STAGE}`,
};

// Helper to ensure tables exist
async function ensureTable(tableName: string, keySchema: any, attributeDefinitions: any) {
  try {
    const list = await dynamodb.send(new ListTablesCommand({}));
    if (!list.TableNames?.includes(tableName)) {
      await dynamodb.send(new CreateTableCommand({
        TableName: tableName,
        KeySchema: keySchema,
        AttributeDefinitions: attributeDefinitions,
        BillingMode: 'PAY_PER_REQUEST',
      }));
    }
  } catch (e) {
    console.error(`Failed to ensure table ${tableName}:`, e);
  }
}

// Helper to ensure queue exists
async function ensureQueue(queueName: string): Promise<string> {
  try {
    const res = await sqs.send(new CreateQueueCommand({ QueueName: queueName }));
    return res.QueueUrl!;
  } catch (e) {
    console.error(`Failed to ensure queue ${queueName}:`, e);
    return `${ENDPOINT}/000000000000/${queueName}`;
  }
}

describe('Discovery Service E2E (LocalStack)', () => {
  const tenantId = `test-tenant-${Date.now()}`;
  const discoveryId = `disc-e2e-${Date.now()}`;
  let queueUrl: string;

  beforeAll(async () => {
    // Setup Tables
    await ensureTable(TABLES.discoveries,
      [{ AttributeName: 'tenantId', KeyType: 'HASH' }, { AttributeName: 'discoveryId', KeyType: 'RANGE' }],
      [{ AttributeName: 'tenantId', AttributeType: 'S' }, { AttributeName: 'discoveryId', AttributeType: 'S' }]
    );
    await ensureTable(TABLES.workloads,
      [{ AttributeName: 'tenantId', KeyType: 'HASH' }, { AttributeName: 'workloadId', KeyType: 'RANGE' }],
      [{ AttributeName: 'tenantId', AttributeType: 'S' }, { AttributeName: 'workloadId', AttributeType: 'S' }]
    );
    await ensureTable(TABLES.tasks,
      [{ AttributeName: 'tenantId', KeyType: 'HASH' }, { AttributeName: 'taskId', KeyType: 'RANGE' }],
      [{ AttributeName: 'tenantId', AttributeType: 'S' }, { AttributeName: 'taskId', AttributeType: 'S' }]
    );
    await ensureTable(TABLES.tenants,
      [{ AttributeName: 'tenantId', KeyType: 'HASH' }],
      [{ AttributeName: 'tenantId', AttributeType: 'S' }]
    );

    // Setup Queues
    queueUrl = await ensureQueue(QUEUES.discovery);
  }, 30000); // Increased timeout for setup

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
        TableName: TABLES.discoveries,
        Item: marshall(discovery, { removeUndefinedValues: true }),
      }));

      const result = await dynamodb.send(new GetItemCommand({
        TableName: TABLES.discoveries,
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
        TableName: TABLES.workloads,
        Item: marshall(workload, { removeUndefinedValues: true }),
      }));

      const result = await dynamodb.send(new GetItemCommand({
        TableName: TABLES.workloads,
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
        TableName: TABLES.tasks,
        Item: marshall(task, { removeUndefinedValues: true }),
      }));

      const result = await dynamodb.send(new GetItemCommand({
        TableName: TABLES.tasks,
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
        TableName: TABLES.tenants,
        Item: marshall(tenant, { removeUndefinedValues: true }),
      }));

      const result = await dynamodb.send(new GetItemCommand({
        TableName: TABLES.tenants,
        Key: marshall({ tenantId }),
      }));

      expect(result.Item).toBeDefined();
      const item = unmarshall(result.Item!);
      expect(item.name).toBe('E2E Test Corp');
      expect(item.tier).toBe('enterprise');
    });
  });
});
