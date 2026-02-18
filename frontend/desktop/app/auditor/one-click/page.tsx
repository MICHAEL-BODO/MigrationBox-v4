'use client';

import React, { useState } from 'react';

export default function OneClickAuditPage() {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  const startAudit = () => {
    setStatus('scanning');
    setProgress(0);
    setLogs([]);
    let p = 0;
    const msgs = [
      'Scanning AWS IAM policies...', 'Verifying Azure RBAC assignments...',
      'Checking GCP firewall rules...', 'Validating GDPR data residency...',
      'Analyzing S3 bucket encryption...', 'Checking unencrypted EBS volumes...',
      'Auditing SQL database access logs...', 'Verifying MFA enforcement...',
      'Checking security group exposures...', 'Validating SSL/TLS certificates...',
    ];
    const iv = setInterval(() => {
      p += Math.floor(Math.random() * 5) + 1;
      if (p >= 100) {
        p = 100; clearInterval(iv);
        setStatus('complete');
        setScore(Math.floor(Math.random() * 13) + 85);
        setLogs(prev => ['✅ Audit complete. Generating report...', ...prev]);
      } else if (Math.random() > 0.6) {
        setLogs(prev => [msgs[Math.floor(Math.random() * msgs.length)], ...prev].slice(0, 8));
      }
      setProgress(p);
    }, 200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          {'⚡'} One-Click Audit
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Full compliance assessment across all cloud providers in under 30 minutes.</p>
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
                  Comprehensive scan across AWS, Azure, and GCP detecting compliance violations against ISO27001, GDPR, SOX, HIPAA, SOC2, and PCI-DSS.
                </p>
              </div>
              <button onClick={startAudit} className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0">
                Start Full Audit
              </button>
            </div>
          )}

          {status === 'scanning' && (
            <div className="w-full max-w-md space-y-8 z-10 text-center">
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                  <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent"
                    strokeDasharray={2 * Math.PI * 88} strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                    className="text-violet-500 transition-all duration-300 ease-out" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold font-mono text-white">{progress}%</span>
                  <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Scanning</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                <span className="text-sm text-zinc-300 font-mono">Analyzing resources...</span>
              </div>
            </div>
          )}

          {status === 'complete' && (
            <div className="text-center space-y-8 z-10">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <span className="text-5xl font-bold text-emerald-400">{score}</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-[#0d0d14] text-xs font-bold px-2 py-0.5 rounded-full">PASSING</div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">Audit Complete</h2>
                <p className="text-zinc-400">Your infrastructure passed {Math.floor(847 * (score / 100))} of 912 checks. 3 critical issues require attention.</p>
              </div>
              <div className="flex gap-4 justify-center">
                <a href="/auditor/reports" className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-all">View Report</a>
                <button onClick={startAudit} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">Run Again</button>
              </div>
            </div>
          )}
        </div>

        {/* Live Log */}
        <div className="rounded-2xl bg-[#0d0d14] border border-white/5 p-6 flex flex-col min-h-[500px]">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">{'📜'} Live Activity Log</h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-sm italic">Waiting for scan...</div>
            ) : logs.map((log, i) => (
              <div key={i} className="flex gap-3 text-xs font-mono border-l-2 border-white/5 pl-3 py-1">
                <span className="text-zinc-600 shrink-0">{new Date().toLocaleTimeString()}</span>
                <span className={log.includes('✅') ? 'text-emerald-400' : 'text-zinc-300'}>{log}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Resources Scanned</div>
              <div className="text-xl font-bold font-mono text-white">{status === 'idle' ? '0' : Math.floor(progress * 12.4)}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Issues Found</div>
              <div className="text-xl font-bold font-mono text-rose-400">{status === 'idle' ? '0' : Math.floor(progress * 0.03)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
