'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const awsRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1'];
const azureRegions = ['eastus', 'westus2', 'westeurope', 'northeurope', 'southeastasia'];
const gcpRegions = ['us-central1', 'us-east1', 'europe-west1', 'europe-west3', 'asia-southeast1'];

export default function NewDiscoveryPage() {
  const router = useRouter();
  const [provider, setProvider] = useState('aws');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['us-east-1']);
  const [scope, setScope] = useState('full');
  const [submitting, setSubmitting] = useState(false);

  const regions = provider === 'aws' ? awsRegions : provider === 'azure' ? azureRegions : gcpRegions;

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // API call will be wired in when backend is running
    setTimeout(() => {
      router.push('/discoveries');
    }, 1000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">New Discovery</h1>
      <p className="text-zinc-400">Configure a workload discovery scan across your cloud environment.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cloud Provider */}
        <div>
          <label className="block text-sm font-medium mb-3">Cloud Provider</label>
          <div className="grid grid-cols-3 gap-3">
            {['aws', 'azure', 'gcp'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { setProvider(p); setSelectedRegions([]); }}
                className={`p-4 rounded-lg border text-center transition ${
                  provider === p
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                <span className="text-lg font-bold">{p.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Regions */}
        <div>
          <label className="block text-sm font-medium mb-3">Regions</label>
          <div className="flex flex-wrap gap-2">
            {regions.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => toggleRegion(region)}
                className={`px-3 py-1.5 rounded text-xs border transition ${
                  selectedRegions.includes(region)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Scope */}
        <div>
          <label className="block text-sm font-medium mb-3">Scan Scope</label>
          <div className="flex gap-3">
            {['full', 'partial'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`px-4 py-2 rounded-lg border text-sm capitalize transition ${
                  scope === s
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || selectedRegions.length === 0}
          className="w-full py-3 bg-primary rounded-lg font-medium hover:bg-primary/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Starting Discovery...' : 'Start Discovery Scan'}
        </button>
      </form>
    </div>
  );
}
