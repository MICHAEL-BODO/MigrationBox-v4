/**
 * MigrationBox V5.0 - Seed Data Script
 *
 * Seeds realistic test data into LocalStack DynamoDB for development.
 * Run: npx ts-node scripts/seed-data.ts
 */

import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

const STAGE = 'dev';
const APP = 'migrationbox';

async function putItem(tableName: string, item: Record<string, any>) {
  await client.send(new PutItemCommand({
    TableName: tableName,
    Item: marshall(item, { removeUndefinedValues: true }),
  }));
}

async function seedTenants() {
  console.log('Seeding tenants...');
  const tenants = [
    {
      tenantId: 'tenant-001',
      name: 'Acme Corporation',
      email: 'admin@acme.com',
      tier: 'enterprise',
      status: 'active',
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: '2026-02-12T00:00:00Z',
    },
    {
      tenantId: 'tenant-002',
      name: 'TechStart GmbH',
      email: 'ops@techstart.de',
      tier: 'professional',
      status: 'active',
      createdAt: '2026-02-05T00:00:00Z',
      updatedAt: '2026-02-12T00:00:00Z',
    },
    {
      tenantId: 'tenant-demo',
      name: 'Demo Company',
      email: 'demo@migrationbox.io',
      tier: 'starter',
      status: 'active',
      createdAt: '2026-02-12T00:00:00Z',
      updatedAt: '2026-02-12T00:00:00Z',
    },
  ];

  for (const t of tenants) {
    await putItem(`${APP}-tenants-${STAGE}`, t);
  }
  console.log(`  Seeded ${tenants.length} tenants`);
}

async function seedDiscoveries() {
  console.log('Seeding discoveries...');
  const discoveries = [
    {
      tenantId: 'tenant-001',
      discoveryId: 'disc-001',
      sourceEnvironment: 'aws',
      status: 'complete',
      scope: 'full',
      workloadsFound: 12,
      createdAt: '2026-02-10T10:00:00Z',
      completedAt: '2026-02-10T10:15:00Z',
    },
    {
      tenantId: 'tenant-001',
      discoveryId: 'disc-002',
      sourceEnvironment: 'azure',
      status: 'complete',
      scope: 'partial',
      workloadsFound: 5,
      createdAt: '2026-02-11T14:00:00Z',
      completedAt: '2026-02-11T14:08:00Z',
    },
    {
      tenantId: 'tenant-002',
      discoveryId: 'disc-003',
      sourceEnvironment: 'aws',
      status: 'running',
      scope: 'full',
      workloadsFound: 0,
      createdAt: '2026-02-12T09:00:00Z',
    },
  ];

  for (const d of discoveries) {
    await putItem(`${APP}-discoveries-${STAGE}`, d);
  }
  console.log(`  Seeded ${discoveries.length} discoveries`);
}

