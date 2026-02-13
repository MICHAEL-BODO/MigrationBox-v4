/**
 * Lambda Handler: GET /v1/assessments/{id}
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AssessmentService } from '../assessment-service';
import { getDatabaseAdapter } from '@migrationbox/cal';
import { createSuccessResponse, createErrorResponse } from '@migrationbox/utils';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const assessmentId = event.pathParameters?.id;
    const tenantId = event.queryStringParameters?.tenantId || event.headers['x-tenant-id'];

    if (!assessmentId || !tenantId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(createErrorResponse('VALIDATION', 'assessmentId and tenantId required')),
      };
    }

    const service = new AssessmentService(getDatabaseAdapter());
    const assessment = await service.getAssessment(tenantId, assessmentId);

    if (!assessment) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(createErrorResponse('NOT_FOUND', `Assessment ${assessmentId} not found`)),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(createSuccessResponse(assessment)),
    };
  } catch (error: any) {
    console.error('getAssessment error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(createErrorResponse('INTERNAL_ERROR', error.message)),
    };
  }
}
