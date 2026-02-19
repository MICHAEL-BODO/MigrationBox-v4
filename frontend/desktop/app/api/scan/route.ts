/**
 * MIKE-FIRST v6.0 — Network Scan API
 * POST /api/scan        → Start network scan
 * GET  /api/scan        → Get last scan results
 * GET  /api/scan/info   → Get local network info
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPlatform } from '../../../../../packages/core/src/platform';

export async function GET(req: NextRequest) {
  try {
    const platform = getPlatform();
    const state = platform.getState();

    if (state.scanInProgress) {
      return NextResponse.json({ status: 'scanning', message: 'Scan in progress...' });
    }

    const lastScan = platform.getLastScan();
    if (!lastScan) {
      return NextResponse.json({
        status: 'idle',
        message: 'No scan data. POST to /api/scan to start.',
        networkInfo: platform.getNetworkInfo(),
      });
    }

    // Summary stats
    const hosts = lastScan.hosts;
    const totalPorts = hosts.reduce((sum, h) => sum + h.openPorts.length, 0);
    const totalVulns = hosts.reduce((sum, h) => sum + h.vulnerabilities.length, 0);
    const criticalVulns = hosts.reduce((sum, h) =>
      sum + h.vulnerabilities.filter(v => v.severity === 'critical').length, 0);

    return NextResponse.json({
      status: 'complete',
      timestamp: lastScan.timestamp,
      duration: lastScan.duration,
      summary: {
        hostsDiscovered: hosts.length,
        totalOpenPorts: totalPorts,
        totalServices: hosts.reduce((sum, h) => sum + h.services.length, 0),
        totalFindings: totalVulns,
        criticalFindings: criticalVulns,
        highFindings: hosts.reduce((sum, h) =>
          sum + h.vulnerabilities.filter(v => v.severity === 'high').length, 0),
      },
      hosts: hosts.map(h => ({
        ip: h.ip,
        mac: h.mac,
        hostname: h.hostname,
        vendor: h.vendor,
        os: h.os,
        openPorts: h.openPorts.filter(p => p.state === 'open').map(p => ({
          port: p.port,
          service: p.service,
          version: p.version,
        })),
        services: h.services,
        vulnerabilities: h.vulnerabilities.length,
        criticalVulns: h.vulnerabilities.filter(v => v.severity === 'critical').length,
        responseTimeMs: h.responseTimeMs,
      })),
      networkInfo: platform.getNetworkInfo(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const platform = getPlatform();
    const state = platform.getState();

    if (state.scanInProgress) {
      return NextResponse.json({ error: 'Scan already in progress' }, { status: 409 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch { /* empty body is fine */ }

    const config = {
      cidr: body.cidr || process.env.ONPREM_CIDR || undefined,
      ports: body.ports,
      timeout: body.timeout,
      concurrency: body.concurrency,
      includeServiceDetection: body.includeServiceDetection ?? true,
      includeVulnScan: body.includeVulnScan ?? true,
    };

    platform.initialize(config);

    // Start scan (async — returns immediately with scan ID)
    const scanPromise = platform.startNetworkScan(config);

    // If wait=true in body, wait for completion
    if (body.wait) {
      const hosts = await scanPromise;
      return NextResponse.json({
        status: 'complete',
        hostsFound: hosts.length,
        message: `Scan complete. Found ${hosts.length} hosts.`,
      });
    }

    // Otherwise return immediately
    scanPromise.catch(err => console.error('Scan error:', err));

    return NextResponse.json({
      status: 'started',
      message: 'Network scan started. GET /api/scan to check results.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
