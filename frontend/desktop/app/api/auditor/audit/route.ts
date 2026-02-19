/**
 * MIKE-FIRST v6.0 — Auditor API
 * POST /api/auditor/audit     → Run compliance audit
 * GET  /api/auditor/audit     → Get last audit results
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPlatform } from '../../../../../../packages/core/src/platform';

export async function GET() {
  try {
    const platform = getPlatform();
    const lastAudit = platform.getLastAudit();

    if (!lastAudit) {
      return NextResponse.json({
        status: 'idle',
        message: 'No audit data. POST to /api/auditor/audit to start.',
      });
    }

    return NextResponse.json({
      status: 'complete',
      audit: {
        id: lastAudit.id,
        timestamp: lastAudit.timestamp,
        duration: lastAudit.duration,
        overallScore: lastAudit.overallScore,
        grade: lastAudit.grade,
        totalFindings: lastAudit.totalFindings.length,
        estimatedFinesAvoided: lastAudit.estimatedFinesAvoided,
        frameworks: lastAudit.frameworks.map(fw => ({
          framework: fw.framework,
          score: fw.score,
          totalControls: fw.totalControls,
          passingControls: fw.passingControls,
          failingControls: fw.failingControls,
          warnings: fw.warnings,
          findings: fw.findings.length,
        })),
        findingsBySeverity: {
          critical: lastAudit.totalFindings.filter(f => f.severity === 'critical').length,
          high: lastAudit.totalFindings.filter(f => f.severity === 'high').length,
          medium: lastAudit.totalFindings.filter(f => f.severity === 'medium').length,
          low: lastAudit.totalFindings.filter(f => f.severity === 'low').length,
          info: lastAudit.totalFindings.filter(f => f.severity === 'info').length,
        },
        findings: lastAudit.totalFindings,
        remediationPlan: lastAudit.remediationPlan.slice(0, 20),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const platform = getPlatform();
    
    if (!platform.getLastScan()) {
      return NextResponse.json(
        { error: 'No scan data. Run a network scan first (POST /api/scan).' },
        { status: 400 }
      );
    }

    let body: any = {};
    try { body = await req.json(); } catch {}

    const frameworks = body.frameworks || undefined;

    const result = await platform.runAudit(frameworks);

    return NextResponse.json({
      status: 'complete',
      audit: {
        id: result.id,
        timestamp: result.timestamp,
        duration: result.duration,
        overallScore: result.overallScore,
        grade: result.grade,
        totalFindings: result.totalFindings.length,
        estimatedFinesAvoided: result.estimatedFinesAvoided,
        frameworks: result.frameworks.map(fw => ({
          framework: fw.framework,
          score: fw.score,
          totalControls: fw.totalControls,
          passingControls: fw.passingControls,
          failingControls: fw.failingControls,
          warnings: fw.warnings,
        })),
        findingsBySeverity: {
          critical: result.totalFindings.filter(f => f.severity === 'critical').length,
          high: result.totalFindings.filter(f => f.severity === 'high').length,
          medium: result.totalFindings.filter(f => f.severity === 'medium').length,
          low: result.totalFindings.filter(f => f.severity === 'low').length,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
