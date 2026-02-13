/**
 * Lambda Handler: POST /v1/discoveries
 * Initiates a new workload discovery scan
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DiscoveryService } from '../discovery-service';
import { getDatabaseAdapter, getMessagingAdapter } from '@migrationbox/cal';
import { createSuccessResponse, createErrorResponse } from '@migrationbox/utils';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.tenantId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(createErrorResponse('MISSING_TENANT_ID', 'tenantId is required')),
      };
    }

    if (!body.sourceEnvironment || !['aws', 'azure', 'gcp'].includes(body.sourceEnvironment)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(createErrorResponse('INVALID_SOURCE', 'sourceEnvironment must be aws, azure, or gcp')),
      };
    }

    const service = new DiscoveryService(getDatabaseAdapter(), getMessagingAdapter());
    const discovery = await service.startDiscovery({
      tenantId: body.tenantId,
      sourceEnvironment: body.sourceEnvironment,
      regions: body.regions,
      services: body.services,
      scope: body.scope,
      credentials: body.credentials,
    });

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(createSuccessResponse(discovery)),
    };
  } catch (error: any) {
    console.error('startDiscovery error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(createErrorResponse('INTERNAL_ERROR', error.message)),
    };
  }
}
