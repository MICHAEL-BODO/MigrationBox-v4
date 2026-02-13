'use client';

import Link from 'next/link';

// Mock data until API is wired up
const discoveries = [
  { discoveryId: 'disc-001', sourceEnvironment: 'aws', status: 'complete', workloadsFound: 12, createdAt: '2026-02-10T10:00:00Z' },
  { discoveryId: 'disc-002', sourceEnvironment: 'azure', status: 'complete', workloadsFound: 5, createdAt: '2026-02-11T14:00:00Z' },
  { discoveryId: 'disc-003', sourceEnvironment: 'aws', status: 'running', workloadsFound: 0, createdAt: '2026-02-12T09:00:00Z' },
];

const statusColors: Record<string, string> = {
  complete: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  running: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  initiated: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const providerColors: Record<string, string> = {
  aws: 'bg-amber-500/10 text-amber-400',
  azure: 'bg-blue-500/10 text-blue-400',
  gcp: 'bg-red-500/10 text-red-400',
};

export default function DiscoveriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Discoveries</h1>
        <Link
          href="/discoveries/new"
          className="px-4 py-2 bg-primary rounded-lg text-sm font-medium hover:bg-primary/80 transition"
        >
          New Discovery
        </Link>
      </div>

      {/* Discoveries table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">ID</th>
              <th className="text-left px-4 py-3 font-medium">Provider</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Workloads</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {discoveries.map((d) => (
              <tr key={d.discoveryId} className="hover:bg-zinc-900/50 transition">
                <td className="px-4 py-3 font-mono text-xs">{d.discoveryId}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${providerColors[d.sourceEnvironment]}`}>
                    {d.sourceEnvironment.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs border ${statusColors[d.status]}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3">{d.workloadsFound}</td>
                <td className="px-4 py-3 text-zinc-400">{new Date(d.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Link href={`/discoveries/${d.discoveryId}`} className="text-primary hover:underline text-xs">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
