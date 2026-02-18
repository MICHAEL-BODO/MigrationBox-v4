'use client';

import React, { useState } from 'react';

const WAVES = [
  {
    id: 'w1', name: 'Wave 1 — Stateless Services', target: 'GCP', status: 'ready',
    resources: [
      { name: 'prod-api-server-01', type: 'EC2 → GCE', risk: 'low', est: '45 min' },
      { name: 'prod-api-server-02', type: 'EC2 → GCE', risk: 'low', est: '45 min' },
      { name: 'prod-cache-01', type: 'ElastiCache → Memorystore', risk: 'low', est: '30 min' },
    ]
  },
  {
    id: 'w2', name: 'Wave 2 — Data Layer', target: 'GCP', status: 'ready',
    resources: [
      { name: 'prod-db-primary', type: 'RDS → Cloud SQL', risk: 'medium', est: '2h' },
      { name: 'az-sql-primary', type: 'Azure SQL → Cloud SQL', risk: 'medium', est: '3h' },
    ]
  },
  {
    id: 'w3', name: 'Wave 3 — Application Tier', target: 'GCP', status: 'pending',
    resources: [
      { name: 'az-web-app-01', type: 'App Service → Cloud Run', risk: 'low', est: '1h' },
    ]
  },
  {
    id: 'w4', name: 'Wave 4 — On-Prem Systems', target: 'GCP', status: 'pending',
    resources: [
      { name: 'onprem-dc01', type: 'Physical → GCE', risk: 'high', est: '4h' },
      { name: 'onprem-file-server', type: 'VM → GCS + Filestore', risk: 'medium', est: '2h' },
    ]
  },
];

export default function PlanBuilderPage() {
  const [expanded, setExpanded] = useState<string | null>('w1');

  const statusBadge = (s: string) => {
    if (s === 'ready') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s === 'running') return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

  const riskColor = (r: string) => {
    if (r === 'high') return 'text-rose-400';
    if (r === 'medium') return 'text-amber-400';
    return 'text-emerald-400';
  };

  const totalResources = WAVES.reduce((a, w) => a + w.resources.length, 0);
  const totalTime = '~11h';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            {'📋'} Migration Plan Builder
          </h1>
          <p className="text-zinc-400 text-sm mt-1">AI-generated migration waves with dependency-aware sequencing.</p>
        </div>
        <a href="/migrator/execute" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-500/20">
          {'▶'} Execute Plan
        </a>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Migration Waves', value: WAVES.length.toString(), icon: '🌊' },
          { label: 'Total Resources', value: totalResources.toString(), icon: '🖥️' },
          { label: 'Est. Duration', value: totalTime, icon: '⏱️' },
          { label: 'Target Cloud', value: 'GCP', icon: '☁️' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-[#0d0d14] border border-white/5 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Waves */}
      <div className="space-y-4">
        {WAVES.map((wave, wi) => (
          <div key={wave.id} className="rounded-2xl bg-[#0d0d14] border border-white/5 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === wave.id ? null : wave.id)}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold text-zinc-400 shrink-0">
                {wi + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-200">{wave.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{wave.resources.length} resources {'→'} {wave.target}</div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${statusBadge(wave.status)}`}>
                {wave.status}
              </span>
              <span className={`text-zinc-500 transition-transform ${expanded === wave.id ? 'rotate-180' : ''}`}>{'▾'}</span>
            </button>

            {expanded === wave.id && (
              <div className="border-t border-white/5">
                <div className="divide-y divide-white/5">
                  {wave.resources.map((r, ri) => (
                    <div key={ri} className="flex items-center gap-4 px-6 py-3 pl-20">
                      <div className="w-2 h-2 rounded-full bg-white/10 shrink-0" />
                      <div className="flex-1">
                        <span className="text-sm font-mono text-zinc-300">{r.name}</span>
                        <span className="text-xs text-zinc-500 ml-3">{r.type}</span>
                      </div>
                      <span className={`text-xs font-medium ${riskColor(r.risk)}`}>{r.risk} risk</span>
                      <span className="text-xs font-mono text-zinc-500">{r.est}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
