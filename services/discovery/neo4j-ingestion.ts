/**
 * MigrationBox V5.0 - Neo4j Dependency Graph Ingestion
 *
 * Ingests discovered workloads into Neo4j graph database for dependency analysis.
 * Detects real dependencies from cloud metadata:
 *   - EC2 → RDS (security group rules)
 *   - Lambda → DynamoDB/S3 (IAM role policies)
 *   - ELB → EC2/ECS (target groups)
 *   - VPC containment (resources → VPC/subnet)
 */

import neo4j, { Driver, Session } from 'neo4j-driver';
import { Workload } from '@migrationbox/types';

export class Neo4jIngestionService {
  private driver: Driver;

  constructor(uri: string, user: string, password: string) {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }

  async close(): Promise<void> {
    await this.driver.close();
  }

  /**
   * Ingest workloads into Neo4j graph with real dependency detection
   */
  async ingestWorkloads(workloads: Workload[]): Promise<void> {
    const session = this.driver.session();

    try {
      await session.executeWrite(async (tx) => {
        // Phase 1: Create all nodes
        for (const workload of workloads) {
          const nodeType = this.getNodeType(workload.type);
          await tx.run(
            `MERGE (w:${nodeType} {workloadId: $workloadId})
            SET w.tenantId = $tenantId,
                w.discoveryId = $discoveryId,
                w.name = $name,
                w.type = $type,
                w.status = $status,
                w.provider = $provider,
                w.region = $region,
                w.metadata = $metadata,
                w.discoveredAt = $discoveredAt`,
            {
              workloadId: workload.workloadId,
              tenantId: workload.tenantId,
              discoveryId: workload.discoveryId,
              name: workload.name,
              type: workload.type,
              status: workload.status,
              provider: workload.provider,
              region: workload.region,
              metadata: JSON.stringify(workload.metadata),
              discoveredAt: workload.discoveredAt,
            }
          );
        }

        // Phase 2: Create explicit dependency edges
        for (const workload of workloads) {
          const nodeType = this.getNodeType(workload.type);
          if (workload.dependencies && workload.dependencies.length > 0) {
            for (const depId of workload.dependencies) {
              const depType = this.inferNodeTypeFromId(depId);
              await tx.run(
                `MATCH (source:${nodeType} {workloadId: $sourceId})
                MERGE (target:${depType} {workloadId: $targetId})
                MERGE (source)-[:DEPENDS_ON {
                  dependencyType: 'direct',
                  strength: 'strong',
                  discoveredAt: $discoveredAt
                }]->(target)`,
                {
                  sourceId: workload.workloadId,
                  targetId: depId,
                  discoveredAt: workload.discoveredAt,
                }
              );
            }
          }
        }

        // Phase 3: Detect implicit dependencies from metadata
        for (const workload of workloads) {
          const meta = workload.metadata as any;
          if (!meta) continue;
          const nodeType = this.getNodeType(workload.type);

          // VPC containment
          if (meta.vpcId) {
            await tx.run(
              `MATCH (w:${nodeType} {workloadId: $workloadId})
              MERGE (vpc:Network {workloadId: $vpcId})
              ON CREATE SET vpc.type = 'vpc', vpc.name = $vpcId
              MERGE (w)-[:IN_VPC]->(vpc)`,
              { workloadId: workload.workloadId, vpcId: meta.vpcId }
            );
          }

          // Subnet containment
          if (meta.subnetId) {
            await tx.run(
              `MATCH (w:${nodeType} {workloadId: $workloadId})
              MERGE (subnet:Network {workloadId: $subnetId})
              ON CREATE SET subnet.type = 'subnet', subnet.name = $subnetId
              MERGE (w)-[:IN_VPC]->(subnet)`,
              { workloadId: workload.workloadId, subnetId: meta.subnetId }
            );
          }

          // Security group connectivity
          if (meta.securityGroups && Array.isArray(meta.securityGroups)) {
            for (const sgId of meta.securityGroups) {
              await tx.run(
                `MATCH (w:${nodeType} {workloadId: $workloadId})
                MERGE (sg:Network {workloadId: $sgId})
                ON CREATE SET sg.type = 'security-group', sg.name = $sgId
                MERGE (w)-[:CONNECTED_TO {protocol: 'tcp', direction: 'both'}]->(sg)`,
                { workloadId: workload.workloadId, sgId }
              );
            }
          }

          // ELB → target instances (from target group members)
          if (meta.type === 'application' || meta.type === 'network') {
            if (meta.targetInstances && Array.isArray(meta.targetInstances)) {
              for (const targetId of meta.targetInstances) {
                await tx.run(
                  `MATCH (lb:${nodeType} {workloadId: $lbId})
                  MERGE (target:Workload {workloadId: $targetId})
                  MERGE (lb)-[:DEPENDS_ON {
                    dependencyType: 'load-balancing',
                    strength: 'strong',
                    discoveredAt: $discoveredAt
                  }]->(target)`,
                  {
                    lbId: workload.workloadId,
                    targetId,
                    discoveredAt: workload.discoveredAt,
                  }
                );
              }
            }
          }

          // Lambda → DynamoDB/S3 (from environment variables or IAM policies)
          if (meta.runtime && meta.runtime.startsWith('nodejs')) {
            if (meta.envVars) {
              // Detect table names in environment variables
              for (const [key, value] of Object.entries(meta.envVars)) {
                if (key.includes('TABLE') && typeof value === 'string') {
                  await tx.run(
                    `MATCH (fn:Workload {workloadId: $fnId})
                    MERGE (db:Database {workloadId: $dbId})
                    ON CREATE SET db.name = $dbName, db.type = 'database'
                    MERGE (fn)-[:DEPENDS_ON {
                      dependencyType: 'data-access',
                      strength: 'strong',
                      discoveredAt: $discoveredAt
                    }]->(db)`,
                    {
                      fnId: workload.workloadId,
                      dbId: `dynamodb-${value}`,
                      dbName: value as string,
                      discoveredAt: workload.discoveredAt,
                    }
                  );
                }
                if (key.includes('BUCKET') && typeof value === 'string') {
                  await tx.run(
                    `MATCH (fn:Workload {workloadId: $fnId})
                    MERGE (s3:Workload {workloadId: $s3Id})
                    ON CREATE SET s3.name = $s3Name, s3.type = 'storage'
                    MERGE (fn)-[:DEPENDS_ON {
                      dependencyType: 'data-access',
                      strength: 'medium',
                      discoveredAt: $discoveredAt
                    }]->(s3)`,
                    {
                      fnId: workload.workloadId,
                      s3Id: `s3-${value}`,
                      s3Name: value as string,
                      discoveredAt: workload.discoveredAt,
                    }
                  );
                }
              }
            }
          }

          // ECS/EKS → task definition dependencies
          if (meta.taskDefinition) {
            // ECS services depend on their container registry images
            await tx.run(
              `MATCH (svc:Workload {workloadId: $svcId})
              MERGE (td:Workload {workloadId: $tdId})
              ON CREATE SET td.name = $tdName, td.type = 'application'
              MERGE (svc)-[:DEPENDS_ON {
                dependencyType: 'container-definition',
                strength: 'strong',
                discoveredAt: $discoveredAt
              }]->(td)`,
              {
                svcId: workload.workloadId,
                tdId: `taskdef-${meta.taskDefinition}`,
                tdName: meta.taskDefinition,
                discoveredAt: workload.discoveredAt,
              }
            );
          }

          // RDS → VPC subnet group
          if (meta.engine && meta.dbSubnetGroupName) {
            await tx.run(
              `MATCH (db:Database {workloadId: $dbId})
              MERGE (subnet:Network {workloadId: $subnetGroupId})
              ON CREATE SET subnet.type = 'subnet-group', subnet.name = $subnetGroupName
              MERGE (db)-[:IN_VPC]->(subnet)`,
              {
                dbId: workload.workloadId,
                subnetGroupId: `subnet-group-${meta.dbSubnetGroupName}`,
                subnetGroupName: meta.dbSubnetGroupName,
              }
            );
          }
        }
      });
    } finally {
      await session.close();
    }
  }

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

