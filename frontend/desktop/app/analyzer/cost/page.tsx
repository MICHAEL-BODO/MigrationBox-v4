'use client';

import React from 'react';
import { useApi } from '../../hooks/useApi';

export default function CostOptimizerPage() {
  const { data, loading, error } = useApi<any>('/api/analyzer/cost', { autoFetch: true });

  const overruns = data?.overruns || []; 
  const totalSavings = overruns.reduce((acc: number, o: any) => acc + (o.savingsValue || 0), 0);
  const burnRate = data?.burnRate || 150000;
  const optimizedRate = burnRate - totalSavings;
  const percentReduction = Math.round((totalSavings / burnRate) * 100) || 0;

  const handleApplyFix = async (id: string) => {
    // In a real app, this would call /api/analyzer/cost/fix/{id}
    console.log(`Applying fix for ${id}`);
    alert(`Applying optimization: ${id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          {'💰'} Cost Optimizer
        </h1>
        <p className="text-zinc-400 text-sm mt-1">AI-powered cost analysis across all cloud providers — automated savings detection.</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          Failed to load cost data: {error.message}.
        </div>
      )}

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#0d0d14] to-blue-500/10 border border-white/5 p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Total Annual Savings Detected</div>
            <div className="text-5xl font-bold font-mono text-emerald-400">
              ${((totalSavings * 12) / 1000).toFixed(0)}K
              <span className="text-2xl text-emerald-400/60">/yr</span>
            </div>
            <div className="text-sm text-zinc-400 mt-2">Across {overruns.length} optimization opportunities</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Monthly Burn Rate</div>
            <div className="text-2xl font-bold font-mono text-white">${(burnRate / 1000).toFixed(0)}K</div>
            <div className="text-xs text-zinc-500 mt-1">Current spend</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">After Optimization</div>
            <div className="text-2xl font-bold font-mono text-emerald-400">${(optimizedRate / 1000).toFixed(0)}K</div>
            <div className="text-xs text-emerald-400/60 mt-1">{'↓'} {percentReduction}% reduction</div>
          </div>
        </div>
      </div>

      {loading && !data && (
        <div className="p-8 text-center text-zinc-500 animate-pulse">Analyzing cloud spend...</div>
      )}

      {/* Optimization Table */}
      <div className="rounded-2xl bg-[#0d0d14] border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Optimization Opportunities</h3>
          <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-all">
            Apply All Low-Risk
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {overruns.length === 0 && !loading && (
             <div className="p-6 text-center text-zinc-500 italic">No optimization opportunities found.</div>
          )}
          {overruns.map((o: any) => (
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
              <button 
                onClick={() => handleApplyFix(o.id)}
                className="shrink-0 px-3 py-1.5 bg-white/5 hover:bg-emerald-600 border border-white/10 hover:border-emerald-500 text-zinc-400 hover:text-white rounded-lg text-xs font-medium transition-all opacity-60 group-hover:opacity-100"
              >
                Apply Fix
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
