'use client';

import React, { useState, useEffect } from 'react';

interface MigrationStep {
  name: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  duration: string;
}

const STEPS: MigrationStep[] = [
  { name: 'Pre-flight checks', status: 'done', duration: '2m 14s' },
  { name: 'Snapshot source infrastructure', status: 'done', duration: '8m 32s' },
  { name: 'Provision GCP target resources', status: 'done', duration: '4m 08s' },
  { name: 'Data replication (streaming)', status: 'running', duration: '12m 45s...' },
  { name: 'DNS cutover & traffic routing', status: 'pending', duration: '—' },
  { name: 'Validation & smoke tests', status: 'pending', duration: '—' },
  { name: 'Rollback checkpoint', status: 'pending', duration: '—' },
];

export default function ExecutionPage() {
  const [steps, setSteps] = useState(STEPS);
  const [elapsedSec, setElapsedSec] = useState(1629);
  const [dataTransferred, setDataTransferred] = useState(847);

  useEffect(() => {
    const iv = setInterval(() => {
      setElapsedSec(s => s + 1);
      setDataTransferred(d => Math.min(d + Math.random() * 2, 2048));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec.toString().padStart(2, '0')}s`;
  };

  const completedSteps = steps.filter(s => s.status === 'done').length;
  const overallProgress = Math.round((completedSteps / steps.length) * 100 + (1 / steps.length * 100 * 0.6));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            {'🚀'} Migration Execution
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Live migration progress — Wave 1: Stateless Services {'→'} GCP</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
          <span className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-pulse" />
          <span className="text-violet-400 text-sm font-semibold">MIGRATING</span>
        </div>
      </div>

      {/* Progress Header */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-500/10 via-[#0d0d14] to-emerald-500/10 border border-white/5 p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Overall Progress</div>
            <div className="text-5xl font-bold font-mono text-white">{overallProgress}%</div>
            <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-1000" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Elapsed Time</div>
            <div className="text-2xl font-bold font-mono text-white">{formatTime(elapsedSec)}</div>
            <div className="text-xs text-zinc-500 mt-1">Est. remaining: ~15m</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Data Transferred</div>
            <div className="text-2xl font-bold font-mono text-emerald-400">{dataTransferred.toFixed(1)} GB</div>
            <div className="text-xs text-emerald-400/60 mt-1">of 2,048 GB total</div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="rounded-2xl bg-[#0d0d14] border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-6">Migration Steps</h3>
        <div className="space-y-1">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
              {/* Step indicator */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.status === 'done' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  step.status === 'running' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30 animate-pulse' :
                  step.status === 'failed' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  'bg-white/5 text-zinc-600 border border-white/10'
                }`}>
                  {step.status === 'done' ? '✓' : step.status === 'running' ? '●' : step.status === 'failed' ? '✗' : (i + 1)}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-0.5 h-8 ${step.status === 'done' ? 'bg-emerald-500/30' : 'bg-white/5'}`} />
                )}
              </div>

              {/* Step info */}
              <div className="flex-1">
                <div className={`text-sm font-medium ${step.status === 'done' ? 'text-zinc-400' : step.status === 'running' ? 'text-white' : 'text-zinc-500'}`}>
                  {step.name}
                </div>
              </div>

              {/* Duration */}
              <div className={`text-xs font-mono shrink-0 ${
                step.status === 'done' ? 'text-emerald-400' :
                step.status === 'running' ? 'text-violet-400' :
                'text-zinc-600'
              }`}>
                {step.duration}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button className="px-5 py-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 rounded-lg text-sm font-medium transition-all">
          {'⏸'} Pause Migration
        </button>
        <button className="px-5 py-2 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/20 text-amber-400 rounded-lg text-sm font-medium transition-all">
          {'↩'} Rollback
        </button>
      </div>
    </div>
  );
}
