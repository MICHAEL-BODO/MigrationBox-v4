'use client';

import React from 'react';

const REPORTS = [
  { id: 'r1', name: 'Full Compliance Audit — ISO27001 + SOX + GDPR', date: '2026-02-18', score: 93, status: 'completed', frameworks: ['ISO27001', 'SOX', 'GDPR'], findings: 12 },
  { id: 'r2', name: 'HIPAA ePHI Data Handling Assessment', date: '2026-02-17', score: 88, status: 'completed', frameworks: ['HIPAA'], findings: 8 },
  { id: 'r3', name: 'PCI-DSS Quarterly Scan', date: '2026-02-15', score: 96, status: 'completed', frameworks: ['PCI-DSS'], findings: 3 },
  { id: 'r4', name: 'SOC2 Type II Readiness Check', date: '2026-02-14', score: 91, status: 'completed', frameworks: ['SOC2'], findings: 6 },
  { id: 'r5', name: 'Cross-Cloud Security Posture Review', date: '2026-02-10', score: 85, status: 'completed', frameworks: ['ISO27001', 'SOC2'], findings: 15 },
  { id: 'r6', name: 'Real-Time Continuous Monitoring — Weekly', date: '2026-02-18', score: 0, status: 'running', frameworks: ['ALL'], findings: 0 },
];

export default function ReportsPage() {
  const scoreColor = (s: number) => {
    if (s >= 95) return 'text-emerald-400';
    if (s >= 85) return 'text-blue-400';
    if (s >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            {'📋'} Compliance Reports
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Audit history, compliance scores, and downloadable reports.</p>
        </div>
        <a href="/auditor/one-click" className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-violet-500/20">
          {'+'} New Audit
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Audits', value: '24', sub: 'This quarter' },
          { label: 'Avg Score', value: '92.3', sub: '\u2191 +3.1 from last quarter' },
          { label: 'Open Findings', value: '18', sub: '3 critical, 7 high' },
          { label: 'Frameworks Covered', value: '6/6', sub: 'Full coverage' },
        ].map((c, i) => (
          <div key={i} className="rounded-xl bg-[#0d0d14] border border-white/5 p-5">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{c.label}</div>
            <div className="text-2xl font-bold font-mono text-white">{c.value}</div>
            <div className="text-xs text-zinc-500 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl bg-[#0d0d14] border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Recent Reports</h3>
        </div>
        <div className="divide-y divide-white/5">
          {REPORTS.map(r => (
            <div key={r.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {r.status === 'running' ? (
                  <span className="w-3 h-3 bg-violet-500 rounded-full animate-pulse" />
                ) : (
                  <span className={`text-xl font-bold font-mono ${scoreColor(r.score)}`}>{r.score}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate">{r.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500">{r.date}</span>
                  <span className="text-zinc-700">{'•'}</span>
                  {r.frameworks.map(f => (
                    <span key={f} className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">{f}</span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {r.status === 'running' ? (
                  <span className="text-xs text-violet-400 font-medium px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">Running...</span>
                ) : (
                  <div>
                    <div className="text-xs text-zinc-500">{r.findings} findings</div>
                    <div className="text-xs text-zinc-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">View Report {'→'}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
