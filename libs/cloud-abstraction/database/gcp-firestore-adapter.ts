/**
 * MigrationBox V5.0 - GCP Firestore Adapter
 * 
 * Implements DatabaseAdapter interface using Google Cloud Firestore SDK.
 */

import { Firestore, DocumentData, Query } from '@google-cloud/firestore';
import { DatabaseAdapter } from '../../../packages/cal/src/interfaces';

export class GCPFirestoreAdapter implements DatabaseAdapter {
  private client: Firestore;

  constructor() {
    this.client = new Firestore({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE,
    });
  }

  private getCollection(table: string) {
    return this.client.collection(table);
  }

  async putItem(table: string, item: Record<string, any>): Promise<void> {
    const collection = this.getCollection(table);
    const id = item.id || item[Object.keys(item)[0]];
    
    if (id) {
      await collection.doc(id).set(item);
    } else {
      await collection.add(item);
    }
  }

  async getItem(table: string, key: Record<string, any>): Promise<Record<string, any> | null> {
    const collection = this.getCollection(table);
    const id = key.id || key[Object.keys(key)[0]];
    
    if (!id) {
      return null;
    }
    
    const doc = await collection.doc(id).get();
    return doc.exists ? (doc.data() as Record<string, any>) : null;
  }

  async queryItems(
    table: string,
    keyCondition: string,
    values: Record<string, any>,
    indexName?: string
  ): Promise<Record<string, any>[]> {
    const collection = this.getCollection(table);
    let query: Query<DocumentData> = collection as any;
    
    // Parse keyCondition and build Firestore query
    // Simple parser - in production, use a proper query builder
    const conditions = keyCondition.split(' AND ');
    
    for (const condition of conditions) {
      if (condition.includes('=')) {
        const [field, placeholder] = condition.split('=').map(s => s.trim());
        const cleanField = field.replace(/c\./g, '');
        const cleanPlaceholder = placeholder.replace(/:/g, '');
        const value = values[placeholder] || values[`:${cleanPlaceholder}`];
        
        query = query.where(cleanField, '==', value);
      } else if (condition.includes('begins_with')) {
        // Firestore doesn't have begins_with, use >= and <
        const match = condition.match(/begins_with\((\w+),\s*(:\w+)\)/);
        if (match) {
          const field = match[1];
          const placeholder = match[2];
          const prefix = values[placeholder] || values[`:${placeholder.replace(':', '')}`];
          query = query.where(field, '>=', prefix).where(field, '<', prefix + '\uf8ff');
        }
      }
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as Record<string, any>);
  }

  async updateItem(table: string, key: Record<string, any>, updates: Record<string, any>): Promise<void> {
    const collection = this.getCollection(table);
    const id = key.id || key[Object.keys(key)[0]];
    
    if (!id) {
      throw new Error('Key must contain an id field');
    }
    
    await collection.doc(id).update(updates);
  }

  async deleteItem(table: string, key: Record<string, any>): Promise<void> {
    const collection = this.getCollection(table);
    const id = key.id || key[Object.keys(key)[0]];
    
    if (!id) {
      throw new Error('Key must contain an id field');
    }
    
    await collection.doc(id).delete();
  }

  async scanItems(table: string, filter?: string, values?: Record<string, any>): Promise<Record<string, any>[]> {
    const collection = this.getCollection(table);
    let query: Query<DocumentData> = collection as any;
    
    if (filter && values) {
      // Parse filter and build Firestore query
      const conditions = filter.split(' AND ');
      for (const condition of conditions) {
        if (condition.includes('=')) {
          const [field, placeholder] = condition.split('=').map(s => s.trim());
          const cleanField = field.replace(/c\./g, '');
          const cleanPlaceholder = placeholder.replace(/:/g, '');
          const value = values[placeholder] || values[`:${cleanPlaceholder}`];
          query = query.where(cleanField, '==', value);
        }
      }
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as Record<string, any>);
  }

  async batchWriteItems(table: string, items: Record<string, any>[]): Promise<void> {
    const batch = this.client.batch();
    const collection = this.getCollection(table);
    
    for (const item of items) {
      const id = item.id || item[Object.keys(item)[0]];
      if (id) {
        batch.set(collection.doc(id), item);
      } else {
        batch.set(collection.doc(), item);
      }
    }
    
    await batch.commit();
  }

  async batchGetItems(table: string, keys: Record<string, any>[]): Promise<Record<string, any>[]> {
    const collection = this.getCollection(table);
    const results: Record<string, any>[] = [];
    
    for (const key of keys) {
      const id = key.id || key[Object.keys(key)[0]];
      if (id) {
        const doc = await collection.doc(id).get();
        if (doc.exists) {
          results.push(doc.data() as Record<string, any>);
        }
      }
    }
    
    return results;
  }

  async transactWriteItems(
    transactions: Array<{ table: string; operation: 'put' | 'update' | 'delete'; item: Record<string, any> }>
  ): Promise<void> {
    return this.client.runTransaction(async (transaction) => {
      for (const txn of transactions) {
        const collection = this.getCollection(txn.table);
        
        if (txn.operation === 'put') {
          const id = txn.item.id || txn.item[Object.keys(txn.item)[0]];
          if (id) {
            transaction.set(collection.doc(id), txn.item);
          } else {
            transaction.set(collection.doc(), txn.item);
          }
        } else if (txn.operation === 'update') {
          const { key, updates } = txn.item;
          const id = key.id || key[Object.keys(key)[0]];
          transaction.update(collection.doc(id), updates);
        } else {
          const id = txn.item.id || txn.item[Object.keys(txn.item)[0]];
          transaction.delete(collection.doc(id));
        }
      }
    });
  }
}
