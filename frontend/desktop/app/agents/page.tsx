'use client';

import { useState } from 'react';

interface AgentInfo {
  name: string;
  type: string;
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'error';
  progress: number;
  tasksCompleted: number;
  tasksFailed: number;
  queueDepth: number;
  circuitBreaker: 'closed' | 'open' | 'half-open';
  lastHeartbeat: string;
  currentTask?: string;
}

const MOCK_AGENTS: AgentInfo[] = [
  { name: 'Discovery', type: 'discovery', status: 'running', progress: 67, tasksCompleted: 12, tasksFailed: 1, queueDepth: 3, circuitBreaker: 'closed', lastHeartbeat: new Date().toISOString(), currentTask: 'task-disc-042' },
  { name: 'Assessment', type: 'assessment', status: 'running', progress: 45, tasksCompleted: 8, tasksFailed: 0, queueDepth: 5, circuitBreaker: 'closed', lastHeartbeat: new Date().toISOString(), currentTask: 'task-assess-019' },
  { name: 'IaC Generation', type: 'iac-generation', status: 'idle', progress: 0, tasksCompleted: 6, tasksFailed: 0, queueDepth: 0, circuitBreaker: 'closed', lastHeartbeat: new Date().toISOString() },
  { name: 'Validation', type: 'validation', status: 'idle', progress: 0, tasksCompleted: 15, tasksFailed: 2, queueDepth: 0, circuitBreaker: 'closed', lastHeartbeat: new Date().toISOString() },
  { name: 'Optimization', type: 'optimization', status: 'paused', progress: 30, tasksCompleted: 4, tasksFailed: 0, queueDepth: 1, circuitBreaker: 'closed', lastHeartbeat: new Date().toISOString() },
  { name: 'Orchestration', type: 'orchestration', status: 'running', progress: 80, tasksCompleted: 3, tasksFailed: 0, queueDepth: 2, circuitBreaker: 'closed', lastHeartbeat: new Date().toISOString(), currentTask: 'task-orch-007' },
];

export default function AgentDashboardPage() {
  const [agents] = useState<AgentInfo[]>(MOCK_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);

  const runningCount = agents.filter(a => a.status === 'running').length;
  const totalCompleted = agents.reduce((s, a) => s + a.tasksCompleted, 0);
  const totalFailed = agents.reduce((s, a) => s + a.tasksFailed, 0);
  const totalQueued = agents.reduce((s, a) => s + a.queueDepth, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Agent Dashboard</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Running Agents" value={runningCount.toString()} color="emerald" />
        <StatCard label="Tasks Completed" value={totalCompleted.toString()} color="blue" />
        <StatCard label="Tasks Failed" value={totalFailed.toString()} color="red" />
        <StatCard label="Queue Depth" value={totalQueued.toString()} color="amber" />
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div
            key={agent.type}
            onClick={() => setSelectedAgent(agent)}
            className={`rounded-lg border p-5 cursor-pointer transition-all hover:border-zinc-600 ${
              selectedAgent?.type === agent.type ? 'border-cyan-500 bg-cyan-500/5' : 'border-zinc-800 bg-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <StatusDot status={agent.status} />
                <h3 className="font-semibold">{agent.name} Agent</h3>
              </div>
              <CircuitBreakerBadge state={agent.circuitBreaker} />
            </div>

            {/* Progress bar */}
            {agent.status === 'running' && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>{agent.currentTask}</span>
                  <span>{agent.progress}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all"
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-zinc-500 text-xs block">Completed</span>
                <span className="font-mono">{agent.tasksCompleted}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block">Failed</span>
                <span className="font-mono text-red-400">{agent.tasksFailed}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-xs block">Queued</span>
                <span className="font-mono">{agent.queueDepth}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent Detail Panel */}
      {selectedAgent && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-semibold mb-4">{selectedAgent.name} Agent — Details</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <DetailItem label="Status" value={selectedAgent.status} />
            <DetailItem label="Circuit Breaker" value={selectedAgent.circuitBreaker} />
            <DetailItem label="Last Heartbeat" value={new Date(selectedAgent.lastHeartbeat).toLocaleTimeString()} />
            <DetailItem label="Current Task" value={selectedAgent.currentTask || 'None'} />
            <DetailItem label="Progress" value={`${selectedAgent.progress}%`} />
            <DetailItem label="Tasks Completed" value={selectedAgent.tasksCompleted.toString()} />
            <DetailItem label="Tasks Failed" value={selectedAgent.tasksFailed.toString()} />
            <DetailItem label="Queue Depth" value={selectedAgent.queueDepth.toString()} />
          </div>

          <div className="mt-4 flex gap-3">
            <button className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition-colors">
              Start
            </button>
            <button className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-500 text-sm font-medium transition-colors">
              Pause
            </button>
            <button className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-sm font-medium transition-colors">
              Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    red: 'border-red-500/30 bg-red-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
  };
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color] || ''}`}>
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    running: 'bg-emerald-500 animate-pulse',
    idle: 'bg-zinc-500',
    paused: 'bg-amber-500',
    stopped: 'bg-red-500',
    error: 'bg-red-600 animate-pulse',
  };
  return <div className={`w-3 h-3 rounded-full ${colorMap[status] || 'bg-zinc-500'}`} />;
}

function CircuitBreakerBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    closed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    open: 'bg-red-500/10 text-red-400 border-red-500/20',
    'half-open': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${styles[state] || ''}`}>
      CB: {state}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-zinc-500 block">{label}</span>
      <span className="text-sm font-mono capitalize">{value}</span>
    </div>
  );
}
