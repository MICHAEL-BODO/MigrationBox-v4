/**
 * MigrationBox V5.0 - AWS DynamoDB Adapter Unit Tests
 */

import { AWSDynamoDBAdapter } from '../../../../libs/cloud-abstraction/database/aws-dynamodb-adapter';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb', () => {
  const mockSend = jest.fn();
  return {
    DynamoDBClient: jest.fn(() => ({
      send: mockSend,
    })),
    PutItemCommand: jest.fn(),
    GetItemCommand: jest.fn(),
    QueryCommand: jest.fn(),
    UpdateItemCommand: jest.fn(),
    DeleteItemCommand: jest.fn(),
    ScanCommand: jest.fn(),
    BatchWriteItemCommand: jest.fn(),
    BatchGetItemCommand: jest.fn(),
    TransactWriteItemsCommand: jest.fn(),
  };
});

jest.mock('@aws-sdk/util-dynamodb', () => ({
  marshall: jest.fn((item) => item),
  unmarshall: jest.fn((item) => item),
}));

describe('AWSDynamoDBAdapter', () => {
  let adapter: AWSDynamoDBAdapter;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new AWSDynamoDBAdapter();
    const DynamoDBClientMock = DynamoDBClient as jest.MockedClass<typeof DynamoDBClient>;
    const instance = DynamoDBClientMock.mock.results[DynamoDBClientMock.mock.results.length - 1].value;
    mockSend = instance.send as jest.Mock;
  });

  describe('putItem', () => {
    it('should put an item to DynamoDB', async () => {
      mockSend.mockResolvedValue({});

      await adapter.putItem('test-table', { tenantId: 't1', workloadId: 'w1', name: 'test' });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(PutItemCommand).toHaveBeenCalled();
    });
  });

  describe('getItem', () => {
    it('should get an item from DynamoDB', async () => {
      mockSend.mockResolvedValue({
        Item: { tenantId: 't1', workloadId: 'w1', name: 'test' },
      });

      const result = await adapter.getItem('test-table', { tenantId: 't1', workloadId: 'w1' });

      expect(result).toEqual({ tenantId: 't1', workloadId: 'w1', name: 'test' });
    });

    it('should return null if item not found', async () => {
      mockSend.mockResolvedValue({});

      const result = await adapter.getItem('test-table', { tenantId: 't1', workloadId: 'w1' });

      expect(result).toBeNull();
    });
  });

  describe('queryItems', () => {
    it('should query items from DynamoDB', async () => {
      mockSend.mockResolvedValue({
        Items: [
          { tenantId: 't1', workloadId: 'w1' },
          { tenantId: 't1', workloadId: 'w2' },
        ],
      });

      const result = await adapter.queryItems(
        'test-table',
        'tenantId = :tenantId',
        { ':tenantId': 't1' }
      );

      expect(result).toHaveLength(2);
    });
  });
});