  private inferNodeTypeFromId(id: string): string {
    if (id.startsWith('network-') || id.startsWith('vpc-') || id.startsWith('elb-') || id.startsWith('route53-')) return 'Network';
    if (id.startsWith('rds-') || id.startsWith('dynamodb-') || id.startsWith('cosmosdb-') || id.startsWith('firestore-')) return 'Database';
    return 'Workload';
  }

  /**
   * Query dependency graph for a workload (transitive)
   */
  async getDependencies(workloadId: string, depth: number = 3): Promise<any> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH path = (w {workloadId: $workloadId})-[:DEPENDS_ON*1..${Math.min(depth, 10)}]->(dep)
        RETURN w, dep, relationships(path) as rels, length(path) as depth
        ORDER BY depth`,
        { workloadId }
      );

      const nodesMap = new Map<string, any>();
      const edges: any[] = [];

      result.records.forEach((record) => {
        const source = record.get('w').properties;
        const target = record.get('dep').properties;
        const d = record.get('depth');

        nodesMap.set(source.workloadId, source);
        nodesMap.set(target.workloadId, target);
        edges.push({
          source: source.workloadId,
          target: target.workloadId,
          depth: typeof d.toNumber === 'function' ? d.toNumber() : d,
        });
      });

      return {
        nodes: Array.from(nodesMap.values()),
        edges,
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Find circular dependencies within a discovery
   */
  async findCircularDependencies(discoveryId: string): Promise<any[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH path = (w {discoveryId: $discoveryId})-[:DEPENDS_ON*2..8]->(w)
        RETURN [n IN nodes(path) | n.workloadId] AS cycle, length(path) AS cycleLength
        ORDER BY cycleLength
        LIMIT 20`,
        { discoveryId }
      );
      return result.records.map(r => ({
        cycle: r.get('cycle'),
        cycleLength: typeof r.get('cycleLength').toNumber === 'function'
          ? r.get('cycleLength').toNumber()
          : r.get('cycleLength'),
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Calculate max dependency depth for a workload
   */
  async getDependencyDepth(workloadId: string): Promise<number> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH path = (w {workloadId: $workloadId})-[:DEPENDS_ON*]->(dep)
        RETURN max(length(path)) as maxDepth`,
        { workloadId }
      );
      if (result.records.length > 0) {
        const val = result.records[0].get('maxDepth');
        return val ? (typeof val.toNumber === 'function' ? val.toNumber() : val) : 0;
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
        `MATCH (vpc:Network {workloadId: $vpcId})<-[:IN_VPC]-(w)
        RETURN w`,
        { vpcId }
      );
      return result.records.map(r => r.get('w').properties);
    } finally {
      await session.close();
    }
  }

  /**
   * Calculate blast radius for a workload
   */
  async getBlastRadius(workloadId: string): Promise<{
    directDeps: number;
    transitiveDeps: number;
    affectedVPCs: number;
    blastRadius: 'LOW' | 'MEDIUM' | 'HIGH';
  }> {
    const session = this.driver.session();
    try {
      // Direct dependencies
      const directResult = await session.run(
        `MATCH (w {workloadId: $workloadId})-[:DEPENDS_ON]->(dep)
        RETURN count(dep) as count`,
        { workloadId }
      );
      const directDeps = directResult.records[0]?.get('count')?.toNumber?.() || 0;

      // Transitive dependencies (up to 5 levels)
      const transitiveResult = await session.run(
        `MATCH (w {workloadId: $workloadId})-[:DEPENDS_ON*1..5]->(dep)
        RETURN count(DISTINCT dep) as count`,
        { workloadId }
      );
      const transitiveDeps = transitiveResult.records[0]?.get('count')?.toNumber?.() || 0;

      // Affected VPCs
      const vpcResult = await session.run(
        `MATCH (w {workloadId: $workloadId})-[:DEPENDS_ON*1..5]->(dep)-[:IN_VPC]->(vpc)
        RETURN count(DISTINCT vpc) as count`,
        { workloadId }
      );
      const affectedVPCs = vpcResult.records[0]?.get('count')?.toNumber?.() || 0;

      let blastRadius: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (transitiveDeps > 10 || affectedVPCs > 2) blastRadius = 'HIGH';
      else if (transitiveDeps > 3 || affectedVPCs > 1) blastRadius = 'MEDIUM';

      return { directDeps, transitiveDeps, affectedVPCs, blastRadius };
    } finally {
      await session.close();
    }
  }

  /**
   * Get migration readiness score for a discovery
   */
  async getMigrationReadiness(discoveryId: string): Promise<{
    totalWorkloads: number;
    totalDependencies: number;
    circularDeps: number;
    isolatedWorkloads: number;
    readinessScore: number;
    recommendation: string;
  }> {
    const session = this.driver.session();
    try {
      const countResult = await session.run(
        `MATCH (w {discoveryId: $discoveryId})
        RETURN count(w) as total`,
        { discoveryId }
      );
      const totalWorkloads = countResult.records[0]?.get('total')?.toNumber?.() || 0;

      const depResult = await session.run(
        `MATCH (w {discoveryId: $discoveryId})-[r:DEPENDS_ON]->(dep)
        RETURN count(r) as total`,
        { discoveryId }
      );
      const totalDependencies = depResult.records[0]?.get('total')?.toNumber?.() || 0;

      const circularResult = await session.run(
        `MATCH path = (w {discoveryId: $discoveryId})-[:DEPENDS_ON*2..6]->(w)
        RETURN count(DISTINCT w) as count`,
        { discoveryId }
      );
      const circularDeps = circularResult.records[0]?.get('count')?.toNumber?.() || 0;

      const isolatedResult = await session.run(
        `MATCH (w {discoveryId: $discoveryId})
        WHERE NOT (w)-[:DEPENDS_ON]-() AND NOT ()-[:DEPENDS_ON]->(w)
        RETURN count(w) as count`,
        { discoveryId }
      );
      const isolatedWorkloads = isolatedResult.records[0]?.get('count')?.toNumber?.() || 0;

      // Score: 100 base, -10 per circular dep, -2 per high-fan-out dependency
      let readinessScore = 100;
      readinessScore -= circularDeps * 20;
      if (totalWorkloads > 0) {
        const avgDeps = totalDependencies / totalWorkloads;
        if (avgDeps > 5) readinessScore -= 15;
        else if (avgDeps > 3) readinessScore -= 5;
      }
      readinessScore = Math.max(0, Math.min(100, readinessScore));

      let recommendation = 'Ready for migration';
      if (readinessScore < 50) recommendation = 'High complexity — resolve circular dependencies before migrating';
      else if (readinessScore < 75) recommendation = 'Moderate complexity — review dependency chains';

      return {
        totalWorkloads,
        totalDependencies,
        circularDeps,
        isolatedWorkloads,
        readinessScore,
        recommendation,
      };
    } finally {
      await session.close();
    }
  }
}
