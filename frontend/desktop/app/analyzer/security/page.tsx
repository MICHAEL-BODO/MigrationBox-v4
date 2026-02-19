'use client';

import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';

export default function SecurityCenterPage() {
  const [attackMode, setAttackMode] = useState(false);

  const { data, loading, error } = useApi<any>('/api/analyzer/security', { autoFetch: true });

  const threats = data?.threats || [];
  const grade = data?.grade || 'A+';
  const posture = data?.posture || 'Excellent';
  const stats = data?.stats || { critical: 0, high: 0, medium: 0, low: 0 };
  const resolved = data?.resolved || { critical: 0, high: 0, medium: 0 };

  const severityBg = (s: string) => {
    if (s === 'critical') return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    if (s === 'high') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (s === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  const statusStyle = (s: string) => {
    if (s === 'remediated' || s === 'blocked') return 'text-emerald-400';
    if (s === 'patching' || s === 'remediating') return 'text-violet-400';
    return 'text-amber-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            {'🔒'} Security Center
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Real-time threat detection, vulnerability management, and attack response.
          </p>
        </div>
        <button
          onClick={() => setAttackMode(!attackMode)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            attackMode
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30 animate-pulse'
              : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white'
          }`}
        >
          {attackMode ? '🚨 ATTACK MODE ACTIVE' : '🛡️ Simulate Attack'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          Failed to load security data: {error.message}
        </div>
      )}

      {/* Security Posture */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2 rounded-xl bg-[#0d0d14] border border-white/5 p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
            <span className="text-3xl font-bold text-emerald-400">{grade}</span>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Security Grade
            </div>
            <div className="text-lg font-semibold text-white">{posture} Posture</div>
            <div className="text-xs text-zinc-400">
              {stats.critical} critical unresolved, {stats.high} high in progress
            </div>
          </div>
        </div>
        {[
          {
            label: 'Critical',
            value: stats.critical.toString(),
            color: 'text-rose-400',
            resolved: `${resolved.critical} resolved`,
          },
          {
            label: 'High',
            value: stats.high.toString(),
            color: 'text-amber-400',
            resolved: `${resolved.high} resolved`,
          },
          {
            label: 'Medium',
            value: stats.medium.toString(),
            color: 'text-yellow-400',
            resolved: `${resolved.medium} resolved`,
          },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-[#0d0d14] border border-white/5 p-5">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{s.label}</div>
            <div className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-zinc-500 mt-1">{s.resolved}</div>
          </div>
        ))}
      </div>

      {loading && !data && (
        <div className="p-8 text-center text-zinc-500 animate-pulse">Scanning for threats...</div>
      )}

      {/* Attack Repositioner Panel */}
      {attackMode && (
        <div className="rounded-2xl bg-rose-500/5 border border-rose-500/20 p-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{'🚨'}</span>
            <div>
              <h3 className="text-lg font-bold text-rose-400">Security Repositioner — ACTIVE</h3>
              <p className="text-sm text-zinc-400">
                Automatically repositioning workloads away from compromised infrastructure.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { action: 'Isolating compromised VMs', status: 'Complete', icon: '🔒' },
              { action: 'Rotating all IAM credentials', status: 'In Progress...', icon: '🔑' },
              { action: 'Redirecting traffic to clean region', status: 'Queued', icon: '🌐' },
            ].map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#0d0d14] border border-white/5"
              >
                <span className="text-lg">{a.icon}</span>
                <div>
                  <div className="text-sm text-zinc-300">{a.action}</div>
                  <div
                    className={`text-xs ${a.status === 'Complete' ? 'text-emerald-400' : a.status.includes('Progress') ? 'text-violet-400' : 'text-zinc-500'}`}
                  >
                    {a.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threat Feed */}
      <div className="rounded-2xl bg-[#0d0d14] border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Active Threats
          </h3>
        </div>
        <div className="divide-y divide-white/5">
          {threats.length === 0 && !loading && (
            <div className="p-6 text-center text-zinc-500 italic">No active threats detected.</div>
          )}
          {threats.map((t: any) => (
            <div
              key={t.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors"
            >
              <div
                className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded border ${severityBg(t.severity)} uppercase`}
              >
                {t.severity}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-200 truncate">{t.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500">{t.affected}</span>
                  <span className="text-zinc-700">{'•'}</span>
                  <span className="text-xs text-zinc-500">{t.provider}</span>
                </div>
              </div>
              <span className={`text-xs font-medium ${statusStyle(t.status)} capitalize`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
