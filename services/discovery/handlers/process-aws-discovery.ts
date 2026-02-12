/**
 * Lambda Handler: SQS Consumer
 * Processes AWS discovery jobs asynchronously (900s timeout, 1GB memory)
 */

import { SQSEvent, SQSRecord } from 'aws-lambda';
import { DiscoveryService } from '../discovery-service';
import { getDatabaseAdapter, getMessagingAdapter } from '@migrationbox/cal';
import { Neo4jIngestionService } from '../neo4j-ingestion';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'localdev123';

export async function handler(event: SQSEvent): Promise<void> {
  const service = new DiscoveryService(getDatabaseAdapter(), getMessagingAdapter());

  for (const record of event.Records) {
    await processRecord(record, service);
  }
}

async function processRecord(record: SQSRecord, service: DiscoveryService): Promise<void> {
  let neo4jService: Neo4jIngestionService | null = null;

  try {
    const message = JSON.parse(record.body);
    console.log(`Processing discovery: ${message.discoveryId} for tenant: ${message.tenantId}`);

    // Execute discovery (scans cloud resources, stores in DynamoDB)
    const result = await service.processDiscovery(message);

    // Ingest discovered workloads into Neo4j for dependency graphing
    if (result.workloads.length > 0) {
      try {
        neo4jService = new Neo4jIngestionService(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD);
        await neo4jService.ingestWorkloads(result.workloads);
        console.log(`Ingested ${result.workloads.length} workloads into Neo4j`);
      } catch (neo4jError: any) {
        // Neo4j ingestion failure should not fail the discovery
        console.warn(`Neo4j ingestion warning: ${neo4jError.message}`);
      }
    }

    console.log(`Discovery ${message.discoveryId} complete: ${result.workloads.length} workloads found`);

  } catch (error: any) {
    console.error(`Discovery processing failed for record ${record.messageId}:`, error);
    throw error; // Re-throw to trigger SQS retry / DLQ
  } finally {
    if (neo4jService) {
      await neo4jService.close();
    }
  }
}
