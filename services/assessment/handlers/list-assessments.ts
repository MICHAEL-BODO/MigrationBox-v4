/**
 * Lambda Handler: GET /v1/assessments
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AssessmentService } from '../assessment-service';
import { getDatabaseAdapter } from '@migrationbox/cal';
import { createSuccessResponse, createErrorResponse } from '@migrationbox/utils';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const tenantId = event.queryStringParameters?.tenantId || event.headers['x-tenant-id'];
    const workloadId = event.queryStringParameters?.workloadId;

    if (!tenantId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(createErrorResponse('VALIDATION', 'tenantId required')),
      };
    }

    const service = new AssessmentService(getDatabaseAdapter());
    const assessments = await service.listAssessments(tenantId, workloadId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(createSuccessResponse(assessments)),
    };
  } catch (error: any) {
    console.error('listAssessments error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(createErrorResponse('INTERNAL_ERROR', error.message)),
    };
  }
}
