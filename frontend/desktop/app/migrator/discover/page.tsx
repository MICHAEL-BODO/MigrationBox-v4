'use client';

import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';

export default function DiscoveryPage() {
  const [scanning, setScanning] = useState(false);
  const { data, loading, error } = useApi<any>('/api/migrator/discover', { autoFetch: false });
  // We can fetch initial data if available, or just start with empty
  // Actually, let's fetch on mount if we want to show previously discovered, or just wait for scan.
  // The user might want to see persistence. Let's assume hitting the endpoint GET returns known resources.
  const discoveryApi = useApi<any>('/api/migrator/discover', { autoFetch: true });

  const discovered = discoveryApi.data?.resources || [];
  const total = discovered.length;
  const awsCount = discovered.filter((d) => d.provider === 'AWS').length;
  const azureCount = discovered.filter((d) => d.provider === 'Azure').length;
  const onpremCount = discovered.filter((d) => d.provider === 'On-Prem').length;
  const depCount = discovered.reduce((a, d) => a + (d.deps || 0), 0);

  const startScan = async () => {
    setScanning(true);
    // Trigger a fresh scan
    await discoveryApi.post({ scanType: 'full' });
    // After post, we should ideally re-fetch or the post response contains the data
    await discoveryApi.fetch();
    setScanning(false);
  };

  const providerIcon = (p: string) => {
    if (p === 'AWS') return '🟧';
    if (p === 'Azure') return '🔵';
    if (p === 'GCP') return '🔴';
    return '🏢';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            {'🔍'} Infrastructure Discovery
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Universal discovery across AWS, Azure, GCP, and on-premises environments.
          </p>
        </div>
        <button
          onClick={startScan}
          disabled={scanning}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            scanning
              ? 'bg-violet-600/50 text-violet-300 cursor-not-allowed'
              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
          }`}
        >
          {scanning ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Scanning...
            </>
          ) : (
            'Start Discovery Scan'
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          Failed to discover resources: {error.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Discovered', value: total.toString(), icon: '🖥️' },
          { label: 'AWS Resources', value: awsCount.toString(), icon: '🟧' },
          { label: 'Azure Resources', value: azureCount.toString(), icon: '🔵' },
          { label: 'On-Prem Systems', value: onpremCount.toString(), icon: '🏢' },
          { label: 'Dependencies Mapped', value: depCount.toString(), icon: '🔗' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-[#0d0d14] border border-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {loading && !discoveryApi.data && (
        <div className="p-8 text-center text-zinc-500 animate-pulse">
          Loading discovered inventory...
        </div>
      )}

      {/* Resource List */}
      <div className="rounded-2xl bg-[#0d0d14] border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Discovered Resources
          </h3>
          <a
            href="/migrator/plan"
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            Create Migration Plan {'→'}
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Name', 'Type', 'Provider', 'Region', 'CPU', 'Memory', 'Storage', 'Deps'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] text-zinc-500 uppercase tracking-wider font-medium"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {discovered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 italic">
                    No resources found. Run a scan to discover infrastructure.
                  </td>
                </tr>
              )}
              {discovered.map((r: any) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-zinc-200">{r.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{r.type}</td>
                  <td className="px-4 py-3">
                    <span>
                      {providerIcon(r.provider)} {r.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{r.region}</td>
                  <td className="px-4 py-3 font-mono text-zinc-400 text-xs">{r.cpu}</td>
                  <td className="px-4 py-3 font-mono text-zinc-400 text-xs">{r.memory}</td>
                  <td className="px-4 py-3 font-mono text-zinc-400 text-xs">{r.storage}</td>
                  <td className="px-4 py-3 font-mono text-violet-400 text-xs">{r.deps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
