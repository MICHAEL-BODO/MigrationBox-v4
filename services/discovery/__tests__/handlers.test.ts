/**
 * Unit Tests - Discovery Lambda Handlers
 */

// Mock the CAL adapters before importing handlers
jest.mock('@migrationbox/cal', () => ({
  getDatabaseAdapter: jest.fn(() => ({
    putItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    queryItems: jest.fn().mockResolvedValue({ items: [] }),
    updateItem: jest.fn().mockResolvedValue(undefined),
  })),
  getMessagingAdapter: jest.fn(() => ({
    sendMessage: jest.fn().mockResolvedValue(undefined),
    publishEvent: jest.fn().mockResolvedValue(undefined),
  })),
}));

import { handler as startDiscovery } from '../handlers/start-discovery';
import { handler as getDiscovery } from '../handlers/get-discovery';
import { handler as listWorkloads } from '../handlers/list-workloads';

function makeEvent(overrides: Partial<any> = {}): any {
  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    ...overrides,
  };
}

describe('startDiscovery handler', () => {
  it('should return 400 if tenantId is missing', async () => {
    const event = makeEvent({
      httpMethod: 'POST',
      body: JSON.stringify({ sourceEnvironment: 'aws' }),
    });
    const result = await startDiscovery(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('MISSING_TENANT_ID');
  });

  it('should return 400 if sourceEnvironment is invalid', async () => {
    const event = makeEvent({
      httpMethod: 'POST',
      body: JSON.stringify({ tenantId: 'tenant-001', sourceEnvironment: 'oracle' }),
    });
    const result = await startDiscovery(event);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error.code).toBe('INVALID_SOURCE');
  });

  it('should return 201 with discovery on success', async () => {
    const event = makeEvent({
      httpMethod: 'POST',
      body: JSON.stringify({
        tenantId: 'tenant-001',
        sourceEnvironment: 'aws',
        regions: ['us-east-1'],
      }),
    });
    const result = await startDiscovery(event);
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    expect(body.data.discoveryId).toMatch(/^disc-/);
    expect(body.data.status).toBe('initiated');
  });

  it('should include CORS headers', async () => {
    const event = makeEvent({
      httpMethod: 'POST',
      body: JSON.stringify({ tenantId: 'tenant-001', sourceEnvironment: 'aws' }),
    });
    const result = await startDiscovery(event);
    expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
  });
});

describe('getDiscovery handler', () => {
  it('should return 400 if discovery ID is missing', async () => {
    const event = makeEvent({ pathParameters: null });
    const result = await getDiscovery(event);
    expect(result.statusCode).toBe(400);
  });

  it('should return 400 if tenantId is missing', async () => {
    const event = makeEvent({ pathParameters: { id: 'disc-001' } });
    const result = await getDiscovery(event);
    expect(result.statusCode).toBe(400);
  });

  it('should return 404 when discovery not found', async () => {
    const event = makeEvent({
      pathParameters: { id: 'disc-999' },
      queryStringParameters: { tenantId: 'tenant-001' },
    });
    const result = await getDiscovery(event);
    expect(result.statusCode).toBe(404);
  });
});

describe('listWorkloads handler', () => {
  it('should return 400 if discovery ID is missing', async () => {
    const event = makeEvent({ pathParameters: null });
    const result = await listWorkloads(event);
    expect(result.statusCode).toBe(400);
  });

  it('should return 200 with empty workloads', async () => {
    const event = makeEvent({
      pathParameters: { id: 'disc-001' },
      queryStringParameters: { tenantId: 'tenant-001' },
    });
    const result = await listWorkloads(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.success).toBe(true);
    expect(body.pagination).toBeDefined();
  });
});
