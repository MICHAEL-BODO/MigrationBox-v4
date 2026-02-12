/**
 * MigrationBox V4.1 - LocalStack Integration Tests
 * 
 * Tests the Discovery service against LocalStack.
 * Requires LocalStack running on http://localhost:4566
 */

const { DynamoDBClient, PutItemCommand, GetItemCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, ListBucketsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const ENDPOINT = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const REGION = 'us-east-1';

const dynamoClient = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});

const s3Client = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});

describe('LocalStack Health', () => {
  test('DynamoDB is accessible', async () => {
    const response = await dynamoClient.send(new ListTablesCommand({}));
    expect(response.TableNames).toBeDefined();
    expect(Array.isArray(response.TableNames)).toBe(true);
  });

  test('S3 is accessible', async () => {
    const response = await s3Client.send(new ListBucketsCommand({}));
    expect(response.Buckets).toBeDefined();
    expect(Array.isArray(response.Buckets)).toBe(true);
  });
});

describe('Discovery Service - DynamoDB Operations', () => {
  const TABLE_NAME = 'migrationbox-test-workloads';

  beforeAll(async () => {
    try {
      const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
      await dynamoClient.send(new CreateTableCommand({
        TableName: TABLE_NAME,
        AttributeDefinitions: [
          { AttributeName: 'tenantId', AttributeType: 'S' },
          { AttributeName: 'workloadId', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'tenantId', KeyType: 'HASH' },
          { AttributeName: 'workloadId', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      }));
    } catch (e) {
      // Table may already exist
    }
  });

  test('can store a discovered workload', async () => {
    const item = {
      tenantId: { S: 'test-tenant' },
      workloadId: { S: 'wl-test-001' },
      name: { S: 'web-server-01' },
      type: { S: 'compute' },
      subtype: { S: 'ec2' },
      source: { S: 'aws' },
      discoveredAt: { S: new Date().toISOString() },
    };

    await dynamoClient.send(new PutItemCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));

    const result = await dynamoClient.send(new GetItemCommand({
      TableName: TABLE_NAME,
      Key: {
        tenantId: { S: 'test-tenant' },
        workloadId: { S: 'wl-test-001' },
      },
    }));

    expect(result.Item).toBeDefined();
    expect(result.Item.name.S).toBe('web-server-01');
    expect(result.Item.type.S).toBe('compute');
  });

  test('can store migration artifacts in S3', async () => {
    const BUCKET = 'migrationbox-test-artifacts';

    try {
      const { CreateBucketCommand } = require('@aws-sdk/client-s3');
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }));
    } catch (e) {
      // Bucket may already exist
    }

    const report = JSON.stringify({
      discoveryId: 'disc-test-001',
      workloads: 45,
      timestamp: new Date().toISOString(),
    });

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: 'reports/discovery-001.json',
      Body: report,
      ContentType: 'application/json',
    }));

    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const result = await s3Client.send(new GetObjectCommand({
      Bucket: BUCKET,
      Key: 'reports/discovery-001.json',
    }));

    const body = await result.Body.transformToString();
    const parsed = JSON.parse(body);
    expect(parsed.discoveryId).toBe('disc-test-001');
    expect(parsed.workloads).toBe(45);
  });
});
