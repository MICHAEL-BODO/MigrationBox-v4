/**
 * MigrationBox API Client
 *
 * Centralized API calls for the frontend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4566/restapis';

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  discoveries: {
    create: (data: {
      tenantId: string;
      sourceEnvironment: string;
      regions?: string[];
      scope?: string;
    }) => fetcher('/v1/discoveries', { method: 'POST', body: JSON.stringify(data) }),

    get: (id: string, tenantId: string) =>
      fetcher(`/v1/discoveries/${id}?tenantId=${tenantId}`),

    listWorkloads: (id: string, tenantId: string, params?: { type?: string; limit?: number }) => {
      const query = new URLSearchParams({ tenantId });
      if (params?.type) query.set('type', params.type);
      if (params?.limit) query.set('limit', String(params.limit));
      return fetcher(`/v1/discoveries/${id}/workloads?${query}`);
    },

    getDependencies: (id: string, tenantId: string, params?: { depth?: number; analysis?: string; workloadId?: string }) => {
      const query = new URLSearchParams({ tenantId });
      if (params?.depth) query.set('depth', String(params.depth));
      if (params?.analysis) query.set('analysis', params.analysis);
      if (params?.workloadId) query.set('workloadId', params.workloadId);
      return fetcher(`/v1/discoveries/${id}/dependencies?${query}`);
    },
  },
};
