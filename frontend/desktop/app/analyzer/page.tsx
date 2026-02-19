'use client';
import { useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function AnalyzerPage() {
  const scan = useApi<any>('/api/scan', { autoFetch: true });
  const analysis = useApi<any>('/api/analyzer/analyze', { autoFetch: true });
  const cost = useApi<any>('/api/analyzer/cost', { autoFetch: true });
  const security = useApi<any>('/api/analyzer/security', { autoFetch: true });
  const health = useApi<any>('/api/analyzer/health', { autoFetch: true });
  const [analyzing, setAnalyzing] = useState(false);

  const runAnalysis = async () => {
    setAnalyzing(true);
    // Scan if needed
    if (scan.data?.status === 'idle') {
      await scan.post({ wait: true });
    }
    await analysis.post();
    // Refresh sub-views
    await Promise.all([cost.fetch(), security.fetch(), health.fetch()]);
    setAnalyzing(false);
  };

  const analysisData = analysis.data?.analysis;
  const costData = cost.data;
  const securityData = security.data;
  const healthData = health.data;

  const optimizations = costData?.optimizations ?? [];
  const totalSavings = costData?.summary?.totalAnnualSavings ?? 0;
  const savingsPercent = costData?.summary?.savingsPercent ?? 0;

  const securityGrade = analysisData?.securityGrade ?? securityData?.securityGrade ?? '—';
  const securityFindings = securityData?.summary ?? analysisData?.findingsBySeverity ?? {};
  const attackSurface = securityData?.attackSurface ?? analysisData?.attackSurface;

  const healthScore = healthData?.healthScore ?? analysisData?.healthScore ?? 0;
  const healthSummary = healthData?.summary ?? {};

  const OPT_ICONS: Record<string, string> = {
    rightsizing: '📐', waste: '🗑️', storage: '💾', architecture: '🏗️',
    reserved: '📅', schedule: '⏰', licensing: '📜', network: '🌐',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">ANALYZER</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Infrastructure Intelligence — Live Backend</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {analyzing ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
            ) : (
              <>🔍 Run Full Analysis</>
            )}
          </button>
        </div>
      </div>

      {/* No data state */}
      {!analysisData && !analyzing && (
        <div className="rounded-xl border border-white/10 bg-[#0d0d14] p-12 text-center">
          <span className="text-5xl block mb-4">🔍</span>
          <h2 className="text-lg font-semibold text-zinc-300">No Analysis Data Yet</h2>
          <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
            Click "Run Full Analysis" to scan your network and analyze security posture, cost optimization opportunities, and service health.
          </p>
        </div>
      )}

      {/* Cost Savings Hero */}
      {analysisData && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-[#0d0d14] p-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_60%)]" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-400/70 uppercase tracking-wider">Detected Annual Savings</p>
              <p className="text-5xl font-bold mt-2">
                <span className="text-emerald-400">${totalSavings > 1_000_000 ? (totalSavings / 1_000_000).toFixed(1) + 'M' : (totalSavings / 1000).toFixed(0) + 'K'}</span>
                <span className="text-lg text-zinc-500 ml-2">/ year</span>
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                Potential savings of <span className="text-emerald-400 font-medium">{savingsPercent}%</span> across {optimizations.length} optimizations
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Health Score</p>
              <p className="text-3xl font-bold tabular-nums">{healthScore}<span className="text-lg text-zinc-500">/100</span></p>
              <p className="text-xs text-zinc-600 mt-1">Security: {securityGrade}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cost Optimization Opportunities */}
      {optimizations.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 mb-4">Cost Optimization Opportunities</h2>
          <div className="space-y-3">
            {optimizations.map((opt: any) => (
              <div key={opt.id} className="rounded-xl border border-white/5 bg-[#0d0d14] p-5 hover:border-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{OPT_ICONS[opt.category] ?? '💡'}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{opt.title}</h3>
                      <span className="text-lg font-bold text-emerald-400">
                        ${opt.savingsAnnual > 1000 ? (opt.savingsAnnual / 1000).toFixed(0) + 'K' : opt.savingsAnnual}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{opt.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-zinc-600">${opt.currentCost}/mo → ${opt.optimizedCost}/mo</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        opt.risk === 'low' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        opt.risk === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>{opt.risk} risk</span>
                      {opt.autoApplicable && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">auto-fix</span>
                      )}
                    </div>
                  </div>
                  <button className="btn-secondary text-xs">{opt.autoApplicable ? '⚡ Apply' : '📋 Plan'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security + Health Grid */}
      {analysisData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Posture */}
          <div className="rounded-xl border border-white/5 bg-[#0d0d14] p-6">
            <h2 className="text-sm font-semibold text-zinc-400 mb-4">Security Posture</h2>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-blue-500/20">
                <span className="text-3xl font-bold">{securityGrade}</span>
              </div>
              <div>
                <p className="text-lg font-semibold">{securityGrade.includes('A') ? 'Excellent' : securityGrade.includes('B') ? 'Good' : 'Needs Work'}</p>
                <p className="text-xs text-zinc-500 mt-1">{securityFindings.critical ?? 0} critical vulnerabilities</p>
                <p className="text-xs text-zinc-500">{securityFindings.high ?? 0} high severity findings</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { severity: 'critical', label: 'Critical', color: 'text-red-500', count: securityFindings.critical ?? 0 },
                { severity: 'high', label: 'High', color: 'text-orange-500', count: securityFindings.high ?? 0 },
                { severity: 'medium', label: 'Medium', color: 'text-amber-500', count: securityFindings.medium ?? 0 },
                { severity: 'low', label: 'Low', color: 'text-yellow-500', count: securityFindings.low ?? 0 },
              ].map(f => (
                <div key={f.severity} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      f.severity === 'critical' ? 'bg-red-500' :
                      f.severity === 'high' ? 'bg-orange-500' :
                      f.severity === 'medium' ? 'bg-amber-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-xs text-zinc-400">{f.label}</span>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${f.color}`}>{f.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Health Monitor */}
          <div className="rounded-xl border border-white/5 bg-[#0d0d14] p-6">
            <h2 className="text-sm font-semibold text-zinc-400 mb-4">Service Health</h2>
            <div className="flex items-center gap-6 mb-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl ${
                healthScore >= 90 ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/20' :
                healthScore >= 70 ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20' :
                'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/20'
              }`}>
                <span className="text-3xl font-bold">{healthScore}</span>
              </div>
              <div>
                <p className="text-lg font-semibold">{healthScore >= 90 ? 'Healthy' : healthScore >= 70 ? 'Degraded' : 'Critical'}</p>
                <p className="text-xs text-zinc-500 mt-1">{healthSummary.total ?? 0} services monitored</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-emerald-400">{healthSummary.healthy ?? 0}</p>
                <p className="text-[10px] text-zinc-500">Healthy</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-amber-400">{healthSummary.degraded ?? 0}</p>
                <p className="text-[10px] text-zinc-500">Degraded</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-red-400">{healthSummary.down ?? 0}</p>
                <p className="text-[10px] text-zinc-500">Down</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attack Surface */}
      {attackSurface && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
          <h2 className="text-sm font-semibold text-blue-300 mb-4">🎯 Attack Surface Report</h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{attackSurface.totalExposedPorts ?? 0}</p>
              <p className="text-[10px] text-zinc-500">Exposed Ports</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-400">{attackSurface.totalExposedServices ?? 0}</p>
              <p className="text-[10px] text-zinc-500">Exposed Services</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{attackSurface.unencryptedServices ?? 0}</p>
              <p className="text-[10px] text-zinc-500">Unencrypted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{attackSurface.criticalExposures ?? 0}</p>
              <p className="text-[10px] text-zinc-500">Critical Exposures</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-violet-400">{attackSurface.attackVectors?.length ?? 0}</p>
              <p className="text-[10px] text-zinc-500">Attack Vectors</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="grid grid-cols-3 gap-4">
        <a href="/analyzer/cost" className="rounded-xl border border-white/5 bg-[#0d0d14] p-5 hover:border-blue-500/30 transition-all group">
          <span className="text-2xl">💰</span>
          <h3 className="text-sm font-semibold mt-2 group-hover:text-blue-400 transition-colors">Cost Optimizer</h3>
          <p className="text-xs text-zinc-500 mt-1">Detailed cost analysis</p>
        </a>
        <a href="/analyzer/security" className="rounded-xl border border-white/5 bg-[#0d0d14] p-5 hover:border-blue-500/30 transition-all group">
          <span className="text-2xl">🔒</span>
          <h3 className="text-sm font-semibold mt-2 group-hover:text-blue-400 transition-colors">Security Center</h3>
          <p className="text-xs text-zinc-500 mt-1">Vulnerabilities & attack surface</p>
        </a>
        <a href="/analyzer/health" className="rounded-xl border border-white/5 bg-[#0d0d14] p-5 hover:border-blue-500/30 transition-all group">
          <span className="text-2xl">💓</span>
          <h3 className="text-sm font-semibold mt-2 group-hover:text-blue-400 transition-colors">Health Monitor</h3>
          <p className="text-xs text-zinc-500 mt-1">Real-time service monitoring</p>
        </a>
      </div>
    </div>
  );
}
