'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

// ─── Generic Fetch Hook ─────────────────────────────────────────────

interface UseApiOptions {
  autoFetch?: boolean;
  pollingInterval?: number;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<T | null>;
  post: (body?: Record<string, unknown>) => Promise<T | null>;
}

export function useApi<T = any>(url: string, opts: UseApiOptions = {}): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const fetchData = useCallback(async (): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.fetch(url);
      const json = await res.json();
      if (!mounted.current) return null;
      if (json.error) {
        setError(json.error);
        return null;
      }
      setData(json);
      return json;
    } catch (err: any) {
      if (mounted.current) setError(err.message);
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [url]);

  const postData = useCallback(async (body?: Record<string, unknown>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!mounted.current) return null;
      if (json.error) {
        setError(json.error);
        return null;
      }
      setData(json);
      return json;
    } catch (err: any) {
      if (mounted.current) setError(err.message);
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [url]);

  // Auto-fetch on mount
  useEffect(() => {
    if (opts.autoFetch) {
      fetchData();
    }
  }, [opts.autoFetch, fetchData]);

  // Polling
  useEffect(() => {
    if (!opts.pollingInterval) return;
    const interval = setInterval(fetchData, opts.pollingInterval);
    return () => clearInterval(interval);
  }, [opts.pollingInterval, fetchData]);

  return { data, loading, error, fetch: fetchData, post: postData };
}

// ─── Pre-built Hooks ─────────────────────────────────────────────────

export function useScan() {
  return useApi<any>('/api/scan', { autoFetch: true });
}

export function useAudit() {
  return useApi<any>('/api/auditor/audit', { autoFetch: true });
}

export function useGuardian() {
  return useApi<any>('/api/auditor/guardian', { autoFetch: true, pollingInterval: 5000 });
}

export function useAnalysis() {
  return useApi<any>('/api/analyzer/analyze', { autoFetch: true });
}

export function useCostOptimizer() {
  return useApi<any>('/api/analyzer/cost', { autoFetch: true });
}

export function useSecurity() {
  return useApi<any>('/api/analyzer/security', { autoFetch: true });
}

export function useHealth() {
  return useApi<any>('/api/analyzer/health', { autoFetch: true });
}

export function useMigrationPlans() {
  return useApi<any>('/api/migrator/plan', { autoFetch: true });
}

export function useMigrationExecutions() {
  return useApi<any>('/api/migrator/execute', { autoFetch: true });
}

export function useDiscovery() {
  return useApi<any>('/api/migrator/discover', { autoFetch: true });
}

export function useOrchestration() {
  return useApi<any>('/api/orchestrate', { autoFetch: true });
}

export function useStatus() {
  return useApi<any>('/api/status', { autoFetch: true, pollingInterval: 10000 });
}
