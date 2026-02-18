'use client';

import React, { useState } from 'react';

const DISCOVERED = [
  { id: 'd1', name: 'prod-api-server-01', type: 'EC2 Instance', provider: 'AWS', region: 'us-east-1', os: 'Ubuntu 22.04', cpu: '8 vCPU', memory: '32 GB', storage: '500 GB', deps: 4 },
  { id: 'd2', name: 'prod-api-server-02', type: 'EC2 Instance', provider: 'AWS', region: 'us-east-1', os: 'Ubuntu 22.04', cpu: '8 vCPU', memory: '32 GB', storage: '500 GB', deps: 3 },
  { id: 'd3', name: 'prod-db-primary', type: 'RDS PostgreSQL', provider: 'AWS', region: 'us-east-1', os: 'PostgreSQL 15', cpu: '16 vCPU', memory: '64 GB', storage: '2 TB', deps: 6 },
  { id: 'd4', name: 'prod-cache-01', type: 'ElastiCache', provider: 'AWS', region: 'us-east-1', os: 'Redis 7.0', cpu: '4 vCPU', memory: '16 GB', storage: 'N/A', deps: 2 },
  { id: 'd5', name: 'az-web-app-01', type: 'App Service', provider: 'Azure', region: 'westeurope', os: 'Node 20', cpu: '4 vCPU', memory: '8 GB', storage: '100 GB', deps: 5 },
  { id: 'd6', name: 'az-sql-primary', type: 'Azure SQL', provider: 'Azure', region: 'westeurope', os: 'SQL Server', cpu: '8 vCPU', memory: '32 GB', storage: '1 TB', deps: 4 },
  { id: 'd7', name: 'onprem-dc01', type: 'Physical Server', provider: 'On-Prem', region: 'Local LAN', os: 'Windows Server 2022', cpu: '32 cores', memory: '128 GB', storage: '4 TB', deps: 8 },
  { id: 'd8', name: 'onprem-file-server', type: 'VM (Hyper-V)', provider: 'On-Prem', region: 'Local LAN', os: 'Windows Server 2019', cpu: '8 vCPU', memory: '16 GB', storage: '10 TB', deps: 2 },
];

export default function DiscoveryPage() {
  const [scanning, setScanning] = useState(false);
  const [discovered, setDiscovered] = useState(DISCOVERED);

  const startScan = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 3000);
  };

  const providerIcon = (p: string) => {
    if (p === 'AWS') return '🟧';
    if (p === 'Azure') return '🔵';
    if (p === 'GCP') return '🔴';
    return '🏢';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            {'🔍'} Infrastructure Discovery
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Universal discovery across AWS, Azure, GCP, and on-premises environments.</p>
        </div>
        <button
          onClick={startScan}
          disabled={scanning}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${scanning
            ? 'bg-violet-600/50 text-violet-300 cursor-not-allowed'
            : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20'
          }`}
        >
          {scanning ? (<><span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Scanning...</>) : 'Start Discovery Scan'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Discovered', value: discovered.length.toString(), icon: '🖥️' },
          { label: 'AWS Resources', value: discovered.filter(d => d.provider === 'AWS').length.toString(), icon: '🟧' },
          { label: 'Azure Resources', value: discovered.filter(d => d.provider === 'Azure').length.toString(), icon: '🔵' },
          { label: 'On-Prem Systems', value: discovered.filter(d => d.provider === 'On-Prem').length.toString(), icon: '🏢' },
          { label: 'Dependencies Mapped', value: discovered.reduce((a, d) => a + d.deps, 0).toString(), icon: '🔗' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl bg-[#0d0d14] border border-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Resource List */}
      <div className="rounded-2xl bg-[#0d0d14] border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Discovered Resources</h3>
          <a href="/migrator/plan" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Create Migration Plan {'→'}</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Name', 'Type', 'Provider', 'Region', 'CPU', 'Memory', 'Storage', 'Deps'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {discovered.map(r => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-zinc-200">{r.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{r.type}</td>
                  <td className="px-4 py-3"><span>{providerIcon(r.provider)} {r.provider}</span></td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{r.region}</td>
                  <td className="px-4 py-3 font-mono text-zinc-400 text-xs">{r.cpu}</td>
                  <td className="px-4 py-3 font-mono text-zinc-400 text-xs">{r.memory}</td>
                  <td className="px-4 py-3 font-mono text-zinc-400 text-xs">{r.storage}</td>
                  <td className="px-4 py-3 font-mono text-violet-400 text-xs">{r.deps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
