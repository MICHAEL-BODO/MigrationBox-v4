/**
 * MIKE-FIRST v6.0 — Security Center API
 * GET /api/analyzer/security   → Get security findings & attack surface
 */

import { NextResponse } from 'next/server';
import { getPlatform } from '../../../../../../packages/core/src/platform';

export async function GET() {
  try {
    const platform = getPlatform();
    const analysis = platform.getLastAnalysis();

    if (!analysis) {
      return NextResponse.json({
        status: 'idle',
        message: 'No analysis data. Run analysis first (POST /api/analyzer/analyze).',
      });
    }

    return NextResponse.json({
      status: 'ok',
      securityGrade: analysis.securityGrade,
      summary: {
        totalFindings: analysis.findings.length,
        critical: analysis.findings.filter(f => f.severity === 'critical').length,
        high: analysis.findings.filter(f => f.severity === 'high').length,
        medium: analysis.findings.filter(f => f.severity === 'medium').length,
        low: analysis.findings.filter(f => f.severity === 'low').length,
      },
      attackSurface: analysis.attackSurface,
      findings: analysis.findings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
