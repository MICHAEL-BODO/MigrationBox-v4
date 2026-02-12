/**
 * Lambda Handler: GET /v1/discoveries/{id}/dependencies
 * Get dependency graph for a discovery, with traversal and analysis options
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createSuccessResponse, createErrorResponse } from '@migrationbox/utils';
import { Neo4jIngestionService } from '../neo4j-ingestion';
import { DependencyScoringService } from '../cypher-queries';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const neo4jUri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const neo4jUser = process.env.NEO4J_USER || 'neo4j';
  const neo4jPassword = process.env.NEO4J_PASSWORD || 'localdev123';

  let neo4jService: Neo4jIngestionService | null = null;

  try {
    const discoveryId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId || event.headers['x-tenant-id'];
    const depth = parseInt(event.queryStringParameters?.depth || '3', 10);
    const analysis = event.queryStringParameters?.analysis; // 'blast-radius' | 'circular' | 'readiness'
    const workloadId = event.queryStringParameters?.workloadId; // for specific workload analysis

    if (!discoveryId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(createErrorResponse('MISSING_ID', 'Discovery ID is required')),
      };
    }

    if (!tenantId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(createErrorResponse('MISSING_TENANT', 'tenantId is required')),
      };
    }

    neo4jService = new Neo4jIngestionService(neo4jUri, neo4jUser, neo4jPassword);

    let result: any;

    if (analysis === 'circular') {
      // Detect circular dependencies
      result = await neo4jService.findCircularDependencies(discoveryId);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(createSuccessResponse({
          discoveryId,
          analysis: 'circular-dependencies',
          cycles: result,
        })),
      };
    }

    if (analysis === 'blast-radius' && workloadId) {
      // Calculate blast radius for a specific workload
      const dependencies = await neo4jService.getDependencies(workloadId, depth);
      const depthScore = DependencyScoringService.calculateDepthScore(depth);
      const complexityScore = DependencyScoringService.calculateComplexityScore(
        Array.isArray(dependencies) ? dependencies.length : 0
      );
      const riskScore = DependencyScoringService.calculateRiskScore(
        depthScore,
        complexityScore,
        false
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(createSuccessResponse({
          discoveryId,
          workloadId,
          analysis: 'blast-radius',
          dependencies,
          scores: { depthScore, complexityScore, riskScore },
          blastRadius: riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MEDIUM' : 'LOW',
        })),
      };
    }

    if (analysis === 'readiness') {
      // Migration readiness based on dependency complexity
      const dependencies = await neo4jService.getDependencies(discoveryId, depth);
      const circularDeps = await neo4jService.findCircularDependencies(discoveryId);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(createSuccessResponse({
          discoveryId,
          analysis: 'migration-readiness',
          totalDependencies: Array.isArray(dependencies) ? dependencies.length : 0,
          circularDependencies: circularDeps.length,
          readinessScore: circularDeps.length === 0 ? 'READY' : 'NEEDS_REVIEW',
        })),
      };
    }

    // Default: return full dependency graph
    if (workloadId) {
      result = await neo4jService.getDependencies(workloadId, depth);
    } else {
      // Get all dependencies for the discovery
      result = await neo4jService.getDependencies(discoveryId, depth);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(createSuccessResponse({
        discoveryId,
        depth,
        dependencies: result,
      })),
    };
  } catch (error: any) {
    console.error('getDependencies error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(createErrorResponse('INTERNAL_ERROR', error.message)),
    };
  } finally {
    if (neo4jService) {
      await neo4jService.close();
    }
  }
}
