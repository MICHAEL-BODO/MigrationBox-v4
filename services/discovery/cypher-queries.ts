/**
 * MigrationBox V5.0 - Cypher Query Library for Dependency Analysis
 * 
 * Reusable Cypher queries for common dependency analysis patterns.
 */

export const CypherQueries = {
  /**
   * Get all dependencies of a workload (transitive)
   */
  getDependencies: (workloadId: string, maxDepth: number = 5) => `
    MATCH path = (w {workloadId: $workloadId})-[:DEPENDS_ON*1..${maxDepth}]->(dep)
    RETURN w, dep, relationships(path) as relationships, length(path) as depth
    ORDER BY depth
  `,

  /**
   * Find circular dependencies
   */
  findCircularDependencies: (discoveryId: string) => `
    MATCH path = (w:Workload {discoveryId: $discoveryId})-[:DEPENDS_ON*]->(w)
    RETURN path, length(path) as cycleLength
    ORDER BY cycleLength
    LIMIT 10
  `,

  /**
   * Calculate dependency depth for a workload
   */
  getDependencyDepth: (workloadId: string) => `
    MATCH path = (w {workloadId: $workloadId})-[:DEPENDS_ON*]->(dep)
    RETURN max(length(path)) as maxDepth
  `,

  /**
   * Get all workloads in a VPC
   */
  getWorkloadsInVPC: (vpcId: string) => `
    MATCH (vpc:Network {networkId: $vpcId, type: 'vpc'})<-[:IN_VPC]-(w)
    RETURN w
  `,

  /**
   * Find workloads with high dependency count
   */
  findHighDependencyWorkloads: (discoveryId: string, minDeps: number = 5) => `
    MATCH (w:Workload {discoveryId: $discoveryId})-[:DEPENDS_ON]->(dep)
    WITH w, count(dep) as depCount
    WHERE depCount >= ${minDeps}
    RETURN w, depCount
    ORDER BY depCount DESC
  `,

  /**
   * Find isolated workloads (no dependencies)
   */
  findIsolatedWorkloads: (discoveryId: string) => `
    MATCH (w:Workload {discoveryId: $discoveryId})
    WHERE NOT (w)-[:DEPENDS_ON]->()
    RETURN w
  `,

  /**
   * Get dependency chain between two workloads
   */
  getDependencyChain: (sourceId: string, targetId: string) => `
    MATCH path = shortestPath((source {workloadId: $sourceId})-[:DEPENDS_ON*]->(target {workloadId: $targetId}))
    RETURN path, length(path) as pathLength
  `,

  /**
   * Find critical workloads (high in-degree)
   */
  findCriticalWorkloads: (discoveryId: string, minInDegree: number = 3) => `
    MATCH (w:Workload {discoveryId: $discoveryId})<-[:DEPENDS_ON]-(dep)
    WITH w, count(dep) as inDegree
    WHERE inDegree >= ${minInDegree}
    RETURN w, inDegree
    ORDER BY inDegree DESC
  `,

  /**
   * Get network connectivity graph
   */
  getNetworkConnectivity: (discoveryId: string) => `
    MATCH (w:Workload {discoveryId: $discoveryId})-[:CONNECTED_TO]->(n:Network)
    RETURN w, n
  `,

  /**
   * Find workloads by type with dependencies
   */
  getWorkloadsByType: (discoveryId: string, workloadType: string) => `
    MATCH (w:Workload {discoveryId: $discoveryId, type: $workloadType})
    OPTIONAL MATCH (w)-[:DEPENDS_ON]->(dep)
    RETURN w, collect(dep) as dependencies
  `,

  /**
   * Calculate blast radius (affected workloads if one fails)
   */
  calculateBlastRadius: (workloadId: string) => `
    MATCH (w {workloadId: $workloadId})<-[:DEPENDS_ON*]-(affected)
    RETURN count(DISTINCT affected) as blastRadius
  `,

  /**
   * Get migration readiness score based on dependencies
   */
  getMigrationReadiness: (workloadId: string) => `
    MATCH (w {workloadId: $workloadId})
    OPTIONAL MATCH (w)-[:DEPENDS_ON*]->(dep)
    WITH w, count(DISTINCT dep) as depCount,
         count(DISTINCT CASE WHEN dep.provider <> w.provider THEN dep END) as crossCloudDeps
    RETURN w.workloadId as workloadId,
           depCount,
           crossCloudDeps,
           CASE
             WHEN depCount = 0 THEN 100
             WHEN crossCloudDeps = 0 THEN 80
             WHEN crossCloudDeps < depCount * 0.3 THEN 60
             ELSE 40
           END as readinessScore
  `,
};

/**
 * Dependency depth scoring utility
 */
export class DependencyScoringService {
  /**
   * Calculate dependency depth score (0-100)
   * Lower depth = higher score
   */
  static calculateDepthScore(depth: number): number {
    if (depth === 0) return 100;
    if (depth === 1) return 90;
    if (depth === 2) return 75;
    if (depth === 3) return 60;
    if (depth === 4) return 45;
    if (depth === 5) return 30;
    return Math.max(0, 30 - (depth - 5) * 5);
  }

  /**
   * Calculate complexity score based on dependency count
   */
  static calculateComplexityScore(dependencyCount: number): number {
    if (dependencyCount === 0) return 0;
    if (dependencyCount <= 2) return 20;
    if (dependencyCount <= 5) return 40;
    if (dependencyCount <= 10) return 60;
    if (dependencyCount <= 20) return 80;
    return 100;
  }

  /**
   * Calculate overall migration risk score
   */
  static calculateRiskScore(
    depth: number,
    dependencyCount: number,
    hasCircularDeps: boolean
  ): number {
    const depthScore = this.calculateDepthScore(depth);
    const complexityScore = this.calculateComplexityScore(dependencyCount);
    const circularPenalty = hasCircularDeps ? 20 : 0;

    return Math.max(0, Math.min(100, (depthScore + complexityScore) / 2 - circularPenalty));
  }
}
