'use client';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [time, setTime] = useState(new Date());
  const [uptimeSeconds, setUptimeSeconds] = useState(847392);

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date());
      setUptimeSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const formatUptime = (s: number) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/50 via-[#0d0d14] to-blue-950/50 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  MIKE-FIRST
                </span>
                <span className="text-zinc-500 text-lg ml-2">v6.0</span>
              </h1>
              <p className="text-zinc-400 mt-2 text-sm max-w-xl">
                Migration, Intelligence, Compliance, Engineering — Fully Integrated Resilience & Security Toolkit.
                Protecting enterprises across AWS, Azure, GCP, and on-premise infrastructure.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-mono font-semibold text-zinc-200 tabular-nums">
                {time.toLocaleTimeString('en-US', { hour12: false })}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Uptime: {formatUptime(uptimeSeconds)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Compliance Score"
          value="94"
          suffix="%"
          trend="+2.3%"
          trendUp
          color="violet"
          icon="🛡️"
        />
        <KPICard
          label="Cost Savings"
          value="$1.2M"
          suffix="/yr"
          trend="34% reduction"
          trendUp
          color="emerald"
          icon="💰"
        />
        <KPICard
          label="Security Posture"
          value="A+"
          suffix=""
          trend="0 critical"
          trendUp
          color="blue"
          icon="🔒"
        />
        <KPICard
          label="Migrations"
          value="3"
          suffix=" active"
          trend="100% uptime"
          trendUp
          color="cyan"
          icon="🚀"
        />
      </div>

      {/* Three Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PILLAR 1: AUDITOR */}
        <PillarCard
          pillar="1"
          name="AUDITOR"
          subtitle="Compliance & Regulatory Engine"
          icon="🛡️"
          gradient="from-violet-600 to-purple-700"
          glowColor="violet"
          stats={[
            { label: 'Frameworks', value: '6' },
            { label: 'Controls Passing', value: '847/912' },
            { label: 'Functions', value: '42' },
          ]}
          features={[
            { name: 'One-Click Audit', status: 'ready', desc: 'Full ISO27001+SOX+GDPR in 30 min' },
            { name: 'Guardian Agent', status: 'active', desc: 'Real-time compliance enforcement' },
            { name: 'Email Interceptor', status: 'active', desc: 'Blocking regulatory violations' },
          ]}
          href="/auditor"
        />

        {/* PILLAR 2: ANALYZER */}
        <PillarCard
          pillar="2"
          name="ANALYZER"
          subtitle="Infrastructure Intelligence"
          icon="📊"
          gradient="from-blue-600 to-cyan-600"
          glowColor="blue"
          stats={[
            { label: 'Resources', value: '2,847' },
            { label: 'Savings Found', value: '$1.2M' },
            { label: 'Functions', value: '39' },
          ]}
          features={[
            { name: 'Cost Overrun Detector', status: 'active', desc: 'Scanning 3 cloud accounts' },
            { name: 'Security Repositioner', status: 'standby', desc: 'Ready for attack response' },
            { name: 'Right-Sizing Engine', status: 'active', desc: '47 VMs need optimization' },
          ]}
          href="/analyzer"
        />

        {/* PILLAR 3: MIGRATOR */}
        <PillarCard
          pillar="3"
          name="MIGRATOR"
          subtitle="Cloud Migration Engine"
          icon="🚀"
          gradient="from-emerald-600 to-teal-600"
          glowColor="emerald"
          stats={[
            { label: 'Active Waves', value: '2' },
            { label: 'Resources Moved', value: '147' },
            { label: 'Functions', value: '39' },
          ]}
          features={[
            { name: 'LAN Discovery', status: 'ready', desc: 'Scan on-prem infrastructure' },
            { name: 'Terraformer Import', status: 'ready', desc: 'Reverse-engineer as IaC' },
            { name: 'Zero-Downtime Migration', status: 'active', desc: '100% uptime maintained' },
          ]}
          href="/migrator"
        />
      </div>

      {/* Cloud Providers Strip */}
      <div className="rounded-xl border border-white/5 bg-[#0d0d14] p-6">
        <h3 className="text-sm font-semibold text-zinc-400 mb-4">Connected Cloud Providers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CloudCard name="AWS" status="connected" resources={1247} color="from-orange-500 to-amber-500" />
          <CloudCard name="Azure" status="connected" resources={943} color="from-blue-500 to-blue-600" />
          <CloudCard name="GCP" status="connected" resources={657} color="from-green-500 to-emerald-500" />
          <CloudCard name="On-Prem" status="scanning" resources={0} color="from-zinc-500 to-zinc-600" />
        </div>
      </div>

      {/* AI Agents & iPhone Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Agents */}
        <div className="rounded-xl border border-white/5 bg-[#0d0d14] p-6">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4">AI Agent Mesh</h3>
          <div className="space-y-3">
            <AgentRow name="Antigravity AG-1" role="Auditor Browser" status="active" tasks={7} />
            <AgentRow name="Antigravity AG-2" role="Analyzer Browser" status="active" tasks={12} />
            <AgentRow name="Antigravity AG-3" role="Migrator Browser" status="idle" tasks={0} />
            <AgentRow name="Antigravity AG-4" role="Orchestrator" status="active" tasks={3} />
            <AgentRow name="Claude Code CC-1" role="Backend (25 agents)" status="active" tasks={89} />
            <AgentRow name="Claude Code CC-2" role="Frontend (25 agents)" status="active" tasks={42} />
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-zinc-500">104 agents • ~50,000 tools • ~300 MCPs</span>
            <span className="text-xs text-emerald-400">All healthy</span>
          </div>
        </div>

        {/* iPhone Integration */}
        <div className="rounded-xl border border-white/5 bg-[#0d0d14] p-6">
          <h3 className="text-sm font-semibold text-zinc-400 mb-4">📱 iPhone Gemini Integration</h3>
          <div className="space-y-4">
            <div className="rounded-lg bg-gradient-to-r from-violet-950/50 to-blue-950/50 border border-violet-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-lg">
                  📱
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-200">iPhone 16 Pro Max</p>
                  <p className="text-xs text-zinc-500">Gemini App — Connected via MCP</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <FeatureRow icon="🎤" label="Voice Commands" desc="Say: 'Run compliance audit'" status="ready" />
              <FeatureRow icon="🔔" label="Push Notifications" desc="Compliance violations, cost alerts" status="active" />
              <FeatureRow icon="📊" label="Live Dashboard" desc="Real-time migration progress" status="active" />
              <FeatureRow icon="🛡️" label="Guardian Alerts" desc="Instant regulatory violation alerts" status="active" />
              <FeatureRow icon="📸" label="Visual Reports" desc="Screenshot compliance evidence" status="ready" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* — KPI Card — */
function KPICard({ label, value, suffix, trend, trendUp, color, icon }: {
  label: string; value: string; suffix: string; trend: string; trendUp: boolean; color: string; icon: string;
}) {
  const colors: Record<string, string> = {
    violet: 'border-violet-500/20 bg-violet-500/5 shadow-violet-500/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 shadow-emerald-500/5',
    blue: 'border-blue-500/20 bg-blue-500/5 shadow-blue-500/5',
    cyan: 'border-cyan-500/20 bg-cyan-500/5 shadow-cyan-500/5',
  };
  return (
    <div className={`rounded-xl border p-5 shadow-lg ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">
        {value}<span className="text-sm font-normal text-zinc-500">{suffix}</span>
      </p>
      <p className={`text-xs mt-1 ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
        {trendUp ? '↑' : '↓'} {trend}
      </p>
    </div>
  );
}

/* — Pillar Card — */
function PillarCard({ pillar, name, subtitle, icon, gradient, glowColor, stats, features, href }: {
  pillar: string; name: string; subtitle: string; icon: string; gradient: string; glowColor: string;
  stats: { label: string; value: string }[];
  features: { name: string; status: string; desc: string }[];
  href: string;
}) {
  const glowMap: Record<string, string> = {
    violet: 'shadow-violet-500/10 hover:shadow-violet-500/20 hover:border-violet-500/30',
    blue: 'shadow-blue-500/10 hover:shadow-blue-500/20 hover:border-blue-500/30',
    emerald: 'shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:border-emerald-500/30',
  };
  return (
    <a href={href} className={`group rounded-xl border border-white/10 bg-[#0d0d14] overflow-hidden transition-all duration-300 shadow-xl ${glowMap[glowColor]} hover:-translate-y-1`}>
      {/* Pillar Header */}
      <div className={`bg-gradient-to-r ${gradient} p-5`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Pillar {pillar}</p>
            <h3 className="text-lg font-bold text-white">{name}</h3>
          </div>
        </div>
        <p className="text-xs text-white/70 mt-2">{subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 border-b border-white/5">
        {stats.map((s, i) => (
          <div key={i} className={`p-3 text-center ${i < 2 ? 'border-r border-white/5' : ''}`}>
            <p className="text-lg font-bold tabular-nums">{s.value}</p>
            <p className="text-[10px] text-zinc-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="p-4 space-y-2">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2.5 py-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              f.status === 'active' ? 'bg-emerald-400 animate-pulse' :
              f.status === 'ready' ? 'bg-amber-400' : 'bg-zinc-600'
            }`} />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-zinc-300 block truncate">{f.name}</span>
              <span className="text-[10px] text-zinc-600 block truncate">{f.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-zinc-600">Click to open</span>
        <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors">→</span>
      </div>
    </a>
  );
}

/* — Cloud Card — */
function CloudCard({ name, status, resources, color }: {
  name: string; status: string; resources: number; color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/5 p-3">
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
        {name.substring(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-[10px] text-zinc-500">
          {status === 'scanning' ? 'Scanning...' : `${resources.toLocaleString()} resources`}
        </p>
      </div>
      <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
    </div>
  );
}

/* — Agent Row — */
function AgentRow({ name, role, status, tasks }: {
  name: string; role: string; status: string; tasks: number;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
        status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
      }`} />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-zinc-300">{name}</span>
        <span className="text-[10px] text-zinc-600 ml-2">{role}</span>
      </div>
      <span className="text-xs text-zinc-500 tabular-nums">{tasks} tasks</span>
    </div>
  );
}

/* — Feature Row — */
function FeatureRow({ icon, label, desc, status }: {
  icon: string; label: string; desc: string; status: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-sm">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-zinc-300">{label}</span>
        <span className="text-[10px] text-zinc-600 ml-2">{desc}</span>
      </div>
      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
        status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
        'bg-amber-500/15 text-amber-400 border border-amber-500/20'
      }`}>{status}</span>
    </div>
  );
}
