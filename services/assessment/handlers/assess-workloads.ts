/**
 * Lambda Handler: POST /v1/assessments
 * Run 6Rs assessment on workloads
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AssessmentService } from '../assessment-service';
import { getDatabaseAdapter } from '@migrationbox/cal';
import { createSuccessResponse, createErrorResponse } from '@migrationbox/utils';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');

    if (!body.tenantId || !body.workloads || !body.targetProvider) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(createErrorResponse('VALIDATION', 'tenantId, workloads array, and targetProvider are required')),
      };
    }

    const service = new AssessmentService(getDatabaseAdapter());
    const assessments = await service.assessWorkloads({
      tenantId: body.tenantId,
      workloads: body.workloads,
      targetProvider: body.targetProvider,
      preferences: body.preferences,
    });

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(createSuccessResponse(assessments)),
    };
  } catch (error: any) {
    console.error('assessWorkloads error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(createErrorResponse('INTERNAL_ERROR', error.message)),
    };
  }
}
