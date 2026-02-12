/**
 * MigrationBox V5.0 - Azure Cosmos DB Adapter
 * 
 * Implements DatabaseAdapter interface using Azure Cosmos DB SDK.
 */

import { CosmosClient, Database, Container } from '@azure/cosmos';
import { DatabaseAdapter } from '../../../packages/cal/src/interfaces';

export class AzureCosmosDBAdapter implements DatabaseAdapter {
  private client: CosmosClient;
  private database: Database;
  private databaseName: string;

  constructor() {
    const endpoint = process.env.AZURE_COSMOS_ENDPOINT || '';
    const key = process.env.AZURE_COSMOS_KEY || '';
    
    if (!endpoint || !key) {
      throw new Error('Azure Cosmos DB credentials not configured. Set AZURE_COSMOS_ENDPOINT and AZURE_COSMOS_KEY');
    }

    this.client = new CosmosClient({ endpoint, key });
    this.databaseName = process.env.AZURE_COSMOS_DATABASE || 'migrationbox';
    this.database = this.client.database(this.databaseName);
  }

  private getContainer(table: string): Container {
    return this.database.container(table);
  }

  async putItem(table: string, item: Record<string, any>): Promise<void> {
    const container = this.getContainer(table);
    await container.items.upsert(item);
  }

  async getItem(table: string, key: Record<string, any>): Promise<Record<string, any> | null> {
    const container = this.getContainer(table);
    const id = key.id || key[Object.keys(key)[0]];
    const partitionKey = key.partitionKey || key[Object.keys(key)[1]] || id;
    
    try {
      const { resource } = await container.item(id, partitionKey).read();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async queryItems(
    table: string,
    keyCondition: string,
    values: Record<string, any>,
    indexName?: string
  ): Promise<Record<string, any>[]> {
    const container = this.getContainer(table);
    
    // Convert DynamoDB-style query to Cosmos DB SQL
    let query = keyCondition;
    for (const [key, value] of Object.entries(values)) {
      const placeholder = key.startsWith(':') ? key.substring(1) : key;
      query = query.replace(new RegExp(`:${placeholder}`, 'g'), `"${value}"`);
      query = query.replace(new RegExp(placeholder, 'g'), `c.${placeholder}`);
    }
    
    // Simple conversion - in production, use a proper query builder
    query = query.replace(/=/g, '==');
    query = `SELECT * FROM c WHERE ${query}`;
    
    const { resources } = await container.items.query(query).fetchAll();
    return resources;
  }

  async updateItem(table: string, key: Record<string, any>, updates: Record<string, any>): Promise<void> {
    const container = this.getContainer(table);
    const id = key.id || key[Object.keys(key)[0]];
    const partitionKey = key.partitionKey || key[Object.keys(key)[1]] || id;
    
    const item = container.item(id, partitionKey);
    const { resource } = await item.read();
    
    if (!resource) {
      throw new Error(`Item not found: ${id}`);
    }
    
    const updated = { ...resource, ...updates };
    await item.replace(updated);
  }

  async deleteItem(table: string, key: Record<string, any>): Promise<void> {
    const container = this.getContainer(table);
    const id = key.id || key[Object.keys(key)[0]];
    const partitionKey = key.partitionKey || key[Object.keys(key)[1]] || id;
    
    await container.item(id, partitionKey).delete();
  }

  async scanItems(table: string, filter?: string, values?: Record<string, any>): Promise<Record<string, any>[]> {
    const container = this.getContainer(table);
    
    let query = 'SELECT * FROM c';
    if (filter && values) {
      // Convert filter expression to Cosmos DB SQL
      let sqlFilter = filter;
      for (const [key, value] of Object.entries(values)) {
        const placeholder = key.startsWith(':') ? key.substring(1) : key;
        sqlFilter = sqlFilter.replace(new RegExp(`:${placeholder}`, 'g'), `"${value}"`);
        sqlFilter = sqlFilter.replace(new RegExp(placeholder, 'g'), `c.${placeholder}`);
      }
      sqlFilter = sqlFilter.replace(/=/g, '==');
      query += ` WHERE ${sqlFilter}`;
    }
    
    const { resources } = await container.items.query(query).fetchAll();
    return resources;
  }

  async batchWriteItems(table: string, items: Record<string, any>[]): Promise<void> {
    const container = this.getContainer(table);
    
    // Cosmos DB batch operations
    for (const item of items) {
      await container.items.upsert(item);
    }
  }

  async batchGetItems(table: string, keys: Record<string, any>[]): Promise<Record<string, any>[]> {
    const container = this.getContainer(table);
    const results: Record<string, any>[] = [];
    
    for (const key of keys) {
      const id = key.id || key[Object.keys(key)[0]];
      const partitionKey = key.partitionKey || key[Object.keys(key)[1]] || id;
      
      try {
        const { resource } = await container.item(id, partitionKey).read();
        if (resource) {
          results.push(resource);
        }
      } catch (error: any) {
        if (error.code !== 404) {
          throw error;
        }
      }
    }
    
    return results;
  }

  async transactWriteItems(
    transactions: Array<{ table: string; operation: 'put' | 'update' | 'delete'; item: Record<string, any> }>
  ): Promise<void> {
    // Cosmos DB doesn't support true transactions across containers
    // Execute sequentially
    for (const txn of transactions) {
      const container = this.getContainer(txn.table);
      
      if (txn.operation === 'put') {
        await container.items.upsert(txn.item);
      } else if (txn.operation === 'update') {
        const { key, updates } = txn.item;
        const id = key.id || key[Object.keys(key)[0]];
        const partitionKey = key.partitionKey || key[Object.keys(key)[1]] || id;
        
        const item = container.item(id, partitionKey);
        const { resource } = await item.read();
        const updated = { ...resource, ...updates };
        await item.replace(updated);
      } else {
        const id = txn.item.id || txn.item[Object.keys(txn.item)[0]];
        const partitionKey = txn.item.partitionKey || txn.item[Object.keys(txn.item)[1]] || id;
        await container.item(id, partitionKey).delete();
      }
    }
  }
}
