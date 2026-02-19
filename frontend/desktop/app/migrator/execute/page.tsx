'use client';

import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

export default function ExecutionPage() {
  const { data, loading, error } = useApi<any>('/api/migrator/execute', {
    autoFetch: true,
    pollingInterval: 2000,
  });

  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (data?.elapsedTime) {
      // Sync elapsed time from server if available, or just increment locally
      // For now, let's just stick to local increment but maybe seed it?
      // actually, let's trust server if sent, or just keep local if server only sends status
    }
  }, [data]);

  const steps = data?.steps || [];
  const status = data?.status || 'idle';
  const progress = data?.progress || 0;
  const currentStepIndex = data?.currentStep || 0;
  const dataTransferred = data?.dataTransferred || 0;
  const totalData = 2048; // Hardcode max or get from plan

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec.toString().padStart(2, '0')}s`;
  };

  const executeMigration = useApi<any>('/api/migrator/execute');

  const handleStart = async () => {
    await executeMigration.post({ action: 'start' });
    executeMigration.fetch(); // Force refresh
  };

  const handlePause = async () => {
    await executeMigration.post({ action: 'pause' });
  };

  const handleRollback = async () => {
    await executeMigration.post({ action: 'rollback' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            {'🚀'} Migration Execution
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Live migration progress — Wave 1: Stateless Services {'→'} GCP
          </p>
        </div>
        {status === 'running' ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
            <span className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-pulse" />
            <span className="text-violet-400 text-sm font-semibold">MIGRATING</span>
          </div>
        ) : status === 'done' ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
            <span className="text-emerald-400 text-sm font-semibold">COMPLETE</span>
          </div>
        ) : (
          <button
            onClick={handleStart}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg"
          >
            Start Migration
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          Failed to connect execution engine: {error.message}
        </div>
      )}

      {/* Progress Header */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-500/10 via-[#0d0d14] to-emerald-500/10 border border-white/5 p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Overall Progress
            </div>
            <div className="text-5xl font-bold font-mono text-white">{progress}%</div>
            <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Elapsed Time
            </div>
            <div className="text-2xl font-bold font-mono text-white">{formatTime(elapsedSec)}</div>
            <div className="text-xs text-zinc-500 mt-1">Est. remaining: ~15m</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Data Transferred
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {dataTransferred.toFixed(1)} GB
            </div>
            <div className="text-xs text-emerald-400/60 mt-1">of {totalData} GB total</div>
          </div>
        </div>
      </div>

      {loading && !data && (
        <div className="p-8 text-center text-zinc-500 animate-pulse">
          Connecting to migration engine...
        </div>
      )}

      {/* Steps */}
      <div className="rounded-2xl bg-[#0d0d14] border border-white/5 p-6">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-6">
          Migration Steps
        </h3>
        <div className="space-y-1">
          {steps.map((step: any, i: number) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors"
            >
              {/* Step indicator */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step.status === 'done'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : step.status === 'running'
                        ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30 animate-pulse'
                        : step.status === 'failed'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-white/5 text-zinc-600 border border-white/10'
                  }`}
                >
                  {step.status === 'done'
                    ? '✓'
                    : step.status === 'running'
                      ? '●'
                      : step.status === 'failed'
                        ? '✗'
                        : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-8 ${step.status === 'done' ? 'bg-emerald-500/30' : 'bg-white/5'}`}
                  />
                )}
              </div>

              {/* Step info */}
              <div className="flex-1">
                <div
                  className={`text-sm font-medium ${step.status === 'done' ? 'text-zinc-400' : step.status === 'running' ? 'text-white' : 'text-zinc-500'}`}
                >
                  {step.name}
                </div>
              </div>

              {/* Duration */}
              <div
                className={`text-xs font-mono shrink-0 ${
                  step.status === 'done'
                    ? 'text-emerald-400'
                    : step.status === 'running'
                      ? 'text-violet-400'
                      : 'text-zinc-600'
                }`}
              >
                {step.duration}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        {status === 'running' && (
          <button
            onClick={handlePause}
            className="px-5 py-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 rounded-lg text-sm font-medium transition-all"
          >
            {'⏸'} Pause Migration
          </button>
        )}
        <button
          onClick={handleRollback}
          className="px-5 py-2 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/20 text-amber-400 rounded-lg text-sm font-medium transition-all"
        >
          {'↩'} Rollback
        </button>
      </div>
    </div>
  );
}