async function seedWorkloads() {
  console.log('Seeding workloads...');
  const workloads = [
    // Tenant-001, Discovery disc-001 (AWS)
    { tenantId: 'tenant-001', workloadId: 'ec2-web-001', discoveryId: 'disc-001', type: 'compute', provider: 'aws', region: 'us-east-1', name: 'web-server-prod', status: 'running', metadata: { instanceType: 't3.large', ami: 'ami-0abc123', vpcId: 'vpc-001' }, dependencies: ['rds-main-001', 'elb-web-001'], discoveredAt: '2026-02-10T10:02:00Z' },
    { tenantId: 'tenant-001', workloadId: 'ec2-web-002', discoveryId: 'disc-001', type: 'compute', provider: 'aws', region: 'us-east-1', name: 'web-server-prod-2', status: 'running', metadata: { instanceType: 't3.large', ami: 'ami-0abc123', vpcId: 'vpc-001' }, dependencies: ['rds-main-001', 'elb-web-001'], discoveredAt: '2026-02-10T10:02:00Z' },
    { tenantId: 'tenant-001', workloadId: 'rds-main-001', discoveryId: 'disc-001', type: 'database', provider: 'aws', region: 'us-east-1', name: 'main-database', status: 'available', metadata: { engine: 'postgresql', version: '15.4', instanceClass: 'db.r6g.large', multiAZ: true }, dependencies: [], discoveredAt: '2026-02-10T10:03:00Z' },
    { tenantId: 'tenant-001', workloadId: 'elb-web-001', discoveryId: 'disc-001', type: 'network', provider: 'aws', region: 'us-east-1', name: 'web-load-balancer', status: 'active', metadata: { type: 'application', scheme: 'internet-facing' }, dependencies: ['ec2-web-001', 'ec2-web-002'], discoveredAt: '2026-02-10T10:03:00Z' },
    { tenantId: 'tenant-001', workloadId: 's3-assets-001', discoveryId: 'disc-001', type: 'storage', provider: 'aws', region: 'us-east-1', name: 'assets-bucket', status: 'active', metadata: { versioning: true, encryption: 'AES256' }, dependencies: [], discoveredAt: '2026-02-10T10:04:00Z' },
    { tenantId: 'tenant-001', workloadId: 'lambda-api-001', discoveryId: 'disc-001', type: 'serverless', provider: 'aws', region: 'us-east-1', name: 'api-handler', status: 'active', metadata: { runtime: 'nodejs20.x', memory: 512, timeout: 30 }, dependencies: ['rds-main-001', 's3-assets-001', 'dynamodb-sessions-001'], discoveredAt: '2026-02-10T10:05:00Z' },
    { tenantId: 'tenant-001', workloadId: 'dynamodb-sessions-001', discoveryId: 'disc-001', type: 'database', provider: 'aws', region: 'us-east-1', name: 'sessions-table', status: 'active', metadata: { billingMode: 'PAY_PER_REQUEST', itemCount: 15000 }, dependencies: [], discoveredAt: '2026-02-10T10:05:00Z' },
    { tenantId: 'tenant-001', workloadId: 'vpc-main-001', discoveryId: 'disc-001', type: 'network', provider: 'aws', region: 'us-east-1', name: 'main-vpc', status: 'available', metadata: { cidr: '10.0.0.0/16', subnets: 6 }, dependencies: [], discoveredAt: '2026-02-10T10:01:00Z' },
    { tenantId: 'tenant-001', workloadId: 'sqs-orders-001', discoveryId: 'disc-001', type: 'application', provider: 'aws', region: 'us-east-1', name: 'order-processing-queue', status: 'active', metadata: { messageCount: 230, dlqArn: 'arn:aws:sqs:us-east-1:123:orders-dlq' }, dependencies: ['lambda-api-001'], discoveredAt: '2026-02-10T10:06:00Z' },
    { tenantId: 'tenant-001', workloadId: 'ecs-workers-001', discoveryId: 'disc-001', type: 'container', provider: 'aws', region: 'us-east-1', name: 'worker-cluster', status: 'active', metadata: { launchType: 'FARGATE', desiredCount: 3, taskDefinition: 'worker:12' }, dependencies: ['rds-main-001', 'sqs-orders-001'], discoveredAt: '2026-02-10T10:07:00Z' },
    { tenantId: 'tenant-001', workloadId: 'cloudwatch-001', discoveryId: 'disc-001', type: 'application', provider: 'aws', region: 'us-east-1', name: 'monitoring-dashboards', status: 'active', metadata: { alarms: 8, dashboards: 3 }, dependencies: [], discoveredAt: '2026-02-10T10:08:00Z' },
    { tenantId: 'tenant-001', workloadId: 'route53-001', discoveryId: 'disc-001', type: 'network', provider: 'aws', region: 'us-east-1', name: 'acme-dns', status: 'active', metadata: { hostedZone: 'acme.com', recordCount: 24 }, dependencies: ['elb-web-001'], discoveredAt: '2026-02-10T10:08:00Z' },

    // Tenant-002 (smaller deployment)
    { tenantId: 'tenant-002', workloadId: 'ec2-app-001', discoveryId: 'disc-003', type: 'compute', provider: 'aws', region: 'eu-west-1', name: 'app-server', status: 'running', metadata: { instanceType: 't3.medium', ami: 'ami-0def456' }, dependencies: ['rds-app-001'], discoveredAt: '2026-02-12T09:02:00Z' },
    { tenantId: 'tenant-002', workloadId: 'rds-app-001', discoveryId: 'disc-003', type: 'database', provider: 'aws', region: 'eu-west-1', name: 'app-database', status: 'available', metadata: { engine: 'mysql', version: '8.0', instanceClass: 'db.t3.medium' }, dependencies: [], discoveredAt: '2026-02-12T09:03:00Z' },
  ];

  for (const w of workloads) {
    await putItem(`${APP}-workloads-${STAGE}`, w);
  }
  console.log(`  Seeded ${workloads.length} workloads`);
}

async function seedAgentTasks() {
  console.log('Seeding agent tasks...');
  const tasks = [
    {
      tenantId: 'tenant-001',
      taskId: 'task-001',
      agentType: 'discovery',
      status: 'completed',
      payload: { discoveryId: 'disc-001', sourceEnvironment: 'aws' },
      result: { workloadsFound: 12, regions: ['us-east-1'] },
      createdAt: '2026-02-10T10:00:00Z',
      startedAt: '2026-02-10T10:00:05Z',
      completedAt: '2026-02-10T10:15:00Z',
      ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
    },
    {
      tenantId: 'tenant-002',
      taskId: 'task-002',
      agentType: 'discovery',
      status: 'running',
      migrationId: 'N/A',
      payload: { discoveryId: 'disc-003', sourceEnvironment: 'aws' },
      createdAt: '2026-02-12T09:00:00Z',
      startedAt: '2026-02-12T09:00:03Z',
      ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    },
  ];

  for (const t of tasks) {
    await putItem(`${APP}-agent-tasks-${STAGE}`, t);
  }
  console.log(`  Seeded ${tasks.length} agent tasks`);
}

async function main() {
  console.log('============================================');
  console.log(' MigrationBox V5.0 - Seeding Test Data');
  console.log('============================================\n');

  try {
    await seedTenants();
    await seedDiscoveries();
    await seedWorkloads();
    await seedAgentTasks();

    console.log('\n============================================');
    console.log(' Seed Complete!');
    console.log('============================================');
  } catch (error: any) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

main();
