/**
 * MigrationBox V5.0 - AWS DynamoDB Adapter
 * 
 * Implements DatabaseAdapter interface using AWS SDK v3 for DynamoDB.
 * Works with both real AWS and LocalStack (via AWS_ENDPOINT_URL).
 */

import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  ScanCommand,
  BatchWriteItemCommand,
  BatchGetItemCommand,
  TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { DatabaseAdapter } from '../../../packages/cal/src/interfaces';

export class AWSDynamoDBAdapter implements DatabaseAdapter {
  private client: DynamoDBClient;

  constructor() {
    const config: any = {
      region: process.env.AWS_DEFAULT_REGION || process.env.REGION || 'us-east-1',
    };

    // Support LocalStack endpoint
    if (process.env.AWS_ENDPOINT_URL) {
      config.endpoint = process.env.AWS_ENDPOINT_URL;
    }

    this.client = new DynamoDBClient(config);
  }

  async putItem(table: string, item: Record<string, any>): Promise<void> {
    await this.client.send(new PutItemCommand({
      TableName: table,
      Item: marshall(item),
    }));
  }

  async getItem(table: string, key: Record<string, any>): Promise<Record<string, any> | null> {
    const response = await this.client.send(new GetItemCommand({
      TableName: table,
      Key: marshall(key),
    }));

    if (!response.Item) {
      return null;
    }

    return unmarshall(response.Item);
  }

  async queryItems(
    table: string,
    keyCondition: string,
    values: Record<string, any>,
    indexName?: string
  ): Promise<Record<string, any>[]> {
    // Parse keyCondition (e.g., "tenantId = :tenantId AND begins_with(workloadId, :prefix)")
    const expressionAttributeValues: Record<string, any> = {};

    // Simple parser - in production, use a proper query builder
    let keyConditionExpression = keyCondition;
    for (const [key, value] of Object.entries(values)) {
      const placeholder = key.startsWith(':') ? key : `:${key}`;
      expressionAttributeValues[placeholder] = value;
    }

    const response = await this.client.send(new QueryCommand({
      TableName: table,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
      ...(indexName && { IndexName: indexName }),
    }));

    return (response.Items || []).map(item => unmarshall(item));
  }

  async updateItem(table: string, key: Record<string, any>, updates: Record<string, any>): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    let attrCounter = 0;
    for (const [field, value] of Object.entries(updates)) {
      const nameKey = `#attr${attrCounter}`;
      const valueKey = `:val${attrCounter}`;
      expressionAttributeNames[nameKey] = field;
      expressionAttributeValues[valueKey] = value;
      updateExpressions.push(`${nameKey} = ${valueKey}`);
      attrCounter++;
    }

    await this.client.send(new UpdateItemCommand({
      TableName: table,
      Key: marshall(key),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues),
    }));
  }

  async deleteItem(table: string, key: Record<string, any>): Promise<void> {
    await this.client.send(new DeleteItemCommand({
      TableName: table,
      Key: marshall(key),
    }));
  }

  async scanItems(table: string, filter?: string, values?: Record<string, any>): Promise<Record<string, any>[]> {
    const command: any = {
      TableName: table,
    };

    if (filter && values) {
      command.FilterExpression = filter;
      command.ExpressionAttributeValues = marshall(values);
    }

    const response = await this.client.send(new ScanCommand(command));
    return (response.Items || []).map(item => unmarshall(item));
  }

  async batchWriteItems(table: string, items: Record<string, any>[]): Promise<void> {
    const putRequests = items.map(item => ({
      PutRequest: {
        Item: marshall(item),
      },
    }));

    // DynamoDB batch write limit is 25 items
    for (let i = 0; i < putRequests.length; i += 25) {
      const batch = putRequests.slice(i, i + 25);
      await this.client.send(new BatchWriteItemCommand({
        RequestItems: {
          [table]: batch,
        },
      }));
    }
  }

  async batchGetItems(table: string, keys: Record<string, any>[]): Promise<Record<string, any>[]> {
    // DynamoDB batch get limit is 100 items
    const results: Record<string, any>[] = [];
    for (let i = 0; i < keys.length; i += 100) {
      const batch = keys.slice(i, i + 100).map(key => marshall(key));
      const response = await this.client.send(new BatchGetItemCommand({
        RequestItems: {
          [table]: {
            Keys: batch,
          },
        },
      }));

      if (response.Responses && response.Responses[table]) {
        results.push(...response.Responses[table].map(item => unmarshall(item)));
      }
    }

    return results;
  }

  async transactWriteItems(
    transactions: Array<{ table: string; operation: 'put' | 'update' | 'delete'; item: Record<string, any> }>
  ): Promise<void> {
    const transactItems = transactions.map(txn => {
      if (txn.operation === 'put') {
        return {
          Put: {
            TableName: txn.table,
            Item: marshall(txn.item),
          },
        };
      } else if (txn.operation === 'update') {
        // For update, item should contain key and updates separately
        const { key, updates } = txn.item;
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        let attrCounter = 0;
        for (const [field, value] of Object.entries(updates)) {
          const nameKey = `#attr${attrCounter}`;
          const valueKey = `:val${attrCounter}`;
          expressionAttributeNames[nameKey] = field;
          expressionAttributeValues[valueKey] = value;
          updateExpressions.push(`${nameKey} = ${valueKey}`);
          attrCounter++;
        }

        return {
          Update: {
            TableName: txn.table,
            Key: marshall(key),
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: marshall(expressionAttributeValues),
          },
        };
      } else {
        return {
          Delete: {
            TableName: txn.table,
            Key: marshall(txn.item),
          },
        };
      }
    });

    await this.client.send(new TransactWriteItemsCommand({
      TransactItems: transactItems,
    }));
  }
}
