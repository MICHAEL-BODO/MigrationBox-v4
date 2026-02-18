'use client';

import React from 'react';

const OVERRUNS = [
  { id: 'o1', resource: 'EC2 Fleet — Production', provider: 'AWS', current: '$47,200/mo', optimized: '$31,400/mo', savings: '$15,800/mo', pct: '33%', type: 'Right-sizing', risk: 'low' },
  { id: 'o2', resource: 'Azure SQL Premium DTUs', provider: 'Azure', current: '$18,500/mo', optimized: '$8,900/mo', savings: '$9,600/mo', pct: '52%', type: 'Tier downgrade', risk: 'medium' },
  { id: 'o3', resource: 'GCS Storage (Nearline → Archive)', provider: 'GCP', current: '$12,300/mo', optimized: '$3,100/mo', savings: '$9,200/mo', pct: '75%', type: 'Storage tiering', risk: 'low' },
  { id: 'o4', resource: 'Idle NAT Gateways (12 unused)', provider: 'AWS', current: '$6,480/mo', optimized: '$0', savings: '$6,480/mo', pct: '100%', type: 'Termination', risk: 'low' },
  { id: 'o5', resource: 'Reserved Instances Expired', provider: 'AWS', current: '$34,000/mo', optimized: '$10,200/mo', savings: '$23,800/mo', pct: '70%', type: 'RI renewal', risk: 'low' },
  { id: 'o6', resource: 'Oversized Kubernetes Nodes', provider: 'GCP', current: '$22,100/mo', optimized: '$14,700/mo', savings: '$7,400/mo', pct: '33%', type: 'Node pool resize', risk: 'medium' },
  { id: 'o7', resource: 'Unused Elastic IPs (23)', provider: 'AWS', current: '$828/mo', optimized: '$0', savings: '$828/mo', pct: '100%', type: 'Release', risk: 'low' },
  { id: 'o8', resource: 'Cross-Region Data Transfer', provider: 'Multi', current: '$8,900/mo', optimized: '$2,200/mo', savings: '$6,700/mo', pct: '75%', type: 'CDN + caching', risk: 'low' },
];

export default function CostOptimizerPage() {
  const totalSavings = OVERRUNS.reduce((acc, o) => acc + parseInt(o.savings.replace(/[^0-9]/g, '')), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          {'💰'} Cost Optimizer
        </h1>
        <p className="text-zinc-400 text-sm mt-1">AI-powered cost analysis across all cloud providers — automated savings detection.</p>
      </div>

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#0d0d14] to-blue-500/10 border border-white/5 p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Total Annual Savings Detected</div>
            <div className="text-5xl font-bold font-mono text-emerald-400">${(totalSavings * 12 / 1000).toFixed(0)}K<span className="text-2xl text-emerald-400/60">/yr</span></div>
            <div className="text-sm text-zinc-400 mt-2">Across {OVERRUNS.length} optimization opportunities</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Monthly Burn Rate</div>
            <div className="text-2xl font-bold font-mono text-white">$150K</div>
            <div className="text-xs text-zinc-500 mt-1">Current spend</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">After Optimization</div>
            <div className="text-2xl font-bold font-mono text-emerald-400">$83K</div>
            <div className="text-xs text-emerald-400/60 mt-1">{'↓'} 44% reduction</div>
          </div>
        </div>
      </div>

      {/* Optimization Table */}
      <div className="rounded-2xl bg-[#0d0d14] border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Optimization Opportunities</h3>
          <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-all">
            Apply All Low-Risk
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {OVERRUNS.map(o => (
            <div key={o.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-lg shrink-0">
                {o.provider === 'AWS' ? '🟧' : o.provider === 'Azure' ? '🔵' : o.provider === 'GCP' ? '🔴' : '🌐'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-200 truncate">{o.resource}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">{o.type}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${o.risk === 'low' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {o.risk} risk
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 space-y-0.5">
                <div className="text-xs text-zinc-500 line-through">{o.current}</div>
                <div className="text-sm font-mono font-bold text-emerald-400">{o.savings}</div>
                <div className="text-[10px] text-emerald-400/60">{'↓'} {o.pct}</div>
              </div>
              <button className="shrink-0 px-3 py-1.5 bg-white/5 hover:bg-emerald-600 border border-white/10 hover:border-emerald-500 text-zinc-400 hover:text-white rounded-lg text-xs font-medium transition-all opacity-60 group-hover:opacity-100">
                Apply Fix
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
