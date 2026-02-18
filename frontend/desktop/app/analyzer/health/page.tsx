'use client';

import React, { useState, useEffect } from 'react';

const SERVICES = [
  { name: 'API Gateway', provider: 'AWS', cpu: 34, memory: 52, latency: '12ms', status: 'healthy', uptime: '99.99%' },
  { name: 'Kubernetes Cluster', provider: 'GCP', cpu: 67, memory: 71, latency: '8ms', status: 'healthy', uptime: '99.97%' },
  { name: 'SQL Database', provider: 'Azure', cpu: 45, memory: 82, latency: '5ms', status: 'warning', uptime: '99.95%' },
  { name: 'Redis Cache', provider: 'AWS', cpu: 12, memory: 38, latency: '1ms', status: 'healthy', uptime: '100%' },
  { name: 'CDN Edge', provider: 'Multi', cpu: 8, memory: 15, latency: '3ms', status: 'healthy', uptime: '100%' },
  { name: 'Message Queue', provider: 'AWS', cpu: 28, memory: 44, latency: '2ms', status: 'healthy', uptime: '99.99%' },
  { name: 'ML Inference', provider: 'GCP', cpu: 89, memory: 76, latency: '45ms', status: 'warning', uptime: '99.90%' },
  { name: 'Object Storage', provider: 'Multi', cpu: 5, memory: 0, latency: '15ms', status: 'healthy', uptime: '100%' },
];

export default function HealthMonitorPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(iv);
  }, []);

  const barColor = (pct: number) => {
    if (pct > 80) return 'bg-rose-500';
    if (pct > 60) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          {'❤️'} Health Monitor
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Real-time infrastructure health across all cloud providers.</p>
      </div>

      {/* Overall Health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Overall Health', value: '98.2%', color: 'text-emerald-400', icon: '💚' },
          { label: 'Services Up', value: `${SERVICES.filter(s => s.status === 'healthy').length}/${SERVICES.length}`, color: 'text-white', icon: '✅' },
          { label: 'Avg Latency', value: '11ms', color: 'text-blue-400', icon: '⚡' },
          { label: 'Incidents (24h)', value: '0', color: 'text-emerald-400', icon: '🎯' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-[#0d0d14] border border-white/5 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Services Grid */}
      <div className="rounded-2xl bg-[#0d0d14] border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Service Health</h3>
        </div>
        <div className="divide-y divide-white/5">
          {SERVICES.map((svc, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
              {/* Status */}
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${svc.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              
              {/* Name + Provider */}
              <div className="w-48 shrink-0">
                <div className="text-sm font-medium text-zinc-200">{svc.name}</div>
                <div className="text-xs text-zinc-500">{svc.provider}</div>
              </div>

              {/* CPU Bar */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-500">CPU</span>
                  <span className="text-[10px] font-mono text-zinc-400">{svc.cpu}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(svc.cpu)} transition-all duration-500`} style={{ width: `${svc.cpu}%` }} />
                </div>
              </div>

              {/* Memory Bar */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-zinc-500">Memory</span>
                  <span className="text-[10px] font-mono text-zinc-400">{svc.memory}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(svc.memory)} transition-all duration-500`} style={{ width: `${svc.memory}%` }} />
                </div>
              </div>

              {/* Latency */}
              <div className="w-16 text-right shrink-0">
                <div className="text-sm font-mono text-zinc-300">{svc.latency}</div>
              </div>

              {/* Uptime */}
              <div className="w-20 text-right shrink-0">
                <div className={`text-sm font-mono ${svc.uptime === '100%' ? 'text-emerald-400' : 'text-zinc-300'}`}>{svc.uptime}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
