export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard title="Active Discoveries" value="2" color="cyan" />
        <StatusCard title="Workloads Found" value="147" color="blue" />
        <StatusCard title="Migrations Running" value="3" color="emerald" />
        <StatusCard title="Cost Savings" value="34%" color="amber" />
      </div>

      {/* Agent Status Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">AI Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AgentCard name="Discovery" status="running" color="bg-agent-discovery" tasks={12} />
          <AgentCard name="Assessment" status="idle" color="bg-agent-assessment" tasks={0} />
          <AgentCard name="IaC Generation" status="idle" color="bg-agent-iac" tasks={0} />
          <AgentCard name="Validation" status="idle" color="bg-agent-validation" tasks={0} />
          <AgentCard name="Optimization" status="idle" color="bg-agent-optimization" tasks={0} />
          <AgentCard name="Orchestration" status="idle" color="bg-agent-orchestration" tasks={0} />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, value, color }: { title: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'border-cyan-500/30 bg-cyan-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorMap[color] || 'border-zinc-800 bg-zinc-900'}`}>
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function AgentCard({ name, status, color, tasks }: { name: string; status: string; color: string; tasks: number }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${status === 'running' ? 'animate-pulse' : ''} ${color}`} />
        <h3 className="font-medium">{name} Agent</h3>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-zinc-400">
        <span className="capitalize">{status}</span>
        <span>{tasks} tasks</span>
      </div>
    </div>
  );
}
