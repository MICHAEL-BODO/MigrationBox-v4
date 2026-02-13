/**
 * Lambda Handler: GET /v1/discoveries/{id}
 * Get discovery scan status and results
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DiscoveryService } from '../discovery-service';
import { getDatabaseAdapter, getMessagingAdapter } from '@migrationbox/cal';
import { createSuccessResponse, createErrorResponse } from '@migrationbox/utils';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const discoveryId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId || event.headers['x-tenant-id'];

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
        body: JSON.stringify(createErrorResponse('MISSING_TENANT', 'tenantId is required (query param or x-tenant-id header)')),
      };
    }

    const service = new DiscoveryService(getDatabaseAdapter(), getMessagingAdapter());
    const discovery = await service.getDiscovery(tenantId, discoveryId);

    if (!discovery) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(createErrorResponse('NOT_FOUND', `Discovery ${discoveryId} not found`)),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(createSuccessResponse(discovery)),
    };
  } catch (error: any) {
    console.error('getDiscovery error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(createErrorResponse('INTERNAL_ERROR', error.message)),
    };
  }
}
