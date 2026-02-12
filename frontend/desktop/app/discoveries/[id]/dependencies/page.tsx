'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

// Mock dependency data - will be replaced with Neo4j API call
const mockDependencies = {
  nodes: [
    { id: 'elb-web-001', name: 'web-load-balancer', type: 'network' },
    { id: 'ec2-web-001', name: 'web-server-prod', type: 'compute' },
    { id: 'ec2-web-002', name: 'web-server-prod-2', type: 'compute' },
    { id: 'rds-main-001', name: 'main-database', type: 'database' },
    { id: 'lambda-api-001', name: 'api-handler', type: 'serverless' },
    { id: 's3-assets-001', name: 'assets-bucket', type: 'storage' },
    { id: 'dynamodb-sessions-001', name: 'sessions-table', type: 'database' },
    { id: 'ecs-workers-001', name: 'worker-cluster', type: 'container' },
    { id: 'sqs-orders-001', name: 'order-queue', type: 'application' },
  ],
  edges: [
    { source: 'elb-web-001', target: 'ec2-web-001' },
    { source: 'elb-web-001', target: 'ec2-web-002' },
    { source: 'ec2-web-001', target: 'rds-main-001' },
    { source: 'ec2-web-002', target: 'rds-main-001' },
    { source: 'lambda-api-001', target: 'rds-main-001' },
    { source: 'lambda-api-001', target: 's3-assets-001' },
    { source: 'lambda-api-001', target: 'dynamodb-sessions-001' },
    { source: 'ecs-workers-001', target: 'rds-main-001' },
    { source: 'ecs-workers-001', target: 'sqs-orders-001' },
  ],
};

const typeColors: Record<string, string> = {
  compute: '#06B6D4',
  database: '#8B5CF6',
  storage: '#F59E0B',
  network: '#3B82F6',
  serverless: '#10B981',
  container: '#F43F5E',
  application: '#A1A1AA',
};

export default function DependencyGraphPage() {
  const params = useParams();
  const discoveryId = params.id as string;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/discoveries/${discoveryId}`} className="text-sm text-zinc-400 hover:text-zinc-200">
            &larr; Back to Discovery
          </Link>
          <h1 className="text-2xl font-bold">Dependency Graph</h1>
        </div>
        <div className="flex gap-3">
          <select className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm">
            <option value="3">Depth: 3</option>
            <option value="5">Depth: 5</option>
            <option value="10">Depth: 10</option>
          </select>
          <button className="px-4 py-2 rounded-lg border border-zinc-700 text-sm hover:bg-zinc-800">
            Detect Circular
          </button>
          <button className="px-4 py-2 rounded-lg border border-zinc-700 text-sm hover:bg-zinc-800">
            Migration Readiness
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Graph placeholder - D3/react-force-graph will render here */}
      <div className="border border-zinc-800 rounded-lg bg-zinc-900 h-[500px] flex items-center justify-center">
        <div className="text-center text-zinc-500">
          <p className="text-lg font-medium mb-2">Dependency Graph Visualization</p>
          <p className="text-sm">D3.js / react-force-graph will render here</p>
          <p className="text-xs mt-4">
            {mockDependencies.nodes.length} nodes, {mockDependencies.edges.length} edges
          </p>
        </div>
      </div>

      {/* Dependency list */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Dependency Edges</h2>
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium">&rarr;</th>
                <th className="text-left px-4 py-3 font-medium">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {mockDependencies.edges.map((edge, i) => {
                const sourceNode = mockDependencies.nodes.find(n => n.id === edge.source);
                const targetNode = mockDependencies.nodes.find(n => n.id === edge.target);
                return (
                  <tr key={i} className="hover:bg-zinc-900/50">
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColors[sourceNode?.type || ''] }} />
                        <span className="font-mono text-xs">{sourceNode?.name || edge.source}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-500">&rarr;</td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColors[targetNode?.type || ''] }} />
                        <span className="font-mono text-xs">{targetNode?.name || edge.target}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
