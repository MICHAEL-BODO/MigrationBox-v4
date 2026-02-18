'use client';
import { useState, useEffect } from 'react';

const WAVES = [
  { id: 1, name: 'Web Tier', status: 'completed', progress: 100, resources: 47, source: 'On-Prem', target: 'GCP' },
  { id: 2, name: 'App Tier', status: 'in-progress', progress: 67, resources: 58, source: 'Azure', target: 'GCP' },
  { id: 3, name: 'Data Tier', status: 'queued', progress: 0, resources: 42, source: 'AWS', target: 'GCP' },
];

export default function MigratorPage() {
  const [uptimeSeconds, setUptimeSeconds] = useState(847392);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setUptimeSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatUptime = (s: number) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${d}d ${h}h ${m}m ${sec}s`;
  };

  const startLanScan = () => {
    setScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setScanning(false); return 100; }
        return prev + Math.random() * 5;
      });
    }, 300);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">MIGRATOR</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Cloud Migration Engine — 39 Functions</p>
        </div>
        <button onClick={startLanScan} disabled={scanning} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          {scanning ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Scanning... {Math.min(100, Math.round(scanProgress))}%
            </>
          ) : (
            <>🔍 Discover LAN</>
          )}
        </button>
      </div>

      {/* Zero Downtime Counter */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-[#0d0d14] p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1),transparent_60%)]" />
        <div className="relative z-10 text-center">
          <p className="text-xs font-semibold text-emerald-400/70 uppercase tracking-wider">Zero Downtime Counter</p>
          <p className="text-5xl font-mono font-bold mt-3 tabular-nums text-emerald-400">{formatUptime(uptimeSeconds)}</p>
          <p className="text-xs text-zinc-500 mt-2">Continuous uptime maintained during all active migrations</p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">147</p>
              <p className="text-[10px] text-zinc-500">Resources Migrated</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-bold">3</p>
              <p className="text-[10px] text-zinc-500">Active Waves</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">100%</p>
              <p className="text-[10px] text-zinc-500">Uptime SLA</p>
            </div>
          </div>
        </div>
      </div>

      {/* LAN Scan Progress */}
      {(scanning || scanProgress >= 100) && (
        <div className={`rounded-xl border p-6 ${
          scanProgress >= 100
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : 'border-blue-500/20 bg-blue-500/5'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-300">
              {scanProgress >= 100 ? '✅ LAN Discovery Complete' : '🔍 Scanning Local Network...'}
            </span>
            <span className="text-xs text-zinc-500">SNMP + WMI + nmap</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                scanProgress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}
              style={{ width: `${Math.min(100, scanProgress)}%` }}
            />
          </div>
          {scanProgress >= 100 && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <DiscoveredItem icon="🖥️" label="Servers" count={12} />
              <DiscoveredItem icon="🌐" label="Switches" count={4} />
              <DiscoveredItem icon="🔒" label="Firewalls" count={2} />
              <DiscoveredItem icon="💾" label="Storage" count={3} />
            </div>
          )}
        </div>
      )}

      {/* Migration Waves */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 mb-4">Migration Waves</h2>
        <div className="space-y-4">
          {WAVES.map(wave => (
            <div key={wave.id} className={`rounded-xl border bg-[#0d0d14] p-5 transition-all ${
              wave.status === 'in-progress' ? 'border-cyan-500/20' : 'border-white/5'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    wave.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    wave.status === 'in-progress' ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-zinc-800 text-zinc-500'
                  }`}>
                    {wave.id}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{wave.name}</h3>
                    <p className="text-[10px] text-zinc-500">{wave.source} → {wave.target}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">{wave.resources} resources</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    wave.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    wave.status === 'in-progress' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse' :
                    'bg-zinc-800 text-zinc-500 border border-zinc-700'
                  }`}>{wave.status}</span>
                </div>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    wave.status === 'completed' ? 'bg-emerald-500' :
                    wave.status === 'in-progress' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' :
                    'bg-zinc-700'
                  }`}
                  style={{ width: `${wave.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-600 mt-2 text-right">{wave.progress}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Target Clouds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TargetCloudCard
          name="Google Cloud (GCP)"
          icon="🟢"
          color="from-green-500 to-emerald-600"
          status="Primary Target"
          services={['Compute Engine', 'GKE', 'Cloud SQL', 'Cloud Storage', 'Cloud Run']}
        />
        <TargetCloudCard
          name="Microsoft Azure"
          icon="🔵"
          color="from-blue-500 to-blue-600"
          status="Secondary Target"
          services={['Virtual Machines', 'AKS', 'Azure SQL', 'Blob Storage', 'App Service']}
        />
      </div>
    </div>
  );
}

function DiscoveredItem({ icon, label, count }: { icon: string; label: string; count: number }) {
  return (
    <div className="rounded-lg bg-white/5 p-3 text-center">
      <span className="text-lg">{icon}</span>
      <p className="text-lg font-bold mt-1">{count}</p>
      <p className="text-[10px] text-zinc-500">{label}</p>
    </div>
  );
}

function TargetCloudCard({ name, icon, color, status, services }: {
  name: string; icon: string; color: string; status: string; services: string[];
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#0d0d14] overflow-hidden">
      <div className={`bg-gradient-to-r ${color} p-4`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <h3 className="text-sm font-bold text-white">{name}</h3>
            <p className="text-[10px] text-white/70">{status}</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-[10px] text-zinc-500 mb-2">Target Services</p>
        <div className="flex flex-wrap gap-1.5">
          {services.map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-400">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
