'use client';
import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export default function AuditorPage() {
  const scan = useApi<any>('/api/scan', { autoFetch: true });
  const audit = useApi<any>('/api/auditor/audit', { autoFetch: true });
  const guardian = useApi<any>('/api/auditor/guardian', { autoFetch: true, pollingInterval: 5000 });
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);

  const startOneClickAudit = async () => {
    // Step 1: If no scan data, run scan first
    if (scan.data?.status === 'idle') {
      setAuditRunning(true);
      setAuditProgress(5);
      await scan.post({ wait: true });
      setAuditProgress(40);
    }

    // Step 2: Run audit
    setAuditRunning(true);
    setAuditProgress(50);
    const result = await audit.post();
    setAuditProgress(100);

    setTimeout(() => {
      setAuditRunning(false);
      audit.fetch();
    }, 800);
  };

  const toggleGuardian = async () => {
    await guardian.post({ action: 'toggle' });
    guardian.fetch();
  };

  // Derive display data from API response
  const auditData = audit.data?.audit;
  const overallScore = auditData?.overallScore ?? 0;
  const grade = auditData?.grade ?? '—';
  const frameworks = auditData?.frameworks ?? [];
  const findings = auditData?.findingsBySeverity ?? { critical: 0, high: 0, medium: 0, low: 0 };
  const guardianData = guardian.data;
  const guardianActive = guardianData?.active ?? false;
  const guardianStats = guardianData?.stats ?? {};

  const totalPassing = frameworks.reduce((s: number, f: any) => s + (f.passingControls ?? 0), 0);
  const totalControls = frameworks.reduce((s: number, f: any) => s + (f.totalControls ?? 0), 0);
  const totalFailing = frameworks.reduce((s: number, f: any) => s + (f.failingControls ?? 0), 0);
  const totalWarnings = frameworks.reduce((s: number, f: any) => s + (f.warnings ?? 0), 0);

  const FW_ICONS: Record<string, string> = {
    'ISO27001': '🔐', 'GDPR': '🇪🇺', 'SOX': '📊', 'HIPAA': '🏥', 'SOC2': '✅', 'PCI-DSS': '💳',
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
          <p className="text-sm text-zinc-500 mt-1">Compliance & Regulatory Engine — Live Backend</p>
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

      {/* Progress Bar */}
      {auditRunning && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-violet-300">Full Compliance Audit Running</span>
            <span className="text-xs text-zinc-500">ISO27001 + SOX + GDPR + HIPAA + SOC2 + PCI-DSS</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, auditProgress)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            {auditProgress < 40 ? 'Scanning network...' : auditProgress < 90 ? 'Analyzing compliance...' : 'Generating reports...'}
          </p>
        </div>
      )}

      {/* No scan state */}
      {!auditData && !auditRunning && (
        <div className="rounded-xl border border-white/10 bg-[#0d0d14] p-12 text-center">
          <span className="text-5xl block mb-4">⚡</span>
          <h2 className="text-lg font-semibold text-zinc-300">No Audit Data Yet</h2>
          <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
            Click "One-Click Audit" to scan your network and run compliance checks across all 6 frameworks.
            This will first discover hosts on your LAN, then analyze them against ISO27001, GDPR, SOX, HIPAA, SOC2, and PCI-DSS.
          </p>
        </div>
      )}

      {/* Compliance Score Overview */}
      {auditData && (
        <div className="rounded-xl border border-white/10 bg-[#0d0d14] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-zinc-400">Overall Compliance Score</h2>
            <span className="text-xs text-zinc-600">Audit: {auditData.timestamp ? new Date(auditData.timestamp).toLocaleString() : '—'}</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-800" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="url(#scoreGradient)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${overallScore * 3.01} ${(100 - overallScore) * 3.01}`}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{overallScore}</span>
                <span className="text-[10px] text-zinc-500">/ 100 ({grade})</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-emerald-400">{totalPassing}</p>
                <p className="text-xs text-zinc-500">Controls Passing</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">{totalWarnings}</p>
                <p className="text-xs text-zinc-500">Warnings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{totalFailing}</p>
                <p className="text-xs text-zinc-500">Failures</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">{auditData.totalFindings ?? 0}</p>
                <p className="text-xs text-zinc-500">Findings</p>
              </div>
            </div>
          </div>
          {auditData.estimatedFinesAvoided > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5 text-center">
              <span className="text-xs text-zinc-500">Estimated Fines Avoided: </span>
              <span className="text-lg font-bold text-emerald-400">${(auditData.estimatedFinesAvoided / 1_000_000).toFixed(0)}M</span>
            </div>
          )}
        </div>
      )}

      {/* Framework Cards */}
      {frameworks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 mb-4">Framework Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {frameworks.map((fw: any) => (
              <div key={fw.framework} className="rounded-xl border border-white/5 bg-[#0d0d14] p-5 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{FW_ICONS[fw.framework] ?? '📋'}</span>
                    <span className="text-sm font-semibold">{fw.framework}</span>
                  </div>
                  <span className={`text-lg font-bold ${fw.score >= 95 ? 'text-emerald-400' : fw.score >= 90 ? 'text-blue-400' : fw.score >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                    {fw.score}%
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      fw.score >= 95 ? 'bg-emerald-500' : fw.score >= 90 ? 'bg-blue-500' : fw.score >= 80 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${fw.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-600">{fw.passingControls}/{fw.totalControls} controls passing · {fw.failingControls} failing · {fw.warnings} warnings</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Findings Breakdown */}
      {auditData && auditData.totalFindings > 0 && (
        <div className="rounded-xl border border-white/5 bg-[#0d0d14] p-6">
          <h2 className="text-sm font-semibold text-zinc-400 mb-4">Findings by Severity</h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Critical', count: findings.critical, color: 'text-red-500', bg: 'bg-red-500' },
              { label: 'High', count: findings.high, color: 'text-orange-500', bg: 'bg-orange-500' },
              { label: 'Medium', count: findings.medium, color: 'text-amber-500', bg: 'bg-amber-500' },
              { label: 'Low', count: findings.low, color: 'text-yellow-500', bg: 'bg-yellow-500' },
            ].map(f => (
              <div key={f.label} className="text-center">
                <div className={`w-3 h-3 rounded-full ${f.bg} mx-auto mb-2`} />
                <p className={`text-2xl font-bold tabular-nums ${f.color}`}>{f.count}</p>
                <p className="text-xs text-zinc-500">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guardian Agent */}
      <div className={`rounded-xl border p-6 ${guardianActive ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-[#0d0d14]'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20">
            👁️
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-300">Guardian Agent</h3>
            <p className="text-[10px] text-zinc-500">Real-time compliance enforcement — {guardianActive ? 'ACTIVE' : 'INACTIVE'}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${guardianActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span className={`text-xs font-medium ${guardianActive ? 'text-emerald-400' : 'text-zinc-500'}`}>{guardianActive ? 'ENFORCING' : 'STANDBY'}</span>
            </div>
            <button
              onClick={toggleGuardian}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                guardianActive
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {guardianActive ? '⏸ Pause' : '▶ Activate'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xl font-bold text-red-400">{guardianStats.totalViolations ?? 0}</p>
            <p className="text-[10px] text-zinc-500">Violations Recorded</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{guardianStats.totalEvents ?? 0}</p>
            <p className="text-[10px] text-zinc-500">Events Tracked</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <p className="text-xl font-bold text-violet-400">24/7</p>
            <p className="text-[10px] text-zinc-500">Active Monitoring</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-2 gap-4">
        <a href="/auditor/one-click" className="rounded-xl border border-white/5 bg-[#0d0d14] p-5 hover:border-violet-500/30 transition-all group">
          <span className="text-2xl">⚡</span>
          <h3 className="text-sm font-semibold mt-2 group-hover:text-violet-400 transition-colors">One-Click Audit</h3>
          <p className="text-xs text-zinc-500 mt-1">Full visual audit experience with live log</p>
        </a>
        <a href="/auditor/reports" className="rounded-xl border border-white/5 bg-[#0d0d14] p-5 hover:border-violet-500/30 transition-all group">
          <span className="text-2xl">📜</span>
          <h3 className="text-sm font-semibold mt-2 group-hover:text-violet-400 transition-colors">Compliance Reports</h3>
          <p className="text-xs text-zinc-500 mt-1">Executive summary & remediation plans</p>
        </a>
      </div>
    </div>
  );
}
