'use client';
import { useState } from 'react';

const FRAMEWORKS = [
  { name: 'ISO 27001', score: 96, passing: 412, total: 430, color: 'violet', icon: '🔐' },
  { name: 'SOX', score: 91, passing: 178, total: 196, color: 'blue', icon: '📊' },
  { name: 'GDPR', score: 97, passing: 89, total: 92, color: 'purple', icon: '🇪🇺' },
  { name: 'HIPAA', score: 88, passing: 68, total: 77, color: 'red', icon: '🏥' },
  { name: 'SOC 2', score: 94, passing: 56, total: 60, color: 'emerald', icon: '✅' },
  { name: 'PCI DSS', score: 93, passing: 44, total: 47, color: 'amber', icon: '💳' },
];

export default function AuditorPage() {
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);

  const startOneClickAudit = () => {
    setAuditRunning(true);
    setAuditProgress(0);
    const interval = setInterval(() => {
      setAuditProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setAuditRunning(false); return 100; }
        return prev + Math.random() * 3;
      });
    }, 500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">AUDITOR</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Compliance & Regulatory Engine — 42 Functions</p>
        </div>
        <button
          onClick={startOneClickAudit}
          disabled={auditRunning}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {auditRunning ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running... {Math.min(100, Math.round(auditProgress))}%
            </>
          ) : (
            <>⚡ One-Click Audit</>
          )}
        </button>
      </div>

      {/* Progress Bar (when audit running) */}
      {auditRunning && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-violet-300">Full Compliance Audit Running</span>
            <span className="text-xs text-zinc-500">ISO27001 + SOX + GDPR + HIPAA + SOC2 + PCI DSS</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, auditProgress)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-600 mt-2">Estimated completion: 30 minutes</p>
        </div>
      )}

      {/* Compliance Score Overview */}
      <div className="rounded-xl border border-white/10 bg-[#0d0d14] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-zinc-400">Overall Compliance Score</h2>
          <span className="text-xs text-zinc-600">Last scan: 2 hours ago</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-800" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="url(#scoreGradient)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${94 * 3.01} ${(100 - 94) * 3.01}`}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">94</span>
              <span className="text-[10px] text-zinc-500">/ 100</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-emerald-400">847</p>
              <p className="text-xs text-zinc-500">Controls Passing</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">55</p>
              <p className="text-xs text-zinc-500">Warnings</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">10</p>
              <p className="text-xs text-zinc-500">Failures</p>
            </div>
          </div>
        </div>
      </div>

      {/* Framework Cards */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 mb-4">Framework Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FRAMEWORKS.map(fw => (
            <div key={fw.name} className="rounded-xl border border-white/5 bg-[#0d0d14] p-5 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{fw.icon}</span>
                  <span className="text-sm font-semibold">{fw.name}</span>
                </div>
                <span className={`text-lg font-bold ${fw.score >= 95 ? 'text-emerald-400' : fw.score >= 90 ? 'text-blue-400' : 'text-amber-400'}`}>
                  {fw.score}%
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    fw.score >= 95 ? 'bg-emerald-500' : fw.score >= 90 ? 'bg-blue-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${fw.score}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-600">{fw.passing}/{fw.total} controls passing</p>
            </div>
          ))}
        </div>
      </div>

      {/* Guardian Agent */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20">
            👁️
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-300">Guardian Agent</h3>
            <p className="text-[10px] text-zinc-500">Real-time compliance enforcement — ACTIVE</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">ENFORCING</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xl font-bold text-red-400">7</p>
            <p className="text-[10px] text-zinc-500">Violations Blocked Today</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">$142M</p>
            <p className="text-[10px] text-zinc-500">Fines Avoided</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xl font-bold text-violet-400">24/7</p>
            <p className="text-[10px] text-zinc-500">Active Monitoring</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-emerald-500/10">
          <p className="text-xs text-zinc-500">Latest action:</p>
          <p className="text-xs text-zinc-300 mt-1">
            <span className="text-red-400 font-medium">BLOCKED</span> — PII data leak attempt to external domain (GDPR Art. 32 violation). Estimated fine avoided: <span className="text-emerald-400 font-medium">$20,000,000</span>
          </p>
        </div>
      </div>
    </div>
  );
}
