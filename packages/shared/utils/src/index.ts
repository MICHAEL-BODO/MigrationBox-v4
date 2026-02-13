/**
 * MigrationBox V5.0 - Shared Utils Package
 * 
 * Common utility functions used across all packages and services.
 */

import { CloudProvider, MigrationBoxError } from '../../types/src/index';

// ============================================================================
// ID Generation
// ============================================================================

export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${timestamp}-${random}`;
}

export function generateDiscoveryId(): string {
  return generateId('disc');
}

export function generateWorkloadId(): string {
  return generateId('wl');
}

export function generateAssessmentId(): string {
  return generateId('assess');
}

export function generateMigrationId(): string {
  return generateId('mig');
}

export function generateTaskId(): string {
  return generateId('task');
}

// ============================================================================
// Validation
// ============================================================================

export function isValidTenantId(tenantId: string): boolean {
  return /^[a-z0-9-]{3,50}$/.test(tenantId);
}

export function isValidCloudProvider(provider: string): provider is CloudProvider {
  return ['aws', 'azure', 'gcp'].includes(provider);
}

export function validateTenantId(tenantId: string): void {
  if (!isValidTenantId(tenantId)) {
    throw new MigrationBoxError(
      'INVALID_TENANT_ID',
      `Invalid tenant ID format: ${tenantId}`,
      400
    );
  }
}

// ============================================================================
// Date/Time Utilities
// ============================================================================

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// ============================================================================
// Error Handling
// ============================================================================

export function isMigrationBoxError(error: unknown): error is MigrationBoxError {
  return error instanceof MigrationBoxError;
}

export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: Record<string, any>
): { statusCode: number; body: string } {
  return {
    statusCode,
    body: JSON.stringify({
      success: false,
      error: {
        code,
        message,
        details,
      },
      metadata: {
        timestamp: getCurrentTimestamp(),
        version: '5.0.0',
      },
    }),
  };
}

export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): { statusCode: number; body: string } {
  return {
    statusCode,
    body: JSON.stringify({
      success: true,
      data,
      metadata: {
        timestamp: getCurrentTimestamp(),
        version: '5.0.0',
      },
    }),
  };
}

// ============================================================================
// Pagination
// ============================================================================

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function getPaginationParams(queryParams: Record<string, any>): PaginationParams {
  const page = Math.max(1, parseInt(queryParams.page || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(queryParams.pageSize || '20', 10)));
  return { page, pageSize };
}

export function getPaginationResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ============================================================================
// Cost Calculations
// ============================================================================

export function calculateThreeYearCost(
  monthlyCost: number,
  discountRate: number = 0.1
): number {
  // Simple NPV calculation: sum of discounted monthly costs over 36 months
  let total = 0;
  for (let month = 0; month < 36; month++) {
    total += monthlyCost / Math.pow(1 + discountRate, month / 12);
  }
  return total;
}

// ============================================================================
// String Utilities
// ============================================================================

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// Environment Detection
// ============================================================================

export function getEnvironment(): 'local' | 'dev' | 'staging' | 'production' {
  const env: string = process.env.NODE_ENV || process.env.STAGE || 'local';
  if (env === 'production' || env === 'prod') return 'production';
  if (env === 'staging') return 'staging';
  if (env === 'dev' || env === 'development') return 'dev';
  return 'local';
}

export function isLocalEnvironment(): boolean {
  return getEnvironment() === 'local';
}
