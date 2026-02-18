'use client';
import { useState } from 'react';

const OPTIMIZATIONS = [
  { type: 'Right-Sizing', icon: '📐', count: 47, savings: 340000, desc: '47 VMs oversized by avg 3.2x', severity: 'high' },
  { type: 'Reserved Instances', icon: '📅', count: 12, savings: 280000, desc: 'RI/SP purchase opportunities across 3 clouds', severity: 'high' },
  { type: 'Waste Elimination', icon: '🗑️', count: 23, savings: 190000, desc: 'Orphaned disks, IPs, load balancers, snapshots', severity: 'medium' },
  { type: 'Storage Tiering', icon: '💾', count: 8, savings: 110000, desc: 'Move cold data to archive tiers', severity: 'medium' },
  { type: 'Schedule Optimization', icon: '⏰', count: 31, savings: 280000, desc: 'Dev/test environments running 24/7', severity: 'high' },
];

const SECURITY_FINDINGS = [
  { severity: 'critical', count: 0, label: 'Critical', color: 'text-red-500' },
  { severity: 'high', count: 3, label: 'High', color: 'text-orange-500' },
  { severity: 'medium', count: 12, label: 'Medium', color: 'text-amber-500' },
  { severity: 'low', count: 28, label: 'Low', color: 'text-yellow-500' },
  { severity: 'info', count: 47, label: 'Info', color: 'text-blue-400' },
];

export default function AnalyzerPage() {
  const [autoFixing, setAutoFixing] = useState(false);

  const totalSavings = OPTIMIZATIONS.reduce((sum, o) => sum + o.savings, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">ANALYZER</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Infrastructure Intelligence — 39 Functions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoFixing(true)}
            className="btn-primary flex items-center gap-2"
          >
            🔧 Auto-Remediate All
          </button>
        </div>
      </div>

      {/* Cost Savings Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-[#0d0d14] p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_60%)]" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-400/70 uppercase tracking-wider">Guaranteed Annual Savings</p>
            <p className="text-5xl font-bold mt-2">
              <span className="text-emerald-400">${(totalSavings / 1000000).toFixed(1)}M</span>
              <span className="text-lg text-zinc-500 ml-2">/ year</span>
            </p>
            <p className="text-sm text-zinc-500 mt-2">
              For an enterprise spending $5M/month → save <span className="text-emerald-400 font-medium">34%</span> annually
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Resources Analyzed</p>
            <p className="text-3xl font-bold tabular-nums">2,847</p>
            <p className="text-xs text-zinc-600 mt-1">Across AWS + Azure + GCP</p>
          </div>
        </div>
      </div>

      {/* Optimization Opportunities */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 mb-4">Cost Optimization Opportunities</h2>
        <div className="space-y-3">
          {OPTIMIZATIONS.map((opt, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-[#0d0d14] p-5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{opt.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{opt.type}</h3>
                    <span className="text-lg font-bold text-emerald-400">${(opt.savings / 1000).toFixed(0)}K</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{opt.desc}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-zinc-600">{opt.count} items</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      opt.severity === 'high'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>{opt.severity} priority</span>
                  </div>
                </div>
                <button className="btn-secondary text-xs">Apply Fix</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Posture */}
        <div className="rounded-xl border border-white/5 bg-[#0d0d14] p-6">
          <h2 className="text-sm font-semibold text-zinc-400 mb-4">Security Posture</h2>
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-blue-500/20">
              <span className="text-3xl font-bold">A+</span>
            </div>
            <div>
              <p className="text-lg font-semibold">Excellent</p>
              <p className="text-xs text-zinc-500 mt-1">0 critical vulnerabilities</p>
              <p className="text-xs text-zinc-500">Last scan: 15 minutes ago</p>
            </div>
          </div>
          <div className="space-y-2">
            {SECURITY_FINDINGS.map(f => (
              <div key={f.severity} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    f.severity === 'critical' ? 'bg-red-500' :
                    f.severity === 'high' ? 'bg-orange-500' :
                    f.severity === 'medium' ? 'bg-amber-500' :
                    f.severity === 'low' ? 'bg-yellow-500' : 'bg-blue-400'
                  }`} />
                  <span className="text-xs text-zinc-400">{f.label}</span>
                </div>
                <span className={`text-sm font-bold tabular-nums ${f.color}`}>{f.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time Repositioner */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-blue-500/20">
              🔒
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-300">Security Repositioner</h3>
              <p className="text-[10px] text-zinc-500">Real-time attack response — STANDBY</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-400 font-medium">STANDBY</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs font-medium text-zinc-300">Attack Response Playbooks</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['DDoS', 'Intrusion', 'Ransomware', 'Data Exfil'].map(t => (
                  <span key={t} className="text-[10px] text-center py-1 rounded bg-white/5 text-zinc-500">{t}</span>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs font-medium text-zinc-300">Auto-Actions Available</p>
              <p className="text-[10px] text-zinc-500 mt-1">Block IP, WAF Rules, Subnet Isolation, Credential Rotation, Account Lockdown, Evidence Snapshot</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
