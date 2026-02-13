/**
 * Lambda Handler: GET /v1/discoveries/{id}/workloads
 * List discovered workloads for a discovery scan
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DiscoveryService } from '../discovery-service';
import { getDatabaseAdapter, getMessagingAdapter } from '@migrationbox/cal';
import { createSuccessResponse, createErrorResponse } from '@migrationbox/utils';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const discoveryId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId || event.headers['x-tenant-id'];
    const type = event.queryStringParameters?.type;
    const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit, 10) : undefined;
    const nextToken = event.queryStringParameters?.nextToken;

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

    const service = new DiscoveryService(getDatabaseAdapter(), getMessagingAdapter());
    const result = await service.listWorkloads(tenantId, discoveryId, { type, limit, nextToken });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        ...createSuccessResponse(result.workloads),
        pagination: {
          count: result.workloads.length,
          nextToken: result.nextToken,
        },
      }),
    };
  } catch (error: any) {
    console.error('listWorkloads error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(createErrorResponse('INTERNAL_ERROR', error.message)),
    };
  }
}
