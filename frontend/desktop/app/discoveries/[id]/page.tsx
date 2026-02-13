'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

// Mock data - will be replaced with TanStack Query
const mockWorkloads = [
  { workloadId: 'ec2-web-001', type: 'compute', name: 'web-server-prod', status: 'running', region: 'us-east-1', dependencies: ['rds-main-001', 'elb-web-001'] },
  { workloadId: 'ec2-web-002', type: 'compute', name: 'web-server-prod-2', status: 'running', region: 'us-east-1', dependencies: ['rds-main-001', 'elb-web-001'] },
  { workloadId: 'rds-main-001', type: 'database', name: 'main-database', status: 'available', region: 'us-east-1', dependencies: [] },
  { workloadId: 'elb-web-001', type: 'network', name: 'web-load-balancer', status: 'active', region: 'us-east-1', dependencies: ['ec2-web-001', 'ec2-web-002'] },
  { workloadId: 's3-assets-001', type: 'storage', name: 'assets-bucket', status: 'active', region: 'us-east-1', dependencies: [] },
  { workloadId: 'lambda-api-001', type: 'serverless', name: 'api-handler', status: 'active', region: 'us-east-1', dependencies: ['rds-main-001', 's3-assets-001'] },
  { workloadId: 'dynamodb-sessions-001', type: 'database', name: 'sessions-table', status: 'active', region: 'us-east-1', dependencies: [] },
  { workloadId: 'ecs-workers-001', type: 'container', name: 'worker-cluster', status: 'active', region: 'us-east-1', dependencies: ['rds-main-001', 'sqs-orders-001'] },
];

const typeColors: Record<string, string> = {
  compute: 'text-cyan-400 bg-cyan-500/10',
  database: 'text-violet-400 bg-violet-500/10',
  storage: 'text-amber-400 bg-amber-500/10',
  network: 'text-blue-400 bg-blue-500/10',
  serverless: 'text-emerald-400 bg-emerald-500/10',
  container: 'text-rose-400 bg-rose-500/10',
  application: 'text-zinc-400 bg-zinc-500/10',
};

export default function DiscoveryDetailPage() {
  const params = useParams();
  const discoveryId = params.id as string;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400 font-mono">{discoveryId}</p>
          <h1 className="text-2xl font-bold">Discovery Results</h1>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/discoveries/${discoveryId}/dependencies`}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-sm hover:bg-zinc-800 transition"
          >
            View Dependencies
          </Link>
          <button className="px-4 py-2 bg-primary rounded-lg text-sm font-medium hover:bg-primary/80 transition">
            Run Assessment
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900">
          <p className="text-sm text-zinc-400">Total Workloads</p>
          <p className="text-2xl font-bold">{mockWorkloads.length}</p>
        </div>
        <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900">
          <p className="text-sm text-zinc-400">Compute</p>
          <p className="text-2xl font-bold">{mockWorkloads.filter(w => w.type === 'compute').length}</p>
        </div>
        <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900">
          <p className="text-sm text-zinc-400">Databases</p>
          <p className="text-2xl font-bold">{mockWorkloads.filter(w => w.type === 'database').length}</p>
        </div>
        <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900">
          <p className="text-sm text-zinc-400">Dependencies</p>
          <p className="text-2xl font-bold">{mockWorkloads.reduce((sum, w) => sum + w.dependencies.length, 0)}</p>
        </div>
      </div>

      {/* Workloads table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Workload ID</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Region</th>
              <th className="text-left px-4 py-3 font-medium">Deps</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {mockWorkloads.map((w) => (
              <tr key={w.workloadId} className="hover:bg-zinc-900/50 transition">
                <td className="px-4 py-3 font-mono text-xs">{w.workloadId}</td>
                <td className="px-4 py-3">{w.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${typeColors[w.type]}`}>
                    {w.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{w.status}</td>
                <td className="px-4 py-3 text-zinc-400">{w.region}</td>
                <td className="px-4 py-3">{w.dependencies.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
