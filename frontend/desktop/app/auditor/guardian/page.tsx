'use client';

import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

export default function GuardianAgentPage() {
  const guardian = useApi<any>('/api/auditor/guardian', { autoFetch: true, pollingInterval: 5000 });
  
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setPulse(p => p + 1), 2000);
    return () => clearInterval(iv);
  }, []);

  const data = guardian.data;
  const active = data?.active ?? true;
  const violations = data?.violations ?? [];
  const monitoring = data?.monitoring ?? { aws: 0, azure: 0, gcp: 0 };
  const stats = data?.stats ?? { blocked: 0, fines: 0, uptime: '100%' };

  const severityColor = (s: string) => {
    if (s === 'critical') return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    if (s === 'high') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (s === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  const actionColor = (a: string) => {
    if (a === 'BLOCKED') return 'text-rose-400';
    if (a === 'REMEDIATED' || a === 'AUTO-DELETED') return 'text-emerald-400';
    return 'text-amber-400';
  };

  const toggleGuardian = async () => {
    await guardian.post({ active: !active });
    guardian.fetch(); 
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            {'👁️'} Guardian Agent
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Real-time compliance enforcement — Autonomous violation blocking & remediation</p>
        </div>
        <button 
          onClick={toggleGuardian}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${active ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <span className={`text-sm font-semibold ${active ? 'text-emerald-400' : 'text-red-400'}`}>
            {active ? 'ACTIVE 24/7' : 'DISABLED'}
          </span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Violations Blocked Today', value: stats.blocked.toString(), icon: '🛡️', color: 'from-rose-500/20 to-rose-500/5', accent: 'text-rose-400' },
          { label: 'Fines Avoided (Total)', value: `$${(stats.fines / 1000000).toFixed(1)}M`, icon: '💰', color: 'from-emerald-500/20 to-emerald-500/5', accent: 'text-emerald-400' },
          { label: 'Response Time', value: '<50ms', icon: '⚡', color: 'from-violet-500/20 to-violet-500/5', accent: 'text-violet-400' },
          { label: 'Uptime', value: stats.uptime, icon: '🔄', color: 'from-blue-500/20 to-blue-500/5', accent: 'text-blue-400' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-[#0d0d14] border border-white/5 p-5 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.color} pointer-events-none`} />
            <div className="relative">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{s.label}</div>
              <div className={`text-2xl font-bold font-mono ${s.accent}`}>{s.value}</div>
              <div className="text-lg mt-1">{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Guardian Visualization + Violation Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual */}
        <div className="rounded-2xl bg-[#0d0d14] border border-white/5 p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          <div className="relative">
            {/* Pulsing rings */}
            {active && (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-40 h-40 rounded-full border border-emerald-500/20 ${pulse % 2 === 0 ? 'scale-110 opacity-0' : 'scale-100 opacity-100'} transition-all duration-1000`} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-52 h-52 rounded-full border border-emerald-500/10 ${pulse % 2 === 1 ? 'scale-110 opacity-0' : 'scale-100 opacity-100'} transition-all duration-1000`} />
                </div>
              </>
            )}
            <div className={`w-28 h-28 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${
              active 
                ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_60px_-10px_rgba(16,185,129,0.4)]' 
                : 'bg-zinc-500/10 border-zinc-500/30'
            }`}>
              <span className={`text-5xl grayscale-0 transition-all ${!active && 'grayscale opacity-50'}`}>{'👁️'}</span>
            </div>
          </div>
          <div className="mt-8 text-center space-y-2">
            <h3 className="text-lg font-semibold text-white">{active ? 'Guardian Active' : 'Guardian Standby'}</h3>
            <p className="text-sm text-zinc-400 max-w-xs">Monitoring all cloud resources across AWS, Azure, and GCP for compliance violations in real-time.</p>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center w-full">
            {[
              { label: 'AWS', count: monitoring.aws, status: '●' },
              { label: 'Azure', count: monitoring.azure, status: '●' },
              { label: 'GCP', count: monitoring.gcp, status: '●' },
            ].map((c, i) => (
              <div key={i} className="space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase">{c.label}</div>
                <div className="text-sm font-mono text-white">{c.count}</div>
                <span className={`text-xs ${active ? 'text-emerald-400' : 'text-zinc-600'}`}>{c.status} Monitored</span>
              </div>
            ))}
          </div>
        </div>

        {/* Violation Feed */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0d0d14] border border-white/5 p-6 flex flex-col h-[500px]">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            Recent Violations & Actions
            {active && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/>}
          </h3>
          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {violations.length === 0 ? (
              <div className="text-center text-zinc-500 py-20 italic">No violations detected in the last 24h</div>
            ) : violations.map((v: any) => (
              <div key={v.id} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group animate-in fade-in slide-in-from-top-4 duration-500">
                <div className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded border ${severityColor(v.severity)} uppercase`}>
                  {v.severity}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">{v.framework}</span>
                    <span className="text-xs text-zinc-600">{v.time}</span>
                  </div>
                  <p className="text-sm text-zinc-300 truncate">{v.desc}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-xs font-bold ${actionColor(v.action)}`}>{v.action}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Fine avoided: {v.fine}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
