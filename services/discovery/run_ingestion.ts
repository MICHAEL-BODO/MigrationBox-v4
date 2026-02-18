/**
 * MigrationBox V5.0 - Discovery Ingestion Runner
 * 
 * Usage: npx ts-node run_ingestion.ts --file <scanner_output.json> [--source vmware|aws|azure]
 */

import fs from 'fs';
import path from 'path';
import { Neo4jIngestionService } from './neo4j-ingestion';
import { Workload } from '@migrationbox/types'; // Assuming this exists, local definition otherwise

// Simple Workload type if package import fails
interface WorkloadLocal {
  workloadId: string;
  tenantId: string;
  discoveryId: string;
  name: string;
  type: string;
  status: string;
  provider: string;
  region: string;
  metadata: any;
  discoveredAt: string;
  dependencies: string[];
}

async function main() {
  const args = process.argv.slice(2);
  const fileArgIndex = args.indexOf('--file');
  
  if (fileArgIndex === -1) {
    console.error('Usage: ts-node run_ingestion.ts --file <scanner_output.json>');
    process.exit(1);
  }

  const filePath = args[fileArgIndex + 1];
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const source = rawData.source || 'unknown';
  const discoveryId = `disc-${Date.now()}`;
  const tenantId = 'default-tenant';

  console.log(`Ingesting ${source} discovery data from ${filePath}...`);

  const workloads: WorkloadLocal[] = (rawData.resources || []).map((res: any) => transformResource(res, source, discoveryId, tenantId));

  const neo4jService = new Neo4jIngestionService(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'password'
  );

  try {
    console.log(`Connecting to Neo4j...`);
    await neo4jService.ingestWorkloads(workloads as any);
    console.log(`Successfully ingested ${workloads.length} workloads.`);
    
    // Run post-ingestion analysis
    const readiness = await neo4jService.getMigrationReadiness(discoveryId);
    console.log('\nMigration Readiness Analysis:');
    console.log(JSON.stringify(readiness, null, 2));

  } catch (error) {
    console.error('Ingestion failed:', error);
  } finally {
    await neo4jService.close();
  }
}

function transformResource(res: any, source: string, discoveryId: string, tenantId: string): WorkloadLocal {
  const common = {
    discoveryId,
    tenantId,
    discoveredAt: new Date().toISOString(),
    dependencies: [],
    metadata: res
  };

  if (source === 'vmware') {
    return {
      ...common,
      workloadId: `vm-${res.uuid || res.name}`, // Fallback if UUID missing
      name: res.name,
      type: 'compute',
      status: res.powerState === 'poweredOn' ? 'running' : 'stopped',
      provider: 'onprem',
      region: 'datacenter-1',
    };
  } else if (source === 'aws') {
    return {
      ...common,
      workloadId: res.id,
      name: res.tags?.Name || res.id,
      type: 'compute', // Simplified mapping
      status: res.state,
      provider: 'aws',
      region: res.region,
    };
  } else if (source === 'azure') {
    return {
      ...common,
      workloadId: res.id,
      name: res.name,
      type: 'compute',
      status: 'unknown', // Azure scanner needs expanded properties for state
      provider: 'azure',
      region: res.location,
    };
  }
  
  // Default fallback
  return {
    ...common,
    workloadId: res.id || `unknown-${Math.random()}`,
    name: res.name || 'Unknown',
    type: 'unknown',
    status: 'unknown',
    provider: source,
    region: 'unknown',
  };
}

main().catch(console.error);
