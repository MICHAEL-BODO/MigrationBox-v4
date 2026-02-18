import { NextRequest, NextResponse } from 'next/server';

/**
 * MIKE-FIRST v6.0 — Unified API Gateway
 * 
 * All 3 pillars served from the same Next.js process.
 * No separate localhost ports — everything on :3000
 * 
 * Routes:
 *   GET  /api/status         → platform health
 *   GET  /api/auditor/score  → compliance score
 *   GET  /api/analyzer/cost  → cost analysis
 *   GET  /api/migrator/progress → migration status
 *   POST /api/gemini/command → iPhone voice commands
 */

const MODE = process.env.MIKE_FIRST_MODE || 'demo';

// Demo data for the Friday presentation
const DEMO_DATA = {
  platform: {
    version: '5.5.0-alpha',
    mode: MODE,
    uptime: 847392,
    pillars: {
      auditor: { status: 'operational', functions: 42 },
      analyzer: { status: 'operational', functions: 39 },
      migrator: { status: 'operational', functions: 39 },
    },
    clouds: {
      aws: { connected: true, resources: 1247 },
      azure: { connected: true, resources: 943 },
      gcp: { connected: true, resources: 657 },
      onprem: { connected: false, scanning: true, resources: 0 },
    },
    agents: {
      total: 104,
      active: 6,
      tools: 50000,
      mcps: 300,
    },
    iphone: {
      connected: true,
      device: 'iPhone 16 Pro Max',
      app: 'Gemini',
      lastHeartbeat: new Date().toISOString(),
    },
  },
  auditor: {
    complianceScore: 94,
    frameworks: [
      { name: 'ISO 27001', score: 96, controls: { passing: 412, total: 430 } },
      { name: 'SOX', score: 91, controls: { passing: 178, total: 196 } },
      { name: 'GDPR', score: 97, controls: { passing: 89, total: 92 } },
      { name: 'HIPAA', score: 88, controls: { passing: 68, total: 77 } },
      { name: 'SOC 2', score: 94, controls: { passing: 56, total: 60 } },
      { name: 'PCI DSS', score: 93, controls: { passing: 44, total: 47 } },
    ],
    guardian: {
      active: true,
      blocked: 7,
      finesAvoided: 142000000,
      lastAction: { type: 'BLOCK_EMAIL', violation: 'PII leak to external domain', timestamp: new Date().toISOString() },
    },
  },
  analyzer: {
    totalResources: 2847,
    costOverrunAnnual: 1200000,
    savingsGuarantee: 0.34,
    securityPosture: 'A+',
    criticalVulnerabilities: 0,
    optimizations: [
      { type: 'right-size', count: 47, savings: 340000, desc: '47 VMs oversized by avg 3.2x' },
      { type: 'ri-purchase', count: 12, savings: 280000, desc: 'Reserved instance opportunities' },
      { type: 'waste', count: 23, savings: 190000, desc: 'Orphaned resources (disks, IPs, LBs)' },
      { type: 'storage', count: 8, savings: 110000, desc: 'Storage tier optimization' },
      { type: 'schedule', count: 31, savings: 280000, desc: 'Dev/test shutdown scheduling' },
    ],
  },
  migrator: {
    activeMigrations: 3,
    resourcesMoved: 147,
    uptimeSeconds: 847392,
    waves: [
      { id: 1, name: 'Web Tier', status: 'completed', progress: 100, resources: 47 },
      { id: 2, name: 'App Tier', status: 'in-progress', progress: 67, resources: 58 },
      { id: 3, name: 'Data Tier', status: 'queued', progress: 0, resources: 42 },
    ],
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section') || 'platform';

  if (section in DEMO_DATA) {
    return NextResponse.json({
      ok: true,
      mode: MODE,
      data: DEMO_DATA[section as keyof typeof DEMO_DATA],
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    ok: true,
    mode: MODE,
    data: DEMO_DATA.platform,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // iPhone Gemini voice command handler
  if (body.source === 'gemini-iphone') {
    const command = body.command?.toLowerCase() || '';
    
    if (command.includes('audit') || command.includes('compliance')) {
      return NextResponse.json({
        ok: true,
        response: `Compliance audit initiated. Current score: ${DEMO_DATA.auditor.complianceScore}%. Running full ISO27001+SOX+GDPR scan — estimated 30 minutes.`,
        action: 'audit_started',
        data: DEMO_DATA.auditor,
      });
    }
    
    if (command.includes('cost') || command.includes('savings') || command.includes('money')) {
      return NextResponse.json({
        ok: true,
        response: `Cost analysis: $${(DEMO_DATA.analyzer.costOverrunAnnual / 1000000).toFixed(1)}M annual overrun detected. Guaranteed savings of ${(DEMO_DATA.analyzer.savingsGuarantee * 100).toFixed(0)}%. Top opportunity: ${DEMO_DATA.analyzer.optimizations[0].desc}.`,
        action: 'cost_report',
        data: DEMO_DATA.analyzer,
      });
    }
    
    if (command.includes('migrate') || command.includes('migration') || command.includes('progress')) {
      return NextResponse.json({
        ok: true,
        response: `Migration status: ${DEMO_DATA.migrator.activeMigrations} active waves. Wave 2 "App Tier" at 67% — zero downtime maintained for ${Math.floor(DEMO_DATA.migrator.uptimeSeconds / 3600)} hours.`,
        action: 'migration_status',
        data: DEMO_DATA.migrator,
      });
    }

    if (command.includes('security') || command.includes('attack') || command.includes('threat')) {
      return NextResponse.json({
        ok: true,
        response: `Security posture: ${DEMO_DATA.analyzer.securityPosture}. ${DEMO_DATA.analyzer.criticalVulnerabilities} critical vulnerabilities. Guardian Agent has blocked ${DEMO_DATA.auditor.guardian.blocked} regulatory violations today, avoiding $${(DEMO_DATA.auditor.guardian.finesAvoided / 1000000).toFixed(0)}M in fines.`,
        action: 'security_report',
        data: { analyzer: DEMO_DATA.analyzer, guardian: DEMO_DATA.auditor.guardian },
      });
    }
    
    return NextResponse.json({
      ok: true,
      response: 'MIKE-FIRST v6.0 ready. Try: "run audit", "show cost savings", "migration progress", or "security status".',
      action: 'help',
    });
  }

  return NextResponse.json({ ok: true, message: 'MIKE-FIRST API v6.0' });
}
