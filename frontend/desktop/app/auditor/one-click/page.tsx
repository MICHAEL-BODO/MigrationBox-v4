'use client';

import React, { useState, useRef } from 'react';
import { useApi } from '../../hooks/useApi';

export default function OneClickAuditPage() {
  const scan = useApi<any>('/api/scan');
  const audit = useApi<any>('/api/auditor/audit');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [auditResult, setAuditResult] = useState<any>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
  };

  const startAudit = async () => {
    setStatus('scanning');
    setProgress(0);
    setLogs([]);
    setAuditResult(null);

    // Stage 1: Network scan
    addLog('🔍 Starting network scan...');
    setProgress(5);

    addLog('📡 ARP discovery on local subnet...');
    setProgress(10);
    const scanResult = await scan.post({ wait: true });
    setProgress(30);

    if (scanResult?.hosts?.length > 0) {
      addLog(`✅ Found ${scanResult.hosts.length} hosts on network`);
      scanResult.hosts.forEach((h: any) => {
        addLog(
          `   → ${h.ip} (${h.hostname || 'unknown'}) — ${h.openPorts?.length ?? 0} open ports`
        );
      });
    } else {
      addLog('⚠️ No active scan — using demo network topology');
    }

    // Stage 2: Compliance audit across 6 frameworks
    setProgress(40);
    addLog('🛡️ Starting compliance audit...');
    addLog('   ISO27001 control matrix loaded...');
    setProgress(50);
    addLog('   SOX financial controls loaded...');
    setProgress(55);
    addLog('   GDPR data protection assessment...');
    setProgress(60);
    addLog('   HIPAA safeguard validation...');
    setProgress(65);
    addLog('   SOC2 trust service criteria...');
    setProgress(70);
    addLog('   PCI-DSS cardholder requirements...');
    setProgress(75);

    const auditRes = await audit.post();
    setProgress(90);

    if (auditRes?.audit) {
      setAuditResult(auditRes.audit);
      setScore(auditRes.audit.overallScore);
      addLog(
        `✅ Audit complete — Overall score: ${auditRes.audit.overallScore}% (${auditRes.audit.grade})`
      );
      addLog(
        `   ${auditRes.audit.totalFindings} findings across ${auditRes.audit.frameworks?.length ?? 0} frameworks`
      );
      addLog(
        `   Estimated fines avoided: $${(auditRes.audit.estimatedFinesAvoided / 1_000_000).toFixed(0)}M`
      );

      auditRes.audit.frameworks?.forEach((fw: any) => {
        const icon = fw.score >= 95 ? '🟢' : fw.score >= 90 ? '🟡' : '🔴';
        addLog(
          `   ${icon} ${fw.framework}: ${fw.score}% (${fw.passingControls}/${fw.totalControls} controls)`
        );
      });
    } else {
      setScore(0);
      addLog('⚠️ Audit returned no data');
    }

    setProgress(100);
    setStatus('complete');
  };

  const fwIcons: Record<string, string> = {
    ISO27001: '🔐',
    GDPR: '🇪🇺',
    SOX: '📊',
    HIPAA: '🏥',
    SOC2: '✅',
    'PCI-DSS': '💳',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          {'⚡'} One-Click Audit
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Full compliance assessment — live network scan + 6 framework audit
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Action */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0d0d14] border border-white/5 p-8 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5 pointer-events-none" />

          {status === 'idle' && (
            <div className="text-center space-y-8 z-10">
              <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-[0_0_40px_-10px_rgba(139,92,246,0.3)]">
                <span className="text-6xl">{'⚡'}</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">Ready to Scan</h2>
                <p className="text-zinc-400 max-w-md mx-auto">
                  Live network scan → host discovery → compliance audit across ISO27001, GDPR, SOX,
                  HIPAA, SOC2, and PCI-DSS. Results are generated from your actual backend engines.
                </p>
              </div>
              <button
                onClick={startAudit}
                className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                Start Full Audit
              </button>
            </div>
          )}

          {status === 'scanning' && (
            <div className="w-full max-w-md space-y-8 z-10 text-center">
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                    className="text-violet-500 transition-all duration-500 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold font-mono text-white">{progress}%</span>
                  <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
                    {progress < 40 ? 'Scanning' : progress < 80 ? 'Auditing' : 'Finishing'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                <span className="text-sm text-zinc-300 font-mono">
                  {progress < 40
                    ? 'Discovering hosts...'
                    : progress < 80
                      ? 'Running compliance checks...'
                      : 'Generating reports...'}
                </span>
              </div>
            </div>
          )}

          {status === 'complete' && (
            <div className="text-center space-y-8 z-10 w-full max-w-lg">
              <div className="relative">
                <div
                  className={`w-32 h-32 rounded-full border-4 mx-auto flex items-center justify-center ${
                    score >= 90
                      ? 'border-emerald-500/20 bg-emerald-500/10'
                      : score >= 80
                        ? 'border-amber-500/20 bg-amber-500/10'
                        : 'border-red-500/20 bg-red-500/10'
                  }`}
                >
                  <span
                    className={`text-5xl font-bold ${
                      score >= 90
                        ? 'text-emerald-400'
                        : score >= 80
                          ? 'text-amber-400'
                          : 'text-red-400'
                    }`}
                  >
                    {score}
                  </span>
                </div>
                <div
                  className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[#0d0d14] text-xs font-bold px-2 py-0.5 rounded-full ${
                    score >= 90 ? 'bg-emerald-500' : score >= 80 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                >
                  {auditResult?.grade ?? (score >= 90 ? 'PASSING' : 'NEEDS WORK')}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">Audit Complete</h2>
                <p className="text-zinc-400">
                  {auditResult
                    ? `${auditResult.totalFindings} findings across ${auditResult.frameworks?.length ?? 0} frameworks`
                    : `Score: ${score}/100`}
                </p>
              </div>

              {/* Framework breakdown */}
              {auditResult?.frameworks && (
                <div className="grid grid-cols-3 gap-3 text-left">
                  {auditResult.frameworks.map((fw: any) => (
                    <div key={fw.framework} className="rounded-lg bg-white/5 p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-sm">{fwIcons[fw.framework] ?? '📋'}</span>
                        <span className="text-[10px] font-semibold">{fw.framework}</span>
                      </div>
                      <span
                        className={`text-lg font-bold ${
                          fw.score >= 95
                            ? 'text-emerald-400'
                            : fw.score >= 90
                              ? 'text-blue-400'
                              : 'text-amber-400'
                        }`}
                      >
                        {fw.score}%
                      </span>
                      <p className="text-[10px] text-zinc-500">
                        {fw.passingControls}/{fw.totalControls}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <a
                  href="/auditor/reports"
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-all"
                >
                  View Report
                </a>
                <button
                  onClick={startAudit}
                  className="px-6 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Run Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Log */}
        <div className="rounded-2xl bg-[#0d0d14] border border-white/5 p-6 flex flex-col min-h-[500px]">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            {'📜'} Live Activity Log
          </h3>
          <div className="flex-1 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm italic">
                Waiting for scan...
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-xs font-mono border-l-2 border-white/5 pl-3 py-0.5">
                  <span
                    className={
                      log.includes('✅')
                        ? 'text-emerald-400'
                        : log.includes('⚠️')
                          ? 'text-amber-400'
                          : log.includes('🔴')
                            ? 'text-red-400'
                            : log.includes('🟢')
                              ? 'text-emerald-400'
                              : log.includes('🟡')
                                ? 'text-amber-400'
                                : 'text-zinc-300'
                    }
                  >
                    {log}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Frameworks</div>
              <div className="text-xl font-bold font-mono text-white">
                {auditResult?.frameworks?.length ?? 0}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Findings</div>
              <div className="text-xl font-bold font-mono text-rose-400">
                {auditResult?.totalFindings ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
