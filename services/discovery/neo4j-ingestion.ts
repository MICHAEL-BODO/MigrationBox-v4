/**
 * MigrationBox V5.0 - Neo4j Dependency Graph Ingestion
 * 
 * Ingests discovered workloads into Neo4j graph database for dependency analysis.
 */

import neo4j, { Driver, Session } from 'neo4j-driver';
import { Workload } from '@migrationbox/types';

interface Neo4jConfig {
  uri: string;
  user: string;
  password: string;
}

export class Neo4jIngestionService {
  private driver: Driver;

  constructor(config: Neo4jConfig) {
    this.driver = neo4j.driver(config.uri, neo4j.auth.basic(config.user, config.password));
  }

  async close(): Promise<void> {
    await this.driver.close();
  }

  /**
   * Ingest workloads into Neo4j graph
   */
  async ingestWorkloads(
    tenantId: string,
    discoveryId: string,
    workloads: Workload[]
  ): Promise<void> {
    const session = this.driver.session();

    try {
      await session.executeWrite(async (tx) => {
        // Create or update Workload nodes
        for (const workload of workloads) {
          const nodeType = this.getNodeType(workload.type);
          const nodeId = this.getNodeId(workload);

          await tx.run(
            `
            MERGE (w:${nodeType} {workloadId: $workloadId})
            SET w.tenantId = $tenantId,
                w.discoveryId = $discoveryId,
                w.name = $name,
                w.status = $status,
                w.provider = $provider,
                w.region = $region,
                w.metadata = $metadata,
                w.discoveredAt = $discoveredAt
            `,
            {
              workloadId: workload.workloadId,
              tenantId,
              discoveryId,
              name: workload.name,
              status: workload.status,
              provider: workload.provider,
              region: workload.region,
              metadata: JSON.stringify(workload.metadata),
              discoveredAt: workload.discoveredAt,
            }
          );

          // Create dependency relationships
          if (workload.dependencies && workload.dependencies.length > 0) {
            for (const depId of workload.dependencies) {
              const depType = this.inferNodeTypeFromId(depId);
              await tx.run(
                `
                MATCH (source:${nodeType} {workloadId: $sourceId})
                MERGE (target:${depType} {workloadId: $targetId})
                MERGE (source)-[:DEPENDS_ON {
                  dependencyType: 'direct',
                  strength: 'medium',
                  discoveredAt: $discoveredAt
                }]->(target)
                `,
                {
                  sourceId: workload.workloadId,
                  targetId: depId,
                  discoveredAt: workload.discoveredAt,
                }
              );
            }
          }

          // Create network relationships (IN_VPC, CONNECTED_TO)
          if (workload.metadata) {
            const metadata = workload.metadata as any;

            // IN_VPC relationship
            if (metadata.vpcId) {
              await tx.run(
                `
                MATCH (w:${nodeType} {workloadId: $workloadId})
                MERGE (vpc:Network {networkId: $vpcId, type: 'vpc'})
                MERGE (w)-[:IN_VPC]->(vpc)
                `,
                {
                  workloadId: workload.workloadId,
                  vpcId: `network-vpc-${metadata.vpcId}`,
                }
              );
            }

            // CONNECTED_TO relationships (for security groups, subnets)
            if (metadata.securityGroups && Array.isArray(metadata.securityGroups)) {
              for (const sgId of metadata.securityGroups) {
                await tx.run(
                  `
                  MATCH (w:${nodeType} {workloadId: $workloadId})
                  MERGE (sg:Network {networkId: $sgId, type: 'security-group'})
                  MERGE (w)-[:CONNECTED_TO {
                    protocol: 'tcp',
                    direction: 'both'
                  }]->(sg)
                  `,
                  {
                    workloadId: workload.workloadId,
                    sgId: `network-sg-${sgId}`,
                  }
                );
              }
            }
          }
        }
      });
    } finally {
      await session.close();
    }
  }

  /**
   * Map workload type to Neo4j node type
   */
  private getNodeType(type: string): string {
    const typeMap: Record<string, string> = {
      compute: 'Workload',
      database: 'Database',
      storage: 'Workload',
      network: 'Network',
      application: 'Workload',
      container: 'Workload',
      serverless: 'Workload',
    };
    return typeMap[type] || 'Workload';
  }

  /**
   * Get Neo4j node ID from workload
   */
  private getNodeId(workload: Workload): string {
    return workload.workloadId;
  }

  /**
   * Infer node type from workload ID
   */
  private inferNodeTypeFromId(id: string): string {
    if (id.startsWith('network-')) return 'Network';
    if (id.startsWith('rds-') || id.startsWith('dynamodb-')) return 'Database';
    return 'Workload';
  }

  /**
   * Query dependency graph for a workload
   */
  async getDependencies(workloadId: string, depth: number = 1): Promise<any> {
    const session = this.driver.session();

    try {
      const result = await session.run(
        `
        MATCH path = (w {workloadId: $workloadId})-[:DEPENDS_ON*1..${depth}]->(dep)
        RETURN w, dep, relationships(path) as relationships, length(path) as depth
        ORDER BY depth
        `,
        { workloadId }
      );

      const nodes = new Set<string>();
      const edges: any[] = [];

      result.records.forEach((record) => {
        const source = record.get('w');
        const target = record.get('dep');
        const rels = record.get('relationships');
        const depth = record.get('depth');

        nodes.add(JSON.stringify(source.properties));
        nodes.add(JSON.stringify(target.properties));

        if (rels && rels.length > 0) {
          edges.push({
            source: source.properties.workloadId,
            target: target.properties.workloadId,
            depth: depth.toNumber(),
          });
        }
      });

      return {
        nodes: Array.from(nodes).map(n => JSON.parse(n)),
        edges,
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Find circular dependencies
   */
  async findCircularDependencies(discoveryId: string): Promise<any[]> {
    const session = this.driver.session();

    try {
      const result = await session.run(
        `
        MATCH path = (w:Workload {discoveryId: $discoveryId})-[:DEPENDS_ON*]->(w)
        RETURN path, length(path) as cycleLength
        ORDER BY cycleLength
        LIMIT 10
        `,
        { discoveryId }
      );

      return result.records.map(record => ({
        path: record.get('path'),
        cycleLength: record.get('cycleLength').toNumber(),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Calculate dependency depth for a workload
   */
  async getDependencyDepth(workloadId: string): Promise<number> {
    const session = this.driver.session();

    try {
      const result = await session.run(
        `
        MATCH path = (w {workloadId: $workloadId})-[:DEPENDS_ON*]->(dep)
        RETURN max(length(path)) as maxDepth
        `,
        { workloadId }
      );

      if (result.records.length > 0) {
        const maxDepth = result.records[0].get('maxDepth');
        return maxDepth ? maxDepth.toNumber() : 0;
      }
      return 0;
    } finally {
      await session.close();
    }
  }

  /**
   * Get all workloads in a VPC
   */
  async getWorkloadsInVPC(vpcId: string): Promise<any[]> {
    const session = this.driver.session();

    try {
      const result = await session.run(
        `
        MATCH (vpc:Network {networkId: $vpcId, type: 'vpc'})<-[:IN_VPC]-(w)
        RETURN w
        `,
        { vpcId: `network-vpc-${vpcId}` }
      );

      return result.records.map(record => record.get('w').properties);
    } finally {
      await session.close();
    }
  }
}
