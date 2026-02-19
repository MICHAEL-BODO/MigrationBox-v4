/**
 * MIKE-FIRST v6.0 — Discovery API (Migrator)
 * GET /api/migrator/discover   → Get discovered resources
 */

import { NextResponse } from 'next/server';
import { getPlatform } from '../../../../../../packages/core/src/platform';

export async function GET() {
  try {
    const platform = getPlatform();
    const lastScan = platform.getLastScan();

    if (!lastScan) {
      return NextResponse.json({
        status: 'idle',
        message: 'No scan data. Run a network scan first (POST /api/scan).',
        networkInfo: platform.getNetworkInfo(),
      });
    }

    const hosts = lastScan.hosts;

    // Categorize resources for migration
    const categories = {
      vms: hosts.filter(h => !h.services.some(s => ['MySQL', 'PostgreSQL', 'MSSQL', 'MongoDB', 'Redis'].includes(s.name))),
      databases: hosts.filter(h => h.services.some(s => ['MySQL', 'PostgreSQL', 'MSSQL', 'MongoDB', 'Redis'].includes(s.name))),
      iot: hosts.filter(h => h.vendor?.includes('IoT') || h.vendor?.includes('ESP') || h.vendor?.includes('Tapo')),
      networking: hosts.filter(h => h.services.some(s => s.name === 'DNS')),
    };

    return NextResponse.json({
      status: 'ok',
      timestamp: lastScan.timestamp,
      totalHosts: hosts.length,
      categories: {
        vms: categories.vms.length,
        databases: categories.databases.length,
        iot: categories.iot.length,
        networking: categories.networking.length,
      },
      resources: hosts.map(h => ({
        ip: h.ip,
        mac: h.mac,
        hostname: h.hostname,
        vendor: h.vendor,
        os: h.os,
        type: h.services.some(s => ['MySQL', 'PostgreSQL', 'MSSQL', 'MongoDB', 'Redis'].includes(s.name))
          ? 'database'
          : h.vendor?.includes('IoT') || h.vendor?.includes('ESP')
          ? 'iot'
          : 'vm',
        services: h.services.map(s => s.name),
        openPorts: h.openPorts.filter(p => p.state === 'open').map(p => p.port),
        migrationEligible: h.services.length > 0,
        migrationComplexity: h.services.length > 3 ? 'high' : h.services.length > 1 ? 'medium' : 'low',
        responseTimeMs: h.responseTimeMs,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
